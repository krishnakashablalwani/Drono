import { describe, it, expect } from "vitest";
import {
  calculateEuclideanDistance,
  calculateGroundDistance,
  calculateMeasurement,
  evaluateBlurVariance,
  shouldRetainKeyframe,
  evaluateLineOfSight,
  generateSinglePassTrajectory,
  formatCoordinates,
} from "../lib/photogrammetry";

describe("Photogrammetry & Metric Mathematics", () => {
  it("calculates accurate 3D Euclidean distance", () => {
    const ptA = { x: 0, y: 0, z: 0 };
    const ptB = { x: 3, y: 4, z: 0 };
    expect(calculateEuclideanDistance(ptA, ptB)).toBe(5);

    const ptC = { x: 1, y: 2, z: 2 };
    expect(calculateEuclideanDistance(ptA, ptC)).toBe(3);
  });

  it("calculates horizontal ground distance ignoring elevation Y", () => {
    const ptA = { x: 0, y: 100, z: 0 };
    const ptB = { x: 6, y: 500, z: 8 };
    expect(calculateGroundDistance(ptA, ptB)).toBe(10);
  });

  it("calculates comprehensive 3D measurement details with slope", () => {
    const ptA = { x: 0, y: 10, z: 0 };
    const ptB = { x: 10, y: 20, z: 0 };
    const measurement = calculateMeasurement(ptA, ptB);

    expect(measurement.groundDistanceM).toBe(10);
    expect(measurement.elevationDeltaM).toBe(10);
    expect(measurement.slopeDegrees).toBe(45);
    expect(measurement.euclideanDistanceM).toBeCloseTo(14.14, 1);
  });

  it("evaluates Laplacian blur variance against threshold", () => {
    const sharpFrame = evaluateBlurVariance(165.0, 120.0);
    expect(sharpFrame.isSharp).toBe(true);
    expect(sharpFrame.confidence).toBeGreaterThan(0.5);

    const blurryFrame = evaluateBlurVariance(85.0, 120.0);
    expect(blurryFrame.isSharp).toBe(false);
    expect(blurryFrame.label).toContain("Motion Blurred");
  });

  it("discriminates keyframes based on blur and spatial baseline", () => {
    const posA = { x: 0, y: 50, z: 0 };
    const posB_close = { x: 1, y: 50, z: 1 }; // distance ~1.41m < 3.5m baseline
    const posC_far = { x: 10, y: 50, z: 0 }; // distance 10m >= 3.5m baseline

    // Blurry frame discarded regardless of baseline
    expect(shouldRetainKeyframe(90.0, posA, posC_far, 120.0, 3.5)).toBe(false);

    // Sharp frame but redundant position discarded
    expect(shouldRetainKeyframe(180.0, posA, posB_close, 120.0, 3.5)).toBe(false);

    // Sharp frame with sufficient baseline accepted
    expect(shouldRetainKeyframe(180.0, posA, posC_far, 120.0, 3.5)).toBe(true);

    // First frame without previous position accepted if sharp
    expect(shouldRetainKeyframe(180.0, null, posA, 120.0, 3.5)).toBe(true);
  });

  it("computes Line-of-Sight visibility between coordinates", () => {
    const observer = { x: 0, y: 10, z: 0 };
    const target = { x: 50, y: 10, z: 0 };

    // Unobstructed LOS
    const clearLos = evaluateLineOfSight(observer, target, []);
    expect(clearLos.hasLineOfSight).toBe(true);
    expect(clearLos.distanceM).toBe(50);

    // Obstructed by obstacle in between
    const obstacle = {
      center: { x: 25, y: 0, z: 0 },
      radius: 5,
      height: 25, // Height 25m occludes the ray at elevation 10m
    };
    const occludedLos = evaluateLineOfSight(observer, target, [obstacle]);
    expect(occludedLos.hasLineOfSight).toBe(false);
    expect(occludedLos.occlusionPoint).toBeDefined();
  });

  it("generates realistic single-pass UAV trajectory poses", () => {
    const trajectory = generateSinglePassTrajectory(200, 15.0, 60.0);
    expect(trajectory.length).toBe(30);

    const first = trajectory[0];
    expect(first.position.y).toBeCloseTo(60.0, 1);
    expect(first.rotation.pitch).toBeLessThan(0); // Nadir/oblique angle
    expect(first.gsdCm).toBeGreaterThan(0);
  });

  it("formats latitude and longitude with hemisphere indicators", () => {
    expect(formatCoordinates(34.14205, 74.82114)).toBe("34.14205° N, 74.82114° E");
    expect(formatCoordinates(-12.45000, -45.67000)).toBe("12.45000° S, 45.67000° W");
  });
});
