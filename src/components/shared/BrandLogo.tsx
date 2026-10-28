"use client";

import React, { useState } from "react";

export function BrandLogo({
  size = 38,
  showText = true,
  className = "",
  variant = "auto",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: "auto" | "dark" | "light";
}) {
  const [imageError, setImageError] = useState(false);
  const isDarkExplicit = variant === "dark";
  const isLightExplicit = variant === "light";

  const titleStudyClass = isDarkExplicit
    ? "text-white"
    : isLightExplicit
      ? "text-[#49352F]"
      : "text-[#49352F] dark:text-white";

  const titleSaathiClass = isDarkExplicit
    ? "text-[#FF8A3D]"
    : isLightExplicit
      ? "text-[#B26A1B]"
      : "text-[#B26A1B] dark:text-[#FF8A3D]";

  const badgeClass = isDarkExplicit
    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(255,138,61,0.25)]"
    : isLightExplicit
      ? "bg-[#F2CAB3] border-[#49352F]/15 text-[#49352F]"
      : "bg-[#F2CAB3] dark:bg-amber-500/20 border-[#49352F]/15 dark:border-amber-500/30 text-[#49352F] dark:text-amber-300";

  const subtitleClass = isDarkExplicit
    ? "text-slate-300"
    : isLightExplicit
      ? "text-[#7A6862]"
      : "text-[#7A6862] dark:text-slate-400";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* ShikshaSetu AI Brand Logo Badge */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#F2DCB5] via-[#FAF6E9] to-[#F2CAB3] border border-[#49352F]/15 shadow-[0_4px_14px_rgba(73,53,47,0.08)] overflow-hidden"
        style={{ width: size, height: size }}
      >
        {!imageError ? (
          <img
            src="/images/shikshasetu-logo.png"
            alt="ShikshaSetu AI Logo"
            width={size}
            height={size}
            className="w-full h-full object-contain p-0.5"
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            {/* Fallback Bridge glyph */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40"
              viewBox="0 0 48 48"
              fill="none"
            >
              <path
                d="M6 36 C18 18, 30 18, 42 36"
                stroke="#49352F"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line x1="15" y1="26" x2="15" y2="36" stroke="#2E7D5E" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="24" y1="21" x2="24" y2="36" stroke="#49352F" strokeWidth="1.5" />
              <line x1="33" y1="26" x2="33" y2="36" stroke="#2E7D5E" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
            <span
              className="relative font-gujarati font-black text-[#49352F]"
              style={{ fontSize: `${Math.round(size * 0.48)}px` }}
            >
              સ
            </span>
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2E7D5E] shadow-[0_0_6px_rgba(46,125,94,0.4)]" />
          </>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-heading font-extrabold text-base tracking-tight leading-none ${titleStudyClass}`}>
              Study<span className={titleSaathiClass}>Saathi</span>
            </span>
            <span className={`border text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${badgeClass}`}>
              AI
            </span>
          </div>
          <span className={`text-[10px] font-semibold tracking-wider uppercase mt-1 ${subtitleClass}`}>
            Learning Gap Bridge
          </span>
        </div>
      )}
    </div>
  );
}
