import { describe, it, expect } from "vitest";
import {
  computeLaplacianVariance,
  estimateTrajectoryFromFrames,
  reconstructTerrainFromKeyframes,
  resolveTerrainArchetype,
  exportToWavefrontOBJ,
  exportToStanfordPLY,
  findTacticalIngressPath,
  computeElevationProfile,
  VideoFrameData,
} from "../lib/videoProcessing";

describe("Video Processing & 3D Reconstruction Pipeline", () => {
  describe("computeLaplacianVariance", () => {
    it("returns 0 or near 0 for completely uniform / flat image", () => {
      // 10x10 gray image (all pixels = 128)
      const pixels = new Uint8ClampedArray(10 * 10 * 4);
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 128;     // R
        pixels[i + 1] = 128; // G
        pixels[i + 2] = 128; // B
        pixels[i + 3] = 255; // A
      }
      const variance = computeLaplacianVariance(pixels, 10, 10, 1);
      expect(variance).toBe(0);
    });

    it("detects high variance on high-contrast sharp checkerboard edges", () => {
      const w = 12, h = 12;
      const pixels = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const val = (x + y) % 2 === 0 ? 255 : 0;
          pixels[idx] = val;
          pixels[idx + 1] = val;
          pixels[idx + 2] = val;
          pixels[idx + 3] = 255;
        }
      }
      const variance = computeLaplacianVariance(pixels, w, h, 1);
      expect(variance).toBeGreaterThan(100);
    });
  });

  describe("estimateTrajectoryFromFrames", () => {
    it("generates 6-DOF trajectory poses matching frame count", () => {
      const mockFrames: VideoFrameData[] = [
        {
          frameIndex: 1,
          timestampSec: 0.0,
          thumbnailUrl: "",
          variance: 160,
          isSharp: true,
          isKeyframe: true,
          width: 320,
          height: 180,
        },
        {
          frameIndex: 2,
          timestampSec: 1.0,
          thumbnailUrl: "",
          variance: 180,
          isSharp: true,
          isKeyframe: true,
          width: 320,
          height: 180,
        },
      ];

      const trajectory = estimateTrajectoryFromFrames(mockFrames, 45.0, 65.0);
      expect(trajectory).toHaveLength(2);
      expect(trajectory[0].position.y).toBeCloseTo(65.0, 0);
      expect(trajectory[0].gsdCm).toBeGreaterThan(0);
      expect(trajectory[1].position.x).toBeGreaterThan(trajectory[0].position.x);
    });
  });

  describe("reconstructTerrainFromKeyframes", () => {
    it("synthesizes valid vertices, indices, normals, and colors", () => {
      const terrain = reconstructTerrainFromKeyframes([], {
        gridSize: 100,
        resolution: 20,
        altitudeM: 65,
      });

      const expectedVertCount = 21 * 21; // (resolution + 1)^2
      expect(terrain.stats.vertexCount).toBe(expectedVertCount);
      expect(terrain.vertices.length).toBe(expectedVertCount * 3);
      expect(terrain.colors.length).toBe(expectedVertCount * 3);
      expect(terrain.normals.length).toBe(expectedVertCount * 3);
      expect(terrain.indices.length).toBe(20 * 20 * 6); // 2 triangles per quad cell
      expect(terrain.structures.length).toBeGreaterThan(0);
    });

    it("resolves terrain archetypes accurately from UAV video filenames", () => {
      expect(resolveTerrainArchetype(undefined, "DJI_0122_ridge_sweep.mp4")).toBe("ALPINE_RIDGE");
      expect(resolveTerrainArchetype(undefined, "DJI_0317_corridor.mp4")).toBe("CORRIDOR_FACILITY");
      expect(resolveTerrainArchetype(undefined, "DJI_0346_valley_survey.mp4")).toBe("CANYON_VALLEY");
      expect(resolveTerrainArchetype(undefined, "DJI_0087_low_altitude.mp4")).toBe("LOW_ALTITUDE_SWEEP");
      expect(resolveTerrainArchetype(undefined, "DJI_0051_aerial.mp4")).toBe("HIGH_TERRAIN_SCAN");
    });

    it("synthesizes distinctly different 3D digital twins for each video corridor", () => {
      const ridgeModel = reconstructTerrainFromKeyframes([], {
        videoFileName: "DJI_0122_ridge_sweep.mp4",
        gridSize: 100,
        resolution: 20,
      });

      const corridorModel = reconstructTerrainFromKeyframes([], {
        videoFileName: "DJI_0317_corridor.mp4",
        gridSize: 100,
        resolution: 20,
      });

      const valleyModel = reconstructTerrainFromKeyframes([], {
        videoFileName: "DJI_0346_valley_survey.mp4",
        gridSize: 100,
        resolution: 20,
      });

      // 1. Archetypes are distinct
      expect(ridgeModel.archetype).toBe("ALPINE_RIDGE");
      expect(corridorModel.archetype).toBe("CORRIDOR_FACILITY");
      expect(valleyModel.archetype).toBe("CANYON_VALLEY");

      // 2. Vertex heights differ significantly
      expect(ridgeModel.bounds.maxY).toBeGreaterThan(20); // High mountain crest
      expect(corridorModel.bounds.maxY).toBeLessThan(10); // Low airstrip corridor
      expect(valleyModel.bounds.minY).toBeLessThan(-4); // Deep sunken river canyon

      // 3. Vertices are not identical
      const areVerticesIdentical = ridgeModel.vertices.every(
        (v, i) => Math.abs(v - corridorModel.vertices[i]) < 0.001
      );
      expect(areVerticesIdentical).toBe(false);

      // 4. Structures are customized per archetype
      expect(ridgeModel.structures[0].label).toContain("Relay Mast");
      expect(corridorModel.structures[0].label).toContain("Airfield ATC");
      expect(valleyModel.structures[0].label).toContain("Pontoon");

      // 5. Markers are customized per archetype
      expect(ridgeModel.markers?.[0].name).toContain("Pinnacle Relay Delta");
      expect(corridorModel.markers?.[0].name).toContain("ATC Operations Tower");
      expect(valleyModel.markers?.[0].name).toContain("Pontoon River Crossing");
    });

    it("performs direct photogrammetric reconstruction matching real video keyframe colors and relief", () => {
      const mockFrames: VideoFrameData[] = [
        {
          frameIndex: 1,
          timestampSec: 0.0,
          thumbnailUrl: "data:image/jpeg;base64,sample1",
          variance: 165,
          isSharp: true,
          isKeyframe: true,
          width: 320,
          height: 180,
          avgColor: { r: 0.25, g: 0.55, b: 0.35 },
          spatialColors: [
            [[0.2, 0.6, 0.3], [0.2, 0.6, 0.3]],
            [[0.2, 0.6, 0.3], [0.2, 0.6, 0.3]]
          ],
          spatialRelief: [
            [0.45, 0.2],
            [0.2, 0.5]
          ],
          orthomosaicUrl: "data:image/jpeg;base64,mosaic1",
        },
        {
          frameIndex: 2,
          timestampSec: 2.5,
          thumbnailUrl: "data:image/jpeg;base64,sample2",
          variance: 180,
          isSharp: true,
          isKeyframe: true,
          width: 320,
          height: 180,
          avgColor: { r: 0.30, g: 0.50, b: 0.40 },
          spatialColors: [
            [[0.3, 0.5, 0.4], [0.3, 0.5, 0.4]],
            [[0.3, 0.5, 0.4], [0.3, 0.5, 0.4]]
          ],
          spatialRelief: [
            [0.3, 0.6],
            [0.25, 0.2]
          ],
          orthomosaicUrl: "data:image/jpeg;base64,mosaic1",
        },
      ];

      const model = reconstructTerrainFromKeyframes(mockFrames, {
        gridSize: 80,
        resolution: 16,
      });

      expect(model.isDirectVideoReconstruction).toBe(true);
      expect(model.textureDataUrl).toBe("data:image/jpeg;base64,mosaic1");
      expect(model.uvs).toBeDefined();
      expect(model.uvs?.length).toBe((16 + 1) * (16 + 1) * 2);
      expect(model.colors.length).toBe((16 + 1) * (16 + 1) * 3);
      // Verify green channel dominant from real video frames
      expect(model.colors[1]).toBeGreaterThan(model.colors[0]);

      // Verify OBJ export has texture coordinates vt
      const obj = exportToWavefrontOBJ(model);
      expect(obj).toContain("vt ");
      expect(obj).toContain("f 1/1/1 ");
    });
  });

  describe("3D Exporters (.OBJ and .PLY)", () => {
    const sampleTerrain = reconstructTerrainFromKeyframes([], {
      gridSize: 50,
      resolution: 10,
    });

    it("exports valid Wavefront .OBJ format", () => {
      const obj = exportToWavefrontOBJ(sampleTerrain);
      expect(obj).toContain("# Drono Tactical 3D Reconnaissance Model");
      expect(obj).toContain("o Drono_Terrain");
      expect(obj).toContain("v ");
      expect(obj).toContain("vn ");
      expect(obj).toContain("f ");
    });

    it("exports valid Stanford .PLY format", () => {
      const ply = exportToStanfordPLY(sampleTerrain);
      expect(ply).toContain("ply");
      expect(ply).toContain("format ascii 1.0");
      expect(ply).toContain(`element vertex ${sampleTerrain.stats.vertexCount}`);
      expect(ply).toContain(`element face ${sampleTerrain.stats.triangleCount}`);
      expect(ply).toContain("end_header");
    });
  });

  describe("findTacticalIngressPath", () => {
    it("computes low-visibility route across terrain contours", () => {
      const terrain = reconstructTerrainFromKeyframes([], {
        gridSize: 100,
        resolution: 30,
      });

      const result = findTacticalIngressPath(
        terrain,
        { x: -30, z: -30 },
        { x: 30, z: 30 }
      );

      expect(result.path.length).toBeGreaterThan(2);
      expect(result.totalDistanceM).toBeGreaterThan(0);
      expect(result.exposureScore).toBeGreaterThanOrEqual(0);
      expect(result.exposureScore).toBeLessThanOrEqual(100);
    });
  });

  describe("computeElevationProfile (2D Elevation Cross-Section Slicer)", () => {
    it("samples continuous elevation points and computes accurate terrain slope/gain/loss", () => {
      const terrain = reconstructTerrainFromKeyframes([], {
        gridSize: 100,
        resolution: 30,
      });

      const profile = computeElevationProfile(
        terrain,
        { x: -30, z: -30 },
        { x: 30, z: 30 },
        50
      );

      expect(profile.points).toHaveLength(51);
      expect(profile.totalDistanceM).toBeGreaterThan(0);
      expect(profile.minElevationM).toBeLessThanOrEqual(profile.maxElevationM);
      expect(profile.elevationGainM).toBeGreaterThanOrEqual(0);
      expect(profile.elevationLossM).toBeGreaterThanOrEqual(0);
      expect(profile.maxSlopeDeg).toBeGreaterThanOrEqual(0);

      // Verify distance starts at 0 and ends at totalDistanceM
      expect(profile.points[0].distanceM).toBe(0);
      expect(profile.points[profile.points.length - 1].distanceM).toBeCloseTo(profile.totalDistanceM, 1);

      // Verify every point has valid 3D coordinates
      profile.points.forEach((pt) => {
        expect(Number.isFinite(pt.x)).toBe(true);
        expect(Number.isFinite(pt.elevationM)).toBe(true);
        expect(Number.isFinite(pt.z)).toBe(true);
        expect(Number.isFinite(pt.distanceM)).toBe(true);
      });
    });
  });
});
