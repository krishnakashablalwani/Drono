"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ReconstructedTerrainModel,
  VideoFrameData,
  reconstructTerrainFromKeyframes,
} from "@/lib/videoProcessing";

interface ReconModelContextType {
  activeModel: ReconstructedTerrainModel | null;
  activeVideoUrl: string | null;
  videoFrames: VideoFrameData[];
  blurThreshold: number;
  hasCustomModel: boolean;
  setActiveModel: (model: ReconstructedTerrainModel | null) => void;
  setActiveVideoUrl: (url: string | null) => void;
  setVideoFrames: (frames: VideoFrameData[]) => void;
  setBlurThreshold: (val: number) => void;
  clearActiveModel: () => void;
  clearSession: () => void;
  resetToDefaultModel: () => void;
}

const ReconModelContext = createContext<ReconModelContextType | undefined>(undefined);

export function ReconModelProvider({ children }: { children: React.ReactNode }) {
  const [activeModel, setActiveModel] = useState<ReconstructedTerrainModel | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [videoFrames, setVideoFrames] = useState<VideoFrameData[]>([]);
  const [blurThreshold, setBlurThreshold] = useState<number>(120);

  const clearActiveModel = () => {
    setActiveModel(null);
  };

  const clearSession = () => {
    setActiveModel(null);
    setActiveVideoUrl(null);
    setVideoFrames([]);
  };

  const resetToDefaultModel = () => {
    clearSession();
  };

  const hasCustomModel = Boolean(activeModel);

  return (
    <ReconModelContext.Provider
      value={{
        activeModel,
        activeVideoUrl,
        videoFrames,
        blurThreshold,
        hasCustomModel,
        setActiveModel,
        setActiveVideoUrl,
        setVideoFrames,
        setBlurThreshold,
        clearActiveModel,
        clearSession,
        resetToDefaultModel,
      }}
    >
      {children}
    </ReconModelContext.Provider>
  );
}

export function useReconModel() {
  const context = useContext(ReconModelContext);
  if (!context) {
    return {
      activeModel: null,
      activeVideoUrl: null,
      videoFrames: [],
      blurThreshold: 120,
      hasCustomModel: false,
      setActiveModel: () => {},
      setActiveVideoUrl: () => {},
      setVideoFrames: () => {},
      setBlurThreshold: () => {},
      clearActiveModel: () => {},
      clearSession: () => {},
      resetToDefaultModel: () => {},
    };
  }
  return context;
}
