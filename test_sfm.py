import os
import sys

# Add the pipeline directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'ai_services'))

from pipeline.sfm_reconstruction import SfMReconstructionEngine

engine = SfMReconstructionEngine()
video_path = os.path.abspath(os.path.join(os.getcwd(), "web", "public", "sample_videos", "DJI_0317_corridor.mp4"))
print(f"Testing with video path: {video_path}")

result = engine.synthesize_tactical_point_cloud(video_path=video_path)

if "error" in result:
    print(f"Error: {result['error']}")
else:
    print(f"Success! Point count: {result.get('point_count')}")
    print(f"Vertices length: {len(result.get('vertices', []))}")
    print(f"Colors length: {len(result.get('colors', []))}")
