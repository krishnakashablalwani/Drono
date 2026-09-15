import React from "react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { TacticalConsole } from "@/components/dashboard/TacticalConsole";

export const metadata = {
  title: "Mission Control: Drono",
  description: "Unified split-screen tactical console: UAV video feed ingestion, discrete Laplacian blur filtering, and real-time WebGL 3D reconstruction.",
};

export default function ConsolePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between hud-grid-bg">
      <div>
        <Navbar />
        <TacticalConsole />
      </div>
      <Footer />
    </main>
  );
}
