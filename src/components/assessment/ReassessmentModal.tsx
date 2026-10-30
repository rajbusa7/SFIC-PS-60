import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { BridgeProgress } from "../ui/BridgeProgress";
import { calculatePercentage, calculatePercentagePointDelta } from "@/lib/engine/calculations";
import { evaluateReassessmentOutcome } from "@/lib/engine/reassessmentEngine";
import { broadcastDataUpdate } from "@/lib/events";
import { useLanguage } from "@/context/LanguageContext";
import { TrendingUp, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

interface ReassessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  conceptId: string;
  conceptName: string;
  previousPercentage?: number;
  supportThreshold?: number;
  masteryThreshold?: number;
  onSuccess?: () => void;
}

export function ReassessmentModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  conceptId,
  conceptName,
  previousPercentage = 35,
  supportThreshold = 60,
  masteryThreshold = 80,
  onSuccess,
}: ReassessmentModalProps) {
  const { language } = useLanguage();
  const [marksObtained, setMarksObtained] = useState<string>("17");
  const [maximumMarks, setMaximumMarks] = useState<string>("20");
  const [notes, setNotes] = useState<string>("Post-remedial intervention reassessment.");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMarksObtained("17");
      setMaximumMarks("20");
      setNotes(
        language === "gu"
          ? `${conceptName} માટે ઉપચારાત્મક હસ્તક્ષેપ પછીનું પુનઃમૂલ્યાંકન.`
          : `Post-remedial intervention reassessment for ${conceptName}.`
      );
      setError(null);
    }
  }, [isOpen, conceptName, language]);

  const obtainedNum = parseFloat(marksObtained) || 0;
  const maxNum = parseFloat(maximumMarks) || 20;
  const currentPct = calculatePercentage(obtainedNum, maxNum);
  const deltaPp = calculatePercentagePointDelta(currentPct, previousPercentage);

  const outcome = evaluateReassessmentOutcome({
    previousScore: previousPercentage,
    currentScore: currentPct,
    supportThreshold,
    masteryThreshold,
    language,
  });

  const newStatus = outcome.status;
  const newStatusLabel = language === "gu" ? outcome.outcomeLabelGu : outcome.outcomeLabel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (obtainedNum < 0 || obtainedNum > maxNum) {
      setError(
        language === "gu"
          ? `મેળવેલ ગુણ ૦ અને ${maxNum} વચ્ચે હોવા આવશ્યક છે`
          : `Marks obtained must be between 0 and ${maxNum}`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/assessments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: [
            {
              assessmentId: `asm-retest-${Date.now()}`,
              studentId,
              conceptId,
              marksObtained: obtainedNum,
              maximumMarks: maxNum,
              notes,
              recordedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("gaps", "reassess");
        broadcastDataUpdate("results", "create");
        broadcastDataUpdate("students", "update", studentId);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || (language === "gu" ? "પુનઃમૂલ્યાંકન નોંધવામાં નિષ્ફળતા" : "Failed to record reassessment"));
      }
    } catch {
      setError(language === "gu" ? "નેટવર્ક ભૂલ: પુનઃમૂલ્યાંકન નોંધાઈ શક્યું નથી" : "Network error recording reassessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === "gu" ? "સંકલ્પના પુનઃમૂલ્યાંકન નોંધો" : "Record Concept Reassessment"}
      description={
        language === "gu"
          ? `${studentName} માટે ${conceptName} પર ઉપચારાત્મક પરિણામો માપો`
          : `Measure remedial intervention outcomes for ${studentName} on ${conceptName}`
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Animated Bridge-Building Progress Bar */}
        <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#49352F] flex items-center gap-1.5 font-heading">
              <Sparkles className="w-3.5 h-3.5 text-[#B26A1B]" />
              {language === "gu" ? "સેતુ વૃદ્ધિ તફાવત" : "The Bridge Delta"}
            </span>
            <Badge
              variant={outcome.outcomeBadgeVariant}
              size="sm"
              dot
            >
              {newStatusLabel}
            </Badge>
          </div>

          <BridgeProgress
            score={currentPct}
            previousScore={previousPercentage}
            studentName={studentName}
            height="lg"
          />

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 shadow-2xs">
              <span className="text-[10px] text-[#7A6862] uppercase font-semibold block">
                {language === "gu" ? "આધારરેખા (Baseline)" : "Baseline"}
              </span>
              <span className="text-base font-bold text-[#7A6862]">{previousPercentage}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 shadow-2xs">
              <span className="text-[10px] text-[#B26A1B] uppercase font-semibold block">
                {language === "gu" ? "નવો સ્કોર" : "New Score"}
              </span>
              <span className="text-base font-black text-[#B26A1B]">{currentPct}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 shadow-2xs">
              <span className="text-[10px] text-[#2E7D5E] uppercase font-semibold block">
                {language === "gu" ? "વૃદ્ધિ તફાવત" : "Delta Gain"}
              </span>
              <span className="text-base font-black text-[#2E7D5E]">
                {outcome.scoreDeltaFormatted}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#49352F] bg-white/90 p-2.5 rounded-xl border border-[#49352F]/10 font-medium leading-relaxed">
            {language === "gu" ? outcome.explanationGu : outcome.explanation}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#49352F] mb-1">
              {language === "gu" ? "મેળવેલ ગુણ" : "Marks Obtained"}
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={maxNum}
              required
              value={marksObtained}
              onChange={(e) => setMarksObtained(e.target.value)}
              className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm font-bold text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#49352F] mb-1">
              {language === "gu" ? "મહત્તમ ગુણ" : "Maximum Marks"}
            </label>
            <input
              type="number"
              min="1"
              required
              value={maximumMarks}
              onChange={(e) => setMaximumMarks(e.target.value)}
              className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm font-bold text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#49352F] mb-1">
            {language === "gu" ? "શિક્ષક અવલોકન અને ઉપચાર નોંધ" : "Teacher Observation & Remedial Notes"}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs text-[#49352F] placeholder-[#7A6862]/60 focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
            placeholder={
              language === "gu"
                ? "દા.ત. વિદ્યાર્થીએ સંકેત વિના વિઝ્યુઅલ કાર્ડ્સનો સફળતાપૂર્વક ઉપયોગ કર્યો."
                : "e.g. Student successfully used visual grouping cards without prompts."
            }
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#49352F]/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            {language === "gu" ? "રદ કરો" : "Cancel"}
          </Button>
          <Button
            type="submit"
            variant="saffron"
            size="sm"
            disabled={isSubmitting}
            className="rounded-full text-xs font-bold"
          >
            {isSubmitting
              ? language === "gu"
                ? "નોંધાઈ રહ્યું છે..."
                : "Recording..."
              : language === "gu"
              ? "સાચવો અને સેતુ પુનઃ ગણો"
              : "Save & Recalculate The Bridge"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
