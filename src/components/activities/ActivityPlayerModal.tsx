"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Trophy,
  Lightbulb,
  Clock,
  RotateCcw,
  BookOpen,
  Award,
  Zap,
  Play,
  Check,
} from "lucide-react";
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
  onLaunchNext?: (activityId: string) => void;
}

export function ActivityPlayerModal({
  activity,
  studentId,
  studentName,
  isOpen,
  onClose,
  onCompleted,
  onLaunchNext,
}: ActivityPlayerModalProps) {
  const { language, formatSubject } = useLanguage();

  // Mode: "intro" | "playing" | "completed"
  const [stage, setStage] = useState<"intro" | "playing" | "completed">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<ActivityQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | number | boolean>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    if (isOpen && activity) {
      setStage("intro");
      setCurrentIdx(0);
      setActiveQuestions(activity.questions || []);
      setSelectedAnswers({});
      setCheckedQuestions({});
      setShowHint(false);
      setAttemptResult(null);
      setSecondsElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, activity?.id]);

  // Start timer on playing stage
  useEffect(() => {
    if (stage === "playing") {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  if (!activity) return null;

  const totalQuestions = activeQuestions.length;
  const currentQ = activeQuestions[currentIdx] || activeQuestions[0];
  const currentAnswer = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const isCurrentChecked = currentQ ? Boolean(checkedQuestions[currentQ.id]) : false;

  const isCurrentCorrect =
    currentQ &&
    currentAnswer !== undefined &&
    String(currentAnswer).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

  const handleStartPractice = () => {
    setStage("playing");
    setSecondsElapsed(0);
  };

  const handleSelectOption = (opt: string | number | boolean) => {
    if (!currentQ || isCurrentChecked) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleCheckAnswer = () => {
    if (!currentQ || currentAnswer === undefined) return;
    setCheckedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
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
          timeSpentSeconds: secondsElapsed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("activities", "update", activity.id);
        broadcastDataUpdate("students", "update", studentId);
        setAttemptResult(data);
        setStage("completed");
        if (onCompleted) onCompleted(data);
      }
    } catch (e) {
      console.error("Failed to save activity attempt", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetryIncorrect = () => {
    if (!attemptResult || !attemptResult.incorrectQuestions?.length) return;
    const incorrectIds: string[] = attemptResult.incorrectQuestions;
    const retryQs = activity.questions.filter((q) => incorrectIds.includes(q.id));
    if (retryQs.length > 0) {
      setActiveQuestions(retryQs);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setCheckedQuestions({});
      setShowHint(false);
      setAttemptResult(null);
      setSecondsElapsed(0);
      setStage("playing");
    }
  };

  const resetActivity = () => {
    setActiveQuestions(activity.questions || []);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setShowHint(false);
    setAttemptResult(null);
    setSecondsElapsed(0);
    setStage("intro");
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`${activity.title} — ${studentName || (language === "gu" ? "વિદ્યાર્થી મહાવરો" : "Student Practice")}`}
      description={
        language === "gu"
          ? `ઇન્ટરેક્ટિવ મહાવરો • ${formatSubject(activity.subjectCode)} • ધોરણ ${activity.grade} • ${activity.difficulty}`
          : `Interactive Practice • ${formatSubject(activity.subjectCode)} • Grade ${activity.grade} • ${activity.difficulty}`
      }
      maxWidth="xl"
    >
      {/* ───────────────── STAGE 1: INTRO SCREEN ───────────────── */}
      {stage === "intro" && (
        <div className="space-y-6 py-2">
          {/* Header Card */}
          <div className="rounded-2xl border border-[#49352F]/12 bg-[#FAF6E9] p-5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">
                  {formatSubject(activity.subjectCode)} • {language === "gu" ? `ધોરણ ${activity.grade}` : `Grade ${activity.grade}`}
                </Badge>
                <Badge
                  variant={
                    activity.difficulty === "Easy"
                      ? "mastered"
                      : activity.difficulty === "Medium"
                      ? "developing"
                      : "high"
                  }
                  size="sm"
                >
                  {activity.difficulty === "Easy"
                    ? language === "gu" ? "સરળ / પ્રારંભિક" : "Beginner / Easy"
                    : activity.difficulty === "Medium"
                    ? language === "gu" ? "મધ્યમ" : "Intermediate"
                    : language === "gu" ? "કઠિન" : "Advanced"}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7A6862]">
                <Clock className="w-3.5 h-3.5 text-[#B26A1B]" />
                <span>~{activity.estimatedMinutes || 10} {language === "gu" ? "મિનિટ" : "mins"}</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#49352F]">{activity.title}</h3>
            {activity.titleGujarati && (
              <p className="text-sm font-medium text-[#7A6862] font-serif">
                {activity.titleGujarati}
              </p>
            )}

            {(activity as any).chapter && (
              <p className="text-xs text-[#7A6862]">
                <strong>{language === "gu" ? "પ્રકરણ:" : "Chapter:"}</strong>{" "}
                {language === "gu" && (activity as any).chapterGujarati
                  ? (activity as any).chapterGujarati
                  : (activity as any).chapter}
              </p>
            )}

            {/* Learning Objective Box */}
            <div className="mt-3 p-3.5 rounded-xl bg-white/90 border border-[#49352F]/10 space-y-1">
              <span className="text-xs font-bold text-[#B26A1B] uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {language === "gu" ? "અધ્યયન નિષ્પત્તિ (Learning Objective):" : "Learning Objective:"}
              </span>
              <p className="text-xs text-[#49352F] leading-relaxed">
                {(activity as any).learningObjective ||
                  "Practice foundational concepts through interactive question validation and immediate feedback."}
              </p>
              {language === "gu" && (activity as any).learningObjectiveGujarati && (
                <p className="text-xs text-[#7A6862] font-serif leading-relaxed">
                  {(activity as any).learningObjectiveGujarati}
                </p>
              )}
            </div>
          </div>

          {/* Practice Rules & XP Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#49352F]/12 flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#B26A1B] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-[#49352F] block">
                  {language === "gu" ? "XP પુરસ્કાર" : "Earn +35 XP"}
                </span>
                <span className="text-[#7A6862]">
                  {language === "gu"
                    ? "સાચા જવાબો સાથે મહાવરો પૂર્ણ કરી XP મેળવો."
                    : "Earn XP points and mastery badges for accurate completion."}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#49352F]/12 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#2E7D5E] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-[#49352F] block">
                  {language === "gu" ? "સહાયક સંકેતો ઉપલબ્ધ" : "Hints Available"}
                </span>
                <span className="text-[#7A6862]">
                  {language === "gu"
                    ? "જવાબ ન આવડે તો સંકેત જુઓ અને શીખો."
                    : "Use hints if you get stuck and review explanations after each question."}
                </span>
              </div>
            </div>
          </div>

          {/* Launch Practice CTA */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleStartPractice}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{language === "gu" ? "મહાવરો શરૂ કરો" : "Start Practice"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ───────────────── STAGE 2: PLAYING ACTIVE QUESTIONS ───────────────── */}
      {stage === "playing" && (
        <div className="space-y-6">
          {/* Header & Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#7A6862]">
              <div className="flex items-center gap-2">
                <span>
                  {language === "gu"
                    ? `પ્રશ્ન ${currentIdx + 1} / ${totalQuestions}`
                    : `Question ${currentIdx + 1} of ${totalQuestions}`}
                </span>
                <span className="text-[#49352F]/30">•</span>
                <span className="inline-flex items-center gap-1 text-[#49352F]">
                  <Clock className="w-3 h-3 text-[#B26A1B]" />
                  {formatTime(secondsElapsed)}
                </span>
              </div>

              <span>
                {Math.round(((currentIdx + 1) / totalQuestions) * 100)}% {language === "gu" ? "પૂર્ણ" : "Complete"}
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-[#FAF6E9] border border-[#49352F]/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F2CAB3] to-[#B26A1B] transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="rounded-2xl border border-[#49352F]/12 bg-[#FAF6E9] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" size="sm">
                {(currentQ.type || "MCQ").toUpperCase().replace("_", " ")}
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
                      ? showHint ? "સંકેત છુપાવો" : "સંકેત જોઈએ છે?"
                      : showHint ? "Hide Hint" : "Need a Hint?"}
                  </span>
                </button>
              )}
            </div>

            <p className="text-base sm:text-lg font-bold text-[#49352F] leading-snug">
              {currentQ.questionText}
            </p>

            {currentQ.questionTextGujarati && (
              <p className="text-sm font-medium text-[#7A6862] font-serif leading-relaxed">
                {currentQ.questionTextGujarati}
              </p>
            )}

            {/* Hint Box */}
            {showHint && currentQ.hint && (
              <div className="p-3 rounded-xl bg-[#F2DCB5]/50 border border-[#49352F]/12 text-xs text-[#49352F] font-medium flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-[#8D4E10] shrink-0 mt-0.5" />
                <div>
                  <strong>{language === "gu" ? "શિક્ષક સંકેત:" : "Hint:"}</strong> {currentQ.hint}
                  {language === "gu" && (currentQ as any).hintGujarati && (
                    <p className="mt-1 font-serif text-[#7A6862]">{(currentQ as any).hintGujarati}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(currentQ.options || ["True", "False"]).map((opt, i) => {
              const isSelected = String(currentAnswer) === String(opt);
              const isOptionCorrect = String(opt).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

              // Conditional border and background states based on whether answer was checked
              let buttonStyle = "border-[#49352F]/12 bg-white text-[#49352F] hover:bg-[#FAF6E9]";
              if (isCurrentChecked) {
                if (isOptionCorrect) {
                  buttonStyle = "border-[#2E7D5E] bg-[#2E7D5E]/15 text-[#1B5E41] font-bold shadow-xs";
                } else if (isSelected && !isOptionCorrect) {
                  buttonStyle = "border-[#B91C1C] bg-[#B91C1C]/10 text-[#991B1B] font-bold";
                }
              } else if (isSelected) {
                buttonStyle = "border-[#49352F] bg-[#F2CAB3] text-[#49352F] font-bold shadow-sm scale-101";
              }

              // Optional Gujarati option label
              const optGuj = (currentQ as any).optionsGujarati?.[i];

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isCurrentChecked}
                  onClick={() => handleSelectOption(opt)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left text-sm transition-all cursor-pointer ${buttonStyle}`}
                >
                  <div className="space-y-0.5">
                    <span className="block font-medium">{opt}</span>
                    {language === "gu" && optGuj && (
                      <span className="block text-xs font-serif opacity-80">{optGuj}</span>
                    )}
                  </div>

                  {isCurrentChecked ? (
                    isOptionCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2E7D5E] shrink-0" />
                    ) : isSelected ? (
                      <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0" />
                    ) : null
                  ) : isSelected ? (
                    <Check className="w-5 h-5 text-[#49352F] shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Immediate Feedback & Pedagogical Explanation */}
          {isCurrentChecked && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                isCurrentCorrect
                  ? "bg-[#2E7D5E]/10 border-[#2E7D5E]/20 text-[#1B5E41]"
                  : "bg-[#F2CAB3]/30 border-[#49352F]/15 text-[#49352F]"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D5E]" />
                    <span>{language === "gu" ? "ખૂબ સરસ! સાચો જવાબ!" : "Brilliant! That's correct!"}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-[#B91C1C]" />
                    <span>{language === "gu" ? "ચિંતા ન કરો, સમજીએ:" : "Not quite, but let's understand why:"}</span>
                  </>
                )}
              </div>

              <p className="leading-relaxed">
                <strong>{language === "gu" ? "સમજૂતી:" : "Explanation:"}</strong> {currentQ.explanation}
              </p>

              {language === "gu" && (currentQ as any).explanationGujarati && (
                <p className="font-serif leading-relaxed text-[#7A6862]">
                  {(currentQ as any).explanationGujarati}
                </p>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#49352F]/10">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
              className="px-4 py-2 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] hover:text-[#49352F] rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
            >
              {language === "gu" ? "પાછળ" : "Previous"}
            </button>

            <div className="flex items-center gap-2">
              {!isCurrentChecked ? (
                <button
                  type="button"
                  disabled={currentAnswer === undefined}
                  onClick={handleCheckAnswer}
                  className="px-5 py-2.5 text-xs font-bold bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/20 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {language === "gu" ? "જવાબ ચકાસો" : "Check Answer"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {currentIdx === totalQuestions - 1
                      ? isSaving
                        ? language === "gu" ? "સબમિટ થઈ રહ્યું છે..." : "Submitting..."
                        : language === "gu" ? "જવાબો સબમિટ કરો" : "Finish & View Results"
                      : language === "gu" ? "આગળનો પ્રશ્ન" : "Next Question"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── STAGE 3: COMPLETION & SCORE SCREEN ───────────────── */}
      {stage === "completed" && (
        <div className="space-y-6 py-2">
          {/* Trophy Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] flex items-center justify-center shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <h4 className="text-xl font-bold text-[#49352F]">
              {language === "gu" ? "અભિનંદન! પ્રવૃત્તિ પૂર્ણ થઈ!" : "Congratulations! Activity Completed!"}
            </h4>
            <p className="text-xs text-[#7A6862]">
              {language === "gu"
                ? `${studentName || "વિદ્યાર્થી"} માટે પ્રગતિ અને સ્કોર નોંધાયો`
                : `Progress and score successfully saved for ${studentName || "Student"}`}
            </p>
          </div>

          {/* Score & KPI Dashboard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 text-center">
              <span className="text-2xl font-extrabold text-[#B26A1B] block">
                {attemptResult?.percentage}%
              </span>
              <span className="text-[11px] font-semibold text-[#7A6862]">
                {language === "gu" ? "ચોકસાઈ દર" : "Accuracy"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 text-center">
              <span className="text-2xl font-extrabold text-[#2E7D5E] block">
                {attemptResult?.score} / {attemptResult?.totalQuestions || totalQuestions}
              </span>
              <span className="text-[11px] font-semibold text-[#7A6862]">
                {language === "gu" ? "સાચા જવાબો" : "Correct"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 text-center">
              <span className="text-2xl font-extrabold text-[#8D4E10] block">
                +{attemptResult?.xpEarned || 35}
              </span>
              <span className="text-[11px] font-semibold text-[#7A6862]">
                {language === "gu" ? "મેળવેલ XP" : "XP Earned"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 text-center">
              <span className="text-2xl font-extrabold text-[#49352F] block">
                {formatTime(secondsElapsed)}
              </span>
              <span className="text-[11px] font-semibold text-[#7A6862]">
                {language === "gu" ? "સમય લાગ્યો" : "Time Spent"}
              </span>
            </div>
          </div>

          {/* Teacher Feedback Note */}
          <div className="p-3.5 rounded-xl bg-white border border-[#49352F]/12 text-xs flex items-start gap-2.5">
            <Award className="w-5 h-5 text-[#B26A1B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#49352F] block">
                {attemptResult?.milestoneBadge || "Practice Verified"}
              </strong>
              <p className="text-[#7A6862] mt-0.5">{attemptResult?.feedback}</p>
            </div>
          </div>

          {/* Review Incorrect Questions if any */}
          {attemptResult?.incorrectQuestions?.length > 0 && (
            <div className="rounded-xl border border-[#B91C1C]/15 bg-[#B91C1C]/5 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#991B1B]">
                  {language === "gu"
                    ? `પુનરાવર્તન જરૂરી (${attemptResult.incorrectQuestions.length} પ્રશ્નો)`
                    : `Questions to Review (${attemptResult.incorrectQuestions.length} items)`}
                </span>

                <button
                  type="button"
                  onClick={handleRetryIncorrect}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white text-[#991B1B] border border-[#B91C1C]/20 rounded-lg hover:bg-[#FAF6E9] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === "gu" ? "આ પ્રશ્નો ફરી કરો" : "Retry Missed Only"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#49352F]/10">
            <button
              type="button"
              onClick={resetActivity}
              className="px-4 py-2 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] hover:text-[#49352F] rounded-xl cursor-pointer transition-colors"
            >
              {language === "gu" ? "આખી પ્રવૃત્તિ ફરી કરો" : "Practice All Again"}
            </button>

            <div className="flex items-center gap-2">
              {attemptResult?.recommendedNextActivityId && onLaunchNext && (
                <button
                  type="button"
                  onClick={() => onLaunchNext(attemptResult.recommendedNextActivityId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/16 rounded-xl cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B26A1B]" />
                  <span>{language === "gu" ? "આગળની પ્રવૃત્તિ શરૂ કરો" : "Next Recommended"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-xs font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                {language === "gu" ? "પૂર્ણ કરો" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
