"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import {
  Mail,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

export default function ParentForgotPasswordPage() {
  const { t, tr } = useLanguage();
  const pp = t.parentPortal;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/40 text-[#49352F] flex flex-col justify-between selection:bg-[#F2CAB3] selection:text-[#49352F]">
      <header className="relative z-20 flex items-center justify-between p-5 sm:px-10 max-w-7xl w-full mx-auto backdrop-blur-xs">
        <Link href="/" className="cursor-pointer group flex items-center gap-3">
          <BrandLogo size={36} />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector variant="glass" />
          <ThemeToggle variant="glass" />
          <Link
            href="/parent/login"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#7A6862] hover:text-[#49352F] hover:bg-white/80 transition-all flex items-center gap-1 border border-[#49352F]/15 bg-white/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{pp.backToLogin}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-[#49352F]/15 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_16px_44px_rgba(73,53,47,0.08)] space-y-5 text-[#49352F]">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 mx-auto flex items-center justify-center text-[#B26A1B]">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-2xl font-black text-[#49352F] tracking-tight">
                {pp.forgotTitle}
              </h2>
              <p className="text-xs text-[#7A6862]">
                {pp.forgotSubtitle}
              </p>
            </div>

            {submitted ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pp.forgotSentHeading}</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {tr("parentPortal.forgotSentBody", { email })}
                </p>
                <div className="p-3 rounded-xl bg-white/80 border border-emerald-500/20 text-[11px] text-[#7A6862] space-y-1">
                  <span className="font-bold text-[#49352F] block">
                    {pp.forgotAdminHelpTitle}
                  </span>
                  <span>
                    {pp.forgotAdminHelpBody}
                  </span>
                </div>
                <Link
                  href="/parent/login"
                  className="w-full py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-800 transition-colors"
                >
                  <span>{pp.returnToParentLogin}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#49352F] block">
                    {pp.registeredEmailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={pp.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#F2CAB3] to-[#F2DCB5] hover:brightness-95 active:scale-[0.99] text-[#49352F] border border-[#49352F]/20 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-[#B26A1B]" />
                      <span>{pp.dispatchingBtn}</span>
                    </span>
                  ) : (
                    <>
                      <span>{pp.sendResetLinkBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-[#49352F]/10 text-center">
              <Link href="/parent/login" className="text-xs font-bold text-[#B26A1B] hover:underline">
                {pp.backToSignIn}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-[#7A6862]">
        <p>
          StudySaathi AI &bull; {pp.footerTitle} &bull; {pp.footerLocation}
        </p>
      </footer>
    </div>
  );
}
