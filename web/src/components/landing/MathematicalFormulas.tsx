"use client";

import React from "react";
import { Binary, Sigma, Compass, Layers, Shield } from "lucide-react";

interface FormulaItem {
  number: string;
  title: string;
  category: string;
  formula: string;
  variables: { name: string; description: string }[];
  explanation: string;
  tacticalRelevance: string;
}

const FORMULAS: FormulaItem[] = [
  {
    number: "01",
    title: "Discrete 2D Laplacian Variance (Blur Discrimination)",
    category: "Optics & Vision",
    formula: "Var(∇²I) = (1 / WH) ∑_{x,y} [ ∇²I(x,y) - μ ]²",
    variables: [
      { name: "∇²I(x,y)", description: "Convolution of grayscale image with discrete kernel [[0,1,0],[1,-4,1],[0,1,0]]" },
      { name: "μ", description: "Mean response of the Laplacian operator across all pixels" },
      { name: "WH", description: "Image resolution width and height (e.g. 3840 × 2160 for 4K frames)" },
    ],
    explanation:
      "Sharp edges in drone video produce extreme second-derivative spikes, yielding high variance. When aerodynamic buffeting or rotor vibration blurs a frame, edge transitions soften and the variance drops below threshold τ (100-160).",
    tacticalRelevance:
      "Prevents degraded keyframes from introducing catastrophic drift into the visual odometry pose graph, while maintaining minimum 70% baseline overlap between adjacent frames.",
  },
  {
    number: "02",
    title: "Ground Sample Distance (GSD Metrology)",
    category: "Photogrammetry",
    formula: "GSD = (H · S_w) / (F · I_w)   ⟹   2.22 cm/px at H = 65m",
    variables: [
      { name: "H", description: "Flight altitude above ground level (AGL) in meters (65.0 m nominal)" },
      { name: "S_w", description: "Physical sensor width of drone camera (6.4 mm for 1/2.3-inch CMOS)" },
      { name: "F", description: "Focal length of UAV optical lens (8.8 mm prime)" },
      { name: "I_w", description: "Horizontal pixel width of the sensor array (3840 pixels)" },
    ],
    explanation:
      "Defines the real-world distance represented by each image pixel on the terrain surface. Accompanying barometric telemetry fixes scale without requiring surveyed ground control targets.",
    tacticalRelevance:
      "Enables commanders to measure bridge spans, road chokepoints, and building heights with sub-meter metric reliability directly in the browser.",
  },
  {
    number: "03",
    title: "Bilinear Heightmap Interpolation (2D Elevation Slicer)",
    category: "Topography & Hypsometry",
    formula: "Y(x, z) = (1 - Δr)[(1 - Δc)Y₀₀ + Δc Y₁₀] + Δr[(1 - Δc)Y₀₁ + Δc Y₁₁]",
    variables: [
      { name: "c, r", description: "Continuous grid coordinates derived from world coordinates x and z" },
      { name: "Δc, Δr", description: "Fractional offsets: Δc = c - ⌊c⌋, Δr = r - ⌊r⌋" },
      { name: "Y₀₀, Y₁₀, Y₀₁, Y₁₁", description: "Elevations at the four enclosing vertices of the grid cell" },
    ],
    explanation:
      "Computes smooth, continuous elevation values at any arbitrary floating-point coordinate along a user-drawn transect line across the 3D reconstructed mesh.",
    tacticalRelevance:
      "Powers the live 2D Elevation Cross-Section Profile chart, exposing hidden terrain crests, gradient percentages, and dead-ground defilades for combat troops.",
  },
  {
    number: "04",
    title: "Parametric Line-of-Sight Raycasting",
    category: "Tactical Analytics",
    formula: "r(t) = p_{obs} + t · (p_{tgt} - p_{obs}),   t ∈ [0, 1]",
    variables: [
      { name: "p_{obs}", description: "3D coordinates of observation post or sniper vantage point" },
      { name: "p_{tgt}", description: "3D coordinates of friendly target, convoy, or patrol route" },
      { name: "r_y(t)", description: "Ray height at parameter t compared against terrain surface elevation Y(r_x, r_z)" },
    ],
    explanation:
      "Evaluates whether optical line-of-sight is unobstructed between two spatial coordinates by stepping along the ray and testing for intersection with terrain geometry or elevated structures.",
    tacticalRelevance:
      "Identifies blind spots where troops can maneuver unseen, or flags exposed positions vulnerable to direct enemy observation and sniper fire.",
  },
  {
    number: "05",
    title: "Multi-Objective Tactical Ingress Cost Function",
    category: "Stealth & Pathfinding",
    formula: "J(p_i, p_{i+1}) = D(p_i, p_{i+1}) + w_{slope} · max(0, ΔY)² + w_{vis} · ∑_k LOS(p_{i+1}, T_k)",
    variables: [
      { name: "D(p_i, p_{i+1})", description: "Euclidean ground distance between adjacent path nodes" },
      { name: "w_{slope}", description: "Energy expenditure penalty weight for steep uphill ascents" },
      { name: "w_{vis}", description: "Exposure penalty weight for nodes visible to hostile watchtowers T_k" },
      { name: "LOS(p, T_k)", description: "Binary indicator (1 if visible from watchtower k, 0 if occluded)" },
    ],
    explanation:
      "Integrated into the A* pathfinding graph search. The algorithm dynamically routes around exposed ridgelines, using valleys and depressions for maximum optical concealment.",
    tacticalRelevance:
      "Generates stealth ingress routes with quantified exposure scores, lowering casualty risks during hostile insertions.",
  },
];

