"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  KeyRound,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Building,
  GraduationCap,
  Info,
  Sparkles,
} from "lucide-react";

export interface LinkedChildSummary {
  id: string;
  displayName: string;
  studentCode: string;
  grade: number;
  section: string;
  schoolName?: string;
}

interface LinkChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  codeValue: string;
  onCodeChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  errorCode?: string | null;
  successMessage: string | null;
  linkedChild: LinkedChildSummary | null;
  alreadyLinked?: boolean;
  onViewLinkedChild?: () => void;
  formatClass: (grade?: number, section?: string) => string;
}

export function LinkChildModal({
  isOpen,
  onClose,
  language,
  codeValue,
  onCodeChange,
  onSubmit,
  loading,
  error,
  errorCode,
  successMessage,
  linkedChild,
  alreadyLinked = false,
  onViewLinkedChild,
  formatClass,
}: LinkChildModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (!linkedChild) {
        inputRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, linkedChild, onClose]);

  if (!isOpen) return null;

  const isExpiredOrUsed = errorCode === "EXPIRED_CODE" || errorCode === "USED_CODE" || errorCode === "REVOKED_CODE";
  const isAlreadyLinked = errorCode === "ALREADY_LINKED";

  return (
    <div
      className="fixed inset-0 z-50 bg-[#49352F]/45 backdrop-blur-xs flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-child-dialog-title"
        aria-describedby="link-child-dialog-desc"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#49352F]/15 space-y-4 text-[#49352F]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#49352F]/10 pb-3">
          <h3
            id="link-child-dialog-title"
            className="text-base font-black text-[#49352F] flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-xl bg-[#FAF6E9] border border-[#B26A1B]/25 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-[#B26A1B]" aria-hidden="true" />
            </span>
            <span>{language === "gu" ? "તમારા બાળકને જોડો" : "Link Your Child"}</span>
          </h3>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label={language === "gu" ? "વિન્ડો બંધ કરો" : "Close link child dialog"}
            className="p-1.5 rounded-xl text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p id="link-child-dialog-desc" className="text-xs text-[#7A6862] leading-relaxed">
          {language === "gu"
            ? "તમારા બાળકના વર્ગ શિક્ષક અથવા શાળાના એડમિનિસ્ટ્રેટર દ્વારા આપવામાં આવેલ સુરક્ષિત ચકાસણી કોડ દાખલ કરો."
            : "Enter the single-use verification code provided by your child's class teacher or school administrator."}
        </p>

        {/* Where to get a code guidance */}
        {!linkedChild && (
          <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 text-[11px] text-[#49352F] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#B26A1B] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold">
                {language === "gu" ? "ચકાસણી કોડ ક્યાંથી મળશે?" : "Where do I get a verification code?"}
              </p>
              <p className="text-[#7A6862]">
                {language === "gu"
                  ? "શિક્ષક StudySaathi માં વિદ્યાર્થીની પ્રોફાઇલ ખોલીને \"Parent Link Code\" માંથી નવો કોડ (દા.ત. PAR-4892) જનરેટ કરી શકે છે."
                  : "Ask your child's teacher to open your child's Student Profile in StudySaathi and click \"Parent Link Code\" → \"+ Generate Code\" (e.g. PAR-4892)."}
              </p>
            </div>
          </div>
        )}

        {/* Linked Child Confirmation Profile Card */}
        {linkedChild ? (
          <div className="space-y-4">
            <div
              role="status"
              className={`p-4 rounded-2xl border space-y-3 ${
                alreadyLinked
                  ? "bg-amber-50/80 border-amber-200 text-amber-950"
                  : "bg-emerald-50 border-emerald-200 text-emerald-950"
              }`}
            >
              <div
                className={`flex items-start gap-2 text-xs font-bold ${
                  alreadyLinked ? "text-amber-900" : "text-emerald-800"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    alreadyLinked ? "text-amber-600" : "text-emerald-600"
                  }`}
                />
                <div className="space-y-0.5">
                  <span>{successMessage || "Child linked successfully!"}</span>
                  {alreadyLinked && (
                    <p className="text-[11px] font-medium text-amber-800/90">
                      {language === "gu"
                        ? "તમારે નવા કોડની જરૂર નથી. નીચે તમારા બાળકની પ્રોફાઇલ ઉપલબ્ધ છે."
                        : "No new code is needed — their linked profile is already active on your dashboard."}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F2DCB5] to-[#F2CAB3] border border-[#49352F]/15 flex items-center justify-center font-black text-base text-[#49352F] shrink-0">
                    {linkedChild.displayName?.charAt(0) || "S"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-[#49352F] truncate">
                      {linkedChild.displayName}
                    </h4>
                    <p className="text-[11px] text-[#7A6862] flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-[#B26A1B]" />
                        {formatClass(linkedChild.grade, linkedChild.section)}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono">{linkedChild.studentCode}</span>
                    </p>
                    {linkedChild.schoolName && (
                      <p className="text-[10px] text-[#7A6862] flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3" />
                        <span>{linkedChild.schoolName}</span>
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="mastered" size="sm">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {alreadyLinked ? "Linked" : "Verified"}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={onViewLinkedChild || onClose}
                className="w-full sm:w-auto rounded-xl text-xs font-bold bg-[#261B16] text-[#FAF6E9] hover:bg-[#49352F]"
              >
                {language === "gu" ? "બાળકનું ડેશબોર્ડ જુઓ" : "View Child's Dashboard"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="parent-link-code-input" className="text-xs font-bold text-[#49352F] block">
                {language === "gu" ? "શાળા ચકાસણી કોડ" : "School Verification Code"}
              </label>
              <input
                ref={inputRef}
                id="parent-link-code-input"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                maxLength={32}
                disabled={loading}
                value={codeValue}
                onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
                placeholder="PAR-XXXX"
                className="w-full text-center px-4 py-3 rounded-2xl border-2 border-[#B26A1B] bg-[#FAF6E9]/40 font-mono text-base font-bold text-[#B26A1B] uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:text-xs placeholder:text-[#7A6862]/60 focus:outline-none focus:ring-4 focus:ring-[#B26A1B]/20 disabled:opacity-60"
              />
            </div>

            {error && (
              <div
                role="alert"
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  isAlreadyLinked || isExpiredOrUsed
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                {isExpiredOrUsed ? (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${isAlreadyLinked ? "text-amber-600" : "text-rose-600"}`}
                    aria-hidden="true"
                  />
                )}
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onClose}
                className="rounded-xl text-xs"
              >
                {language === "gu" ? "રદ કરો" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={loading || !codeValue.trim()}
                className="rounded-xl text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === "gu" ? "ચકાસણી થઈ રહી છે..." : "Verifying..."}</span>
                  </span>
                ) : (
                  <span>{language === "gu" ? "ચકાસો અને જોડો" : "Verify & Link"}</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
