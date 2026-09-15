"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Layers, Activity, ShieldCheck, Cpu } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export function HeroSection() {
  return (
    <section id="overview" className="relative pt-12 pb-24 px-6 sm:px-8 max-w-[1200px] mx-auto">
      <div className="space-y-16">
        {/* Editorial Headline Composition with Large Watermark Logo Behind Text */}
        <div className="relative text-center max-w-4xl mx-auto">
          {/* Large Clean Architectural Watermark Behind Hero Text */}
          <div
            aria-hidden="true"
            className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] sm:w-[620px] md:w-[780px] pointer-events-none select-none z-0 flex items-center justify-center"
          >
            {/* Soft Ambient Radial Light Halo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_65%)] blur-2xl pointer-events-none" />

            {/* Seamless Radial-Faded High-Res Vector Mark */}
            <div
              className="w-full h-auto aspect-[760/703] opacity-[0.07] dark:opacity-[0.11] transition-opacity duration-300"
              style={{
                maskImage: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)",
                WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)",
              }}
            >
              <BrandLogo size={780} className="w-full h-full" />
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            {/* Steep Signature Display: Regular 400 Serif with mid-sentence italic */}
            <h1 className="font-serif-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] text-foreground leading-[1.08] tracking-[-0.025em]">
              Reconstructing tactical terrain from a <em>single drone pass</em>.
            </h1>

            <p className="text-[17px] text-[var(--text-secondary)] font-sans-ui max-w-2xl mx-auto leading-[1.5]">
              Drono converts linear drone video into metrically accurate, textured 3D terrain in real time. Featuring 2D elevation transect slicing, discrete Laplacian blur filtering, A* stealth ingress routing, and Groq LPU-accelerated tactical situation reports.
            </p>

            {/* Color-Coded Tactical Capability Badges Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 pb-2">
              {[
                { name: "Single-Pass Video Ingestion", dot: "bg-emerald-500", hover: "hover:border-emerald-500/50" },
                { name: "2D Elevation Transect Slicer", dot: "bg-indigo-500", hover: "hover:border-indigo-500/50" },
              { name: "Discrete Laplacian Filter (∇²I)", dot: "bg-cyan-500", hover: "hover:border-cyan-500/50" },
              { name: "A* Ingress Route Planning", dot: "bg-amber-500", hover: "hover:border-amber-500/50" },
              { name: "Groq LPU AI SITREPs", dot: "bg-purple-500", hover: "hover:border-purple-500/50" },
              { name: "FLIR & NVG Shading", dot: "bg-rose-500", hover: "hover:border-rose-500/50" },
              { name: ".OBJ & .PLY 3D Export", dot: "bg-blue-500", hover: "hover:border-blue-500/50" },
            ].map((badge, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 text-[var(--color-slate-gray)] shadow-2xs hover:text-foreground transition-all duration-200 cursor-default ${badge.hover}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                <span>{badge.name}</span>
              </span>
            ))}
          </div>

          {/* Paired Pill Buttons with Shortcut Hints */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/console" className="btn-pill-filled group flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Launch Ingest Studio</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/20 dark:bg-black/20 rounded font-normal opacity-90">
                ⌥1
              </kbd>
            </Link>

            <Link href="/viewer" className="btn-pill-ghost group flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>Explore 3D Viewport</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--color-mist-gray)] rounded text-[var(--color-slate-gray)] font-normal">
                ⌥2
              </kbd>
            </Link>
          </div>
        </div>
      </div>

        {/* Executive Technical Specifications & Architecture Matrix (Replaces 3D Visualization) */}
        <div className="neutral-card p-6 sm:p-8 space-y-6 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/70 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] shrink-0 hidden sm:flex items-center justify-center shadow-2xs">
                <BrandLogo size={32} className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-sienna-brown)] font-semibold">
                  SYSTEM ARCHITECTURE MATRIX
                </div>
                <h2 className="text-xl sm:text-2xl font-serif-display text-foreground mt-1">
                  Single-Pass Tactical Reconnaissance Specifications
                </h2>
              </div>
            </div>
          </div>

          {/* 8-Grid In-Depth Architecture Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans-ui text-sm">
            {/* Spec 1: Video Ingest */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">01 / Ingestion</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                  Canvas WASM
                </span>
              </div>
              <div className="font-medium text-foreground">Video Stream Extraction</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Direct client-side ingestion of 4K/1080p MP4/MOV video at 60 FPS. Offscreen frame extraction with temporal metadata synchronization.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Input: Raw aerial video corridor
              </div>
            </div>

            {/* Spec 2: Blur Rejection */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">02 / Optics</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                  ∇²I Variance
                </span>
              </div>
              <div className="font-medium text-foreground">Discrete Laplacian Filter</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Calculates spatial derivative variance across each frame. Discards vibration-induced blur while preserving essential camera baseline overlap.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Threshold: τ = 100-160 Var(L)
              </div>
            </div>

            {/* Spec 3: Visual Odometry */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">03 / Navigation</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                  6-DOF Pose
                </span>
              </div>
              <div className="font-medium text-foreground">GPS-Denied Odometry</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Solves relative epipolar geometry to reconstruct camera trajectory [X, Y, Z, pitch, roll, yaw] without relying on jammed satellite GPS signals.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Accuracy: &lt;0.45 px reprojection
              </div>
            </div>

            {/* Spec 4: 3D Mesh Synthesis */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">04 / Geometry</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                  128k Polys
                </span>
              </div>
              <div className="font-medium text-foreground">Watertight Mesh & Grid</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Compiles dense vertex normals, elevation hypsometry, and synthetic building footprints into a metrically calibrated 3D terrain grid.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Scale: GSD 2.2 cm/pixel
              </div>
            </div>

            {/* Spec 5: 2D Elevation Slicer */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">05 / Hypsometry</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] font-medium">
                  2D Slicer
                </span>
              </div>
              <div className="font-medium text-foreground">Bilinear Transect Slicer</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Samples continuous elevation cross-sections across arbitrary cutlines. Computes slope degrees, crest points, elevation gain, and loss.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Resolution: 60 interpolated points
              </div>
            </div>

            {/* Spec 6: Tactical Ingress Routing */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">06 / Routing</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                  A* Stealth
                </span>
              </div>
              <div className="font-medium text-foreground">Stealth Ingress Pathfinding</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Calculates optimal low-exposure ingress paths through topographical depressions and valleys, avoiding hostile observation post line-of-sight.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Metric: Stealth Index (% hidden)
              </div>
            </div>

            {/* Spec 7: Multi-Spectral Shaders */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">07 / Optics</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                  FLIR + NVG
                </span>
              </div>
              <div className="font-medium text-foreground">Multi-Spectral Shaders</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Simulates FLIR thermal long-wave infrared (8-14 µm) heat gradients and high-gain green phosphor Night Vision Goggles for low-light operations.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Modes: RGB / FLIR / NVG / Heatmap
              </div>
            </div>

            {/* Spec 8: Tactical AI SITREPs */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-ash-gray)] uppercase">08 / AI Intelligence</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                  Groq LPU
                </span>
              </div>
              <div className="font-medium text-foreground">Automated AI SITREPs</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Synthesizes formal NATO/IN military situation reports in 1.2s via Groq LPUs, evaluating choke points, defensive obstacles, and observation vantages.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-slate-gray)] pt-1">
                Latency: &lt;1.2s • Llama-3.3 / Qwen
              </div>
            </div>
          </div>

          {/* Direct Workspace Launchers */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono text-[var(--color-slate-gray)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Access Dedicated Workspaces:</span>
              <span>All 3D interactive rendering is housed in standalone modules.</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/console" className="text-[var(--color-sienna-brown)] hover:underline font-medium flex items-center gap-1">
                <span>Video Ingest Studio</span>
                <span>→</span>
              </Link>
              <span>•</span>
              <Link href="/viewer" className="text-foreground hover:underline font-medium flex items-center gap-1">
                <span>Tactical 3D Viewport</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Stat & Specification Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1 */}
          <div className="neutral-card p-6 space-y-2">
            <div className="text-[14px] text-[var(--color-ash-gray)] font-sans-ui">
              Flight Corridor Time
            </div>
            <div className="text-3xl font-sans-ui font-medium text-foreground">
              &lt;45s
            </div>
            <div className="text-[13px] text-[var(--color-slate-gray)]">
              Single straight-line pass
            </div>
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              ▼ 90% loiter time vs 12-pass grid
            </div>
          </div>

          {/* Stat 2 */}
          <div className="neutral-card p-6 space-y-2">
            <div className="text-[14px] text-[var(--color-ash-gray)] font-sans-ui">
              Ground Sample Distance
            </div>
            <div className="text-3xl font-sans-ui font-medium text-foreground">
              2.2 cm
            </div>
            <div className="text-[13px] text-[var(--color-slate-gray)]">
              Sub-meter metric accuracy
            </div>
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              4K optics at 65m AGL nominal
            </div>
          </div>

          {/* Stat 3 */}
          <div className="neutral-card p-6 space-y-2">
            <div className="text-[14px] text-[var(--color-ash-gray)] font-sans-ui">
              Elevation Profiler
            </div>
            <div className="text-3xl font-sans-ui font-medium text-foreground">
              2D Slicer
            </div>
            <div className="text-[13px] text-[var(--color-slate-gray)]">
              Bilinear slope & crest telemetry
            </div>
            <div className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 font-medium pt-0.5">
              Continuous 60-sample transects
            </div>
          </div>

          {/* Stat 4: Accent Peach Card from DESIGN.md */}
          <div className="accent-peach-card p-6 space-y-2">
            <div className="text-[14px] font-sans-ui opacity-80">
              Runtime Footprint
            </div>
            <div className="text-3xl font-sans-ui font-medium">
              Zero Desktop
            </div>
            <div className="text-[13px] opacity-90">
              100% in-browser WebGL
            </div>
            <div className="text-[11px] font-mono font-medium opacity-95 pt-0.5">
              Air-gapped client-side WASM
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
