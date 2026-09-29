"use client";

import React from "react";
import Link from "next/link";

const FEATURES = [
  {
    category: "Aeromesh Dual-Core Backend",
    title: "DJI Telemetry Parser & Projection",
    description: "Parses DJI .srt logs in real-time. Dynamically calculates the correct UTM zone and uses pyproj to project WGS84 coordinates into a localized Cartesian Metric system (X, Y, Z in meters) relative to takeoff.",
  },
  {
    category: "Aeromesh Dual-Core Backend",
    title: "Blur & Spatial Baseline Filtering",
    description: "Uses 2D Discrete Laplacian Sharpness Variance to detect and drop wind-buffeted, blurry frames. Samples by Spatial Baseline (e.g., dropping frames unless the drone physically moved > 1.5m), eliminating hovering redundancy.",
  },
  {
    category: "Aeromesh Dual-Core Backend",
    title: "Metrically Scaled Visual Odometry",
    description: "Solves Monocular Scale Ambiguity by anchoring SIFT feature translation vectors directly against the real-world metric delta displacement from the GPS/Barometer logs.",
  },
  {
    category: "Aeromesh Dual-Core Backend",
    title: "Single-Pass Watertight Reconstruction",
    description: "Triangulates points with Open3D and uses Screened Poisson Surface Reconstruction (Depth 9) to procedurally close backside occlusions, producing a watertight manifold rather than a hollow paper-shell.",
  },
  {
    category: "Aeromesh Dual-Core Backend",
    title: "Zero-Failure Volumetric Fallback",
    description: "Intercepts feature starvation crashes (e.g., over water/snow) and dynamically generates a 3D volumetric scene using GPS depth priors, guaranteeing a renderable .glb without server errors.",
  },
  {
    category: "Aeromesh Dual-Core Backend",
    title: "Defense-Grade Artifact Generation",
    description: "Interpolates 3D Z-vertices to export 32-bit Float DEMs as GeoTIFFs, generates 6-DOF GeoJSON trajectories, and synthesizes automated Markdown SITREPs with tactical metrics.",
  },
  {
    category: "Digital Twin Frontend",
    title: "Dual Ingress & Demo Bootstrapper",
    description: "Accepts simultaneous drag-and-drop of .mp4 and .srt files. Includes an automated synthetic data generator to load and run full operational demos instantly without digging for files.",
  },
  {
    category: "Digital Twin Frontend",
    title: "Live WebSocket Telemetry HUD",
    description: "Binds a live WebSocket connection to stream real-time pipeline stages (Parsing → Filtering → Odometry → Densification → DEM) with dynamic diagnostic readouts and progress bars.",
  },
  {
    category: "Digital Twin Frontend",
    title: "Interactive 3D Canvas",
    description: "Native 60 FPS WebGL rendering via @react-three/fiber. Renders meshes with backface culling explicitly disabled for solid structures and overlays the drone's flight path as a 3D spline trajectory.",
  },
  {
    category: "Digital Twin Frontend",
    title: "Tactical Shader Modes",
    description: "Reactive shaders that instantly swap the rendering of the mesh between standard textured geometry, solid red tactical override heatmap, and custom green-phosphor FLIR thermal/night vision.",
  },
  {
    category: "Digital Twin Frontend",
    title: "Export Drawer",
    description: "One-click downloads dynamically linked to the completed pipeline outputs, allowing immediate extraction of .GLB, .PLY, GeoTIFF DEM, GeoJSON, and SITREP.md files.",
  },
  {
    category: "Digital Twin Frontend",
    title: "Port-Collision Safety",
    description: "Fully wired with error boundary states to catch backend drops and automatically shift to Port 8001 to guarantee it boots cleanly on presentation machines.",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-20 px-6 sm:px-8 max-w-[1200px] mx-auto">
      <div className="space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-[14px] text-[var(--color-ash-gray)] uppercase tracking-wider font-sans-ui">
            Core Architecture
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-foreground tracking-[-0.015em]">
            Precision Engineering for <em>Aerial Intelligence</em>
          </h2>
          <p className="text-[17px] text-[var(--text-secondary)] font-sans-ui max-w-xl mx-auto leading-[1.45]">
            Delivering high-accuracy geospatial terrain modeling in seconds directly to browser environments.
          </p>
        </div>

        {/* 3-Column Neutral Feature Cards from DESIGN.md */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => (
            <div
              key={idx}
              className="neutral-card p-8 flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="space-y-3 font-sans-ui">
                {/* Category Label without badge from DESIGN.md */}
                <div className="text-[14px] text-[var(--color-ash-gray)]">
                  {feat.category}
                </div>
                <h3 className="text-[20px] font-medium text-foreground">
                  {feat.title}
                </h3>
                <p className="text-[16px] text-[var(--text-secondary)] leading-[1.5]">
                  {feat.description}
                </p>
              </div>

              {/* Text link with arrow suffix from DESIGN.md */}
              <div className="pt-2 text-[15px] text-foreground font-sans-ui">
                <Link href="/console" className="inline-flex items-center gap-1.5 hover:underline">
                  <span>Learn more</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
