import os
import cv2
import numpy as np

os.makedirs("test_data", exist_ok=True)
video_path = "test_data/sample.mp4"
srt_path = "test_data/sample.srt"

# 1. Generate a 10-second synthetic test video (30 FPS)
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(video_path, fourcc, 30.0, (1280, 720))

srt_lines = []
lat, lon, alt = 17.385044, 78.486671, 50.0  # Sample coordinates

for i in range(300):
    t_sec = i / 30.0
    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    
    # Draw geometric textured targets to give SIFT features to track
    cv2.rectangle(frame, (300 + int(i * 1.5), 200), (500 + int(i * 1.5), 400), (0, 255, 120), -1)
    cv2.circle(frame, (640, 360), 80, (200, 50, 200), -1)
    for grid_x in range(0, 1280, 80):
        cv2.line(frame, (grid_x, 0), (grid_x, 720), (50, 50, 50), 1)
        
    out.write(frame)

    # DJI-style SRT block per second
    if i % 30 == 0:
        sec = i // 30
        srt_lines.append(f"{sec + 1}\n")
        srt_lines.append(f"00:00:{sec:02d},000 --> 00:00:{sec+1:02d},000\n")
        srt_lines.append(
            f"[latitude: {lat + (i * 0.00002):.6f}] "
            f"[longitude: {lon + (i * 0.00002):.6f}] "
            f"[altitude: {alt + (i * 0.05):.2f}] "
            f"[pitch: -30.0] [roll: 0.0] [yaw: {i * 0.5:.1f}]\n\n"
        )

out.release()
with open(srt_path, "w") as f:
    f.writelines(srt_lines)

print("Synthesized sample.mp4 and sample.srt in ./test_data")
