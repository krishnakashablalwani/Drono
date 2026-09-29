"""Debug script to trace exactly where the SfM pipeline fails."""
import os, sys, cv2, numpy as np

sys.path.append(os.path.join(os.getcwd(), 'ai_services'))

video_path = os.path.abspath(os.path.join(os.getcwd(), "web", "public", "sample_videos", "DJI_0317_corridor.mp4"))
print(f"Video: {video_path}")
print(f"Exists: {os.path.exists(video_path)}")

cap = cv2.VideoCapture(video_path)
print(f"Opened: {cap.isOpened()}")

frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
w_orig = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h_orig = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"Frame count: {frame_count}, FPS: {fps}, Resolution: {w_orig}x{h_orig}")

# Extract 3 keyframes with the same logic
mid_idx = int(frame_count * 0.5)
stride = 20
idx_list = [mid_idx - stride, mid_idx, mid_idx + stride]
idx_list = [max(0, min(frame_count - 1, idx)) for idx in idx_list]
print(f"Frame indices: {idx_list}")

frames = []
for idx in idx_list:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ret, frame = cap.read()
    if not ret:
        print(f"  Failed to read frame {idx}")
        break
    h, w = frame.shape[:2]
    target_w = 640
    scale = target_w / w
    frame = cv2.resize(frame, (target_w, int(h * scale)), interpolation=cv2.INTER_AREA)
    frames.append(frame)
    print(f"  Frame {idx}: shape={frame.shape}")

cap.release()

h, w = frames[0].shape[:2]
focal_length = 1450.0 * (w / 1920.0)
print(f"\nScaled focal length: {focal_length}")
K = np.array([
    [focal_length, 0, w / 2.0],
    [0, focal_length, h / 2.0],
    [0, 0, 1]
], dtype=np.float64)
print(f"K:\n{K}")

# Feature extraction
sift = cv2.SIFT_create(nfeatures=20000, contrastThreshold=0.02)

gray_left = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
kp_left, des_left = sift.detectAndCompute(gray_left, None)
print(f"\nLeft keypoints: {len(kp_left)}")

gray_mid = cv2.cvtColor(frames[1], cv2.COLOR_BGR2GRAY)
kp_mid, des_mid = sift.detectAndCompute(gray_mid, None)
print(f"Mid keypoints: {len(kp_mid)}")

gray_right = cv2.cvtColor(frames[2], cv2.COLOR_BGR2GRAY)
kp_right, des_right = sift.detectAndCompute(gray_right, None)
print(f"Right keypoints: {len(kp_right)}")

bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)

# Match Mid -> Left
matches_L = bf.knnMatch(des_mid, des_left, k=2)
pts_mid_L, pts_left = [], []
idx_L = []
for m, n in matches_L:
    if m.distance < 0.75 * n.distance:
        pts_mid_L.append(kp_mid[m.queryIdx].pt)
        pts_left.append(kp_left[m.trainIdx].pt)
        idx_L.append(m.queryIdx)
print(f"\nMid->Left good matches: {len(pts_mid_L)}")

# Match Mid -> Right
matches_R = bf.knnMatch(des_mid, des_right, k=2)
pts_mid_R, pts_right = [], []
idx_R = []
for m, n in matches_R:
    if m.distance < 0.75 * n.distance:
        pts_mid_R.append(kp_mid[m.queryIdx].pt)
        pts_right.append(kp_right[m.trainIdx].pt)
        idx_R.append(m.queryIdx)
print(f"Mid->Right good matches: {len(pts_mid_R)}")

# Common features
common_idx = set(idx_L).intersection(set(idx_R))
print(f"Common tracked features across 3 frames: {len(common_idx)}")

pts_L_final, pts_M_final, pts_R_final = [], [], []
for qIdx in common_idx:
    i_L = idx_L.index(qIdx)
    i_R = idx_R.index(qIdx)
    pts_L_final.append(pts_left[i_L])
    pts_M_final.append(pts_mid_L[i_L])
    pts_R_final.append(pts_right[i_R])

pts_L = np.array(pts_L_final, dtype=np.float64)
pts_M = np.array(pts_M_final, dtype=np.float64)
pts_R = np.array(pts_R_final, dtype=np.float64)
print(f"pts_L: {pts_L.shape}, pts_M: {pts_M.shape}, pts_R: {pts_R.shape}")

if len(pts_M) < 20:
    print("ERROR: Not enough common features tracked across frames")
    sys.exit(1)

# Pose recovery Left -> Mid
E_LM, mask_LM = cv2.findEssentialMat(pts_L, pts_M, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
print(f"\nEssential Matrix LM shape: {E_LM.shape if E_LM is not None else 'None'}")
print(f"LM inliers: {np.sum(mask_LM)} / {len(mask_LM)}")

_, R_LM, t_LM, pose_mask_LM = cv2.recoverPose(E_LM, pts_L, pts_M, K)
print(f"RecoverPose LM inliers: {np.sum(pose_mask_LM)} / {len(pose_mask_LM)}")

# Pose recovery Mid -> Right
E_MR, mask_MR = cv2.findEssentialMat(pts_M, pts_R, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
print(f"\nEssential Matrix MR shape: {E_MR.shape if E_MR is not None else 'None'}")
print(f"MR inliers: {np.sum(mask_MR)} / {len(mask_MR)}")

_, R_MR, t_MR, pose_mask_MR = cv2.recoverPose(E_MR, pts_M, pts_R, K)
print(f"RecoverPose MR inliers: {np.sum(pose_mask_MR)} / {len(pose_mask_MR)}")

# Check the combined inlier mask
valid_mask = (pose_mask_LM.ravel() > 0) & (pose_mask_MR.ravel() > 0)
print(f"\nCombined valid inliers: {np.sum(valid_mask)} / {len(valid_mask)}")

pts_L_valid = pts_L[valid_mask]
pts_M_valid = pts_M[valid_mask]
pts_R_valid = pts_R[valid_mask]
print(f"After filtering: pts_L={pts_L_valid.shape}, pts_M={pts_M_valid.shape}, pts_R={pts_R_valid.shape}")

if len(pts_L_valid) < 10:
    print("\n*** THIS IS WHERE IT FAILS: Too few inliers after pose recovery ***")
    print(f"pose_mask_LM sum: {np.sum(pose_mask_LM.ravel() > 0)}")
    print(f"pose_mask_MR sum: {np.sum(pose_mask_MR.ravel() > 0)}")
    print(f"Intersection: {np.sum(valid_mask)}")
    print(f"\nRoot cause: stride={stride} frames apart may be too small for a drone video")
    print("The frames are too similar, resulting in near-zero baselines and degenerate essential matrices.")
