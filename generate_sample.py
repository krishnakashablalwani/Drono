import cv2
import numpy as np
import os
import random
import subprocess

def generate_synthetic_data(output_dir=".", count=10):
    os.makedirs(output_dir, exist_ok=True)
    width, height = 640, 480
    fps = 30
    duration_sec = 5
    total_frames = fps * duration_sec
    
    # We will write to AVI first and then transcode to web-compatible MP4 using ffmpeg
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    
    for c in range(1, count + 1):
        temp_avi = os.path.join(output_dir, f"temp_{c:02d}.avi")
        video_path = os.path.join(output_dir, f"DJI_sample_{c:02d}.mp4")
        srt_path = os.path.join(output_dir, f"DJI_sample_{c:02d}.srt")
        
        # Distinct Features
        base_altitude = random.uniform(20.0, 150.0)
        base_pitch = random.uniform(-90.0, -5.0)
        base_roll = random.uniform(-10.0, 10.0)
        
        # Colors
        sky_color = (random.randint(200, 255), random.randint(150, 220), random.randint(100, 200))
        ground_color_1 = (random.randint(0, 100), random.randint(100, 200), random.randint(0, 100))
        ground_color_2 = (random.randint(0, 100), random.randint(50, 150), random.randint(0, 100))
        bldg_color = (random.randint(50, 150), random.randint(50, 150), random.randint(50, 150))
        
        out = cv2.VideoWriter(temp_avi, fourcc, fps, (width, height))
        
        print(f"Generating Sample {c:02d} (Alt: {base_altitude:.1f}m, Pitch: {base_pitch:.1f}deg)")
        
        with open(srt_path, "w", encoding="utf-8") as f:
            for i in range(total_frames):
                # 1. VIDEO FRAME
                frame = np.zeros((height, width, 3), dtype=np.uint8)
                
                # Dynamic horizon based on pitch (very rough approximation for visual variety)
                horizon = int(height / 2 + (base_pitch + 45) * 2) 
                horizon = max(0, min(height, horizon))
                
                # Sky
                frame[0:horizon, :] = sky_color
                
                # Ground
                offset = int((i * 5) % 100)
                for y in range(horizon, height, 20):
                    for x in range(0, width, 20):
                        if ((x + y + offset) // 20) % 2 == 0:
                            cv2.rectangle(frame, (x, y), (x+20, y+20), ground_color_1, -1)
                        else:
                            cv2.rectangle(frame, (x, y), (x+20, y+20), ground_color_2, -1)
                
                # Building
                bx = (width - i * 4) % (width + 100) - 50
                cv2.rectangle(frame, (bx, horizon - 50), (bx+100, horizon + 150), bldg_color, -1)
                
                out.write(frame)
                
                # 2. SRT TELEMETRY
                seq = i + 1
                ms_start = int((i / fps) * 1000)
                ms_end = int(((i + 1) / fps) * 1000)
                
                def format_ts(ms):
                    sec = (ms // 1000) % 60
                    m = (ms // 60000) % 60
                    h = (ms // 3600000)
                    milli = ms % 1000
                    return f"{h:02d}:{m:02d}:{sec:02d},{milli:03d}"
                
                # Add slight variations to telemetry over time
                alt = base_altitude + (i * 0.05) 
                pitch = base_pitch + (i * 0.01)
                roll = base_roll + math.sin(i * 0.1)
                
                telemetry_str = f"[latitude: 37.7749] [longitude: -122.4194] [rel_alt: {alt:.1f}] [gimbal_pitch: {pitch:.1f}] [gimbal_roll: {roll:.1f}] [gimbal_yaw: 90.0]"
                
                f.write(f"{seq}\n")
                f.write(f"{format_ts(ms_start)} --> {format_ts(ms_end)}\n")
                f.write(f"{telemetry_str}\n\n")
                
        out.release()
        
        print(f"Transcoding {temp_avi} to H.264 MP4...")
        if os.path.exists(video_path):
            os.remove(video_path)
        subprocess.run(['ffmpeg', '-i', temp_avi, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', video_path], 
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.remove(temp_avi)
        
    print("All 10 samples generated successfully.")

if __name__ == "__main__":
    import math
    generate_synthetic_data(r"d:\SIH-2\synthetic_samples_v2", count=10)
