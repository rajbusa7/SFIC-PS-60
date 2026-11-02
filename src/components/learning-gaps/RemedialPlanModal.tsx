"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Layers,
  X,
  Printer,
  CheckCircle2,
  Clock,
  Home,
  BrainCircuit,
  GitFork,
  ClipboardList,
  Sparkles,
  RotateCcw,
  BookOpen,
  User,
  GraduationCap,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { RemedialPlan, RemedialStep } from "@shared/types";

interface RemedialPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RemedialPlan | null;
  onPlanUpdated?: (updatedPlan: RemedialPlan) => void;
  onStartReassessment?: (plan: RemedialPlan) => void;
}

export function RemedialPlanModal({
  isOpen,
  onClose,
  plan,
  onPlanUpdated,
  onStartReassessment,
}: RemedialPlanModalProps) {
  const [activeLang, setActiveLang] = useState<"en" | "gu" | "hi">("en");
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    plan?.completedSteps || []
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !plan) return null;

  const steps = plan.steps || [];
  const baseline = plan.baselineScore ?? 35;
  const benchmark = plan.masteryBenchmark ?? 80;
  const isMastered = plan.status === "Completed" || (plan.reassessmentResult?.isMastered ?? false);

  const toggleStepCompletion = async (stepNumber: number) => {
    const updated = completedSteps.includes(stepNumber)
      ? completedSteps.filter((s) => s !== stepNumber)
      : [...completedSteps, stepNumber].sort((a, b) => a - b);

    setCompletedSteps(updated);

    const isAllDone = updated.length >= steps.length;
    const newStatus = isAllDone ? "Completed" : updated.length > 0 ? "In Progress" : "Suggested";

    try {
      setIsSaving(true);
      const res = await fetch("/api/remedial-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          completedSteps: updated,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success && data.plan && onPlanUpdated) {
        onPlanUpdated(data.plan);
      }
    } catch (e) {
      console.error("Failed to update step completion status", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      document.body.classList.add("remedial-plan-printing");
      window.print();
      setTimeout(() => {
        document.body.classList.remove("remedial-plan-printing");
      }, 1000);
    }
  };

  return (
    <div
      id="remedial-plan-modal-container"
      className="fixed inset-0 z-50 bg-[#49352F]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remedial-plan-title"
    >
      {/* Global Print Style for pristine A4 Printouts */}
      <style jsx global>{`
        @media print {
          body.remedial-plan-printing > *:not(#remedial-plan-modal-container) {
            display: none !important;
          }
          body.remedial-plan-printing {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #remedial-plan-modal-container {
            position: absolute !important;
            inset: 0 !important;
            background: transparent !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          #remedial-plan-printable-area {
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      <div
        id="remedial-plan-printable-area"
        className="w-full max-w-4xl bg-[#FAF6E9] border border-[#49352F]/15 rounded-3xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden text-[#49352F]"
      >
        {/* Printable Official School Header (Visible on print) */}
        <div className="print-only p-6 border-b-2 border-black text-center space-y-1">
          <div className="text-xs uppercase tracking-widest font-extrabold text-slate-600">
            Government of Gujarat • Department of Education
          </div>
          <h1 className="text-xl font-extrabold text-black uppercase">
            Model Primary School — Shiksha Setu
          </h1>
          <h2 className="text-sm font-bold text-slate-800">
            Personalized 5-Step Remedial Intervention Plan & Practice Worksheet
          </h2>
          <div className="text-[11px] text-slate-600 pt-1 flex justify-center gap-6">
            <span>Date: {new Date(plan.createdAt || Date.now()).toLocaleDateString()}</span>
            <span>Target Completion: {new Date(plan.targetDate || Date.now() + 7 * 86400000).toLocaleDateString()}</span>
            <span>Academic Cycle: 2026–27</span>
          </div>
        </div>

        {/* Modal On-Screen Header (Hidden on print) */}
        <div className="no-print p-4 sm:p-5 bg-white border-b border-[#49352F]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F2CAB3]/40 border border-[#B26A1B]/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[#B26A1B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="remedial-plan-title"
                  className="font-heading text-lg sm:text-xl font-extrabold text-[#49352F]"
                >
                  {activeLang === "gu"
                    ? "વ્યક્તિગત ૫-પગલાંની ઉપચાર યોજના"
                    : activeLang === "hi"
                    ? "व्यक्तिगत 5-चरणीय उपचारात्मक योजना"
                    : "Personalized 5-Step Remedial Plan"}
                </h2>
                <Badge
                  variant={
                    isMastered
                      ? "mint"
                      : plan.status === "In Progress"
                      ? "saffron"
                      : "default"
                  }
                  size="sm"
                >
                  {isMastered ? "Mastery Achieved" : plan.status || "Ready for Intervention"}
                </Badge>
              </div>
              <p className="text-xs text-[#7A6862] mt-0.5">
                Targeted individual intervention formulated for{" "}
                <strong className="text-[#49352F]">{plan.studentName || "Student"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="inline-flex rounded-xl bg-[#FAF6E9] p-0.5 border border-[#49352F]/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveLang("en")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  activeLang === "en"
                    ? "bg-[#49352F] text-white shadow-xs"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setActiveLang("gu")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  activeLang === "gu"
                    ? "bg-[#49352F] text-white shadow-xs"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                ગુજરાતી
              </button>
              <button
                type="button"
                onClick={() => setActiveLang("hi")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  activeLang === "hi"
                    ? "bg-[#49352F] text-white shadow-xs"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Print Plan Button */}
            <Button
              variant="saffron"
              size="sm"
              onClick={handlePrint}
              className="rounded-full text-xs font-bold"
              title="Print official plan or export as PDF"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span>{activeLang === "gu" ? "પ્રિન્ટ A4 પ્લાન" : "Print A4 Plan"}</span>
            </Button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#FAF6E9] text-[#7A6862] hover:text-[#49352F] transition-colors cursor-pointer"
              aria-label="Close remedial plan modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Student Profile & Diagnostic Overview Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#49352F]/12 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B26A1B] block">
                  Target Competency
                </span>
                <h3 className="font-heading text-lg font-extrabold text-[#49352F]">
                  {plan.conceptName}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10 text-xs text-[#7A6862]">
                  <User className="w-3.5 h-3.5 text-[#B26A1B]" />
                  <span>Student: <strong className="text-[#49352F]">{plan.studentName}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10 text-xs text-[#7A6862]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#2E7D5E]" />
                  <span>Class: <strong className="text-[#49352F]">Class {plan.studentClass || 4}-{plan.studentSection || "A"}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10 text-xs text-[#7A6862]">
                  <Clock className="w-3.5 h-3.5 text-[#7A6862]" />
                  <span>{plan.estimatedMinutes || 20} Mins Sequence</span>
                </span>
              </div>
            </div>

            {/* Performance Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  Baseline Diagnostic
                </span>
                <span className="font-mono font-black text-base text-[#C54738]">
                  {baseline}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  Mastery Target
                </span>
                <span className="font-mono font-black text-base text-[#2E7D5E]">
                  ≥ {benchmark}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  Target Delta
                </span>
                <span className="font-mono font-black text-base text-[#B26A1B]">
                  +{benchmark - baseline} pp
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  Completion Status
                </span>
                <span className="font-bold text-xs text-[#49352F]">
                  {completedSteps.length} of {steps.length} Steps Done
                </span>
              </div>
            </div>

            {/* Root-Cause & Misconception Insights */}
            <div className="p-3 rounded-xl bg-[#FBECE9]/50 border border-[#C54738]/20 space-y-1.5 text-xs text-[#49352F]">
              <div className="flex items-center gap-1.5 font-bold text-[#A93327]">
                <BrainCircuit className="w-4 h-4 text-[#C54738] shrink-0" />
                <span>Diagnostic Root Cause & Detected Error Pattern:</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#49352F]">
                {plan.rootConceptName ? (
                  <>
                    <strong>Prerequisite Root Deficit:</strong> {plan.rootConceptName}. {plan.studentName}&apos;s difficulty with {plan.conceptName} is primarily anchored in an unmastered prerequisite.
                  </>
                ) : (
                  <>
                    <strong>Direct Conceptual Deficit:</strong> {plan.knownMisconceptions || plan.recommendationReason || "Performance indicates foundational support required."}
                  </>
                )}
              </p>
              {plan.errorPattern && (
                <div className="text-[11px] text-[#A93327]">
                  <strong>Observed Error Pattern:</strong> {plan.errorPattern}
                </div>
              )}
              {plan.suggestedModality && (
                <div className="text-[11px] text-[#2E7D5E] font-semibold flex items-center gap-1 pt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2E7D5E]" />
                  <span>Recommended Concrete Modality: {plan.suggestedModality}</span>
                </div>
              )}
            </div>
          </div>

          {/* The 5 Structured Pedagogical Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#49352F] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#B26A1B]" />
                <span>The 5-Step Concrete Remedial Sequence</span>
              </h4>
              <span className="text-xs text-[#7A6862]">
                Click checkboxes to mark progress
              </span>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isStepDone = completedSteps.includes(step.stepNumber);
                const stepNum = step.stepNumber || idx + 1;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isStepDone
                        ? "bg-[#EAF4EE] border-[#2E7D5E]/30"
                        : stepNum === 1
                        ? "bg-white border-[#B26A1B]/30 shadow-xs"
                        : "bg-white border-[#49352F]/12 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Step Number Circle */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isStepDone
                              ? "bg-[#2E7D5E] text-white"
                              : "bg-[#49352F] text-white"
                          }`}
                        >
                          {isStepDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-heading font-extrabold text-sm text-[#49352F]">
                              {step.title}
                            </h5>
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#7A6862] bg-[#FAF6E9] px-2 py-0.5 rounded-md border border-[#49352F]/10">
                              <Clock className="w-3 h-3 text-[#B26A1B]" />
                              {step.durationMinutes || 4} mins
                            </span>
                            {isStepDone && (
                              <Badge variant="mint" size="sm">
                                Completed
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-[#49352F] leading-relaxed">
                            {step.description}
                          </p>

                          {/* Pedagogical Guidance Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
                            <div className="p-2.5 rounded-xl bg-[#FAF6E9]/80 border border-[#49352F]/10 space-y-1">
                              <strong className="text-[#B26A1B] block uppercase tracking-wider text-[9.5px]">
                                Teacher Scaffolding:
                              </strong>
                              <span className="text-[#49352F]">
                                {step.teacherInstructions}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#FAF6E9]/80 border border-[#49352F]/10 space-y-1">
                              <strong className="text-[#2E7D5E] block uppercase tracking-wider text-[9.5px]">
                                Student Activity & Materials:
                              </strong>
                              <span className="text-[#49352F]">
                                {step.studentInstructions || step.learningObjective}
                              </span>
                              {step.requiredMaterials && step.requiredMaterials.length > 0 && (
                                <div className="text-[10px] text-[#7A6862] pt-0.5">
                                  🛠️ <strong>Materials:</strong> {step.requiredMaterials.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Questions / Exercises for this step if present */}
                          {step.questionsOrExercises && step.questionsOrExercises.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 text-[11px] space-y-1 mt-1">
                              <strong className="text-[#49352F] block font-bold">
                                Concrete Practice Items:
                              </strong>
                              <ul className="list-disc list-inside space-y-0.5 text-[#7A6862]">
                                {step.questionsOrExercises.map((q, qIdx) => (
                                  <li key={qIdx}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Step Completion Checkbox (Hidden in Print) */}
                      <div className="no-print shrink-0 pt-0.5">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#49352F] select-none">
                          <input
                            type="checkbox"
                            checked={isStepDone}
                            onChange={() => toggleStepCompletion(stepNum)}
                            className="w-4 h-4 rounded text-[#2E7D5E] focus:ring-[#2E7D5E] cursor-pointer"
                          />
                          <span className="hidden sm:inline">
                            {isStepDone ? "Done" : "Mark Done"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Practice Worksheet Section (Ready to solve & print) */}
          {plan.worksheet && plan.worksheet.questions && plan.worksheet.questions.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#49352F]/12 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-2">
                <div>
                  <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#49352F] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#B26A1B]" />
                    <span>Targeted Student Practice Worksheet</span>
                  </h4>
                  <p className="text-xs text-[#7A6862]">
                    Calibrated problems designed for {plan.studentName}&apos;s current developmental level
                  </p>
                </div>
                <Badge variant="saffron" size="sm">
                  {plan.worksheet.questions.length} Practice Items
                </Badge>
              </div>

              <div className="space-y-3">
                {plan.worksheet.questions.map((q: any, qIdx: number) => (
                  <div
                    key={qIdx}
                    className="p-3.5 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-[#49352F]">
                        Q{q.questionNumber || qIdx + 1}. {q.questionText}
                      </span>
                      <span className="font-mono text-[10px] text-[#7A6862] shrink-0">
                        [{q.marks || 2} Marks]
                      </span>
                    </div>

                    {/* Options if MCQ */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className="p-2 rounded-lg bg-white border border-[#49352F]/10 text-xs font-medium text-[#49352F]"
                          >
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Printable Blank Space for Working */}
                    <div className="p-3 rounded-lg border border-dashed border-[#49352F]/20 bg-white/70 min-h-[45px] text-[10.5px] text-[#7A6862]/80">
                      <em>Space for student working / calculation:</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-Minute Parent Home Connection Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF6E9] to-white border border-[#B26A1B]/30 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-2">
              <span className="font-heading font-extrabold text-sm text-[#B26A1B] flex items-center gap-1.5">
                <Home className="w-4 h-4 text-[#B26A1B]" />
                <span>
                  {activeLang === "gu"
                    ? `વાલીઓ માટે ૫-મિનિટનો ઘર-મહાવરો (${plan.conceptName})`
                    : `5-Minute Home Support Guide for ${plan.studentName}&apos;s Parents`}
                </span>
              </span>
              <Badge variant="mint" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                5 mins
              </Badge>
            </div>

            <p className="text-xs text-[#49352F] leading-relaxed">
              {activeLang === "gu"
                ? `ઘરે પડેલી સરળ વસ્તુઓ (જેમ કે સિક્કા, બટન કે કઠોળના દાણા) નો ઉપયોગ કરી ${plan.studentName} સાથે ૫ મિનિટ આ પ્રવૃત્તિ કરો. બાળકને પોતાના શબ્દોમાં સમજાવવા કહો.`
                : `Parents can reinforce this plan at home in just 5 minutes using common household items (coins, dry beans, buttons, or pencils). Ask ${plan.studentName} to show how they divide, count, or regroup objects physically.`}
            </p>

            <div className="p-3 rounded-xl bg-white border border-[#49352F]/10 text-xs space-y-1">
              <strong className="text-[#8D4E10] block text-[11px]">
                🗣️ Conversational Prompt to Ask at Home:
              </strong>
              <p className="italic text-[#49352F]">
                &ldquo;Can you show me how you solve this using these items? What happens when you make equal groups? Explain each step to me!&rdquo;
              </p>
            </div>
          </div>

          {/* Official Signatures & Verification Block (Visible on print & on screen) */}
          <div className="p-5 rounded-2xl bg-white border border-[#49352F]/15 space-y-4">
            <h5 className="font-heading text-xs font-extrabold uppercase tracking-wider text-[#7A6862]">
              Official Intervention Sign-Off & Verification
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="border-t border-[#49352F]/30 pt-2 space-y-1">
                <span className="font-bold text-[#49352F] block">Teacher Signature:</span>
                <span className="text-[11px] text-[#7A6862] block">Verified by Class Educator</span>
                <span className="text-[10px] text-[#7A6862]">Date: ______________</span>
              </div>

              <div className="border-t border-[#49352F]/30 pt-2 space-y-1">
                <span className="font-bold text-[#49352F] block">Parent Acknowledgment:</span>
                <span className="text-[11px] text-[#7A6862] block">Reviewed with Child at Home</span>
                <span className="text-[10px] text-[#7A6862]">Date: ______________</span>
              </div>

              <div className="border-t border-[#49352F]/30 pt-2 space-y-1">
                <span className="font-bold text-[#2E7D5E] block">Mastery Verification:</span>
                <span className="text-[11px] text-[#7A6862] block">Reassessment Score: _____ / 100%</span>
                <span className="text-[10px] text-[#2E7D5E] font-bold">Benchmark (≥ 80%) [ ] Met</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal On-Screen Footer (Hidden on print) */}
        <div className="no-print p-4 bg-white border-t border-[#49352F]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#7A6862]">
            Linked to <strong>Student Portfolio</strong> and <strong>Parent Bridge</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-full text-xs font-bold bg-[#FAF6E9] hover:bg-white text-[#49352F] border-[#49352F]/15"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-[#B26A1B]" />
              <span>Print A4 Worksheet</span>
            </Button>

            {onStartReassessment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onStartReassessment(plan);
                }}
                className="rounded-full text-xs font-bold bg-white hover:bg-[#FAF6E9] text-[#2E7D5E] border-[#2E7D5E]/30"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reassess Delta</span>
              </Button>
            )}

            <Button
              variant="saffron"
              size="sm"
              onClick={onClose}
              className="rounded-full text-xs font-bold"
            >
              <span>Done</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
