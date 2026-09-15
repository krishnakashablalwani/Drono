"use client";

import React, { useState, useMemo } from "react";
import { ElevationProfileResult } from "@/lib/videoProcessing";
import { TrendingUp, Mountain, Activity, ArrowRight, X } from "lucide-react";

interface ElevationProfileSlicerProps {
  data: ElevationProfileResult;
  onClose?: () => void;
  className?: string;
}

export function ElevationProfileSlicer({
  data,
  onClose,
  className = "",
}: ElevationProfileSlicerProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, totalDistanceM, minElevationM, maxElevationM } = data;

  // Chart coordinate scaling
  const chartHeight = 120;
  const chartWidth = 560;
  const padding = { top: 15, bottom: 25, left: 40, right: 20 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const elevRange = Math.max(5, maxElevationM - minElevationM);

  const coords = useMemo(() => {
    return points.map((p) => {
      const x = padding.left + (p.distanceM / Math.max(1, totalDistanceM)) * usableWidth;
      const y =
        padding.top +
        usableHeight -
        ((p.elevationM - minElevationM) / elevRange) * usableHeight;
      return { x, y, p };
    });
  }, [points, totalDistanceM, minElevationM, elevRange, usableWidth, usableHeight, padding]);

  // SVG path for line
  const linePath = useMemo(() => {
    if (coords.length === 0) return "";
    return coords.reduce((acc, c, idx) => {
      return `${acc} ${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
    }, "");
  }, [coords]);

  // SVG path for closed area fill
  const areaPath = useMemo(() => {
    if (coords.length === 0) return "";
    const bottomY = padding.top + usableHeight;
    const startX = coords[0].x;
    const endX = coords[coords.length - 1].x;
    return `${linePath} L ${endX.toFixed(1)} ${bottomY} L ${startX.toFixed(1)} ${bottomY} Z`;
  }, [coords, linePath, padding, usableHeight]);

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[Math.floor(points.length / 2)];
  const activeCoord = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : null;

  return (
    <div
      className={`floating-artifact p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md shadow-2xl font-mono text-xs space-y-3 ${className}`}
    >
      {/* Header & Metrics Strip */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center gap-2 text-foreground">
          <Mountain className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-sans-ui font-medium text-xs sm:text-sm">
            2D Elevation Transect Profile
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {totalDistanceM} m Cut
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--color-slate-gray)]">
            <span>
              Min: <strong className="text-foreground">{minElevationM}m</strong>
            </span>
            <span>
              Max: <strong className="text-foreground">{maxElevationM}m</strong>
            </span>
            <span>
              Gain: <strong className="text-emerald-400">+{data.elevationGainM}m</strong>
            </span>
            <span>
              Max Slope: <strong className="text-amber-400">{data.maxSlopeDeg}°</strong>
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)] hover:text-foreground transition-colors cursor-pointer"
              title="Close Profile Slicer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-28 sm:h-32 select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            const clampedX = Math.max(padding.left, Math.min(chartWidth - padding.right, mouseX));
            const progress = (clampedX - padding.left) / usableWidth;
            const idx = Math.min(points.length - 1, Math.max(0, Math.round(progress * (points.length - 1))));
            setHoverIndex(idx);
          }}
        >
          <defs>
            <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0e1013" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={chartWidth - padding.right}
            y2={padding.top}
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + usableHeight / 2}
            x2={chartWidth - padding.right}
            y2={padding.top + usableHeight / 2}
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + usableHeight}
            x2={chartWidth - padding.right}
            y2={padding.top + usableHeight}
            stroke="rgba(255,255,255,0.15)"
          />

          {/* Y Axis Labels */}
          <text
            x={padding.left - 6}
            y={padding.top + 4}
            textAnchor="end"
            fill="var(--color-slate-gray)"
            fontSize="9"
          >
            {maxElevationM}m
          </text>
          <text
            x={padding.left - 6}
            y={padding.top + usableHeight + 3}
            textAnchor="end"
            fill="var(--color-slate-gray)"
            fontSize="9"
          >
            {minElevationM}m
          </text>

          {/* X Axis Labels */}
          <text
            x={padding.left}
            y={chartHeight - 6}
            textAnchor="start"
            fill="var(--color-slate-gray)"
            fontSize="9"
          >
            0 m (Start)
          </text>
          <text
            x={chartWidth - padding.right}
            y={chartHeight - 6}
            textAnchor="end"
            fill="var(--color-slate-gray)"
            fontSize="9"
          >
            {totalDistanceM} m (Target)
          </text>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#elevationGrad)" />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#00f0ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Highest Ridge Crest Indicator */}
          {coords.length > 0 && (
            <circle
              cx={coords.reduce((prev, curr) => (curr.p.elevationM > prev.p.elevationM ? curr : prev)).x}
              cy={coords.reduce((prev, curr) => (curr.p.elevationM > prev.p.elevationM ? curr : prev)).y}
              r="3.5"
              fill="#f59e0b"
            />
          )}

          {/* Active Hover Cursor */}
          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={padding.top}
                x2={activeCoord.x}
                y2={padding.top + usableHeight}
                stroke="#00f0ff"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="4.5"
                fill="#ffffff"
                stroke="#00f0ff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Hover Readout Bar */}
      {activePoint && (
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--border-subtle)] text-[var(--color-slate-gray)]">
          <div className="flex items-center gap-2">
            <span>Distance: <strong className="text-foreground">{activePoint.distanceM}m</strong></span>
            <span>•</span>
            <span>Elevation: <strong className="text-cyan-400">{activePoint.elevationM}m</strong></span>
          </div>

          <div className="text-[10px] text-[var(--color-ash-gray)]">
            Coordinates: [{activePoint.x}, {activePoint.z}]
          </div>
        </div>
      )}
    </div>
  );
}
