"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { useTutorial } from "@/context/TutorialContext";
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
  const router = useRouter();
  const { t, tr, language } = useLanguage();
  const tu = t.tutorial;
  const showGuField = language === "gu";
  const { openTutorial, setTutorialStep } = useTutorial();

  const [activeTab, setActiveTab] = useState<
    "workflow" | "lessons" | "sandbox" | "faq" | "glossary" | "tips"
  >("workflow");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-threshold");

  // Initialize tutorial from Step 1 whenever entering Tutorial page
  React.useEffect(() => {
    setTutorialStep(0);
    setSandboxStep(1);
    setSandboxScore(35);
    setSandboxPlanGenerated(false);
    setSandboxReassessed(false);
    setActiveTab("workflow");
  }, [setTutorialStep]);
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

  const handleReplayTour = () => {
    router.push("/dashboard?tour=full");
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
        <div data-tour="tutorial-hero" className="relative rounded-3xl bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2DCB5]/40 dark:from-[#2A231E] dark:via-[#221C18] dark:to-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/25 p-6 sm:p-10 shadow-[0_12px_40px_rgba(73,53,47,0.06)] overflow-hidden text-[#49352F] dark:text-[#F4F1E1]">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F2CAB3]/30 dark:bg-[#F2CAB3]/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-[#F2DCB5]/40 dark:bg-[#F2DCB5]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2CAB3]/60 dark:bg-[#F2CAB3]/20 border border-[#49352F]/15 dark:border-[#F2CAB3]/30 text-[#49352F] dark:text-[#F4F1E1] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <span>
                  {tu.badge}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-[#49352F] dark:text-[#F4F1E1] leading-tight">
                {tu.heroTitle}
              </h1>

              <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed font-normal">
                {tu.heroSubtitle}
              </p>

              {/* Action Buttons: Replay Tour & Download Print Guide */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="saffron"
                  size="sm"
                  onClick={handleReplayTour}
                  className="rounded-full text-xs font-bold shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>{tu.replayTour}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintModal(true)}
                  className="rounded-full text-xs border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#352B24] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                  <span>{tu.quickStartPrint}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setActiveTab("sandbox")}
                  data-tour="tutorial-sandbox-btn" className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-[#26201C] hover:bg-white dark:hover:bg-[#352B24] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/12 dark:border-[#F2CAB3]/20 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Play className="w-3 h-3 text-[#2E7D5E] dark:text-[#5FE3B2]" />
                  <span>{tu.trySandbox}</span>
                </button>
              </div>
            </div>

            {/* Visual 3D Bridge / ShikshaBot Graphic Card */}
            <div className="relative w-full lg:w-72 h-48 sm:h-56 rounded-3xl bg-white dark:bg-[#221C18] border border-[#49352F]/15 dark:border-[#F2CAB3]/25 p-4 flex flex-col justify-between shadow-md shrink-0 text-[#49352F] dark:text-[#F4F1E1]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#7A6862] dark:text-[#FAF6E9]/60">
                  {tu.heroVisualEngine}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] dark:text-[#5FE3B2] text-[10px] font-extrabold border border-[#2E7D5E]/20 dark:border-[#2E7D5E]/40">
                  {tu.heroVisualOffline}
                </span>
              </div>

              {/* Miniature Bridge Diagram Visual */}
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#C54738] dark:text-[#FA8C7C] flex items-center gap-1">
                    <span>{tu.heroVisualGap}</span>
                  </span>
                  <span className="text-[#B26A1B] dark:text-[#F2CAB3] font-extrabold text-[11px]">{tu.heroVisualGain}</span>
                  <span className="text-[#2E7D5E] dark:text-[#5FE3B2] flex items-center gap-1">
                    <span>{tu.heroVisualMastery}</span>
                  </span>
                </div>

                <div className="relative h-3 w-full bg-[#FAF6E9] dark:bg-[#1B1614] border border-[#49352F]/10 dark:border-[#F2CAB3]/20 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-[#C54738] via-[#B26A1B] to-[#2E7D5E] rounded-full w-full animate-pulse" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 font-mono">
                  <span>{tu.heroVisualBaseline}</span>
                  <span>{tu.heroVisualRemedial}</span>
                  <span>{tu.heroVisualVerified}</span>
                </div>
              </div>

              {/* Bot Avatar Callout */}
              <div className="p-2 rounded-2xl bg-[#FAF6E9] dark:bg-[#1B1614] border border-[#49352F]/10 dark:border-[#F2CAB3]/20 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#F2CAB3] dark:bg-[#F2CAB3]/25 text-[#49352F] dark:text-[#F4F1E1] flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#49352F] dark:text-[#F4F1E1]" aria-hidden="true" />
                </div>
                <p className="text-[10px] text-[#49352F] dark:text-[#F4F1E1] leading-tight">
                  {tu.heroBotCallout}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEARCH BOX & NAVIGATION TABS BAR                                */}
        {/* ============================================================== */}
        <div data-tour="tutorial-tabs" className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Instant Search Box - Big, Prominent & Showable */}
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B26A1B] pointer-events-none" />
            <input
              type="text"
              placeholder={tu.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-[#49352F]/15 bg-white py-2.5 pl-12 pr-10 text-sm text-[#49352F] placeholder-[#7A6862]/60 focus:border-[#B26A1B] focus:bg-white focus:ring-4 focus:ring-[#F2CAB3]/40 outline-hidden transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9] transition-colors cursor-pointer"
                title={tu.clearSearch}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Section Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: "workflow", label: tu.activeTabWorkflow, icon: Layers },
              { id: "lessons", label: tu.activeTabLessons, icon: BookOpen },
              { id: "sandbox", label: tu.activeTabSandbox, icon: Play },
              { id: "faq", label: tu.activeTabFaq, icon: HelpCircle },
              { id: "glossary", label: tu.activeTabGlossary, icon: BrainCircuit },
              { id: "tips", label: tu.activeTabTips, icon: Lightbulb },
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
                      ? "bg-[#F2CAB3] text-[#49352F] font-black shadow-xs border border-[#49352F]/15"
                      : "text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9]"
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
          <div data-tour="tutorial-workflow" className="space-y-6">
            <Card className="p-6 border-[#49352F]/12 bg-white/95 space-y-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#49352F] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#B26A1B]" />
                  <span>
                    {tu.workflowTitle}
                  </span>
                </h3>
                <p className="text-xs text-[#7A6862] mt-1">
                  {tu.workflowSubtitle}
                </p>
              </div>

              {/* 4 Pipeline Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Phase 1 */}
                <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-2 hover:border-[#F2CAB3] transition-all">
                  <div className="w-8 h-8 rounded-xl bg-[#F2CAB3]/50 text-[#49352F] border border-[#49352F]/15 flex items-center justify-center font-heading font-black text-xs">
                    01
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[#49352F]">
                    {tu.phase1Title}
                  </h4>
                  <p className="text-xs text-[#7A6862] leading-relaxed">
                    {tu.phase1Desc}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-[#C54738] block pt-1">
                    {tu.phase1Tag}
                  </span>
                </div>

                {/* Phase 2 */}
                <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-2 hover:border-[#F2CAB3] transition-all">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#C54738] border border-rose-200 flex items-center justify-center font-heading font-black text-xs">
                    02
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[#49352F]">
                    {tu.phase2Title}
                  </h4>
                  <p className="text-xs text-[#7A6862] leading-relaxed">
                    {tu.phase2Desc}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-[#B26A1B] block pt-1">
                    {tu.phase2Tag}
                  </span>
                </div>

                {/* Phase 3 */}
                <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-2 hover:border-[#F2CAB3] transition-all">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#B26A1B] border border-amber-200 flex items-center justify-center font-heading font-black text-xs">
                    03
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[#49352F]">
                    {tu.phase3Title}
                  </h4>
                  <p className="text-xs text-[#7A6862] leading-relaxed">
                    {tu.phase3Desc}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-[#2E7D5E] block pt-1">
                    {tu.phase3Tag}
                  </span>
                </div>

                {/* Phase 4 */}
                <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-2 hover:border-[#F2CAB3] transition-all">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#2E7D5E] border border-emerald-200 flex items-center justify-center font-heading font-black text-xs">
                    04
                  </div>
                  <h4 className="font-heading text-sm font-bold text-[#49352F]">
                    {tu.phase4Title}
                  </h4>
                  <p className="text-xs text-[#7A6862] leading-relaxed">
                    {tu.phase4Desc}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-[#2E7D5E] block pt-1">
                    {tu.phase4Tag}
                  </span>
                </div>
              </div>

              {/* Aarav Patel Before / After Bridge Comparison Visual */}
              <div className="p-5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#49352F]">
                      {tu.bridgeCaseTitle}
                    </h4>
                    <p className="text-[11px] text-[#7A6862]">{tu.bridgeCaseMeta}</p>
                  </div>
                  <Link
                    href="/students/std-aarav"
                    className="text-xs font-bold text-[#49352F] hover:text-[#B26A1B] flex items-center gap-1"
                  >
                    <span>{tu.openProfileBtn}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Before vs After Bar Visual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-white border border-rose-200 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#C54738]">{tu.baselineDiagnostic}</span>
                      <span className="font-black text-[#C54738] font-mono">35%</span>
                    </div>
                    <div className="h-2 w-full bg-rose-50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C54738] rounded-full w-[35%]" />
                    </div>
                    <span className="text-[10px] text-[#7A6862]">{tu.statusNeedsSupportRule}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#2E7D5E]">{tu.postReassessment}</span>
                      <span className="font-black text-[#2E7D5E] font-mono">{tu.reassessGainLabel}</span>
                    </div>
                    <div className="h-2 w-full bg-emerald-50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E7D5E] rounded-full w-[85%]" />
                    </div>
                    <span className="text-[10px] text-[#7A6862]">{tu.statusCertifiedMastery}</span>
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
                  className="p-5 border-[#49352F]/12 bg-white/95 flex flex-col justify-between space-y-4 hover:border-[#F2CAB3] hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="indigo" size="sm">
                        {lesson.tag}
                      </Badge>
                      <span className="text-[10px] text-[#7A6862] font-mono">{tu.quickStep}</span>
                    </div>

                    <h4 className="font-heading text-base font-bold text-[#49352F]">
                      {showGuField ? lesson.titleGu : lesson.titleEn}
                    </h4>

                    <p className="text-xs text-[#7A6862] leading-relaxed">
                      {showGuField ? lesson.descGu : lesson.descEn}
                    </p>

                    {/* Miniature Animated CSS/SVG UI Mockup */}
                    <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-[#7A6862] border-b border-[#49352F]/10 pb-1.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B26A1B] animate-ping" />
                          <span>{tu.simulatedFlow}</span>
                        </span>
                        <span>{tu.schoolPcLabel}</span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {lesson.steps.map((st, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-2 text-[11px] text-[#49352F]"
                          >
                            <span className="w-4 h-4 rounded-full bg-white text-[#B26A1B] border border-[#49352F]/15 flex items-center justify-center text-[9px] font-bold shrink-0">
                              {sIdx + 1}
                            </span>
                            <span className="leading-tight">
                              {showGuField ? st.gu : st.en}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#49352F]/10 flex items-center justify-between">
                    <span className="text-[11px] text-[#2E7D5E] flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>{tu.taskDuration30s}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("sandbox");
                      }}
                      className="text-xs font-bold text-[#49352F] hover:text-[#B26A1B] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{tu.tryDemoBtn}</span>
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
            <Card className="p-6 border-[#49352F]/15 bg-white space-y-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#49352F]/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-[#49352F]">
                      {tu.sandboxTitle}
                    </h3>
                    <Badge variant="mint" size="sm">
                      {tu.zeroRiskBadge}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7A6862] mt-1">
                    {tu.sandboxSubtitle}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSandbox}
                  className="rounded-full text-xs self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>{tu.resetDemoBtn}</span>
                </Button>
              </div>

              {/* Progress Stepper for Sandbox */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { num: 1, label: tu.sandboxStep1 },
                  { num: 2, label: tu.sandboxStep2 },
                  { num: 3, label: tu.sandboxStep3 },
                  { num: 4, label: tu.sandboxStep4 },
                ].map((s) => (
                  <div
                    key={s.num}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      sandboxStep === s.num
                        ? "bg-[#F2CAB3]/40 border-[#49352F]/30 text-[#49352F] shadow-xs font-bold"
                        : sandboxStep > s.num
                        ? "bg-emerald-50 border-emerald-300 text-[#2E7D5E] font-medium"
                        : "bg-[#FAF6E9] border-[#49352F]/10 text-[#7A6862]"
                    }`}
                  >
                    <span className="text-xs block">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Sandbox Interactive Display Window */}
              <div className="p-6 rounded-3xl bg-[#FAF6E9] border border-[#49352F]/15 space-y-5">
                {/* Student Mini Header */}
                <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/20 flex items-center justify-center font-bold">
                      આ
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#49352F]">{tu.sandboxStudentName}</h4>
                      <p className="text-[11px] text-[#7A6862]">{tu.sandboxConcept}</p>
                    </div>
                  </div>

                  <Badge
                    variant={sandboxScore >= 80 ? "mastered" : "needsSupport"}
                    size="sm"
                  >
                    {sandboxScore >= 80 ? tu.sandboxBadgeMastered : tu.sandboxBadgeSupport}
                  </Badge>
                </div>

                {/* Step 1 Content */}
                {sandboxStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#C54738] shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-[#C54738]">{tu.sandboxS1Title}</h5>
                        <p className="text-xs text-[#7A6862] mt-1">
                          {tu.sandboxS1Body}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[#49352F] font-medium flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-[#B26A1B]" />
                        <span>{tu.sandboxS1Bot}</span>
                      </div>
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={() => handleSandboxAction(2)}
                        className="rounded-full text-xs font-bold"
                      >
                        <span>{tu.sandboxS1Btn} &rarr;</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2 Content */}
                {sandboxStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#49352F]">
                        <BrainCircuit className="w-4 h-4 text-[#B26A1B]" />
                        <span>{tu.sandboxS2Title}</span>
                      </div>
                      <p className="text-xs text-[#49352F] leading-relaxed">
                        {tu.sandboxS2Quote}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[#49352F] font-medium flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-[#B26A1B]" />
                        <span>{tu.sandboxS2Bot}</span>
                      </div>
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={() => handleSandboxAction(3)}
                        className="rounded-full text-xs font-bold"
                      >
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        <span>{tu.sandboxS2Btn} &rarr;</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3 Content */}
                {sandboxStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#2E7D5E]">
                        {tu.sandboxS3Title}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#49352F]">
                        <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/12 shadow-2xs">
                          <strong>{tu.sandboxS3Step1Label}</strong> {tu.sandboxS3Step1Desc}
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/12 shadow-2xs">
                          <strong>{tu.sandboxS3Step2Label}</strong> {tu.sandboxS3Step2Desc}
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/12 shadow-2xs">
                          <strong>{tu.sandboxS3Step3Label}</strong> {tu.sandboxS3Step3Desc}
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-[#49352F]/12 shadow-2xs">
                          <strong>{tu.sandboxS3Step4Label}</strong> {tu.sandboxS3Step4Desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[#49352F] font-medium flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-[#B26A1B]" />
                        <span>{tu.sandboxS3Bot}</span>
                      </div>
                      <Button
                        variant="mint"
                        size="sm"
                        onClick={() => handleSandboxAction(4)}
                        className="rounded-full text-xs font-black shadow-md shadow-emerald-500/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>{tu.sandboxS3Btn} &rarr;</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4 Content (Celebration) */}
                {sandboxStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-center py-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-[#2E7D5E] text-xs font-black">
                      <Sparkles className="w-4 h-4 text-[#2E7D5E]" />
                      <span>{tu.sandboxS4Badge}</span>
                    </div>

                    <h4 className="font-heading text-xl font-black text-[#49352F] flex items-center justify-center gap-2">
                      <span>{tu.sandboxS4Title}</span>
                      <Sparkles className="w-5 h-5 text-[#2E7D5E]" aria-hidden="true" />
                    </h4>

                    <p className="text-xs text-[#7A6862] max-w-lg mx-auto">
                      {tu.sandboxS4Body}
                    </p>

                    <div className="pt-2 flex justify-center gap-3">
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={resetSandbox}
                        className="rounded-full text-xs font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>{tu.sandboxS4ResetBtn}</span>
                      </Button>

                      <Link href="/students/std-aarav">
                        <Button variant="outline" size="sm" className="rounded-full text-xs text-[#49352F] border-[#49352F]/20 hover:bg-[#FAF6E9]">
                          <span>{tu.sandboxS4ProfileBtn}</span>
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
            <Card className="p-6 border-[#49352F]/12 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#49352F] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#B26A1B]" />
                    <span>{tu.faqHeading}</span>
                  </h3>
                  <p className="text-xs text-[#7A6862] mt-1">
                    {tu.faqSubheading}
                  </p>
                </div>
                <span className="text-xs text-[#7A6862]">
                  {tr("tutorial.faqCount", { count: filteredFaqs.length })}
                </span>
              </div>

              {filteredFaqs.length === 0 ? (
                <p className="text-center py-8 text-xs text-[#7A6862]">
                  {tu.faqEmpty}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    const question = showGuField ? faq.questionGu : faq.questionEn;
                    const answer = showGuField ? faq.answerGu : faq.answerEn;

                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl border border-[#49352F]/12 bg-[#FAF6E9] overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-white transition-colors cursor-pointer"
                        >
                          <span className="font-heading text-xs sm:text-sm font-bold text-[#49352F] pr-4">
                            {question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#B26A1B] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#7A6862] shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 text-xs text-[#7A6862] leading-relaxed border-t border-[#49352F]/10 bg-white/50 animate-in fade-in duration-150">
                            <p>{answer}</p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              {faq.keywords.map((kw, kIdx) => (
                                <span
                                  key={kIdx}
                                  className="px-2 py-0.5 rounded-md bg-[#F2CAB3]/30 text-[10px] font-mono text-[#49352F]"
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
            <Card className="p-6 border-[#49352F]/12 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#49352F] flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-[#B26A1B]" />
                    <span>{tu.glossaryHeading}</span>
                  </h3>
                  <p className="text-xs text-[#7A6862] mt-1">
                    {tu.glossarySubheading}
                  </p>
                </div>
                <span className="text-xs text-[#7A6862]">
                  {tr("tutorial.glossaryCount", { count: filteredGlossary.length })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGlossary.map((term) => (
                  <div
                    key={term.id}
                    className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-2 hover:border-[#F2CAB3] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading text-sm font-bold text-[#49352F]">
                        {term.termEn}
                      </h4>
                      <span className="text-xs font-bold text-[#2E7D5E] font-serif">
                        {term.termGu}
                      </span>
                    </div>

                    <p className="text-xs text-[#49352F] leading-relaxed">
                      {showGuField ? term.defGu : term.defEn}
                    </p>

                    <div className="p-2 rounded-xl bg-white border border-[#49352F]/10 text-[11px] text-[#7A6862]">
                      <strong className="text-[#49352F]">{tu.glossaryExampleLabel}</strong>{" "}
                      {showGuField ? term.exampleGu : term.exampleEn}
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
            <Card className="p-6 border-[#49352F]/12 bg-white space-y-4">
              <div className="pb-3 border-b border-[#49352F]/10">
                <h3 className="font-heading text-lg font-bold text-[#49352F] flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#B26A1B]" />
                  <span>
                    {tu.tipsHeading}
                  </span>
                </h3>
                <p className="text-xs text-[#7A6862] mt-1">
                  {tu.tipsSubheading}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RURAL_TIPS.map((tip) => (
                  <div
                    key={tip.id}
                    className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-2 hover:border-[#F2CAB3] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F2CAB3]/40 text-[#49352F] border border-[#49352F]/15 flex items-center justify-center">
                        {tip.icon === "WifiOff" && <WifiOff className="w-4 h-4" />}
                        {tip.icon === "Printer" && <Printer className="w-4 h-4" />}
                        {tip.icon === "Boxes" && <Boxes className="w-4 h-4" />}
                        {tip.icon === "Users" && <Users className="w-4 h-4" />}
                      </div>
                      <h4 className="font-heading text-sm font-bold text-[#49352F]">
                        {showGuField ? tip.titleGu : tip.titleEn}
                      </h4>
                    </div>

                    <p className="text-xs text-[#7A6862] leading-relaxed pl-10">
                      {showGuField ? tip.descGu : tip.descEn}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#49352F]/50 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-[#FAF6E9] text-[#49352F] border border-[#49352F]/20 p-6 sm:p-10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#49352F]/15 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#49352F]" />
                <h3 className="font-heading text-base font-bold text-[#49352F]">{tu.printModalTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/tutorial/print"
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl border border-[#49352F]/20 text-xs font-bold text-[#49352F] hover:bg-white flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{tu.openStandaloneBtn}</span>
                </Link>
                <Button variant="saffron" size="sm" onClick={handlePrintGuide} className="rounded-xl text-xs font-bold">
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  <span>{tu.printA4Btn}</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#7A6862] hover:bg-white"
                >{tu.closeBtn}</button>
              </div>
            </div>

            {/* Printable A4 Content Canvas */}
            <div className="space-y-6 text-xs text-[#49352F]">
              {/* Header Letterhead */}
              <div className="border-b-2 border-[#49352F] pb-3 flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-lg font-black uppercase text-[#49352F]">
                    StudySaathi AI
                  </h2>
                  <p className="text-xs font-bold text-[#7A6862]">
                    {tu.printModalOrgLine}
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono text-[#7A6862]">
                  <div>{tu.heroVisualOffline}</div>
                  <div>{tu.printModalNoApis}</div>
                </div>
              </div>

              {/* 4 Core Steps Flow */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl border border-[#49352F]/15 bg-white space-y-1">
                  <h4 className="font-bold text-[#49352F]">{tu.printModalStep1Title}</h4>
                  <p className="text-[11px] text-[#7A6862]">{tu.printModalStep1Desc}</p>
                  <p className="text-[10px] text-[#7A6862] font-serif">
                    પગલું ૧: મૂલ્યાંકન ગુણ ૩૦ સેકન્ડમાં દાખલ કરો.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[#49352F]/15 bg-white space-y-1">
                  <h4 className="font-bold text-[#49352F]">{tu.printModalStep2Title}</h4>
                  <p className="text-[11px] text-[#7A6862]">
                    {tu.printModalStep2Desc}
                  </p>
                  <p className="text-[10px] text-[#7A6862] font-serif">
                    પગલું ૨: ૬૦% થી ઓછા પરિણામ પર આપોઆપ ત્રુટિ કારણ દેખાશે.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[#49352F]/15 bg-white space-y-1">
                  <h4 className="font-bold text-[#49352F]">{tu.printModalStep3Title}</h4>
                  <p className="text-[11px] text-[#7A6862]">
                    {tu.printModalStep3Desc}
                  </p>
                  <p className="text-[10px] text-[#7A6862] font-serif">
                    પગલું ૩: મૂર્ત સાધનો (મણકા, દીવાસળી) સાથે ૫ પગલાં કરાવો.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[#49352F]/15 bg-white space-y-1">
                  <h4 className="font-bold text-[#49352F]">{tu.printModalStep4Title}</h4>
                  <p className="text-[11px] text-[#7A6862]">
                    {tu.printModalStep4Desc}
                  </p>
                  <p className="text-[10px] text-[#7A6862] font-serif">
                    પગલું ૪: પુનઃટેસ્ટ નોંધી +પોઇન્ટ્સ સુધારાની ઉજવણી કરો!
                  </p>
                </div>
              </div>

              {/* Benchmarks Rule Reference Box */}
              <div className="p-4 rounded-xl bg-white border border-[#49352F]/15 space-y-2">
                <h4 className="font-bold text-[#49352F] uppercase text-[11px]">
                  {tu.officialBenchmarksHeading}
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[#C54738] font-bold">
                    {tu.cutoffNeedsSupport}
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[#B26A1B] font-bold">
                    {tu.cutoffDeveloping}
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#2E7D5E] font-bold">
                    {tu.cutoffMastered}
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts & Support */}
              <div className="border-t border-[#49352F]/15 pt-3 flex items-center justify-between text-[11px] text-[#7A6862]">
                <span>{tu.printModalFooterShortcuts}</span>
                <span>{tu.printModalFooterKeep}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
