"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { TeacherAssignment, SubjectCode } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Info,
  X,
  ExternalLink,
  Users,
  Smartphone,
  KeyRound,
  RotateCcw,
  Phone,
} from "lucide-react";

const BridgeCanvas3D = dynamic(
  () => import("@/components/3d/BridgeCanvas3D").then((m) => m.BridgeCanvas3D),
  { ssr: false }
);

function LoginCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, registerTeacher, loginAsDemoTeacher, loginAsDemoAdmin, loginAsDemoParent, loginWithSessionUser, setSelectedSubject } = useAuth();
  const { t, tr, formatSubject, formatClass } = useLanguage();
  const lg = t.login;

  // Mode: "login" or "register"
  const initialMode = searchParams.get("mode") === "register" || searchParams.get("unregistered") === "true" ? "register" : "login";
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);

  // Login method: "password" or "otp"
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

  // Real SMS OTP states
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [smsProviderConfigured, setSmsProviderConfigured] = useState<boolean | null>(null);
  const [smsProviderName, setSmsProviderName] = useState<string>("Twilio Verify / MSG91");

  // Login form state
  const [email, setEmail] = useState(searchParams.get("email") || "teacher@studysaathi.edu.in");
  const [password, setPassword] = useState("DemoPass2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState(searchParams.get("name") || "");
  const [regEmail, setRegEmail] = useState(searchParams.get("email") || "");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regSchoolId, setRegSchoolId] = useState("sch-gn-01");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);


  // Subject selection modal states for teacher access control
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedModalSubject, setSelectedModalSubject] = useState<SubjectCode | null>(null);
  const [subjectModalError, setSubjectModalError] = useState<string | null>(null);

  const handleConfirmSubject = () => {
    if (!selectedModalSubject) {
      setSubjectModalError(lg.errSelectSubject);
      return;
    }
    setSelectedSubject(selectedModalSubject);
    setShowSubjectModal(false);
    router.push(`/dashboard?subject=${selectedModalSubject}`);
  };

  // Google OAuth flow state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ type: "info" | "warning" | "error"; message: string } | null>(null);

  // Check URL search parameters for OAuth callback messages
  useEffect(() => {
    const error = searchParams.get("error");
    const unregistered = searchParams.get("unregistered");
    const existing = searchParams.get("existing");

    if (unregistered === "true") {
      setAuthMode("register");
      const unregEmail = searchParams.get("email");
      const unregName = searchParams.get("name");
      if (unregEmail) setRegEmail(unregEmail);
      if (unregName) setRegName(unregName);
      setBannerNotice({
        type: "warning",
        message: lg.oauthUnregistered,
      });
    } else if (existing === "true") {
      setAuthMode("login");
      const existEmail = searchParams.get("email");
      if (existEmail) setEmail(existEmail);
      setBannerNotice({
        type: "info",
        message: lg.oauthExisting,
      });
    } else if (error === "google_cancelled") {
      setBannerNotice({
        type: "info",
        message: lg.oauthCancelled,
      });
    } else if (error === "oauth_failed") {
      const msg = searchParams.get("message");
      setBannerNotice({
        type: "error",
        message: msg || lg.oauthFailed,
      });
    } else if (error === "invalid_state") {
      setBannerNotice({
        type: "error",
        message: lg.oauthExpired,
      });
    }

    // Check server Google configuration and SMS OTP provider status
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGoogleConfigured(Boolean(data.googleConfigured));
          if (typeof data.smsProviderConfigured === "boolean") {
            setSmsProviderConfigured(data.smsProviderConfigured);
            if (data.smsProviderName) {
              setSmsProviderName(data.smsProviderName);
            }
          }
        }
      })
      .catch(() => setGoogleConfigured(false));
  }, [searchParams, lg]);

  // Real SMS OTP resend countdown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleSendTeacherOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError(null);
    setOtpSuccess(null);

    const cleanPhone = otpPhone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 10) {
      setOtpError(lg.otpInvalidPhone);
      return;
    }

    setOtpSending(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, role: "teacher" }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 404) {
          throw new Error(lg.otpNotRegistered);
        }
        if (res.status === 429) {
          throw new Error(data.error || lg.otpRateLimit);
        }
        throw new Error(data.error || lg.otpSendFailed);
      }

      setOtpStep("code");
      setOtpCooldown(60);
      setOtpSuccess(tr("login.otpSentSuccess", { phone: data.maskedPhone || cleanPhone }));
    } catch (err: any) {
      setOtpError(err.message || lg.otpSendFailed);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyTeacherOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setOtpError(lg.otpInvalidCodeLen);
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
          role: "teacher",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || lg.otpInvalidCode);
      }

      if (data.user) {
        loginWithSessionUser(data.user);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setOtpError(err.message || lg.otpVerifyFailed);
    } finally {
      setOtpVerifying(false);
    }
  };

  // Handle Standard Email/Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError(lg.errBothFields);
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const result = await login(email, password, "teacher");
      if (result.user.role === "admin") {
        router.push("/dashboard");
        return;
      }

      const asgs = result.assignments || [];
      if (asgs.length === 0) {
        setLoginError(lg.errNoSubjectsAssigned);
        return;
      }

      if (asgs.length === 1) {
        setSelectedSubject(asgs[0].subjectCode);
        router.push(`/dashboard?subject=${asgs[0].subjectCode}`);
        return;
      }

      setPendingAssignments(asgs);
      setSelectedModalSubject(asgs[0].subjectCode);
      setShowSubjectModal(true);
    } catch (err: any) {
      setLoginError(err?.message || lg.errInvalidCredFallback);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Teacher Registration Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError(lg.errRegName);
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegError(lg.errRegEmail);
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError(lg.errRegPassLen);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError(lg.errRegPassMatch);
      return;
    }

    setRegLoading(true);
    setRegError(null);

    const result = await registerTeacher(regName, regEmail, regPassword, regSchoolId);
    if (result.success) {
      router.push("/dashboard");
    } else {
      setRegError(result.error || lg.errRegFailed);
      setRegLoading(false);
    }
  };

  // Handle Real Google OAuth Click (mode: "login" | "register")
  const handleGoogleAuth = async (mode: "login" | "register") => {
    setGoogleLoading(true);
    setBannerNotice(null);

    // If Google OAuth is not configured on server, show setup guidance modal
    if (googleConfigured === false) {
      setGoogleLoading(false);
      setShowSetupModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/auth/google?mode=${mode}&redirect=/dashboard`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setShowSetupModal(true);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setShowSetupModal(true);
      setGoogleLoading(false);
    }
  };

  const handleParentDemo = async () => {
    await loginAsDemoParent();
    router.push("/parent/dashboard");
  };

  const handleTeacherDemo = async () => {
    try {
      const result = await login("teacher@studysaathi.edu.in", "teacher123", "teacher");
      if (result.assignments && result.assignments.length > 1) {
        setPendingAssignments(result.assignments);
        setSelectedModalSubject(result.assignments[0].subjectCode);
        setShowSubjectModal(true);
        return;
      }
      if (result.assignments && result.assignments.length === 1) {
        setSelectedSubject(result.assignments[0].subjectCode);
        router.push(`/dashboard?subject=${result.assignments[0].subjectCode}`);
        return;
      }
    } catch {
      await loginAsDemoTeacher();
    }
    router.push("/dashboard");
  };

  const handleAdminDemo = async () => {
    await loginAsDemoAdmin();
    router.push("/dashboard");
  };

  return (
    <>
      <div className="rounded-3xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white/95 dark:bg-[#1E1916]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_16px_44px_rgba(73,53,47,0.08)] space-y-5 text-[#49352F] dark:text-[#F4F1E1]">
        {/* Card Header & Tab Switcher */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-1 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/12 dark:border-[#F2CAB3]/20">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setBannerNotice(null);
              }}
              className={`px-3.5 sm:px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              {lg.tabTeacherLogin}
            </button>
            <Link
              href="/parent/login"
              className="px-3.5 sm:px-5 py-1.5 rounded-xl text-xs font-bold text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1] hover:bg-[#F2CAB3]/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
              <span>{lg.tabParentLogin}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setBannerNotice(null);
              }}
              className={`px-3.5 sm:px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === "register"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              {lg.tabCreateAccount}
            </button>
          </div>

          <h2 className="font-heading text-2xl font-black text-[#49352F] dark:text-[#F4F1E1] tracking-tight">
            {authMode === "login" ? lg.headingLogin : lg.headingRegister}
          </h2>
          <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
            {lg.subheadingSystem}
          </p>
        </div>

        {/* Global Banner Notice (e.g. Unregistered Google account, Existing account, Errors) */}
        {bannerNotice && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
              bannerNotice.type === "warning"
                ? "bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200"
                : bannerNotice.type === "error"
                ? "bg-rose-500/10 border border-rose-500/25 text-rose-900 dark:text-rose-200"
                : "bg-blue-500/10 border border-blue-500/25 text-blue-900 dark:text-blue-200"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{bannerNotice.message}</div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-[#7A6862] hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1-Click Demo Evaluation Box (Available in Login Mode) */}
        {authMode === "login" && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F2DCB5]/70 via-[#FAF6E9] to-[#F2CAB3]/60 dark:from-[#2A231E] dark:via-[#221C18] dark:to-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/25 shadow-inner space-y-3 text-[#49352F] dark:text-[#F4F1E1]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                {lg.juryAccessTitle}
              </span>
              <Badge variant="mint" size="sm">
                {lg.juryNoSignUp}
              </Badge>
            </div>
            <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/75 leading-relaxed">
              {lg.jurySubtitle}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                type="button"
                variant="saffron"
                size="sm"
                onClick={handleTeacherDemo}
                className="rounded-xl text-xs font-black shadow-xs cursor-pointer px-2"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span className="truncate">{lg.roleTeacherShort}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParentDemo}
                className="rounded-xl text-xs font-bold border-[#B26A1B]/40 hover:border-[#B26A1B] bg-[#F2CAB3]/25 hover:bg-[#F2CAB3]/50 text-[#49352F] dark:text-[#F4F1E1] cursor-pointer px-2"
              >
                <Users className="w-3.5 h-3.5 mr-1 shrink-0 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <span className="truncate">{lg.roleParentShort}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdminDemo}
                className="rounded-xl text-xs font-bold border-[#49352F]/15 dark:border-[#F2CAB3]/30 hover:border-[#49352F]/30 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] cursor-pointer px-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 shrink-0 text-[#7A6862] dark:text-[#FAF6E9]" />
                <span className="truncate">{lg.roleAdminShort}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: TEACHER LOGIN FLOW                                      */}
        {/* ============================================================== */}
        {authMode === "login" && (
          <div className="space-y-4">
            {/* Method Switcher: Email/Password vs Real Mobile SMS OTP */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/12 dark:border-[#F2CAB3]/20 gap-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("password");
                  setOtpError(null);
                  setOtpSuccess(null);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMethod === "password"
                    ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                    : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{lg.methodPassword}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("otp");
                  setLoginError(null);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMethod === "otp"
                    ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                    : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <span>{lg.methodOtp}</span>
              </button>
            </div>

            {/* Sub-flow A: Password Form */}
            {loginMethod === "password" && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {lg.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@studysaathi.edu.in"
                      className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {lg.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-10 text-xs text-[#49352F] dark:text-[#F4F1E1] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#7A6862] hover:text-[#49352F] dark:hover:text-[#F4F1E1] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 rounded-xl bg-[#C54738]/10 border border-[#C54738]/20 text-xs text-[#C54738] dark:text-[#FA8C7C]">
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="saffron"
                  size="md"
                  disabled={loginLoading}
                  className="w-full rounded-full text-xs font-black shadow-xs cursor-pointer"
                >
                  <span>
                    {loginLoading ? lg.signingIn : lg.signInDashboardBtn}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}

            {/* Sub-flow B: Real SMS OTP Form */}
            {loginMethod === "otp" && (
              <div className="space-y-3.5">
                {/* Information / Provider guidance banner */}
                <div className="p-3 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/12 dark:border-[#F2CAB3]/20 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[#49352F] dark:text-[#F4F1E1]">
                      <Phone className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                      <span>{lg.smsAuthBadgeTitle}</span>
                    </span>
                    <Badge variant={smsProviderConfigured ? "mint" : "outline"} size="sm">
                      {smsProviderConfigured ? (smsProviderName || "Twilio / MSG91") : lg.carrierGatewayFallback}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/70 leading-relaxed">
                    {lg.smsAuthDesc}
                  </p>
                </div>

                {otpStep === "phone" ? (
                  <form onSubmit={handleSendTeacherOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                        {lg.registeredPhoneLabel}
                      </label>
                      <div className="relative flex rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] overflow-hidden focus-within:border-[#F2CAB3] focus-within:bg-white dark:focus-within:bg-[#201A16]">
                        <span className="inline-flex items-center px-3 text-xs font-bold text-[#7A6862] dark:text-[#FAF6E9]/70 bg-[#49352F]/5 dark:bg-[#F2CAB3]/10 border-r border-[#49352F]/10 dark:border-[#F2CAB3]/20">
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                          placeholder="98765 43210"
                          className="w-full py-2.5 px-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] outline-hidden bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Pre-fill Demo Teacher Phone Shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        setOtpPhone("9876543210");
                        setOtpError(null);
                      }}
                      className="w-full text-left p-2 rounded-xl border border-[#49352F]/10 dark:border-[#F2CAB3]/15 bg-white/60 dark:bg-[#1E1916]/60 text-[11px] hover:border-[#B26A1B] text-[#7A6862] dark:text-[#FAF6E9]/80 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-[#B26A1B]" />
                        <span>{lg.demoTeacherShortcut}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#B26A1B] dark:text-[#F2CAB3] font-bold">+91 98765 43210</span>
                    </button>

                    {otpError && (
                      <div className="p-2.5 rounded-xl bg-[#C54738]/10 border border-[#C54738]/20 text-xs text-[#C54738] dark:text-[#FA8C7C]">
                        {otpError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="saffron"
                      size="md"
                      disabled={otpSending || otpPhone.replace(/\D/g, "").length < 10}
                      className="w-full rounded-full text-xs font-black shadow-xs cursor-pointer"
                    >
                      <span>
                        {otpSending ? lg.sendingOtpBtn : lg.sendOtpBtn}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyTeacherOtp} className="space-y-3">
                    {otpSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-900 dark:text-emerald-200">
                        {otpSuccess}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1]">
                          {lg.otpCodeLabel}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep("phone");
                            setOtpCode("");
                            setOtpError(null);
                          }}
                          className="text-[11px] text-[#B26A1B] dark:text-[#F2CAB3] hover:underline cursor-pointer"
                        >
                          {lg.changeNumberBtn}
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                          placeholder="6 8 2 9 1 4"
                          className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-3 text-xs tracking-widest font-mono font-bold text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7A6862] dark:text-[#FAF6E9]/70">
                        {otpCooldown > 0 ? tr("login.otpCooldown", { seconds: otpCooldown }) : lg.didntReceiveSms}
                      </span>
                      {otpCooldown === 0 && (
                        <button
                          type="button"
                          onClick={() => handleSendTeacherOtp()}
                          disabled={otpSending}
                          className="text-[#B26A1B] dark:text-[#F2CAB3] font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{lg.resendSmsBtn}</span>
                        </button>
                      )}
                    </div>

                    {otpError && (
                      <div className="p-2.5 rounded-xl bg-[#C54738]/10 border border-[#C54738]/20 text-xs text-[#C54738] dark:text-[#FA8C7C]">
                        {otpError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="saffron"
                      size="md"
                      disabled={otpVerifying || otpCode.trim().length !== 6}
                      className="w-full rounded-full text-xs font-black shadow-xs cursor-pointer"
                    >
                      <span>
                        {otpVerifying ? lg.verifyingOtpBtn : lg.verifySignInBtn}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Subtle Divider: OR CONTINUE WITH */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#49352F]/15 dark:border-[#F2CAB3]/20" />
              </div>
              <span className="relative bg-white dark:bg-[#1E1916] px-3 text-[11px] font-bold text-[#7A6862] dark:text-[#FAF6E9]/75 tracking-wider uppercase">
                {lg.orContinueWith}
              </span>
            </div>

            {/* Google Authentication Button: Continue with Google */}
            <button
              type="button"
              onClick={() => handleGoogleAuth("login")}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-[#49352F]/20 dark:border-[#F2CAB3]/30 bg-white dark:bg-[#26201C] hover:bg-[#FAF6E9] dark:hover:bg-[#2E2520] text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-[#49352F]/30 border-t-[#B26A1B] rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5 shrink-0"
                  width="20"
                  height="20"
                  style={{ width: "20px", height: "20px", minWidth: "20px", minHeight: "20px" }}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
              )}
              <span>
                {googleLoading ? lg.googleConnecting : lg.googleContinue}
              </span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CREATE TEACHER ACCOUNT FLOW                             */}
        {/* ============================================================== */}
        {authMode === "register" && (
          <div className="space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {lg.regFullNameLabel}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={lg.regFullNamePlaceholder}
                    className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {lg.regOfficialEmailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="teacher@studysaathi.edu.in"
                    className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {lg.regSchoolLabel}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                  <select
                    value={regSchoolId}
                    onChange={(e) => setRegSchoolId(e.target.value)}
                    className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden cursor-pointer"
                  >
                    <option value="sch-gn-01">{lg.regSchool1}</option>
                    <option value="sch-ah-02">{lg.regSchool2}</option>
                    <option value="sch-br-03">{lg.regSchool3}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {lg.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-[#7A6862]" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={lg.regPassPlaceholder}
                      className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-9 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {lg.regConfirmLabel}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-[#7A6862]" />
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder={lg.regConfirmPlaceholder}
                      className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-9 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {regError && (
                <div className="p-2.5 rounded-xl bg-[#C54738]/10 border border-[#C54738]/20 text-xs text-[#C54738] dark:text-[#FA8C7C]">
                  {regError}
                </div>
              )}

              <Button
                type="submit"
                variant="saffron"
                size="md"
                disabled={regLoading}
                className="w-full rounded-full text-xs font-black shadow-xs cursor-pointer"
              >
                <span>
                  {regLoading ? lg.regCreatingBtn : lg.regCreateBtn}
                </span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {/* Subtle Divider: OR SIGN UP WITH */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#49352F]/15 dark:border-[#F2CAB3]/20" />
              </div>
              <span className="relative bg-white dark:bg-[#1E1916] px-3 text-[11px] font-bold text-[#7A6862] dark:text-[#FAF6E9]/75 tracking-wider uppercase">
                {lg.orSignUpWith}
              </span>
            </div>

            {/* Google Registration Button: Sign up with Google */}
            <button
              type="button"
              onClick={() => handleGoogleAuth("register")}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-[#49352F]/20 dark:border-[#F2CAB3]/30 bg-white dark:bg-[#26201C] hover:bg-[#FAF6E9] dark:hover:bg-[#2E2520] text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-[#49352F]/30 border-t-[#B26A1B] rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5 shrink-0"
                  width="20"
                  height="20"
                  style={{ width: "20px", height: "20px", minWidth: "20px", minHeight: "20px" }}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
              )}
              <span>
                {googleLoading ? lg.googleConnecting : lg.googleSignUp}
              </span>
            </button>
          </div>
        )}

        {/* Parent Portal Direct Entry */}
        <div className="pt-3 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-center">
          <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/70">
            {lg.parentPromptQuestion}{" "}
            <Link
              href="/parent/login"
              className="font-bold text-[#B26A1B] dark:text-[#F2CAB3] hover:underline inline-flex items-center gap-1 ml-1"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{lg.parentPromptLink} <span className="rtl:inline-block rtl:rotate-180">→</span></span>
            </Link>
          </p>
        </div>
      </div>

      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/20 dark:border-[#F2CAB3]/30 p-6 shadow-2xl space-y-5 text-[#49352F] dark:text-[#F4F1E1]">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#B26A1B] dark:text-[#F2CAB3]">
                {t.app.name}
              </span>
              <h3 className="font-heading text-xl font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {lg.subjectModalWelcome}
              </h3>
              <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80">
                {lg.subjectModalPrompt}
              </p>
            </div>

            {subjectModalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                {subjectModalError}
              </div>
            )}

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {pendingAssignments.map((asg) => {
                const subjectLabel = formatSubject(asg.subjectCode);
                const isSelected = selectedModalSubject === asg.subjectCode;
                const classesText = asg.grades && asg.grades.length > 0
                  ? tr("login.classesPrefix", {
                      classes: asg.grades.slice().sort().map((g) => formatClass(g)).join(", "),
                    })
                  : "";

                return (
                  <button
                    key={asg.id}
                    type="button"
                    onClick={() => {
                      setSelectedModalSubject(asg.subjectCode);
                      setSubjectModalError(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FFF8F0] dark:bg-[#2D241F] border-[#B26A1B] dark:border-[#F2CAB3] shadow-xs"
                        : "bg-white dark:bg-[#26201C] border-[#49352F]/10 dark:border-[#F2CAB3]/20 hover:border-[#B26A1B]/40"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#49352F] dark:text-[#F4F1E1]">
                          {subjectLabel}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#FAF6E9] dark:bg-[#1E1916] text-[#B26A1B] dark:text-[#F2CAB3] font-bold border border-[#49352F]/10">
                          {asg.subjectCode}
                        </span>
                      </div>
                      {classesText && (
                        <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/70">
                          {classesText}
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-[#B26A1B] bg-[#B26A1B]"
                          : "border-[#7A6862]/40"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={handleConfirmSubject}
              className="w-full py-3 rounded-2xl bg-[#B26A1B] hover:bg-[#8F5213] text-white font-medium text-sm shadow-md transition-all cursor-pointer"
            >
              {lg.subjectModalContinue}
            </Button>
          </div>
        </div>
      )}

      {/* Google Cloud Configuration Modal (Shown when Client ID is missing in .env) */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/20 dark:border-[#F2CAB3]/30 p-6 shadow-2xl space-y-4 text-[#49352F] dark:text-[#F4F1E1]">
            <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/20">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <h3 className="font-heading text-base font-bold">
                  {lg.oauthModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="text-[#7A6862] hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed">
              {lg.oauthModalDesc}
            </p>

            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-[11px] font-mono space-y-1.5 select-all">
              <div className="text-[#B26A1B] dark:text-[#F2CAB3] font-bold">{lg.oauthModalEnvComment}</div>
              <div>GOOGLE_CLIENT_ID=&quot;your-id.apps.googleusercontent.com&quot;</div>
              <div>GOOGLE_CLIENT_SECRET=&quot;your-client-secret&quot;</div>
              <div>NEXTAUTH_SECRET=&quot;studysaathi_session_secret_2026&quot;</div>
            </div>

            <div className="space-y-1.5 text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
              <div className="font-semibold text-[#49352F] dark:text-[#F4F1E1]">{lg.oauthModalRedirectHeading}</div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#2D241F] font-mono text-[11px] text-[#49352F] dark:text-[#F4F1E1]">
                https://shikshasetu-ai-iota.vercel.app/api/auth/callback/google
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#2D241F] font-mono text-[11px] text-[#49352F] dark:text-[#F4F1E1]">
                http://localhost:3000/api/auth/callback/google
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B26A1B] dark:text-[#F2CAB3] hover:underline"
              >
                <span>Google Cloud Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button
                variant="saffron"
                size="sm"
                onClick={() => setShowSetupModal(false)}
                className="rounded-full text-xs font-bold"
              >
                {lg.oauthModalClose}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LoginLoadingFallback() {
  const { t } = useLanguage();
  return <div className="p-8 text-center text-sm font-bold text-[#49352F]">{t.login.loadingAuth}</div>;
}

export default function LoginPage() {
  const { t } = useLanguage();
  const lg = t.login;

  return (
    <div className="min-h-screen bg-[#F4F1E1] dark:bg-[#15110E] text-[#49352F] dark:text-[#F4F1E1] flex flex-col justify-between overflow-hidden relative">
      {/* Background 3D Bridge Canvas */}
      <BridgeCanvas3D progress={0.5} />

      {/* Top Navbar */}
      <header className="relative z-20 flex items-center justify-between p-5 sm:px-10 max-w-7xl w-full mx-auto backdrop-blur-xs">
        <Link href="/" className="cursor-pointer">
          <BrandLogo size={36} />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* Split-Screen Main Container */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 max-w-7xl w-full mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: The Bridge Visual Narrative & Highlights */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 text-left pr-6">
            <div className="flex items-center gap-2">
              <Badge variant="saffron" size="sm" pulse>
                {lg.heroBadgeHackathon}
              </Badge>
              <Badge variant="mint" size="sm">
                {lg.heroBadgeOffline}
              </Badge>
            </div>

            <h1 className="font-heading text-4xl xl:text-5xl font-extrabold text-[#49352F] dark:text-[#F4F1E1] leading-tight tracking-tight">{lg.heroTitleBefore}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B26A1B] to-[#2E7D5E]">{lg.heroTitleHighlight}</span></h1>

            <p className="text-sm text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed max-w-lg">
              {lg.heroDesc}
            </p>

            <div className="space-y-3 pt-2 text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5E] dark:text-[#4EE2A7] shrink-0" />
                <span>
                  {lg.bulletBenchmarks}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0" />
                <span>
                  {lg.bulletHeatmap}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5E] dark:text-[#4EE2A7] shrink-0" />
                <span>
                  {lg.bulletOffline}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Warm Login / Register Card */}
          <div className="w-full lg:col-span-6 max-w-md mx-auto">
            <Suspense fallback={<LoginLoadingFallback />}>
              <LoginCardContent />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs text-[#7A6862] dark:text-[#FAF6E9]/60 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15">
        <p>{lg.footerCopyright}</p>
      </footer>
    </div>
  );
}
