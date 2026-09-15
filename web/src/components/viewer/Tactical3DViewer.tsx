"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import {
  Layers,
  Eye,
  Ruler,
  Maximize2,
  RefreshCw,
  Compass,
  Download,
  AlertTriangle,
  Play,
  Pause,
  MapPin,
  Crosshair,
  Shield,
  Activity,
  Sparkles,
  Navigation,
  Flame,
  Moon,
  FileCode,
  Mountain,
} from "lucide-react";
import { TacticalAiModal } from "./TacticalAiModal";
import { ElevationProfileSlicer } from "./ElevationProfileSlicer";
import {
  CameraPose,
  Vector3D,
  TacticalMarker,
  MeasurementResult,
  calculateMeasurement,
  generateSinglePassTrajectory,
  evaluateLineOfSight,
} from "@/lib/photogrammetry";
import {
  ReconstructedTerrainModel,
  exportToWavefrontOBJ,
  exportToStanfordPLY,
  findTacticalIngressPath,
  IngressPathResult,
  reconstructTerrainFromKeyframes,
  computeElevationProfile,
  ElevationProfileResult,
} from "@/lib/videoProcessing";
import { useReconModel } from "@/context/ReconModelContext";

export type RenderMode = "mesh" | "topo" | "pointcloud" | "wireframe" | "heatmap" | "flir" | "nvg";
export type ToolMode = "orbit" | "measure_distance" | "line_of_sight" | "ingress_path" | "elevation_slicer";

