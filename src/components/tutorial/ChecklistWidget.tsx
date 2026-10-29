"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { fireCelebrationConfetti } from "@/lib/confetti";
import {
  CheckCircle2,
  Circle,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ListChecks,
} from "lucide-react";

export interface ChecklistStep {
  id: number;
  titleKey: string;
  defaultTitleEn: string;
  defaultTitleGu: string;
  actionUrl: string;
  actionTextKey: string;
}

const CHECKLIST_STEPS: ChecklistStep[] = [
  {
    id: 1,
    titleKey: "checklist.step1",
    defaultTitleEn: "Review your class overview & attention list",
    defaultTitleGu: "વર્ગખંડ યાદી અને ચેતવણીઓની સમીક્ષા કરો",
    actionUrl: "/dashboard",
    actionTextKey: "Review Class",
  },
  {
    id: 2,
    titleKey: "checklist.step2",
    defaultTitleEn: "Open a student who needs support (Aarav)",
    defaultTitleGu: "સહાયની જરૂર હોય તેવા વિદ્યાર્થીને ખોલો (આરવ)",
    actionUrl: "/students/std-aarav",
    actionTextKey: "Open Aarav",
  },
  {
    id: 3,
    titleKey: "checklist.step3",
    defaultTitleEn: "Generate a 5-step concrete remedial plan",
    defaultTitleGu: "૫-પગલાંની મૂર્ત ઉપચારાત્મક યોજના બનાવો",
    actionUrl: "/remedial-plans",
    actionTextKey: "View Plan",
  },
  {
    id: 4,
    titleKey: "checklist.step4",
    defaultTitleEn: "Enter a re-test score & verify improvement (+pp)",
    defaultTitleGu: "પુનઃટેસ્ટ ગુણ દાખલ કરી સુધારો જુઓ (+pp)",
    actionUrl: "/students/std-aarav",
    actionTextKey: "Reassess",
  },
];

const STORAGE_KEY_STEPS = "shikshasetu_checklist_steps";
const STORAGE_KEY_DISMISSED = "shikshasetu_checklist_dismissed";
const STORAGE_KEY_CELEBRATED = "shikshasetu_checklist_celebrated";

