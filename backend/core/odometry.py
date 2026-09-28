import cv2
import numpy as np
import logging
from typing import List, Dict, Any
import json
import os

logger = logging.getLogger(__name__)

class VisualOdometry:
    def __init__(self, focal_length=1000.0, pp=(960, 540)):
        # Assuming 1080p, focal length is an approximation if not known
        self.focal_length = focal_length
        self.pp = pp
        self.camera_matrix = np.array([
            [focal_length, 0, pp[0]],
            [0, focal_length, pp[1]],
            [0, 0, 1]
        ])
        
        self.sift = cv2.SIFT_create()
        # FLANN parameters
        FLANN_INDEX_KDTREE = 1
        index_params = dict(algorithm = FLANN_INDEX_KDTREE, trees = 5)
        search_params = dict(checks=50)
        self.flann = cv2.FlannBasedMatcher(index_params, search_params)

    def process(self, frames: List[Dict[str, Any]], output_dir: str):
        """Processes frames to recover visual odometry and metric scale."""
        if len(frames) < 2:
            logger.warning("Not enough frames for visual odometry.")
            return [], []
            
        trajectory = []
        poses = []
        
        # Initial pose
        current_R = np.eye(3)
        current_t = np.zeros((3, 1))
        
        poses.append((current_R, current_t))
        t_data = frames[0]['telemetry']
        trajectory.append({
            "geometry": {"type": "Point", "coordinates": [t_data['lon'], t_data['lat'], t_data.get('z', 0)]},
            "properties": {"frame_idx": frames[0]['frame_idx']}
        })

        for i in range(1, len(frames)):
            img1 = cv2.cvtColor(frames[i-1]['image'], cv2.COLOR_BGR2GRAY)
            img2 = cv2.cvtColor(frames[i]['image'], cv2.COLOR_BGR2GRAY)
            
            t_data1 = frames[i-1]['telemetry']
            t_data2 = frames[i]['telemetry']
            
            # Feature matching
            kp1, des1 = self.sift.detectAndCompute(img1, None)
            kp2, des2 = self.sift.detectAndCompute(img2, None)
            
            if des1 is None or des2 is None or len(des1) < 8 or len(des2) < 8:
                logger.warning(f"Feature starvation at frame {frames[i]['frame_idx']}.")
                # Fallback to telemetry for translation
                continue
                
            matches = self.flann.knnMatch(des1, des2, k=2)
            
            # Lowe's ratio test
            good = []
            for m_match in matches:
                if len(m_match) == 2:
                    m, n = m_match
                    if m.distance < 0.75 * n.distance:
                        good.append(m)
            
            if len(good) < 8:
                logger.warning(f"Not enough good matches at frame {frames[i]['frame_idx']}.")
                continue
                
            pts1 = np.float32([ kp1[m.queryIdx].pt for m in good ])
            pts2 = np.float32([ kp2[m.trainIdx].pt for m in good ])
            
            # Essential matrix
            E, mask = cv2.findEssentialMat(pts2, pts1, self.camera_matrix, method=cv2.RANSAC, prob=0.999, threshold=1.0)
            if E is None:
                continue
                
            # Recover pose
            _, R, t, mask = cv2.recoverPose(E, pts2, pts1, self.camera_matrix)
            
            # Metric Scale Recovery
            p1 = np.array([t_data1.get('x', 0), t_data1.get('y', 0), t_data1.get('z', 0)])
            p2 = np.array([t_data2.get('x', 0), t_data2.get('y', 0), t_data2.get('z', 0)])
            delta_d_telemetry = np.linalg.norm(p2 - p1)
            
            norm_t = np.linalg.norm(t)
            if norm_t > 1e-6:
                s = delta_d_telemetry / norm_t
                t = t * s
            
            current_t = current_t + current_R.dot(t)
            current_R = R.dot(current_R)
            
            poses.append((current_R, current_t))
            
            trajectory.append({
                "geometry": {"type": "Point", "coordinates": [t_data2['lon'], t_data2['lat'], t_data2.get('z', 0)]},
                "properties": {"frame_idx": frames[i]['frame_idx']}
            })

        # Export GeoJSON
        geojson = {
            "type": "FeatureCollection",
            "features": trajectory
        }
        with open(os.path.join(output_dir, 'flight_path.geojson'), 'w') as f:
            json.dump(geojson, f)
            
        return poses, trajectory
