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
} from "lucide-react";

function ParentLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const demoParam = searchParams.get("demo");
    if (demoParam === "true") {
      setEmail("dinesh.patel@example.com");
      setPassword("DemoParent2026!");
    }
    if (errorParam === "session_expired") {
      setError(
        language === "gu"
          ? "તમારું સત્ર સમાપ્ત થઈ ગયું છે. કૃપા કરીને ફરીથી લૉગિન કરો."
          : "Your session has expired. Please sign in again."
      );
    } else if (errorParam === "parent_required") {
      setError(
        language === "gu"
          ? "આ પેજ ફક્ત વાલીઓ માટે છે. કૃપા કરીને વાલી એકાઉન્ટથી લૉગિન કરો."
          : "This portal is reserved for parents. Please sign in with your parent account."
      );
    }
  }, [searchParams, language]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes("@")) {
      setError(
        language === "gu"
          ? "કૃપા કરીને માન્ય ઇમેઇલ દાખલ કરો."
          : "Please enter a valid email address."
      );
      return;
    }

    if (!password) {
      setError(
        language === "gu"
          ? "કૃપા કરીને તમારો પાસવર્ડ દાખલ કરો."
          : "Please enter your password."
      );
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
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      setSuccessMsg(
        language === "gu"
          ? "સફળતાપૂર્વક પ્રવેશ કર્યો! ડેશબોર્ડ પર લઈ જઈ રહ્યા છીએ..."
          : "Signed in successfully! Redirecting to Parent Dashboard..."
      );

      const redirectPath = searchParams.get("redirect") || "/parent/dashboard";
      setTimeout(() => {
        router.push(redirectPath);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
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
            <span>{language === "gu" ? "મુખ્ય પૃષ્ઠ" : "Home"}</span>
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
                  {language === "gu" ? "વાલી પ્રવેશ (Parent Login)" : "Parent Login"}
                </button>
                <Link
                  href="/parent/register"
                  className="px-5 py-1.5 rounded-xl text-xs font-bold text-[#7A6862] hover:text-[#49352F] transition-all cursor-pointer"
                >
                  {language === "gu" ? "નવું એકાઉન્ટ (Register)" : "Create Account"}
                </Link>
              </div>

              <h2 className="font-heading text-2xl font-black text-[#49352F] tracking-tight">
                {language === "gu" ? "વાલી પોર્ટલમાં પ્રવેશ કરો" : "Sign In to Parent Portal"}
              </h2>
              <p className="text-xs text-[#7A6862]">
                {language === "gu"
                  ? "તમારા બાળકના શિક્ષણ અને ઉપચારાત્મક પ્રગતિ સાથે જોડાવો"
                  : "Track your child's learning journey, gaps & remedial progress"}
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
                  <span>{language === "gu" ? "ડેમો વાલી એક્સેસ" : "1-Click Demo Parent Access"}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/30">
                  {language === "gu" ? "સીધો પ્રવેશ" : "No Sign Up"}
                </span>
              </div>
              <p className="text-[11px] text-[#7A6862] leading-relaxed">
                {language === "gu"
                  ? "આરવ પટેલ (ધોરણ ૪-A) ના વાલી દિનેશભાઈ પટેલ તરીકે લોગિન કરો:"
                  : "Explore as Dineshbhai Patel (Father of Aarav Patel, Class 4-A):"}
              </p>
              <button
                type="button"
                onClick={handleDemoParentLogin}
                className="w-full py-2 px-3 rounded-xl bg-white border border-[#49352F]/20 text-xs font-bold text-[#49352F] hover:bg-[#FAF6E9] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Users className="w-3.5 h-3.5 text-[#B26A1B]" />
                <span>dinesh.patel@example.com (Dineshbhai Patel)</span>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#49352F] block">
                  {language === "gu" ? "ઇમેઇલ સરનામું" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#49352F] block">
                    {language === "gu" ? "પાસવર્ડ" : "Password"}
                  </label>
                  <Link
                    href="/parent/forgot-password"
                    className="text-[11px] font-semibold text-[#B26A1B] hover:underline"
                  >
                    {language === "gu" ? "પાસવર્ડ ભૂલી ગયા?" : "Forgot Password?"}
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
                  <span>{language === "gu" ? "મને યાદ રાખો" : "Remember Me"}</span>
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
                    <span>{language === "gu" ? "ચકાસણી ચાલુ છે..." : "Signing In..."}</span>
                  </span>
                ) : (
                  <>
                    <span>{language === "gu" ? "વાલી ડેશબોર્ડમાં પ્રવેશ કરો" : "Sign In to Parent Dashboard"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Subtle Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#49352F]/15" />
              </div>
              <span className="relative bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-[#7A6862]">
                {language === "gu" ? "અથવા આના દ્વારા પ્રવેશ કરો" : "OR CONTINUE WITH"}
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
              <span>{language === "gu" ? "ગૂગલ સાથે ચાલુ રાખો" : "Continue with Google"}</span>
            </button>

            {/* Switch to Teacher Login */}
            <div className="pt-2 border-t border-[#49352F]/10 text-center space-y-2">
              <p className="text-xs text-[#7A6862]">
                {language === "gu" ? "શિક્ષક કે વહીવટી સ્ટાફ છો?" : "Are you a Teacher or School Staff?"}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B26A1B] hover:text-[#49352F] transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{language === "gu" ? "શિક્ષક પોર્ટલ પર જાઓ →" : "Go to Teacher Portal →"}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#7A6862]">
        <p>
          StudySaathi AI &bull; {language === "gu" ? "પ્રાથમિક શાળા શિક્ષણ સેતુ" : "Primary School Learning Gap Bridge"}{" "}
          &bull; Gandhinagar, Gujarat
        </p>
      </footer>
    </div>
  );
}


export default function ParentLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6E9] flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-white shadow-md text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#B26A1B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#49352F]">Loading Parent Login...</p>
          </div>
        </div>
      }
    >
      <ParentLoginContent />
    </Suspense>
  );
}
