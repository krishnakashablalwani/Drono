import os
import cv2
import numpy as np

def generate_drone_dataset(filename, mode="linear", duration_sec=10, fps=30):
    os.makedirs("drone_samples", exist_ok=True)
    video_path = f"drone_samples/{filename}.mp4"
    srt_path = f"drone_samples/{filename}.srt"
    total_frames = duration_sec * fps
    out = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (1280, 720))
    base_lat, base_lon, base_alt = 17.385044, 78.486671, 45.0
    srt_entries = []
    
    for f in range(total_frames):
        t = f / fps
        frame = np.full((720, 1280, 3), 40, dtype=np.uint8)
        # Dynamic trajectories
        if mode == "linear":
            lat = base_lat + (t * 0.00003)
            lon = base_lon + (t * 0.00001)
            alt = base_alt + (t * 0.2)
            yaw = 45.0
            # Visual scene: moving terrain grid and simulated building facades
            offset = int(t * 40)
            cv2.rectangle(frame, (400 - offset, 250), (600 - offset, 450), (100, 180, 240), -1)
            cv2.rectangle(frame, (750 - offset, 200), (900 - offset, 500), (120, 220, 120), -1)
        elif mode == "orbit":
            radius = 0.0002
            angle = (t / duration_sec) * 2 * np.pi
            lat = base_lat + radius * np.cos(angle)
            lon = base_lon + radius * np.sin(angle)
            alt = base_alt + 5.0
            yaw = float((angle * 180 / np.pi) % 360)
            # Visual scene: orbiting a central landmark
            cx, cy = int(640 + 80 * np.cos(angle)), int(360 + 40 * np.sin(angle))
            cv2.circle(frame, (cx, cy), 90, (0, 140, 255), -1)
        elif mode == "ascending":
            lat = base_lat + (t * 0.00001)
            lon = base_lon
            alt = base_alt + (t * 1.5) # Climbing rapidly
            yaw = 0.0
            scale = max(0.2, 1.0 - (t * 0.05))
            cv2.rectangle(frame, (int(500 * scale), 300), (int(780 * scale), 480), (180, 100, 220), -1)
        
        # Background grid to supply SIFT feature correspondences
        for x in range(0, 1280, 60):
            cv2.line(frame, (x, 0), (x, 720), (70, 70, 70), 1)
        for y in range(0, 720, 60):
            cv2.line(frame, (0, y), (1280, y), (70, 70, 70), 1)
            
        out.write(frame)
        
        # Telemetry logged at 1-second intervals (Standard DJI format)
        if f % fps == 0:
            sec = f // fps
            srt_entries.append(
                f"{sec + 1}\n"
                f"00:00:{sec:02d},000 --> 00:00:{sec+1:02d},000\n"
                f"[latitude: {lat:.6f}] [longitude: {lon:.6f}] [altitude: {alt:.2f}] "
                f"[pitch: -45.0] [roll: 0.0] [yaw: {yaw:.1f}]\n\n"
            )
            
    out.release()
    with open(srt_path, "w") as srt_file:
        srt_file.writelines(srt_entries)
    print(f"Generated: {video_path} + {srt_path}")

if __name__ == "__main__":
    # Generate 3 distinct flight datasets
    generate_drone_dataset("flight_01_transect", mode="linear", duration_sec=12)
    generate_drone_dataset("flight_02_orbit", mode="orbit", duration_sec=15)
    generate_drone_dataset("flight_03_ascending", mode="ascending", duration_sec=10)
