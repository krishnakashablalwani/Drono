from pydantic import BaseModel, Field
from typing import List, Optional

class TelemetryData(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude_m: float = 50.0  # Default to 50m if unknown
    gimbal_pitch_deg: float = -15.0 # Default looking slightly down
    gimbal_roll_deg: float = 0.0
    gimbal_yaw_deg: float = 0.0

class KeyframeExtractRequest(BaseModel):
    video_url: Optional[str] = "sample_recon_flight.mp4"
    blur_threshold: float = Field(default=120.0, ge=50.0, le=300.0)
    simulated_frames: int = Field(default=30, ge=10, le=200)

class ReconstructionRequest(BaseModel):
    mission_id: str
    video_url: str
    srt_url: str
    keyframes_count: int = 25
    point_density: int = 50

class PointCloudResponse(BaseModel):
    point_count: int
    bounds: dict
    mean_reprojection_error: float
    points: List[dict]
