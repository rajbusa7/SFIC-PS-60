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
  Bot,
  Languages,
  MessageSquare,
  Share2,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const { t, language } = useLanguage();

  const botSpeeches = [
    {
      en: "Hi! I'm SaathiBot. Let's build the glowing bridge from learning gaps to mastery!",
      gu: "નમસ્તે! હું સાથીબોટ છું. ચાલો અધ્યયન ત્રુટિઓને દૂર કરીને સફળતાનો સાથી બનાવીએ!",
    },
    {
      en: "Aarav Patel went from 35% to 85% mastery using our 5-step concrete bean-counting remedial pathway!",
      gu: "આરવ પટેલે ૫-તબક્કાની ઉપચાર યોજના દ્વારા ૩૫% થી ૮૫% ની સિદ્ધિ મેળવી (+૫૦ pp પ્રગતિ)!",
    },
    {
      en: "100% offline-first: no paid APIs, runs on local school hardware, and translates notices to Gujarati automatically.",
      gu: "૧૦૦% ઑફલાઇન: શાળાના કમ્પ્યુટર પર સ્થાનિક રીતે ચાલે છે અને વાલીઓ માટે ગુજરાતીમાં આપોઆપ અનુવાદ કરે છે.",
    },
  ];

  const [speechIndex, setSpeechIndex] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackEmail, setFeedbackEmail] = useState("");

  const activeSpeech = language === "gu" ? botSpeeches[speechIndex].gu : botSpeeches[speechIndex].en;

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const elem = document.querySelector(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackEmail) return;

    setFeedbackSending(true);
    setFeedbackError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: feedbackEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackSent(true);
        setTimeout(() => setFeedbackSent(false), 5000);
        setFeedbackEmail("");
      } else {
        setFeedbackError(data.error || "Failed to submit feedback.");
      }
    } catch {
      setFeedbackError("Network error. Please try again.");
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#14123D] text-slate-100 selection:bg-amber-500 selection:text-black overflow-x-hidden font-sans">
      {/* 1. Persistent 3D The Bridge WebGL Canvas in Background */}
      <BridgeCanvas3D />

      {/* 2. Glass Sticky Navbar */}
      <LandingNavbar />

      {/* ================================================================ */}
      {/* SECTION 1: HERO — "THE BRIDGE" (Gap to Mastery)                   */}
      {/* ================================================================ */}
      <section
        id="hero"
        className="relative min-h-[100svh] w-full flex flex-col justify-between pt-28 pb-10 sm:pt-36 sm:pb-14 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10"
      >
        <div className="my-auto max-w-2xl text-left space-y-6 pt-4 sm:pt-8">
          {/* Hackathon & Platform Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Badge variant="saffron" size="sm" pulse>
              SFIC Gujarat Hackathon 2026 • PS-60
            </Badge>
            <Badge variant="mint" size="sm">
              100% Offline-First
            </Badge>
            <Badge variant="indigo" size="sm">
              Zero Paid APIs
            </Badge>
            <Badge variant="saffron" size="sm">
              {language === "gu" ? "દ્વિભાષી: ગુજરાતી + English" : "Bilingual: English + ગુજરાતી"}
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
              ? "પ્રાથમિક શાળાના બાળકો માટે સ્માર્ટ લર્નિંગ ગેપ ટ્રેકિંગ અને ૫-તબક્કા ઉપચારાત્મક શિક્ષણ પ્રણાલી. ત્રુટિથી સિદ્ધિ સુધીનો ભરોસાપાત્ર સેતુ."
              : "Smart tracking and actionable 5-step remedial system for student learning gaps in primary schools. The glowing bridge carrying every child from foundational hurdle to complete mastery."}
          </p>

          {/* SaathiBot Interactive Speech Bubble Companion */}
          <div
            onClick={() => setSpeechIndex((prev) => (prev + 1) % botSpeeches.length)}
            title="Click to hear another insight from SaathiBot"
            className="inline-flex items-center gap-3 p-3.5 pr-5 rounded-2xl bg-[#1c194a]/90 border border-amber-500/35 backdrop-blur-xl shadow-[0_0_25px_rgba(255,138,61,0.25)] hover:border-amber-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-amber-500/40 shrink-0 group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4 text-slate-950" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-amber-200 leading-snug">
                {activeSpeech}
              </p>
              <span className="text-[10px] text-amber-400/70 font-semibold block mt-0.5">
                {language === "gu" ? "ક્લિક કરો અન્ય જાણકારી માટે ↻" : "Click to cycle insight ↻"}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="pt-1 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link href="/dashboard">
              <Button
                variant="saffron"
                size="lg"
                className="rounded-full shadow-[0_0_30px_rgba(255,138,61,0.45)] text-sm font-black active:scale-95 transition-all"
              >
                <span>{language === "gu" ? "StudySaathi ડેશબોર્ડ ખોલો" : "Explore StudySaathi Dashboard"}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            <Link href="/tutorial">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-amber-500/60 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400 text-sm font-bold shadow-[0_0_20px_rgba(255,138,61,0.25)] flex items-center gap-2 active:scale-95 transition-all"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{language === "gu" ? "શિક્ષક માર્ગદર્શિકા (૫ મિનિટ)" : "Teacher Tutorial & Guide"}</span>
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
                <Compass className="w-4 h-4 text-amber-400 mr-1.5" />
                <span>{language === "gu" ? "કેવી રીતે કાર્ય કરે છે?" : "See How It Works"}</span>
              </Button>
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
              <div className="text-base sm:text-lg font-black text-amber-400">15+</div>
              <div className="text-[11px] text-slate-300">
                {language === "gu" ? "વિદ્યાર્થીઓ ટ્રેક થયા" : "Students Tracked"}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
              <div className="text-base sm:text-lg font-black text-emerald-400">+50 pp</div>
              <div className="text-[11px] text-slate-300">
                {language === "gu" ? "આરવનો પ્રગતિ ગેઇન" : "Aarav Gain Delta"}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
              <div className="text-base sm:text-lg font-black text-sky-400">60%</div>
              <div className="text-[11px] text-slate-300">
                {language === "gu" ? "બેન્ચમાર્ક થ્રેશોલ્ડ" : "Mastery Benchmark"}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
              <div className="text-base sm:text-lg font-black text-indigo-400">100%</div>
              <div className="text-[11px] text-slate-300">
                {language === "gu" ? "સ્થાનિક ઑફલાઇન" : "Offline Capable"}
              </div>
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
              {language === "gu" ? "↓ આગળ વધો — સેતુના પડકારો જુઓ" : "↓ SCROLL TO CROSS THE BRIDGE"}
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
            <span>
              {language === "gu" ? "પ્રાથમિક વર્ગખંડની વાસ્તવિકતા" : "The Primary Classroom Reality"}
            </span>
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

          {/* 3 Scroll-Linked Tilt Cards with Full Bilingual Support */}
          <div className="space-y-3.5 pt-2">
            <Tilt3DCard glowColor="rgba(255, 92, 108, 0.2)">
              <Card variant="glass" className="p-4 border-rose-500/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    01
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {language === "gu" ? "ત્રુટિઓ અદૃશ્ય રહી જાય છે" : "Gaps Go Unnoticed"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {language === "gu"
                        ? "કુલ પાસ ટકાવારી વ્યક્તિગત શીખવાની મુશ્કેલીઓને ઢાંકી દે છે જ્યાં સુધી વાર્ષિક પરીક્ષામાં ઘણું મોડું ન થઈ જાય."
                        : "Aggregate pass percentages mask critical individual learning obstacles until it is too late to intervene."}
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
                    <h3 className="text-sm font-bold text-white">
                      {language === "gu" ? "દરેક બાળકને અલગ સહાયની જરૂર" : "Every Student Needs Different Support"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {language === "gu"
                        ? "ગોખણપટ્ટી નિષ્ફળ જાય છે. એક બાળકને મણકાની જરૂર છે, બીજાને સંખ્યા રેખા કે પરસ્પર જૂથ ચર્ચાની."
                        : "Rote repetition fails. One child needs tactile counting beads, another requires visual number lines or interactive flashcards."}
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
                    <h3 className="text-sm font-bold text-white">
                      {language === "gu" ? "પ્રગતિ પ્રમાણિત અને માપી શકાય તેવી હોવી જોઈએ" : "Progress Should Be Measurable"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {language === "gu"
                        ? "ઉપચાર પહેલાં અને પછીના ટકાવારી પોઈન્ટ (+pp) ડેટા વિના વાસ્તવિક માસ્ટરી ચકાસવી અશક્ય છે."
                        : "Without empirical percentage-point (+pp) delta tracking before and after remediation, teachers cannot verify genuine mastery."}
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
              <span>
                {language === "gu" ? "૪ તબક્કાની સેતુ યાત્રા" : "The 4-Station Bridge Journey"}
              </span>
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
                      {language === "gu" ? "તબક્કો ૦૧" : "STATION 01"}
                    </span>
                    <ClipboardList className="w-5 h-5 text-sky-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {language === "gu" ? "મૂલ્યાંકન" : "Assess"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "પ્રારંભિક સ્કોર રેકોર્ડિંગ. ડિજિટલ સ્કોરિંગ અથવા કાગળની વર્કશીટ એન્ટ્રી દ્વારા પાયાનું નિદાન."
                      : "Granular baseline recording across competency benchmarks. Digital scoring or paper worksheet entry."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-sky-400">
                  {language === "gu" ? "નિદાન ઇનપુટ →" : "Diagnostic Input →"}
                </div>
              </Card>
            </Tilt3DCard>

            {/* Station 2: Detect Gaps */}
            <Tilt3DCard glowColor="rgba(255, 92, 108, 0.25)">
              <Card variant="glass" className="p-5 h-full flex flex-col justify-between border-rose-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800">
                      {language === "gu" ? "તબક્કો ૦૨" : "STATION 02"}
                    </span>
                    <BrainCircuit className="w-5 h-5 text-rose-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {language === "gu" ? "ત્રુટિ શોધ" : "Detect Gaps"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "પારદર્શક નિયમ એન્જિન ૬૦% થી નીચેના ગુણ ઓળખીને સરળ ગુજરાતીમાં સમજૂતી આપે છે કે ત્રુટિ કેમ થઈ."
                      : "Transparent rule engine flags scores < 60% with plain-language cognitive diagnosis: 'Why flagged'."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-rose-400">
                  {language === "gu" ? "સ્પષ્ટ AI વિશ્લેષણ →" : "Explainable AI →"}
                </div>
              </Card>
            </Tilt3DCard>

            {/* Station 3: Remediation */}
            <Tilt3DCard glowColor="rgba(255, 138, 61, 0.25)">
              <Card variant="glass" className="p-5 h-full flex flex-col justify-between border-amber-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800">
                      {language === "gu" ? "તબક્કો ૦૩" : "STATION 03"}
                    </span>
                    <Layers className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {language === "gu" ? "૫-તબક્કા ઉપચાર" : "5-Step Remediation"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "સરળ ઉપલબ્ધ સાધનો (મણકા, સંખ્યા રેખા, જોડીદાર કાર્ય) આધારિત વ્યવહારુ ૫-પગલાંની ઉપચાર યોજના."
                      : "Actionable lesson plans with concrete manipulatives (counting beads, number lines, flashcards)."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-amber-400">
                  {language === "gu" ? "લક્ષિત ઉપચાર પગલાં →" : "Targeted Action →"}
                </div>
              </Card>
            </Tilt3DCard>

            {/* Station 4: Reassess */}
            <Tilt3DCard glowColor="rgba(61, 219, 169, 0.25)">
              <Card variant="glass" className="p-5 h-full flex flex-col justify-between border-emerald-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                      {language === "gu" ? "તબક્કો ૦૪" : "STATION 04"}
                    </span>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {language === "gu" ? "પુનઃ મૂલ્યાંકન" : "Reassess"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "વાસ્તવિક ટકાવારી પોઈન્ટ (+pp) વધારો નોંધવો અને વિદ્યાર્થી ૮૦% માસ્ટરી સુધી પહોંચ્યો તેની પુષ્ટિ."
                      : "Empirical percentage-point (+pp) delta tracking to verify student crosses the 80% mastery threshold."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-[11px] font-mono text-emerald-400">
                  {language === "gu" ? "પ્રમાણિત માસ્ટરી →" : "Verifiable Mastery →"}
                </div>
              </Card>
            </Tilt3DCard>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SPOTLIGHT CASE STUDY: AARAV PATEL'S RECOVERY (+50 pp)             */}
      {/* ================================================================ */}
      <section className="relative py-12 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#1b174a]/90 to-emerald-500/15 border border-amber-500/35 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "gu" ? "વાસ્તવિક કેસ સ્ટડી • ધોરણ ૪-અ" : "Live Case Study • Class 4-A"}</span>
              </div>
              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                {language === "gu"
                  ? "આરવ પટેલ: ૩૫% થી ૮૫% ની સાચી સિદ્ધિ (+૫૦ pp)"
                  : "Aarav Patel: From 35% Baseline to 85% Mastery (+50 pp)"}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {language === "gu"
                  ? "ગણિતમાં ૨-અંકના ભાગાકારમાં મુશ્કેલી અનુભવતો આરવ પટેલ, StudySaathi ના ૫-પગલાંના મણકા અને સંખ્યા રેખા ઉપચાર પછી પુનઃ મૂલ્યાંકનમાં ૮૫% સાથે ઉત્તીર્ણ થયો."
                  : "Diagnosed with foundational division hurdles, Aarav followed a concrete 5-step pathway using physical bean counters and peer modeling. Reassessment confirmed genuine mastery with a verified +50 percentage-point gain."}
              </p>
            </div>

            {/* Visual Progress Delta Bar */}
            <div className="w-full lg:w-80 p-4 rounded-2xl bg-slate-950/70 border border-white/10 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-rose-400">{language === "gu" ? "પ્રારંભ: ૩૫%" : "Initial: 35%"}</span>
                <span className="text-amber-400 font-mono font-black text-sm">+50 pp Gain</span>
                <span className="text-emerald-400">{language === "gu" ? "અંતિમ: ૮૫%" : "Mastered: 85%"}</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full w-[85%] transition-all duration-1000 shadow-[0_0_12px_rgba(61,219,169,0.5)]" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">{language === "gu" ? "સ્થિતિ: માસ્ટર થઈ ગયું" : "Status: Mastered"}</span>
                <Link
                  href="/students/std-aarav"
                  className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>{language === "gu" ? "આરવની પ્રોફાઈલ જુઓ" : "View Profile"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 4: 6 CORE MODULES (FEATURES) — Full Suite Showcase       */}
      {/* ================================================================ */}
      <section
        id="features"
        className="relative min-h-[90vh] w-full flex items-center py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto z-10"
      >
        <div className="w-full space-y-10">
          <div className="max-w-2xl text-left space-y-3">
            <Badge variant="saffron" size="sm">
              {language === "gu" ? "સંપૂર્ણ મોડ્યુલ સ્યુટ" : "Core System Modules"}
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {language === "gu"
                ? "શિક્ષકો માટે સરળ અને શક્તિશાળી ૬ સાધનો."
                : "6 Essential Tools to Close Primary Learning Gaps."}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {language === "gu"
                ? "દરેક મોડ્યુલ એકબીજા સાથે જોડાયેલું છે, હલકું છે અને ૧૦૦% ઑફલાઇન ચાલે છે."
                : "Every module is tightly integrated, lightweight, and operates completely offline with instant local synchronization."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Smart Gap Detection */}
            <Link href="/learning-gaps">
              <Tilt3DCard glowColor="rgba(255, 92, 108, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-rose-500/50 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        {language === "gu" ? "મોડ્યુલ ખોલો →" : "Open Module →"}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      {language === "gu" ? "સ્માર્ટ ત્રુટિ શોધ" : "Smart Gap Detection"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "gu"
                        ? "૬૦% ના થ્રેશોલ્ડ આધારિત સ્પષ્ટ નિયમ એન્જિન. દરેક ત્રુટિ પાછળનું વૈજ્ઞાનિક કારણ સરળ ભાષામાં સમજાવે છે."
                        : "Deterministic algorithm with a transparent 60% developing threshold. Explains the exact cognitive reason behind each learning gap."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">Explainable AI</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">&lt;60% Rule</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            {/* 2. Personalised Remedial Plans */}
            <Link href="/remedial-plans">
              <Tilt3DCard glowColor="rgba(255, 138, 61, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-amber-500/50 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        {language === "gu" ? "મોડ્યુલ ખોલો →" : "Open Module →"}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      {language === "gu" ? "૫-તબક્કા ઉપચાર યોજના" : "Personalised Remedial Plans"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "gu"
                        ? "મણકા, સ્થાનકિંમત ચાર્ટ અને સંખ્યા રેખા જેવા ઓછી કિંમતના સાધનો આધારિત પ્રિન્ટેબલ A4 ઉપચાર પાઠ."
                        : "Structured 5-step remedial pathways tailored to concrete materials like counting beads, number lines, and peer activities."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">5 Concrete Steps</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">Printable A4</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            {/* 3. Parent Bridge & Multilingual Notices */}
            <Link href="/notices">
              <Tilt3DCard glowColor="rgba(46, 125, 94, 0.3)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-emerald-500/50 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <Languages className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        {language === "gu" ? "મોડ્યુલ ખોલો →" : "Open Module →"}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      {language === "gu" ? "વાલી સેતુ & ગુજરાતી સૂચના" : "Parent Bridge & Notices"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "gu"
                        ? "શાળા સૂચનાઓનું આપોઆપ શુદ્ધ ગુજરાતીમાં અનુવાદ, વોટ્સએપ ડિલિવરી ટ્રેકિંગ અને વાલી સહયોગ."
                        : "Instant multilingual translation to Gujarati, WhatsApp-ready copy templates, and parent read receipt verification."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">WhatsApp Ready</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">ગુજરાતી Support</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            {/* 4. AI 5-in-1 Workspace Suite */}
            <Link href="/ai">
              <Tilt3DCard glowColor="rgba(99, 102, 241, 0.3)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-indigo-500/50 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        {language === "gu" ? "મોડ્યુલ ખોલો →" : "Open Module →"}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      {language === "gu" ? "AI ૫-ઇન-૧ વર્કસ્પેસ" : "AI 5-in-1 Workspace"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "gu"
                        ? "સ્માર્ટ ક્વિઝ જનરેટર, ગુજરાતી ઑડિયો સહાયક અને શિક્ષક માટે શિક્ષણ સહાયક સહાયક સાધનો."
                        : "Pedagogical tutor, instant quiz generator, audio assistant, and privacy prompt sanitizer."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">5-in-1 Suite</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">Offline Fallback</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            {/* 5. Activities & Quizzes */}
            <Link href="/activities">
              <Tilt3DCard glowColor="rgba(56, 189, 248, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-sky-500/50 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        {language === "gu" ? "મોડ્યુલ ખોલો →" : "Open Module →"}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      {language === "gu" ? "પ્રવૃત્તિઓ અને વર્કશીટ્સ" : "Activities & Quizzes"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "gu"
                        ? "દ્વિ-પદ્ધતિ: ટેબ્લેટ પર ઇન્ટરેક્ટિવ ક્વિઝ અને ગ્રામીણ શાળા માટે પ્રિન્ટેબલ કાગળ વર્કશીટ્સ."
                        : "Dual-mode practice: interactive student tablet quizzes with immediate feedback and print-ready paper worksheets for rural classrooms."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">Interactive Quiz</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">Paper Worksheets</span>
                  </div>
                </Card>
              </Tilt3DCard>
            </Link>

            {/* 6. Student Progress Analytics */}
            <Link href="/reports">
              <Tilt3DCard glowColor="rgba(61, 219, 169, 0.25)">
                <Card variant="interactive" className="p-6 space-y-4 border-slate-800 hover:border-emerald-500/50 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        {language === "gu" ? "મોડ્યુલ ખોલો →" : "Open Module →"}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      {language === "gu" ? "પ્રગતિ વિશ્લેષણ & A4 રિપોર્ટ્સ" : "Student Progress Analytics"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "gu"
                        ? "ગુજરાત શિક્ષણ વિભાગના માન્ય માળખા અનુસાર સત્તાવાર A4 રિપોર્ટ્સ અને +pp પ્રગતિ ટ્રેસિંગ."
                        : "Official Gujarat Education Department print-ready A4 reports, before/after gain deltas, and class skill mastery trees."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">A4 Printable</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">+pp Analytics</span>
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
              {language === "gu" ? "લાઈવ પ્રાથમિક શાળા નિદર્શન" : "Live Primary School Demonstration"}
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {language === "gu"
                ? "વાસ્તવિક ડેશબોર્ડ કાર્યપ્રણાલી."
                : "Real Classroom Data in Action."}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {language === "gu"
                ? "વાસ્તવિક વર્ગખંડ ડેટા અને આરવ પટેલના ૩૫% થી ૮૫% ની સિદ્ધિનો વાસ્તવિક ટ્રેક રેકોર્ડ જુઓ."
                : "Explore real cohort metrics and Aarav Patel's +50 pp recovery from 35% baseline to 85% mastery."}
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
              {language === "gu" ? "શિક્ષણશાસ્ત્રીય પરિણામો" : "Pedagogical Results"}
            </Badge>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {language === "gu"
                ? "પરિણામો જે વિશ્વાસ આપે છે."
                : "Proven Pedagogical Impact."}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {language === "gu"
                ? "પ્રાથમિક શાળાના ટેસ્ટબેડમાંથી મળેલા પ્રયોગાત્મક પુરાવા શૈક્ષણિક પ્રવેગ સાબિત કરે છે."
                : "Empirical evidence from our primary school testbed demonstrates measurable academic acceleration."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="glass" className="p-6 border-amber-500/40 shadow-[0_0_25px_rgba(255,138,61,0.2)]">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-amber-400 drop-shadow-[0_0_20px_rgba(255,138,61,0.5)]">
                +50 pp
              </span>
              <p className="text-sm font-bold text-white mt-2">
                {language === "gu" ? "પ્રમાણિત ગેઇન" : "Demonstrated Gain"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === "gu" ? "આરવ પટેલ: ૩૫% → ૮૫% (ભાગાકાર)" : "Aarav Patel: 35% → 85% in Division Basics"}
              </p>
            </Card>

            <Card variant="glass" className="p-6 border-slate-800">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-emerald-400">
                100%
              </span>
              <p className="text-sm font-bold text-white mt-2">
                {language === "gu" ? "સ્થાનિક ઑફલાઇન" : "Offline-First"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === "gu" ? "ઝીરો ચૂકવેલ API ખર્ચ; સર્વત્ર ચાલે છે" : "Zero external paid API cost; runs anywhere"}
              </p>
            </Card>

            <Card variant="glass" className="p-6 border-slate-800">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-sky-400">
                5 Steps
              </span>
              <p className="text-sm font-bold text-white mt-2">
                {language === "gu" ? "સ્પષ્ટ ઉપચાર પગલાં" : "Concrete Plans"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === "gu" ? "મણકા, સંખ્યા રેખા અને પરસ્પર સહયોગ" : "Beads, number lines & formative delta"}
              </p>
            </Card>

            <Card variant="glass" className="p-6 border-slate-800">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-indigo-400">
                2 Modes
              </span>
              <p className="text-sm font-bold text-white mt-2">
                {language === "gu" ? "ડિજિટલ & પેપર" : "Digital & Paper"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === "gu" ? "ટેબ્લેટ ક્વિઝ અથવા પ્રિન્ટેબલ A4 પત્રકો" : "Instant interactive tablet or printable A4 sheets"}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 7: FINAL CALL TO ACTION                                   */}
      {/* ================================================================ */}
      <section
        id="cta"
        className="relative min-h-[90vh] w-full flex items-center justify-center py-24 px-6 sm:px-12 lg:px-20 max-w-5xl mx-auto text-center z-10"
      >
        <div className="space-y-6">
          <Badge variant="saffron" size="md">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 mr-1.5" />
            <span>
              {language === "gu" ? "ગુજરાત પ્રાથમિક શિક્ષણને સમર્પિત" : "Dedicated to Gujarat Primary Education"}
            </span>
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
                className="rounded-full shadow-[0_0_35px_rgba(255,138,61,0.5)] font-black text-base px-8 py-6 active:scale-95 transition-all"
              >
                <span>{language === "gu" ? "શરૂ કરો (ડેશબોર્ડ ખોલો)" : "Get Started (Dashboard)"}</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-slate-700 bg-slate-900/80 text-white hover:border-amber-500/50 font-bold px-7 py-6 active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4 text-amber-400 mr-2" />
                <span>{language === "gu" ? "૧-ક્લિક ડેમો સાઇન ઇન" : "Sign In (1-Click Demo)"}</span>
              </Button>
            </Link>
          </div>

          {/* Quick Module Portal Shortcuts */}
          <div className="pt-10 border-t border-slate-800 max-w-3xl mx-auto">
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">
              {language === "gu" ? "લાઇવ સિસ્ટમ મોડ્યુલ્સ અન્વેષણ કરો" : "Explore Live System Modules"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <Link
                href="/students"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                {language === "gu" ? "વિદ્યાર્થી ડિરેક્ટરી →" : "Student Directory →"}
              </Link>
              <Link
                href="/learning-gaps"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                {language === "gu" ? "અધ્યયન ત્રુટિઓ →" : "Learning Gaps →"}
              </Link>
              <Link
                href="/remedial-plans"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                {language === "gu" ? "ઉપચારાત્મક યોજનાઓ →" : "Remedial Plans →"}
              </Link>
              <Link
                href="/notices"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                {language === "gu" ? "વાલી સેતુ સૂચના →" : "Parent Notices →"}
              </Link>
              <Link
                href="/ai"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                {language === "gu" ? "AI ૫-ઇન-૧ હબ →" : "AI Hub Suite →"}
              </Link>
              <Link
                href="/reports"
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-colors"
              >
                {language === "gu" ? "પ્રિન્ટેબલ A4 રિપોર્ટ્સ →" : "Printable Reports →"}
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
                  સ
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-extrabold text-base text-white">
                    StudySaathi AI
                  </span>
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                    {language === "gu" ? "અધ્યયન ત્રુટિ સેતુ પ્રણાલી" : "The Learning Gap Bridge"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                {language === "gu"
                  ? "SFIC ગુજરાત હેકાથોન ૨૦૨૬, સમસ્યા વિવરણ PS-60 માટે ખાસ નિર્મિત. પ્રાથમિક શાળાઓમાં ત્રુટિઓથી માસ્ટરી સુધીનો સ્માર્ટ સેતુ."
                  : "Built for SFIC Gujarat Hackathon 2026, Problem Statement PS-60. An intelligent offline-first tracking and remedial action system carrying every primary student across the bridge from learning gaps to verifiable mastery."}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Gandhinagar, Gujarat, India</span>
              </div>
            </div>

            {/* Col 3: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {language === "gu" ? "પ્લેટફોર્મ" : "Platform"}
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/dashboard" className="hover:text-amber-400 transition-colors">{language === "gu" ? "શિક્ષક ડેશબોર્ડ" : "Teacher Dashboard"}</Link></li>
                <li><Link href="/students" className="hover:text-amber-400 transition-colors">{language === "gu" ? "વિદ્યાર્થી પ્રોફાઇલ" : "Student Profiles"}</Link></li>
                <li><Link href="/learning-gaps" className="hover:text-amber-400 transition-colors">{language === "gu" ? "ત્રુટિ શોધ એન્જિન" : "Gap Detection Engine"}</Link></li>
                <li><Link href="/remedial-plans" className="hover:text-amber-400 transition-colors">{language === "gu" ? "૫-તબક્કા યોજના" : "5-Step Remedial Plans"}</Link></li>
                <li><Link href="/notices" className="hover:text-amber-400 transition-colors">{language === "gu" ? "વાલી સેતુ" : "Parent Bridge Notices"}</Link></li>
                <li><Link href="/ai" className="hover:text-amber-400 transition-colors">{language === "gu" ? "AI વર્કસ્પેસ" : "AI Hub Suite"}</Link></li>
                <li><Link href="/tutorial" className="hover:text-amber-400 transition-colors font-bold text-amber-300">{language === "gu" ? "ટ્યુટોરિયલ માર્ગદર્શિકા" : "Tutorial & Help Center"}</Link></li>
              </ul>
            </div>

            {/* Col 4: Hackathon Spec */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {language === "gu" ? "ટેકનિકલ માનક" : "Compliance & Tech"}
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> PS-60 Primary Schools</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 60% Benchmark Threshold</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100% Offline PWA</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Zero Paid APIs</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> ગુજરાતી + English</li>
              </ul>
            </div>

            {/* Col 5: Feedback Form */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {language === "gu" ? "પ્રતિસાદ ફોર્મ" : "Jury & Teacher Feedback"}
              </h4>
              <form onSubmit={handleFeedbackSubmit} className="space-y-2">
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder={language === "gu" ? "તમારું ઈમેઈલ લખો" : "Enter your email"}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
                {feedbackError && (
                  <p className="text-[11px] text-red-400 font-medium">{feedbackError}</p>
                )}
                <Button
                  type="submit"
                  variant="saffron"
                  size="sm"
                  disabled={feedbackSending}
                  className="w-full rounded-xl text-xs font-bold"
                >
                  {feedbackSending
                    ? (language === "gu" ? "મોકલી રહ્યું છે..." : "Submitting...")
                    : feedbackSent
                    ? (language === "gu" ? "આભાર!" : "Thank You!")
                    : (language === "gu" ? "પ્રતિસાદ સબમિટ કરો" : "Submit Feedback")}
                </Button>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2026 StudySaathi AI • SFIC Gujarat Hackathon PS-60. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>English / ગુજરાતી Support</span>
              <span>100% Offline Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
