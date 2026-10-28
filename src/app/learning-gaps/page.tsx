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
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { ContextualHelp } from "@/components/shared/ContextualHelp";
import { broadcastDataUpdate, subscribeToDataUpdates } from "@/lib/events";
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
  const { t, language, formatSubject, formatPriority, formatStatus } = useLanguage();

  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const filteredGaps = processedGaps.filter((g) => {
    if (priorityFilter !== "all" && g.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    return true;
  });

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
                <option value="High">{language === "gu" ? "ઉચ્ચ અગ્રતા" : "High Priority"}</option>
                <option value="Medium">{language === "gu" ? "મધ્યમ અગ્રતા" : "Medium Priority"}</option>
                <option value="Low">{language === "gu" ? "ઓછી અગ્રતા" : "Low Priority"}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A6862]">
                {language === "gu" ? "સ્થિતિ:" : "Status:"}
              </span>
              <select
                value={statusFilter}
                aria-label="Filter learning gaps by status"
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-full border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
              >
                <option value="all">{language === "gu" ? "બધી સ્થિતિ" : "All Statuses"}</option>
                <option value="Active">{language === "gu" ? "સક્રિય" : "Active"}</option>
                <option value="Under Intervention">{language === "gu" ? "હસ્તક્ષેપ હેઠળ" : "Under Intervention"}</option>
                <option value="Resolved">{language === "gu" ? "ઉકેલાયેલ" : "Resolved"}</option>
              </select>
            </div>
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
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-heading text-lg font-bold text-[#49352F]">
                        {gap.conceptName}
                      </h3>
                      <Badge
                        variant={gap.priority === "High" ? "high" : "medium"}
                        size="sm"
                        dot
                      >
                        {formatPriority(gap.priority)} {language === "gu" ? "અગ્રતા" : "Priority"}
                      </Badge>
                      <Badge
                        variant={gap.dynamicIsGap ? "needsSupport" : "mastered"}
                        size="sm"
                      >
                        {formatStatus(gap.dynamicStatus)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#7A6862] mt-1">
                      <Link
                        href={`/students/${gap.studentId}`}
                        className="font-semibold text-[#B26A1B] hover:underline"
                      >
                        {gap.studentName}
                      </Link>
                      <span>•</span>
                      <span>{language === "gu" ? `ધોરણ ${gap.grade}-${gap.section}` : `Class ${gap.grade}-${gap.section}`}</span>
                      <span>•</span>
                      <span>{formatSubject(gap.subjectName || "Mathematics")}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="saffron"
                      size="sm"
                      onClick={() => handleGeneratePlan(gap.id)}
                      disabled={generatingPlanId === gap.id}
                      className="rounded-full text-xs font-bold"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      <span>
                        {generatingPlanId === gap.id
                          ? language === "gu"
                            ? "બનાવી રહ્યું છે..."
                            : "Generating..."
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
                  {/* "Why Flagged" in Plain Language */}
                  <div data-tour="gaps-why-flagged" className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-1.5 text-[#49352F]">
                    <span className="font-bold uppercase tracking-wider text-[#C54738] text-[10px] flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>{language === "gu" ? "શા માટે ચિહ્નિત (જ્ઞાનાત્મક અવરોધ)" : "Why Flagged (Cognitive Obstacle)"}</span>
                      <ContextualHelp termKey="gapDetection" />
                    </span>
                    <p className="text-[#49352F] leading-relaxed">
                      {gap.reason || (language === "gu"
                        ? "સતત વર્ગખંડ અવલોકનોમાં પ્રદર્શન ૬૦% પ્રગતિશીલ બેન્ચમાર્કથી નીચે ગયું."
                        : "Performance dropped below 60% developing benchmark across consecutive classroom observations.")}
                    </p>
                    <div className="text-[11px] text-[#7A6862] pt-1 font-mono">
                      {language === "gu"
                        ? `માપદંડ: ${gap.latestPercentage}% સ્કોર (લક્ષ્ય: ≥ ${supportThreshold}%)`
                        : `Metric: ${gap.latestPercentage}% score (Target: ≥ ${supportThreshold}%)`}
                    </div>
                  </div>

                  {/* Actionable Next Step */}
                  <div data-tour="gaps-action-plan" className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-1.5 text-[#49352F]">
                    <span className="font-bold uppercase tracking-wider text-[#B26A1B] text-[10px] flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" />
                      {language === "gu" ? "શિક્ષણશાસ્ત્રીય માર્ગદર્શન" : "Pedagogical Prescription"}
                    </span>
                    <p className="text-[#49352F] leading-relaxed">
                      {gap.suggestedAction || (language === "gu"
                        ? "પગલું ૨ મૂર્ત સાધનો (ગણતરી મણકા / સંખ્યા રેખાઓ) નો ઉપયોગ કરો ત્યારબાદ જોડી મહાવરો કરાવો."
                        : "Deploy Step 2 concrete manipulatives (counting beads / number lines) followed by paired practice.")}
                    </p>
                    <div className="text-[11px] text-[#2E7D5E] pt-1 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{language === "gu" ? "૫-પગલાં પ્રવૃત્તિ આધારિત ઉપચાર માટે તૈયાર" : "Ready for 5-Step Concrete Remedial Plan"}</span>
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
          onSuccess={() => fetchGaps()}
        />
      )}
      {/* Guided Tour */}
      <SpotlightTour page="learningGaps" />
    </AppLayout>
  );
}
