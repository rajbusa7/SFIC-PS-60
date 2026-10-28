"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, BookOpen, Award, CheckCircle, TrendingUp, ShieldCheck } from "lucide-react";

interface ShikshaBotProps {
  speechText?: string;
  size?: "sm" | "md" | "lg";
}

export function ShikshaBot({
  speechText = "Hi! I'm SaathiBot. Let's make learning better for everyone!",
  size = "lg",
}: ShikshaBotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState(speechText);
  const [speechIndex, setSpeechIndex] = useState(0);

  const alternateQuotes = [
    speechText,
    "Every learning gap is an opportunity to grow!",
    "Aarav improved by +50 percentage points in division!",
    "100% offline-ready for every village and school.",
    "Bilingual support in ગુજરાતી & English!",
  ];

  // Natural blinking interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Update speech text if prop changes
  useEffect(() => {
    setActiveSpeech(speechText);
  }, [speechText]);

  // Track global mouse position for pupil tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Calculate pupil offset and head tilt
  const { pupilX, pupilY, headTilt } = React.useMemo(() => {
    if (!mousePos || !containerRef.current) {
      return { pupilX: 0, pupilY: 0, headTilt: 0 };
    }
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2 - 20;

    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // Limit pupil shift to 6.5px max
    const maxOffset = 6.5;
    const offsetMagnitude = Math.min(distance / 25, maxOffset);

    const px = Math.cos(angle) * offsetMagnitude;
    const py = Math.sin(angle) * offsetMagnitude;

    // Subtle head tilt clamped between -5 and +5 degrees
    const tilt = Math.max(-5, Math.min(5, (dx / window.innerWidth) * 10));

    return { pupilX: px, pupilY: py, headTilt: tilt };
  }, [mousePos]);

  const handleBotClick = () => {
    const nextIdx = (speechIndex + 1) % alternateQuotes.length;
    setSpeechIndex(nextIdx);
    setActiveSpeech(alternateQuotes[nextIdx]);
  };

  const scaleClass =
    size === "sm"
      ? "w-48 h-48"
      : size === "md"
      ? "w-64 h-64 sm:w-72 sm:h-72"
      : "w-72 h-72 sm:w-88 sm:h-88 lg:w-96 lg:h-96";

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex items-center justify-center ${scaleClass} mx-auto`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBotClick}
      role="button"
      tabIndex={0}
      title="Click SaathiBot to hear encouragement!"
    >
      {/* Speech Bubble */}
      <div className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 z-20 w-64 sm:w-72 transition-all duration-300">
        <div className="relative bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-200/80 shadow-lg text-slate-800 text-xs sm:text-xs font-semibold text-center leading-snug animate-pulse-subtle">
          <div className="flex items-center justify-center gap-1.5 text-indigo-600 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">SaathiBot AI</span>
          </div>
          <p>{activeSpeech}</p>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-indigo-200/80 rotate-45 transform" />
        </div>
      </div>

      {/* Floating Badge 1: Top-Right Progress Gain */}
      <div className="absolute -top-2 -right-4 sm:-right-8 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-emerald-200 shadow-md backdrop-blur-sm animate-float-slow">
        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-500 leading-none">Aarav Division</div>
          <div className="text-xs font-extrabold text-emerald-600 leading-tight">+50 pp Gain</div>
        </div>
      </div>

      {/* Floating Badge 2: Bottom-Left Offline Safe */}
      <div className="absolute -bottom-4 -left-4 sm:-left-8 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 border border-indigo-200 shadow-md backdrop-blur-sm animate-float-delayed">
        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-500 leading-none">Pedagogy Engine</div>
          <div className="text-xs font-extrabold text-indigo-700 leading-tight">100% Offline-Safe</div>
        </div>
      </div>

      {/* Floating Badge 3: Bottom-Right Bilingual */}
      <div className="absolute -bottom-2 -right-4 sm:-right-6 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/90 border border-amber-200 shadow-xs backdrop-blur-sm text-[11px] font-bold text-amber-800">
        <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
        <span>ENG & ગુજરાતી</span>
      </div>

      {/* Main Robot Vector SVG */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotate(${headTilt}deg) translateY(${isHovered ? "-4px" : "0px"})`,
        }}
      >
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full drop-shadow-xl overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Ambient Glow Behind Head */}
          <circle cx="120" cy="115" r="75" fill="url(#botGlow)" opacity="0.45" />

          {/* Gradients */}
          <defs>
            <radialGradient id="botGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E0E7FF" />
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#3730A3" />
            </linearGradient>
            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="earGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
          </defs>

          {/* Antenna Stem */}
          <line
            x1="120"
            y1="56"
            x2="120"
            y2="34"
            stroke="#6366F1"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Antenna Glowing Orb */}
          <circle cx="120" cy="30" r="9" fill="url(#accentGrad)" />
          <circle cx="120" cy="30" r="5" fill="#38BDF8" className="animate-pulse" />
          <circle cx="118" cy="28" r="2" fill="#FFFFFF" opacity="0.8" />

          {/* Ears / Side Antennas */}
          {/* Left Ear */}
          <rect x="42" y="96" width="10" height="26" rx="4" fill="url(#earGrad)" />
          <circle cx="47" cy="109" r="2.5" fill="#38BDF8" />
          {/* Right Ear */}
          <rect x="188" y="96" width="10" height="26" rx="4" fill="url(#earGrad)" />
          <circle cx="193" cy="109" r="2.5" fill="#38BDF8" />

          {/* Robot Head Body */}
          <rect
            x="50"
            y="54"
            width="140"
            height="114"
            rx="32"
            fill="url(#bodyGrad)"
            stroke="#C7D2FE"
            strokeWidth="3"
          />

          {/* Friendly Head Cap Accent Stripe */}
          <path
            d="M54 84 Q120 74 186 84"
            stroke="#E0E7FF"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Visor / Face Screen */}
          <rect
            x="64"
            y="74"
            width="112"
            height="66"
            rx="20"
            fill="url(#visorGrad)"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Subtle screen scan lines / reflection */}
          <path
            d="M72 82 L168 82"
            stroke="#1E293B"
            strokeWidth="1"
            strokeDasharray="4 3"
          />

          {/* Left Eye Socket */}
          <g transform="translate(86, 102)">
            {/* Eye Ring Glow */}
            <circle cx="0" cy="0" r="14" fill="#0369A1" opacity="0.3" />
            <circle cx="0" cy="0" r="12" fill="#075985" />

            {/* Left Pupil (Tracks Mouse & Blinks) */}
            <g
              style={{
                transform: `scaleY(${isBlinking ? 0.1 : 1}) translate(${pupilX}px, ${pupilY}px)`,
                transformOrigin: "0px 0px",
                transition: isBlinking ? "transform 0.08s ease-in-out" : "none",
              }}
            >
              <circle cx="0" cy="0" r="8" fill="url(#eyeGrad)" />
              {/* Pupil Highlights */}
              <circle cx="-2.5" cy="-2.5" r="3" fill="#FFFFFF" />
              <circle cx="2" cy="2" r="1.2" fill="#FFFFFF" opacity="0.8" />
            </g>
          </g>

          {/* Right Eye Socket */}
          <g transform="translate(154, 102)">
            {/* Eye Ring Glow */}
            <circle cx="0" cy="0" r="14" fill="#0369A1" opacity="0.3" />
            <circle cx="0" cy="0" r="12" fill="#075985" />

            {/* Right Pupil (Tracks Mouse & Blinks) */}
            <g
              style={{
                transform: `scaleY(${isBlinking ? 0.1 : 1}) translate(${pupilX}px, ${pupilY}px)`,
                transformOrigin: "0px 0px",
                transition: isBlinking ? "transform 0.08s ease-in-out" : "none",
              }}
            >
              <circle cx="0" cy="0" r="8" fill="url(#eyeGrad)" />
              {/* Pupil Highlights */}
              <circle cx="-2.5" cy="-2.5" r="3" fill="#FFFFFF" />
              <circle cx="2" cy="2" r="1.2" fill="#FFFFFF" opacity="0.8" />
            </g>
          </g>

          {/* Cheerful Robot Smile */}
          <path
            d="M106 126 Q120 134 134 126"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cheerful Rosy Cheeks */}
          <ellipse cx="76" cy="120" rx="4" ry="2.5" fill="#F43F5E" opacity="0.75" />
          <ellipse cx="164" cy="120" rx="4" ry="2.5" fill="#F43F5E" opacity="0.75" />

          {/* Neck Joint */}
          <rect x="108" y="168" width="24" height="10" rx="3" fill="#94A3B8" />

          {/* Robot Torso / Shoulders */}
          <path
            d="M74 178 Q120 172 166 178 L180 220 Q120 228 60 220 Z"
            fill="url(#bodyGrad)"
            stroke="#C7D2FE"
            strokeWidth="3"
          />

          {/* Chest Badge / School Emblem */}
          <circle cx="120" cy="198" r="14" fill="url(#accentGrad)" />
          {/* Graduation Cap / Book Motif on Chest */}
          <path
            d="M112 196 L120 192 L128 196 L120 200 Z"
            fill="#FFFFFF"
          />
          <path
            d="M115 197.5 V202 Q120 205 125 202 V197.5"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Status Heartbeat Pulse Bar */}
          <rect x="102" y="214" width="36" height="4" rx="2" fill="#38BDF8" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}
