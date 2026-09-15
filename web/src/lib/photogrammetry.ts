/**
 * Drono Photogrammetry & Geospatial Algorithms Core
 * Operational Directive: NTRO Tactical Reconnaissance
 * Contains algorithms for Laplacian blur detection, camera pose estimation,
 * 3D metric measurements, line-of-sight raycasting, and procedural tactical geometry.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CameraPose {
  id: number;
  timestamp: number;
  position: Vector3D;
  rotation: { pitch: number; roll: number; yaw: number }; // In degrees
  sharpness: number;
  isKeyframe: boolean;
  gsdCm: number;
}

export interface TacticalMarker {
  id: string;
  name: string;
  type: "hostile" | "friendly" | "target" | "hazard" | "lz";
  position: Vector3D;
  elevationM: number;
  description: string;
  timestamp: string;
}

export interface MeasurementResult {
  start: Vector3D;
  end: Vector3D;
  euclideanDistanceM: number;
  groundDistanceM: number;
  elevationDeltaM: number;
  slopeDegrees: number;
}

export interface LineOfSightResult {
  start: Vector3D;
  end: Vector3D;
  hasLineOfSight: boolean;
  occlusionPoint?: Vector3D;
  distanceM: number;
}

/**
 * Calculates Euclidean distance in metric meters between two 3D points
 */
export function calculateEuclideanDistance(a: Vector3D, b: Vector3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.hypot(dx, dy, dz);
}

/**
 * Calculates horizontal ground distance (ignoring elevation Y)
 */
export function calculateGroundDistance(a: Vector3D, b: Vector3D): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.hypot(dx, dz);
}

/**
 * Calculates 3D measurement details between two points
 */
export function calculateMeasurement(a: Vector3D, b: Vector3D): MeasurementResult {
  const euclidean = calculateEuclideanDistance(a, b);
  const ground = calculateGroundDistance(a, b);
  const elevationDelta = b.y - a.y;
  const slope = ground > 0 ? (Math.atan2(Math.abs(elevationDelta), ground) * 180) / Math.PI : 90;

  return {
    start: { ...a },
    end: { ...b },
    euclideanDistanceM: Number(euclidean.toFixed(2)),
    groundDistanceM: Number(ground.toFixed(2)),
    elevationDeltaM: Number(elevationDelta.toFixed(2)),
    slopeDegrees: Number(slope.toFixed(1)),
  };
}

/**
 * Simulates Laplacian variance blur metric.
 * In image processing: Var(Laplacian(I)).
 * Values below threshold (default 120) represent motion blur or sensor shake.
 */
export function evaluateBlurVariance(
  variance: number,
  threshold: number = 120.0
): { isSharp: boolean; confidence: number; label: string } {
  const isSharp = variance >= threshold;
  const confidence = Math.min(1.0, Math.max(0.1, variance / 250.0));
  const label = isSharp ? (variance > 180 ? "Crisp Keyframe" : "Acceptable") : "Motion Blurred (Discarded)";
  return { isSharp, confidence: Number(confidence.toFixed(2)), label };
}

/**
 * Evaluates whether a video frame should be retained as an SfM keyframe.
 * Requires:
 * 1. Sharpness >= blurThreshold
 * 2. Spatial baseline distance >= minBaselineM (to avoid redundant viewpoints)
 */
export function shouldRetainKeyframe(
  sharpness: number,
  lastPosition: Vector3D | null,
  currentPosition: Vector3D,
  blurThreshold: number = 120.0,
  minBaselineM: number = 3.5
): boolean {
  if (sharpness < blurThreshold) return false;
  if (!lastPosition) return true;
  const dist = calculateGroundDistance(lastPosition, currentPosition);
  return dist >= minBaselineM;
}

/**
 * Evaluates Line-of-Sight between two tactical coordinates against simple obstacles
 */
export function evaluateLineOfSight(
  observer: Vector3D,
  target: Vector3D,
  obstacles: Array<{ center: Vector3D; radius: number; height: number }> = []
): LineOfSightResult {
  const dist = calculateEuclideanDistance(observer, target);

  // Check ray intersection with bounding cylinders/boxes of terrain & structures
  for (const obs of obstacles) {
    // Check if line segment passes through obstacle cylinder
    const dX = target.x - observer.x;
    const dZ = target.z - observer.z;
    const lineLenSq = dX * dX + dZ * dZ;

    if (lineLenSq === 0) continue;

    const t = Math.max(
      0,
      Math.min(1, ((obs.center.x - observer.x) * dX + (obs.center.z - observer.z) * dZ) / lineLenSq)
    );
    const closestX = observer.x + t * dX;
    const closestZ = observer.z + t * dZ;
    const distToObsCenter = Math.hypot(closestX - obs.center.x, closestZ - obs.center.z);

    if (distToObsCenter < obs.radius) {
      // Check elevation at this point along the ray
      const rayYAtIntersection = observer.y + t * (target.y - observer.y);
      if (rayYAtIntersection < obs.center.y + obs.height) {
        return {
          start: observer,
          end: target,
          hasLineOfSight: false,
          occlusionPoint: {
            x: Number(closestX.toFixed(2)),
            y: Number(rayYAtIntersection.toFixed(2)),
            z: Number(closestZ.toFixed(2)),
          },
          distanceM: Number(dist.toFixed(2)),
        };
      }
    }
  }

  return {
    start: observer,
    end: target,
    hasLineOfSight: true,
    distanceM: Number(dist.toFixed(2)),
  };
}

/**
 * Generates sample single-pass flight path trajectory
 */
export function generateSinglePassTrajectory(
  lengthM: number = 200,
  speedMps: number = 15.0,
  altitudeM: number = 65.0
): CameraPose[] {
  const poses: CameraPose[] = [];
  const frameCount = 30;
  const timeStep = lengthM / (speedMps * frameCount);

  for (let i = 0; i < frameCount; i++) {
    const t = i * timeStep;
    const progress = i / (frameCount - 1);
    const x = (progress - 0.5) * lengthM; // centered around origin
    const z = Math.sin(progress * Math.PI * 2) * 6.0; // slight flight path deviation
    const y = altitudeM + Math.sin(progress * Math.PI * 4) * 1.8;

    // Simulate sharpness variations
    const isBlurry = i === 4 || i === 12 || i === 19 || i === 24;
    const sharpness = isBlurry ? 78 + (i % 3) * 10 : 160 + (i % 5) * 15;

    poses.push({
      id: i + 1,
      timestamp: Number(t.toFixed(1)),
      position: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), z: Number(z.toFixed(2)) },
      rotation: {
        pitch: -48 + Math.sin(progress * 6) * 2.0,
        roll: Math.sin(progress * 8) * 1.5,
        yaw: 90 + Math.atan2(z, x) * (180 / Math.PI),
      },
      sharpness,
      isKeyframe: !isBlurry,
      gsdCm: Number((2.2 + Math.abs(y - altitudeM) * 0.05).toFixed(2)),
    });
  }

  return poses;
}

/**
 * Formats coordinates for display
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lon).toFixed(5)}° ${lonDir}`;
}
