### 1. System Architecture & Tech Stack

The platform utilizes a decoupled edge-compute architecture, separating the heavy computer vision processing from the lightweight presentation layer.

| Component | Technology Choice |
| --- | --- |
| **Frontend Dashboard** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **3D Web Viewer** | React Three Fiber (Three.js) for WebGL rendering |
| **Backend & Orchestration** | FastAPI (Python) for asynchronous task queuing |
| **Computer Vision Engine** | OpenCV (Frame extraction, blur detection) |
| **3D Generation Pipeline** | COLMAP (SfM) + Nerfstudio / Gaussian Splatting |
| **Database & Storage** | Supabase (PostgreSQL) & Supabase Storage Vault |

### 2. Processing Pipeline (Data Flow)

1. **Ingestion:** User uploads a raw drone video via the Next.js frontend. The file is streamed to the FastAPI backend.
2. **Pre-processing (OpenCV):** The Python backend calculates the Laplacian variance of the video frames to detect and drop motion blur. It extracts sharp keyframes at optimal intervals.
3. **Feature Matching (COLMAP):** The system uses Structure-from-Motion (SfM) to identify common pixels (SIFT/ORB features) across the sequential frames to calculate the camera's trajectory and pose.
4. **Neural Rendering:** The calculated poses and images are fed into a 3D Gaussian Splatting or dense mesh generation algorithm to build the 3D geometry.
5. **Optimization & Storage:** The output (`.ply`, `.obj`, or `.splat`) is optimized for web delivery and securely uploaded to a Supabase Storage bucket.
6. **Visualization:** The Next.js client fetches the 3D asset URL and renders it interactively using React Three Fiber.

### 3. Database Schema (PostgreSQL)

The relational database tracks missions, uploaded assets, and the processing status of the 3D generation queue.

* **`users` Table:**
* `id` (UUID, Primary Key)
* `clearance_level` (VARCHAR)
* `unit_assignment` (VARCHAR)


* **`missions` Table:**
* `mission_id` (UUID, Primary Key)
* `user_id` (Foreign Key -> `users.id`)
* `mission_name` (VARCHAR)
* `location_metadata` (JSONB - optional GPS data)
* `created_at` (TIMESTAMPTZ)


* **`recon_assets` Table:**
* `asset_id` (UUID, Primary Key)
* `mission_id` (Foreign Key -> `missions.mission_id`)
* `raw_video_url` (VARCHAR)
* `processed_3d_url` (VARCHAR)
* `processing_status` (ENUM: 'Pending', 'Extracting', 'Rendering', 'Complete')
* `mesh_vertex_count` (INT)



### 4. Security & Compliance

* **Stateless Compute:** To comply with defense data handling standards, the FastAPI worker nodes must operate statelessly. Raw video chunks and temporary image frames are permanently purged from the server RAM and disk the moment the final 3D asset is compiled.
* **Authentication:** Supabase Auth with Row Level Security (RLS) ensures that intelligence personnel can only access 3D maps tied to their specific unit or mission ID.
* **Progressive Loading:** To handle low-bandwidth tactical networks, the Next.js 3D viewer implements Level of Detail (LOD) streaming, loading a low-polygon proxy mesh first before layering high-resolution textures.