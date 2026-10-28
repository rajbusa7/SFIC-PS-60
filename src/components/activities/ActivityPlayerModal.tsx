import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, HelpCircle, Trophy, Lightbulb } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { broadcastDataUpdate } from "@/lib/events";
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
  const { language } = useLanguage();
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
        broadcastDataUpdate("activities", "update", activity.id);
        broadcastDataUpdate("students", "update", studentId);
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
      title={`${activity.title} — ${studentName || (language === "gu" ? "વિદ્યાર્થી મહાવરો" : "Student Practice")}`}
      description={
        language === "gu"
          ? `ઇન્ટરેક્ટિવ મહાવરો • વિષય: ${activity.subjectCode} • ધોરણ ${activity.grade}`
          : `Interactive Practice • Subject: ${activity.subjectCode} • Grade ${activity.grade}`
      }
      maxWidth="xl"
    >
      {!isSubmitted ? (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#7A6862]">
              <span>
                {language === "gu"
                  ? `પ્રશ્ન ${currentIdx + 1} / ${totalQuestions}`
                  : `Question ${currentIdx + 1} of ${totalQuestions}`}
              </span>
              <span>
                {language === "gu"
                  ? `${Math.round(((currentIdx + 1) / totalQuestions) * 100)}% પૂર્ણ`
                  : `${Math.round(((currentIdx + 1) / totalQuestions) * 100)}% Complete`}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#FAF6E9] border border-[#49352F]/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F2CAB3] to-[#B26A1B] transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question card */}
          <div className="rounded-2xl border border-[#49352F]/12 bg-[#FAF6E9] p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="outline" size="sm">
                {currentQ.type.toUpperCase().replace("_", " ")}
              </Badge>
              {currentQ.hint && (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#B26A1B] hover:text-[#49352F] cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>
                    {language === "gu"
                      ? showHint
                        ? "સંકેત છુપાવો"
                        : "સંકેત જોઈએ છે?"
                      : showHint
                      ? "Hide Hint"
                      : "Need a Hint?"}
                  </span>
                </button>
              )}
            </div>

            <p className="text-base sm:text-lg font-bold text-[#49352F] mt-2">
              {currentQ.questionText}
            </p>

            {currentQ.questionTextGujarati && (
              <p className="text-sm font-medium text-[#7A6862] mt-1 font-serif">
                {currentQ.questionTextGujarati}
              </p>
            )}

            {showHint && currentQ.hint && (
              <div className="mt-3 p-3 rounded-xl bg-[#F2DCB5]/40 border border-[#49352F]/12 text-xs text-[#49352F] font-medium flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-[#8D4E10] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong>{language === "gu" ? "સંકેત:" : "Hint:"}</strong> {currentQ.hint}
                </div>
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
                      ? "border-[#49352F] bg-[#F2CAB3] text-[#49352F] font-bold shadow-md scale-101"
                      : "border-[#49352F]/12 bg-white text-[#49352F] hover:bg-[#FAF6E9] hover:border-[#49352F]/20"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#49352F] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#49352F]/10">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
              className="px-4 py-2 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] hover:text-[#49352F] rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
            >
              {language === "gu" ? "પાછળ" : "Previous"}
            </button>
            <button
              type="button"
              disabled={currentAnswer === undefined || isSaving}
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>
                {currentIdx === totalQuestions - 1
                  ? isSaving
                    ? language === "gu"
                      ? "સબમિટ થઈ રહ્યું છે..."
                      : "Submitting..."
                    : language === "gu"
                    ? "જવાબો સબમિટ કરો"
                    : "Submit Answers"
                  : language === "gu"
                  ? "આગળનો પ્રશ્ન"
                  : "Next Question"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Completion & Score Screen */
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] flex items-center justify-center shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-xl font-bold text-[#49352F]">
              {language === "gu" ? "પ્રવૃત્તિ પૂર્ણ થઈ!" : "Activity Completed!"}
            </h4>
            <p className="text-xs text-[#7A6862] mt-1">
              {language === "gu"
                ? `${studentName || "વિદ્યાર્થી"} માટે સ્કોર નોંધાયો`
                : `Score recorded for ${studentName || "Student"}`}
            </p>
          </div>

          {/* Score Badge Card */}
          <div className="p-4 max-w-xs mx-auto rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12">
            <div className="text-3xl font-extrabold text-[#B26A1B]">
              {attemptResult?.percentage}%
            </div>
            <div className="text-xs font-semibold text-[#7A6862] mt-1">
              {language === "gu"
                ? `${totalQuestions} માંથી ${attemptResult?.attempt?.score} પ્રશ્નો સાચા`
                : `${attemptResult?.attempt?.score} out of ${totalQuestions} questions correct`}
            </div>
            <p className="text-xs text-[#49352F] mt-3 font-medium">
              {attemptResult?.feedback}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={resetActivity}
              className="px-4 py-2 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] hover:text-[#49352F] rounded-xl cursor-pointer transition-colors"
            >
              {language === "gu" ? "ફરીથી મહાવરો કરો" : "Practice Again"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {language === "gu" ? "પૂર્ણ અને પ્રગતિ જુઓ" : "Done & View Progress"}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
