"use client";

import React from "react";

export function BrandLogo({
  size = 38,
  showText = true,
  className = "",
  variant = "auto",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: "auto" | "dark" | "light" | "navbar";
}) {
  const isNavbar = variant === "navbar";
  const isDarkExplicit = variant === "dark";
  const isLightExplicit = variant === "light";

  // StudySaathi brand typography styles:
  // "StudySaathi" is styled in prominent, crisp dark brown (#49352F)
  const titleStudyClass = isNavbar
    ? "text-[#49352F]"
    : isDarkExplicit
    ? "text-white"
    : isLightExplicit
    ? "text-[#49352F]"
    : "text-[#49352F] dark:text-white";

  const titleSaathiClass = isNavbar
    ? "text-[#49352F]"
    : isDarkExplicit
    ? "text-[#FF8A3D]"
    : isLightExplicit
    ? "text-[#49352F]"
    : "text-[#49352F] dark:text-[#FF8A3D]";

  // "AI" is highlighted in warm peach (#F2CAB3) with dark brown text
  const badgeClass = isNavbar
    ? "bg-[#F2CAB3] border-[#49352F]/20 text-[#49352F] shadow-xs font-black"
    : isDarkExplicit
    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(255,138,61,0.25)]"
    : isLightExplicit
    ? "bg-[#F2CAB3] border-[#49352F]/15 text-[#49352F]"
    : "bg-[#F2CAB3] dark:bg-amber-500/20 border-[#49352F]/15 dark:border-amber-500/30 text-[#49352F] dark:text-amber-300";

  const subtitleClass = isNavbar
    ? "text-[#7A6862]"
    : isDarkExplicit
    ? "text-slate-300"
    : isLightExplicit
    ? "text-[#7A6862]"
    : "text-[#7A6862] dark:text-slate-400";

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Warm Bridge Glyph + Gujarati "સ" Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#F2DCB5] via-[#FAF6E9] to-[#F2CAB3] border border-[#49352F]/15 shadow-[0_4px_14px_rgba(73,53,47,0.08)] overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* Soft arch behind letter */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40"
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Bridge cable arch */}
          <path
            d="M6 36 C18 18, 30 18, 42 36"
            stroke="#49352F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Bridge vertical suspenders */}
          <line x1="15" y1="26" x2="15" y2="36" stroke="#2E7D5E" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="24" y1="21" x2="24" y2="36" stroke="#49352F" strokeWidth="1.5" />
          <line x1="33" y1="26" x2="33" y2="36" stroke="#2E7D5E" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>

        {/* Center Gujarati "સ" Character */}
        <span
          className="relative font-gujarati font-black text-[#49352F]"
          style={{ fontSize: `${Math.round(size * 0.48)}px` }}
        >
          સ
        </span>

        {/* Inner sage accent dot */}
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2E7D5E] shadow-[0_0_6px_rgba(46,125,94,0.4)]" />
      </div>

      {showText &&
        (isNavbar ? (
          <div className="flex items-center gap-1.5 sm:gap-2 leading-none select-none">
            <span className="font-heading font-[800] text-[18px] sm:text-[21px] lg:text-[24px] tracking-[0.025em] text-[#49352F] uppercase">
              STUDYSAATHI
            </span>
            <span className="relative inline-flex items-center font-heading font-[850] text-[18px] sm:text-[21px] lg:text-[24px] tracking-[0.035em] text-[#B26A1B] uppercase">
              AI
              <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-[#B26A1B]/40" />
            </span>
          </div>
        ) : (
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-heading font-black tracking-tight leading-none text-base ${titleStudyClass}`}
              >
                Study<span className={titleSaathiClass}>Saathi</span>
              </span>
              <span
                className={`border font-black rounded-md uppercase tracking-wider text-[10px] px-1.5 py-0.5 ${badgeClass}`}
              >
                AI
              </span>
            </div>
            <span
              className={`font-bold tracking-wider uppercase text-[10px] mt-1 ${subtitleClass}`}
            >
              Learning Gap Bridge
            </span>
          </div>
        ))}
    </div>
  );
}
