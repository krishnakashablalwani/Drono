import * as tf from '@tensorflow/tfjs';
import * as depthEstimation from '@tensorflow-models/depth-estimation';

export interface DepthMap {
  data: Float32Array | Int32Array | Uint8Array;
  width: number;
  height: number;
}

export interface DepthEstimationOptions {
  resolution?: number;
  maxElevationM?: number;
  minFramesForComposite?: number;
}

export class DepthEstimationEngine {
  private isInitialized = false;
  private maxElevationM: number;
  private estimator: any = null;

  constructor(options: DepthEstimationOptions = {}) {
    this.maxElevationM = options.maxElevationM ?? 8.5;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await tf.ready();
      if (tf.getBackend() !== 'webgl') {
        try {
          await tf.setBackend('webgl');
        } catch {
          await tf.setBackend('cpu');
        }
      }
      const model = depthEstimation.SupportedModels.ARPortraitDepth;
      this.estimator = await depthEstimation.createEstimator(model);
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize TF.js Depth Estimation Engine:', e);
      this.isInitialized = true; // Mark initialized to prevent infinite retries
    }
  }

  async estimateDepth(canvas: HTMLCanvasElement): Promise<DepthMap> {
    if (!this.isInitialized) await this.initialize();
    
    if (!this.estimator) {
      return { data: new Float32Array(0), width: 0, height: 0 };
    }

    try {
      // Create estimation config with required min/max depth for ARPortraitDepth
      const estimationConfig = { minDepth: 0, maxDepth: 1 };
      
      const depthMaps = await this.estimator.estimateDepth(canvas, estimationConfig);
      const depthMap = Array.isArray(depthMaps) ? depthMaps[0] : depthMaps;
      
      const depthTensor = depthMap.toTensor();
      const [height, width] = depthTensor.shape;
      
      const rawData = await depthTensor.data();
      depthTensor.dispose();

      // Normalize strictly to [0..1]
      let minVal = Infinity, maxVal = -Infinity;
      for (let i = 0; i < rawData.length; i++) {
        if (rawData[i] < minVal) minVal = rawData[i];
        if (rawData[i] > maxVal) maxVal = rawData[i];
      }
      
      const range = maxVal - minVal || 1;
      const normalized = new Float32Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        normalized[i] = (rawData[i] - minVal) / range;
      }

      return {
        data: normalized,
        width,
        height,
      };
    } catch (e) {
      console.error('Depth estimation failed:', e);
      return { data: new Float32Array(0), width: 0, height: 0 };
    }
  }

  async compositeDepthFromKeyframes(
    canvases: HTMLCanvasElement[],
    weights?: number[]
  ): Promise<DepthMap> {
    if (canvases.length === 0) {
      throw new Error('At least one keyframe canvas required for depth estimation');
    }

    const depthMaps: DepthMap[] = [];
    for (const canvas of canvases) {
      const dm = await this.estimateDepth(canvas);
      if (dm.data.length > 0) {
        depthMaps.push(dm);
      }
    }

    if (depthMaps.length === 0) {
      return { data: new Float32Array(0), width: 0, height: 0 };
    }
    if (depthMaps.length === 1) return depthMaps[0];

    const width = depthMaps[0].width;
    const height = depthMaps[0].height;
    
    const effectiveWeights = weights || depthMaps.map(() => 1.0 / depthMaps.length);
    const totalWeight = effectiveWeights.reduce((a, b) => a + b, 0);
    const composite = new Float32Array(width * height);

    for (let dmIdx = 0; dmIdx < depthMaps.length; dmIdx++) {
      const w = effectiveWeights[dmIdx] / totalWeight;
      const data = depthMaps[dmIdx].data;
      if (data.length === composite.length) {
        for (let i = 0; i < composite.length; i++) {
          composite[i] += data[i] * w;
        }
      }
    }

    let minVal = Infinity, maxVal = -Infinity;
    for (let i = 0; i < composite.length; i++) {
      if (composite[i] < minVal) minVal = composite[i];
      if (composite[i] > maxVal) maxVal = composite[i];
    }
    const range = maxVal - minVal || 1;
    for (let i = 0; i < composite.length; i++) {
      composite[i] = (composite[i] - minVal) / range;
    }

    return {
      data: composite,
      width,
      height,
    };
  }

  sampleElevation(depthMap: DepthMap, u: number, v: number): number {
    const col = Math.min(depthMap.width - 1, Math.max(0, Math.floor(u * depthMap.width)));
    const row = Math.min(depthMap.height - 1, Math.max(0, Math.floor(v * depthMap.height)));
    const idx = row * depthMap.width + col;
    const depthValue = depthMap.data[idx] ?? 0;
    return (1.0 - depthValue) * this.maxElevationM;
  }

  getMaxElevationM(): number {
    return this.maxElevationM;
  }

  setMaxElevationM(m: number): void {
    this.maxElevationM = Math.max(1, Math.min(100, m));
  }
}

let _engineInstance: DepthEstimationEngine | null = null;

export function getDepthEngine(): DepthEstimationEngine {
  if (!_engineInstance) {
    _engineInstance = new DepthEstimationEngine();
  }
  return _engineInstance;
}

export function resetDepthEngine(): void {
  _engineInstance = null;
}