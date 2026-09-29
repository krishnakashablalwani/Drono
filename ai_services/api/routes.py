import os
import shutil
import uuid
import random
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from core.config import settings
from models.schemas import KeyframeExtractRequest, ReconstructionRequest, TelemetryData
from services.blur_detector import KeyframeExtractor
from services.sfm_engine import SfMReconstructionEngine
from services.telemetry_service import TelemetryService

router = APIRouter()
sfm_engine = SfMReconstructionEngine()

@router.post("/pipeline/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    srt: UploadFile = File(...)
):
    try:
        video_filename = f"{uuid.uuid4()}_{video.filename}"
        srt_filename = f"{uuid.uuid4()}_{srt.filename}"
        
        video_path = os.path.join(settings.UPLOAD_DIR, video_filename)
        srt_path = os.path.join(settings.UPLOAD_DIR, srt_filename)
        
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
            
        with open(srt_path, "wb") as buffer:
            shutil.copyfileobj(srt.file, buffer)
            
        return JSONResponse(content={
            "status": "success",
            "success": True,
            "video_url": video_filename,
            "srt_url": srt_filename
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pipeline/keyframes/extract")
async def extract_keyframes(req: KeyframeExtractRequest):
    extractor = KeyframeExtractor(blur_threshold=req.blur_threshold)
    sim_data = []
    timestamp = 0.0
    for i in range(req.simulated_frames):
        score = random.uniform(40.0, 250.0) 
        mv = random.uniform(0.01, 0.40)
        sim_data.append({
            "frame_id": i,
            "timestamp": timestamp,
            "sharpness_score": score,
            "motion_vector": mv
        })
        timestamp += 0.5
        
    result = extractor.process_sequence(sim_data)
    return JSONResponse(content=result)

@router.post("/pipeline/reconstruct-3d")
async def reconstruct_3d(req: ReconstructionRequest):
    video_path = os.path.join(settings.UPLOAD_DIR, req.video_url)
    srt_path = os.path.join(settings.UPLOAD_DIR, req.srt_url)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    if not os.path.exists(srt_path):
        raise HTTPException(status_code=404, detail="SRT file not found")
        
    try:
        # Extract telemetry first
        # We need a frame index. Let's use 0 for now as the middle of the flight is usually standard.
        # sfm_engine currently looks for the middle frame. Let's let sfm_engine ask telemetry for the middle frame.
        # Actually, in sfm_engine, we have cap.get(CAP_PROP_FRAME_COUNT) // 2.
        # I'll pass the srt_path to sfm_engine, and it will call telemetry service.
        # Wait, the plan was to pass TelemetryData directly.
        # Let's extract telemetry for frame 0, but ideally sfm_engine should do it for the frame it extracts.
        # I'll refactor sfm_engine to use telemetry_service internally for the exact frame.
        # Let's modify sfm_engine slightly or just pass the srt_path here.
        # Wait, if I pass srt_path here, I can get telemetry for an arbitrary frame (e.g. middle).
        
        # Let's just use telemetry_service in sfm_engine or pass it. I'll pass srt_path to sfm_engine and let sfm_engine use TelemetryService, or better, keep sfm_engine decoupled from the path.
        # Since I've already written sfm_engine.py to accept `telemetry: TelemetryData`, I need to extract it here. 
        # But wait, how do I know the frame count here? I don't.
        # I'll just pass `TelemetryData` for frame 0 as an approximation, or use cv2 here.
        import cv2
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) if cap.isOpened() else 0
        cap.release()
        
        target_frame = max(0, frame_count // 2)
        telemetry = TelemetryService.parse_srt_telemetry(srt_path, target_frame)
        
        result = sfm_engine.synthesize_tactical_point_cloud(video_path, telemetry=telemetry)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
            
        return JSONResponse(content={
            "success": True,
            "point_cloud": result
        })
    except Exception as e:
        print(f"[API Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))