/** Generates a high-resolution topographic contour texture with hypsometric color ramp */
function generateTopoTexture(model: ReconstructedTerrainModel, resolution: number = 256): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imgData = ctx.createImageData(resolution, resolution);
  const data = imgData.data;

  const minY = model.bounds.minY;
  const maxY = Math.max(minY + 1, model.bounds.maxY);
  const rangeY = maxY - minY;
  const resGrid = model.gridResolution;
  const numPerRow = resGrid + 1;

  for (let y = 0; y < resolution; y++) {
    const v = y / resolution;
    const rIdx = Math.min(resGrid, Math.floor(v * resGrid));
    for (let x = 0; x < resolution; x++) {
      const u = x / resolution;
      const cIdx = Math.min(resGrid, Math.floor(u * resGrid));
      const vertY = model.vertices[(rIdx * numPerRow + cIdx) * 3 + 1] || 0;
      const normY = Math.max(0, Math.min(1, (vertY - minY) / rangeY));

      let r = 0, g = 0, b = 0;
      if (normY < 0.25) {
        const t = normY / 0.25;
        r = 16 + t * 40; g = 80 + t * 50; b = 35 + t * 20;
      } else if (normY < 0.5) {
        const t = (normY - 0.25) / 0.25;
        r = 56 + t * 80; g = 130 + t * 30; b = 55 - t * 25;
      } else if (normY < 0.75) {
        const t = (normY - 0.5) / 0.25;
        r = 136 + t * 65; g = 160 - t * 60; b = 30 + t * 15;
      } else {
        const t = (normY - 0.75) / 0.25;
        r = 201 + t * 45; g = 100 + t * 135; b = 45 + t * 195;
      }

      // Contour line isoline calculation
      const contourInterval = 1.5;
      const contourMod = Math.abs(vertY % contourInterval);
      const isIndexContour = Math.abs(vertY % (contourInterval * 4)) < 0.12;
      const isContour = contourMod < 0.08 || isIndexContour;

      if (isContour) {
        if (isIndexContour) {
          r = Math.min(255, r * 0.2 + 230);
          g = Math.min(255, g * 0.2 + 240);
          b = Math.min(255, b * 0.2 + 255);
        } else {
          r = r * 0.35;
          g = g * 0.35;
          b = b * 0.35;
        }
      }

      const pIdx = (y * resolution + x) * 4;
      data[pIdx] = Math.round(r);
      data[pIdx + 1] = Math.round(g);
      data[pIdx + 2] = Math.round(b);
      data[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Generates a military FLIR Ironbow thermal infrared false-color texture */
function generateFlirTexture(model: ReconstructedTerrainModel, resolution: number = 256): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imgData = ctx.createImageData(resolution, resolution);
  const data = imgData.data;

  const minY = model.bounds.minY;
  const maxY = Math.max(minY + 1, model.bounds.maxY);
  const rangeY = maxY - minY;
  const resGrid = model.gridResolution;
  const numPerRow = resGrid + 1;

  for (let y = 0; y < resolution; y++) {
    const v = y / resolution;
    const rIdx = Math.min(resGrid, Math.floor(v * resGrid));
    for (let x = 0; x < resolution; x++) {
      const u = x / resolution;
      const cIdx = Math.min(resGrid, Math.floor(u * resGrid));
      const vertY = model.vertices[(rIdx * numPerRow + cIdx) * 3 + 1] || 0;
      const t = Math.max(0, Math.min(1, (vertY - minY) / rangeY));

      let r = 0, g = 0, b = 0;
      if (t < 0.2) {
        const k = t / 0.2;
        r = k * 30; g = 0; b = k * 100;
      } else if (t < 0.4) {
        const k = (t - 0.2) / 0.2;
        r = 30 + k * 120; g = 0; b = 100 - k * 30;
      } else if (t < 0.7) {
        const k = (t - 0.4) / 0.3;
        r = 150 + k * 90; g = k * 120; b = 70 - k * 70;
      } else if (t < 0.9) {
        const k = (t - 0.7) / 0.2;
        r = 240 + k * 15; g = 120 + k * 120; b = 0;
      } else {
        const k = (t - 0.9) / 0.1;
        r = 255; g = 240 + k * 15; b = k * 255;
      }

      const pIdx = (y * resolution + x) * 4;
      data[pIdx] = Math.round(r);
      data[pIdx + 1] = Math.round(g);
      data[pIdx + 2] = Math.round(b);
      data[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Generates a Gen-3 night-vision green phosphor texture with raster scanlines */
function generateNvgTexture(model: ReconstructedTerrainModel, resolution: number = 256): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imgData = ctx.createImageData(resolution, resolution);
  const data = imgData.data;

  const minY = model.bounds.minY;
  const maxY = Math.max(minY + 1, model.bounds.maxY);
  const rangeY = maxY - minY;
  const resGrid = model.gridResolution;
  const numPerRow = resGrid + 1;

  for (let y = 0; y < resolution; y++) {
    const v = y / resolution;
    const rIdx = Math.min(resGrid, Math.floor(v * resGrid));
    const scanline = y % 2 === 0 ? 0.85 : 1.0;
    for (let x = 0; x < resolution; x++) {
      const u = x / resolution;
      const cIdx = Math.min(resGrid, Math.floor(u * resGrid));
      const vertY = model.vertices[(rIdx * numPerRow + cIdx) * 3 + 1] || 0;
      const t = Math.max(0, Math.min(1, (vertY - minY) / rangeY));

      const intensity = (0.2 + t * 0.8) * scanline;
      const r = intensity * 35;
      const g = intensity * 245;
      const b = intensity * 60;

      const pIdx = (y * resolution + x) * 4;
      data[pIdx] = Math.round(r);
      data[pIdx + 1] = Math.round(g);
      data[pIdx + 2] = Math.round(b);
      data[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

interface Tactical3DViewerProps {
  initialMode?: RenderMode;
  showControls?: boolean;
  className?: string;
  onTelemetryUpdate?: (telemetry: {
    lat: number;
    lon: number;
    alt: number;
    speed: number;
    pitch: number;
    roll: number;
    yaw: number;
  }) => void;
}

export function Tactical3DViewer({
  initialMode = "mesh",
  showControls = true,
  className = "w-full h-[640px]",
  onTelemetryUpdate,
}: Tactical3DViewerProps) {
  const { activeModel, setActiveModel, setActiveVideoUrl, hasCustomModel } = useReconModel();
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>(initialMode);
  const [activeTool, setActiveTool] = useState<ToolMode>("orbit");
  const [isPlayingFlyover, setIsPlayingFlyover] = useState(false);
  const [measurement, setMeasurement] = useState<MeasurementResult | null>(null);
  const [losStatus, setLosStatus] = useState<{ hasLos: boolean; distance: number } | null>(null);
  const [ingressResult, setIngressResult] = useState<IngressPathResult | null>(null);
  const [elevationProfile, setElevationProfile] = useState<ElevationProfileResult | null>(null);
  const [showStructures, setShowStructures] = useState(false);
  const [elevationScale, setElevationScale] = useState<number>(1.0);

  const [markers, setMarkers] = useState<TacticalMarker[]>([
    {
      id: "pin-1",
      name: "FOB Alpha Command Post",
      type: "friendly",
      position: { x: -15, y: 8, z: -10 },
      elevationM: 8.0,
      description: "Tactical command relay & communications array",
      timestamp: "10:14:02Z",
    },
    {
      id: "pin-2",
      name: "Watchtower Sector 3",
      type: "target",
      position: { x: 22, y: 16, z: 12 },
      elevationM: 16.0,
      description: "Elevated surveillance point overlooking valley corridor",
      timestamp: "10:14:38Z",
    },
    {
      id: "pin-3",
      name: "Bridge 104 Chokepoint",
      type: "hazard",
      position: { x: 5, y: 2, z: 30 },
      elevationM: 2.0,
      description: "Suspected structural crack along eastern pier",
      timestamp: "10:15:10Z",
    },
  ]);

  const [meshStats, setMeshStats] = useState({ vertices: 64200, triangles: 128400, fps: 60 });

  // Tactical AI State (Groq LPU Engine)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSitrep, setAiSitrep] = useState("");
  const [aiLatencyMs, setAiLatencyMs] = useState(120);
  const [aiModel, setAiModel] = useState("qwen/qwen3.8-27b");

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const skirtMeshRef = useRef<THREE.Mesh | null>(null);
  const basePlateRef = useRef<THREE.Mesh | null>(null);
  const orthoTextureRef = useRef<THREE.Texture | null>(null);
  const normalTextureRef = useRef<THREE.Texture | null>(null);
  const topoTextureRef = useRef<THREE.Texture | null>(null);
  const flirTextureRef = useRef<THREE.Texture | null>(null);
  const nvgTextureRef = useRef<THREE.Texture | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const tacticalStructuresGroupRef = useRef<THREE.Group | null>(null);
  const tacticalMarkersGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const droneTrajectoryGroupRef = useRef<THREE.Group | null>(null);
  const measurementLineRef = useRef<THREE.Line | null>(null);
  const ingressPathLineRef = useRef<THREE.Line | null>(null);
  const clickPointsRef = useRef<THREE.Vector3[]>([]);
  const trajectoryPosesRef = useRef<CameraPose[]>([]);
  const animationProgressRef = useRef<number>(0);
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 95, phi: Math.PI / 3.2, theta: Math.PI / 4 });
  const isPlayingFlyoverRef = useRef(isPlayingFlyover);

  const CORRIDORS = [
    { id: "dji-0317", name: "DJI-0317 Corridor", file: "DJI_0317_corridor.mp4", url: "/sample_videos/DJI_0317_corridor.mp4" },
    { id: "dji-0122", name: "DJI-0122 Ridge", file: "DJI_0122_ridge_sweep.mp4", url: "/sample_videos/DJI_0122_ridge_sweep.mp4" },
    { id: "dji-0346", name: "DJI-0346 Valley", file: "DJI_0346_valley_survey.mp4", url: "/sample_videos/DJI_0346_valley_survey.mp4" },
    { id: "dji-0051", name: "DJI-0051 Aerial", file: "DJI_0051_aerial.mp4", url: "/sample_videos/DJI_0051_aerial.mp4" },
    { id: "dji-0087", name: "DJI-0087 Low Altitude", file: "DJI_0087_low_altitude.mp4", url: "/sample_videos/DJI_0087_low_altitude.mp4" },
  ];

  const handleSelectCorridor = (c: { id: string; name: string; file: string; url: string }) => {
    const model = reconstructTerrainFromKeyframes([], {
      missionId: `M-${c.id.toUpperCase()}`,
      missionName: c.name,
      videoFileName: c.file,
      altitudeM: 65.0,
    });
    setActiveModel(model);
    setActiveVideoUrl(c.url);
  };

  useEffect(() => {
    isPlayingFlyoverRef.current = isPlayingFlyover;
  }, [isPlayingFlyover]);

  // Default fallback terrain model (DJI-0317 Forward Corridor)
  const defaultModel = useMemo(() => {
    return reconstructTerrainFromKeyframes([], {
      missionId: "M-0317-CORRIDOR",
      missionName: "DJI-0317 Forward Corridor",
      videoFileName: "DJI_0317_corridor.mp4",
      altitudeM: 65.0,
    });
  }, []);

  // Active terrain model from context
  const currentModel = activeModel || defaultModel;

  // Initialize default trajectory
  useEffect(() => {
    trajectoryPosesRef.current = generateSinglePassTrajectory(160, 14.0, 55.0);
  }, []);

  // Update mesh stats when currentModel changes
  useEffect(() => {
    if (currentModel) {
      setMeshStats({
        vertices: currentModel.stats.vertexCount,
        triangles: currentModel.stats.triangleCount,
        fps: 60,
      });
    }
  }, [currentModel]);

  const handleGenerateAiSitrep = async () => {
    setIsAiModalOpen(true);
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/tactical-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionName: currentModel ? currentModel.missionName : "Tactical Standby Corridor",
          targetType: "Forward Mountain Outpost & Tactical Corridor",
          altitudeM: 68.5,
          gsdCm: currentModel ? currentModel.stats.estimatedGsdCm : 2.5,
          reconstructedPoints: currentModel ? currentModel.stats.vertexCount : 0,
          activeTool,
          measurement,
          losStatus,
          ingressResult,
          markers,
        }),
      });
      const data = await res.json();
      if (data.success && data.sitrep) {
        setAiSitrep(data.sitrep);
        setAiLatencyMs(data.latencyMs || 120);
        setAiModel(data.model || "qwen/qwen3.8-27b");
      } else {
        setAiSitrep("Tactical AI offline: " + (data.error || "Unable to communicate with Groq LPU engine."));
      }
    } catch (e: any) {
      setAiSitrep("Error connecting to Drono AI engine: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Setup Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 640;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.004);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererRef.current = renderer;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);
    } catch (err) {
      // Gracefully handle environments without WebGL support (e.g. jsdom / headless test runners)
      return;
    }

    // 4. Lights - Balanced natural daylight & tactical rim light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    sunLight.position.set(60, 100, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.45);
    scene.add(hemiLight);

    const accentLight = new THREE.DirectionalLight(0xa5f3fc, 0.35);
    accentLight.position.set(-50, 40, -30);
    scene.add(accentLight);

    // 5. Build 3D Terrain from current model or tactical grid
    if (currentModel) {
      buildModelGeometry(scene, currentModel);
      buildFlightPath(scene, trajectoryPosesRef.current);
    } else {
      const grid = new THREE.GridHelper(120, 24, 0x00f0ff, 0x222222);
      grid.position.y = -5;
      scene.add(grid);
      gridHelperRef.current = grid;
    }

    // 7. Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // FPS tracking
      frames++;
      if (time - lastTime >= 1000) {
        setMeshStats((prev) => ({ ...prev, fps: frames }));
        frames = 0;
        lastTime = time;
      }

      // Drone Flyover animation
      if (isPlayingFlyoverRef.current && cameraRef.current && trajectoryPosesRef.current.length > 0) {
        animationProgressRef.current = (animationProgressRef.current + 0.002) % 1;
        const poses = trajectoryPosesRef.current;
        const targetIndex = animationProgressRef.current * (poses.length - 1);
        const idxA = Math.floor(targetIndex);
        const idxB = Math.min(poses.length - 1, idxA + 1);
        const alpha = targetIndex - idxA;

        const posA = poses[idxA].position;
        const posB = poses[idxB].position;

        const currentPos = new THREE.Vector3(
          THREE.MathUtils.lerp(posA.x, posB.x, alpha),
          THREE.MathUtils.lerp(posA.y, posB.y, alpha),
          THREE.MathUtils.lerp(posA.z, posB.z, alpha)
        );

        cameraRef.current.position.copy(currentPos);
        cameraRef.current.lookAt(currentPos.x + 10, 0, currentPos.z);

        if (onTelemetryUpdate) {
          onTelemetryUpdate({
            lat: 34.142 + (currentPos.x * 0.0001),
            lon: 74.821 + (currentPos.z * 0.0001),
            alt: Number(currentPos.y.toFixed(1)),
            speed: 45.0,
            pitch: -45,
            roll: Number((Math.sin(time * 0.003) * 2).toFixed(1)),
            yaw: 88.5,
          });
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [onTelemetryUpdate]);

  // Synchronize model changes dynamically without re-creating WebGL renderer
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (currentModel) {
      // 1. Rebuild terrain geometry, structures, and 3D markers
      buildModelGeometry(scene, currentModel);

      // 2. Sync trajectory from currentModel
      if (currentModel.trajectory && currentModel.trajectory.length > 0) {
        const poses: CameraPose[] = currentModel.trajectory.map((t, idx) => ({
          id: t.frameIndex || idx + 1,
          timestamp: t.timestampSec,
          position: { x: t.position.x, y: t.position.y, z: t.position.z },
          rotation: { pitch: t.rotation.pitch, roll: t.rotation.roll, yaw: t.rotation.yaw },
          sharpness: 140,
          isKeyframe: idx % 2 === 0,
          gsdCm: t.gsdCm || 2.2,
        }));
        trajectoryPosesRef.current = poses;
        buildFlightPath(scene, poses);
      }

      // 3. Sync markers state
      if (currentModel.markers && currentModel.markers.length > 0) {
        setMarkers(currentModel.markers);
        buildTacticalMarkers(scene, currentModel.markers);
      }

      // 4. Update stats
      setMeshStats({
        vertices: currentModel.stats.vertexCount,
        triangles: currentModel.stats.triangleCount,
        fps: 60,
      });

      // 5. Re-center camera on model center
      const centerX = (currentModel.bounds.minX + currentModel.bounds.maxX) / 2;
      const centerY = (currentModel.bounds.minY + currentModel.bounds.maxY) / 2;
      const centerZ = (currentModel.bounds.minZ + currentModel.bounds.maxZ) / 2;
      const span = Math.max(90, (currentModel.bounds.maxX - currentModel.bounds.minX) * 0.95);
      sphericalRef.current = {
        radius: span,
        phi: Math.PI / 3.2,
        theta: Math.PI / 4,
      };
      if (cameraRef.current) {
        updateCameraPosition();
        cameraRef.current.lookAt(centerX, centerY + 2, centerZ);
      }
    } else {
      // Standby tactical grid
      if (terrainMeshRef.current) scene.remove(terrainMeshRef.current);
      if (pointCloudRef.current) scene.remove(pointCloudRef.current);
      if (wireframeRef.current) scene.remove(wireframeRef.current);
      if (tacticalStructuresGroupRef.current) scene.remove(tacticalStructuresGroupRef.current);
      if (tacticalMarkersGroupRef.current) scene.remove(tacticalMarkersGroupRef.current);
      if (droneTrajectoryGroupRef.current) scene.remove(droneTrajectoryGroupRef.current);
      if (gridHelperRef.current) scene.remove(gridHelperRef.current);

      const grid = new THREE.GridHelper(120, 24, 0x00f0ff, 0x222222);
      grid.position.y = -5;
      scene.add(grid);
      gridHelperRef.current = grid;
    }
  }, [currentModel, elevationScale]);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, phi, theta } = sphericalRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    if (currentModel) {
      const cx = (currentModel.bounds.minX + currentModel.bounds.maxX) / 2;
      const cy = (currentModel.bounds.minY + currentModel.bounds.maxY) / 2;
      const cz = (currentModel.bounds.minZ + currentModel.bounds.maxZ) / 2;
      cameraRef.current.lookAt(cx, cy + 2, cz);
    } else {
      cameraRef.current.lookAt(0, 4, 0);
    }
  };

  // Build Solid Volumetric Geological Skirt & Pedestal Box
  const buildVolumetricSkirt = (scene: THREE.Scene, model: ReconstructedTerrainModel, scaledVertices: Float32Array) => {
    if (skirtMeshRef.current) scene.remove(skirtMeshRef.current);
    if (basePlateRef.current) scene.remove(basePlateRef.current);

    const res = model.gridResolution;
    const numPerRow = res + 1;
    const baseY = Math.min(-7.0, model.bounds.minY * elevationScale - 3.5);

    // Extract perimeter vertices in clockwise loop
    const perimeterIndices: number[] = [];
    for (let c = 0; c <= res; c++) perimeterIndices.push(0 * numPerRow + c);
    for (let r = 1; r <= res; r++) perimeterIndices.push(r * numPerRow + res);
    for (let c = res - 1; c >= 0; c--) perimeterIndices.push(res * numPerRow + c);
    for (let r = res - 1; r >= 1; r--) perimeterIndices.push(r * numPerRow + 0);

    const N = perimeterIndices.length;
    const wallVerts = new Float32Array(N * 2 * 3);
    const wallColors = new Float32Array(N * 2 * 3);
    const wallIndices: number[] = [];

    for (let i = 0; i < N; i++) {
      const pIdx = perimeterIndices[i];
      const vx = scaledVertices[pIdx * 3];
      const vy = scaledVertices[pIdx * 3 + 1];
      const vz = scaledVertices[pIdx * 3 + 2];

      // Top perimeter vertex
      const topOffset = (i * 2) * 3;
      wallVerts[topOffset] = vx;
      wallVerts[topOffset + 1] = vy;
      wallVerts[topOffset + 2] = vz;
      wallColors[topOffset] = 0.16;
      wallColors[topOffset + 1] = 0.20;
      wallColors[topOffset + 2] = 0.26;

      // Bottom base vertex
      const botOffset = (i * 2 + 1) * 3;
      wallVerts[botOffset] = vx;
      wallVerts[botOffset + 1] = baseY;
      wallVerts[botOffset + 2] = vz;
      wallColors[botOffset] = 0.06;
      wallColors[botOffset + 1] = 0.08;
      wallColors[botOffset + 2] = 0.11;

      // Wall quad indices
      const nextI = (i + 1) % N;
      const topA = i * 2;
      const botA = i * 2 + 1;
      const topB = nextI * 2;
      const botB = nextI * 2 + 1;

      wallIndices.push(topA, botA, topB);
      wallIndices.push(topB, botA, botB);
    }

    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute("position", new THREE.Float32BufferAttribute(wallVerts, 3));
    wallGeo.setAttribute("color", new THREE.Float32BufferAttribute(wallColors, 3));
    wallGeo.setIndex(wallIndices);
    wallGeo.computeVertexNormals();

    const wallMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.receiveShadow = true;
    wallMesh.visible = renderMode === "mesh" || renderMode === "topo" || renderMode === "heatmap" || renderMode === "flir" || renderMode === "nvg";
    scene.add(wallMesh);
    skirtMeshRef.current = wallMesh;

    // Bottom Base Plate
    const minX = model.bounds.minX;
    const maxX = model.bounds.maxX;
    const minZ = model.bounds.minZ;
    const maxZ = model.bounds.maxZ;
    const baseWidth = (maxX - minX) * 1.05;
    const baseHeight = (maxZ - minZ) * 1.05;

    const baseGeo = new THREE.PlaneGeometry(baseWidth, baseHeight);
    baseGeo.rotateX(Math.PI / 2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x080d14,
      roughness: 0.95,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set((minX + maxX) / 2, baseY - 0.02, (minZ + maxZ) / 2);
    baseMesh.receiveShadow = true;
    baseMesh.visible = wallMesh.visible;
    scene.add(baseMesh);
    basePlateRef.current = baseMesh;
  };

  // Build Geometry from Reconstructed Terrain Model
  const buildModelGeometry = (scene: THREE.Scene, model: ReconstructedTerrainModel) => {
    // Clean old meshes if rebuilding
    if (terrainMeshRef.current) scene.remove(terrainMeshRef.current);
    if (skirtMeshRef.current) scene.remove(skirtMeshRef.current);
    if (basePlateRef.current) scene.remove(basePlateRef.current);
    if (pointCloudRef.current) scene.remove(pointCloudRef.current);
    if (wireframeRef.current) scene.remove(wireframeRef.current);
    if (gridHelperRef.current) scene.remove(gridHelperRef.current);

    const geometry = new THREE.BufferGeometry();
    
    // Scale vertex Y elevation dynamically by elevationScale
    const scaledVertices = new Float32Array(model.vertices.length);
    for (let i = 0; i < model.vertices.length; i += 3) {
      scaledVertices[i] = model.vertices[i];
      scaledVertices[i + 1] = model.vertices[i + 1] * elevationScale;
      scaledVertices[i + 2] = model.vertices[i + 2];
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(scaledVertices, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(model.colors, 3)
    );
    if (model.uvs && model.uvs.length > 0) {
      geometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(model.uvs, 2)
      );
    }
    if (model.normals && model.normals.length > 0) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(model.normals, 3)
      );
    } else {
      geometry.computeVertexNormals();
    }
    if (model.indices.length > 0) {
      geometry.setIndex(model.indices);
    }

    // 1. Textured Mesh with Normal Bump Mapping & Multi-Spectral Palettes
    const meshMaterial = new THREE.MeshStandardMaterial({
      vertexColors: !Boolean(model.textureDataUrl),
      color: 0xffffff,
      roughness: 0.76,
      metalness: 0.10,
      flatShading: false,
    });

    // Texture Loader Utility
    const textureLoader = new THREE.TextureLoader();

    // Load Orthomosaic Texture
    if (model.textureDataUrl) {
      textureLoader.load(model.textureDataUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        orthoTextureRef.current = tex;
        if (renderMode === "mesh") {
          meshMaterial.map = tex;
          meshMaterial.vertexColors = false;
          meshMaterial.color.set(0xffffff);
          meshMaterial.needsUpdate = true;
        }
      });
    }

    // Load Normal Bump Map
    if (model.normalMapUrl) {
      textureLoader.load(model.normalMapUrl, (normTex) => {
        normTex.wrapS = THREE.ClampToEdgeWrapping;
        normTex.wrapT = THREE.ClampToEdgeWrapping;
        normTex.minFilter = THREE.LinearMipmapLinearFilter;
        normTex.magFilter = THREE.LinearFilter;
        normalTextureRef.current = normTex;
        meshMaterial.normalMap = normTex;
        meshMaterial.normalScale = new THREE.Vector2(1.8, 1.8);
        meshMaterial.needsUpdate = true;
      });
    }

    // Pre-generate Topo Contours Texture
    const topoUrl = generateTopoTexture(model, 512);
    if (topoUrl) {
      textureLoader.load(topoUrl, (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        topoTextureRef.current = tex;
        if (renderMode === "topo" || renderMode === "heatmap") {
          meshMaterial.map = tex;
          meshMaterial.vertexColors = false;
          meshMaterial.needsUpdate = true;
        }
      });
    }

    // Pre-generate FLIR Texture
    const flirUrl = generateFlirTexture(model, 512);
    if (flirUrl) {
      textureLoader.load(flirUrl, (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        flirTextureRef.current = tex;
        if (renderMode === "flir") {
          meshMaterial.map = tex;
          meshMaterial.vertexColors = false;
          meshMaterial.needsUpdate = true;
        }
      });
    }

    // Pre-generate NVG Texture
    const nvgUrl = generateNvgTexture(model, 512);
    if (nvgUrl) {
      textureLoader.load(nvgUrl, (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        nvgTextureRef.current = tex;
        if (renderMode === "nvg") {
          meshMaterial.map = tex;
          meshMaterial.vertexColors = false;
          meshMaterial.needsUpdate = true;
        }
      });
    }

    const terrainMesh = new THREE.Mesh(geometry, meshMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 2. Build Solid Volumetric Geological Skirt & Pedestal Box
    buildVolumetricSkirt(scene, model, scaledVertices);

    // 3. Point Cloud
    const pointMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const pointCloud = new THREE.Points(geometry, pointMaterial);
    pointCloud.visible = renderMode === "pointcloud";
    scene.add(pointCloud);
    pointCloudRef.current = pointCloud;

    // 4. Wireframe
    const wireframeGeo = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
    });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    wireframe.visible = renderMode === "wireframe";
    scene.add(wireframe);
    wireframeRef.current = wireframe;

    // 5. Tactical Structures (Dynamically generated per model)
    buildTacticalStructures(scene, model);

    // 6. Tactical 3D Beacons / Markers
    if (model.markers && model.markers.length > 0) {
      buildTacticalMarkers(scene, model.markers);
    }

    // 7. Ground Grid beneath terrain
    const gridHelper = new THREE.GridHelper(model.gridSize * 1.3, 30, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = Math.min(-7.5, model.bounds.minY - 3.5);
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;
  };

  const buildTacticalStructures = (scene: THREE.Scene, model: ReconstructedTerrainModel) => {
    if (tacticalStructuresGroupRef.current) {
      scene.remove(tacticalStructuresGroupRef.current);
    }

    const group = new THREE.Group();
    group.visible = showStructures;
    tacticalStructuresGroupRef.current = group;

    const structures = model.structures || [];
    structures.forEach((s) => {
      const [x, y, z] = s.position;
      const [w, h, d] = s.size;
      const color = s.colorHex || 0x334155;

      if (s.type === "watchtower") {
        // Tower cylinder mast
        const towerGeo = new THREE.CylinderGeometry(w * 0.35, w * 0.5, h, 8);
        const towerMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
        const towerMesh = new THREE.Mesh(towerGeo, towerMat);
        towerMesh.position.set(x, y + h / 2, z);
        towerMesh.castShadow = true;
        group.add(towerMesh);

        // Lookout deck
        const deckGeo = new THREE.CylinderGeometry(w * 0.8, w * 0.8, 1.2, 8);
        const deckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
        const deckMesh = new THREE.Mesh(deckGeo, deckMat);
        deckMesh.position.set(x, y + h + 0.6, z);
        group.add(deckMesh);

        // Flashing cyan/amber beacon
        const beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(x, y + h + 1.8, z);
        group.add(beacon);
      } else if (s.type === "outpost") {
        // Main outpost building
        const baseGeo = new THREE.BoxGeometry(w, h, d);
        const baseMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(x, y + h / 2, z);
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Radar dome on roof
        const domeGeo = new THREE.SphereGeometry(Math.min(w, d) * 0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, emissive: 0x002233 });
        const domeMesh = new THREE.Mesh(domeGeo, domeMat);
        domeMesh.position.set(x, y + h, z);
        group.add(domeMesh);
      } else if (s.type === "bridge") {
        // Bridge deck
        const deckGeo = new THREE.BoxGeometry(w, h, d);
        const deckMat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5 });
        const deckMesh = new THREE.Mesh(deckGeo, deckMat);
        deckMesh.position.set(x, y + h / 2, z);
        deckMesh.castShadow = true;
        group.add(deckMesh);

        // Pylons
        const pylonGeo = new THREE.CylinderGeometry(1.2, 1.5, Math.max(4, y + 4), 6);
        const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const p1 = new THREE.Mesh(pylonGeo, pylonMat);
        p1.position.set(x - w * 0.3, y / 2, z);
        const p2 = new THREE.Mesh(pylonGeo, pylonMat);
        p2.position.set(x + w * 0.3, y / 2, z);
        group.add(p1, p2);
      } else if (s.type === "bunker") {
        // Fortified bunker
        const bunkerGeo = new THREE.BoxGeometry(w, h, d);
        const bunkerMat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 });
        const bunkerMesh = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunkerMesh.position.set(x, y + h / 2, z);
        bunkerMesh.castShadow = true;
        group.add(bunkerMesh);

        // Firing / sensor slit
        const slitGeo = new THREE.BoxGeometry(w * 0.7, 0.4, d + 0.1);
        const slitMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const slitMesh = new THREE.Mesh(slitGeo, slitMat);
        slitMesh.position.set(x, y + h * 0.6, z);
        group.add(slitMesh);
      } else {
        // General structure
        const boxGeo = new THREE.BoxGeometry(w, h, d);
        const boxMat = new THREE.MeshStandardMaterial({ color, metalness: 0.5 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(x, y + h / 2, z);
        group.add(boxMesh);
      }

      // Tactical holographic ping ring beneath structure
      const ringGeo = new THREE.RingGeometry(Math.max(w, d) * 0.6, Math.max(w, d) * 0.75, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(x, y + 0.15, z);
      group.add(ringMesh);
    });

    scene.add(group);
  };

  useEffect(() => {
    if (tacticalStructuresGroupRef.current) {
      tacticalStructuresGroupRef.current.visible = showStructures;
    }
  }, [showStructures]);

  const buildTacticalMarkers = (scene: THREE.Scene, markerList: TacticalMarker[]) => {
    if (tacticalMarkersGroupRef.current) {
      scene.remove(tacticalMarkersGroupRef.current);
    }

    const group = new THREE.Group();
    tacticalMarkersGroupRef.current = group;

    markerList.forEach((m) => {
      const { x, y, z } = m.position;
      const color = m.type === "friendly" ? 0x00f0ff : m.type === "target" ? 0xf97316 : 0xeab308;

      // Vertical beacon light beam
      const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, 7, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(x, y + 3.5, z);
      group.add(beam);

      // Top beacon crystal (Octahedron)
      const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
      const crystalMat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(x, y + 7.5, z);
      group.add(crystal);

      // Ground beacon circle
      const baseGeo = new THREE.RingGeometry(1.5, 2.2, 16);
      baseGeo.rotateX(-Math.PI / 2);
      const baseMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(x, y + 0.1, z);
      group.add(base);
    });

    scene.add(group);
  };

  const buildFlightPath = (scene: THREE.Scene, poses: CameraPose[]) => {
    if (droneTrajectoryGroupRef.current) {
      scene.remove(droneTrajectoryGroupRef.current);
    }

    const group = new THREE.Group();
    droneTrajectoryGroupRef.current = group;

    const curvePoints = poses.map((p) => new THREE.Vector3(p.position.x, p.position.y, p.position.z));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const splineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(120));
    const splineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const trajectoryLine = new THREE.Line(splineGeo, splineMat);
    group.add(trajectoryLine);

    poses.forEach((p, idx) => {
      if (idx % 3 === 0) {
        const frustumGeo = new THREE.ConeGeometry(3.5, 7, 4, 1, true);
        frustumGeo.rotateX(Math.PI / 2);
        const frustumMat = new THREE.MeshBasicMaterial({
          color: p.isKeyframe ? 0x10b981 : 0xef4444,
          wireframe: true,
          transparent: true,
          opacity: p.isKeyframe ? 0.6 : 0.2,
        });
        const frustumMesh = new THREE.Mesh(frustumGeo, frustumMat);
        frustumMesh.position.set(p.position.x, p.position.y, p.position.z);
        frustumMesh.rotation.x = THREE.MathUtils.degToRad(p.rotation.pitch);
        group.add(frustumMesh);
      }
    });

    scene.add(group);
  };

  // Switch Multi-Spectral & Shading Modes
  const handleRenderModeChange = (mode: RenderMode) => {
    setRenderMode(mode);
    if (!terrainMeshRef.current || !pointCloudRef.current || !wireframeRef.current) return;

    const isMeshVisible = mode === "mesh" || mode === "topo" || mode === "heatmap" || mode === "flir" || mode === "nvg";
    terrainMeshRef.current.visible = isMeshVisible;
    if (skirtMeshRef.current) skirtMeshRef.current.visible = isMeshVisible;
    if (basePlateRef.current) basePlateRef.current.visible = isMeshVisible;
    pointCloudRef.current.visible = mode === "pointcloud";
    wireframeRef.current.visible = mode === "wireframe";

    const meshMat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;

    if (mode === "topo" || mode === "heatmap") {
      if (topoTextureRef.current) {
        meshMat.map = topoTextureRef.current;
        meshMat.vertexColors = false;
      }
      meshMat.roughness = 0.65;
      meshMat.metalness = 0.05;
      meshMat.emissive.set(0x000000);
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x06090e);
    } else if (mode === "flir") {
      if (flirTextureRef.current) {
        meshMat.map = flirTextureRef.current;
        meshMat.vertexColors = false;
      }
      meshMat.roughness = 0.85;
      meshMat.metalness = 0.0;
      meshMat.emissive.set(0x110022);
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x040208);
    } else if (mode === "nvg") {
      if (nvgTextureRef.current) {
        meshMat.map = nvgTextureRef.current;
        meshMat.vertexColors = false;
      }
      meshMat.roughness = 0.45;
      meshMat.metalness = 0.2;
      meshMat.emissive.set(0x002208);
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x010803);
    } else if (mode === "mesh") {
      if (orthoTextureRef.current) {
        meshMat.map = orthoTextureRef.current;
        meshMat.vertexColors = false;
      }
      meshMat.roughness = 0.76;
      meshMat.metalness = 0.10;
      meshMat.emissive.set(0x000000);
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x06090e);
    }
    meshMat.needsUpdate = true;
  };

  // Mouse Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    if (
      activeTool === "measure_distance" ||
      activeTool === "line_of_sight" ||
      activeTool === "ingress_path" ||
      activeTool === "elevation_slicer"
    ) {
      handle3DInteractionClick(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || activeTool !== "orbit" || isPlayingFlyover) return;
    const deltaX = e.clientX - mousePosRef.current.x;
    const deltaY = e.clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    sphericalRef.current.theta -= deltaX * 0.007;
    sphericalRef.current.phi = Math.max(
      0.15,
      Math.min(Math.PI / 2 - 0.05, sphericalRef.current.phi - deltaY * 0.007)
    );
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isPlayingFlyover) return;
    e.preventDefault();
    sphericalRef.current.radius = Math.max(
      20,
      Math.min(240, sphericalRef.current.radius + e.deltaY * 0.08)
    );
    updateCameraPosition();
  };

  // 3D Raycast Clicking for Calipers, LOS, Elevation Transect & Ingress Route
  const handle3DInteractionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0].point;
      clickPointsRef.current.push(hit);

      if (clickPointsRef.current.length === 2) {
        if (!currentModel) {
          clickPointsRef.current = [];
          return;
        }
        const ptA = clickPointsRef.current[0];
        const ptB = clickPointsRef.current[1];

        if (activeTool === "elevation_slicer") {
          // Compute 2D Elevation Cross-Section Profile
          const profileRes = computeElevationProfile(
            currentModel,
            { x: ptA.x, z: ptA.z },
            { x: ptB.x, z: ptB.z },
            60
          );
          setElevationProfile(profileRes);

          if (measurementLineRef.current && sceneRef.current) {
            sceneRef.current.remove(measurementLineRef.current);
          }

          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(ptA.x, ptA.y + 0.3, ptA.z),
            new THREE.Vector3(ptB.x, ptB.y + 0.3, ptB.z),
          ]);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x818cf8, // Indigo/periwinkle cross-section cut line
            linewidth: 3,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          sceneRef.current.add(line);
          measurementLineRef.current = line;

          const res = calculateMeasurement(
            { x: ptA.x, y: ptA.y, z: ptA.z },
            { x: ptB.x, y: ptB.y, z: ptB.z }
          );
          setMeasurement(res);
          setLosStatus(null);
          setIngressResult(null);
        } else if (activeTool === "ingress_path") {
          // Compute Tactical Ingress Route across terrain contours
          const ingressRes = findTacticalIngressPath(
            currentModel,
            { x: ptA.x, z: ptA.z },
            { x: ptB.x, z: ptB.z }
          );

          if (ingressPathLineRef.current && sceneRef.current) {
            sceneRef.current.remove(ingressPathLineRef.current);
          }

          const pathPoints = ingressRes.path.map((p) => new THREE.Vector3(p.x, p.y + 0.4, p.z));
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0xf59e0b, // glowing amber tactical route
            linewidth: 4,
          });
          const pathLine = new THREE.Line(lineGeo, lineMat);
          sceneRef.current.add(pathLine);
          ingressPathLineRef.current = pathLine;
          setIngressResult(ingressRes);
          setMeasurement(null);
          setLosStatus(null);
          setElevationProfile(null);
        } else {
          // Standard Distance or Line-of-Sight Caliper
          if (measurementLineRef.current && sceneRef.current) {
            sceneRef.current.remove(measurementLineRef.current);
          }

          const isLosTool = activeTool === "line_of_sight";
          const losRes = evaluateLineOfSight(
            { x: ptA.x, y: ptA.y, z: ptA.z },
            { x: ptB.x, y: ptB.y, z: ptB.z },
            [
              { center: { x: -15, y: 6, z: -10 }, radius: 8, height: 8 },
              { center: { x: 22, y: 12, z: 12 }, radius: 3, height: 18 },
            ]
          );

          const lineGeo = new THREE.BufferGeometry().setFromPoints([ptA, ptB]);
          const lineMat = new THREE.LineBasicMaterial({
            color: isLosTool ? (losRes.hasLineOfSight ? 0x10b981 : 0xef4444) : 0x00f0ff,
            linewidth: 3,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          sceneRef.current.add(line);
          measurementLineRef.current = line;

          const res = calculateMeasurement(
            { x: ptA.x, y: ptA.y, z: ptA.z },
            { x: ptB.x, y: ptB.y, z: ptB.z }
          );
          setMeasurement(res);
          setLosStatus({ hasLos: losRes.hasLineOfSight, distance: losRes.distanceM });
          setIngressResult(null);

          // If standard distance caliper is used, also generate elevation profile
          if (activeTool === "measure_distance") {
            const profileRes = computeElevationProfile(
              currentModel,
              { x: ptA.x, z: ptA.z },
              { x: ptB.x, z: ptB.z },
              60
            );
            setElevationProfile(profileRes);
          } else {
            setElevationProfile(null);
          }
        }

        clickPointsRef.current = [];
      }
    }
  };

  const resetView = () => {
    const defaultRadius = currentModel
      ? Math.max(90, (currentModel.bounds.maxX - currentModel.bounds.minX) * 0.95)
      : 95;
    sphericalRef.current = { radius: defaultRadius, phi: Math.PI / 3.2, theta: Math.PI / 4 };
    setIsPlayingFlyover(false);
    updateCameraPosition();
    if (measurementLineRef.current && sceneRef.current) {
      sceneRef.current.remove(measurementLineRef.current);
      measurementLineRef.current = null;
    }
    if (ingressPathLineRef.current && sceneRef.current) {
      sceneRef.current.remove(ingressPathLineRef.current);
      ingressPathLineRef.current = null;
    }
    setMeasurement(null);
    setLosStatus(null);
    setIngressResult(null);
    setElevationProfile(null);
  };

  // Real 3D File Exporters
  const handleExportOBJ = () => {
    if (!currentModel) return;
    const objData = exportToWavefrontOBJ(currentModel);
    const blob = new Blob([objData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drono_${currentModel.missionId}.obj`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPLY = () => {
    if (!currentModel) return;
    const plyData = exportToStanfordPLY(currentModel);
    const blob = new Blob([plyData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drono_${currentModel.missionId}.ply`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden glass-panel border border-glass-border shadow-2xl ${className}`}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      />

      {/* Standby Empty State Overlay */}
      {!currentModel && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm p-6 text-center space-y-3 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[var(--color-mist-gray)] border border-[var(--border-subtle)] flex items-center justify-center text-foreground shadow-sm">
            <Mountain className="w-5 h-5 text-[var(--color-slate-gray)]" />
          </div>
          <div className="space-y-1 max-w-xs">
            <div className="text-sm font-medium text-foreground">
              Awaiting 3D Terrain Synthesis
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Ingest a UAV flight video, filter keyframes via discrete Laplacian variance, and compile 3D terrain to activate this interactive viewport.
            </p>
          </div>
        </div>
      )}

      {/* Top Floating Tactical HUD Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Classification & Render Mode Chips */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <div className="px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] flex items-center gap-2 bg-[var(--bg-primary)]/90 backdrop-blur-md shadow-sm">
            <span className={`w-2 h-2 rounded-full ${currentModel ? "bg-emerald-500 animate-pulse" : "bg-[var(--color-slate-gray)]"}`} />
            <span className="text-xs font-mono font-medium text-foreground">
              {currentModel
                ? currentModel.isDirectVideoReconstruction
                  ? `Direct Video Twin (${currentModel.depthSource === 'neural' ? 'Neural Depth' : 'Photogrammetric'})`
                  : "3D Model Active"
                : "3D Viewport Standby"}
            </span>
          </div>

          {/* Multi-Spectral & Shader Mode Selector */}
          <div className="p-1 rounded-full flex items-center gap-1 border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md shadow-sm overflow-x-auto">
            <button
              onClick={() => handleRenderModeChange("mesh")}
              className={`px-3 py-1 rounded-full text-xs font-sans-ui font-medium transition-all ${
                renderMode === "mesh"
                  ? "bg-foreground text-[var(--bg-primary)] shadow-sm"
                  : "text-[var(--color-slate-gray)] hover:text-foreground"
              }`}
              title="True-Color Photogrammetric Mesh with Tangent-Space Normals"
            >
              Ortho
            </button>
            <button
              onClick={() => handleRenderModeChange("topo")}
              className={`px-3 py-1 rounded-full text-xs font-sans-ui font-medium transition-all flex items-center gap-1 ${
                renderMode === "topo" || renderMode === "heatmap"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-[var(--color-slate-gray)] hover:text-foreground"
              }`}
              title="Topographic Contours & Hypsometric Altitude Relief"
            >
              <Mountain className="w-3 h-3" />
              <span>Contours</span>
            </button>
            <button
              onClick={() => handleRenderModeChange("flir")}
              className={`px-3 py-1 rounded-full text-xs font-sans-ui font-medium transition-all flex items-center gap-1 ${
                renderMode === "flir"
                  ? "bg-amber-500 text-black font-semibold shadow-sm"
                  : "text-[var(--color-slate-gray)] hover:text-foreground"
              }`}
              title="Military FLIR Thermal Infrared Ironbow Shading"
            >
              <Flame className="w-3 h-3" />
              <span>FLIR</span>
            </button>
            <button
              onClick={() => handleRenderModeChange("nvg")}
              className={`px-3 py-1 rounded-full text-xs font-sans-ui font-medium transition-all flex items-center gap-1 ${
                renderMode === "nvg"
                  ? "bg-emerald-500 text-black font-semibold shadow-sm"
                  : "text-[var(--color-slate-gray)] hover:text-foreground"
              }`}
              title="Gen-3 Tactical Night Vision Goggles Mode"
            >
              <Moon className="w-3 h-3" />
              <span>NVG</span>
            </button>
            <button
              onClick={() => handleRenderModeChange("pointcloud")}
              className={`px-3 py-1 rounded-full text-xs font-sans-ui font-medium transition-all ${
                renderMode === "pointcloud"
                  ? "bg-foreground text-[var(--bg-primary)] shadow-sm"
                  : "text-[var(--color-slate-gray)] hover:text-foreground"
              }`}
              title="Dense LiDAR Point Cloud"
            >
              Points
            </button>
            <button
              onClick={() => handleRenderModeChange("wireframe")}
              className={`px-3 py-1 rounded-full text-xs font-sans-ui font-medium transition-all ${
                renderMode === "wireframe"
                  ? "bg-foreground text-[var(--bg-primary)] shadow-sm"
                  : "text-[var(--color-slate-gray)] hover:text-foreground"
              }`}
              title="Tactical Wireframe Topography"
            >
              Wireframe
            </button>
          </div>

          {/* Flight Corridor Selector */}
          <div className="hidden lg:flex p-1 rounded-full items-center gap-1 border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md shadow-sm">
            {CORRIDORS.map((c) => {
              const isCurrent = currentModel?.videoFileName === c.file || (!currentModel?.videoFileName && c.id === "dji-0317");
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCorridor(c)}
                  className={`px-2.5 py-1 rounded-full text-xs font-sans-ui transition-all ${
                    isCurrent
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "text-[var(--color-slate-gray)] hover:text-foreground"
                  }`}
                  title={`Load ${c.name} 3D Model`}
                >
                  {c.name.replace("DJI-", "")}
                </button>
              );
            })}
          </div>

          {/* Elevation Relief Slider */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md shadow-sm">
            <span className="text-[10px] font-mono text-[var(--color-slate-gray)] uppercase tracking-wider">Relief:</span>
            <input
              type="range"
              min="0.3"
              max="3.0"
              step="0.1"
              value={elevationScale}
              onChange={(e) => setElevationScale(parseFloat(e.target.value))}
              className="w-16 h-1 bg-[var(--color-slate-gray)]/30 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title={`Elevation Relief Multiplier: ${elevationScale.toFixed(1)}x`}
            />
            <span className="text-xs font-mono font-bold text-foreground w-8">{elevationScale.toFixed(1)}x</span>
          </div>
        </div>

        {/* Right: AI SITREP & Telemetry Mini Readout */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleGenerateAiSitrep}
            disabled={isAiLoading}
            className="px-3.5 py-1.5 rounded-full border border-[var(--color-sienna-brown)] bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] font-sans-ui text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm cursor-pointer"
            title="Generate AI Tactical Situation Report via Groq LPU"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? "animate-spin" : "animate-pulse"}`} />
            <span>{isAiLoading ? "Analyzing..." : "AI SITREP"}</span>
          </button>

          <div className="hidden sm:flex px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md font-mono text-xs text-[var(--color-slate-gray)] items-center gap-3 shadow-sm">
            <span className="text-emerald-500 font-medium">{meshStats.fps} FPS</span>
            <span>{meshStats.vertices.toLocaleString()} Verts</span>
            <span className="text-foreground">{currentModel ? `${currentModel.stats.estimatedGsdCm} cm/px` : "STANDBY"}</span>
          </div>
        </div>
      </div>

      {/* Left Vertical Tactical Toolbar */}
      {showControls && (
        <div className="absolute left-4 top-20 flex flex-col gap-2 pointer-events-auto">
          {/* Orbit Tool */}
          <button
            onClick={() => setActiveTool("orbit")}
            className={`p-2.5 rounded-full border transition-all ${
              activeTool === "orbit"
                ? "border-foreground bg-foreground text-[var(--bg-primary)] shadow-sm"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--color-slate-gray)] hover:text-foreground"
            }`}
            title="3D Orbit / Rotate"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* 3D Measurement Caliper */}
          <button
            onClick={() => setActiveTool("measure_distance")}
            className={`p-2.5 rounded-full border transition-all ${
              activeTool === "measure_distance"
                ? "border-foreground bg-foreground text-[var(--bg-primary)] shadow-sm"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--color-slate-gray)] hover:text-foreground"
            }`}
            title="Measure 3D Distance (Click 2 points)"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Line of Sight Raycaster */}
          <button
            onClick={() => setActiveTool("line_of_sight")}
            className={`p-2.5 rounded-full border transition-all ${
              activeTool === "line_of_sight"
                ? "border-[var(--color-sienna-brown)] bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] shadow-sm font-medium"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--color-slate-gray)] hover:text-foreground"
            }`}
            title="Line-of-Sight Visibility (Click Observer & Target)"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Tactical Ingress / Stealth Pathfinding */}
          <button
            onClick={() => setActiveTool("ingress_path")}
            className={`p-2.5 rounded-full border transition-all ${
              activeTool === "ingress_path"
                ? "border-amber-500 bg-amber-500/20 text-amber-500 shadow-sm font-medium"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--color-slate-gray)] hover:text-foreground"
            }`}
            title="Tactical Ingress Route Pathfinding (Click 2 points)"
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* 2D Elevation Cross-Section Profile Slicer */}
          <button
            onClick={() => setActiveTool("elevation_slicer")}
            className={`p-2.5 rounded-full border transition-all ${
              activeTool === "elevation_slicer"
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-sm font-medium"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--color-slate-gray)] hover:text-foreground"
            }`}
            title="2D Elevation Profile Slicer (Click 2 points to cut transect)"
          >
            <Mountain className="w-4 h-4" />
          </button>

          {/* Drone Flyover Flight Path Play/Pause */}
          <button
            onClick={() => setIsPlayingFlyover(!isPlayingFlyover)}
            className={`p-2.5 rounded-full border transition-all ${
              isPlayingFlyover
                ? "border-[var(--color-sienna-brown)] bg-[var(--color-blush-peach)] text-[var(--color-sienna-brown)] shadow-sm font-medium"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--color-slate-gray)] hover:text-foreground"
            }`}
            title={isPlayingFlyover ? "Pause Flyover" : "Simulate Single-Pass UAV Flyover"}
          >
            {isPlayingFlyover ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetView}
            className="p-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 text-[var(--color-slate-gray)] hover:text-foreground transition-all"
            title="Reset Perspective"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2D Elevation Cross-Section Slicer HUD */}
      {elevationProfile && (
        <ElevationProfileSlicer
          data={elevationProfile}
          onClose={() => setElevationProfile(null)}
          className="absolute bottom-6 left-4 right-4 sm:right-auto sm:max-w-xl z-20"
        />
      )}

      {/* Measurement & Caliper Result Overlay (when elevation profile is not open) */}
      {measurement && !elevationProfile && (
        <div className="absolute bottom-6 left-4 max-w-sm floating-artifact p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" />
              <span>3D Caliper Telemetry</span>
            </span>
            <button
              onClick={() => {
                setMeasurement(null);
                setLosStatus(null);
              }}
              className="text-[var(--color-slate-gray)] hover:text-foreground text-xs p-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Euclidean Dist</div>
              <div className="text-base font-bold text-foreground">
                {measurement.euclideanDistanceM} m
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Ground Dist</div>
              <div className="text-base font-bold text-foreground">
                {measurement.groundDistanceM} m
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Elevation Delta</div>
              <div className="text-base font-bold text-foreground">
                {measurement.elevationDeltaM} m
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Slope Grade</div>
              <div className="text-base font-bold text-foreground">
                {measurement.slopeDegrees}°
              </div>
            </div>
          </div>

          {losStatus && (
            <div
              className={`mt-3 p-2.5 rounded-xl border flex items-center gap-2 text-xs font-mono ${
                losStatus.hasLos
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>
                {losStatus.hasLos
                  ? "Line-of-Sight Clear"
                  : "Line-of-Sight Occluded by Terrain"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Ingress Route Telemetry Card Overlay */}
      {ingressResult && (
        <div className="absolute bottom-6 left-4 max-w-sm floating-artifact p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2 border border-amber-500/30 bg-[var(--bg-primary)]/95">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-mono font-medium text-amber-500 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              <span>Tactical Ingress Route (A*)</span>
            </span>
            <button
              onClick={() => setIngressResult(null)}
              className="text-[var(--color-slate-gray)] hover:text-foreground text-xs p-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Route Distance</div>
              <div className="text-base font-bold text-foreground">
                {ingressResult.totalDistanceM} m
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Stealth Index</div>
              <div className="text-base font-bold text-emerald-500">
                {100 - ingressResult.exposureScore}% Hidden
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Elevation Gain</div>
              <div className="text-base font-bold text-foreground">
                {ingressResult.elevationDeltaM} m
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-mist-gray)]">
              <div className="text-[10px] text-[var(--color-slate-gray)]">Max Slope</div>
              <div className="text-base font-bold text-foreground">
                {ingressResult.steepestSlopeDeg}°
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right: Real 3D File Exporters (.OBJ and .PLY) */}
      {currentModel && (
        <div className="absolute bottom-6 right-4 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleExportOBJ}
            className="px-3.5 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md hover:bg-[var(--bg-primary)] text-foreground font-sans-ui text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Export Reconstructed 3D Mesh (.OBJ format for Blender / MeshLab)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .OBJ</span>
          </button>

          <button
            onClick={handleExportPLY}
            className="px-3.5 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md hover:bg-[var(--bg-primary)] text-foreground font-sans-ui text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Export Dense Point Cloud (.PLY format)"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export .PLY</span>
          </button>
        </div>
      )}

      {/* Tactical AI SITREP Modal (Powered by Groq LPU) */}
      <TacticalAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        sitrep={aiSitrep}
        isLoading={isAiLoading}
        latencyMs={aiLatencyMs}
        model={aiModel}
        missionName={currentModel ? currentModel.missionName : "Drono Corridor Reconnaissance"}
      />
    </div>
  );
}
