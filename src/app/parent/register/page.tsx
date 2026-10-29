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
  const { language } = useLanguage();

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
      setError(language === "gu" ? "કૃપા કરીને તમારું પૂરું નામ દાખલ કરો." : "Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError(language === "gu" ? "કૃપા કરીને માન્ય ઇમેઇલ દાખલ કરો." : "Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError(
        language === "gu"
          ? "પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ."
          : "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        language === "gu"
          ? "પાસવર્ડ મેળ ખાતા નથી. કૃપા કરીને પુષ્ટિ કરો."
          : "Passwords do not match. Please confirm your password."
      );
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
          preferredLanguage: language === "gu" ? "gu" : "en",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      setSuccessMsg(
        language === "gu"
          ? "એકાઉન્ટ સફળતાપૂર્વક બની ગયું! વાલી ડેશબોર્ડ શરૂ થઈ રહ્યું છે..."
          : "Account created successfully! Launching your parent dashboard..."
      );

      setTimeout(() => {
        router.push("/parent/dashboard");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
            <span>{language === "gu" ? "મુખ્ય પૃષ્ઠ" : "Home"}</span>
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
                  {language === "gu" ? "વાલી પ્રવેશ (Parent Login)" : "Parent Login"}
                </Link>
                <button
                  type="button"
                  className="px-5 py-1.5 rounded-xl text-xs font-bold bg-[#261B16] text-[#FAF6E9] shadow-xs cursor-pointer"
                >
                  {language === "gu" ? "નવું એકાઉન્ટ (Register)" : "Create Account"}
                </button>
              </div>

              <h2 className="font-heading text-2xl font-black text-[#49352F] tracking-tight">
                {language === "gu" ? "નવું વાલી એકાઉન્ટ બનાવો" : "Register Parent Account"}
              </h2>
              <p className="text-xs text-[#7A6862]">
                {language === "gu"
                  ? "તમારા બાળકની શાળા અને વર્ગખંડ સાથે સુરક્ષિત જોડાણ સ્થાપિત કરો"
                  : "Connect with your child's primary school learning journey"}
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
                  {language === "gu" ? "વાલીનું પૂરું નામ *" : "Parent's Full Name *"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === "gu" ? "દા.ત. દિનેશભાઈ પટેલ" : "e.g. Dineshbhai Patel"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#49352F] block">
                  {language === "gu" ? "ઇમેઇલ સરનામું *" : "Email Address *"}
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#49352F] block">
                  {language === "gu" ? "મોબાઇલ નંબર (વૈકલ્પિક)" : "Phone Number (Optional)"}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#7A6862] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] placeholder:text-[#7A6862]/60 focus:outline-none focus:border-[#B26A1B] focus:ring-2 focus:ring-[#B26A1B]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#49352F] block">
                    {language === "gu" ? "પાસવર્ડ *" : "Password *"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A6862] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
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
                    {language === "gu" ? "પુષ્ટિ કરો *" : "Confirm *"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A6862] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
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
                    <span>{language === "gu" ? "બાળક જોડાણ કોડ (વૈકલ્પિક)" : "Child Linking Code (Optional)"}</span>
                  </label>
                  <span className="text-[10px] text-[#7A6862]">e.g. PAR-4892</span>
                </div>
                <input
                  type="text"
                  value={linkingCode}
                  onChange={(e) => setLinkingCode(e.target.value.toUpperCase())}
                  placeholder="PAR-XXXX"
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white font-mono text-xs font-bold text-[#B26A1B] tracking-wider uppercase placeholder:normal-case placeholder:font-sans placeholder:text-[#7A6862]/50 focus:outline-none focus:border-[#B26A1B]"
                />
                <p className="text-[10px] text-[#7A6862] leading-tight">
                  {language === "gu"
                    ? "શાળાના શિક્ષક દ્વારા આપવામાં આવેલ ૬-અંકનો કોડ દાખલ કરીને બાળકને તરત જોડો. (તમે પછીથી પણ જોડી શકો છો)."
                    : "Enter the verification code given by your child's teacher to link records instantly (can also be linked later)."}
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
                    <span>{language === "gu" ? "એકાઉન્ટ બની રહ્યું છે..." : "Creating Account..."}</span>
                  </span>
                ) : (
                  <>
                    <span>{language === "gu" ? "વાલી એકાઉન્ટ રજીસ્ટર કરો" : "Register Parent Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Parent Login */}
            <div className="pt-2 border-t border-[#49352F]/10 text-center">
              <p className="text-xs text-[#7A6862]">
                {language === "gu" ? "પહેલેથી એકાઉન્ટ છે? " : "Already have an account? "}
                <Link href="/parent/login" className="font-bold text-[#B26A1B] hover:underline">
                  {language === "gu" ? "અહીં લૉગિન કરો" : "Sign In Here"}
                </Link>
              </p>
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
