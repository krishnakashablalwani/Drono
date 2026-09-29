import os
import requests
import time

def test_upload(video_path, srt_path):
    print(f"Testing {os.path.basename(video_path)}...")
    url = "http://localhost:8000/api/pipeline/upload-video"
    
    try:
        with open(video_path, 'rb') as v, open(srt_path, 'rb') as s:
            files = {
                'video': (os.path.basename(video_path), v, 'video/mp4'),
                'srt': (os.path.basename(srt_path), s, 'text/plain')
            }
            response = requests.post(url, files=files)
            
            if response.status_code == 200:
                print(f"  [SUCCESS] {response.json()}")
            else:
                print(f"  [FAILED] HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"  [ERROR] {e}")

if __name__ == "__main__":
    # Test synthetic samples
    syn_dir = r"d:\SIH-2\synthetic_samples_v2"
    if os.path.exists(syn_dir):
        for i in range(1, 11):
            vid = os.path.join(syn_dir, f"DJI_sample_{i:02d}.mp4")
            srt = os.path.join(syn_dir, f"DJI_sample_{i:02d}.srt")
            if os.path.exists(vid) and os.path.exists(srt):
                test_upload(vid, srt)
                
    # Test KABR sample if downloaded
    kabr_srt = r"d:\SIH-2\test.srt"
    # we don't have the MP4 downloaded yet, let's just test with a synthetic MP4 and the KABR SRT to test parsing
    syn_vid = os.path.join(syn_dir, "DJI_sample_01.mp4")
    if os.path.exists(kabr_srt) and os.path.exists(syn_vid):
        print("\nTesting KABR SRT Telemetry parsing...")
        test_upload(syn_vid, kabr_srt)