export function MathematicalFormulas() {
  return (
    <section id="math-foundations" className="py-20 px-6 sm:px-8 max-w-[1200px] mx-auto border-t border-[var(--border-subtle)]">
      <div className="space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-sienna-brown)] font-semibold">
            ALGORITHMIC RIGOR
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-foreground tracking-[-0.015em]">
            Mathematical & <em>Geodetic Formulations</em>
          </h2>
          <p className="text-[17px] text-[var(--text-secondary)] font-sans-ui max-w-xl mx-auto leading-[1.45]">
            Every metric generated by Drono is derived from first-principles photogrammetry, computer vision, and geometric optimization.
          </p>
        </div>

        {/* 5 In-Depth Mathematical Cards */}
        <div className="space-y-6">
          {FORMULAS.map((item) => (
            <div
              key={item.number}
              className="neutral-card p-6 sm:p-8 space-y-6 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold px-2.5 py-1 rounded-md bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)]">
                    {item.number}
                  </span>
                  <h3 className="text-lg sm:text-xl font-medium text-foreground font-sans-ui">
                    {item.title}
                  </h3>
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-slate-gray)]">
                  {item.category}
                </span>
              </div>

              {/* Mathematical Expression Display Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] overflow-x-auto">
                <div className="text-xs font-mono text-[var(--color-slate-gray)] mb-1 uppercase tracking-wider">
                  Mathematical Expression
                </div>
                <code className="text-sm sm:text-base font-mono font-bold text-foreground text-indigo-400 dark:text-indigo-300">
                  {item.formula}
                </code>
              </div>

              {/* Variables and Explanation Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans-ui text-sm">
                {/* Left: Variables Table */}
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-slate-gray)]">
                    Variable Definitions
                  </div>
                  <div className="space-y-1.5">
                    {item.variables.map((v, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[var(--color-mist-gray)] text-xs">
                        <span className="font-mono font-semibold text-foreground mr-2">{v.name}:</span>
                        <span className="text-[var(--text-secondary)]">{v.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Technical Explanation & Tactical Relevance */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-slate-gray)]">
                      Operational Mechanics
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Tactical Relevance</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {item.tacticalRelevance}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
