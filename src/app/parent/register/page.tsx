"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ArrowLeft,
  Info,
} from "lucide-react";

export default function ParentRegisterPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const pp = t.parentPortal;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [linkingCode, setLinkingCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError(pp.registerErrName);
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError(pp.registerErrEmail);
      return;
    }

    if (!password || password.length < 6) {
      setError(pp.registerErrPasswordLen);
      return;
    }

    if (password !== confirmPassword) {
      setError(pp.registerErrPasswordMatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          confirmPassword,
          linkingCode: linkingCode.trim() || undefined,
          preferredLanguage: language,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || pp.registerFailFallback);
      }

      if (data.linkingWarning) {
        setSuccessMsg(
          language === "gu"
            ? `એકાઉન્ટ સફળતાપૂર્વક બની ગયું છે. લૉગ ઇન કરવા માટે રીડાયરેક્ટ કરી રહ્યાં છીએ... (નોંધ: ${data.linkingWarning})`
            : `Account created successfully. Please log in to continue. (Note: ${data.linkingWarning})`
        );
      } else {
        setSuccessMsg(
          language === "gu"
            ? "એકાઉન્ટ સફળતાપૂર્વક બની ગયું છે. લૉગ ઇન કરવા માટે રીડાયરેક્ટ કરી રહ્યાં છીએ..."
            : "Account created successfully. Please log in to continue."
        );
      }

      setTimeout(() => {
        router.push(`/parent/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      }, data.linkingWarning ? 1800 : 900);
    } catch (err: any) {
      setError(err.message || pp.registerCreateFailFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/40 text-[#49352F] flex flex-col justify-between selection:bg-[#F2CAB3] selection:text-[#49352F]">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-5 sm:px-10 max-w-7xl w-full mx-auto backdrop-blur-xs">
        <Link href="/" className="cursor-pointer group flex items-center gap-3">
          <BrandLogo size={36} />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector variant="glass" />
          <ThemeToggle variant="glass" />
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#7A6862] hover:text-[#49352F] hover:bg-white/80 transition-all flex items-center gap-1 border border-[#49352F]/15 bg-white/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{pp.homeBtn}</span>
          </Link>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-[#49352F]/15 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_16px_44px_rgba(73,53,47,0.08)] space-y-5 text-[#49352F]">
            {/* Tabs */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-1 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12">
                <Link
                  href="/parent/login"
                  className="px-5 py-1.5 rounded-xl text-xs font-bold text-[#7A6862] hover:text-[#49352F] transition-all cursor-pointer"
                >
                  {pp.parentLoginTab}
                </Link>
                <button
                  type="button"
                  className="px-5 py-1.5 rounded-xl text-xs font-bold bg-[#261B16] text-[#FAF6E9] shadow-xs cursor-pointer"
                >
                  {pp.createAccountTab}
                </button>
              </div>

              <h2 className="font-heading text-2xl font-black text-[#49352F] tracking-tight">
                {pp.registerTitle}
              </h2>
              <p className="text-xs text-[#7A6862]">
                {pp.registerSubtitle}
              </p>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#49352F] block">
                  {pp.registerFullNameLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={pp.registerFullNamePlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#49352F] block">
                  {pp.emailRequiredLabel}
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#49352F] block">
                  {pp.phoneOptionalLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={pp.settingsPhonePlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#49352F] block">
                    {pp.passwordRequiredLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A6862] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={pp.passwordMinPlaceholder}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A6862] hover:text-[#49352F] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#49352F] block">
                    {pp.confirmRequiredLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A6862] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={pp.confirmPlaceholder}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Child Linking Code */}
              <div className="p-3 rounded-2xl bg-[#FAF6E9]/80 border border-[#49352F]/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#49352F] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#B26A1B]" />
                    <span>{pp.linkingCodeOptionalLabel}</span>
                  </label>
                  <span className="text-[10px] text-[#7A6862]">{pp.linkingCodeExample}</span>
                </div>
                <input
                  type="text"
                  value={linkingCode}
                  onChange={(e) => setLinkingCode(e.target.value.toUpperCase())}
                  placeholder={pp.linkingCodePlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white font-mono text-xs font-bold text-[#B26A1B] tracking-wider uppercase placeholder:normal-case placeholder:font-sans placeholder:text-[#7A6862]/50 focus:outline-none focus:border-[#B26A1B]"
                />
                <p className="text-[10px] text-[#7A6862] leading-tight">
                  {pp.linkingCodeHelpText}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#F2CAB3] to-[#F2DCB5] hover:brightness-95 active:scale-[0.99] text-[#49352F] border border-[#49352F]/20 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-[#B26A1B]" />
                    <span>{pp.creatingAccountBtn}</span>
                  </span>
                ) : (
                  <>
                    <span>{pp.registerBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Parent Login */}
            <div className="pt-2 border-t border-[#49352F]/10 text-center">
              <p className="text-xs text-[#7A6862]">
                {pp.alreadyHaveAccount}
                <Link href="/parent/login" className="font-bold text-[#B26A1B] hover:underline">
                  {pp.signInHereLink}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#7A6862]">
        <p>
          StudySaathi AI &bull; {pp.footerTitle} &bull; {pp.footerLocation}
        </p>
      </footer>
    </div>
  );
}
