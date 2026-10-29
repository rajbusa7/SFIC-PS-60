"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, HelpCircle, Trophy } from "lucide-react";
import type { LearningActivity, ActivityQuestion } from "@/lib/types";

interface ActivityPlayerModalProps {
  activity: LearningActivity | null;
  studentId: string;
  studentName?: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (attempt: any) => void;
}

export function ActivityPlayerModal({
  activity,
  studentId,
  studentName,
  isOpen,
  onClose,
  onCompleted,
}: ActivityPlayerModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | number | boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setSelectedAnswers({});
      setShowHint(false);
      setIsSubmitted(false);
      setAttemptResult(null);
    }
  }, [isOpen, activity?.id]);

  if (!activity) return null;

  const currentQ: ActivityQuestion = activity.questions[currentIdx] || activity.questions[0];
  const totalQuestions = activity.questions.length;
  const currentAnswer = currentQ ? selectedAnswers[currentQ.id] : undefined;

  const handleSelectOption = (opt: string | number | boolean) => {
    if (isSubmitted || !currentQ) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleNext = () => {
    setShowHint(false);
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishActivity();
    }
  };

  const finishActivity = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/activities/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          studentId,
          answers: selectedAnswers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAttemptResult(data);
        setIsSubmitted(true);
        if (onCompleted) onCompleted(data);
      }
    } catch (e) {
      console.error("Failed to save activity attempt", e);
    } finally {
      setIsSaving(false);
    }
  };

  const resetActivity = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowHint(false);
    setIsSubmitted(false);
    setAttemptResult(null);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`${activity.title} — ${studentName || "Student Practice"}`}
      description={`Interactive Practice • Subject: ${activity.subjectCode} • Grade ${activity.grade}`}
      maxWidth="xl"
    >
      {!isSubmitted ? (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Question {currentIdx + 1} of {totalQuestions}</span>
              <span>{Math.round(((currentIdx + 1) / totalQuestions) * 100)}% Complete</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="default" size="sm">
                {currentQ.type.toUpperCase().replace("_", " ")}
              </Badge>
              {currentQ.hint && (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? "Hide Hint" : "Need a Hint?"}</span>
                </button>
              )}
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-900 mt-2">
              {currentQ.questionText}
            </p>

            {currentQ.questionTextGujarati && (
              <p className="text-sm font-medium text-slate-700 mt-1 font-serif">
                {currentQ.questionTextGujarati}
              </p>
            )}

            {showHint && currentQ.hint && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                💡 <strong>Hint:</strong> {currentQ.hint}
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(currentQ.options || ["True", "False"]).map((opt, i) => {
              const isSelected = String(currentAnswer) === String(opt);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left font-medium text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-md scale-101"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentAnswer === undefined || isSaving}
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{currentIdx === totalQuestions - 1 ? (isSaving ? "Submitting..." : "Submit Answers") : "Next Question"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Completion & Score Screen */
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-xl font-bold text-slate-900">Activity Completed!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Score recorded for {studentName || "Student"}
            </p>
          </div>

          {/* Score Badge Card */}
          <div className="p-4 max-w-sm mx-auto rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-3xl font-extrabold text-indigo-600">
              {attemptResult?.percentage}%
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">
              {attemptResult?.attempt?.score} out of {totalQuestions} questions correct
            </div>
            <p className="text-xs text-slate-700 mt-3 font-medium">
              {attemptResult?.feedback}
            </p>
          </div>

          {/* Post-Submission Review (Only visible after submission) */}
          {attemptResult?.results && attemptResult.results.length > 0 && (
            <div className="max-w-lg mx-auto text-left space-y-3 pt-2">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Review & Solutions:
              </h5>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {attemptResult.results.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs ${
                      res.isCorrect
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-rose-50/70 border-rose-200 text-rose-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">
                        Q{idx + 1}. {res.questionText}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          res.isCorrect
                            ? "bg-emerald-200 text-emerald-800"
                            : "bg-rose-200 text-rose-800"
                        }`}
                      >
                        {res.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[11px] space-y-0.5">
                      <p>
                        Your Answer: <span className="font-semibold">{String(res.selected ?? "None")}</span>
                      </p>
                      {!res.isCorrect && (
                        <p className="text-emerald-700 font-semibold">
                          Correct Answer: {String(res.correctAnswer)}
                        </p>
                      )}
                      {res.explanation && (
                        <p className="text-slate-600 italic mt-1">
                          💡 {res.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={resetActivity}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Practice Again
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Done & View Progress
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
