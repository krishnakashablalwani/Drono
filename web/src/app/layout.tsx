import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ReconModelProvider } from "@/context/ReconModelContext";

export const metadata: Metadata = {
  title: "Drono: Tactical Single-Pass Drone 3D Reconnaissance Platform",
  description:
    "Tactical reconnaissance platform engineered for the National Technical Research Organisation (NTRO). Generates metrically accurate 3D models from single-pass drone video feeds.",
  keywords: [
    "Drono",
    "NTRO",
    "Defense Reconnaissance",
    "Drone 3D Reconstruction",
    "Single-Pass Photogrammetry",
    "Tactical Reconnaissance",
    "Three.js WebGL",
    "Gaussian Splatting",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200"
      >
        <ThemeProvider>
          <ReconModelProvider>
            {children}
          </ReconModelProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
