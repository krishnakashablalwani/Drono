import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DepthEstimationEngine,
  getDepthEngine,
  resetDepthEngine,
} from "../lib/depthEstimation";

// Mock TensorFlow.js since it requires a browser environment
vi.mock("@tensorflow/tfjs", () => ({
  ready: vi.fn().mockResolvedValue(undefined),
  getBackend: vi.fn().mockReturnValue("cpu"),
  setBackend: vi.fn().mockResolvedValue(undefined),
  tidy: vi.fn((fn: () => any) => fn()),
}));

describe("DepthEstimationEngine", () => {
  beforeEach(() => {
    resetDepthEngine();
  });

  describe("constructor & initialization", () => {
    it("creates engine with default options", () => {
      const engine = new DepthEstimationEngine();
      expect(engine.getMaxElevationM()).toBe(8.5);
    });

    it("creates engine with custom options", () => {
      const engine = new DepthEstimationEngine({
        resolution: 64,
        maxElevationM: 50,
      });
      expect(engine.getMaxElevationM()).toBe(50);
    });

    it("setMaxElevationM clamps to valid range", () => {
      const engine = new DepthEstimationEngine();
      engine.setMaxElevationM(0);
      expect(engine.getMaxElevationM()).toBe(1);
      engine.setMaxElevationM(200);
      expect(engine.getMaxElevationM()).toBe(100);
      engine.setMaxElevationM(30);
      expect(engine.getMaxElevationM()).toBe(30);
    });
  });

  describe("sampleElevation", () => {
    it("samples elevation from a depth map at UV coordinates", () => {
      const engine = new DepthEstimationEngine({ maxElevationM: 20 });
      const depthMap = {
        data: new Float32Array([0.0, 0.5, 1.0, 0.25]),
        width: 2,
        height: 2,
      };

      // u=0, v=0 → top-left → depth 0.0 → elevation = (1-0)*20 = 20
      expect(engine.sampleElevation(depthMap, 0, 0)).toBeCloseTo(20, 1);

      // u=1, v=0 → top-right → depth 0.5 → elevation = (1-0.5)*20 = 10
      expect(engine.sampleElevation(depthMap, 0.99, 0)).toBeCloseTo(10, 1);

      // u=0, v=1 → bottom-left → depth 1.0 → elevation = (1-1)*20 = 0
      expect(engine.sampleElevation(depthMap, 0, 0.99)).toBeCloseTo(0, 1);

      // u=1, v=1 → bottom-right → depth 0.25 → elevation = (1-0.25)*20 = 15
      expect(engine.sampleElevation(depthMap, 0.99, 0.99)).toBeCloseTo(15, 1);
    });

    it("clamps UV coordinates to valid range", () => {
      const engine = new DepthEstimationEngine({ maxElevationM: 10 });
      const depthMap = {
        data: new Float32Array([0.5]),
        width: 1,
        height: 1,
      };

      // Negative coords should clamp to 0
      expect(engine.sampleElevation(depthMap, -1, -1)).toBeCloseTo(5, 1);
      // Overshoot coords should clamp to max
      expect(engine.sampleElevation(depthMap, 2, 2)).toBeCloseTo(5, 1);
    });
  });

  describe("singleton factory", () => {
    it("returns the same instance on repeated calls", () => {
      const engine1 = getDepthEngine();
      const engine2 = getDepthEngine();
      expect(engine1).toBe(engine2);
    });

    it("returns a new instance after reset", () => {
      const engine1 = getDepthEngine();
      resetDepthEngine();
      const engine2 = getDepthEngine();
      expect(engine1).not.toBe(engine2);
    });
  });

  describe("depth cue computation (internal methods via estimateDepth)", () => {
    it("estimateDepth returns a valid depth map from a canvas", async () => {
      // Create a simple mock canvas with a gradient pattern
      const mockCanvas = {
        width: 16,
        height: 16,
      } as HTMLCanvasElement;

      const mockImageData = {
        data: new Uint8ClampedArray(16 * 16 * 4),
      };

      // Create a vertical gradient (bright top, dark bottom)
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = (y * 16 + x) * 4;
          const val = Math.floor((1 - y / 15) * 255);
          mockImageData.data[idx] = val;
          mockImageData.data[idx + 1] = val;
          mockImageData.data[idx + 2] = val;
          mockImageData.data[idx + 3] = 255;
        }
      }

      const mockCtx = {
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue(mockImageData),
      };

      // Mock document.createElement for the resize canvas
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "canvas") {
          const c = origCreateElement("canvas");
          vi.spyOn(c, "getContext").mockReturnValue(mockCtx as any);
          return c;
        }
        return origCreateElement(tag);
      });

      const engine = new DepthEstimationEngine({ resolution: 16 });
      await engine.initialize();
      const depthMap = await engine.estimateDepth(mockCanvas);

      expect(depthMap.width).toBe(16);
      expect(depthMap.height).toBe(16);
      expect(depthMap.data.length).toBe(16 * 16);

      // All depth values should be normalized to [0, 1]
      for (let i = 0; i < depthMap.data.length; i++) {
        expect(depthMap.data[i]).toBeGreaterThanOrEqual(0);
        expect(depthMap.data[i]).toBeLessThanOrEqual(1);
      }

      // Restore
      vi.restoreAllMocks();
    });
  });
});
