"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { BridgeProgress } from "../ui/BridgeProgress";
import { calculatePercentage, calculatePercentagePointDelta } from "@/lib/engine/calculations";
import { TrendingUp, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

interface ReassessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  conceptId: string;
  conceptName: string;
  previousPercentage?: number;
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
  onSuccess,
}: ReassessmentModalProps) {
  const [marksObtained, setMarksObtained] = useState<string>("17");
  const [maximumMarks, setMaximumMarks] = useState<string>("20");
  const [notes, setNotes] = useState<string>("Post-remedial intervention reassessment.");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMarksObtained("17");
      setMaximumMarks("20");
      setNotes(`Post-remedial intervention reassessment for ${conceptName}.`);
      setError(null);
    }
  }, [isOpen, conceptName]);

  const obtainedNum = parseFloat(marksObtained) || 0;
  const maxNum = parseFloat(maximumMarks) || 20;
  const currentPct = calculatePercentage(obtainedNum, maxNum);
  const deltaPp = calculatePercentagePointDelta(currentPct, previousPercentage);

  const newStatus =
    currentPct >= 80 ? "Mastered" : currentPct >= 60 ? "Developing" : "Needs Support";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (obtainedNum < 0 || obtainedNum > maxNum) {
      setError(`Marks obtained must be between 0 and ${maxNum}`);
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
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to record reassessment");
      }
    } catch {
      setError("Network error recording reassessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Concept Reassessment"
      description={`Measure remedial intervention outcomes for ${studentName} on ${conceptName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Animated Bridge-Building Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              The Bridge Delta
            </span>
            <Badge
              variant={
                newStatus === "Mastered"
                  ? "mastered"
                  : newStatus === "Developing"
                  ? "developing"
                  : "needsSupport"
              }
              size="sm"
              dot
            >
              {newStatus}
            </Badge>
          </div>

          <BridgeProgress
            score={currentPct}
            previousScore={previousPercentage}
            studentName={studentName}
            height="lg"
          />

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Baseline
              </span>
              <span className="text-base font-bold text-slate-400">{previousPercentage}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase font-semibold block">
                New Score
              </span>
              <span className="text-base font-black text-amber-400">{currentPct}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block">
                Delta Gain
              </span>
              <span className="text-base font-black text-emerald-400">
                {deltaPp >= 0 ? `+${deltaPp}` : deltaPp} pp
              </span>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Marks Obtained
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={maxNum}
              required
              value={marksObtained}
              onChange={(e) => setMarksObtained(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm font-bold text-white focus:border-amber-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Maximum Marks
            </label>
            <input
              type="number"
              min="1"
              required
              value={maximumMarks}
              onChange={(e) => setMaximumMarks(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm font-bold text-white focus:border-amber-500 outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Teacher Observation & Remedial Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
            placeholder="e.g. Student successfully used visual grouping cards without prompts."
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="saffron"
            size="sm"
            disabled={isSubmitting}
            className="rounded-full text-xs font-bold"
          >
            {isSubmitting ? "Recording..." : "Save & Recalculate The Bridge"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
