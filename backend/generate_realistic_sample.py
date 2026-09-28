import os
import cv2
import numpy as np
def generate_drone_photogrammetry_scene(
    filename="sample",
    duration_sec=12,
    fps=30,
    width=1280,
    height=720
):
    os.makedirs("test_data", exist_ok=True)
    video_path = f"test_data/{filename}.mp4"
    srt_path = f"test_data/{filename}.srt"
    total_frames = duration_sec * fps
    out = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    # --- 1. Camera Intrinsics (Typical 24mm equivalent drone camera) ---
    focal_length = 950.0  # px
    cx, cy = width / 2.0, height / 2.0
    K = np.array([
        [focal_length, 0, cx],
        [0, focal_length, cy],
        [0, 0, 1]
    ], dtype=np.float64)
    # --- 2. Construct 3D World Scene (Terrain, Road, Buildings) ---
    # 3D points in world coordinates (X: East, Y: North, Z: Elevation up)
    np.random.seed(42)
    # Terrain ground mesh with realistic texture (green/brown grass patches)
    ground_features = []
    for _ in range(1200):
        gx = np.random.uniform(-40, 40)
        gy = np.random.uniform(-20, 100)
        gz = np.random.uniform(-0.5, 0.5)
        color = (
            int(np.random.uniform(40, 80)),
            int(np.random.uniform(100, 160)),
            int(np.random.uniform(50, 90))
        )
        ground_features.append(([gx, gy, gz], color))
    # Procedural 3D Buildings: [center_x, center_y, width, depth, height, color]
    buildings = [
        # Left urban block
        [-15, 25, 12, 16, 14, (180, 160, 140)],
        [-18, 55, 10, 14, 18, (160, 150, 170)],
        # Right commercial complex
        [16, 35, 14, 20, 12, (200, 190, 170)],
        [18, 70, 16, 16, 22, (150, 170, 190)],
        # Central checkpoint / infrastructure
        [0, 80, 8, 8, 9, (120, 120, 130)]
    ]
    # Precompute building 3D vertices and roof features
    building_faces = []
    for bx, by, bw, bd, bh, bcolor in buildings:
        x0, x1 = bx - bw / 2, bx + bw / 2
        y0, y1 = by - bd / 2, by + bd / 2
        
        # Rooftop plane (4 corners)
        roof = np.array([
            [x0, y0, bh], [x1, y0, bh],
            [x1, y1, bh], [x0, y1, bh]
        ], dtype=np.float64)
        
        # Add high-contrast HVAC / rooftop textures for SIFT feature tracking
        sub_points = []
        for rx in np.linspace(x0 + 1, x1 - 1, 5):
            for ry in np.linspace(y0 + 1, y1 - 1, 5):
                sub_points.append(([rx, ry, bh + 0.1], (40, 40, 50)))
        building_faces.append({
            "roof": roof,
            "height": bh,
            "color": bcolor,
            "roof_features": sub_points,
            "corners": [x0, x1, y0, y1]
        })
    # --- 3. Telemetry Base Parameters (WGS84) ---
    base_lat = 17.385044
    base_lon = 78.486671
    base_alt = 35.0  # Drone flying at 35m AGL (Above Ground Level)
    srt_entries = []
    print(f"Synthesizing {duration_sec}s photorealistic 3D drone pass...")
    for f in range(total_frames):
        t = f / fps
        
        # Camera trajectory in 3D world (Moving forward along +Y, slight drift in X)
        cam_x = 2.0 * np.sin(t * 0.4)
        cam_y = t * 6.5           # Traveling forward at ~6.5 m/s (~23 km/h)
        cam_z = base_alt + np.sin(t * 0.3) * 0.8  # Slight barometric altitude drift
        # Real drone gimbal: looking down at 45 degree pitch angle
        pitch_deg = 45.0
        pitch_rad = np.radians(pitch_deg)
        yaw_rad = np.radians(np.sin(t * 0.2) * 2.0)  # Minor yaw stabilization drift
        roll_rad = 0.0
        # Camera rotation matrix R (World to Camera)
        # Standard camera: +Z looking outward, +X right, +Y down
        R_pitch = np.array([
            [1, 0, 0],
            [0, np.cos(pitch_rad), -np.sin(pitch_rad)],
            [0, np.sin(pitch_rad), np.cos(pitch_rad)]
        ])
        R_yaw = np.array([
            [np.cos(yaw_rad), -np.sin(yaw_rad), 0],
            [np.sin(yaw_rad), np.cos(yaw_rad), 0],
            [0, 0, 1]
        ])
        # Base orientation aligning OpenCV optical frame to World ENU frame
        R_world_cam = np.array([
            [1, 0, 0],
            [0, 0, -1],
            [0, 1, 0]
        ]) @ R_yaw @ R_pitch
        R = R_world_cam.T
        T = -R @ np.array([cam_x, cam_y, cam_z])
        # Projection helper
        def project(pts_3d):
            pts_cam = (R @ pts_3d.T).T + T
            # Filter points behind camera
            valid = pts_cam[:, 2] > 0.5
            p_2d = (K @ pts_cam.T).T
            u = p_2d[:, 0] / np.maximum(p_2d[:, 2], 1e-6)
            v = p_2d[:, 1] / np.maximum(p_2d[:, 2], 1e-6)
            return np.column_stack([u, v]), valid, pts_cam[:, 2]
        # Draw frame
        frame = np.full((height, width, 3), (180, 200, 215), dtype=np.uint8)  # Atmosphere fog
        # Draw Asphalt Road through center
        road_pts = np.array([
            [-3.5, -20, 0.05], [3.5, -20, 0.05],
            [3.5, 120, 0.05], [-3.5, 120, 0.05]
        ])
        proj_road, val_road, _ = project(road_pts)
        if np.all(val_road):
            cv2.fillPoly(frame, [proj_road.astype(np.int32)], (60, 60, 65))
        # Project and draw ground terrain points
        g_pts = np.array([pt[0] for pt in ground_features])
        proj_g, val_g, depths_g = project(g_pts)
        for i in range(len(proj_g)):
            if val_g[i]:
                u, v = int(proj_g[i, 0]), int(proj_g[i, 1])
                if 0 <= u < width and 0 <= v < height:
                    cv2.circle(frame, (u, v), max(1, int(12 / depths_g[i])), ground_features[i][1], -1)
        # Render 3D Buildings (Walls & Roofs sorted by depth)
        for b in building_faces:
            # Roof
            proj_roof, val_roof, depths_roof = project(b["roof"])
            if np.all(val_roof):
                roof_poly = proj_roof.astype(np.int32)
                # Shaded top
                cv2.fillPoly(frame, [roof_poly], b["color"])
                cv2.polylines(frame, [roof_poly], True, (40, 40, 40), 2)
                # Rooftop feature units (HVAC/Solar panels for SIFT feature detection)
                for f_pos, f_col in b["roof_features"]:
                    proj_f, val_f, _ = project(np.array([f_pos]))
                    if val_f[0]:
                        fu, fv = int(proj_f[0, 0]), int(proj_f[0, 1])
                        if 0 <= fu < width and 0 <= fv < height:
                            cv2.rectangle(frame, (fu - 3, fv - 3), (fu + 3, fv + 3), f_col, -1)
        out.write(frame)
        # Write true DJI-spec SRT Subtitle entry every second
        if f % fps == 0:
            sec = f // fps
            # Convert metric Y displacement to WGS84 latitude delta (~1m = 0.000009 deg)
            current_lat = base_lat + (cam_y * 0.000009)
            current_lon = base_lon + (cam_x * 0.000009)
            
            srt_entries.append(
                f"{sec + 1}\n"
                f"00:00:{sec:02d},000 --> 00:00:{sec+1:02d},000\n"
                f"<font size=\"28\">SrtToolVersion : 1.0\n"
                f"[latitude: {current_lat:.6f}] [longitude: {current_lon:.6f}] [rel_alt: {cam_z:.2f} abs_alt: {cam_z + 520.0:.2f}] "
                f"[pitch: {pitch_deg:.1f}] [roll: 0.0] [yaw: {np.degrees(yaw_rad):.1f}] [focal_length: 24.00] "
                f"[dji_time: 2026-09-28 10:15:{sec:02d}]</font>\n\n"
            )
    out.release()
    with open(srt_path, "w") as srt_file:
        srt_file.writelines(srt_entries)
    
    # Web-Compatible H.264 Conversion
    h264_path = video_path.replace(".mp4", "_h264.mp4")
    os.system(f'ffmpeg -y -i "{video_path}" -vcodec libx264 "{h264_path}" -loglevel error')
    os.replace(h264_path, video_path)
    
    print(f"Generated web-compatible perspective 3D dataset:\n - Video: {video_path}\n - Telemetry: {srt_path}")
generate_drone_photogrammetry_scene()
