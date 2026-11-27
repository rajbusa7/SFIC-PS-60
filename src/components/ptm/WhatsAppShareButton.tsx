"use client";

import React from "react";
import { MessageSquareShare } from "lucide-react";
import { buildPtmWhatsAppMessage, buildWhatsAppShareUrl } from "@/lib/notifications/ptmMessageTemplates";
import { useLanguage } from "@/context/LanguageContext";

export interface WhatsAppShareButtonProps {
  meeting: {
    id: string;
    title: string;
    startTime: string;
    durationMin: number;
    teacherName?: string;
  };
  studentName?: string;
  joinUrl?: string;
  parentPhone?: string;
  schoolName?: string;
  className?: string;
  variant?: "button" | "icon" | "outline";
}

export function WhatsAppShareButton({
  meeting,
  studentName,
  joinUrl,
  parentPhone,
  schoolName,
  className = "",
  variant = "button",
}: WhatsAppShareButtonProps) {
  const { language } = useLanguage();

  const handleShare = () => {
    const text = buildPtmWhatsAppMessage(
      {
        meetingTitle: meeting.title,
        teacherName: meeting.teacherName || "Teacher",
        startTime: meeting.startTime,
        durationMin: meeting.durationMin,
        studentName,
        joinUrl,
        schoolName,
      },
      language as "en" | "gu"
    );

    const shareUrl = buildWhatsAppShareUrl(parentPhone, text);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const label = language === "gu" ? "WhatsApp પર મોકલો" : "Share on WhatsApp";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`p-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] transition-colors cursor-pointer border border-[#25D366]/20 ${className}`}
        title={label}
        aria-label={label}
      >
        <MessageSquareShare className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
        variant === "outline"
          ? "border-[#25D366]/40 hover:border-[#25D366] bg-[#25D366]/5 hover:bg-[#25D366]/15 text-[#075E54] dark:text-[#25D366]"
          : "bg-[#25D366] hover:bg-[#1EBE5D] text-white border-transparent"
      } ${className}`}
      title={label}
    >
      <MessageSquareShare className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
