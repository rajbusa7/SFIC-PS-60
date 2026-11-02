"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import {
  Send,
  Home,
  Clock,
  Sparkles,
  CheckCircle2,
  Edit3,
  Globe,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { generateParentHomeActivity } from "@/lib/engine/roleAwareGapEngine";
import type { ParentHomeActivity } from "@shared/types";

interface SendHomePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gap: {
    id: string;
    studentId: string;
    studentName?: string;
    conceptId: string;
    conceptName?: string;
    subjectCode?: string;
  };
  onSuccess?: (parentName?: string) => void;
}

export function SendHomePracticeModal({
  isOpen,
  onClose,
  gap,
  onSuccess,
}: SendHomePracticeModalProps) {
  const { language } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "gu" | "hi">("en");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initial generated activity
  const [activity, setActivity] = useState<ParentHomeActivity>(() =>
    generateParentHomeActivity(gap, selectedLanguage)
  );

  const [customTeacherNote, setCustomTeacherNote] = useState<string>(
    "Aarav is doing great in class. This 5-minute activity will reinforce their confidence!"
  );

  // When changing language, update active language preview
  const handleLanguageChange = (lang: "en" | "gu" | "hi") => {
    setSelectedLanguage(lang);
    const updated = generateParentHomeActivity(gap, lang);
    setActivity(updated);
  };

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/learning-gaps/send-home-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: gap.studentId,
          gapId: gap.id,
          activity,
          customNotes: customTeacherNote,
          language: selectedLanguage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          language === "gu"
            ? `ઘર-મહાવરો ${data.parentName || "વાલી"} ને સફળતાપૂર્વક મોકલવામાં આવ્યો છે!`
            : `Home practice successfully sent to ${data.parentName || "Parent Bridge"}!`
        );
        setTimeout(() => {
          if (onSuccess) onSuccess(data.parentName);
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Failed to dispatch home practice.");
      }
    } catch (e: any) {
      setError(e.message || "Network error sending home practice.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === "gu"
          ? "વાલી સેતુ: ઘર-મહાવરો મોકલો"
          : "Parent Bridge: Send Home Practice"
      }
      maxWidth="lg"
    >
      <div className="space-y-4 text-[#49352F]">
        {/* Header summary banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF6E9] via-white to-[#F2CAB3]/40 border border-[#49352F]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-[#B26A1B]" />
              <h4 className="font-heading font-bold text-sm text-[#49352F]">
                {gap.studentName || "Student"} • {gap.conceptName}
              </h4>
            </div>
            <p className="text-xs text-[#7A6862] mt-0.5">
              Teacher Review & Approval Required • 5–10 min household activity
            </p>
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1 bg-[#FAF6E9] p-1 rounded-full border border-[#49352F]/15">
            <Globe className="w-3.5 h-3.5 ml-1.5 text-[#7A6862]" />
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                selectedLanguage === "en"
                  ? "bg-[#B26A1B] text-white shadow-xs"
                  : "text-[#7A6862] hover:text-[#49352F]"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("gu")}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                selectedLanguage === "gu"
                  ? "bg-[#B26A1B] text-white shadow-xs"
                  : "text-[#7A6862] hover:text-[#49352F]"
              }`}
            >
              ગુજરાતી
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("hi")}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                selectedLanguage === "hi"
                  ? "bg-[#B26A1B] text-white shadow-xs"
                  : "text-[#7A6862] hover:text-[#49352F]"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Teacher Approval & Edit Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[#7A6862] flex items-center gap-1 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#2E7D5E]" />
            <span>Teacher preview and approval mode</span>
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="font-bold text-[#B26A1B] hover:text-[#8D4E10] flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? "Lock / Preview" : "Edit Activity"}</span>
          </button>
        </div>

        {/* Activity Card Form */}
        <div className="p-4 rounded-2xl bg-white border border-[#49352F]/12 space-y-3 shadow-xs">
          {/* Title & Duration */}
          <div className="flex items-center justify-between gap-2 border-b border-[#49352F]/10 pb-2">
            {isEditing ? (
              <input
                type="text"
                value={activity.title}
                onChange={(e) => setActivity({ ...activity, title: e.target.value })}
                className="w-full text-sm font-bold border rounded-lg p-1.5 border-[#49352F]/20 text-[#49352F]"
              />
            ) : (
              <span className="font-heading font-extrabold text-sm text-[#49352F]">
                {activity.title}
              </span>
            )}
            <Badge variant="mint" size="sm" dot>
              <Clock className="w-3 h-3 mr-1" />
              {activity.durationMinutes} minutes
            </Badge>
          </div>

          {/* Common Household Materials */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6862] block">
              Common Household Materials:
            </span>
            {isEditing ? (
              <input
                type="text"
                value={activity.commonHouseholdMaterials.join(", ")}
                onChange={(e) =>
                  setActivity({
                    ...activity,
                    commonHouseholdMaterials: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                className="w-full text-xs border rounded-lg p-1.5 border-[#49352F]/20 text-[#49352F]"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activity.commonHouseholdMaterials.map((mat, mIdx) => (
                  <span
                    key={mIdx}
                    className="px-2 py-0.5 rounded-md bg-[#FAF6E9] border border-[#49352F]/10 text-xs font-medium text-[#49352F]"
                  >
                    🛠️ {mat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* What Parent Does */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B26A1B] block">
              What Parent Does (Simple Instructions):
            </span>
            {isEditing ? (
              <textarea
                rows={3}
                value={activity.whatParentDoes}
                onChange={(e) => setActivity({ ...activity, whatParentDoes: e.target.value })}
                className="w-full text-xs border rounded-lg p-2 border-[#49352F]/20 text-[#49352F]"
              />
            ) : (
              <p className="text-xs text-[#49352F] leading-relaxed bg-[#FAF6E9]/40 p-2.5 rounded-xl border border-[#49352F]/8">
                {activity.whatParentDoes}
              </p>
            )}
          </div>

          {/* What Child Practices */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D5E] block">
              What Child Practices:
            </span>
            {isEditing ? (
              <textarea
                rows={2}
                value={activity.whatChildPractices}
                onChange={(e) => setActivity({ ...activity, whatChildPractices: e.target.value })}
                className="w-full text-xs border rounded-lg p-2 border-[#49352F]/20 text-[#49352F]"
              />
            ) : (
              <p className="text-xs text-[#49352F] leading-relaxed bg-[#EAF4EE]/40 p-2.5 rounded-xl border border-[#2E7D5E]/15">
                {activity.whatChildPractices}
              </p>
            )}
          </div>

          {/* Conversational Prompt */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#49352F] block">
              Parent Prompt / Question:
            </span>
            {isEditing ? (
              <input
                type="text"
                value={activity.conversationalPrompt}
                onChange={(e) => setActivity({ ...activity, conversationalPrompt: e.target.value })}
                className="w-full text-xs border rounded-lg p-2 border-[#49352F]/20 text-[#49352F]"
              />
            ) : (
              <p className="text-xs italic text-[#8D4E10] font-medium bg-[#F2CAB3]/30 p-2.5 rounded-xl border border-[#B26A1B]/15">
                🗣️ {activity.conversationalPrompt}
              </p>
            )}
          </div>

          {/* Custom Teacher Note to Parent */}
          <div className="space-y-1 pt-1 border-t border-[#49352F]/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6862] flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#B26A1B]" />
              <span>Optional Teacher Note to Parent:</span>
            </span>
            <input
              type="text"
              value={customTeacherNote}
              onChange={(e) => setCustomTeacherNote(e.target.value)}
              placeholder="e.g. Aarav did very well today; 5 minutes at home will help solidify this!"
              className="w-full text-xs border rounded-lg p-2 border-[#49352F]/20 text-[#49352F] bg-[#FAF6E9]/40 outline-hidden focus:border-[#B26A1B]"
            />
          </div>
        </div>

        {/* Feedback / Error message */}
        {error && (
          <div className="p-2.5 rounded-xl bg-[#FBECE9] border border-[#C54738]/30 text-[#A93327] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-[#EAF4EE] border border-[#2E7D5E]/30 text-[#215A43] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>

          <Button
            variant="saffron"
            size="sm"
            onClick={handleSend}
            disabled={isSending}
            className="rounded-full text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            <span>
              {isSending ? "Approving & Sending..." : "Approve & Send to Parent Bridge"}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
