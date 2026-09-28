import os
import cv2
import numpy as np

def generate_all(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Generate Demo MP4
    video_path = os.path.join(output_dir, 'demo.mp4')
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, 30.0, (640, 480))
    
    for i in range(60):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # draw something moving
        cv2.circle(frame, (320 + i*5, 240), 50, (0, 255, 0), -1)
        # add texture so SIFT finds something
        noise = np.random.randint(0, 50, (480, 640, 3), dtype=np.uint8)
        frame = cv2.add(frame, noise)
        out.write(frame)
    out.release()
    
    # 2. Generate Demo SRT
    srt_path = os.path.join(output_dir, 'demo.srt')
    with open(srt_path, 'w') as f:
        for i in range(60):
            lat = 34.0 + i * 0.0001
            lon = -118.0 + i * 0.0001
            alt = 50.0
            
            time_start = i * 33
            time_end = (i+1) * 33
            
            f.write(f"{i+1}\n")
            f.write(f"00:00:00,{time_start:03d} --> 00:00:00,{time_end:03d}\n")
            f.write(f'<font size="28">SrtCnt : {i}, DiffTime : 33ms\n')
            f.write(f'2023-01-01 12:00:00,000\n')
            f.write(f'[iso : 100] [shutter : 1/1000.0] [fnum : 2.8] [ev : 0] [color_md : default] [focal_len : 24.00] [latitude: {lat}] [longitude: {lon}] [rel_alt: {alt} abs_alt: {alt+10}] </font>\n\n')

if __name__ == "__main__":
    generate_all("test_data")
