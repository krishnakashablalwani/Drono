import os, sys
sys.path.append(os.path.join(os.getcwd(), 'ai_services'))
from pipeline.sfm_reconstruction import SfMReconstructionEngine

engine = SfMReconstructionEngine()

videos = [
    "sample_videos/DJI_0051_aerial.mp4",
    "sample_videos/DJI_0122_ridge_sweep.mp4",
    "sample_videos/DJI_0346_valley_survey.mp4",
]

for v in videos:
    path = os.path.abspath(v)
    print(f"\n{'='*60}")
    print(f"Testing: {os.path.basename(v)}")
    result = engine.synthesize_tactical_point_cloud(video_path=path)
    if "error" in result:
        print(f"  ERROR: {result['error']}")
    else:
        print(f"  SUCCESS: {result['point_count']} points")
