import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";
import { TelemetryHUD } from "../components/viewer/TelemetryHUD";
import { TacticalConsole } from "../components/dashboard/TacticalConsole";
import { ThemeProvider } from "../context/ThemeContext";
import { ReconModelProvider } from "../context/ReconModelContext";


describe("Navbar Component Verification", () => {
  it("renders Drono brand and navigation links", () => {
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    expect(screen.getByText(/Drono/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Launch Console/i })).toBeInTheDocument();
  });
});

describe("Footer Component Verification", () => {
  it("renders defense specifications and air-gapped readiness", () => {
    render(<Footer />);

    expect(screen.getByText(/Drono Engineering Collective/i)).toBeInTheDocument();
    expect(screen.getByText(/Air-Gapped & Offline Ready Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/GRID: 34° 08' 22" N, 74° 47' 31" E/i)).toBeInTheDocument();
  });
});

describe("TelemetryHUD Component Verification", () => {
  it("renders real-time avionics telemetry values", () => {
    render(
      <TelemetryHUD
        altitudeM={68.4}
        speedKmh={52.1}
        pitchDeg={-42.5}
        rollDeg={1.8}
        yawDeg={94.0}
        lat={34.14205}
        lon={74.82114}
      />
    );

    expect(screen.getByText("68.4")).toBeInTheDocument();
    expect(screen.getByText("52.1")).toBeInTheDocument();
    expect(screen.getByText(/34.14205° N, 74.82114° E/)).toBeInTheDocument();
    expect(screen.getByText(/P: -42.5°/)).toBeInTheDocument();
    expect(screen.getByText(/R: 1.8°/)).toBeInTheDocument();
  });
});

describe("TacticalConsole Component Verification", () => {
  it("renders video ingestion dropzone and allows blur threshold adjustment", () => {
    render(
      <ReconModelProvider>
        <TacticalConsole />
      </ReconModelProvider>
    );

    expect(screen.getByText(/Reconnaissance Ingest & Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Drone Flight Video/i)).toBeInTheDocument();
    expect(screen.getByText(/DISCRETE 2D LAPLACIAN BLUR VARIANCE/i)).toBeInTheDocument();

    const slider = screen.getByLabelText(/Blur Variance Threshold/i);
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue("120");

    fireEvent.change(slider, { target: { value: "140" } });
    expect(slider).toHaveValue("140");
  });

  it("renders unified split-screen mission control with layout mode controls", () => {
    render(
      <ReconModelProvider>
        <TacticalConsole />
      </ReconModelProvider>
    );

    expect(screen.getByTitle(/Dual-Pane Split View/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Focus Video Ingestion/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Focus 3D Viewport/i)).toBeInTheDocument();

    // Verify embedded 3D viewport heading is rendered in split mode
    expect(screen.getByText(/WebGL Tactical 3D Viewport/i)).toBeInTheDocument();

    // Toggle to 3D focus mode
    fireEvent.click(screen.getByTitle(/Focus 3D Viewport/i));
    expect(screen.getByText(/WebGL Tactical 3D Viewport/i)).toBeInTheDocument();
    expect(screen.queryByText(/Upload Drone Flight Video/i)).not.toBeInTheDocument();

    // Toggle back to Split Screen
    fireEvent.click(screen.getByTitle(/Dual-Pane Split View/i));
    expect(screen.getByText(/Upload Drone Flight Video/i)).toBeInTheDocument();
    expect(screen.getByText(/WebGL Tactical 3D Viewport/i)).toBeInTheDocument();
  });
});
