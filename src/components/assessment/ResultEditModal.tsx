"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { calculatePercentage } from "@/lib/engine/calculations";
import { AlertCircle, Trash2 } from "lucide-react";

interface ResultEditModalProps {
  isOpen: boolean;
  result: any;
  studentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ResultEditModal({
  isOpen,
  result,
  studentName,
  onClose,
  onSuccess,
}: ResultEditModalProps) {
  const [marksObtained, setMarksObtained] = useState<string>("");
  const [maximumMarks, setMaximumMarks] = useState<string>("20");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && result) {
      setMarksObtained(String(result.marksObtained ?? ""));
      setMaximumMarks(String(result.maximumMarks ?? 20));
      setNotes(result.notes || "");
      setError(null);
      setConfirmDelete(false);
    }
  }, [isOpen, result]);

  const maxNum = parseFloat(maximumMarks) || 0;
  const obtainedNum = parseFloat(marksObtained);
  const hasMarks = marksObtained.trim() !== "" && !isNaN(obtainedNum);
  const pct = hasMarks && maxNum > 0 ? calculatePercentage(obtainedNum, maxNum) : 0;
  const status =
    !hasMarks
      ? null
      : pct >= 80
      ? "Mastered"
      : pct >= 60
      ? "Developing"
      : "Needs Support";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(maxNum) || maxNum <= 0) {
      setError("Maximum marks must be greater than zero.");
      return;
    }
    if (isNaN(obtainedNum) || obtainedNum < 0) {
      setError("Marks obtained cannot be negative.");
      return;
    }
    if (obtainedNum > maxNum) {
      setError(`Marks obtained (${obtainedNum}) cannot exceed maximum marks (${maxNum}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/assessments/results/${result.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marksObtained: obtainedNum,
          maximumMarks: maxNum,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to update assessment score.");
      }
    } catch {
      setError("Network error updating assessment score.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/results/${result.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to remove result record.");
      }
    } catch {
      setError("Network error removing result record.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !result) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Student Assessment Score"
      description={`Modify evaluation for ${studentName} on ${result.conceptName || result.conceptId}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Concept & Subject Header */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">
              Assessment: {result.assessmentTitle || "Formative Evaluation"}
            </span>
            <Badge variant="outline" size="sm">
              {result.subjectCode || "MATH"}
            </Badge>
          </div>
          <p className="text-sm font-bold text-white">
            {result.conceptName || result.conceptId}
          </p>
        </div>

        {/* Marks Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Maximum Marks <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={maximumMarks}
              onChange={(e) => setMaximumMarks(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm font-bold text-white focus:border-amber-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Marks Obtained <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={maxNum > 0 ? maxNum : undefined}
              step="any"
              required
              value={marksObtained}
              onChange={(e) => setMarksObtained(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm font-bold text-amber-400 focus:border-amber-500 outline-hidden"
            />
          </div>
        </div>

        {/* Live Calculation preview */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Updated Percentage</span>
            <span className="text-lg font-black text-white">{hasMarks ? `${pct}%` : "--"}</span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Mastery Status</span>
            {status ? (
              <Badge
                variant={
                  status === "Mastered"
                    ? "mastered"
                    : status === "Developing"
                    ? "developing"
                    : "needsSupport"
                }
                size="sm"
                dot
              >
                {status}
              </Badge>
            ) : (
              <span className="text-xs text-slate-500">Enter marks</span>
            )}
          </div>
        </div>

        {/* Teacher Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Teacher Notes / Observations
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
            placeholder="Observations during evaluation..."
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Result</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-rose-300 font-bold">Confirm delete?</span>
                <Button
                  type="button"
                  variant="coral"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="rounded-lg text-[10px] px-2 py-1 h-auto"
                >
                  {isDeleting ? "..." : "Yes, Delete"}
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="saffron"
              size="sm"
              disabled={isSubmitting}
              className="rounded-full text-xs font-bold shadow-md shadow-amber-500/20"
            >
              {isSubmitting ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
