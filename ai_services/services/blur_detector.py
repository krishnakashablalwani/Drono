"""
Drono Computer Vision Engine - Blur Detection & Keyframe Extraction
Calculates Laplacian variance of drone video frames to drop motion blur
and extract sharp keyframes based on spatial overlap and camera speed.
"""
from typing import List, Dict, Any
import math

class KeyframeExtractor:
    def __init__(self, blur_threshold: float = 120.0, overlap_threshold: float = 0.65):
        self.blur_threshold = blur_threshold
        self.overlap_threshold = overlap_threshold

    def calculate_laplacian_variance(self, pixel_matrix: List[List[float]]) -> float:
        """
        Discrete 2D Laplacian operator approximation:
        L(x,y) = f(x+1, y) + f(x-1, y) + f(x, y+1) + f(x, y-1) - 4*f(x,y)
        Variance of L indicates sharpness. Lower variance = higher blur.
        """
        rows = len(pixel_matrix)
        if rows < 3:
            return 0.0
        cols = len(pixel_matrix[0])
        if cols < 3:
            return 0.0

        laplacian_vals = []
        for r in range(1, rows - 1):
            for c in range(1, cols - 1):
                center = pixel_matrix[r][c]
                val = (
                    pixel_matrix[r + 1][c]
                    + pixel_matrix[r - 1][c]
                    + pixel_matrix[r][c + 1]
                    + pixel_matrix[r][c - 1]
                    - 4 * center
                )
                laplacian_vals.append(val)

        if not laplacian_vals:
            return 0.0

        mean = sum(laplacian_vals) / len(laplacian_vals)
        variance = sum((x - mean) ** 2 for x in laplacian_vals) / len(laplacian_vals)
        return float(variance)

    def evaluate_frame(self, frame_id: int, timestamp: float, sharpness_score: float, motion_vector: float) -> Dict[str, Any]:
        is_sharp = sharpness_score >= self.blur_threshold
        retained = is_sharp and motion_vector >= 0.15
        
        return {
            "frame_id": frame_id,
            "timestamp": timestamp,
            "sharpness_score": round(sharpness_score, 2),
            "is_sharp": is_sharp,
            "retained": retained,
            "motion_vector": round(motion_vector, 3),
            "status": "Accepted" if retained else ("Blur Discard" if not is_sharp else "Redundant Pose")
        }

    def process_sequence(self, frames_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        evaluated = []
        total_frames = len(frames_data)
        retained_count = 0

        for item in frames_data:
            res = self.evaluate_frame(
                frame_id=item.get("frame_id", 0),
                timestamp=item.get("timestamp", 0.0),
                sharpness_score=item.get("sharpness_score", 0.0),
                motion_vector=item.get("motion_vector", 0.0)
            )
            if res["retained"]:
                retained_count += 1
            evaluated.append(res)

        compression_ratio = round((1 - (retained_count / total_frames if total_frames > 0 else 0)) * 100, 1)

        return {
            "total_frames": total_frames,
            "retained_keyframes": retained_count,
            "discarded_blurry": sum(1 for f in evaluated if not f["is_sharp"]),
            "compression_ratio_pct": compression_ratio,
            "frames": evaluated
        }