export function ChecklistWidget() {
  const { t, language } = useLanguage();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    try {
      const savedSteps = localStorage.getItem(STORAGE_KEY_STEPS);
      if (savedSteps) {
        setCompletedSteps(JSON.parse(savedSteps));
      } else {
        // Initial state: Step 1 can be auto-ticked if dashboard tour was completed
        const tourDone = localStorage.getItem("shikshasetu_tour_completed_dashboard");
        if (tourDone) {
          setCompletedSteps([1]);
          localStorage.setItem(STORAGE_KEY_STEPS, JSON.stringify([1]));
        }
      }

      const dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {
      // quiet fallback
    }
  }, []);

  const markStepComplete = useCallback((stepId: number) => {
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev;
      const updated = [...prev, stepId].sort((a, b) => a - b);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_STEPS, JSON.stringify(updated));

        // Check if now all 4 are completed
        if (updated.length === 4) {
          const alreadyCelebrated = localStorage.getItem(STORAGE_KEY_CELEBRATED);
          if (!alreadyCelebrated) {
            localStorage.setItem(STORAGE_KEY_CELEBRATED, "true");
            fireCelebrationConfetti();
          }
        }
      }
      return updated;
    });
  }, []);

  // Listen to application events to auto-tick
  useEffect(() => {
    const handleClassReviewed = () => markStepComplete(1);
    const handleStudentOpened = () => markStepComplete(2);
    const handlePlanGenerated = () => markStepComplete(3);
    const handleReassessed = () => markStepComplete(4);

    window.addEventListener("shikshasetu_step_class_reviewed", handleClassReviewed);
    window.addEventListener("shikshasetu_step_student_opened", handleStudentOpened);
    window.addEventListener("shikshasetu_step_plan_generated", handlePlanGenerated);
    window.addEventListener("shikshasetu_step_reassessed", handleReassessed);

    // Global event to restore/show checklist
    const handleShowChecklist = () => {
      setIsDismissed(false);
      setIsExpanded(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_DISMISSED);
      }
    };
    window.addEventListener("shikshasetu_show_checklist", handleShowChecklist);

    return () => {
      window.removeEventListener("shikshasetu_step_class_reviewed", handleClassReviewed);
      window.removeEventListener("shikshasetu_step_student_opened", handleStudentOpened);
      window.removeEventListener("shikshasetu_step_plan_generated", handlePlanGenerated);
      window.removeEventListener("shikshasetu_step_reassessed", handleReassessed);
      window.removeEventListener("shikshasetu_show_checklist", handleShowChecklist);
    };
  }, [markStepComplete]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    setIsExpanded(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_DISMISSED);
    }
  };

  if (!mounted) return null;

  const total = CHECKLIST_STEPS.length;
  const count = completedSteps.length;
  const percentage = Math.round((count / total) * 100);
  const isAllComplete = count === total;

  // Render minimized floating trigger if dismissed
  if (isDismissed) {
    return (
      <div className="fixed bottom-24 right-6 z-40 print:hidden select-none">
        <button
          type="button"
          onClick={handleRestore}
          className="group flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#14123D]/95 hover:bg-[#14123D] border border-[#FF8A3D]/40 text-white shadow-xl backdrop-blur-xl transition-all hover:scale-105 cursor-pointer"
          title={language === "gu" ? "ઓનબોર્ડિંગ ચેકલિસ્ટ બતાવો" : "Show Onboarding Checklist"}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <svg width="22" height="22" className="transform -rotate-90">
              <circle cx="11" cy="11" r="9" stroke="#334155" strokeWidth="2.5" fill="none" />
              <circle
                cx="11"
                cy="11"
                r="9"
                stroke={isAllComplete ? "#3DDBA9" : "#FF8A3D"}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 9}
                strokeDashoffset={2 * Math.PI * 9 - (percentage / 100) * 2 * Math.PI * 9}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-[8px] font-bold">{count}/{total}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
            {language === "gu" ? "ચેકલિસ્ટ (૪ પગલાં)" : "Onboarding"}
          </span>
        </button>
      </div>
    );
  }

  // Circular progress ring parameters
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-80 sm:w-92 rounded-3xl bg-[#14123D]/95 border border-[#FF8A3D]/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-white overflow-hidden transition-all duration-300 ring-1 ring-white/10 print:hidden select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="40" height="40" className="transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke="#1e293b"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke={isAllComplete ? "#3DDBA9" : "#FF8A3D"}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute text-[10px] font-mono font-bold text-white">
              {percentage}%
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white">
                {t.checklist?.title || (language === "gu" ? "૪ સરળ પગલાંમાં શરૂ કરો" : "Get Started in 4 Steps")}
              </h4>
              {isAllComplete && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase">
                  Ready 🎉
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300">
              {count} of {total} completed • {isAllComplete ? (language === "gu" ? "સંપૂર્ણ સફળતા!" : "Ready to teach!") : (language === "gu" ? "પ્રગતિમાં..." : "In progress")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss checklist"
            title={t.checklist?.dismiss || "Dismiss"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Steps Content */}
      {isExpanded && (
        <div className="p-3.5 space-y-2 max-h-[340px] overflow-y-auto">
          {/* Confetti Banner when all 4 are done */}
          {isAllComplete ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  {t.checklist?.allDone || (language === "gu" ? "તમે તૈયાર છો! ૪ માંથી ૪ પગલાં પૂર્ણ થયા 🎉" : "You're ready! All 4 steps completed 🎉")}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {language === "gu"
                  ? "તમે વર્ગખંડ સમીક્ષા, વિદ્યાર્થી પસંદગી, ૫-પગલાંની યોજના અને પુનઃમૂલ્યાંકનનો પ્રવાહ પૂર્ણ કર્યો છે."
                  : "You've successfully tested class monitoring, student gap diagnosis, 5-step concrete intervention, and reassessment."}
              </p>
              <button
                type="button"
                onClick={() => fireCelebrationConfetti()}
                className="mt-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                {language === "gu" ? "ફરીથી ઉજવણી કરો 🎊" : "Celebrate again 🎊"}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-300 px-1">
              {language === "gu"
                ? "દરેક કાર્ય વર્ગખંડમાં પૂર્ણ કરતાં જ આપોઆપ ટીક થશે:"
                : "Each action auto-ticks when you perform it in the app:"}
            </p>
          )}

          {/* Steps List */}
          <div className="space-y-1.5">
            {CHECKLIST_STEPS.map((step) => {
              const isDone = completedSteps.includes(step.id);
              const title =
                language === "gu"
                  ? (t.checklist as any)?.[`step${step.id}`] || step.defaultTitleGu
                  : (t.checklist as any)?.[`step${step.id}`] || step.defaultTitleEn;

              return (
                <div
                  key={step.id}
                  onClick={() => markStepComplete(step.id)}
                  className={`flex items-start justify-between gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                    isDone
                      ? "bg-emerald-950/20 border-emerald-500/30 text-slate-300"
                      : "bg-white/5 border-white/5 hover:border-amber-500/40 text-white"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markStepComplete(step.id);
                      }}
                      className="mt-0.5 shrink-0 transition-transform active:scale-90"
                      aria-label={isDone ? "Completed" : "Mark as done"}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#3DDBA9]" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-amber-400" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-xs leading-snug font-medium ${
                          isDone ? "line-through text-slate-400" : "text-white"
                        }`}
                      >
                        {title}
                      </p>
                    </div>
                  </div>

                  {!isDone && (
                    <Link
                      href={step.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-colors"
                    >
                      <span>{step.actionTextKey}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer controls: Reset checklist or link to full tutorial */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <Link
              href="/tutorial"
              className="text-amber-400 hover:text-amber-300 hover:underline font-semibold flex items-center gap-1"
            >
              <span>{language === "gu" ? "સંપૂર્ણ માર્ગદર્શિકા →" : "Full Tutorial →"}</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setCompletedSteps([]);
                if (typeof window !== "undefined") {
                  localStorage.removeItem(STORAGE_KEY_STEPS);
                  localStorage.removeItem(STORAGE_KEY_CELEBRATED);
                }
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === "gu" ? "રીસેટ" : "Reset"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
