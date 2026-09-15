"use client";

import React from "react";
import Link from "next/link";

const FEATURES = [
  {
    category: "Topography & Profiling",
    title: "2D Elevation Transect Slicer",
    description:
      "Slice arbitrary cross-sections across the 3D terrain mesh. Bilinear heightmap interpolation samples continuous elevation profiles, exposing terrain crests, slope angles, and elevation gain/loss.",
  },
  {
    category: "Optics & Vision",
    title: "Laplacian Blur Discrimination",
    description:
      "Calculates the discrete 2D Laplacian operator variance (∇²I) across every video frame to discard motion blur caused by aerodynamic vibrations while retaining maximum baseline overlap.",
  },
  {
    category: "Tactical Navigation",
    title: "Ingress & Stealth Pathfinding",
    description:
      "Autonomous A* routing across elevation contours, dynamically navigating terrain valleys and depressions to minimize optical exposure to hostile observation watchtowers.",
  },
  {
    category: "Multi-Spectral Vision",
    title: "FLIR Thermal & NVG Shading",
    description:
      "Toggle instantly between true-color photogrammetry, FLIR thermal infrared heatmaps (8-14 µm emulation), and high-gain green phosphor Night Vision Goggles for low-light reconnaissance.",
  },
  {
    category: "Commander AI",
    title: "Groq LPU Tactical AI SITREP",
    description:
      "Generates military-doctrine Situation Reports (SITREPs) in 1.2 seconds from reconstructed 3D terrain metrics and topological vantage points via Groq LPUs.",
  },
  {
    category: "3D Interoperability",
    title: "Wavefront OBJ & Stanford PLY Export",
    description:
      "Download watertight 3D meshes (.OBJ) and dense colored point clouds (.PLY) directly to local storage for integration into GIS systems, Unreal Engine, and tactical flight simulators.",
  },
  {
    category: "Geospatial",
    title: "GPS-Denied Visual Odometry",
    description:
      "Synthesizes relative 3D camera poses and terrain topology purely through visual feature matching, maintaining mission success when electronic jamming disables satellite GPS.",
  },
  {
    category: "Photogrammetry",
    title: "Sub-Meter Metric Scaling",
    description:
      "Achieves sub-2.5cm Ground Sample Distance (GSD) accuracy fused with barometric altitude without requiring physical ground survey markers.",
  },
  {
    category: "Inspection",
    title: "3D Calipers & Line-of-Sight",
    description:
      "Click-to-measure 3D Euclidean distance, ground distance, slope gradients, and calculate line-of-sight raycasting between observer and target across occluding ridges.",
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
