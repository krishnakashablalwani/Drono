"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface PipelineStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tech: string;
  metrics: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "ingest",
    title: "01. Stream Ingest",
    subtitle: "Drone Video Ingestion",
    description:
      "Directly accepts raw 4K/1080p MP4/MOV aerial reconnaissance video. Decomposes video streams via offscreen HTML5 canvas sampling, synchronizing frame timestamps with synthetic or barometric UAV telemetry.",
    tech: "HTML5 Canvas Decoders • MP4/MOV Parser • Telemetry Fusion",
    metrics: "4K / 1080p @ 60 FPS Real-time",
  },
  {
    id: "blur",
    title: "02. Blur Filter",
    subtitle: "Laplacian Discrimination (∇²I)",
    description:
      "Convolves each frame with the discrete 2D Laplacian kernel [[0,1,0],[1,-4,1],[0,1,0]]. Automatically discards frames degraded by aerodynamic jitter or rotor wash while guaranteeing continuous baseline camera overlap.",
    tech: "Discrete 2D Laplacian Operator • Variance Thresholding",
    metrics: "Filters ~45% blurry frames in <1.2s",
  },
  {
    id: "sfm",
    title: "03. Visual Odometry",
    subtitle: "GPS-Denied Pose Estimation",
    description:
      "Calculates inter-frame optical flow vectors and solves epipolar geometry to derive 6-DOF camera poses [X, Y, Z, pitch, roll, yaw] along the single linear UAV flight vector without relying on external satellite GPS.",
    tech: "Optical Flow Tracking • 6-DOF Epipolar Matrix",
    metrics: "Mean reprojection error <0.45 px",
  },
  {
    id: "dense",
    title: "04. Point Cloud",
    subtitle: "Watertight 3D Mesh & Elevation Grid",
    description:
      "Synthesizes metrically scaled 3D point clouds and watertight triangulated terrain meshes. Computes vertex normals, hypsometric elevation gradients, and identifies elevated observation vantage points.",
    tech: "Triangulated Spatial Mesh • Bilinear Interpolation",
    metrics: "128,000+ polygons synthesized",
  },
  {
    id: "render",
    title: "05. Tactical Viewport",
    subtitle: "2D Slicer, FLIR/NVG & Groq AI",
    description:
      "Renders responsive 60 FPS 3D terrain with interactive 2D elevation cross-section slicing, tactical line-of-sight raycasting, FLIR thermal/NVG shaders, A* stealth ingress routes, and Groq LPU AI SITREPs.",
    tech: "Three.js • 2D SVG Profile Slicer • Groq LPU API",
    metrics: "60 FPS rendering • 1.2s AI SITREPs",
  },
];

export function PipelineVisualizer() {
  const [activeStep, setActiveStep] = useState<string>("blur");
  const currentStep = PIPELINE_STEPS.find((s) => s.id === activeStep) || PIPELINE_STEPS[0];

  return (
    <section id="pipeline" className="py-20 px-6 sm:px-8 max-w-[1200px] mx-auto">
      <div className="space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-[14px] text-[var(--color-ash-gray)] uppercase tracking-wider font-sans-ui">
            Doctrine Comparison
          </div>
          <h2 className="font-serif-display text-4xl sm:text-5xl text-foreground tracking-[-0.015em]">
            Single-Pass vs <em>Traditional Grid Photogrammetry</em>
          </h2>
          <p className="text-[17px] text-[var(--text-secondary)] font-sans-ui max-w-xl mx-auto leading-[1.45]">
            Why defense intelligence and emergency response demand shoot-and-scoot 3D mapping.
          </p>
        </div>

        {/* 2-Column Neutral Card Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Card */}
          <div className="neutral-card p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-sans-ui font-medium text-foreground">
                Traditional Photogrammetry
              </div>
              <span className="text-[12px] font-sans-ui px-2.5 py-1 rounded-full bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)]">
                High Risk
              </span>
            </div>

            <ul className="space-y-3.5 text-[15px] font-sans-ui text-[var(--text-secondary)] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-slate-gray)]">•</span>
                <span><strong>12+ Repeated Grid Passes:</strong> Lawnmower sweeps requiring continuous loitering.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-slate-gray)]">•</span>
                <span><strong>45+ Minute Exposure:</strong> High audible and radar signature over hostile territory.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-slate-gray)]">•</span>
                <span><strong>GPS Jamming Vulnerability:</strong> Fails when satellite navigation is denied.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-slate-gray)]">•</span>
                <span><strong>Heavy Desktop Software:</strong> Hours of offline rendering on workstation clusters.</span>
              </li>
            </ul>
          </div>

          {/* Drono Card */}
          <div className="neutral-card p-8 space-y-6 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-sans-ui font-medium text-foreground">
                Drono Single-Pass
              </div>
              <span className="text-[12px] font-sans-ui px-2.5 py-1 rounded-full bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] font-medium">
                Shoot & Scoot
              </span>
            </div>

            <ul className="space-y-3.5 text-[15px] font-sans-ui text-foreground leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-sienna-brown)]">•</span>
                <span><strong>1 Single Linear Pass:</strong> High-speed straight-line reconnaissance over target.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-sienna-brown)]">•</span>
                <span><strong>&lt;45 Second Flight Time:</strong> Maximum tactical survivability and stealth.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-sienna-brown)]">•</span>
                <span><strong>GPS-Denied Visual Odometry:</strong> Reconstructs 3D coordinates purely from visual features.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--color-sienna-brown)]">•</span>
                <span><strong>100% In-Browser WebGL:</strong> Actionable 3D interactive terrain immediately accessible.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 5-Step Pipeline Strip */}
        <div className="neutral-card p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="font-sans-ui font-medium text-[16px] text-foreground">
              Processing Pipeline
            </div>
            <span className="text-[13px] text-[var(--color-ash-gray)]">
              Click step to inspect
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PIPELINE_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-4 rounded-2xl text-left transition-all font-sans-ui text-sm cursor-pointer ${
                  activeStep === step.id
                    ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm"
                    : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-foreground"
                }`}
              >
                <div className="font-medium text-xs truncate">{step.title}</div>
                <div className={`text-[11px] mt-1 truncate ${activeStep === step.id ? "opacity-80" : "text-[var(--color-slate-gray)]"}`}>
                  {step.subtitle}
                </div>
              </button>
            ))}
          </div>

          {/* Active Step Details */}
          <div className="floating-artifact p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans-ui">
            <div className="md:col-span-2 space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-slate-gray)]">
                {currentStep.title} / {currentStep.subtitle}
              </div>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                {currentStep.description}
              </p>
              <div className="pt-2 text-xs text-[var(--color-ash-gray)]">
                Stack: <span className="text-foreground">{currentStep.tech}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-mist-gray)] flex flex-col justify-center space-y-1">
              <div className="text-[11px] text-[var(--color-ash-gray)] uppercase tracking-wider">
                Benchmark Metric
              </div>
              <div className="text-xl font-medium text-foreground">
                {currentStep.metrics}
              </div>
              <div className="text-[11px] text-[var(--color-slate-gray)]">
                Near real-time execution
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
