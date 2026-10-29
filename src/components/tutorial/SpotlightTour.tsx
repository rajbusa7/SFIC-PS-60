"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { TourStep, PAGE_TOURS } from "@/lib/tutorialData";
import {
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Bot,
} from "lucide-react";
import { fireCelebrationConfetti } from "@/lib/confetti";

interface SpotlightTourProps {
  page: "dashboard" | "students" | "studentDetail" | "learningGaps" | "remedialPlans" | "reports";
  autoStartDelay?: number;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function SpotlightTour({ page, autoStartDelay = 600 }: SpotlightTourProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = PAGE_TOURS[page] || [];
  const currentStep = steps[currentStepIndex];
  const storageKey = `shikshasetu_tour_completed_${page}`;

  // Helper to resolve translation string by key path
  const resolveText = (keyPath: string, fallback: string = ""): string => {
    try {
      const parts = keyPath.split(".");
      let val: any = t;
      for (const p of parts) {
        if (!val || typeof val !== "object") return fallback;
        val = val[p];
      }
      return typeof val === "string" ? val : fallback;
    } catch {
      return fallback;
    }
  };

  // Start Tour
  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  // End / Skip Tour
  const finishTour = useCallback(() => {
    setIsActive(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
      // Fire action completed for checklist milestone 1 (Review class)
      window.dispatchEvent(new CustomEvent("shikshasetu_step_class_reviewed"));
    }
  }, [storageKey]);

  // Check auto-start on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted && steps.length > 0) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, autoStartDelay);
      return () => clearTimeout(timer);
    }
  }, [storageKey, steps.length, autoStartDelay]);

  // Listen for global custom event to trigger or replay tour
  useEffect(() => {
    const handleReplay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail?.page || customEvent.detail.page === page) {
        startTour();
      }
    };
    window.addEventListener("shikshasetu_start_tour", handleReplay);
    return () => window.removeEventListener("shikshasetu_start_tour", handleReplay);
  }, [page, startTour]);

  // Calculate Target Rect
  const updateTargetRect = useCallback(() => {
    if (!isActive || !currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      // Scroll into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      const rect = el.getBoundingClientRect();
      const padding = 8;
      setTargetRect({
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        right: rect.right + padding,
        bottom: rect.bottom + padding,
      });
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;

    // Small delay to let animations settle
    const timer = setTimeout(() => {
      updateTargetRect();
    }, 120);

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isActive, currentStepIndex, updateTargetRect]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finishTour();
      } else if (e.key === "ArrowRight") {
        if (currentStepIndex < steps.length - 1) {
          e.preventDefault();
          setCurrentStepIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStepIndex > 0) {
          e.preventDefault();
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentStepIndex, steps.length, finishTour]);

  if (!isActive || !currentStep) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;
  const isCentered = !currentStep.targetSelector || !targetRect || currentStep.placement === "center";

  const handleNext = () => {
    if (isLast) {
      if (page === "dashboard") {
        fireCelebrationConfetti();
      }
      finishTour();
      if (currentStep.ctaAction) {
        router.push(currentStep.ctaAction);
      }
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Dynamic Tooltip Position for small screens and desktop
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCentered || !targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "460px",
        width: "92vw",
        zIndex: 60,
      };
    }

    const margin = 16;
    const tooltipWidth = 360;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    // Default below target
    let top = targetRect.bottom + margin;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    // Check bottom overflow, flip to top if needed
    if (top + 220 > winHeight && targetRect.top > 220) {
      top = Math.max(margin, targetRect.top - 240);
    }

    // Keep horizontally in bounds
    if (isMobile) {
      left = margin;
      return {
        position: "fixed",
        top: `${Math.min(top, winHeight - 250)}px`,
        left: `${margin}px`,
        width: `calc(100vw - ${margin * 2}px)`,
        maxWidth: "380px",
        zIndex: 60,
      };
    }

    left = Math.max(margin, Math.min(winWidth - tooltipWidth - margin, left));

    return {
      position: "fixed",
      top: `${Math.max(margin, Math.min(top, winHeight - 260))}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 60,
    };
  };

  const stepTitle = resolveText(currentStep.titleKey, "Quick Tip");
  const stepDesc = resolveText(currentStep.descKey, "Learn how to use this feature.");
  const badgeText = currentStep.badgeKey
    ? resolveText(currentStep.badgeKey, "Guide")
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={stepTitle}
      className="fixed inset-0 z-50 overflow-hidden select-none"
    >
      {/* SVG Spotlight Mask Cutout Overlay */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300"
        style={{ zIndex: 51 }}
      >
        <defs>
          <mask id={`spotlight-mask-${page}`}>
            {/* White area = dimmed backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black area = cut-out hole showing original element */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dimmed backdrop rect using mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#070a13"
          fillOpacity={isCentered ? "0.85" : "0.78"}
          mask={`url(#spotlight-mask-${page})`}
        />
      </svg>

      {/* Glowing outline around target element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 rounded-2xl animate-pulse"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            zIndex: 55,
            boxShadow:
              "0 0 0 3px #FF8A3D, 0 0 25px rgba(255, 138, 61, 0.55), inset 0 0 15px rgba(255, 138, 61, 0.2)",
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="rounded-3xl bg-[#14123D]/95 border border-[#FF8A3D]/40 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-white transition-all duration-300 ring-1 ring-white/10"
      >
        {/* Top Header: Badge, Step counter, Close / Skip button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF8A3D] to-[#2B2A6B] flex items-center justify-center text-xs shadow-md shadow-[#FF8A3D]/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#3DDBA9]">
                {badgeText || (language === "gu" ? "માર્ગદર્શિત ટૂર" : "Interactive Tour")}
              </span>
              <div className="text-[11px] font-semibold text-slate-300">
                {language === "gu"
                  ? `પગલું ${currentStepIndex + 1} / ${steps.length}`
                  : `Step ${currentStepIndex + 1} of ${steps.length}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={finishTour}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={language === "gu" ? "ટૂર બંધ કરો" : "Close tour"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-2.5">
          <h4 className="font-heading text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>{stepTitle}</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {stepDesc}
          </p>

          {/* ShikshaBot speech callout tip */}
          <div className="mt-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2 text-[11px] text-amber-200/90 leading-snug">
            <span className="text-base leading-none">💡</span>
            <span>
              {language === "gu"
                ? "શિક્ષાબોટ ટિપ: તમે ઉપરના ટૂલબારમાંથી અથવા 'Esc' દબાવીને આ ટૂર ગમે ત્યારે ફરી જોઈ શકો છો."
                : "ShikshaBot tip: You can replay this guided walkthrough anytime from the top bar or press 'Esc' to exit."}
            </span>
          </div>
        </div>

        {/* Action Controls: Progress Dots, Back, Next / CTA */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? "w-4 bg-[#FF8A3D]"
                    : "w-1.5 bg-slate-600/70"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 min-h-[38px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{language === "gu" ? "પાછળ" : "Back"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FF8A3D] to-amber-500 hover:from-[#FF8A3D] hover:to-amber-400 text-slate-950 text-xs font-black shadow-md shadow-[#FF8A3D]/25 transition-all cursor-pointer flex items-center gap-1 min-h-[38px] active:scale-95"
            >
              <span>
                {isLast
                  ? currentStep.ctaTextKey
                    ? resolveText(currentStep.ctaTextKey, "Finish Tour")
                    : language === "gu"
                    ? "સમાપ્ત કરો 🎉"
                    : "Finish Tour 🎉"
                  : language === "gu"
                  ? "આગળ"
                  : "Next"}
              </span>
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global helper to trigger replay from any component
export function triggerPageTour(pageName: string = "dashboard") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("shikshasetu_start_tour", {
        detail: { page: pageName },
      })
    );
  }
}
