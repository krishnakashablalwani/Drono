import React from "react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemStatementSection } from "@/components/landing/ProblemStatementSection";
import { PipelineVisualizer } from "@/components/landing/PipelineVisualizer";
import { MathematicalFormulas } from "@/components/landing/MathematicalFormulas";
import { FeatureGrid } from "@/components/landing/FeatureGrid";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between hud-grid-bg">
      <div>
        <Navbar />
        <HeroSection />
        <ProblemStatementSection />
        <PipelineVisualizer />
        <MathematicalFormulas />
        <FeatureGrid />
      </div>
      <Footer />
    </main>
  );
}
