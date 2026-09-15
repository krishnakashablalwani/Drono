"""
Drono Tactical 3D Reconnaissance API
NTRO National Technical Research Organisation
FastAPI service orchestrating frame extraction, blur filtering, and 3D reconstruction.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import time

from pipeline.blur_detector import KeyframeExtractor
from pipeline.sfm_reconstruction import SfMReconstructionEngine

app = FastAPI(
    title="Drono Tactical Reconnaissance Engine",
    description="Single-Pass Drone Video to Accurate 3D Model Generation API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

blur_extractor = KeyframeExtractor(blur_threshold=120.0)
sfm_engine = SfMReconstructionEngine()

# In-memory mission registry
MISSIONS_DB = [
    {
        "mission_id": "M-TAC-ALPHA",
        "mission_name": "Operation Karakoram - Ridge Sector 4",
        "target_type": "Forward Mountain Outpost",
        "status": "Complete",
        "flight_mode": "Single-Pass Oblique Recon",
        "drone_model": "DRDO Rustom-II Tactical UAV",
        "altitude_m": 68.5,
        "velocity_kmh": 45.0,
        "duration_sec": 38.0,
        "raw_frames_count": 1140,
        "extracted_keyframes_count": 76,
        "mesh_vertex_count": 84200,
        "gsd_cm_per_px": 2.4,
        "created_at": "2026-09-11T10:15:00Z"
    },
    {
        "mission_id": "M-TAC-BRAVO",
        "mission_name": "NDRF Disaster Relief - Bridge 104 Structural Survey",
        "target_type": "Critical Infrastructure",
        "status": "Complete",
        "flight_mode": "Single-Pass Straight Corridor",
        "drone_model": "Tactical Quadrotor MK-IV",
        "altitude_m": 42.0,
        "velocity_kmh": 32.0,
        "duration_sec": 24.0,
        "raw_frames_count": 720,
        "extracted_keyframes_count": 52,
        "mesh_vertex_count": 61500,
        "gsd_cm_per_px": 1.8,
        "created_at": "2026-09-11T14:30:00Z"
    }
]

class KeyframeExtractRequest(BaseModel):
    video_url: Optional[str] = "sample_recon_flight.mp4"
    blur_threshold: float = Field(default=120.0, ge=50.0, le=300.0)
    simulated_frames: int = Field(default=30, ge=10, le=200)

class ReconstructionRequest(BaseModel):
    mission_id: str
    keyframes_count: int = 25
    point_density: int = 50

@app.get("/")
def read_root():
    return {
        "system": "Drono Tactical Reconnaissance Engine",
        "client": "NTRO - National Technical Research Organisation",
        "status": "ONLINE",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "gpu_acceleration": "CUDA/WebGL Ready",
        "cv_pipeline": "OpenCV Laplacian Variance Engine Active",
        "sfm_pipeline": "Structure-from-Motion / Gaussian Splatting Active"
    }

@app.get("/api/missions")
def get_missions():
    return {
        "count": len(MISSIONS_DB),
        "missions": MISSIONS_DB
    }

@app.post("/api/pipeline/extract-keyframes")
def extract_keyframes(req: KeyframeExtractRequest):
    # Generates simulated raw frame stream with varying sharpness and motion
    frames_data = []
    for i in range(req.simulated_frames):
        t = round(i * 0.5, 2)
        # Periodic blur caused by wind buffeting or rapid drone yaw
        base_sharpness = 160.0 + (i % 7) * 18.0
        if i in [3, 4, 11, 12, 19, 25]:
            sharpness = 65.0 + (i % 4) * 8.0 # Discardable blur
        else:
            sharpness = base_sharpness
            
        motion = 0.22 if i > 0 else 0.0
        frames_data.append({
            "frame_id": i + 1,
            "timestamp": t,
            "sharpness_score": sharpness,
            "motion_vector": motion
        })

    result = blur_extractor.process_sequence(frames_data)
    return {
        "success": True,
        "input_video": req.video_url,
        "blur_threshold": req.blur_threshold,
        "metrics": result
    }

@app.post("/api/pipeline/reconstruct-3d")
def reconstruct_3d(req: ReconstructionRequest):
    keyframes = [{"frame_id": i + 1, "timestamp": i * 0.5} for i in range(req.keyframes_count)]
    poses = sfm_engine.estimate_camera_poses(keyframes)
    cloud_result = sfm_engine.synthesize_tactical_point_cloud(poses, point_density_multiplier=req.point_density)

    return {
        "success": True,
        "mission_id": req.mission_id,
        "camera_poses_count": len(poses),
        "camera_trajectory": poses,
        "point_cloud": cloud_result,
        "reconstruction_status": "Complete",
        "mesh_url": f"/assets/missions/{req.mission_id}/mesh.ply"
    }
