"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const { tr } = useLanguage();
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
  const currentPage = page || activeTourPage || (pathname === "/tutorial" ? "tutorial" : "dashboard");
  const shouldRender = tutorialOpen && (!page || page === activeTourPage || activeTourPage === "tutorial");

  const steps: TourStep[] = PAGE_TOURS[currentPage] || dashboardTourSteps;
  const currentStep = steps[tutorialStep] || steps[0];

  // Helper to resolve translation string by key path
  const resolveText = (keyPath: string, fallback: string = ""): string => {
    return tr(keyPath, undefined, fallback);
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
      // Clamp height to max 240px to prevent huge sections from consuming the whole viewport
      const height = Math.min(rect.height + padding * 2, 240);
      setTargetRect({
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height,
        right: rect.right + padding,
        bottom: Math.max(0, rect.top - padding) + height,
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
      if (currentPage === "dashboard" || currentPage === "tutorial") {
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
    const tooltipHeight = 250;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    let top: number;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    const wantsTop = currentStep.placement === "top";
    const spaceAbove = targetRect.top - margin;
    const spaceBelow = winHeight - targetRect.bottom - margin;

    if (wantsTop && spaceAbove >= tooltipHeight) {
      top = targetRect.top - tooltipHeight - margin;
    } else if (spaceBelow >= tooltipHeight) {
      top = targetRect.bottom + margin;
    } else if (spaceAbove >= tooltipHeight) {
      top = targetRect.top - tooltipHeight - margin;
    } else {
      top = spaceBelow > spaceAbove
        ? targetRect.bottom + margin
        : targetRect.top - tooltipHeight - margin;
    }

    // Always keep strictly inside viewport boundaries
    top = Math.max(margin, Math.min(top, winHeight - tooltipHeight - margin));

    if (isMobile) {
      return {
        position: "fixed",
        top: `${top}px`,
        left: `${margin}px`,
        width: `calc(100vw - ${margin * 2}px)`,
        maxWidth: "380px",
        zIndex: 60,
      };
    }

    left = Math.max(margin, Math.min(winWidth - tooltipWidth - margin, left));

    return {
      position: "fixed",
      top: `${top}px`,
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
        {/* Dimmed warm backdrop rect using mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#1B1614"
          fillOpacity={isCentered ? "0.78" : "0.70"}
          mask={`url(#spotlight-mask-${currentPage})`}
        />
      </svg>

      {/* Glowing outline around target element matching warm website palette */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 rounded-2xl"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            zIndex: 55,
            boxShadow:
              "0 0 0 2.5px #B26A1B, 0 0 0 5px rgba(242, 202, 179, 0.45), 0 0 20px rgba(178, 106, 27, 0.35)",
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="rounded-3xl bg-[#FAF6E9] dark:bg-[#221C18] border border-[#49352F]/16 dark:border-[#F2CAB3]/25 p-5 shadow-[0_20px_50px_rgba(73,53,47,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-[#49352F] dark:text-[#F4F1E1] transition-all duration-300 ring-1 ring-[#49352F]/8 dark:ring-white/10 animate-grow-center"
      >
        {/* Top Header: Badge, Step counter, Close / Skip button */}
        <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#F2CAB3] dark:bg-[#F2CAB3]/25 border border-[#49352F]/15 dark:border-[#F2CAB3]/30 flex items-center justify-center text-xs shadow-xs text-[#49352F] dark:text-[#F4F1E1]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#B26A1B] dark:text-[#F2CAB3]">
                {badgeText || tr("spotlight.interactiveTour")}
              </span>
              <div className="text-[11px] font-semibold text-[#7A6862] dark:text-[#FAF6E9]/75">
                {tr("spotlight.stepCounter", { current: tutorialStep + 1, total: steps.length })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeTutorial}
            className="p-1.5 rounded-full text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/10 dark:text-[#FAF6E9]/70 dark:hover:text-[#F4F1E1] transition-colors cursor-pointer"
            aria-label={tr("spotlight.closeAria")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-2.5">
          <h4 className="font-heading text-base font-bold text-[#49352F] dark:text-[#F4F1E1] tracking-tight flex items-center gap-1.5">
            <span>{stepTitle}</span>
          </h4>
          <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed font-normal">
            {stepDesc}
          </p>

          {/* SaathiBot tip callout */}
          <div className="mt-2.5 p-2.5 rounded-2xl bg-white/80 dark:bg-[#2A231E] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex items-start gap-2 text-[11px] text-[#49352F] dark:text-[#F4F1E1] leading-snug">
            <Lightbulb className="w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {tr("spotlight.tip")}
            </span>
          </div>
        </div>

        {/* Action Controls: Progress Dots, Back, Next / CTA */}
        <div className="pt-3 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex items-center justify-between gap-2">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === tutorialStep
                    ? "w-4 bg-[#B26A1B] dark:bg-[#F2CAB3]"
                    : "w-1.5 bg-[#49352F]/20 dark:bg-white/20"
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
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/8 dark:text-[#FAF6E9]/75 dark:hover:text-[#F4F1E1] transition-colors cursor-pointer flex items-center gap-1 min-h-[36px]"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{tr("spotlight.back")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 min-h-[36px] active:scale-95"
            >
              <span>
                {isLast
                  ? currentStep.ctaTextKey
                    ? resolveText(currentStep.ctaTextKey, tr("spotlight.finish"))
                    : tr("spotlight.finish")
                  : tr("spotlight.next")}
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
