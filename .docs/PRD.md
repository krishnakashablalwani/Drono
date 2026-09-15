### 1. Executive Summary

**AeroMesh** is a tactical reconnaissance platform designed for the National Technical Research Organisation (NTRO) under SIH26158. It ingests raw, single-pass drone video footage and automatically generates accurate, interactive 3D terrain models. Built for high-speed intelligence gathering, the system bypasses the need for complex, multi-pass grid flights, delivering actionable 3D geospatial intelligence directly to a standard web browser without requiring heavy desktop software.

### 2. Problem Statement & Objective

* **The Problem:** Traditional photogrammetry requires drones to loiter and fly precise grid patterns to capture overlapping images, which increases the risk of interception in hostile environments. Furthermore, processing this data requires hours of compute time and heavy on-premise software.
* **The Objective:** Develop a "shoot-and-scoot" intelligence pipeline. The drone flies a single, straight-line pass over a target, and the software algorithmically extracts depth and structure from the video feed, rapidly rendering a 3D tactical map for immediate browser-based viewing by field commanders.

### 3. Target Audience

* **Primary:** NTRO Analysts, Defense Intelligence Agencies, and Forward Operating Base (FOB) Commanders.
* **Secondary:** National Disaster Response Force (NDRF) for rapid damage assessment of critical infrastructure (e.g., collapsed bridges or dams).

### 4. Core Features & Functionality

* **Intelligent Frame Extraction:** Automatically parses MP4/MOV files, discarding blurry frames and extracting optimal keyframes based on spatial overlap.
* **GPS-Denied Processing:** Capable of generating relative 3D topology purely through visual odometry and feature matching, crucial for electronically jammed environments.
* **Browser-Based WebGL Viewer:** Renders massive 3D point clouds, meshes, or Gaussian Splats directly in the browser with measurement tools (distance, elevation).
* **Air-Gapped Readiness:** Designed as a containerized architecture that can be deployed on secure, closed-loop military intranets with zero dependency on external cloud APIs.