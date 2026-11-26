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
import { useLanguage } from "@/context/LanguageContext";
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
  const { t, tr, formatClass, formatDate } = useLanguage();
  const pm = t.planModal;
  const [activeLang, setActiveLang] = useState<"en" | "gu" | "hi">("en");
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    plan?.completedSteps || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const fallbackCreatedIso = "2026-03-01T09:00:00.000Z";
  const fallbackTargetIso = "2026-03-08T09:00:00.000Z";

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
            {pm.govHeader}
          </div>
          <h1 className="text-xl font-extrabold text-black uppercase">
            {pm.schoolName}
          </h1>
          <h2 className="text-sm font-bold text-slate-800">
            {pm.printSubtitle}
          </h2>
          <div className="text-[11px] text-slate-600 pt-1 flex justify-center gap-6">
            <span>{tr("planModal.dateLabel", { date: formatDate(plan.createdAt || fallbackCreatedIso) })}</span>
            <span>{tr("planModal.targetCompletionLabel", { date: formatDate(plan.targetDate || fallbackTargetIso) })}</span>
            <span>{pm.academicCycle}</span>
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
                  {pm.titleEnFallback}
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
                  {isMastered ? pm.masteryAchieved : plan.status || pm.readyForIntervention}
                </Badge>
              </div>
              <p className="text-xs text-[#7A6862] mt-0.5">
                {tr("planModal.formulatedFor", { name: plan.studentName || t.learningGaps.studentFallback })}
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
              title={pm.printPlanTitle}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span>{pm.printA4Plan}</span>
            </Button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#FAF6E9] text-[#7A6862] hover:text-[#49352F] transition-colors cursor-pointer"
              aria-label={pm.closeModalAria}
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
                  {pm.targetCompetencyLabel}
                </span>
                <h3 className="font-heading text-lg font-extrabold text-[#49352F]">
                  {plan.conceptName}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10 text-xs text-[#7A6862]">
                  <User className="w-3.5 h-3.5 text-[#B26A1B]" />
                  <span>{pm.studentLabel} <strong className="text-[#49352F]">{plan.studentName}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10 text-xs text-[#7A6862]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#2E7D5E]" />
                  <span>{pm.classPrefix} <strong className="text-[#49352F]">{formatClass(plan.studentClass || 4, plan.studentSection || "A")}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10 text-xs text-[#7A6862]">
                  <Clock className="w-3.5 h-3.5 text-[#7A6862]" />
                  <span>{tr("planModal.minsSequence", { mins: plan.estimatedMinutes || 20 })}</span>
                </span>
              </div>
            </div>

            {/* Performance Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  {pm.baselineDiagnostic}
                </span>
                <span className="font-mono font-black text-base text-[#C54738]">
                  {baseline}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  {pm.masteryTarget}
                </span>
                <span className="font-mono font-black text-base text-[#2E7D5E]">
                  ≥ {benchmark}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  {pm.targetDelta}
                </span>
                <span className="font-mono font-black text-base text-[#B26A1B]">
                  +{benchmark - baseline} pp
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                <span className="text-[10px] font-bold uppercase text-[#7A6862] block">
                  {pm.completionStatus}
                </span>
                <span className="font-bold text-xs text-[#49352F]">
                  {tr("planModal.stepsDone", { done: completedSteps.length, total: steps.length })}
                </span>
              </div>
            </div>

            {/* Root-Cause & Misconception Insights */}
            <div className="p-3 rounded-xl bg-[#FBECE9]/50 border border-[#C54738]/20 space-y-1.5 text-xs text-[#49352F]">
              <div className="flex items-center gap-1.5 font-bold text-[#A93327]">
                <BrainCircuit className="w-4 h-4 text-[#C54738] shrink-0" />
                <span>{pm.rootCauseHeading}</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#49352F]">
                {plan.rootConceptName ? (
                  <>
                    <strong>{pm.prereqRootDeficit}</strong> {plan.rootConceptName}. {tr("planModal.prereqAnchoredText", { student: plan.studentName || "", concept: plan.conceptName || "" })}
                  </>
                ) : (
                  <>
                    <strong>{pm.directDeficit}</strong> {plan.knownMisconceptions || plan.recommendationReason || pm.defaultSupportNeeded}
                  </>
                )}
              </p>
              {plan.errorPattern && (
                <div className="text-[11px] text-[#A93327]">
                  <strong>{pm.observedErrorPattern}</strong> {plan.errorPattern}
                </div>
              )}
              {plan.suggestedModality && (
                <div className="text-[11px] text-[#2E7D5E] font-semibold flex items-center gap-1 pt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2E7D5E]" />
                  <span>{tr("planModal.recommendedModality", { modality: plan.suggestedModality })}</span>
                </div>
              )}
            </div>
          </div>

          {/* The 5 Structured Pedagogical Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#49352F] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#B26A1B]" />
                <span>{pm.sequenceHeading}</span>
              </h4>
              <span className="text-xs text-[#7A6862]">
                {pm.checkboxHint}
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
                              {tr("planModal.stepMins", { mins: step.durationMinutes || 4 })}
                            </span>
                            {isStepDone && (
                              <Badge variant="mint" size="sm">
                                {pm.completedBadge}
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
                                {pm.teacherScaffolding}
                              </strong>
                              <span className="text-[#49352F]">
                                {step.teacherInstructions}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#FAF6E9]/80 border border-[#49352F]/10 space-y-1">
                              <strong className="text-[#2E7D5E] block uppercase tracking-wider text-[9.5px]">
                                {pm.studentActivityMaterials}
                              </strong>
                              <span className="text-[#49352F]">
                                {step.studentInstructions || step.learningObjective}
                              </span>
                              {step.requiredMaterials && step.requiredMaterials.length > 0 && (
                                <div className="text-[10px] text-[#7A6862] pt-0.5">
                                  <strong>{pm.materialsPrefix}</strong> {step.requiredMaterials.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Questions / Exercises for this step if present */}
                          {step.questionsOrExercises && step.questionsOrExercises.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 text-[11px] space-y-1 mt-1">
                              <strong className="text-[#49352F] block font-bold">
                                {pm.concretePracticeItems}
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
                            {isStepDone ? pm.doneLabel : pm.markDoneLabel}
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
                    <span>{pm.worksheetTitle}</span>
                  </h4>
                  <p className="text-xs text-[#7A6862]">
                    {tr("planModal.worksheetSubtitle", { name: plan.studentName || "" })}
                  </p>
                </div>
                <Badge variant="saffron" size="sm">
                  {tr("planModal.practiceItemsBadge", { count: plan.worksheet.questions.length })}
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
                        {tr("planModal.marksTag", { marks: q.marks || 2 })}
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
                      <em>{pm.workingSpace}</em>
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
                <span>{tr("planModal.homeGuideTitle", { name: plan.studentName || "" })}</span>
              </span>
              <Badge variant="mint" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                {tr("roleCard.minsCount", { mins: 5 })}
              </Badge>
            </div>

            <p className="text-xs text-[#49352F] leading-relaxed">
              {tr("planModal.homeGuideBody", { name: plan.studentName || "" })}
            </p>

            <div className="p-3 rounded-xl bg-white border border-[#49352F]/10 text-xs space-y-1">
              <strong className="text-[#8D4E10] block text-[11px]">
                {pm.conversationalPromptHeading}
              </strong>
              <p className="italic text-[#49352F]">
                {pm.conversationalPromptQuote}
              </p>
            </div>
          </div>

          {/* Official Signatures & Verification Block (Visible on print & on screen) */}
          <div className="p-5 rounded-2xl bg-white border border-[#49352F]/15 space-y-4">
            <h5 className="font-heading text-xs font-extrabold uppercase tracking-wider text-[#7A6862]">
              {pm.signOffHeading}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="border-t border-[#49352F]/30 pt-2 space-y-1">
                <span className="font-bold text-[#49352F] block">{pm.teacherSignature}</span>
                <span className="text-[11px] text-[#7A6862] block">{pm.verifiedByEducator}</span>
                <span className="text-[10px] text-[#7A6862]">{pm.signatureDateBlank}</span>
              </div>

              <div className="border-t border-[#49352F]/30 pt-2 space-y-1">
                <span className="font-bold text-[#49352F] block">{pm.parentAcknowledgment}</span>
                <span className="text-[11px] text-[#7A6862] block">{pm.reviewedWithChild}</span>
                <span className="text-[10px] text-[#7A6862]">{pm.signatureDateBlank}</span>
              </div>

              <div className="border-t border-[#49352F]/30 pt-2 space-y-1">
                <span className="font-bold text-[#2E7D5E] block">{pm.masteryVerification}</span>
                <span className="text-[11px] text-[#7A6862] block">{pm.reassessmentScoreBlank}</span>
                <span className="text-[10px] text-[#2E7D5E] font-bold">{pm.benchmarkMetBlank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal On-Screen Footer (Hidden on print) */}
        <div className="no-print p-4 bg-white border-t border-[#49352F]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#7A6862]">
            {pm.footerLinked}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-full text-xs font-bold bg-[#FAF6E9] hover:bg-white text-[#49352F] border-[#49352F]/15"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-[#B26A1B]" />
              <span>{pm.printWorksheetBtn}</span>
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
                <span>{pm.reassessDeltaBtn}</span>
              </Button>
            )}

            <Button
              variant="saffron"
              size="sm"
              onClick={onClose}
              className="rounded-full text-xs font-bold"
            >
              <span>{pm.doneBtn}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
