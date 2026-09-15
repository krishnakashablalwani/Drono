"""
Drono Structure from Motion (SfM) & Visual Odometry Simulation Engine
Reconstructs camera trajectory and sparse 3D point cloud topology from sequential frames.
"""
from typing import List, Dict, Any
import math

class SfMReconstructionEngine:
    def __init__(self, focal_length_px: float = 1450.0, sensor_width_mm: float = 36.0):
        self.focal_length_px = focal_length_px
        self.sensor_width_mm = sensor_width_mm

    def estimate_camera_poses(self, keyframes: List[Dict[str, Any]], flight_speed_mps: float = 12.0) -> List[Dict[str, Any]]:
        """
        Estimates relative camera position (X, Y, Z) and attitude angles (pitch, roll, yaw)
        along a single-pass straight trajectory with forward motion.
        """
        poses = []
        for idx, kf in enumerate(keyframes):
            t = kf.get("timestamp", idx * 0.5)
            # Forward motion along X axis, slight altitude fluctuation, constant forward camera pitch (-45 deg nadir/oblique)
            x = round(t * flight_speed_mps, 2)
            y = round(65.0 + math.sin(t * 0.4) * 1.5, 2)  # Flight altitude ~65m AGL
            z = round(math.cos(t * 0.2) * 2.0, 2)         # Cross-track drift

            pitch = -45.0 + math.sin(t * 0.8) * 1.2        # Oblique forward reconnaissance angle
            roll = math.sin(t * 0.5) * 1.8                 # Drone banking / wind gust correction
            yaw = round(math.atan2(0.5, flight_speed_mps) * (180.0 / math.pi), 1)

            poses.append({
                "keyframe_id": kf.get("frame_id", idx),
                "position": {"x": x, "y": y, "z": z},
                "rotation": {"pitch": round(pitch, 2), "roll": round(roll, 2), "yaw": yaw},
                "matched_features_count": 850 + (idx * 23) % 400,
                "reprojection_error_px": round(0.42 + ((idx * 7) % 25) / 100.0, 3)
            })
        return poses

    def synthesize_tactical_point_cloud(self, poses: List[Dict[str, Any]], point_density_multiplier: int = 50) -> Dict[str, Any]:
        """
        Synthesizes 3D point cloud topology with RGB colors, elevations, and normal vectors.
        """
        points = []
        bounds = {"min_x": float("inf"), "max_x": float("-inf"), "min_z": float("inf"), "max_z": float("-inf"), "min_y": 0.0, "max_y": 0.0}

        for p in poses:
            pos = p["position"]
            px, py, pz = pos["x"], pos["y"], pos["z"]
            # Target footprint under camera
            for i in range(point_density_multiplier):
                offset_x = (i % 10 - 5) * 4.0
                offset_z = ((i // 10) - 2) * 5.0
                ground_x = round(px + offset_x, 2)
                ground_z = round(pz + offset_z, 2)
                # Terrain elevation with buildings/ridges
                dist_from_center = math.hypot(offset_x, offset_z)
                elevation = 0.0
                if 8.0 < dist_from_center < 18.0 and (i % 3 == 0):
                    elevation = round(12.0 + (i % 5) * 2.5, 2) # Building structure
                else:
                    elevation = round(math.sin(ground_x * 0.05) * 3.5 + math.cos(ground_z * 0.04) * 2.0, 2)

                bounds["min_x"] = min(bounds["min_x"], ground_x)
                bounds["max_x"] = max(bounds["max_x"], ground_x)
                bounds["min_z"] = min(bounds["min_z"], ground_z)
                bounds["max_z"] = max(bounds["max_z"], ground_z)
                bounds["max_y"] = max(bounds["max_y"], elevation)

                points.append({
                    "x": ground_x,
                    "y": elevation,
                    "z": ground_z,
                    "r": 50 + int((elevation / 25.0) * 120),
                    "g": 180 + int((elevation / 25.0) * 75),
                    "b": 210,
                    "confidence": 0.94
                })

        return {
            "point_count": len(points),
            "bounds": bounds,
            "mean_reprojection_error": 0.48,
            "points": points[:300] # preview points
        }
