"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ShikshaBot3D } from "./ShikshaBot3D";
import { FloatingEducationObjects } from "./FloatingEducationObjects";
import { Sparkles as SparklesIcon, Bot } from "lucide-react";

interface RobotCanvasProps {
  scrollProgress?: number;
  className?: string;
  showFloatingObjects?: boolean;
}

export function RobotCanvas({
  scrollProgress = 0,
  className = "w-full h-[520px] sm:h-[600px] lg:h-[680px]",
  showFloatingObjects = true,
}: RobotCanvasProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasWebGl, setHasWebGl] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    // Detect WebGL capability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGl(false);
    } catch {
      setHasWebGl(false);
    }
  }, []);

  if (!isMounted) {
    return (
      <div className={`flex items-center justify-center ${className} bg-[#49352F]/5 rounded-3xl animate-pulse`}>
        <div className="flex items-center gap-2 text-[#49352F] text-xs font-semibold">
          <SparklesIcon className="w-4 h-4 animate-spin text-[#B26A1B]" />
          <span>Initializing 3D Engine...</span>
        </div>
      </div>
    );
  }

  // Graceful 2D fallback if WebGL is disabled or unsupported
  if (!hasWebGl) {
    return (
      <div className={`flex items-center justify-center ${className} rounded-3xl border border-[#49352F]/15 bg-[#FAF6E9] p-8 text-center`}>
        <div className="max-w-sm space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#F2CAB3] text-[#49352F] flex items-center justify-center mx-auto border border-[#49352F]/15">
            <Bot className="w-8 h-8 text-[#49352F]" aria-hidden="true" />
          </div>
          <h4 className="text-[#49352F] font-bold text-sm">SaathiBot Ready</h4>
          <p className="text-xs text-[#7A6862]">
            Hardware acceleration is disabled on this device. Experience continues in high-performance mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} select-none overflow-visible`}>
      {/* Studio Radial Vignette Background (Inspired by Reference Image) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(30,58,138,0.25)_0%,rgba(15,23,42,0)_70%)] pointer-events-none -z-10" />

      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* ========================================================== */}
          {/* STUDIO LIGHTING RIG (Cinematic Humanoid Setup)              */}
          {/* ========================================================== */}
          {/* Ambient Fill */}
          <ambientLight intensity={0.7} color="#c7d2fe" />

          {/* Main Top Spotlight (Highlights white helmet and chest) */}
          <spotLight
            position={[0, 6, 3]}
            intensity={3.8}
            angle={0.65}
            penumbra={0.8}
            color="#ffffff"
            castShadow
          />

          {/* Electric Cyan Rim Light (Backlight creating glowing silhouette) */}
          <pointLight position={[0, 2, -2.5]} intensity={4.5} color="#00f0ff" distance={8} />

          {/* Left Fill Light (Electric Blue) */}
          <pointLight position={[-3.5, 1, 2]} intensity={1.8} color="#38bdf8" distance={7} />

          {/* Right Warm Light */}
          <pointLight position={[3.5, 0.5, 2]} intensity={1.5} color="#818cf8" distance={7} />

          {/* ========================================================== */}
          {/* 3D SCENE OBJECTS                                           */}
          {/* ========================================================== */}
          <ShikshaBot3D scrollProgress={scrollProgress} scale={1.12} position={[0, -0.65, 0]} />

          {showFloatingObjects && <FloatingEducationObjects />}
        </Suspense>
      </Canvas>
    </div>
  );
}
