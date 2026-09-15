# Drono Sample Drone Flight Corridors

This directory contains real UAV flight videos tailored for single-pass photogrammetry, discrete 2D Laplacian motion-blur filtering, and 3D terrain reconstruction.

---

## 1. Included Sample Videos

| File | Resolution | Framerate | Duration | Size | Flight Profile & Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`DJI_0317_corridor.mp4`** | 960x540 | 60 fps | 46.6s | 5.4 MB | **Continuous Forward Flight Corridor** (OpenDroneMap benchmark). Smooth forward progression ideal for monocular visual odometry and keyframe extraction. |
| **`DJI_0317_corridor.srt`** | Subtitle | 60 Hz | 46.6s | 890 KB | **Synchronized Telemetry Data**. Subtitle stream recording per-frame GPS latitude, longitude, altitude (AGL), ISO, shutter speed, and focal length every 16ms. |
| **`DJI_0051_aerial.mp4`** | 854x480 | 60 fps | 57.5s | 4.9 MB | **High-Altitude Landscape Scan** (DJI Mavic Air 2). Overhead terrain corridor with rich textural features for Harris corner and optical flow tracking. |
| **`DJI_0122_ridge_sweep.mp4`** | 854x480 | 60 fps | 45.0s | 5.5 MB | **Mountain Ridge & Contour Flight**. Oblique angle sweep across elevation variations, ideal for testing the 2D Elevation Profile Slicer. |
| **`DJI_0346_valley_survey.mp4`** | 854x480 | 60 fps | 42.0s | 5.7 MB | **Valley & Surface Feature Mapping**. Variable lighting and ground detail, perfect for testing Laplacian blur variance rejection. |
| **`DJI_0087_low_altitude.mp4`** | 854x480 | 60 fps | 28.0s | 3.5 MB | **Low-Altitude Texture Sweep**. Rapid ground transit for evaluating drone pitch/roll buffeting and high-frequency motion blur. |

*All files are mirrored to `web/public/sample_videos/` so they can be loaded directly in the Drono Mission Control interface.*

---

## 2. Where to Get More High-Quality Drone Videos

For additional drone footage, the following platforms offer high-resolution (1080p and 4K) royalty-free videos suitable for photogrammetry testing:

### A. Free Royalty-Free Stock Video Platforms (Direct MP4 Downloads)
1. **Pexels Drone Video Library**
   - **URL**: [https://www.pexels.com/search/videos/drone/](https://www.pexels.com/search/videos/drone/)
   - **Best for**: Cinematic mountain ranges, forest canopies, infrastructure, agricultural fields, and coastal cliffs.
   - **Format**: MP4 (1080p & 4K). 100% free for commercial and personal use with no attribution required.

2. **Pixabay Aerial Videos**
   - **URL**: [https://pixabay.com/videos/search/drone/](https://pixabay.com/videos/search/drone/)
   - **Best for**: Downward-looking (nadir) drone sweeps, topography, roads, and building outposts.
   - **Format**: MP4 (multiple resolutions selectable from 720p to 4K). Free Pixabay Content License.

3. **Mixkit Drone Footage**
   - **URL**: [https://mixkit.co/free-stock-video/drone/](https://mixkit.co/free-stock-video/drone/)
   - **Best for**: 15 to 30 second continuous flight clips, mountain valleys, and desert terrain.
   - **Format**: Direct high-definition MP4 download with a single click.

4. **Coverr Aerial Category**
   - **URL**: [https://coverr.co/s?q=drone](https://coverr.co/s?q=drone)
   - **Best for**: Stable forward-flying drone loops.

---

### B. Specialized Photogrammetry & UAV Research Datasets
1. **OpenDroneMap (ODM) Datasets**
   - **URL**: [https://github.com/OpenDroneMap/](https://github.com/OpenDroneMap/)
   - Repositories like `drone_dataset_dji_video`, `odm_data_bellus`, and `odm_data_aukerman` contain authentic survey flights with flight plans and Ground Control Points (GCPs).

2. **VisDrone Benchmark Dataset**
   - **URL**: [https://github.com/VisDrone/VisDrone-Dataset](https://github.com/VisDrone/VisDrone-Dataset)
   - Extensive drone video dataset captured by various drone platforms under diverse weather and lighting conditions.

3. **AirSim / Mid-Air UAV Dataset**
   - **URL**: [https://midair.felberg.se/](https://midair.felberg.se/)
   - Synthetic and real UAV trajectories with ground-truth depth, camera poses, and optical flow vectors.

---

## 3. Recommended Video Specs for Drono Photogrammetry

To achieve the best 3D reconstruction and Laplacian blur rejection results:
- **Container / Codec**: MP4 (H.264 video codec, AAC audio) or WebM (VP9).
- **Framerate**: 30 fps or 60 fps (higher frame rates allow finer keyframe selection during sudden turns or turbulence).
- **Flight Path**: Continuous forward motion with 60% to 80% forward image overlap between successive frames.
- **Camera Angle**: Nadir (90 degrees straight down) or oblique (45 to 60 degrees forward pitch) for optimal ground elevation triangulation.
- **Ground Texture**: Surfaces with distinct geometric or textural features (rocks, vegetation, paths, structures) perform significantly better than featureless surfaces (calm open water, uniform snow).
- **Web Faststart**: If encoding your own videos via FFmpeg, use `-movflags +faststart` so the video begins playing and buffering immediately:
  ```bash
  ffmpeg -i input.mov -c:v libx264 -crf 20 -preset fast -movflags +faststart -an output.mp4
  ```
