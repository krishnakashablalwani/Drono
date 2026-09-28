import cv2
import numpy as np
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class FrameExtractor:
    def __init__(self, video_path: str, telemetry: List[Dict]):
        self.video_path = video_path
        self.telemetry = telemetry
        self.sharpness_threshold = 120.0
        self.spatial_baseline_min = 1.5  # meters

    def extract_and_filter(self) -> List[Dict[str, Any]]:
        """Extracts frames, filters by sharpness, and samples by spatial baseline."""
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            logger.error("Could not open video file.")
            return []

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30.0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        selected_frames = []
        last_selected_pos = None

        frame_idx = 0
        telemetry_idx = 0
        telemetry_len = len(self.telemetry)

        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Find closest telemetry
            # SRT typically has 1 entry per frame or slightly different frequency.
            # We map frame_idx to telemetry index based on assuming constant fps and SRT 
            # timestamps if we parsed them. Here we just map linearly or assume 1:1 if sizes match closely.
            if telemetry_idx < telemetry_len:
                # We'll just use the telemetry entry that corresponds to the percentage of video
                current_time = frame_idx / fps
                mapped_idx = int((frame_idx / total_frames) * telemetry_len) if total_frames > 0 else frame_idx
                mapped_idx = min(mapped_idx, telemetry_len - 1)
                t_data = self.telemetry[mapped_idx]
            else:
                t_data = self.telemetry[-1] if self.telemetry else {'x': 0, 'y': 0, 'z': 0}

            # 1. Filter by Sharpness
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            if variance < self.sharpness_threshold:
                # Drop blurry frame
                frame_idx += 1
                continue
                
            # 2. Sample by spatial baseline
            current_pos = np.array([t_data.get('x', 0), t_data.get('y', 0), t_data.get('z', 0)])
            
            if last_selected_pos is not None:
                dist = np.linalg.norm(current_pos - last_selected_pos)
                if dist < self.spatial_baseline_min:
                    frame_idx += 1
                    continue
            
            # Accepted frame
            selected_frames.append({
                'frame_idx': frame_idx,
                'image': frame,
                'telemetry': t_data
            })
            last_selected_pos = current_pos
            
            frame_idx += 1

        cap.release()
        logger.info(f"Selected {len(selected_frames)} frames out of {total_frames}")
        return selected_frames
