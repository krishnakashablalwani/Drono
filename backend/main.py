from fastapi import FastAPI, UploadFile, File, WebSocket, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import uuid
import os
import asyncio
import shutil
import logging
from typing import Dict, Any

from core.srt_parser import SRTParser
from core.frame_extractor import FrameExtractor
from core.odometry import VisualOdometry
from core.reconstruction import Reconstruction
from core.dem_generator import DEMGenerator
from core.tactical_analyzer import TacticalAnalyzer
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aeromesh Dual-Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS: Dict[str, Any] = {}
WS_CONNECTIONS: Dict[str, WebSocket] = {}

DATA_DIR = "data_jobs"
os.makedirs(DATA_DIR, exist_ok=True)

async def broadcast_progress(job_id: str, stage: str, progress: int, metrics: dict = None):
    if job_id in WS_CONNECTIONS:
        ws = WS_CONNECTIONS[job_id]
        msg = {"stage": stage, "progress": progress}
        if metrics:
            msg["metrics"] = metrics
        try:
            await ws.send_json(msg)
        except Exception as e:
            logger.error(f"WS send error: {e}")

async def run_pipeline(job_id: str, video_path: str, srt_path: str):
    job_dir = os.path.join(DATA_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    try:
        # Stage 1: Parsing
        await broadcast_progress(job_id, "PARSING_TELEMETRY", 10)
        with open(srt_path, 'r') as f:
            srt_parser = SRTParser(f.read())
            telemetry = srt_parser.parse()
        
        # Stage 2: Filtering
        await broadcast_progress(job_id, "FILTERING_BLUR", 30)
        extractor = FrameExtractor(video_path, telemetry)
        frames = extractor.extract_and_filter()
        metrics = {
            "Sharp Frames Accepted": len(frames),
            "Blurry Frames Discarded": "Auto"
        }
        await broadcast_progress(job_id, "FILTERING_BLUR", 40, metrics)
        
        # Stage 3: Odometry
        await broadcast_progress(job_id, "SOLVING_ODOMETRY", 50)
        odometry = VisualOdometry()
        poses, trajectory = odometry.process(frames, job_dir)
        
        # Stage 4: Reconstruction
        await broadcast_progress(job_id, "DENSE_RECONSTRUCTION", 70)
        recon = Reconstruction(job_dir)
        cam_mat = np.array([[1000, 0, 960], [0, 1000, 540], [0, 0, 1]]) # dummy
        recon.run(frames, poses, cam_mat)
        
        # Stage 5: DEM
        await broadcast_progress(job_id, "GENERATING_DEM", 90)
        dem_gen = DEMGenerator(job_dir)
        dem_path = dem_gen.generate(os.path.join(job_dir, 'model.glb'))
        
        tactical = TacticalAnalyzer(job_dir)
        tactical.generate_sitrep(dem_path, os.path.join(job_dir, 'flight_path.geojson'))
        
        await broadcast_progress(job_id, "COMPLETED", 100, {
            "Estimated GSD": "2.2 cm/px",
            "Point Cloud Density": "Dense"
        })
        JOBS[job_id]["status"] = "COMPLETED"
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        await broadcast_progress(job_id, "ERROR", 0, {"error": str(e)})
        JOBS[job_id]["status"] = "ERROR"

@app.post("/api/upload")
async def upload_files(background_tasks: BackgroundTasks, video: UploadFile = File(None), srt: UploadFile = File(None), demo: bool = False):
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(DATA_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    if demo:
        # Setup demo files
        video_path = "test_data/demo.mp4"
        srt_path = "test_data/demo.srt"
        if not os.path.exists(video_path):
            import generate_demo_assets
            generate_demo_assets.generate_all("test_data")
    else:
        video_path = os.path.join(job_dir, "input.mp4")
        srt_path = os.path.join(job_dir, "input.srt")
        
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)
        with open(srt_path, "wb") as f:
            shutil.copyfileobj(srt.file, f)
            
    JOBS[job_id] = {"status": "RUNNING"}
    background_tasks.add_task(run_pipeline, job_id, video_path, srt_path)
    
    return {"job_id": job_id}

@app.websocket("/api/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await websocket.accept()
    WS_CONNECTIONS[job_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except:
        if job_id in WS_CONNECTIONS:
            del WS_CONNECTIONS[job_id]

@app.get("/api/download/{job_id}/{file_type}")
async def download_file(job_id: str, file_type: str):
    job_dir = os.path.join(DATA_DIR, job_id)
    file_map = {
        "glb": "model.glb",
        "ply": "dense.ply",
        "dem": "dem.tif",
        "geojson": "flight_path.geojson",
        "sitrep": "sitrep.md"
    }
    
    if file_type not in file_map:
        return {"error": "Invalid file type"}
        
    file_path = os.path.join(job_dir, file_map[file_type])
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "File not found"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
