"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { StatTile } from "@/components/ui/StatTile";
import { useLanguage } from "@/context/LanguageContext";
import { ReassessmentModal } from "@/components/assessment/ReassessmentModal";
import { ContextualHelp } from "@/components/shared/ContextualHelp";
import { broadcastDataUpdate, subscribeToDataUpdates } from "@/lib/events";
import { normalizePriority, normalizeGapStatus } from "@/lib/learningGapFormatters";
import { generateCognitiveDiagnosis, getDiagnosisBadgeStyle } from "@/lib/engine/diagnosisEngine";
import { calculateAssessmentTrend } from "@/lib/engine/progressTrend";
import { generatePedagogicalPrescription } from "@/lib/engine/prescriptionEngine";
import { calculateTodaysPriorities, isWithinRecentDays } from "@/lib/engine/todaysPriorities";
import { getMasteryEvidenceText } from "@/lib/engine/reassessmentEngine";
import {
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
  Sliders,
  BrainCircuit,
  RotateCcw,
  Layers,
  HelpCircle,
} from "lucide-react";

export default function LearningGapsPage() {
  const { t, language, formatSubject, formatPriority, formatStatus, formatClass } = useLanguage();

  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  type PriorityCategoryKey = "immediate_support" | "developing" | "ready_to_reassess" | "recently_mastered" | null;
  const [activePriorityCategory, setActivePriorityCategory] = useState<PriorityCategoryKey>(null);
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);

  // Threshold Slider Demo Sandbox State
  const [supportThreshold, setSupportThreshold] = useState<number>(60);
  const [masteryThreshold, setMasteryThreshold] = useState<number>(80);

  // Reassessment modal state
  const [reassessModalOpen, setReassessModalOpen] = useState(false);
  const [targetGapForReassessment, setTargetGapForReassessment] = useState<any>(null);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/learning-gaps");
      const data = await res.json();
      if (data.success) {
        setGaps(data.gaps || []);
      }
    } catch (e) {
      console.error("Failed to load learning gaps", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
    const unsubscribe = subscribeToDataUpdates(() => {
      fetchGaps();
    }, ["gaps", "results", "assessments", "plans", "all"]);
    return () => unsubscribe();
  }, []);

  const handleGeneratePlan = async (gapId: string) => {
    setGeneratingPlanId(gapId);
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapId }),
      });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("plans", "create", data.plan?.id);
        broadcastDataUpdate("gaps", "update", gapId);
        fetchGaps();
      }
    } catch (e) {
      console.error("Error creating plan", e);
    } finally {
      setGeneratingPlanId(null);
    }
  };

  // Recalculate gap status dynamically using the Sandbox threshold sliders
  const processedGaps = gaps.map((g) => {
    const score = g.latestPercentage || 0;
    const isNeedsSupport = score < supportThreshold;
    const isMastered = score >= masteryThreshold;
    const status = isMastered ? "Mastered" : isNeedsSupport ? "Needs Support" : "Developing";

    return {
      ...g,
      dynamicStatus: status,
      dynamicIsGap: isNeedsSupport,
    };
  });

  // Calculate Today's Priorities dynamically (Phase 5)
  const todaysPriorities = calculateTodaysPriorities(
    processedGaps,
    Date.now(),
    supportThreshold,
    masteryThreshold
  );

  const filteredGaps = processedGaps.filter((g) => {
    // 1. Priority Category Filter (Phase 5)
    if (activePriorityCategory === "immediate_support") {
      if (g.dynamicStatus !== "Needs Support" || g.status === "Resolved") return false;
    } else if (activePriorityCategory === "developing") {
      if (g.dynamicStatus !== "Developing" || g.status === "Resolved") return false;
    } else if (activePriorityCategory === "ready_to_reassess") {
      const isReady = g.remedialPlanStatus === "Completed" || g.reassessmentDue === true;
      if (!isReady || g.status === "Resolved") return false;
    } else if (activePriorityCategory === "recently_mastered") {
      const isMastered = g.dynamicStatus === "Mastered" || g.status === "Resolved";
      if (!isMastered || !isWithinRecentDays(g.updatedAt, 7)) return false;
    }

    // 2. Existing Priority Filter
    if (priorityFilter !== "all" && normalizePriority(g.priority) !== priorityFilter) return false;

    // 3. Existing Status Filter
    if (statusFilter !== "all" && normalizeGapStatus(g.dynamicStatus || g.masteryStatus || g.status) !== statusFilter) return false;

    return true;
  });

  const handlePriorityCategoryClick = (category: PriorityCategoryKey) => {
    if (activePriorityCategory === category) {
      setActivePriorityCategory(null);
      setStatusFilter("all");
    } else {
      setActivePriorityCategory(category);
      if (category === "immediate_support") {
        setStatusFilter("Needs Support");
      } else if (category === "developing") {
        setStatusFilter("Developing");
      } else if (category === "recently_mastered") {
        setStatusFilter("Mastered");
      } else {
        setStatusFilter("all");
      }
    }
  };

  const flaggedCount = processedGaps.filter((g) => g.dynamicIsGap).length;
  const masteredCount = processedGaps.filter((g) => g.dynamicStatus === "Mastered").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight">
                {t.learningGaps.title || "Smart Learning-Gap Detection Engine"}
              </h1>
              <Badge variant="saffron" size="sm" pulse>
                {language === "gu" ? "ચોક્કસ નિયમ આધારિત AI" : "Deterministic AI"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1">
              {t.learningGaps.subtitle || "Transparent, explainable pedagogical rule engine identifying student conceptual roadblocks with plain-language reasons."}
            </p>
          </div>
        </div>

        {/* 1. THRESHOLD SLIDER SANDBOX DEMO (Signature Feature) */}
        <Card data-tour="gaps-threshold" variant="glass" className="p-5 border-[#49352F]/15 bg-gradient-to-r from-[#F2DCB5]/80 via-[#FAF6E9] to-[#F2CAB3]/70 shadow-[0_8px_24px_rgba(73,53,47,0.06)] space-y-4 text-[#49352F]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#B26A1B]" />
              <h3 className="font-heading text-sm font-bold text-[#49352F]">
                {language === "gu" ? "ઇન્ટરેક્ટિવ મર્યાદા સેન્ડબોક્સ ડેમો" : "Interactive Threshold Sandbox Demo"}
              </h3>
              <Badge variant="mint" size="sm">
                {language === "gu" ? "મૂલ્યાંકન સેન્ડબોક્સ" : "Jury Sandbox"}
              </Badge>
            </div>
            <span className="text-[11px] text-[#7A6862]">
              {language === "gu"
                ? "રીઅલ-ટાઇમ નિયમ એન્જિન મર્યાદા ફેરફારોનું અનુકરણ કરવા સ્લાઇડ કરો"
                : "Slide to simulate real-time rule engine threshold adjustments"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Slider 1: Needs Support Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#C54738] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C54738]" />
                  <span>{language === "gu" ? "પ્રગતિશીલ / સહાય મર્યાદા:" : "Developing / Support Threshold:"}</span>
                  <ContextualHelp termKey="masteryThreshold" />
                </span>
                <span className="font-heading font-black text-[#C54738] text-sm">
                  {supportThreshold}% {language === "gu" ? "બેન્ચમાર્ક" : "Benchmark"}
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="75"
                step="1"
                value={supportThreshold}
                onChange={(e) => setSupportThreshold(Number(e.target.value))}
                className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-[#C54738] border border-[#49352F]/15"
              />
              <p className="text-[11px] text-[#7A6862]">
                {language === "gu"
                  ? `${supportThreshold}% થી ઓછો સ્કોર ધરાવતા કોઈપણ વિદ્યાર્થીને તાત્કાલિક ૫-પગલાંના ઉપચાર માટે ચિહ્નિત કરવામાં આવે છે.`
                  : `Any student scoring below ${supportThreshold}% is flagged for immediate 5-step concrete remediation.`}
              </p>
            </div>

            {/* Slider 2: Mastery Benchmark Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2E7D5E] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5E]" />
                  {language === "gu" ? "પ્રભુત્વ મર્યાદા:" : "Mastery Threshold:"}
                </span>
                <span className="font-heading font-black text-[#2E7D5E] text-sm">
                  {masteryThreshold}% {language === "gu" ? "બેન્ચમાર્ક" : "Benchmark"}
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                step="1"
                value={masteryThreshold}
                onChange={(e) => setMasteryThreshold(Number(e.target.value))}
                className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-[#2E7D5E] border border-[#49352F]/15"
              />
              <p className="text-[11px] text-[#7A6862]">
                {language === "gu"
                  ? `≥ ${masteryThreshold}% સ્કોર મેળવનાર વિદ્યાર્થીઓ પ્રમાણિત સ્વતંત્ર પ્રભુત્વ તરફ સેતુ પાર કરે છે.`
                  : `Students scoring ≥ ${masteryThreshold}% cross the bridge into certified independent mastery.`}
              </p>
            </div>
          </div>

          {/* Sandbox Live Impact Stat Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#49352F]/10 text-xs">
            <div className="p-2.5 rounded-xl bg-white/90 border border-[#49352F]/10 text-center shadow-xs">
              <span className="text-[10px] text-[#7A6862] block font-semibold">
                {language === "gu" ? "મર્યાદા નીચે ચિહ્નિત" : "Flagged Under Threshold"}
              </span>
              <span className="text-lg font-black text-[#C54738]">
                {flaggedCount} {language === "gu" ? "ખામીઓ" : "Gaps"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-[#49352F]/10 text-center shadow-xs">
              <span className="text-[10px] text-[#7A6862] block font-semibold">
                {language === "gu" ? "પ્રભુત્વ મર્યાદાથી વધુ" : "Over Mastery Threshold"}
              </span>
              <span className="text-lg font-black text-[#2E7D5E]">
                {masteredCount} {language === "gu" ? "સંકલ્પનાઓ" : "Concepts"}
              </span>
            </div>
          </div>
        </Card>

        {/* TODAY'S PRIORITIES (Phase 5) */}
        <Card
          data-tour="gaps-todays-priorities"
          variant="glass"
          className="p-4 border-[#49352F]/15 bg-white text-[#49352F] shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B26A1B]" />
              <h3 className="font-heading text-sm font-bold tracking-tight text-[#49352F] uppercase">
                {language === "gu" ? "આજની પ્રાથમિકતાઓ" : "Today's Priorities"}
              </h3>
              <Badge variant="saffron" size="sm">
                {language === "gu" ? "શિક્ષક માર્ગદર્શક" : "Daily Action"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#7A6862]">
              <span>
                {language === "gu"
                  ? `${todaysPriorities.totalActionableStudents} વિદ્યાર્થીઓનું ધ્યાન જરૂરી છે`
                  : `${todaysPriorities.totalActionableStudents} students need attention`}
              </span>
              {activePriorityCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePriorityCategory(null);
                    setStatusFilter("all");
                  }}
                  className="font-semibold text-[#B26A1B] hover:underline flex items-center gap-0.5 ml-2 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === "gu" ? "બધા બતાવો" : "Show All"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Tile 1: Need Immediate Support */}
            <button
              type="button"
              onClick={() => handlePriorityCategoryClick("immediate_support")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activePriorityCategory === "immediate_support"
                  ? "bg-[#C54738]/10 border-[#C54738] ring-2 ring-[#C54738]/30 shadow-xs"
                  : "bg-[#FAF6E9] border-[#49352F]/10 hover:border-[#C54738]/40 hover:bg-[#FAF6E9]/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-bold text-[#C54738] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === "gu" ? "સહાયની તાત્કાલિક જરૂર" : "Immediate Support"}</span>
                </span>
                {activePriorityCategory === "immediate_support" && (
                  <span className="w-2 h-2 rounded-full bg-[#C54738]" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-[#C54738]">
                  {loading ? "..." : todaysPriorities.immediateSupportCount}
                </span>
                <span className="text-[10px] text-[#7A6862]">
                  {language === "gu" ? "વિદ્યાર્થીઓ" : "students"}
                </span>
              </div>
            </button>

            {/* Tile 2: Developing */}
            <button
              type="button"
              onClick={() => handlePriorityCategoryClick("developing")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activePriorityCategory === "developing"
                  ? "bg-[#B26A1B]/10 border-[#B26A1B] ring-2 ring-[#B26A1B]/30 shadow-xs"
                  : "bg-[#FAF6E9] border-[#49352F]/10 hover:border-[#B26A1B]/40 hover:bg-[#FAF6E9]/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-bold text-[#B26A1B] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === "gu" ? "વિકાસશીલ" : "Developing"}</span>
                </span>
                {activePriorityCategory === "developing" && (
                  <span className="w-2 h-2 rounded-full bg-[#B26A1B]" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-[#B26A1B]">
                  {loading ? "..." : todaysPriorities.developingCount}
                </span>
                <span className="text-[10px] text-[#7A6862]">
                  {language === "gu" ? "વિદ્યાર્થીઓ" : "students"}
                </span>
              </div>
            </button>

            {/* Tile 3: Ready to Reassess */}
            <button
              type="button"
              onClick={() => handlePriorityCategoryClick("ready_to_reassess")}
              disabled={todaysPriorities.readyToReassessCount === 0}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                todaysPriorities.readyToReassessCount === 0
                  ? "bg-[#FAF6E9]/60 border-[#49352F]/10 opacity-70 cursor-default"
                  : activePriorityCategory === "ready_to_reassess"
                  ? "bg-[#2B6CB0]/10 border-[#2B6CB0] ring-2 ring-[#2B6CB0]/30 shadow-xs cursor-pointer"
                  : "bg-[#FAF6E9] border-[#49352F]/10 hover:border-[#2B6CB0]/40 hover:bg-[#FAF6E9]/80 cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-bold text-[#2B6CB0] flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === "gu" ? "પુનઃમૂલ્યાંકન માટે તૈયાર" : "Ready to Reassess"}</span>
                </span>
                {activePriorityCategory === "ready_to_reassess" && (
                  <span className="w-2 h-2 rounded-full bg-[#2B6CB0]" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-[#2B6CB0]">
                  {loading ? "..." : todaysPriorities.readyToReassessCount}
                </span>
                <span className="text-[10px] text-[#7A6862]">
                  {todaysPriorities.readyToReassessCount === 0
                    ? language === "gu"
                      ? "કોઈ નથી"
                      : "none due"
                    : language === "gu"
                    ? "વિદ્યાર્થીઓ"
                    : "students"}
                </span>
              </div>
            </button>

            {/* Tile 4: Recently Mastered */}
            <button
              type="button"
              onClick={() => handlePriorityCategoryClick("recently_mastered")}
              disabled={todaysPriorities.recentlyMasteredCount === 0}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                todaysPriorities.recentlyMasteredCount === 0
                  ? "bg-[#FAF6E9]/60 border-[#49352F]/10 opacity-70 cursor-default"
                  : activePriorityCategory === "recently_mastered"
                  ? "bg-[#2E7D5E]/10 border-[#2E7D5E] ring-2 ring-[#2E7D5E]/30 shadow-xs cursor-pointer"
                  : "bg-[#FAF6E9] border-[#49352F]/10 hover:border-[#2E7D5E]/40 hover:bg-[#FAF6E9]/80 cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-bold text-[#2E7D5E] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === "gu" ? "તાજેતરમાં નિપુણ" : "Recently Mastered"}</span>
                </span>
                {activePriorityCategory === "recently_mastered" && (
                  <span className="w-2 h-2 rounded-full bg-[#2E7D5E]" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-[#2E7D5E]">
                  {loading ? "..." : todaysPriorities.recentlyMasteredCount}
                </span>
                <span className="text-[10px] text-[#7A6862]">
                  {language === "gu" ? "છેલ્લા ૭ દિવસ" : "last 7 days"}
                </span>
              </div>
            </button>
          </div>
        </Card>

        {/* Filter Controls */}
        <Card variant="glass" className="p-3.5 flex flex-wrap items-center justify-between gap-3 border-[#49352F]/15 bg-white text-[#49352F] shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A6862]">
                {language === "gu" ? "અગ્રતા:" : "Priority:"}
              </span>
              <select
                value={priorityFilter}
                aria-label="Filter learning gaps by priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-full border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
              >
                <option value="all">{language === "gu" ? "બધી અગ્રતા" : "All Priorities"}</option>
                <option value="High Priority">{language === "gu" ? "ઉચ્ચ અગ્રતા" : "High Priority"}</option>
                <option value="Medium Priority">{language === "gu" ? "મધ્યમ અગ્રતા" : "Medium Priority"}</option>
                <option value="Low Priority">{language === "gu" ? "ઓછી અગ્રતા" : "Low Priority"}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A6862]">
                {language === "gu" ? "સ્થિતિ:" : "Status:"}
              </span>
              <select
                value={statusFilter}
                aria-label="Filter learning gaps by status"
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  if (val === "Needs Support") setActivePriorityCategory("immediate_support");
                  else if (val === "Developing") setActivePriorityCategory("developing");
                  else if (val === "Mastered") setActivePriorityCategory("recently_mastered");
                  else setActivePriorityCategory(null);
                }}
                className="rounded-full border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
              >
                <option value="all">{language === "gu" ? "બધી સ્થિતિ" : "All Statuses"}</option>
                <option value="Needs Support">{language === "gu" ? "સહાયની જરૂર છે" : "Needs Support"}</option>
                <option value="Developing">{language === "gu" ? "વિકાસશીલ" : "Developing"}</option>
                <option value="Mastered">{language === "gu" ? "નિપુણ" : "Mastered"}</option>
              </select>
            </div>

            {(activePriorityCategory || priorityFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setActivePriorityCategory(null);
                  setPriorityFilter("all");
                  setStatusFilter("all");
                }}
                className="text-xs font-semibold text-[#B26A1B] hover:underline flex items-center gap-1 cursor-pointer ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === "gu" ? "ફિલ્ટર રીસેટ કરો" : "Reset Filters"}</span>
              </button>
            )}
          </div>

          <span className="text-xs text-[#7A6862]">
            {language === "gu"
              ? `${filteredGaps.length} શોધાયેલી શીખવાની ખામીઓ દર્શાવે છે`
              : `Showing ${filteredGaps.length} detected learning gaps`}
          </span>
        </Card>

        {/* 2. EXPLAINABLE AI GAP CARDS LIST */}
        <div className="space-y-4">
          {filteredGaps.map((gap) => {
            const isResolved = gap.status === "Resolved" || gap.dynamicStatus === "Mastered";
            const trendInfo = calculateAssessmentTrend({
              currentScore: gap.latestPercentage,
              previousScore: gap.previousPercentage,
              language,
            });

            const diagnosis = generateCognitiveDiagnosis({
              conceptId: gap.conceptId,
              conceptName: gap.conceptName,
              studentName: gap.studentName,
              latestPercentage: gap.latestPercentage,
              previousPercentage: gap.previousPercentage,
              deltaPercentagePoints: gap.deltaPercentagePoints,
              attemptsCount: gap.attemptsCount,
              supportThreshold,
              masteryBenchmark: masteryThreshold,
              language,
            });

            const activeDiagnosisType = gap.diagnosisType || diagnosis.diagnosisType;
            const badgeStyle = getDiagnosisBadgeStyle(activeDiagnosisType);

            const prescription = generatePedagogicalPrescription({
              conceptId: gap.conceptId,
              conceptName: gap.conceptName,
              subject: gap.subjectCode || gap.subjectName,
              status: gap.dynamicStatus || gap.masteryStatus || gap.status,
              diagnosisType: activeDiagnosisType,
              previousScore: gap.previousPercentage,
              currentScore: gap.latestPercentage,
              scoreDelta: gap.deltaPercentagePoints,
              trend: gap.trend,
              language,
            });

            const displayedReason =
              gap.reason && !gap.reason.includes("is below the operational mastery threshold")
                ? gap.reason
                : diagnosis.explanation;

            return (
              <Card
                key={gap.id}
                variant="glass"
                className={`p-6 border-[#49352F]/12 bg-white text-[#49352F] space-y-4 transition-all hover:border-[#49352F]/25 shadow-xs ${
                  gap.dynamicIsGap ? "border-l-4 border-l-[#C54738]" : "border-l-4 border-l-[#2E7D5E]"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-heading text-lg font-bold text-[#49352F]">
                        {gap.conceptName}
                      </h3>
                      <Badge
                        variant={
                          normalizePriority(gap.priority) === "High Priority"
                            ? "high"
                            : normalizePriority(gap.priority) === "Medium Priority"
                            ? "medium"
                            : "low"
                        }
                        size="sm"
                        dot
                      >
                        {formatPriority(gap.priority)}
                      </Badge>
                      <Badge
                        variant={
                          normalizeGapStatus(gap.dynamicStatus || gap.masteryStatus) === "Needs Support"
                            ? "needsSupport"
                            : normalizeGapStatus(gap.dynamicStatus || gap.masteryStatus) === "Developing"
                            ? "developing"
                            : "mastered"
                        }
                        size="sm"
                      >
                        {formatStatus(gap.dynamicStatus || gap.masteryStatus)}
                      </Badge>
                      {/* Lightweight Assessment Progress Trend Indicator */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${trendInfo.badgeBorderClass} ${trendInfo.badgeBgClass} ${trendInfo.badgeTextClass}`}
                      >
                        {language === "gu" ? trendInfo.formattedBadgeGu : trendInfo.formattedBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#7A6862] mt-1">
                      <Link
                        href={`/students/${gap.studentId}`}
                        className="font-semibold text-[#B26A1B] hover:underline"
                      >
                        {gap.studentName}
                      </Link>
                      {formatClass(gap.grade, gap.section) && (
                        <>
                          <span>•</span>
                          <span>{formatClass(gap.grade, gap.section)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {formatSubject(
                          gap.subjectCode || gap.subjectName || gap.conceptId || gap.conceptName
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="saffron"
                      size="sm"
                      onClick={() => handleGeneratePlan(gap.id)}
                      disabled={generatingPlanId === gap.id || !prescription.remedialPlanEligible}
                      className={`rounded-full text-xs font-bold ${
                        !prescription.remedialPlanEligible
                          ? "opacity-60 cursor-not-allowed bg-stone-100 text-stone-500 hover:bg-stone-100 border border-stone-200"
                          : ""
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      <span>
                        {generatingPlanId === gap.id
                          ? language === "gu"
                            ? "બનાવી રહ્યું છે..."
                            : "Generating..."
                          : !prescription.remedialPlanEligible
                          ? language === "gu"
                            ? "નિપુણતા જાળવણી"
                            : "Mastery Maintained"
                          : language === "gu"
                          ? "૫-પગલાં યોજના બનાવો"
                          : "Generate 5-Step Plan"}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTargetGapForReassessment(gap);
                        setReassessModalOpen(true);
                      }}
                      className="rounded-full text-xs bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      <span>{language === "gu" ? "ડેલ્ટા પુનઃમૂલ્યાંકન" : "Reassess Delta"}</span>
                    </Button>
                  </div>
                </div>

                {/* Animated Bridge Progress Bar */}
                <BridgeProgress
                  score={gap.latestPercentage}
                  previousScore={gap.previousPercentage}
                  thresholdDeveloping={supportThreshold}
                  thresholdMastery={masteryThreshold}
                  studentName={gap.studentName}
                  height="md"
                />

                {/* Explainable AI Diagnosis Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                      {/* "Why Flagged" in Plain Language vs "Mastery Evidence" */}
                      <div data-tour="gaps-why-flagged" className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-1.5 text-[#49352F]">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          {gap.dynamicStatus === "Mastered" || activeDiagnosisType === "Mastered" || gap.status === "Resolved" ? (
                            <span className="font-bold uppercase tracking-wider text-[#2E7D5E] text-[10px] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#2E7D5E]" />
                              <span>{language === "gu" ? "પ્રભુત્વ પ્રમાણ (MASTERY EVIDENCE)" : "Mastery Evidence"}</span>
                              <ContextualHelp termKey="gapDetection" />
                            </span>
                          ) : (
                            <span className="font-bold uppercase tracking-wider text-[#C54738] text-[10px] flex items-center gap-1.5">
                              <BrainCircuit className="w-3.5 h-3.5 shrink-0 text-[#C54738]" />
                              <span>{language === "gu" ? "શા માટે ચિહ્નિત (જ્ઞાનાત્મક અવરોધ)" : "Why Flagged (Cognitive Obstacle)"}</span>
                              <ContextualHelp termKey="gapDetection" />
                            </span>
                          )}
                          {activeDiagnosisType && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle.borderClass} ${badgeStyle.bgClass} ${badgeStyle.textClass}`}>
                              {language === "gu" ? badgeStyle.labelGu : badgeStyle.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[#49352F] leading-relaxed">
                          {gap.dynamicStatus === "Mastered" || activeDiagnosisType === "Mastered" || gap.status === "Resolved"
                            ? getMasteryEvidenceText(gap.latestPercentage || 0, masteryThreshold, language)
                            : displayedReason}
                        </p>
                        <div className={`text-[11px] pt-1 font-mono ${
                          gap.dynamicStatus === "Mastered" || activeDiagnosisType === "Mastered" || gap.status === "Resolved"
                            ? "text-[#2E7D5E]"
                            : "text-[#7A6862]"
                        }`}>
                          {gap.dynamicStatus === "Mastered" || activeDiagnosisType === "Mastered" || gap.status === "Resolved"
                            ? language === "gu"
                              ? `માપદંડ: ${gap.latestPercentage}% સ્કોર (પ્રભુત્વ બેન્ચમાર્ક: ≥ ${masteryThreshold}%)`
                              : `Metric: ${gap.latestPercentage}% score (Mastery Benchmark: ≥ ${masteryThreshold}%)`
                            : language === "gu"
                            ? `માપદંડ: ${gap.latestPercentage}% સ્કોર (લક્ષ્ય: ≥ ${supportThreshold}%)`
                            : `Metric: ${gap.latestPercentage}% score (Target: ≥ ${supportThreshold}%)`}
                        </div>
                      </div>

                      {/* Actionable Next Step: Pedagogical Prescription */}
                      <div data-tour="gaps-action-plan" className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2 text-[#49352F]">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="font-bold uppercase tracking-wider text-[#B26A1B] text-[10px] flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                            <span>{language === "gu" ? "શિક્ષણશાસ્ત્રીય માર્ગદર્શન" : "Pedagogical Prescription"}</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#B26A1B]/30 bg-[#FAF6E9] text-[#B26A1B]">
                            {language === "gu" ? prescription.recommendationTypeGu : prescription.recommendationType} · {prescription.duration}
                          </span>
                        </div>

                        {/* 1. Recommended Activity */}
                        <p className="text-[#49352F] leading-relaxed">
                          <span className="font-bold text-[#49352F]">
                            {language === "gu" ? "ભલામણ કરેલ પ્રવૃત્તિ: " : "Recommended Activity: "}
                          </span>
                          {prescription.activity}
                        </p>

                        {/* 2. Why It Matches This Gap */}
                        <p className="text-[11px] text-[#7A6862] leading-normal">
                          <span className="font-semibold text-[#49352F]">
                            {language === "gu" ? "શિક્ષણશાસ્ત્રીય તર્ક: " : "Why It Matches: "}
                          </span>
                          {prescription.reason}
                        </p>

                        {/* 3 & 4. Duration & Reassessment */}
                        <div className="text-[11px] text-[#7A6862] leading-normal pt-0.5">
                          <span className="font-semibold text-[#49352F]">
                            {language === "gu" ? "પુનઃમૂલ્યાંકન: " : "Reassessment: "}
                          </span>
                          {prescription.reassessment}
                        </div>

                        {/* Plan Status / Maintenance Footer */}
                        <div className={`text-[11px] pt-1 font-semibold flex items-center gap-1 ${prescription.remedialPlanEligible ? "text-[#2E7D5E]" : "text-[#B26A1B]"}`}>
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>{language === "gu" ? prescription.planStatusLabelGu : prescription.planStatusLabel}</span>
                        </div>
                      </div>
                    </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reassessment Modal */}
      {reassessModalOpen && targetGapForReassessment && (
        <ReassessmentModal
          isOpen={reassessModalOpen}
          onClose={() => setReassessModalOpen(false)}
          studentId={targetGapForReassessment.studentId}
          studentName={targetGapForReassessment.studentName}
          conceptId={targetGapForReassessment.conceptId}
          conceptName={targetGapForReassessment.conceptName}
          previousPercentage={targetGapForReassessment.latestPercentage || 35}
          supportThreshold={supportThreshold}
          masteryThreshold={masteryThreshold}
          onSuccess={() => fetchGaps()}
        />
      )}
      {/* Guided Tour */}
          </AppLayout>
  );
}
