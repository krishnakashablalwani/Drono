# Drono Tactical Reconnaissance Engine (Backend)

The core 3D photogrammetry and processing pipeline for Problem Statement 26158 (Single-Pass Drone Video to Accurate 3D Model Generation).

## 🚀 Features
- **Video & Telemetry Ingestion**: Direct support for standard `.mp4` and DJI `.srt` flight data.
- **Visual Odometry**: SIFT-based feature extraction combined with telemetry-scaled translation.
- **Dense Reconstruction**: Generates high-fidelity `.ply` point clouds and hole-filled `.obj` / `.glb` meshes using Open3D and Trimesh.
- **Tactical Analytics**: Automatically generates Digital Elevation Models (`.tif`) and flight path geo-data (`.geojson`).
- **Real-Time Websockets**: Live progress monitoring for the Next.js frontend UI.

## 🛠 Prerequisites
- Python 3.11+
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```

## 🚦 Running the Engine
Start the FastAPI server:
```bash
python main.py
```
*(The server runs on `http://localhost:8000`)*

## 📡 API Endpoints

### 1. Upload & Process
`POST /api/reconstruct/upload`
- **Payload (multipart/form-data)**: 
  - `video`: The raw drone `.mp4` file.
  - `telemetry`: The accompanying `.srt` file.
- **Returns**: `{"job_id": "<uuid>", "status": "queued"}`

### 2. Live Websocket Monitoring
`WS /api/reconstruct/ws/{job_id}`
- Streams real-time progress percentages and phase updates.

### 3. Fetch Artifacts
`GET /api/reconstruct/results/{job_id}`
- **Returns**: JSON object containing download URLs for:
  - `mesh.glb`
  - `pointcloud.ply`
  - `dem.tif`
  - `flight_path.geojson`
  - `sitrep.json`

## 🧪 Testing with Synthetic Data
Generate a photorealistic 3D flight scenario to verify pipeline integrity:
```bash
python generate_realistic_sample.py
```
Then queue the job via cURL:
```bash
curl -X POST "http://localhost:8000/api/reconstruct/upload" \
  -F "video=@test_data/sample.mp4" \
  -F "telemetry=@test_data/sample.srt"
```
