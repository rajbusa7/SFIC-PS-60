"use client";

import React from "react";

export function BrandLogo({
  size = 38,
  showText = true,
  className = "",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Glowing Bridge Glyph + Gujarati "શ" Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#2B2A6B] via-[#14123D] to-[#0A0923] border border-amber-500/30 shadow-[0_0_20px_rgba(255,138,61,0.25)] overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* Glowing arch behind letter */}
        <svg
          className="absolute inset-0 w-full h-full opacity-60"
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Bridge cable arch */}
          <path
            d="M6 36 C18 18, 30 18, 42 36"
            stroke="#FF8A3D"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Bridge vertical suspenders */}
          <line x1="15" y1="26" x2="15" y2="36" stroke="#3DDBA9" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="24" y1="21" x2="24" y2="36" stroke="#FF8A3D" strokeWidth="1.5" />
          <line x1="33" y1="26" x2="33" y2="36" stroke="#3DDBA9" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>

        {/* Center Gujarati "શ" Character */}
        <span
          className="relative font-gujarati font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 drop-shadow-[0_2px_8px_rgba(255,138,61,0.6)]"
          style={{ fontSize: `${Math.round(size * 0.48)}px` }}
        >
          શ
        </span>

        {/* Inner glow dot */}
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#3DDBA9]" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-extrabold text-base tracking-tight text-white leading-none">
              Shiksha<span className="text-amber-400">Setu</span>
            </span>
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs shadow-amber-500/30">
              AI
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
            Learning Gap Bridge
          </span>
        </div>
      )}
    </div>
  );
}
