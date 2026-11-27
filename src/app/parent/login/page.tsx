"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ArrowLeft,
  Smartphone,
  KeyRound,
  RotateCcw,
  Phone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function ParentLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tr } = useLanguage();
  const pp = t.parentPortal;
  const { loginWithSessionUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Method toggle: "password" vs "otp"
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

  // Real SMS OTP states for parent
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [smsProviderConfigured, setSmsProviderConfigured] = useState<boolean | null>(null);
  const [smsProviderName, setSmsProviderName] = useState<string>("Twilio Verify / MSG91");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const demoParam = searchParams.get("demo");
    if (demoParam === "true") {
      setEmail("dinesh.patel@example.com");
      setPassword("DemoParent2026!");
    }
    if (errorParam === "session_expired") {
      setError(pp.loginSessionExpired);
    } else if (errorParam === "parent_required") {
      setError(pp.loginParentRequired);
    }

    // Check server SMS OTP provider configuration
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.smsProviderConfigured === "boolean") {
          setSmsProviderConfigured(data.smsProviderConfigured);
          if (data.smsProviderName) {
            setSmsProviderName(data.smsProviderName);
          }
        }
      })
      .catch(() => {});
  }, [searchParams, pp]);

  // Real SMS OTP resend countdown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleSendParentOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPhone = otpPhone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 10) {
      setError(pp.loginInvalidPhone);
      return;
    }

    setOtpSending(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, role: "parent" }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429) {
          throw new Error(
            data.error ||
              pp.loginRateLimit
          );
        }
        throw new Error(data.error || "Failed to send SMS OTP.");
      }

      setOtpStep("code");
      setOtpCooldown(60);
      setSuccessMsg(tr("parentPortal.loginOtpSentSuccess", { phone: data.maskedPhone || cleanPhone }));
    } catch (err: any) {
      setError(err.message || pp.loginOtpSendFailed);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyParentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError(pp.loginOtpInvalidLen);
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: otpPhone.trim(),
          code: cleanCode,
          role: "parent",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || pp.loginOtpInvalidFallback);
      }

      if (data.user) {
        loginWithSessionUser(data.user);
      }

      setSuccessMsg(pp.loginOtpSignInSuccess);

      const redirectPath = searchParams.get("redirect") || "/parent/dashboard";
      setTimeout(() => {
        router.push(redirectPath);
      }, 700);
    } catch (err: any) {
      setError(err.message || pp.loginOtpVerifyFailed);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes("@")) {
      setError(pp.registerErrEmail);
      return;
    }

    if (!password) {
      setError(pp.loginMissingPassword);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: "parent",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || pp.loginCheckCredsFallback);
      }

      setSuccessMsg(pp.loginSignInSuccess);

      const redirectPath = searchParams.get("redirect") || "/parent/dashboard";
      setTimeout(() => {
        router.push(redirectPath);
      }, 700);
    } catch (err: any) {
      setError(err.message || pp.loginSignInFailFallback);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoParentLogin = () => {
    setEmail("dinesh.patel@example.com");
    setPassword("DemoParent2026!");
    setError(null);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google?role=parent";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/40 text-[#49352F] flex flex-col justify-between selection:bg-[#F2CAB3] selection:text-[#49352F]">
      {/* Top Header Navbar */}
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

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-[#49352F]/15 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_16px_44px_rgba(73,53,47,0.08)] space-y-5 text-[#49352F]">
            {/* Top Tabs */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-1 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12">
                <button
                  type="button"
                  className="px-5 py-1.5 rounded-xl text-xs font-bold bg-[#261B16] text-[#FAF6E9] shadow-xs cursor-pointer"
                >
                  {pp.parentLoginTab}
                </button>
                <Link
                  href="/parent/register"
                  className="px-5 py-1.5 rounded-xl text-xs font-bold text-[#7A6862] hover:text-[#49352F] transition-all cursor-pointer"
                >
                  {pp.createAccountTab}
                </Link>
              </div>

              <h2 className="font-heading text-2xl font-black text-[#49352F] tracking-tight">
                {pp.loginTitle}
              </h2>
              <p className="text-xs text-[#7A6862]">
                {pp.loginSubtitle}
              </p>
            </div>

            {/* Error & Success Alerts */}
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

            {/* 1-Click Demo Parent Quick Access Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF6E9] to-[#F2CAB3]/40 border border-[#49352F]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#49352F] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B26A1B]" />
                  <span>{pp.demoAccessBadgeTitle}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/30">
                  {pp.demoNoSignUp}
                </span>
              </div>
              <p className="text-[11px] text-[#7A6862] leading-relaxed">
                {pp.demoAccessDesc}
              </p>
              <button
                type="button"
                onClick={handleDemoParentLogin}
                className="w-full py-2 px-3 rounded-xl bg-white border border-[#49352F]/20 text-xs font-bold text-[#49352F] hover:bg-[#FAF6E9] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Users className="w-3.5 h-3.5 text-[#B26A1B]" />
                <span>{pp.demoParentAccountLabel}</span>
              </button>
            </div>

            {/* Method Switcher: Password vs Real Mobile SMS OTP */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 gap-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("password");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMethod === "password"
                    ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{pp.methodEmailPassword}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("otp");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMethod === "otp"
                    ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#B26A1B]" />
                <span>{pp.methodMobileOtp}</span>
              </button>
            </div>

            {/* Sub-flow A: Password Form */}
            {loginMethod === "password" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#49352F] block">
                    {pp.emailLabel}
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#49352F] block">
                      {pp.passwordLabel}
                    </label>
                    <Link
                      href="/parent/forgot-password"
                      className="text-[11px] font-semibold text-[#B26A1B] hover:underline"
                    >
                      {pp.forgotPasswordLink}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6862] hover:text-[#49352F] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#7A6862]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#49352F]/20 text-[#B26A1B] focus:ring-[#B26A1B]/30"
                    />
                    <span>{pp.rememberMeLabel}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#F2CAB3] to-[#F2DCB5] hover:brightness-95 active:scale-[0.99] text-[#49352F] border border-[#49352F]/20 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-[#B26A1B]" />
                      <span>{pp.signingInBtn}</span>
                    </span>
                  ) : (
                    <>
                      <span>{pp.signInDashboardBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Sub-flow B: Real SMS OTP Form */}
            {loginMethod === "otp" && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[#49352F]">
                      <Phone className="w-3.5 h-3.5 text-[#B26A1B]" />
                      <span>{pp.smsAuthTitle}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/30">
                      {smsProviderConfigured ? (smsProviderName || "Twilio / MSG91") : pp.smsCarrierGatewayFallback}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A6862] leading-relaxed">
                    {pp.smsAuthDesc}
                  </p>
                </div>

                {otpStep === "phone" ? (
                  <form onSubmit={handleSendParentOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#49352F] mb-1">
                        {pp.mobilePhoneLabel}
                      </label>
                      <div className="relative flex rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 overflow-hidden focus-within:border-[#B26A1B] focus-within:bg-white transition-all">
                        <span className="inline-flex items-center px-3 text-xs font-bold text-[#7A6862] bg-[#49352F]/5 border-r border-[#49352F]/15">
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                          placeholder={pp.mobilePhonePlaceholder}
                          className="w-full py-2.5 px-3 text-xs text-[#49352F] placeholder-[#7A6862] outline-hidden bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Pre-fill Demo Parent Shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        setOtpPhone("9825012345");
                        setError(null);
                      }}
                      className="w-full text-left p-2 rounded-xl border border-[#49352F]/15 bg-white/70 text-[11px] hover:border-[#B26A1B] text-[#7A6862] transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-[#B26A1B]" />
                        <span>{pp.demoSmsAccountLabel}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#B26A1B] font-bold">+91 98250 12345</span>
                    </button>

                    <button
                      type="submit"
                      disabled={otpSending || otpPhone.replace(/\D/g, "").length < 10}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#F2CAB3] to-[#F2DCB5] hover:brightness-95 active:scale-[0.99] text-[#49352F] border border-[#49352F]/20 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {otpSending ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-spin text-[#B26A1B]" />
                          <span>{pp.sendingOtpBtn}</span>
                        </span>
                      ) : (
                        <>
                          <span>{pp.sendOtpBtn}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyParentOtp} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#49352F]">
                          {pp.smsOtpCodeLabel}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep("phone");
                            setOtpCode("");
                            setError(null);
                          }}
                          className="text-[11px] text-[#B26A1B] hover:underline cursor-pointer"
                        >
                          {pp.changeNumberBtn}
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                          placeholder={pp.otpPlaceholder}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs tracking-widest font-mono font-bold text-[#49352F] placeholder-[#7A6862] focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7A6862]">
                        {otpCooldown > 0 ? (
                          tr("parentPortal.resendCooldownText", { seconds: otpCooldown })
                        ) : (
                          pp.didNotReceiveSms
                        )}
                      </span>
                      {otpCooldown === 0 && (
                        <button
                          type="button"
                          onClick={() => handleSendParentOtp()}
                          disabled={otpSending}
                          className="text-[#B26A1B] font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{pp.resendSmsBtn}</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={otpVerifying || otpCode.trim().length !== 6}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#F2CAB3] to-[#F2DCB5] hover:brightness-95 active:scale-[0.99] text-[#49352F] border border-[#49352F]/20 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {otpVerifying ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-spin text-[#B26A1B]" />
                          <span>{pp.verifyingOtpBtn}</span>
                        </span>
                      ) : (
                        <>
                          <span>{pp.verifyAndSignInBtn}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Subtle Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#49352F]/15" />
              </div>
              <span className="relative bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-[#7A6862]">
                {pp.orContinueWith}
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white hover:bg-[#FAF6E9] active:scale-[0.99] text-[#49352F] border border-[#49352F]/20 shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{pp.continueWithGoogle}</span>
            </button>

            {/* Switch to Teacher Login */}
            <div className="pt-2 border-t border-[#49352F]/10 text-center space-y-2">
              <p className="text-xs text-[#7A6862]">
                {pp.teacherStaffPrompt}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B26A1B] hover:text-[#49352F] transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{pp.goToTeacherPortal}</span>
              </Link>
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


function ParentLoginFallback() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#FAF6E9] flex items-center justify-center">
      <div className="p-6 rounded-2xl bg-white shadow-md text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#B26A1B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-[#49352F]">{t.parentPortal.loadingParentLogin}</p>
      </div>
    </div>
  );
}

export default function ParentLoginPage() {
  return (
    <Suspense fallback={<ParentLoginFallback />}>
      <ParentLoginContent />
    </Suspense>
  );
}
