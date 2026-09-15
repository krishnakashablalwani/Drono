"use client";

import React from "react";
import { Gauge, Navigation, Crosshair, Radio } from "lucide-react";
import { formatCoordinates } from "@/lib/photogrammetry";

interface TelemetryHUDProps {
  altitudeM?: number;
  speedKmh?: number;
  pitchDeg?: number;
  rollDeg?: number;
  yawDeg?: number;
  lat?: number;
  lon?: number;
  fps?: number;
}

export function TelemetryHUD({
  altitudeM = 65.4,
  speedKmh = 48.2,
  pitchDeg = -45.0,
  rollDeg = 2.4,
  yawDeg = 88.0,
  lat = 34.14205,
  lon = 74.82114,
  fps = 60,
}: TelemetryHUDProps) {
  return (
    <div className="neutral-card p-6 font-sans-ui space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
          <Radio className="w-4 h-4 text-[var(--color-sienna-brown)] animate-pulse" />
          <span>Avionics Telemetry</span>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] font-medium">
          Live Feed
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Altitude */}
        <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
          <div className="text-[12px] text-[var(--color-slate-gray)] flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[var(--color-ash-gray)]" />
            <span>Altitude AGL</span>
          </div>
          <div className="text-xl font-medium text-foreground mt-1">
            {altitudeM.toFixed(1)} <span className="text-xs text-[var(--color-slate-gray)]">m</span>
          </div>
        </div>

        {/* Speed */}
        <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
          <div className="text-[12px] text-[var(--color-slate-gray)] flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-[var(--color-ash-gray)]" />
            <span>Ground Speed</span>
          </div>
          <div className="text-xl font-medium text-foreground mt-1">
            {speedKmh.toFixed(1)} <span className="text-xs text-[var(--color-slate-gray)]">km/h</span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="col-span-2 p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
          <div className="text-[12px] text-[var(--color-slate-gray)] flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[var(--color-ash-gray)]" />
            <span>GPS Coordinate Fix</span>
          </div>
          <div className="text-xs font-mono font-medium text-foreground mt-1">
            {formatCoordinates(lat, lon)}
          </div>
        </div>
      </div>

      {/* Artificial Horizon */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[12px] text-[var(--color-slate-gray)] flex items-center justify-between">
          <span>Attitude (Pitch / Roll)</span>
          <span className="font-mono text-xs text-foreground">{yawDeg.toFixed(0)}° HDG</span>
        </div>
        <div className="relative h-14 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] overflow-hidden flex items-center justify-center">
          <div
            className="absolute w-24 h-[1.5px] bg-[var(--color-sienna-brown)] transition-transform duration-100"
            style={{
              transform: `translateY(${pitchDeg * 0.4}px) rotate(${rollDeg}deg)`,
            }}
          />
          <div className="w-2 h-2 rounded-full border border-foreground bg-transparent z-10" />
          <div className="absolute left-3 top-1.5 text-[10px] text-[var(--color-slate-gray)] font-mono">
            P: {pitchDeg.toFixed(1)}°
          </div>
          <div className="absolute right-3 top-1.5 text-[10px] text-[var(--color-slate-gray)] font-mono">
            R: {rollDeg.toFixed(1)}°
          </div>
        </div>
      </div>
    </div>
  );
}
