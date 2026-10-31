"use client";

import React, { useState } from "react";
import {
  Languages,
  CheckCircle2,
  Copy,
  Check,
  Flag,
  RotateCcw,
  Volume2,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AudioPlayer } from "../audio/AudioPlayer";
import type { SchoolNotice, NoticeTranslation, SupportedLanguage } from "@/lib/types";

interface NoticeTranslationPanelProps {
  notice: SchoolNotice;
  translations: NoticeTranslation[];
  onTranslationUpdated?: (translation: NoticeTranslation) => void;
  className?: string;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; scriptName: string }> = {
  en: { label: "English", scriptName: "English" },
  gu: { label: "Gujarati", scriptName: "ગુજરાતી" },
  hi: { label: "Hindi", scriptName: "हिंदी" },
  mr: { label: "Marathi", scriptName: "मराठी" },
  ta: { label: "Tamil", scriptName: "தமிழ்" },
  te: { label: "Telugu", scriptName: "తెలుగు" },
  bn: { label: "Bengali", scriptName: "বাংলা" },
  kn: { label: "Kannada", scriptName: "ಕನ್ನಡ" },
};

export function NoticeTranslationPanel({
  notice,
  translations,
  onTranslationUpdated,
  className = "",
}: NoticeTranslationPanelProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("gu");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeTranslation = translations.find((t) => t.language === selectedLang);
  const contentToDisplay = activeTranslation?.translatedContent || "";

  const handleCopy = () => {
    if (!contentToDisplay) return;
    navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTranslateLanguage = async (lang: SupportedLanguage) => {
    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch(`/api/notices/${notice.id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Translation failed.");
      }

      if (onTranslationUpdated) {
        onTranslationUpdated(data.data);
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      setError(err.message || "Failed to generate translation.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch(`/api/notices/${notice.id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: selectedLang,
          customTranslation: editText.trim(),
          isApproved: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save edited translation.");
      }

      setIsEditing(false);
      if (onTranslationUpdated) {
        onTranslationUpdated(data.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save translation edit.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleApprove = async () => {
    if (!activeTranslation) return;
    const newStatus = !activeTranslation.isApprovedByTeacher;

    try {
      const res = await fetch(`/api/notices/${notice.id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: selectedLang,
          customTranslation: activeTranslation.translatedContent,
          isApproved: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && onTranslationUpdated) {
        onTranslationUpdated(data.data);
      }
    } catch (e) {
      console.error("Approve toggle failed:", e);
    }
  };

  const handleFlagTranslation = async () => {
    if (!flagReason.trim()) return;

    try {
      const res = await fetch(`/api/notices/${notice.id}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage: selectedLang,
          customTranslation: activeTranslation?.translatedContent || "",
          flagged: true,
          flagReason: flagReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFlagModalOpen(false);
        setFlagReason("");
        if (onTranslationUpdated) {
          onTranslationUpdated(data.data);
        }
      }
    } catch (e) {
      console.error("Flag translation failed:", e);
    }
  };

  const languagesAvailable: SupportedLanguage[] = ["gu", "hi", "en"];

  return (
    <div className={`bg-white border border-[#49352F]/15 rounded-2xl p-6 shadow-sm ${className}`}>
      {/* Header with Title and Language Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#49352F]/10">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-[#2E7D5E]" />
            <h3 className="text-base font-bold text-[#49352F]">
              Multilingual Translations & Speech
            </h3>
          </div>
          <p className="text-xs text-[#49352F]/70">
            Real AI translations ensuring Indian regional scripts (Gujarati & Hindi) accurately preserve dates, names, and rules.
          </p>
        </div>

        {/* Language Tabs */}
        <div className="inline-flex rounded-xl border border-[#49352F]/15 p-1 bg-[#FAF6E9]">
          {languagesAvailable.map((lang) => {
            const hasTranslation = translations.some((t) => t.language === lang);
            const isApproved = translations.find((t) => t.language === lang)?.isApprovedByTeacher;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setSelectedLang(lang);
                  setIsEditing(false);
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLang === lang
                    ? "bg-[#49352F] text-white shadow-xs"
                    : "text-[#49352F]/80 hover:text-[#49352F] hover:bg-white/50"
                }`}
              >
                <span>{LANGUAGE_LABELS[lang]?.scriptName || lang.toUpperCase()}</span>
                {isApproved && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-current" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Translation Content Area */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Original / Simplified Reference */}
        <div className="p-4 bg-[#FAF6E9] rounded-xl border border-[#49352F]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#49352F] uppercase tracking-wider">
                Source Reference ({(notice.originalLanguage ?? "en").toUpperCase()})
              </span>
              <AudioPlayer
                text={notice.simplifiedContent || notice.originalContent}
                language={notice.originalLanguage ?? "en"}
                buttonLabel="Listen Original"
              />
            </div>

            <p className="text-sm text-[#49352F] leading-relaxed whitespace-pre-wrap font-sans">
              {notice.simplifiedContent || notice.originalContent}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex items-center justify-between text-[11px] text-[#49352F]/60">
            <span>Reading Level: {(notice.readingLevel || "simple").replace("_", " ")}</span>
            <span>Target: {notice.targetClassGrade ? `Grade ${notice.targetClassGrade}` : "All Classes"}</span>
          </div>
        </div>

        {/* Right Column: Translated Message */}
        <div className="p-4 bg-white rounded-xl border border-[#49352F]/20 flex flex-col justify-between shadow-xs">
          {activeTranslation ? (
            <div>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#49352F]/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#49352F]">
                    {LANGUAGE_LABELS[selectedLang]?.label} ({LANGUAGE_LABELS[selectedLang]?.scriptName})
                  </span>
                  {activeTranslation.isApprovedByTeacher ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Approved
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Pending Approval
                    </span>
                  )}
                </div>

                {/* Audio Listen Button */}
                <AudioPlayer
                  text={activeTranslation.translatedContent}
                  language={selectedLang}
                  buttonLabel="Listen"
                />
              </div>

              {/* Text / Edit Mode */}
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    rows={5}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border border-[#49352F]/20 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 rounded text-xs font-semibold text-[#49352F] hover:bg-[#FAF6E9]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-3 py-1 rounded text-xs font-bold bg-[#49352F] text-white hover:bg-[#49352F]/90 cursor-pointer"
                    >
                      Save & Approve
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#49352F] leading-relaxed whitespace-pre-wrap font-sans mt-1">
                  {activeTranslation.translatedContent}
                </p>
              )}

              {activeTranslation.flaggedAsIncorrect && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Flagged for review: </span>
                    <span>{activeTranslation.flagReason || "Flagged as inaccurate"}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Languages className="w-8 h-8 text-[#49352F]/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#49352F]">
                No {LANGUAGE_LABELS[selectedLang]?.label} translation generated yet.
              </p>
              <button
                type="button"
                onClick={() => handleTranslateLanguage(selectedLang)}
                disabled={isTranslating}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F2CAB3] hover:bg-[#F2CAB3]/80 text-[#49352F] border border-[#49352F]/15 cursor-pointer disabled:opacity-50"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#2E7D5E]" />
                    <span>Generate Translation ({LANGUAGE_LABELS[selectedLang]?.scriptName})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Row for Translated Message */}
          {activeTranslation && (
            <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#49352F] hover:bg-[#FAF6E9] border border-[#49352F]/15 cursor-pointer transition-colors"
                  title="Copy translated text"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditText(activeTranslation.translatedContent);
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#49352F] hover:bg-[#FAF6E9] border border-[#49352F]/15 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTranslateLanguage(selectedLang)}
                  disabled={isTranslating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#49352F] hover:bg-[#FAF6E9] border border-[#49352F]/15 cursor-pointer transition-colors"
                  title="Re-translate with AI"
                >
                  <RotateCcw className={`w-3 h-3 ${isTranslating ? "animate-spin" : ""}`} />
                  <span>Re-translate</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFlagModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-900 hover:bg-amber-50 border border-amber-200 cursor-pointer transition-colors"
                  title="Flag inaccurate translation"
                >
                  <Flag className="w-3 h-3 text-amber-700" />
                  <span>Flag</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleApprove}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeTranslation.isApprovedByTeacher
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                      : "bg-[#FAF6E9] hover:bg-[#F2CAB3]/50 text-[#49352F] border border-[#49352F]/20"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeTranslation.isApprovedByTeacher ? "Approved" : "Approve Translation"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flag Modal */}
      {flagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl border border-[#49352F]/20">
            <h4 className="text-sm font-bold text-[#49352F] flex items-center gap-2 mb-2">
              <Flag className="w-4 h-4 text-amber-600" />
              Flag Incorrect Translation
            </h4>
            <p className="text-xs text-[#49352F]/70 mb-3">
              Help improve AI accuracy by specifying what was translated incorrectly (e.g. grammar, date distortion, or mistranslated school term).
            </p>
            <textarea
              rows={3}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="e.g. 'Science Fair' was translated confusingly or the date was distorted..."
              className="w-full p-2.5 text-xs rounded-lg border border-[#49352F]/20 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFlagModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#49352F] hover:bg-[#FAF6E9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFlagTranslation}
                disabled={!flagReason.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50 cursor-pointer"
              >
                Submit Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
