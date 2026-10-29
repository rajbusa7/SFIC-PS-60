"use client";

import React from "react";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export interface BridgeProgressProps {
  score: number; // 0 to 100
  previousScore?: number; // Optional baseline for reassessment delta (e.g., 35 -> 85)
  thresholdDeveloping?: number; // default 60%
  thresholdMastery?: number; // default 80%
  showPlanks?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  height?: "sm" | "md" | "lg";
  className?: string;
  studentName?: string;
}

export function BridgeProgress({
  score,
  previousScore,
  thresholdDeveloping = 60,
  thresholdMastery = 80,
  showPlanks = true,
  showLabels = true,
  animated = true,
  height = "md",
  className = "",
  studentName,
}: BridgeProgressProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const clampedPrev = previousScore !== undefined ? Math.max(0, Math.min(100, previousScore)) : null;
  const isMastered = clampedScore >= thresholdMastery;
  const isDeveloping = clampedScore >= thresholdDeveloping && !isMastered;
  const isGap = clampedScore < thresholdDeveloping;

  const heightClasses = {
    sm: "h-3",
    md: "h-5",
    lg: "h-7",
  }[height];

  // Number of bridge planks to render
  const plankCount = 20;

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">
              {studentName ? `${studentName}'s Bridge` : "Learning Bridge"}
            </span>
            {clampedPrev !== null && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/20">
                +{clampedScore - clampedPrev} pp gain
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {clampedPrev !== null && (
              <span className="text-slate-500 line-through">
                {clampedPrev}%
              </span>
            )}
            <span
              className={`font-heading text-sm font-extrabold ${
                isMastered
                  ? "text-emerald-400"
                  : isDeveloping
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {clampedScore}%
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {isMastered ? "Mastered" : isDeveloping ? "Developing" : "Needs Support"}
            </span>
          </div>
        </div>
      )}

      {/* Main Bridge Track */}
      <div className="relative">
        {/* Bridge Track Rail */}
        <div
          className={`relative w-full overflow-hidden rounded-full bg-slate-900/90 border border-slate-800 p-0.5 shadow-inner ${heightClasses}`}
        >
          {/* Subtle plank background dividers */}
          {showPlanks && (
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10 opacity-30">
              {Array.from({ length: plankCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 h-full bg-slate-600/50"
                  style={{ left: `${(i / plankCount) * 100}%` }}
                />
              ))}
            </div>
          )}

          {/* Previous baseline marker track if reassessment */}
          {clampedPrev !== null && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-slate-700/40 rounded-full border-r-2 border-slate-500/80"
              style={{ width: `${clampedPrev}%` }}
            />
          )}

          {/* Active Glowing Bridge Planks Fill */}
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
              isMastered
                ? "bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-400 shadow-[0_0_15px_rgba(61,219,169,0.5)]"
                : isDeveloping
                ? "bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_15px_rgba(255,138,61,0.5)]"
                : "bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(255,92,108,0.5)]"
            }`}
            style={{ width: `${clampedScore}%` }}
          >
            {/* Shimmer light beam crossing the bridge */}
            {animated && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            )}
          </div>
        </div>

        {/* 60% Developing Threshold Marker */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
          style={{ left: `${thresholdDeveloping}%` }}
        >
          <div className="w-0.5 h-full bg-amber-400/70 border-dashed" />
        </div>

        {/* 80% Mastery Threshold Marker */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
          style={{ left: `${thresholdMastery}%` }}
        >
          <div className="w-0.5 h-full bg-emerald-400/70" />
        </div>
      </div>

      {/* Threshold Labels Bottom Key */}
      {showLabels && (
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
          <span>0% Gap</span>
          <span
            className="text-amber-400/80 cursor-help"
            title="60% Developing threshold"
            style={{ transform: "translateX(-20%)" }}
          >
            | 60% Target
          </span>
          <span
            className="text-emerald-400/80 cursor-help"
            title="80% Mastery benchmark"
            style={{ transform: "translateX(-20%)" }}
          >
            | 80% Mastery
          </span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
