"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BridgeCanvas3D } from "@/components/3d/BridgeCanvas3D";
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

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemoTeacher, loginAsDemoAdmin } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("teacher@shikshasetu.edu.in");
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
    <div className="min-h-screen bg-[#14123D] text-slate-100 flex flex-col justify-between overflow-hidden relative">
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

            <h1 className="font-heading text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {language === "gu" ? (
                <>
                  અધ્યયન ત્રુટિથી સિદ્ધિ સુધીનો{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
                    સુવર્ણ સેતુ.
                  </span>
                </>
              ) : (
                <>
                  The Bridge from Learning Gaps to{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
                    Mastery.
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              {language === "gu"
                ? "પ્રાથમિક શાળાના શિક્ષકો માટે પારદર્શક AI ડિટેક્શન અને ૫-પગલાંની પ્રવૃત્તિ-આધારિત ઉપચારાત્મક યોજનાઓ."
                : "Deterministic rule-based tracking, explainable cognitive diagnosis, and concrete 5-step remedial curricula for Gujarat primary schools."}
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deterministic 60% developing &amp; 80% mastery benchmarks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Interactive 3D class mastery heatmap &amp; student skill progression trees</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Zero paid APIs required; operates completely offline in rural schools</span>
              </div>
            </div>
          </div>

          {/* Right Column: Glassmorphism Login Card */}
          <div className="w-full lg:col-span-6 max-w-md mx-auto">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-1">
                <h2 className="font-heading text-2xl font-black text-white tracking-tight">
                  {language === "gu" ? "શિક્ષાસેતુમાં પ્રવેશ કરો" : "Sign In to ShikshaSetu AI"}
                </h2>
                <p className="text-xs text-slate-400">
                  Primary School Pedagogical Remedial System
                </p>
              </div>

              {/* 1-Click Demo Evaluation Box */}
              <div className="p-4 rounded-2xl bg-[#14123D]/90 border border-amber-500/40 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Hackathon Jury 1-Click Access
                  </span>
                  <Badge variant="mint" size="sm">
                    No Sign Up
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Select a pre-configured role to immediately explore the live primary cohort:
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="saffron"
                    size="sm"
                    onClick={handleTeacherDemo}
                    className="rounded-xl text-xs font-black shadow-md shadow-amber-500/30"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    <span>Teacher Role</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAdminDemo}
                    className="rounded-xl text-xs font-bold border-slate-700 hover:border-amber-500/50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    <span>Admin Role</span>
                  </Button>
                </div>
              </div>

              {/* Form Divider */}
              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase">
                  Or enter credentials
                </span>
              </div>

              {/* Standard Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@shikshasetu.edu.in"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-10 text-xs text-white focus:border-amber-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="saffron"
                  size="md"
                  disabled={loading}
                  className="w-full rounded-full text-xs font-black shadow-lg shadow-amber-500/30"
                >
                  <span>{loading ? "Signing In..." : "Sign In to Dashboard"}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p>© 2026 ShikshaSetu AI • SFIC Gujarat Hackathon PS-60. Offline-First PWA.</p>
      </footer>
    </div>
  );
}
