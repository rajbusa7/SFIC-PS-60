"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  User,
  Sparkles,
  Calendar,
  BrainCircuit,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { SupportedLanguage } from "@/lib/types";

interface GmailSendReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  attendance?: any;
  results?: any[];
  learningGaps?: any[];
  remedialPlans?: any[];
  onSuccess?: (communication: any) => void;
}

type ReportType = "attendance" | "academic" | "learning_gap" | "remedial_plan" | "general";

export function GmailSendReportModal({
  isOpen,
  onClose,
  student,
  attendance,
  results = [],
  learningGaps = [],
  remedialPlans = [],
  onSuccess,
}: GmailSendReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [language, setLanguage] = useState<SupportedLanguage>("gu");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Derive parent information
  const studentName = student?.displayName || student?.name || "Student";
  const parentEmail =
    student?.parentEmail ||
    student?.parent?.email ||
    `${studentName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
  const parentName =
    student?.parentName ||
    student?.parent?.name ||
    `Parent of ${studentName}`;

  // Default subjects & titles based on type
  const getSubjectAndTitle = () => {
    switch (reportType) {
      case "attendance":
        return {
          title: `Attendance Report: ${studentName}`,
          subject: `Student Attendance Summary - ${studentName}`,
        };
      case "academic":
        return {
          title: `Academic Performance Report: ${studentName}`,
          subject: `Academic Progress & Unit Assessment Report - ${studentName}`,
        };
      case "learning_gap":
        return {
          title: `Learning Gap Notification: ${studentName}`,
          subject: `Targeted Pedagogical Support for ${studentName}`,
        };
      case "remedial_plan":
        return {
          title: `5-Step Remedial Plan: ${studentName}`,
          subject: `Home Action & Remedial Learning Framework - ${studentName}`,
        };
      case "general":
      default:
        return {
          title: `Important School Update regarding ${studentName}`,
          subject: `School Notice & Classroom Update - ${studentName}`,
        };
    }
  };

  const handleSend = async () => {
    try {
      setSending(true);
      setErrorMsg(null);
      setSuccessResult(null);

      const { title, subject } = getSubjectAndTitle();

      const payload: any = {
        studentId: student.id,
        type: reportType,
        title,
        subject,
        language,
        customMessage: customMessage.trim() || undefined,
      };

      if (reportType === "attendance" && attendance) {
        payload.attendanceDetails = attendance;
      }

      const res = await fetch("/api/v1/parent-bridge/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch email communication.");
      }

      setSuccessResult(data);
      onSuccess?.(data.communication);
    } catch (err: any) {
      console.error("Failed to send report via Gmail:", err);
      setErrorMsg(err.message || "Failed to deliver email.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const { title: currentTitle, subject: currentSubject } = getSubjectAndTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1E1916] rounded-3xl border border-[#49352F]/20 dark:border-[#F2CAB3]/20 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/10 flex items-center justify-between bg-[#FAF6E9]/60 dark:bg-[#26201C]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#49352F] text-[#FAF6E9] flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5 text-[#F2CAB3]" />
            </div>
            <div>
              <h3 className="font-heading text-base font-black text-[#49352F] dark:text-[#F4F1E1]">
                Send Student Report via Gmail
              </h3>
              <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/70">
                Official pedagogical communication delivered directly to parent inbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#49352F]/15 flex items-center justify-center text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Recipient Details Card */}
          <div className="p-4 rounded-2xl bg-[#FAF6E9]/70 dark:bg-[#26201C] border border-[#49352F]/10 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#B26A1B]" />
                <span className="font-bold text-[#49352F] dark:text-[#F4F1E1]">
                  Student: {studentName} (Class {student?.grade}-{student?.section})
                </span>
              </div>
              <Badge variant="outline" size="sm">
                Recipient: {parentName}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[#7A6862] dark:text-[#FAF6E9]/80 font-mono text-[11px]">
              <Mail className="w-3.5 h-3.5 text-[#B26A1B]" />
              <span>Target Gmail: <strong>{parentEmail}</strong></span>
            </div>
          </div>

          {/* Success Banner */}
          {successResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Email Dispatched Successfully</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Communication sent via <strong>{successResult.dispatchResult?.channel?.toUpperCase() || "GMAIL"}</strong> to <strong>{parentEmail}</strong>.
                {successResult.dispatchResult?.messageId && (
                  <span className="block font-mono text-[10px] mt-0.5 opacity-80">Message ID: {successResult.dispatchResult.messageId}</span>
                )}
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Report Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
              Select Report Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { type: "attendance" as ReportType, label: "Attendance Summary", icon: Calendar },
                { type: "academic" as ReportType, label: "Academic Progress", icon: TrendingUp },
                { type: "learning_gap" as ReportType, label: "Learning Gap Alert", icon: AlertCircle },
                { type: "remedial_plan" as ReportType, label: "5-Step Remedial Plan", icon: BrainCircuit },
                { type: "general" as ReportType, label: "General Update", icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = reportType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setReportType(item.type);
                      setSuccessResult(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-[#49352F] text-white border-[#49352F] shadow-xs"
                        : "bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] border-[#49352F]/15 hover:bg-[#FAF6E9]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-[#F2CAB3]" : "text-[#B26A1B]"}`} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
              Language for Parent Email
            </label>
            <div className="flex gap-2">
              {[
                { code: "gu" as SupportedLanguage, label: "ગુજરાતી (Gujarati)" },
                { code: "hi" as SupportedLanguage, label: "हिन्दी (Hindi)" },
                { code: "en" as SupportedLanguage, label: "English" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    language === lang.code
                      ? "bg-[#261B16] text-[#FAF6E9] border-[#261B16]"
                      : "bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] border-[#49352F]/15 hover:bg-[#FAF6E9]"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Custom Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] flex items-center justify-between">
              <span>Personalized Teacher Note (Optional)</span>
              <span className="text-[11px] text-[#7A6862] font-normal">Appears prominently in parent email</span>
            </label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Aarav has shown steady improvement in classroom participation this week..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/20 dark:border-[#F2CAB3]/20 bg-[#FAF6E9]/60 dark:bg-[#26201C] text-xs font-medium text-[#49352F] dark:text-[#F4F1E1] focus:outline-none focus:border-[#B26A1B]"
            />
          </div>

          {/* Live Preview Toggle & Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1]">Email Preview</span>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs font-semibold text-[#B26A1B] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{previewMode ? "Hide Preview" : "Show Responsive Preview"}</span>
              </button>
            </div>

            {previewMode && (
              <div className="p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#1A1412] border border-[#49352F]/20 text-xs space-y-3 font-sans">
                <div className="pb-2 border-b border-[#49352F]/10 text-[11px] text-[#7A6862] space-y-0.5">
                  <p><strong>To:</strong> {parentName} &lt;{parentEmail}&gt;</p>
                  <p><strong>Subject:</strong> {currentSubject}</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#221B17] border border-[#49352F]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#49352F] dark:text-[#F4F1E1]">{studentName}</span>
                    <Badge variant="outline" size="sm">{reportType.toUpperCase()}</Badge>
                  </div>
                  <h4 className="text-xs font-extrabold text-[#49352F] dark:text-[#F4F1E1]">{currentTitle}</h4>
                  {customMessage ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 border border-amber-200 text-[11px]">
                      <strong>Teacher Remark:</strong> {customMessage}
                    </div>
                  ) : null}
                  <p className="text-[11px] text-[#7A6862]">
                    [Official responsive HTML template with StudySaathi AI peach-and-cream design language, action buttons to the Parent Bridge, and zero emojis will be delivered.]
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/10 flex items-center justify-between bg-[#FAF6E9]/40 dark:bg-[#26201C]/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            Close
          </Button>
          <button
            type="button"
            disabled={sending}
            onClick={handleSend}
            className="px-5 py-2.5 rounded-xl bg-[#49352F] hover:bg-[#3D2C27] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-[#F2CAB3]" />
            <span>{sending ? "Dispatching via Gmail..." : "Dispatch to Parent Gmail"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

