"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Volume2,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Send,
  Loader2,
} from "lucide-react";
import { AudioRecorder } from "../audio/AudioRecorder";
import { useLanguage } from "@/context/LanguageContext";
import type { ReadingLevel, SupportedLanguage, NoticeCategory, NoticeUrgency } from "@/lib/types";

interface NoticeComposerProps {
  onNoticeCreated?: (notice: any) => void;
  className?: string;
}

export function NoticeComposer({ onNoticeCreated, className = "" }: NoticeComposerProps) {
  const { t, tr, formatClass } = useLanguage();
  const no = t.notices;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("announcement");
  const [urgency, setUrgency] = useState<NoticeUrgency>("normal");
  const [targetAudience, setTargetAudience] = useState<"all" | "class" | "individual">("all");
  const [targetGrade, setTargetGrade] = useState<string>("all");
  const [targetSection, setTargetSection] = useState<string>("all");
  const [originalLanguage, setOriginalLanguage] = useState<SupportedLanguage>("en");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("simple");

  const [originalText, setOriginalText] = useState(
    "All students of Grade 5 must submit their science fair project models before October 28, 2026. Failure to submit within the stipulated deadline will lead to deduction in term-end internal evaluation marks."
  );
  const [simplifiedText, setSimplifiedText] = useState("");
  const [simplificationMeta, setSimplificationMeta] = useState<{
    provider?: string;
    modelUsed?: string;
    latencyMs?: number;
    keyPoints?: string[];
  } | null>(null);

  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleVoiceInput = (transcribedText: string) => {
    setOriginalText((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText));
  };

  const handleSimplify = async () => {
    if (!originalText.trim()) {
      setError(no.ncErrWriteFirst);
      return;
    }

    setIsSimplifying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: originalText.trim(),
          readingLevel,
          originalLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || no.ncErrSimplifyFailed);
      }

      setSimplifiedText(data.simplifiedText);
      setSimplificationMeta({
        provider: data.provider,
        modelUsed: data.modelUsed,
        latencyMs: data.latencyMs,
        keyPoints: data.keyPointsPreserved,
      });
    } catch (err: any) {
      console.error("Simplification error:", err);
      setError(err.message || no.ncErrSimplifyRetry);
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleSaveAndCreate = async (autoTranslate: boolean = true) => {
    if (!title.trim()) {
      setError(no.ncErrProvideTitle);
      return;
    }
    if (!originalText.trim()) {
      setError(no.ncErrEmptyOriginal);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          originalContent: originalText.trim(),
          simplifiedContent: simplifiedText.trim() || undefined,
          originalLanguage,
          readingLevel,
          category,
          targetAudience,
          targetClassGrade: targetGrade !== "all" ? Number(targetGrade) : undefined,
          targetSection: targetSection !== "all" ? targetSection : undefined,
          urgency,
          autoSimplify: !simplifiedText,
          autoTranslate,
          requiresAcknowledgment: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || no.ncErrSaveFailed);
      }

      setSuccessMessage(
        `${tr("notices.ncSuccessSaved", { title })}${
          autoTranslate ? ` ${no.ncSuccessAutoTranslated}` : ""
        }`
      );

      if (onNoticeCreated) {
        onNoticeCreated(data.data);
      }

      // Reset form
      setTitle("");
      setSimplifiedText("");
      setSimplificationMeta(null);
    } catch (err: any) {
      console.error("Save notice error:", err);
      setError(err.message || no.ncErrSaveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`bg-[#FAF6E9] border border-[#49352F]/15 rounded-2xl p-6 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#49352F]/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F2CAB3]/40 border border-[#49352F]/10 text-xs font-semibold text-[#49352F] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D5E]" />
            {no.ncBadgeEngine}
          </div>
          <h2 className="text-xl font-bold text-[#49352F] tracking-tight">
            {no.ncHeading}
          </h2>
          <p className="text-xs text-[#49352F]/70">
            {no.ncSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AudioRecorder
            language={originalLanguage}
            onTranscript={handleVoiceInput}
            buttonLabel={no.ncRecordVoiceBtn}
          />
        </div>
      </div>

      {/* Notice Metadata Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#49352F] mb-1">
            {no.ncTitleLabel}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={no.ncTitlePlaceholder}
            className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#49352F] mb-1">
            {no.ncCategoryLabel}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as NoticeCategory)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
          >
            <option value="announcement">{no.ncCatAnnouncement}</option>
            <option value="event">{no.ncCatEvent}</option>
            <option value="homework">{no.ncCatHomework}</option>
            <option value="exam">{no.ncCatExam}</option>
            <option value="fee">{no.ncCatFee}</option>
            <option value="urgent_alert">{no.ncCatUrgent}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#49352F] mb-1">
            {no.ncTargetAudienceLabel}
          </label>
          <select
            value={targetGrade}
            onChange={(e) => setTargetGrade(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
          >
            <option value="all">{no.ncAllGradesOpt}</option>
            <option value="3">{formatClass(3)}</option>
            <option value="4">{formatClass(4)}</option>
            <option value="5">{formatClass(5)}</option>
            <option value="6">{formatClass(6)}</option>
            <option value="7">{formatClass(7)}</option>
            <option value="8">{formatClass(8)}</option>
          </select>
        </div>
      </div>

      {/* Reading Level Selector */}
      <div className="flex flex-wrap items-center gap-3 mt-4 p-3 bg-white/70 rounded-xl border border-[#49352F]/10">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#49352F]">
          <Sliders className="w-3.5 h-3.5 text-[#2E7D5E]" />
          <span>{no.ncReadingLevelLabel}</span>
        </div>

        <div className="inline-flex rounded-lg border border-[#49352F]/15 p-0.5 bg-[#FAF6E9]">
          <button
            type="button"
            onClick={() => setReadingLevel("very_simple")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              readingLevel === "very_simple"
                ? "bg-[#49352F] text-white shadow-xs"
                : "text-[#49352F]/80 hover:text-[#49352F]"
            }`}
          >
            {no.ncRlVerySimple}
          </button>
          <button
            type="button"
            onClick={() => setReadingLevel("simple")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              readingLevel === "simple"
                ? "bg-[#49352F] text-white shadow-xs"
                : "text-[#49352F]/80 hover:text-[#49352F]"
            }`}
          >
            {no.ncRlSimple}
          </button>
          <button
            type="button"
            onClick={() => setReadingLevel("standard")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              readingLevel === "standard"
                ? "bg-[#49352F] text-white shadow-xs"
                : "text-[#49352F]/80 hover:text-[#49352F]"
            }`}
          >
            {no.ncRlStandard}
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-semibold text-[#49352F]">{no.ncSourceLangLabel}</label>
          <select
            value={originalLanguage}
            onChange={(e) => setOriginalLanguage(e.target.value as SupportedLanguage)}
            className="px-2 py-1 text-xs rounded-lg bg-white border border-[#49352F]/20 text-[#49352F]"
          >
            <option value="en">English (English)</option>
            <option value="gu">Gujarati (ગુજરાતી)</option>
            <option value="hi">Hindi (हिंदी)</option>
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* Left: Original Message */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#49352F] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#49352F]" />
              {no.ncOriginalNoticeLabel}
            </label>
            <span className="text-[11px] text-[#49352F]/60">
              {tr("notices.ncCharactersCount", { count: originalText.length })}
            </span>
          </div>

          <textarea
            rows={6}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder={no.ncOriginalPlaceholder}
            className="w-full p-3.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3] resize-none leading-relaxed"
          />

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSimplify}
              disabled={isSimplifying || !originalText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#F2CAB3] hover:bg-[#F2CAB3]/80 text-[#49352F] border border-[#49352F]/15 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSimplifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#49352F]" />
                  <span>{no.ncSimplifyingAi}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#2E7D5E]" />
                  <span>{no.ncSimplifyAi}</span>
                </>
              )}
            </button>

            {simplificationMeta && (
              <span className="text-[11px] text-[#2E7D5E] font-medium bg-[#2E7D5E]/10 px-2 py-1 rounded-md border border-[#2E7D5E]/20">
                {tr("notices.ncGeneratedViaMeta", { provider: simplificationMeta.provider || "", ms: simplificationMeta.latencyMs || 0 })}
              </span>
            )}
          </div>
        </div>

        {/* Right: AI-Simplified Message (Editable & Verifiable) */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#49352F] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2E7D5E]" />
              {no.ncSimplifiedVersionLabel}
            </label>
            {simplifiedText && (
              <span className="text-[11px] text-[#2E7D5E] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {no.ncPreservesDatesRules}
              </span>
            )}
          </div>

          <textarea
            rows={6}
            value={simplifiedText}
            onChange={(e) => setSimplifiedText(e.target.value)}
            placeholder={no.ncSimplifiedPlaceholder}
            className="w-full p-3.5 text-sm rounded-xl bg-white border border-[#2E7D5E]/30 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]/30 resize-none leading-relaxed"
          />

          {simplificationMeta?.keyPoints && (
            <div className="mt-2.5 p-2 bg-[#FAF6E9] rounded-lg border border-[#49352F]/10">
              <span className="text-[11px] font-bold text-[#49352F] block mb-1">
                {no.ncPreservedKeyFacts}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {simplificationMeta.keyPoints.map((kp, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-white text-[#49352F] px-2 py-0.5 rounded-md border border-[#49352F]/15 font-mono"
                  >
                    {kp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="mt-6 pt-4 border-t border-[#49352F]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#49352F]/70 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#2E7D5E]" />
          <span>{no.ncReviewNoticeHint}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveAndCreate(false)}
            disabled={isSaving || !title.trim() || !originalText.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[#49352F] border border-[#49352F]/20 hover:bg-[#FAF6E9] transition-all cursor-pointer disabled:opacity-50"
          >
            {no.ncSaveDraftBtn}
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndCreate(true)}
            disabled={isSaving || !title.trim() || !originalText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#49352F] hover:bg-[#49352F]/90 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{no.ncProcessingTranslationsBtn}</span>
              </>
            ) : (
              <>
                <span>{no.ncApproveBridgeBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
