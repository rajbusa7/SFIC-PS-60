"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { triggerPageTour } from "@/components/tutorial/SpotlightTour";
import {
  TUTORIAL_FAQS,
  TUTORIAL_GLOSSARY,
  TUTORIAL_LESSONS,
  RURAL_TIPS,
  FAQItem,
  GlossaryItem,
} from "@/lib/tutorialData";
import { fireCelebrationConfetti } from "@/lib/confetti";
import {
  BookOpen,
  Search,
  Sparkles,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  Boxes,
  Users,
  WifiOff,
  Compass,
  FileText,
  Lightbulb,
  ExternalLink,
  Check,
  X,
} from "lucide-react";

export default function TutorialPage() {
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    "workflow" | "lessons" | "sandbox" | "faq" | "glossary" | "tips"
  >("workflow");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-threshold");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Interactive Sandbox State (Section C: Aarav's Journey)
  const [sandboxStep, setSandboxStep] = useState<1 | 2 | 3 | 4>(1);
  const [sandboxScore, setSandboxScore] = useState<number>(35);
  const [sandboxPlanGenerated, setSandboxPlanGenerated] = useState(false);
  const [sandboxReassessed, setSandboxReassessed] = useState(false);

  // Filter FAQs based on search
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return TUTORIAL_FAQS;
    const q = searchQuery.toLowerCase();
    return TUTORIAL_FAQS.filter((faq) => {
      return (
        faq.questionEn.toLowerCase().includes(q) ||
        faq.questionGu.toLowerCase().includes(q) ||
        faq.answerEn.toLowerCase().includes(q) ||
        faq.answerGu.toLowerCase().includes(q) ||
        faq.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Filter Glossary based on search
  const filteredGlossary = useMemo(() => {
    if (!searchQuery.trim()) return TUTORIAL_GLOSSARY;
    const q = searchQuery.toLowerCase();
    return TUTORIAL_GLOSSARY.filter((item) => {
      return (
        item.termEn.toLowerCase().includes(q) ||
        item.termGu.toLowerCase().includes(q) ||
        item.defEn.toLowerCase().includes(q) ||
        item.defGu.toLowerCase().includes(q) ||
        item.exampleEn.toLowerCase().includes(q) ||
        item.exampleGu.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Filter Lessons based on search
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return TUTORIAL_LESSONS;
    const q = searchQuery.toLowerCase();
    return TUTORIAL_LESSONS.filter((les) => {
      return (
        les.titleEn.toLowerCase().includes(q) ||
        les.titleGu.toLowerCase().includes(q) ||
        les.descEn.toLowerCase().includes(q) ||
        les.descGu.toLowerCase().includes(q) ||
        les.tag.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Handle Sandbox Step Progression
  const handleSandboxAction = (step: number) => {
    if (step === 2) {
      setSandboxStep(2);
    } else if (step === 3) {
      setSandboxPlanGenerated(true);
      setSandboxStep(3);
    } else if (step === 4) {
      setSandboxScore(85);
      setSandboxReassessed(true);
      setSandboxStep(4);
      fireCelebrationConfetti();
    }
  };

  const resetSandbox = () => {
    setSandboxStep(1);
    setSandboxScore(35);
    setSandboxPlanGenerated(false);
    setSandboxReassessed(false);
  };

  const handlePrintGuide = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ============================================================== */}
        {/* HERO SECTION (3D Bridge / ShikshaBot Graphic + Action Buttons)  */}
        {/* ============================================================== */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#14123D] via-[#2B2A6B] to-[#14123D] border border-amber-500/30 p-6 sm:p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden text-white">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {t.tutorial?.badge || (language === "gu" ? "ગુજરાત પ્રાથમિક શિક્ષક માર્ગદર્શિકા" : "Gujarat Primary Teacher Guide")}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {t.tutorial?.heroTitle || (language === "gu" ? "૫ મિનિટમાં શિક્ષાસેતુ AI શીખો" : "Learn ShikshaSetu AI in 5 Minutes")}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {t.tutorial?.heroSubtitle ||
                  (language === "gu"
                    ? "શિક્ષણ ત્રુટિઓ શોધવા, ૫-પગલાંની ઉપચાર યોજના અમલમાં મૂકવા અને પરિણામ સુધારવા માટેની સરળ, દ્રશ્ય અને દ્વિભાષી માર્ગદર્શિકા."
                    : "Simple, visual, and short bilingual guide for Gujarat primary teachers to spot foundational gaps early, take 5-step remedial action, and verify student mastery.")}
              </p>

              {/* Action Buttons: Replay Tour & Download Print Guide */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="saffron"
                  size="sm"
                  onClick={() => triggerPageTour("dashboard")}
                  className="rounded-full text-xs font-bold shadow-md shadow-amber-500/30"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>{t.tutorial?.replayTour || (language === "gu" ? "માર્ગદર્શિત ટૂર ફરી જુઓ" : "Replay Guided Tour")}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintModal(true)}
                  className="rounded-full text-xs border-white/20 text-white hover:bg-white/10"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  <span>{t.tutorial?.quickStartPrint || (language === "gu" ? "ઝડપી શરૂઆત માર્ગદર્શિકા પ્રિન્ટ કરો" : "Download / Print Quick-Start Guide")}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setActiveTab("sandbox")}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>{t.tutorial?.trySandbox || (language === "gu" ? "ઇન્ટરેક્ટિવ ડેમો અજમાવો" : "Try Interactive Sandbox")}</span>
                </button>
              </div>
            </div>

            {/* Visual 3D Bridge / ShikshaBot Graphic Card */}
            <div className="relative w-full lg:w-72 h-48 sm:h-56 rounded-3xl bg-slate-950/60 border border-amber-500/30 p-4 flex flex-col justify-between shadow-2xl backdrop-blur-xl shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  Pedagogical Bridge Engine
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold">
                  100% Offline PWA
                </span>
              </div>

              {/* Miniature Bridge Diagram Visual */}
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-400 flex items-center gap-1">
                    <span>Gap: 35%</span>
                  </span>
                  <span className="text-amber-400 font-extrabold text-[11px]">+50 pp Gain</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span>Mastery: 85%</span>
                  </span>
                </div>

                <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full w-full animate-pulse" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Baseline</span>
                  <span>5-Step Remedial</span>
                  <span>Verified Re-test</span>
                </div>
              </div>

              {/* Bot Avatar Callout */}
              <div className="p-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs shrink-0 font-bold">
                  🤖
                </div>
                <p className="text-[10px] text-slate-200 leading-tight">
                  {language === "gu"
                    ? "શિક્ષાબોટ: કોઈ જટિલ સેટઅપ નથી. ૨ મિનિટમાં પરિણામ જુઓ!"
                    : "ShikshaBot: Zero configuration needed. See student gains in 2 minutes!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEARCH BOX & NAVIGATION TABS BAR                                */}
        {/* ============================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Instant Search Box - Big, Prominent & Showable */}
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400 pointer-events-none" />
            <input
              type="text"
              placeholder={
                t.tutorial?.searchPlaceholder ||
                (language === "gu"
                  ? "ટ્યુટોરિયલ, વિષય, નિયમો અને પ્રશ્નો શોધો..."
                  : "Search tutorials, classroom TLM, benchmarks, and FAQs...")
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-slate-700 bg-slate-900/90 py-2.5 pl-12 pr-10 text-sm text-white placeholder-slate-400 focus:border-amber-500 focus:bg-slate-900 focus:ring-4 focus:ring-amber-500/20 outline-hidden transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Section Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: "workflow", label: t.tutorial?.activeTabWorkflow || (language === "gu" ? "૪ પગલાં" : "How It Works"), icon: Layers },
              { id: "lessons", label: t.tutorial?.activeTabLessons || (language === "gu" ? "પાઠ માર્ગદર્શિકા" : "Lessons"), icon: BookOpen },
              { id: "sandbox", label: t.tutorial?.activeTabSandbox || (language === "gu" ? "ડેમો સેન્ડબોક્સ" : "Interactive Demo"), icon: Play },
              { id: "faq", label: t.tutorial?.activeTabFaq || (language === "gu" ? "પ્રશ્નોત્તરી (FAQ)" : "FAQs"), icon: HelpCircle },
              { id: "glossary", label: t.tutorial?.activeTabGlossary || (language === "gu" ? "શબ્દકોશ" : "Glossary"), icon: BrainCircuit },
              { id: "tips", label: t.tutorial?.activeTabTips || (language === "gu" ? "ગ્રામીણ ટિપ્સ" : "Rural Tips"), icon: Lightbulb },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION A: "HOW IT WORKS" (4 Animated Pedagogical Phases)       */}
        {/* ============================================================== */}
        {activeTab === "workflow" && (
          <div className="space-y-6">
            <Card variant="glass" className="p-6 border-slate-800 space-y-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>
                    {language === "gu"
                      ? "૪ તબક્કામાં શિક્ષણ ત્રુટિ નિવારણ પદ્ધતિ (આરવ પટેલ કેસ સ્ટડી)"
                      : "The 4-Phase Remedial Cycle (Aarav Patel Case Study)"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === "gu"
                    ? "મૂલ્યાંકનથી શરૂ કરીને પુનઃમૂલ્યાંકન સુધીનું પારદર્શક શૈક્ષણિક પરિભ્રમણ."
                    : "From baseline diagnostic test to verified mastery in 4 structured pedagogical steps."}
                </p>
              </div>

              {/* 4 Pipeline Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Phase 1 */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-heading font-black text-xs">
                    01
                  </div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {language === "gu" ? "૧. સંકલ્પના મૂલ્યાંકન" : "1. Diagnostic Assess"}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "આરવ પટેલ ભાગાકાર પ્રશ્નોમાં ૩૫% ગુણ મેળવે છે. સામાન્ય વર્ગમાં તે અટકી જતો હતો."
                      : "Aarav scores 35% on foundational division questions, revealing a core conceptual bottleneck."}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-rose-400 block pt-1">
                    Baseline: 35%
                  </span>
                </div>

                {/* Phase 2 */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-rose-600/30 text-rose-400 border border-rose-500/30 flex items-center justify-center font-heading font-black text-xs">
                    02
                  </div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {language === "gu" ? "૨. ત્રુટિ ઓળખ (<૬૦%)" : "2. Gap Detection (<60%)"}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "૬૦% થી ઓછા ગુણ થતાં સિસ્ટમ આપોઆપ ત્રુટિ ફ્લેગ કરે છે અને કારણ દર્શાવે છે."
                      : "Scores below 60% trigger an automatic Learning Gap with explainable cognitive reasoning."}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-amber-400 block pt-1">
                    Flag: Needs Support (&lt;60%)
                  </span>
                </div>

                {/* Phase 3 */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-amber-600/30 text-amber-400 border border-amber-500/30 flex items-center justify-center font-heading font-black text-xs">
                    03
                  </div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {language === "gu" ? "૩. ૫-પગલાંની ઉપચાર યોજના" : "3. Remedial Plan"}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "કાઉન્ટર મણકા અને નંબર-લાઇન દ્વારા ૫ પગલાંની મૂર્ત પ્રવૃત્તિઓ શિક્ષક કરાવે છે."
                      : "5 concrete steps deployed using physical manipulatives (beads in bowls) before abstract symbols."}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-teal-400 block pt-1">
                    5-Step Manipulatives
                  </span>
                </div>

                {/* Phase 4 */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-heading font-black text-xs">
                    04
                  </div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    {language === "gu" ? "૪. પુનઃમૂલ્યાંકન & વૃદ્ધિ" : "4. Reassess & Delta"}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === "gu"
                      ? "પ્રવૃત્તિ પછી ૫ પ્રશ્નોનો પુનઃટેસ્ટ લેતાં આરવ ૮૫% મેળવે છે (+૫૦ પોઇન્ટ વૃદ્ધિ!)."
                      : "Post-intervention check yields 85% mastery (+50 pp gain). The bridge turns fully green!"}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block pt-1">
                    Mastered: 85% (+50 pp)
                  </span>
                </div>
              </div>

              {/* Aarav Patel Before / After Bridge Comparison Visual */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {language === "gu" ? "આરવ પટેલ: વાસ્તવિક પ્રગતિ સેતુ" : "Aarav Patel: Real-World Bridge Delta"}
                    </h4>
                    <p className="text-[11px] text-slate-400">Class 4-A • Roll: STD-401 • Subject: Mathematics (Division Basics)</p>
                  </div>
                  <Link
                    href="/students/std-aarav"
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>{language === "gu" ? "આરવની પ્રોફાઇલ જુઓ" : "Open Student Profile"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Before vs After Bar Visual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/30 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-rose-400">Baseline Diagnostic</span>
                      <span className="font-black text-rose-400 font-mono">35%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full w-[35%]" />
                    </div>
                    <span className="text-[10px] text-slate-400">Status: Needs Support (&lt;60%)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-400">Post-Intervention Reassessment</span>
                      <span className="font-black text-emerald-400 font-mono">85% (+50 pp)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
                    </div>
                    <span className="text-[10px] text-slate-400">Status: Certified Mastery (&ge;80%)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION B: STEP-BY-STEP LESSON CARDS WITH ANIMATED MOCKUPS     */}
        {/* ============================================================== */}
        {activeTab === "lessons" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  variant="glass"
                  className="p-5 border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="indigo" size="sm">
                        {lesson.tag}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">Quick Step</span>
                    </div>

                    <h4 className="font-heading text-base font-bold text-white">
                      {language === "gu" ? lesson.titleGu : lesson.titleEn}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "gu" ? lesson.descGu : lesson.descEn}
                    </p>

                    {/* Miniature Animated CSS/SVG UI Mockup */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>Simulated Flow</span>
                        </span>
                        <span>Gujarat School PC</span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {lesson.steps.map((st, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-2 text-[11px] text-slate-200"
                          >
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                              {sIdx + 1}
                            </span>
                            <span className="leading-tight">
                              {language === "gu" ? st.gu : st.en}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === "gu" ? "૩૦ સેકન્ડમાં તૈયાર" : "30-sec task"}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("sandbox");
                      }}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === "gu" ? "અજમાવો" : "Try Demo"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION C: INTERACTIVE "TRY IT YOURSELF" DEMO SANDBOX           */}
        {/* ============================================================== */}
        {activeTab === "sandbox" && (
          <div className="space-y-6">
            <Card variant="glass" className="p-6 border-amber-500/40 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-white">
                      {language === "gu"
                        ? "ઇન્ટરેક્ટિવ સેન્ડબોક્સ: આરવ પટેલની ૫-પગલાંની સફર"
                        : "Interactive Sandbox: Aarav's Remedial Journey"}
                    </h3>
                    <Badge variant="mint" size="sm">
                      Zero Risk
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === "gu"
                      ? "કોઈ વાસ્તવિક ડેટા બદલાતો નથી. શિક્ષાબોટના માર્ગદર્શન સાથે દરેક પગલું જાતે અનુભવો."
                      : "Click through each step below with ShikshaBot hints. Safe demo mode with no real database modifications."}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSandbox}
                  className="rounded-full text-xs self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>{language === "gu" ? "ડેમો ફરી શરૂ કરો" : "Reset Demo"}</span>
                </Button>
              </div>

              {/* Progress Stepper for Sandbox */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { num: 1, label: language === "gu" ? "પ્રારંભિક ગુણ" : "1. Baseline Test" },
                  { num: 2, label: language === "gu" ? "ત્રુટિ કારણ" : "2. Gap Reason" },
                  { num: 3, label: language === "gu" ? "૫-પગલાં યોજના" : "3. 5-Step Plan" },
                  { num: 4, label: language === "gu" ? "પુનઃટેસ્ટ & નિપુણતા" : "4. Reassess & Master" },
                ].map((s) => (
                  <div
                    key={s.num}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      sandboxStep === s.num
                        ? "bg-amber-500/20 border-amber-500 text-white shadow-md font-bold"
                        : sandboxStep > s.num
                        ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-xs block">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Sandbox Interactive Display Window */}
              <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
                {/* Student Mini Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      આ
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Aarav Patel (Class 4-A)</h4>
                      <p className="text-[11px] text-slate-400">Concept: Division Basics (3-Digit ÷ 1-Digit)</p>
                    </div>
                  </div>

                  <Badge
                    variant={sandboxScore >= 80 ? "mastered" : "needsSupport"}
                    size="sm"
                  >
                    {sandboxScore >= 80 ? "Mastered" : "Needs Support"}
                  </Badge>
                </div>

                {/* Step 1 Content */}
                {sandboxStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-rose-300">Diagnostic Score Recorded: 35%</h5>
                        <p className="text-xs text-slate-300 mt-1">
                          Aarav answered only 2 out of 6 sharing word problems correctly. Because 35% is strictly below the 60% developing threshold, the rule engine flags this concept.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-amber-300 flex items-center gap-1.5">
                        <Bot className="w-4 h-4" />
                        <span>ShikshaBot: Click next to see why Aarav made this mistake.</span>
                      </div>
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={() => handleSandboxAction(2)}
                        className="rounded-full text-xs font-bold"
                      >
                        <span>Inspect Gap Reason &rarr;</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2 Content */}
                {sandboxStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                        <BrainCircuit className="w-4 h-4 text-amber-400" />
                        <span>Transparent Pedagogical Diagnostic:</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        &quot;Aarav interprets division as repeated subtraction rather than equal grouping. When dealing with multi-digit numbers, he attempts direct subtraction from the tens column without carrying remainders.&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-amber-300 flex items-center gap-1.5">
                        <Bot className="w-4 h-4" />
                        <span>ShikshaBot: Now generate the 5-step concrete manipulative plan!</span>
                      </div>
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={() => handleSandboxAction(3)}
                        className="rounded-full text-xs font-bold"
                      >
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        <span>Generate 5-Step Plan &rarr;</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3 Content */}
                {sandboxStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-teal-300">
                        5-Step Remedial Curricula Ready:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <strong>Step 1:</strong> Baseline check (10 mins)
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <strong>Step 2:</strong> 15 counting beads in bowls (20 mins)
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <strong>Step 3:</strong> Visual number line jumping (15 mins)
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <strong>Step 4:</strong> Interactive tablet quiz (15 mins)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-amber-300 flex items-center gap-1.5">
                        <Bot className="w-4 h-4" />
                        <span>ShikshaBot: Teacher finishes classroom activities and inputs the re-test!</span>
                      </div>
                      <Button
                        variant="mint"
                        size="sm"
                        onClick={() => handleSandboxAction(4)}
                        className="rounded-full text-xs font-black shadow-md shadow-emerald-500/20"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>Record 85% Re-test &rarr;</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4 Content (Celebration) */}
                {sandboxStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-center py-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Verified Mastery Achieved! (+50 pp gain)</span>
                    </div>

                    <h4 className="font-heading text-xl font-black text-white">
                      Aarav Advanced from 35% to 85%! 🎉
                    </h4>

                    <p className="text-xs text-slate-300 max-w-lg mx-auto">
                      By deploying tactile beads and number lines, Aarav bridged the conceptual gap. The student is now marked as &quot;Mastered&quot; with zero stigma.
                    </p>

                    <div className="pt-2 flex justify-center gap-3">
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={resetSandbox}
                        className="rounded-full text-xs font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>Try Another Simulation</span>
                      </Button>

                      <Link href="/students/std-aarav">
                        <Button variant="outline" size="sm" className="rounded-full text-xs text-white">
                          <span>View Real Aarav Profile</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION D: OFFLINE FAQ ACCORDION (Instant Keyword Filtered)     */}
        {/* ============================================================== */}
        {activeTab === "faq" && (
          <div className="space-y-4">
            <Card variant="glass" className="p-6 border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    <span>{language === "gu" ? "વારંવાર પૂછાતા પ્રશ્નો (FAQ)" : "Frequently Asked Questions (Offline)"}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === "gu"
                      ? "પ્રાથમિક શાળાના શિક્ષકો માટે સામાન્ય પ્રશ્નો અને તેના સરળ ઉત્તરો."
                      : "Answers tailored for Gujarat primary school teachers. Works 100% offline."}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {filteredFaqs.length} questions
                </span>
              </div>

              {filteredFaqs.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  No questions matched your search query. Try searching for &quot;60%&quot;, &quot;offline&quot;, or &quot;print&quot;.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    const question = language === "gu" ? faq.questionGu : faq.questionEn;
                    const answer = language === "gu" ? faq.answerGu : faq.answerEn;

                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <span className="font-heading text-xs sm:text-sm font-bold text-white pr-4">
                            {question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-150">
                            <p>{answer}</p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              {faq.keywords.map((kw, kIdx) => (
                                <span
                                  key={kIdx}
                                  className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION E: BILINGUAL GLOSSARY OF SIMPLE TERMS                   */}
        {/* ============================================================== */}
        {activeTab === "glossary" && (
          <div className="space-y-4">
            <Card variant="glass" className="p-6 border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-amber-400" />
                    <span>{language === "gu" ? "દ્વિભાષી શૈક્ષણિક શબ્દકોશ" : "Bilingual Educational Glossary"}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Plain-language explanations in English and ગુજરાતી for primary educators.
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {filteredGlossary.length} terms
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGlossary.map((term) => (
                  <div
                    key={term.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading text-sm font-bold text-amber-400">
                        {term.termEn}
                      </h4>
                      <span className="text-xs font-bold text-emerald-400 font-serif">
                        {term.termGu}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      {language === "gu" ? term.defGu : term.defEn}
                    </p>

                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                      <strong className="text-slate-300">Example:</strong>{" "}
                      {language === "gu" ? term.exampleGu : term.exampleEn}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION F: QUICK TIPS FOR RURAL GUJARAT CLASSROOMS              */}
        {/* ============================================================== */}
        {activeTab === "tips" && (
          <div className="space-y-4">
            <Card variant="glass" className="p-6 border-slate-800 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span>
                    {language === "gu"
                      ? "ગુજરાતના ગ્રામીણ વર્ગખંડો માટે ઉપયોગી ટિપ્સ"
                      : "Actionable Tips for Rural Gujarat Classrooms"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Engineered specifically for low-connectivity schools, multi-grade teaching, and paper-based tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RURAL_TIPS.map((tip) => (
                  <div
                    key={tip.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                        {tip.icon === "WifiOff" && <WifiOff className="w-4 h-4" />}
                        {tip.icon === "Printer" && <Printer className="w-4 h-4" />}
                        {tip.icon === "Boxes" && <Boxes className="w-4 h-4" />}
                        {tip.icon === "Users" && <Users className="w-4 h-4" />}
                      </div>
                      <h4 className="font-heading text-sm font-bold text-white">
                        {language === "gu" ? tip.titleGu : tip.titleEn}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pl-10">
                      {language === "gu" ? tip.descGu : tip.descEn}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECTION 5: CLEAN A4 PRINTABLE QUICK-START GUIDE MODAL / VIEW    */}
      {/* ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white text-slate-900 p-6 sm:p-10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Printable Quick-Start Reference Guide (A4 Format)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/tutorial/print"
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Standalone Tab</span>
                </Link>
                <Button variant="saffron" size="sm" onClick={handlePrintGuide} className="rounded-xl text-xs font-bold">
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  <span>Print A4 Page</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable A4 Content Canvas */}
            <div className="space-y-6 text-xs text-slate-800">
              {/* Header Letterhead */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-lg font-black uppercase text-slate-950">
                    ShikshaSetu AI • શિક્ષાસેતુ AI
                  </h2>
                  <p className="text-xs font-bold text-slate-700">
                    Teacher Quick-Start Guide (Gujarat Primary Schools • PS-60)
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-600">
                  <div>100% Offline PWA</div>
                  <div>No Paid APIs Needed</div>
                </div>
              </div>

              {/* 4 Core Steps Flow */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl border border-slate-300 space-y-1">
                  <h4 className="font-bold text-slate-900">Step 1: Record Assessment</h4>
                  <p className="text-[11px] text-slate-600">
                    Enter diagnostic scores per concept in under 30 seconds.
                  </p>
                  <p className="text-[10px] text-slate-500 font-serif">
                    પગલું ૧: મૂલ્યાંકન ગુણ ૩૦ સેકન્ડમાં દાખલ કરો.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-300 space-y-1">
                  <h4 className="font-bold text-slate-900">Step 2: Inspect Learning Gap</h4>
                  <p className="text-[11px] text-slate-600">
                    Scores &lt; 60% trigger an automatic flag with pedagogical root cause.
                  </p>
                  <p className="text-[10px] text-slate-500 font-serif">
                    પગલું ૨: ૬૦% થી ઓછા પરિણામ પર આપોઆપ ત્રુટિ કારણ દેખાશે.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-300 space-y-1">
                  <h4 className="font-bold text-slate-900">Step 3: Deploy 5-Step Plan</h4>
                  <p className="text-[11px] text-slate-600">
                    Use concrete beads &amp; number lines before moving to quizzes.
                  </p>
                  <p className="text-[10px] text-slate-500 font-serif">
                    પગલું ૩: મૂર્ત સાધનો (મણકા, દીવાસળી) સાથે ૫ પગલાં કરાવો.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-300 space-y-1">
                  <h4 className="font-bold text-slate-900">Step 4: Reassess Mastery</h4>
                  <p className="text-[11px] text-slate-600">
                    Record re-test score (&ge; 80%) and celebrate +pp improvement!
                  </p>
                  <p className="text-[10px] text-slate-500 font-serif">
                    પગલું ૪: પુનઃટેસ્ટ નોંધી +પોઇન્ટ્સ સુધારાની ઉજવણી કરો!
                  </p>
                </div>
              </div>

              {/* Benchmarks Rule Reference Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
                <h4 className="font-bold text-slate-950 uppercase text-[11px]">
                  Official Benchmark Cutoffs:
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-900 font-bold">
                    &lt; 60%: Needs Support
                  </div>
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-900 font-bold">
                    60% - 79%: Developing
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                    &ge; 80%: Mastered
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts & Support */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-600">
                <span>Esc = Close Tour • Lang Toggle = Gujarati / English</span>
                <span>Keep this sheet at the school teacher desk.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
