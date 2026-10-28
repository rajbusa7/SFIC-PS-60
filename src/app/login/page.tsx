"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

const BridgeCanvas3D = dynamic(
  () => import("@/components/3d/BridgeCanvas3D").then((m) => m.BridgeCanvas3D),
  { ssr: false }
);

function LoginCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, registerTeacher, loginAsDemoTeacher, loginAsDemoAdmin } = useAuth();
  const { language } = useLanguage();

  // Mode: "login" or "register"
  const initialMode = searchParams.get("mode") === "register" || searchParams.get("unregistered") === "true" ? "register" : "login";
  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);

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
        message:
          language === "gu"
            ? "આ Google એકાઉન્ટ રજીસ્ટર થયેલ નથી. કૃપા કરીને પ્રથમ તમારું શિક્ષક એકાઉન્ટ બનાવો."
            : "This Google account is not registered in StudySaathi AI. Please create your teacher account below to continue.",
      });
    } else if (existing === "true") {
      setAuthMode("login");
      const existEmail = searchParams.get("email");
      if (existEmail) setEmail(existEmail);
      setBannerNotice({
        type: "info",
        message:
          language === "gu"
            ? "આ ઈમેલ સાથેનું એકાઉન્ટ પહેલેથી અસ્તિત્વમાં છે. કૃપા કરીને નીચે સાઇન ઇન કરો."
            : "An account with this email/Google account already exists. Please sign in below.",
      });
    } else if (error === "google_cancelled") {
      setBannerNotice({
        type: "info",
        message:
          language === "gu"
            ? "Google પ્રમાણીકરણ રદ કરવામાં આવ્યું હતું. તમે ઈમેલ/પાસવર્ડથી પ્રવેશ કરી શકો છો."
            : "Google sign-in was cancelled. You can sign in using your email and password or try again.",
      });
    } else if (error === "oauth_failed") {
      const msg = searchParams.get("message");
      setBannerNotice({
        type: "error",
        message:
          msg ||
          (language === "gu"
            ? "Google પ્રમાણીકરણ નિષ્ફળ ગયું. કૃપા કરીને પુનઃ પ્રયાસ કરો."
            : "Google authentication failed. Please try again or sign in with your credentials."),
      });
    } else if (error === "invalid_state") {
      setBannerNotice({
        type: "error",
        message:
          language === "gu"
            ? "સુરક્ષા સત્ર સમાપ્ત થઈ ગયું છે. કૃપા કરીને ફરીથી પ્રયાસ કરો."
            : "Security session expired. Please try signing in again.",
      });
    }

    // Check server Google configuration
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGoogleConfigured(Boolean(data.googleConfigured));
        }
      })
      .catch(() => setGoogleConfigured(false));
  }, [searchParams, language]);

  // Handle Standard Email/Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError(
        language === "gu"
          ? "કૃપા કરીને ઈમેલ અને પાસવર્ડ બંને ભરો."
          : "Please enter both your email address and password."
      );
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login(email, "teacher");
      router.push("/dashboard");
    } catch {
      setLoginError(
        language === "gu"
          ? "ખોટો ઈમેલ અથવા પાસવર્ડ. કૃપા કરીને પુનઃ પ્રયાસ કરો."
          : "Invalid email or password. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Teacher Registration Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError(language === "gu" ? "કૃપા કરીને તમારું પૂરું નામ દાખલ કરો." : "Please enter your full name.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegError(language === "gu" ? "કૃપા કરીને માન્ય ઈમેલ સરનામું દાખલ કરો." : "Please enter a valid email address.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError(
        language === "gu"
          ? "પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ."
          : "Password must be at least 6 characters long."
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError(language === "gu" ? "પાસવર્ડ મેળ ખાતા નથી." : "Passwords do not match.");
      return;
    }

    setRegLoading(true);
    setRegError(null);

    const result = await registerTeacher(regName, regEmail, regPassword, regSchoolId);
    if (result.success) {
      router.push("/dashboard");
    } else {
      setRegError(result.error || (language === "gu" ? "એકાઉન્ટ બનાવવામાં નિષ્ફળ." : "Failed to create account."));
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
    } catch {
      setShowSetupModal(true);
      setGoogleLoading(false);
    }
  };

  const handleTeacherDemo = async () => {
    await loginAsDemoTeacher();
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
              className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              {language === "gu" ? "શિક્ષક પ્રવેશ (Sign In)" : "Teacher Login"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setBannerNotice(null);
              }}
              className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === "register"
                  ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              {language === "gu" ? "નવું એકાઉન્ટ (Register)" : "Create Account"}
            </button>
          </div>

          <h2 className="font-heading text-2xl font-black text-[#49352F] dark:text-[#F4F1E1] tracking-tight">
            {authMode === "login"
              ? language === "gu"
                ? "StudySaathi માં પ્રવેશ કરો"
                : "Sign In to StudySaathi AI"
              : language === "gu"
              ? "નવું શિક્ષક એકાઉન્ટ બનાવો"
              : "Register New Teacher Account"}
          </h2>
          <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
            {language === "gu"
              ? "પ્રાથમિક શાળા શિક્ષણ ઉપચારાત્મક પ્રણાલી"
              : "Primary School Pedagogical Remedial System"}
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
                {language === "gu" ? "હેકાથોન જ્યુરી ૧-ક્લિક પ્રવેશ" : "Hackathon Jury 1-Click Access"}
              </span>
              <Badge variant="mint" size="sm">
                {language === "gu" ? "સાઇન-અપ મુક્ત" : "No Sign Up"}
              </Badge>
            </div>
            <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/75 leading-relaxed">
              {language === "gu"
                ? "લાઇવ પ્રાથમિક સમૂહનું સીધું અન્વેષણ કરવા માટે પૂર્વ-રૂપરેખાંકિત ભૂમિકા પસંદ કરો:"
                : "Select a pre-configured role to immediately explore the live primary cohort:"}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button
                type="button"
                variant="saffron"
                size="sm"
                onClick={handleTeacherDemo}
                className="rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                <span>{language === "gu" ? "શિક્ષક ભૂમિકા" : "Teacher Role"}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdminDemo}
                className="rounded-xl text-xs font-bold border-[#49352F]/15 dark:border-[#F2CAB3]/30 hover:border-[#49352F]/30 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <span>{language === "gu" ? "પ્રશાસક ભૂમિકા" : "Admin Role"}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: TEACHER LOGIN FLOW                                      */}
        {/* ============================================================== */}
        {authMode === "login" && (
          <div className="space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "ઈમેલ સરનામું" : "Email Address"}
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
                  {language === "gu" ? "પાસવર્ડ" : "Password"}
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
                  {loginLoading
                    ? language === "gu"
                      ? "પ્રવેશ થઈ રહ્યો છે..."
                      : "Signing In..."
                    : language === "gu"
                    ? "ડેશબોર્ડમાં પ્રવેશ કરો"
                    : "Sign In to Dashboard"}
                </span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {/* Subtle Divider: OR CONTINUE WITH */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#49352F]/15 dark:border-[#F2CAB3]/20" />
              </div>
              <span className="relative bg-white dark:bg-[#1E1916] px-3 text-[11px] font-bold text-[#7A6862] dark:text-[#FAF6E9]/75 tracking-wider uppercase">
                {language === "gu" ? "અથવા આનાથી પ્રવેશ કરો" : "OR CONTINUE WITH"}
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
                {googleLoading
                  ? language === "gu"
                    ? "Google સાથે કનેક્ટ થઈ રહ્યું છે..."
                    : "Connecting with Google..."
                  : language === "gu"
                  ? "Google સાથે આગળ વધો"
                  : "Continue with Google"}
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
                  {language === "gu" ? "શિક્ષકનું પૂરું નામ" : "Teacher Full Name"}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Pooja Sharma"
                    className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "સત્તાવાર ઈમેલ સરનામું" : "Official Email Address"}
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
                  {language === "gu" ? "શાળા સંલગ્નતા (School ID)" : "School Association"}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                  <select
                    value={regSchoolId}
                    onChange={(e) => setRegSchoolId(e.target.value)}
                    className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-10 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden cursor-pointer"
                  >
                    <option value="sch-gn-01">
                      Model Primary School, Gandhinagar (sch-gn-01)
                    </option>
                    <option value="sch-ah-02">
                      Sardar Patel Primary Vidyalaya, Ahmedabad (sch-ah-02)
                    </option>
                    <option value="sch-br-03">
                      Sayajirao Primary School, Vadodara (sch-br-03)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {language === "gu" ? "પાસવર્ડ" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-[#7A6862]" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-[#FAF6E9] dark:bg-[#26201C] py-2.5 pl-9 pr-3 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white dark:focus:bg-[#201A16] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {language === "gu" ? "પાસવર્ડ પુષ્ટિ" : "Confirm"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-[#7A6862]" />
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
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
                  {regLoading
                    ? language === "gu"
                      ? "ખાતું બની રહ્યું છે..."
                      : "Creating Teacher Account..."
                    : language === "gu"
                    ? "નવું શિક્ષક ખાતું બનાવો"
                    : "Create Teacher Account"}
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
                {language === "gu" ? "અથવા આનાથી સાઇન અપ કરો" : "OR SIGN UP WITH"}
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
                {googleLoading
                  ? language === "gu"
                    ? "Google સાથે કનેક્ટ થઈ રહ્યું છે..."
                    : "Connecting with Google..."
                  : language === "gu"
                  ? "Google સાથે સાઇન અપ કરો"
                  : "Sign up with Google"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Google Cloud Configuration Modal (Shown when Client ID is missing in .env) */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/20 dark:border-[#F2CAB3]/30 p-6 shadow-2xl space-y-4 text-[#49352F] dark:text-[#F4F1E1]">
            <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/20">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <h3 className="font-heading text-base font-bold">
                  {language === "gu" ? "Google OAuth સેટઅપ માર્ગદર્શિકા" : "Google OAuth Setup Required"}
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
              {language === "gu"
                ? "વાસ્તવિક Google લૉગિન સક્ષમ કરવા માટે, તમારા .env ફાઈલમાં Google Cloud Console માંથી મેળવેલ Client ID અને Secret દાખલ કરો:"
                : "To enable live Google OAuth in this deployment, configure your OAuth 2.0 Client credentials in your environment:"}
            </p>

            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-[11px] font-mono space-y-1.5 select-all">
              <div className="text-[#B26A1B] dark:text-[#F2CAB3] font-bold"># Add to .env or Vercel Environment:</div>
              <div>GOOGLE_CLIENT_ID=&quot;your-id.apps.googleusercontent.com&quot;</div>
              <div>GOOGLE_CLIENT_SECRET=&quot;your-client-secret&quot;</div>
              <div>NEXTAUTH_SECRET=&quot;studysaathi_session_secret_2026&quot;</div>
            </div>

            <div className="space-y-1.5 text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
              <div className="font-semibold text-[#49352F] dark:text-[#F4F1E1]">Authorized Redirect URIs:</div>
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
                {language === "gu" ? "સમજાયું (Got It)" : "Close & Use Email/Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  const { language } = useLanguage();

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
                SFIC Gujarat Hackathon 2026
              </Badge>
              <Badge variant="mint" size="sm">
                100% Offline-First
              </Badge>
            </div>

            <h1 className="font-heading text-4xl xl:text-5xl font-extrabold text-[#49352F] dark:text-[#F4F1E1] leading-tight tracking-tight">
              {language === "gu" ? (
                <>
                  અધ્યયન ત્રુટિથી સિદ્ધિ સુધીનો{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B26A1B] to-[#2E7D5E]">
                    સુવર્ણ સેતુ.
                  </span>
                </>
              ) : (
                <>
                  The Bridge from Learning Gaps to{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B26A1B] to-[#2E7D5E]">
                    Mastery.
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed max-w-lg">
              {language === "gu"
                ? "પ્રાથમિક શાળાના શિક્ષકો માટે પારદર્શક AI ડિટેક્શન અને ૫-પગલાંની પ્રવૃત્તિ-આધારિત ઉપચારાત્મક યોજનાઓ."
                : "Deterministic rule-based tracking, explainable cognitive diagnosis, and concrete 5-step remedial curricula for Gujarat primary schools."}
            </p>

            <div className="space-y-3 pt-2 text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5E] dark:text-[#4EE2A7] shrink-0" />
                <span>
                  {language === "gu"
                    ? "નિશ્ચિત ૬૦% વિકાસશીલ અને ૮૦% નિપુણતા બેન્ચમાર્ક્સ"
                    : "Deterministic 60% developing & 80% mastery benchmarks"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0" />
                <span>
                  {language === "gu"
                    ? "ઇન્ટરેક્ટિવ ૩D વર્ગ નિપુણતા હીટમેપ અને કૌશલ્ય પ્રગતિ વૃક્ષ"
                    : "Interactive 3D class mastery heatmap & student skill progression trees"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5E] dark:text-[#4EE2A7] shrink-0" />
                <span>
                  {language === "gu"
                    ? "કોઈ ચૂકવણી કરેલ API જરૂરી નથી; ગ્રામીણ શાળાઓમાં સંપૂર્ણ ઑફલાઇન ચાલે છે"
                    : "Zero paid APIs required; operates completely offline in rural schools"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Warm Login / Register Card */}
          <div className="w-full lg:col-span-6 max-w-md mx-auto">
            <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6862]">Loading authentication...</div>}>
              <LoginCardContent />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs text-[#7A6862] dark:text-[#FAF6E9]/60 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15">
        <p>© 2026 StudySaathi AI • SFIC Gujarat Hackathon PS-60. Offline-First PWA.</p>
      </footer>
    </div>
  );
}
