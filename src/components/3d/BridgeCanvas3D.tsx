"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { BridgeHero3D } from "./BridgeHero3D";
import { Sparkles, Zap, Eye, Monitor } from "lucide-react";

interface BridgeCanvas3DProps {
  progress: number;
}

// High performance 2D SVG Fallback for low-end devices or users who prefer Lite Mode
function BridgeLiteFallback({ progress }: { progress: number }) {
  const plankCount = 14;
  const buildRatio = Math.min(1, Math.max(0.3, progress * 0.7 + 0.3));
  const activePlanks = Math.floor(buildRatio * plankCount);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-gradient-to-b from-[#14123D] via-[#1a184a] to-[#0d0b28]">
      {/* Night Sky Stars & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(255,138,61,0.18)_0%,rgba(61,219,169,0.08)_40%,transparent_70%)]" />

      {/* 2D SVG Bridge Illustration */}
      <div className="absolute inset-x-0 bottom-[12%] h-[380px] max-w-6xl mx-auto flex items-center justify-between px-8">
        {/* Left Island: Learning Gap */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-2xl bg-slate-900/80 border border-rose-500/40 p-3 shadow-[0_0_25px_rgba(255,92,108,0.25)] flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold text-rose-400">GAP ISLAND</span>
            <div className="flex gap-1.5 justify-center">
              <div className="w-6 h-6 rounded-md bg-rose-950/80 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center justify-center">
                A
              </div>
              <div className="w-6 h-6 rounded-md bg-rose-950/80 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center justify-center">
                1
              </div>
            </div>
            <span className="text-[9px] text-slate-400 text-center">Baseline: 35%</span>
          </div>
          <div className="w-36 h-8 rounded-full bg-slate-950/80 blur-xs mt-2" />
        </div>

        {/* Bridge Planks Spanning Across */}
        <div className="flex-1 px-4 relative flex items-center justify-center">
          {/* Main glowing arch */}
          <div className="w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 rounded-full shadow-[0_0_15px_#FF8A3D]" />

          {/* Planks */}
          <div className="absolute inset-x-4 flex justify-between">
            {Array.from({ length: plankCount }).map((_, i) => {
              const isBuilt = i <= activePlanks;
              return (
                <div
                  key={i}
                  className={`w-3.5 h-6 rounded-xs transition-all duration-300 ${
                    isBuilt
                      ? i > 7
                        ? "bg-emerald-400 shadow-[0_0_10px_#3DDBA9]"
                        : "bg-amber-400 shadow-[0_0_10px_#FF8A3D]"
                      : "bg-slate-800/40 opacity-20"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Right Island: Mastery */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-2xl bg-slate-900/80 border border-emerald-500/40 p-3 shadow-[0_0_25px_rgba(61,219,169,0.3)] flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-400">MASTERY</span>
            <div className="flex justify-center text-amber-400 text-xl font-bold animate-pulse">
              ★
            </div>
            <span className="text-[9px] text-emerald-300 text-center font-bold">Goal: 85%+</span>
          </div>
          <div className="w-36 h-8 rounded-full bg-slate-950/80 blur-xs mt-2" />
        </div>
      </div>
    </div>
  );
}

export function BridgeCanvas3D({ progress }: BridgeCanvas3DProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasWebGl, setHasWebGl] = useState(true);
  const [isLiteMode, setIsLiteMode] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGl(false);
      }
    } catch {
      setHasWebGl(false);
    }

    // Check localStorage preference
    const saved = localStorage.getItem("shiksha_graphics_tier");
    if (saved === "lite") {
      setIsLiteMode(true);
    }
  }, []);

  const toggleLiteMode = () => {
    setIsLiteMode((prev) => {
      const next = !prev;
      localStorage.setItem("shiksha_graphics_tier", next ? "lite" : "3d");
      return next;
    });
  };

  if (!isMounted) {
    return (
      <div className="fixed inset-0 pointer-events-none bg-[#14123D] flex items-center justify-center -z-10">
        <div className="flex items-center gap-2.5 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Building The Bridge...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Lite Mode Toggle Floating Pill Button in Top Right under Navbar */}
      <div className="fixed top-20 right-4 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={toggleLiteMode}
          title={isLiteMode ? "Switch to 3D Experience" : "Switch to 2D Lite Mode (Battery Saver)"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-all hover:border-amber-500/50 cursor-pointer"
        >
          {isLiteMode ? (
            <>
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Mode</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lite 2D</span>
            </>
          )}
        </button>
      </div>

      {/* Render 3D Canvas or 2D Lite Fallback */}
      {isLiteMode || !hasWebGl ? (
        <BridgeLiteFallback progress={progress} />
      ) : (
        <div className="fixed inset-0 pointer-events-none -z-10 select-none overflow-hidden">
          {/* Subtle Ambient Radial Light Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(43,42,107,0.45)_0%,rgba(20,18,61,0.85)_55%,#0b0a21_100%)] pointer-events-none" />

          {/* Saffron Dawn Pool Light */}
          <div
            className="absolute bottom-[10%] right-[15%] w-[500px] h-[200px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,138,61,0.18)_0%,transparent_70%)] blur-3xl pointer-events-none transition-opacity duration-1000"
            style={{ opacity: Math.min(1, 0.4 + progress * 0.15) }}
          />

          <Canvas
            camera={{ position: [0, 0.2, 4.2], fov: 45 }}
            gl={{
              antialias: true,
              powerPreference: "high-performance",
              alpha: true,
            }}
            dpr={[1, 1.5]} // Capped at 1.5 for buttery 60fps on mobile & retina
          >
            <Suspense fallback={null}>
              <BridgeHero3D progress={progress} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </>
  );
}
