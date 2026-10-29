"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTutorial } from "@/context/TutorialContext";
import { TourStep, PAGE_TOURS, dashboardTourSteps } from "@/lib/tutorialData";
import {
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Bot,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { fireCelebrationConfetti } from "@/lib/confetti";

export interface SpotlightTourProps {
  page?: "dashboard" | "students" | "studentDetail" | "learningGaps" | "remedialPlans" | "reports" | string;
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

export function SpotlightTour({ page, autoStartDelay = 600 }: SpotlightTourProps = {}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const {
    tutorialOpen,
    tutorialMode,
    tutorialStep,
    activeTourPage,
    closeTutorial,
    nextStep,
    prevStep,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // If a specific page prop is provided, only show if activeTourPage matches
  const currentPage = page || activeTourPage || "dashboard";
  const shouldRender = tutorialOpen && (!page || page === activeTourPage);

  const steps: TourStep[] = PAGE_TOURS[currentPage] || dashboardTourSteps;
  const currentStep = steps[tutorialStep] || steps[0];

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

  // Scroll active target into view once when step changes
  useEffect(() => {
    if (!shouldRender || !currentStep?.targetSelector) return;
    const scrollTimer = setTimeout(() => {
      const el = document.querySelector(currentStep.targetSelector!);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }, 60);
    return () => clearTimeout(scrollTimer);
  }, [shouldRender, tutorialStep, currentStep?.targetSelector]);

  // Calculate Target Rect
  const updateTargetRect = useCallback(() => {
    if (!shouldRender || !currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
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
  }, [shouldRender, currentStep]);

  useEffect(() => {
    if (!shouldRender) return;

    // Run rect updates with progressive settling delays
    updateTargetRect();
    const timer1 = setTimeout(updateTargetRect, 80);
    const timer2 = setTimeout(updateTargetRect, 220);
    const timer3 = setTimeout(updateTargetRect, 500);

    window.addEventListener("resize", updateTargetRect, { passive: true });
    window.addEventListener("scroll", updateTargetRect, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [shouldRender, tutorialStep, updateTargetRect]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeTutorial();
      } else if (e.key === "ArrowRight") {
        if (tutorialStep < steps.length - 1) {
          e.preventDefault();
          nextStep();
        }
      } else if (e.key === "ArrowLeft") {
        if (tutorialStep > 0) {
          e.preventDefault();
          prevStep();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldRender, tutorialStep, steps.length, closeTutorial, nextStep, prevStep]);

  if (!shouldRender || !currentStep) return null;

  const isFirst = tutorialStep === 0;
  const isLast = tutorialStep === steps.length - 1;
  const isCentered = !currentStep.targetSelector || !targetRect || currentStep.placement === "center";

  const handleNext = () => {
    if (isLast) {
      if (currentPage === "dashboard") {
        fireCelebrationConfetti();
      }
      closeTutorial();
      if (currentStep.ctaAction) {
        router.push(currentStep.ctaAction);
      }
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    prevStep();
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
          <mask id={`spotlight-mask-${currentPage}`}>
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
          mask={`url(#spotlight-mask-${currentPage})`}
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
                  ? `પગલું ${tutorialStep + 1} / ${steps.length}`
                  : `Step ${tutorialStep + 1} of ${steps.length}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeTutorial}
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
            <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
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
                  idx === tutorialStep
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
                    ? "સમાપ્ત કરો"
                    : "Finish Tour"
                  : language === "gu"
                  ? "આગળ"
                  : "Next"}
              </span>
              {isLast ? (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global helper to trigger replay from any component or event
export function triggerPageTour(pageName: string = "dashboard") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("shikshasetu_start_tour", {
        detail: { page: pageName },
      })
    );
  }
}
