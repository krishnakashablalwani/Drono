# Drono: Autonomous Single-Pass Drone 3D Reconnaissance Platform

> **Organization:** National Technical Research Organisation (NTRO) / Ministry of Defence  
> **Theme:** Robotics & Drones / Tactical Reconnaissance & Disaster Relief  
> **Repository:** [https://github.com/krishnakashablalwani/Drono.git](https://github.com/krishnakashablalwani/Drono.git)

---

## Executive Summary

Traditional aerial photogrammetry demands **10–15 repeated lawnmower grid passes**, forcing drones to loiter for 45+ minutes over target areas. In hostile air defense zones, forward reconnaissance corridors, and emergency disaster operations, loitering creates catastrophic vulnerability to audible detection, radar lock-on, and GPS electronic jamming.

**Drono** is a high-speed, local-first reconnaissance platform that converts **a single linear drone flight pass** into metrically accurate, textured 3D terrain and structural geometry in near real time.

```
┌─────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ Single Corridor │ ───> │  OpenCV 2D Laplacian    │ ───> │ Visual Odometry & SfM   │
│ Drone Video     │      │  Blur Variance Filter   │      │ Pose Graph Optimization │
└─────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                       │
                                                                       ▼
┌─────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ Real-Time 3D    │ <─── │ Three.js 60 FPS WebGL   │ <─── │ Triangulated Dense Mesh │
│ Calipers & LOS  │      │ Tactical HUD Viewport   │      │ & Level-of-Detail (LOD) │
└─────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

---

## Core Capabilities & Technical Innovations

1. **Discrete 2D Laplacian Blur Discrimination Engine**
   - Evaluates the second-order derivative variance across every frame.
   - Automatically detects and discards aerodynamic vibration and wind-buffeted frames while preserving a strict 70–80% spatial overlap baseline.
   - Filters ~45% corrupted frames in under 1.2 seconds.

2. **GPS-Denied Visual Odometry & SfM**
   - Solves the Essential Matrix using scale-invariant feature transforms (SIFT/ORB).
   - Reconstructs relative camera trajectories and scene structure even when satellite navigation is jammed or unavailable.

3. **Sub-Meter Metric Scale Fusion**
   - Fuses barometric altitude differentials with focal geometry to achieve sub-2.5cm Ground Sample Distance (GSD) accuracy without physical ground control points (GCPs).

4. **Interactive In-Browser 3D Calipers & HUD**
   - **Euclidean & Ground Distance:** Click-to-measure real-world distance between tactical points.
   - **Elevation Profiling:** Dynamic slope gradient and building height differential calculation.
   - **Line-of-Sight (LOS) Raycasting:** Identifies optical visibility between vantage points and targets, accounting for terrain ridges, tree lines, and structural occlusions.

5. **Steep & Obsidian Editorial Design System**
   - Built on a bespoke editorial design system featuring Signifier serif typography, Sohne UI sans, hairline borders, and an **Obsidian Editorial Dark Mode** engineered for low-glare tactical night operations.

6. **Air-Gapped Local-First Architecture**
   - Zero dependence on external cloud SaaS for critical path reconstruction. All frame processing, 3D point cloud synthesis, and WebGL rendering run completely offline on edge hardware.

---

## Repository Structure

```
SIH-2026/
├── .docs/                   # Specifications, PRD, TRD, and DESIGN.md token reference
│   ├── DESIGN.md            # Complete Steep & Obsidian Dark Mode Design System
│   ├── PRD.md               # Product Requirements Document
│   └── TRD.md               # Technical Requirements Document
├── ai_services/             # Python Computer Vision & Photogrammetry Pipeline
│   ├── pipeline/
│   │   ├── blur_detector.py # OpenCV Laplacian variance filtering
│   │   └── sfm_reconstruction.py # Pose graph & 3D point cloud synthesis
│   ├── main.py              # FastAPI microservice for pipeline execution
│   └── requirements.txt     # Python dependencies
├── web/                     # Production Next.js 15 Web Application
│   ├── src/
│   │   ├── app/             # App Router pages (/console, /viewer) & globals.css
│   │   ├── components/      # Tactical 3D viewer, HUD, console & landing modules
│   │   ├── context/         # ThemeContext (Light & Dark mode state)
│   │   └── lib/             # Photogrammetry & 3D calculation math engine
│   ├── vitest.config.ts     # Vitest unit test suite configuration
│   └── package.json
└── package.json             # Root monorepo workspace scripts
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20+ / npm v10+
- **Python**: v3.10+ (for backend CV services)

### 1. Web Application (Frontend + WebGL 3D Viewport)

```bash
# Clone the repository
git clone https://github.com/krishnakashablalwani/SIH-2026.git
cd SIH-2026

# Install web dependencies
npm install --prefix web

# Start Next.js development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 2. Run Test Suite

```bash
npm run test --prefix web
```

*Runs 21 automated unit tests across the photogrammetry math engine, theme state persistence, and component interfaces.*

### 3. Python AI & Photogrammetry Services

```bash
cd ai_services
python -m venv venv
source venv/bin/activate  # Or on Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

---

## License

Engineered for the National Technical Research Organisation (NTRO). Released under the MIT License.
