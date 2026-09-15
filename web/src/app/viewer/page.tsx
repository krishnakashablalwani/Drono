"use client";

import React from "react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { TacticalConsole } from "@/components/dashboard/TacticalConsole";

export default function ViewerPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between font-sans-ui bg-[var(--bg-primary)]">
      <div>
        <Navbar />
        <TacticalConsole initialLayout="3d" />
      </div>
      <Footer />
    </main>
  );
}

