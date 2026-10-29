"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { BridgeCanvas3D } from "@/components/3d/BridgeCanvas3D";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Users,
  Compass,
  Layers,
  Award,
  BookOpen,
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  Heart,
  Send,
  Mail,
  MapPin,
  ExternalLink,
  Cpu,
  Activity,
  LogIn,
  ChevronDown,
  Search,
  Check,
  FileText,
  Play,
  RotateCcw,
} from "lucide-react";

export default function HomePage() {
  const { t, language } = useLanguage();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSpeech, setActiveSpeech] = useState(
    language === "gu"
      ? "નમસ્તે! હું શિક્ષાબોટ છું. ચાલો અધ્યયન ત્રુટિઓને દૂર કરીને સફળતાનો સેતુ બનાવીએ!"
      : "Hi! I'm ShikshaBot. Let's build the glowing bridge from learning gaps to mastery!"
  );
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      // 5 continuous narrative scenes
      const p = Math.max(0, Math.min(5, scrollY / Math.max(1, vh)));
      setScrollProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const elem = document.querySelector(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackEmail) {
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 4000);
      setFeedbackEmail("");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#14123D] text-slate-100 selection:bg-amber-500 selection:text-black overflow-x-hidden font-sans">
      {/* 1. Persistent 3D The Bridge WebGL Canvas in Background */}
      <BridgeCanvas3D progress={scrollProgress} />

      {/* 2. Glass Sticky Navbar */}
      <LandingNavbar />

      {/* ================================================================ */}
      {/* SECTION 1: HERO — "THE BRIDGE" (Gap to Mastery)                   */}
      {/* ================================================================ */}
      <section
        id="hero"
        className="relative min-h-[100svh] w-full flex flex-col justify-between pt-28 pb-10 sm:pt-36 sm:pb-14 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10"
      >
        <div className="my-auto max-w-2xl text-left space-y-6 pt-6 sm:pt-10">
          {/* Hackathon & Platform Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="saffron" size="sm" pulse>
              SFIC Gujarat Hackathon 2026 • PS-60
            </Badge>
            <Badge variant="mint" size="sm">
              100% Offline-First
            </Badge>
            <Badge variant="indigo" size="sm">
              Zero Paid APIs
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            {language === "gu" ? (
              <>
                દરેક અધ્યયન ત્રુટિ એક{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400">
                  નવી તક
                </span>{" "}
                છે.
              </>
            ) : (
              <>
                Every Learning Gap Is an{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400">
                  Opportunity.
                </span>
              </>
            )}
          </h1>

          {/* Subtitle with Bridge Concept */}
          <p className="text-base sm:text-xl font-normal text-slate-300 tracking-wide leading-relaxed">
            {language === "gu"
              ? "પ્રાથમિક શાળાના બાળકો માટે સ્માર્ટ લર્નિંગ ગેપ ટ્રેકિંગ અને ઉપચારાત્મક શિક્ષણ પ્રણાલી. ત્રુટિથી સિદ્ધિ સુધીનો ભરોસાપાત્ર સેતુ."
              : "Smart tracking and actionable 5-step remedial system for student learning gaps in primary schools. The glowing bridge carrying every child from foundational hurdle to complete mastery."}
          </p>

          {/* ShikshaBot Floating Speech Bubble Companion */}
          <div className="inline-flex items-center gap-3 p-3.5 pr-5 rounded-2xl bg-[#2B2A6B]/80 border border-amber-500/30 backdrop-blur-xl shadow-[0_0_25px_rgba(255,138,61,0.2)] animate-bounce-subtle">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-amber-500/40 shrink-0">
              🤖
            </div>
            <p className="text-xs sm:text-sm font-medium text-amber-200">
              {activeSpeech}
            </p>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="saffron"
                size="lg"
                className="rounded-full shadow-[0_0_30px_rgba(255,138,61,0.4)] text-sm font-black"
              >
                <span>{language === "gu" ? "શિક્ષાસેતુ AI જુઓ" : "Explore ShikshaSetu AI"}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            <Link href="/tutorial">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-amber-500/60 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400 text-sm font-bold shadow-[0_0_20px_rgba(255,138,61,0.3)] flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{language === "gu" ? "નવા શિક્ષક માટે ટ્યુટોરિયલ" : "New User? Tutorial & Guide"}</span>
              </Button>
            </Link>

            <a
              href="#solution"
              onClick={(e) => handleSmoothScroll(e, "#solution")}
            >
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-slate-700 bg-slate-900/70 text-slate-200 hover:text-white hover:border-amber-500/40 text-sm font-bold"
              >
                <Compass className="w-4 h-4 text-amber-400 mr-1" />
                <span>{language === "gu" ? "કેવી રીતે કાર્ય કરે છે?" : "See How It Works"}</span>
              </Button>
            </a>
          </div>

          {/* New User Welcome Quick-Start Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-950/60 to-purple-950/40 border border-amber-500/35 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
                📖
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{language === "gu" ? "નવા વપરાશકર્તા છો? વેબસાઇટ કેવી રીતે વાપરવી તે જાણો" : "New user? Learn how to handle this website"}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    {language === "gu" ? "માર્ગદર્શિકા" : "Tutorial"}
                  </span>
                </p>
                <p className="text-[11px] text-slate-300">
                  {language === "gu"
                    ? "૩ મિનિટમાં ૪ સરળ પગલાં, આરવ પટેલનો કેસ સ્ટડી અને પ્રિન્ટેબલ ગાઈડ જુઓ."
                    : "Complete 3-min visual guide, Aarav's case study, and teacher desk reference sheet."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/tutorial"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-colors shadow-xs"
              >
                {language === "gu" ? "ટ્યુટોરિયલ ખોલો →" : "Open Tutorial →"}
              </Link>
              <Link
                href="/tutorial/print"
                className="px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
              >
                {language === "gu" ? "પ્રિન્ટ ગાઈડ" : "Print Sheet"}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="pt-8">
          <a
            href="#challenge"
            onClick={(e) => handleSmoothScroll(e, "#challenge")}
            aria-label="Scroll down to explore sections"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 group-hover:text-amber-300">
              ↓ SCROLL TO CROSS THE BRIDGE
            </span>
          </a>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 2: THE CHALLENGE — 3 Tilt Cards & 30 Desks Classroom     */}
      {/* ================================================================ */}
      <section
        id="challenge"
        className="relative min-h-[100svh] w-full flex items-center py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10"
      >
        <div className="max-w-2xl text-left space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/40 px-3.5 py-1 text-xs font-semibold text-rose-300 shadow-[0_0_15px_rgba(255,92,108,0.2)] backdrop-blur-md">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>The Primary Classroom Reality</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {language === "gu"
              ? "૩૦ બાળકોના વર્ગખંડમાં છુપાયેલી ત્રુટિઓ."
              : "Hidden Gaps in a Classroom of 30."}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {language === "gu"
              ? "વર્ગખંડમાં સરેરાશ ૩૦ વિદ્યાર્થીઓ હોય ત્યારે ગણિતના પાયાના ખ્યાલો (જેમ કે ભાગાકાર કે સ્થાનકિંમત) કે ગુજરાતી ભાષાના જોડાક્ષરોમાં રહેલી મુશ્કેલીઓ વાર્ષિક પરીક્ષા સુધી અદૃશ્ય રહે છે."
              : "In primary classrooms of 30+ students, subtle conceptual hurdles in foundational division, place value, or language comprehension often remain undetected behind aggregate test scores."}
          </p>

          {/* 3 Scroll-Linked Tilt Cards */}
          <div className="space-y-3.5 pt-2">
            <Tilt3DCard glowColor="rgba(255, 92, 108, 0.2)">
              <Card variant="glass" className="p-4 border-rose-500/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    01
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Gaps Go Unnoticed</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Aggregate pass percentages mask critical individual learning obstacles until it is too late to intervene.
                    </p>
                  </div>
                </div>
              </Card>
            </Tilt3DCard>

            <Tilt3DCard glowColor="rgba(255, 138, 61, 0.2)">
              <Card variant="glass" className="p-4 border-amber-500/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    02
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Every Student Needs Different Support</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Rote repetition fails. One child needs tactile counting beads, another requires visual number lines or interactive flashcards.
                    </p>
                  </div>
                </div>
              </Card>
            </Tilt3DCard>

            <Tilt3DCard glowColor="rgba(61, 219, 169, 0.2)">
              <Card variant="glass" className="p-4 border-emerald-500/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    03
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Progress Should Be Measurable</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Without empirical percentage-point (+pp) delta tracking before and after remediation, teachers cannot verify genuine mastery.
                    </p>
                  </div>
                </div>
              </Card>
            </Tilt3DCard>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 3: THE SOLUTION / 4 PHASES — Traveling Along The Bridge   */}
      {/* ================================================================ */}
      <section
        id="solution"
        className="relative min-h-[100svh] w-full flex items-center py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10"
      >
        <div className="w-full space-y-10">
          <div className="max-w-2xl text-left space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1 text-xs font-semibold text-amber-300 shadow-[0_0_15px_rgba(255,138,61,0.2)] backdrop-blur-md">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>The 4-Station Bridge Journey</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {language === "gu"
                ? "સેતુના ૪ મહત્વપૂર્ણ તબક્કા."
                : "The 4 Stations Across The Bridge."}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {language === "gu"
                ? "મૂલ્યાંકનથી લઈને પરિણામ સુધીનું પદ્ધતિસરનું માર્ગદર્શન. કોઈ પણ મોંઘી API વિના સંપૂર્ણ ઑફલાઇન ચાલે છે."
                : "From diagnostic baseline to verifiable mastery: an explainable, deterministic 4-step pipeline designed for government primary schools."}
            </p>
          </div>

          {/* 4 Interactive Station Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Station 1: Assess */}
            <Tilt3DCard glowColor="rgba(56, 189, 248, 0.25)">
              <Card variant="glass" className="p-5 h-full flex flex-col justify-between border-sky-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800">
                      STATION 01
                    </span>
                    <ClipboardList className="w-5 h-5 text-sky-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">Assess</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Granular baseline recording across competency benchmarks. Digital scoring or paper worksheet entry.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-sky-400">
                  Diagnostic Input &rarr;
                </div>
              </Card>
            </Tilt3DCard>

            {/* Station 2: Detect Gaps */}
            <Tilt3DCard glowColor="rgba(255, 92, 108, 0.25)">
              <Card variant="glass" className="p-5 h-full flex flex-col justify-between border-rose-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800">
                      STATION 02
                    </span>
                    <BrainCircuit className="w-5 h-5 text-rose-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">Detect Gaps</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Transparent rule engine flags scores &lt; 60% with plain-language cognitive diagnosis: "Why flagged".
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-rose-400">
                  Explainable AI &rarr;
                </div>
              </Card>
            </Tilt3DCard>

            {/* Station 3: Remediation */}
            <Tilt3DCard glowColor="rgba(255, 138, 61, 0.25)">
              <Card variant="glass" className="p-5 h-full flex flex-col justify-between border-amber-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800">
                      STATION 03
                    </span>
                    <Layers className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">5-Step Remediation</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Actionable lesson plans with concrete manipulatives (counting beads, number lines, flashcards).
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-amber-400">
                  Targeted Action &rarr;
                </div>
              </Card>
            </Tilt3DCard>

            {/* Station 4: Reassess */}
            <Tilt3DCard glowColor="rgba(61, 219, 169, 0.25)">
              <Card variant="glass" className="p-5 h-full flex flex-col justify-between border-emerald-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                      STATION 04
                    </span>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">Reassess</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Empirical percentage-point (+pp) delta tracking to verify student crosses the 80% mastery threshold.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-emerald-400">
                  Verifiable Mastery &rarr;
                </div>
              </Card>
            </Tilt3DCard>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 4: FEATURES — 4 Interactive 3D Flip/Tilt Cards           */}
      {/* ================================================================ */}
      <section
        id="features"
        className="relative min-h-[90vh] w-full flex items-center py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10"
      >
        <div className="w-full space-y-10">
          <div className="max-w-2xl text-left space-y-3">
            <Badge variant="saffron" size="sm">
              Core Modules
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {language === "gu"
                ? "શિક્ષકો માટે સરળ અને શક્તિશાળી સાધનો."
                : "Everything Teachers Need to Close Learning Gaps."}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Each module is integrated, lightweight, and operates completely offline with instant sync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/learning-gaps">
              <Tilt3DCard glowColor="rgba(255, 92, 108, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-rose-500/50">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      Open Module &rarr;
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Smart Gap Detection</h3>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      Deterministic algorithm with a transparent 60% developing threshold. Explains the exact cognitive reason behind each learning gap.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Explainable AI</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Threshold Sandbox</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            <Link href="/remedial-plans">
              <Tilt3DCard glowColor="rgba(255, 138, 61, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-amber-500/50">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Layers className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      Open Module &rarr;
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Personalised Remedial Plans</h3>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      Structured 5-step remedial pathway tailored to concrete materials like counting beads, number lines, and peer activities.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">5 Concrete Steps</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Printable A4 Plans</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            <Link href="/activities">
              <Tilt3DCard glowColor="rgba(56, 189, 248, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-sky-500/50">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      Open Module &rarr;
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Activities &amp; Quizzes</h3>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      Dual-mode practice: interactive student tablet quizzes with immediate feedback and print-ready paper worksheets for rural classrooms.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Interactive Quiz</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Paper Mode</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            <Link href="/reports">
              <Tilt3DCard glowColor="rgba(61, 219, 169, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-emerald-500/50">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      Open Module &rarr;
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-white">Student Progress Analytics</h3>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      Official Gujarat Education Department print-ready A4 reports, before/after gain deltas, and class skill mastery trees.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">A4 Printable</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">Delta Analytics</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 5: LIVE DASHBOARD PREVIEW — 3D Tilted Tablet Mockup       */}
      {/* ================================================================ */}
      <section
        id="preview"
        className="relative min-h-[100svh] w-full flex items-center py-24 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto z-10"
      >
        <div className="w-full space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="mint" size="sm" pulse>
              Live Primary School Demonstration
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {language === "gu"
                ? "વાસ્તવિક ડેશબોર્ડ કાર્યપ્રણાલી."
                : "Real Classroom Data in Action."}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Explore the real cohort metrics and Aarav Patel's +50 pp recovery from 35% baseline to 85% mastery.
            </p>
          </div>

          {/* 3D Tilted Tablet Mockup */}
          <div className="max-w-6xl mx-auto">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 6: IMPACT — Big Animated Metrics                          */}
      {/* ================================================================ */}
      <section
        id="impact"
        className="relative min-h-[80vh] w-full flex items-center py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10"
      >
        <div className="w-full space-y-10">
          <div className="max-w-2xl text-left space-y-3">
            <Badge variant="saffron" size="sm">
              Pedagogical Results
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {language === "gu"
                ? "પરિણામો જે વિશ્વાસ આપે છે."
                : "Proven Pedagogical Impact."}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Empirical evidence from our primary school testbed demonstrates measurable academic acceleration.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="glass" className="p-6 border-amber-500/40 shadow-[0_0_25px_rgba(255,138,61,0.2)]">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-amber-400 drop-shadow-[0_0_20px_rgba(255,138,61,0.5)]">
                +50 pp
              </span>
              <p className="text-sm font-bold text-white mt-2">Demonstrated Gain</p>
              <p className="text-xs text-slate-400 mt-1">
                Aarav Patel: 35% &rarr; 85% in Division Basics
              </p>
            </Card>

            <Card variant="glass" className="p-6 border-slate-800">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-emerald-400">
                100%
              </span>
              <p className="text-sm font-bold text-white mt-2">Offline-First</p>
              <p className="text-xs text-slate-400 mt-1">
                Zero external paid API cost; runs anywhere
              </p>
            </Card>

            <Card variant="glass" className="p-6 border-slate-800">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-sky-400">
                5 Steps
              </span>
              <p className="text-sm font-bold text-white mt-2">Concrete Plans</p>
              <p className="text-xs text-slate-400 mt-1">
                Beads, number lines &amp; formative delta
              </p>
            </Card>

            <Card variant="glass" className="p-6 border-slate-800">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-indigo-400">
                2 Modes
              </span>
              <p className="text-sm font-bold text-white mt-2">Digital &amp; Paper</p>
              <p className="text-xs text-slate-400 mt-1">
                Instant interactive tablet or printable A4 sheets
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 7: FINAL CALL TO ACTION & FOOTER                          */}
      {/* ================================================================ */}
      <section
        id="cta"
        className="relative min-h-[90vh] w-full flex items-center justify-center py-24 px-6 sm:px-12 lg:px-20 max-w-5xl mx-auto text-center z-10"
      >
        <div className="space-y-6">
          <Badge variant="saffron" size="md">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 mr-1" />
            <span>Dedicated to Gujarat Primary Education</span>
          </Badge>

          <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {language === "gu"
              ? "ચાલો દરેક બાળકને આગળ વધારીએ."
              : "Let's Help Every Child Move Forward."}
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {language === "gu"
              ? "આજથી જ પ્રાથમિક શાળાઓમાં અધ્યયન ત્રુટિઓ શોધો, વ્યક્તિગત ઉપચારાત્મક યોજનાઓ અમલમાં મૂકો અને વાસ્તવિક પ્રગતિ નોંધો."
              : "Empower primary school teachers with instant gap detection, actionable 5-step remedial pathways, and verifiable student progress today."}
          </p>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="saffron"
                size="lg"
                className="rounded-full shadow-[0_0_35px_rgba(255,138,61,0.5)] font-black text-base px-8 py-6"
              >
                <span>{language === "gu" ? "શરૂ કરો (ડેશબોર્ડ)" : "Get Started (Dashboard)"}</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-slate-700 bg-slate-900/80 text-white hover:border-amber-500/50 font-bold px-7 py-6"
              >
                <LogIn className="w-4 h-4 text-amber-400 mr-2" />
                <span>{t.nav?.login || "Sign In (1-Click Demo)"}</span>
              </Button>
            </Link>
          </div>

          {/* Quick Module Portal Shortcuts */}
          <div className="pt-10 border-t border-slate-800 max-w-2xl mx-auto">
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">
              Explore Live System Modules
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <Link
                href="/students"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                Student Directory &rarr;
              </Link>
              <Link
                href="/learning-gaps"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                Learning Gaps &rarr;
              </Link>
              <Link
                href="/remedial-plans"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                Remedial Plans &rarr;
              </Link>
              <Link
                href="/activities"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                Quizzes &amp; Worksheets &rarr;
              </Link>
              <Link
                href="/reports"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                Printable Reports &rarr;
              </Link>
              <Link
                href="/assessments"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                Scoring Grid &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER & CONTACT SECTION                                         */}
      {/* ================================================================ */}
      <footer id="contact" className="relative bg-[#0b0a21] text-slate-400 border-t border-slate-800 pt-16 pb-12 z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Col 1 & 2: Brand Information */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-base shadow-[0_0_15px_rgba(255,138,61,0.4)]">
                  શ
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-extrabold text-base text-white">
                    ShikshaSetu AI
                  </span>
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                    The Learning Gap Bridge
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Built for SFIC Gujarat Hackathon 2026, Problem Statement PS-60. An intelligent offline-first tracking and remedial action system carrying every primary student across the bridge from learning gaps to verifiable mastery.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Gandhinagar, Gujarat, India</span>
              </div>
            </div>

            {/* Col 3: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/dashboard" className="hover:text-amber-400 transition-colors">Teacher Dashboard</Link></li>
                <li><Link href="/students" className="hover:text-amber-400 transition-colors">Student Profiles</Link></li>
                <li><Link href="/learning-gaps" className="hover:text-amber-400 transition-colors">Gap Detection Engine</Link></li>
                <li><Link href="/remedial-plans" className="hover:text-amber-400 transition-colors">5-Step Remedial Plans</Link></li>
                <li><Link href="/reports" className="hover:text-amber-400 transition-colors">Printable A4 Reports</Link></li>
                <li><Link href="/tutorial" className="hover:text-amber-400 transition-colors font-bold text-amber-300">Tutorial &amp; Help Center</Link></li>
              </ul>
            </div>

            {/* Col 4: Hackathon Spec */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Compliance &amp; Tech
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> PS-60 Primary Schools</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 60% Benchmark Threshold</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100% Offline PWA</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Zero Paid APIs</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Gujarati &amp; English</li>
              </ul>
            </div>

            {/* Col 5: Feedback Form */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Jury &amp; Teacher Feedback
              </h4>
              <form onSubmit={handleFeedbackSubmit} className="space-y-2">
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
                <Button
                  type="submit"
                  variant="saffron"
                  size="sm"
                  className="w-full rounded-xl text-xs"
                >
                  {feedbackSent ? "Thank You!" : "Submit Feedback"}
                </Button>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2026 ShikshaSetu AI • SFIC Gujarat Hackathon PS-60. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>English / ગુજરાતી Support</span>
              <span>Offline Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
