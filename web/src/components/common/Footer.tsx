import React from "react";
import Link from "next/link";
import { Lock, Cpu, Globe, Terminal } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] mt-24 py-16 px-6 sm:px-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 font-sans-ui">
        {/* Col 1: System Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="w-6 h-6 shrink-0" size={24} />
            <span className="font-serif-display text-xl text-foreground">
              Drono
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-mist-gray)] text-[var(--color-slate-gray)] border border-[var(--border-subtle)]">
              Operational
            </span>
          </div>
          <p className="text-[14px] text-[var(--color-slate-gray)] leading-relaxed">
            Autonomous Single-Pass Drone Video to Metrically Accurate 3D Model Generation Platform.
          </p>
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-ash-gray)]">
            <Lock className="w-3.5 h-3.5" />
            <span>Air-Gapped & Offline Ready Architecture</span>
          </div>
        </div>

        {/* Col 2: Specifications */}
        <div className="space-y-3 text-[14px]">
          <h4 className="font-medium text-foreground">
            System Specs
          </h4>
          <ul className="space-y-2 text-[var(--color-slate-gray)]">
            <li>• Flight Mode: Single-Pass Shoot & Scoot</li>
            <li>• Pipeline: OpenCV Laplacian + SfM + 3D Mesh</li>
            <li>• Metric Resolution: Sub-2.5cm GSD</li>
          </ul>
        </div>

        {/* Col 3: Tactical Modules */}
        <div className="space-y-3 text-[14px]">
          <h4 className="font-medium text-foreground">
            Tactical Modules
          </h4>
          <ul className="space-y-2 text-[var(--color-slate-gray)]">
            <li>
              <Link href="/console" className="hover:text-foreground transition-colors">
                • Ingestion & Blur Variance Studio
              </Link>
            </li>
            <li>
              <Link href="/viewer" className="hover:text-foreground transition-colors">
                • WebGL 3D Interactive Viewer
              </Link>
            </li>
            <li>
              <Link href="/viewer" className="hover:text-foreground transition-colors">
                • 3D Distance & Elevation Calipers
              </Link>
            </li>
            <li>
              <Link href="/viewer" className="hover:text-foreground transition-colors">
                • Tactical Line-of-Sight Raycaster
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Coordinates & Security */}
        <div className="space-y-3 text-[14px]">
          <h4 className="font-medium text-foreground">
            Operational Base
          </h4>
          <p className="text-[var(--color-slate-gray)] leading-relaxed">
            GRID: 34° 08&apos; 22&quot; N, 74° 47&apos; 31&quot; E<br />
            ELEVATION: 1,585m MSL<br />
            STATUS: SECURE CIPHERTEXT
          </p>
          <div className="p-3 rounded-2xl bg-[var(--color-mist-gray)] text-[12px] text-[var(--color-slate-gray)] flex items-center gap-2">
            <span>Stateless Processing Nodes with Instant Cache Purging</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[var(--color-ash-gray)] font-sans-ui">
        <div>
          © 2026 Drono Engineering Collective • All Rights Reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>● 100% Client-Side WebGL</span>
          <span>Latency: &lt;14ms</span>
        </div>
      </div>
    </footer>
  );
}
