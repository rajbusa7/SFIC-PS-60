"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Cpu,
  GraduationCap,
} from "lucide-react";

const BridgeCanvas3D = dynamic(
  () => import("@/components/3d/BridgeCanvas3D").then((m) => m.BridgeCanvas3D),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemoTeacher, loginAsDemoAdmin } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("teacher@studysaathi.edu.in");
  const [password, setPassword] = useState("DemoPass2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      login(email, "teacher");
      router.push("/dashboard");
    }, 350);
  };

  const handleTeacherDemo = () => {
    loginAsDemoTeacher();
    router.push("/dashboard");
  };

  const handleAdminDemo = () => {
    loginAsDemoAdmin();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F4F1E1] text-[#49352F] flex flex-col justify-between overflow-hidden relative">
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

            <h1 className="font-heading text-4xl xl:text-5xl font-extrabold text-[#49352F] leading-tight tracking-tight">
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

            <p className="text-sm text-[#7A6862] leading-relaxed max-w-lg">
              {language === "gu"
                ? "પ્રાથમિક શાળાના શિક્ષકો માટે પારદર્શક AI ડિટેક્શન અને ૫-પગલાંની પ્રવૃત્તિ-આધારિત ઉપચારાત્મક યોજનાઓ."
                : "Deterministic rule-based tracking, explainable cognitive diagnosis, and concrete 5-step remedial curricula for Gujarat primary schools."}
            </p>

            <div className="space-y-3 pt-2 text-xs text-[#7A6862]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5E] shrink-0" />
                <span>
                  {language === "gu"
                    ? "નિશ્ચિત ૬૦% વિકાસશીલ અને ૮૦% નિપુણતા બેન્ચમાર્ક્સ"
                    : "Deterministic 60% developing & 80% mastery benchmarks"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#B26A1B] shrink-0" />
                <span>
                  {language === "gu"
                    ? "ઇન્ટરેક્ટિવ ૩D વર્ગ નિપુણતા હીટમેપ અને કૌશલ્ય પ્રગતિ વૃક્ષ"
                    : "Interactive 3D class mastery heatmap & student skill progression trees"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5E] shrink-0" />
                <span>
                  {language === "gu"
                    ? "કોઈ ચૂકવણી કરેલ API જરૂરી નથી; ગ્રામીણ શાળાઓમાં સંપૂર્ણ ઑફલાઇન ચાલે છે"
                    : "Zero paid APIs required; operates completely offline in rural schools"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Warm Login Card */}
          <div className="w-full lg:col-span-6 max-w-md mx-auto">
            <div className="rounded-3xl border border-[#49352F]/15 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_16px_44px_rgba(73,53,47,0.08)] space-y-6 text-[#49352F]">
              <div className="text-center space-y-1">
                <h2 className="font-heading text-2xl font-black text-[#49352F] tracking-tight">
                  {language === "gu" ? "StudySaathi માં પ્રવેશ કરો" : "Sign In to StudySaathi AI"}
                </h2>
                <p className="text-xs text-[#7A6862]">
                  {language === "gu"
                    ? "પ્રાથમિક શાળા શિક્ષણ ઉપચારાત્મક પ્રણાલી"
                    : "Primary School Pedagogical Remedial System"}
                </p>
              </div>

              {/* 1-Click Demo Evaluation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F2DCB5]/70 via-[#FAF6E9] to-[#F2CAB3]/60 border border-[#49352F]/15 shadow-inner space-y-3 text-[#49352F]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#49352F] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#B26A1B]" />
                    {language === "gu" ? "હેકાથોન જ્યુરી ૧-ક્લિક પ્રવેશ" : "Hackathon Jury 1-Click Access"}
                  </span>
                  <Badge variant="mint" size="sm">
                    {language === "gu" ? "સાઇન-અપ મુક્ત" : "No Sign Up"}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#7A6862] leading-relaxed">
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
                    className="rounded-xl text-xs font-black shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    <span>{language === "gu" ? "શિક્ષક ભૂમિકા" : "Teacher Role"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAdminDemo}
                    className="rounded-xl text-xs font-bold border-[#49352F]/15 hover:border-[#49352F]/30 bg-white text-[#49352F]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#B26A1B]" />
                    <span>{language === "gu" ? "પ્રશાસક ભૂમિકા" : "Admin Role"}</span>
                  </Button>
                </div>
              </div>

              {/* Form Divider */}
              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#49352F]/10" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-semibold text-[#7A6862] uppercase">
                  {language === "gu" ? "અથવા ઓળખપત્રો દાખલ કરો" : "Or enter credentials"}
                </span>
              </div>

              {/* Standard Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] mb-1">
                    {language === "gu" ? "ઈમેલ સરનામું" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@studysaathi.edu.in"
                      className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] py-2.5 pl-10 pr-3 text-xs text-[#49352F] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] mb-1">
                    {language === "gu" ? "પાસવર્ડ" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#7A6862]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] py-2.5 pl-10 pr-10 text-xs text-[#49352F] focus:border-[#F2CAB3] focus:bg-white outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#7A6862] hover:text-[#49352F]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-[#C54738]/10 border border-[#C54738]/20 text-xs text-[#C54738]">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="saffron"
                  size="md"
                  disabled={loading}
                  className="w-full rounded-full text-xs font-black shadow-xs"
                >
                  <span>
                    {loading
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
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs text-[#7A6862] border-t border-[#49352F]/10">
        <p>© 2026 StudySaathi AI • SFIC Gujarat Hackathon PS-60. Offline-First PWA.</p>
      </footer>
    </div>
  );
}
