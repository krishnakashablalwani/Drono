"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, X, ShieldAlert, Cpu, Download } from "lucide-react";

interface TacticalAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  sitrep: string;
  isLoading: boolean;
  latencyMs?: number;
  model?: string;
  missionName?: string;
}

export function TacticalAiModal({
  isOpen,
  onClose,
  sitrep,
  isLoading,
  latencyMs = 120,
  model = "qwen/qwen3.8-27b",
  missionName = "Operation Karakoram - Ridge Sector 4",
}: TacticalAiModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sitrep);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([sitrep], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `Drono_SITREP_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans-ui">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col floating-artifact rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[var(--color-slate-gray)]">
              <span className="px-2 py-0.5 rounded-full bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Groq LPU Acceleration
              </span>
              <span>•</span>
              <span>NTRO Tactical AI</span>
            </div>
            <h2 className="font-serif-display text-2xl text-foreground">
              Commander&apos;s Tactical SITREP
            </h2>
            <p className="text-xs text-[var(--color-slate-gray)]">
              {missionName} • Real-Time 3D Geometric Intelligence
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)] hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close SITREP modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-4 text-sm leading-relaxed">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--color-sienna-brown)] animate-spin" />
                <Sparkles className="w-5 h-5 text-[var(--color-sienna-brown)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1">
                <div className="font-medium text-foreground text-sm">
                  Synthesizing 3D Mesh Geometry with Groq LPU...
                </div>
                <div className="text-xs text-[var(--color-slate-gray)]">
                  Evaluating line-of-sight occlusions, slope grades, and infiltration vectors
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Telemetry Badge Strip */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-[var(--color-slate-gray)]">
                <span className="px-2.5 py-1 rounded-md bg-[var(--color-mist-gray)] border border-[var(--border-subtle)]">
                  LPU Latency: <strong className="text-emerald-500 font-semibold">{latencyMs}ms</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[var(--color-mist-gray)] border border-[var(--border-subtle)]">
                  Model: <strong className="text-foreground">{model}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[var(--color-mist-gray)] border border-[var(--border-subtle)]">
                  Status: <strong className="text-foreground">Tactical Verified</strong>
                </span>
              </div>

              {/* SITREP Formatted Content */}
              <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-foreground font-sans-ui whitespace-pre-line text-[14px] leading-relaxed select-text">
                {sitrep}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-[var(--color-ash-gray)] hidden sm:block">
            Classification: RESTRICTED // NTRO DEFENSE
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownload}
              disabled={isLoading || !sitrep}
              className="px-3.5 py-2 rounded-full border border-[var(--border-subtle)] hover:bg-[var(--color-mist-gray)] text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={isLoading || !sitrep}
              className="px-3.5 py-2 rounded-full bg-foreground text-[var(--bg-primary)] hover:opacity-90 text-xs font-medium inline-flex items-center gap-1.5 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Directive"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
