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
import { calculateGapSeverity } from "@/lib/engine/severityEngine";
import { diagnoseLearningGap } from "@/lib/engine/diagnosisEngine";
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
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

export default function LearningGapsPage() {
  const { t, language } = useLanguage();

  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);

  // Expandable question-level evidence state
  const [expandedEvidenceGapIds, setExpandedEvidenceGapIds] = useState<Record<string, boolean>>({});

  const toggleEvidence = (gapId: string) => {
    setExpandedEvidenceGapIds((prev) => ({
      ...prev,
      [gapId]: !prev[gapId],
    }));
  };

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
        fetchGaps();
      }
    } catch (e) {
      console.error("Error creating plan", e);
    } finally {
      setGeneratingPlanId(null);
    }
  };

  // Safe text and priority formatting helpers with normalized severity score (0-100)
  const formatPriorityText = (priority?: string, severityScore?: number): string => {
    if (!priority) return "Medium Priority";
    const base = String(priority).replace(/\s*Priority$/i, "").trim();
    if (typeof severityScore === "number" && !isNaN(severityScore)) {
      return `${base} Priority (${severityScore}/100)`;
    }
    return `${base} Priority`;
  };

  const getPriorityBadgeVariant = (priority?: string): "high" | "medium" | "low" => {
    const clean = String(priority || "").toLowerCase();
    if (clean.includes("critical") || clean.includes("high")) return "high";
    if (clean.includes("medium")) return "medium";
    return "low";
  };

  const formatClassSection = (grade?: number, section?: string): string => {
    if (grade) {
      return section && section !== "undefined" ? `Class ${grade}-${section}` : `Class ${grade}`;
    }
    return "Primary Section";
  };

  const getSubjectLabel = (gap: any): string => {
    if (gap.subjectName && gap.subjectName !== "Mathematics") return gap.subjectName;
    if (gap.subjectCode === "ENG") return "English";
    if (gap.subjectCode === "GUJ") return "Gujarati";
    if (gap.subjectCode === "EVS") return "Environmental Studies";
    if (gap.subjectCode === "MATH") return "Mathematics";
    const cId = String(gap.conceptId || "").toLowerCase();
    const cName = String(gap.conceptName || "").toLowerCase();
    if (
      cId.includes("eng") ||
      cName.includes("comprehension") ||
      cName.includes("reading") ||
      cName.includes("verb") ||
      cName.includes("passage")
    ) {
      return "English";
    }
    if (cId.includes("guj") || cName.includes("માત્રા") || cName.includes("જોડાક્ષર")) {
      return "Gujarati";
    }
    if (
      cId.includes("evs") ||
      cName.includes("water") ||
      cName.includes("plant") ||
      cName.includes("environment")
    ) {
      return "Environmental Studies";
    }
    return gap.subjectName || "Mathematics";
  };

  // Recalculate gap status & severity dynamically using the Sandbox threshold sliders with internal lifecycle & trajectory distinction
  const processedGaps = gaps.map((g) => {
    const score = Number(g.currentScore ?? g.latestPercentage ?? 0);
    const prevScore = g.previousScore ?? g.previousPercentage;
    const trend = g.trend || "Insufficient Data";

    // Dynamic Learning Gap Severity Engine evaluation (0-100)
    const severity = calculateGapSeverity({
      currentScore: score,
      previousScore: prevScore,
      scoreDelta: g.scoreDelta ?? g.deltaPercentagePoints,
      trend,
      attemptCount: g.attemptCount || g.attemptsCount || 1,
      evidenceCount: g.evidenceCount || g.attemptsCount || 1,
      supportThreshold,
      masteryThreshold,
      prerequisitesMastered: g.prerequisitesMastered ?? true,
      hasRepeatedErrors: g.hasRepeatedErrors ?? false,
      recencyDays: g.recencyDays,
    });

    // Evaluate status considering both thresholds and trajectory:
    // If student was previously at/near mastery and is now declining (e.g. Student B: 90% -> 82% -> 75%),
    // they require attention (Needs Support / Active Gap) even if 75% is technically above supportThreshold!
    const isDecliningFromMastery =
      trend === "Declining" &&
      prevScore !== undefined &&
      (prevScore >= masteryThreshold || (g.totalDelta !== undefined && g.totalDelta <= -10));

    let dynamicStatus: "Needs Support" | "Developing" | "Mastered";
    let dynamicLifecycle: "Active Gap" | "Monitoring/Developing" | "Closed Gap";

    if (score >= masteryThreshold) {
      dynamicStatus = "Mastered";
      dynamicLifecycle = trend === "Declining" ? "Monitoring/Developing" : "Closed Gap";
    } else if (score < supportThreshold || isDecliningFromMastery) {
      dynamicStatus = "Needs Support";
      dynamicLifecycle = "Active Gap";
    } else {
      dynamicStatus = "Developing";
      dynamicLifecycle = "Monitoring/Developing";
    }

    const dynamicPriority = severity.severityLevel;
    const dynamicSeverityScore = severity.severityScore;
    const dynamicSeverityReasons = severity.severityReasons;

    // Dynamic Learning Gap Diagnosis Engine (Classification into 6 categories)
    const diagnosis = diagnoseLearningGap({
      conceptId: g.conceptId,
      conceptName: g.conceptName,
      subjectCode: g.subjectCode,
      subjectName: g.subjectName,
      currentScore: score,
      previousScore: prevScore,
      scoreDelta: g.scoreDelta ?? g.deltaPercentagePoints,
      trend,
      attemptCount: g.attemptCount || g.attemptsCount || 1,
      evidenceCount: g.evidenceCount || g.attemptsCount || 1,
      assessmentsCount: g.assessmentsAnalyzed || g.evidenceCount || g.attemptsCount || 1,
      questionsCount: g.questionsAnalyzed,
      supportThreshold,
      masteryThreshold,
      prerequisitesMastered: g.prerequisitesMastered ?? true,
      hasRepeatedErrors: g.hasRepeatedErrors ?? false,
      recencyDays: g.recencyDays,
      errorPattern: g.errorPatternDetected || g.reason,
      questionEvidence: g.questionEvidence,
    });

    const dynamicGapType = g.gapType || diagnosis.gapType;
    const dynamicGapTypeReason = g.gapTypeReason || diagnosis.gapTypeReason;
    const dynamicConfidence = g.confidence ?? diagnosis.confidence;
    const dynamicConfidenceScore = g.confidenceScore ?? diagnosis.confidenceScore ?? dynamicConfidence;
    const dynamicConfidenceLevel = g.confidenceLevel || diagnosis.confidenceLevel;
    const dynamicDiagnosis = g.diagnosis || diagnosis.diagnosis;
    const dynamicDiagnosisTitle = g.diagnosisTitle || diagnosis.diagnosisTitle;
    const dynamicAssessmentsAnalyzed = g.assessmentsAnalyzed ?? diagnosis.assessmentsAnalyzed;
    const dynamicQuestionsAnalyzed = g.questionsAnalyzed ?? diagnosis.questionsAnalyzed;
    const dynamicErrorPatternDetected = g.errorPatternDetected || diagnosis.errorPatternDetected;
    const dynamicTriggerRule = g.triggerRule || diagnosis.triggerRule;
    const dynamicSupportingEvidence = g.supportingEvidence || diagnosis.supportingEvidence;
    const dynamicQuestionEvidence = g.questionEvidence || diagnosis.questionEvidence || [];
    const dynamicHasQuestionLevelEvidence = dynamicQuestionEvidence.length > 0;
    const dynamicLowConfidenceDisclaimer = diagnosis.lowConfidenceDisclaimer;
    const dynamicRecommendedDiagnosticAction = diagnosis.recommendedDiagnosticAction;

    // A concept reaching mastery should no longer be treated as an unresolved active learning gap
    const dynamicIsGap = dynamicLifecycle === "Active Gap";

    return {
      ...g,
      dynamicStatus,
      dynamicLifecycle,
      dynamicPriority,
      dynamicSeverityScore,
      dynamicSeverityReasons,
      dynamicGapType,
      dynamicGapTypeReason,
      dynamicConfidence,
      dynamicConfidenceScore,
      dynamicConfidenceLevel,
      dynamicDiagnosis,
      dynamicDiagnosisTitle,
      dynamicAssessmentsAnalyzed,
      dynamicQuestionsAnalyzed,
      dynamicErrorPatternDetected,
      dynamicTriggerRule,
      dynamicSupportingEvidence,
      dynamicQuestionEvidence,
      dynamicHasQuestionLevelEvidence,
      dynamicLowConfidenceDisclaimer,
      dynamicRecommendedDiagnosticAction,
      dynamicIsGap,
    };
  });

  const filteredGaps = processedGaps.filter((g) => {
    if (priorityFilter !== "all") {
      const cleanFilter = priorityFilter.toLowerCase().replace(/\s*priority$/i, "");
      const gapPriority = String(g.dynamicPriority || g.severityLevel || g.priority || "").toLowerCase().replace(/\s*priority$/i, "");
      if (gapPriority !== cleanFilter) return false;
    }

    if (statusFilter !== "all") {
      const target = statusFilter.toLowerCase();
      const matches =
        g.dynamicLifecycle?.toLowerCase() === target ||
        g.status?.toLowerCase() === target ||
        (target.includes("active") &&
          (g.dynamicLifecycle === "Active Gap" || g.status === "Active" || g.status === "Active Gap")) ||
        (target.includes("monitoring") &&
          (g.dynamicLifecycle === "Monitoring/Developing" ||
            g.status === "Under Intervention" ||
            g.status === "Monitoring/Developing")) ||
        (target.includes("closed") &&
          (g.dynamicLifecycle === "Closed Gap" ||
            g.status === "Resolved" ||
            g.status === "Closed Gap" ||
            g.dynamicStatus === "Mastered"));

      if (!matches) return false;
    }

    return true;
  });

  const flaggedCount = processedGaps.filter((g) => g.dynamicLifecycle === "Active Gap").length;
  const masteredCount = processedGaps.filter((g) => g.dynamicLifecycle === "Closed Gap").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight">
                {language === "gu" ? "સ્માર્ટ લર્નિંગ ગેપ ડિટેક્શન એન્જિન" : "Smart Learning-Gap Detection Engine"}
              </h1>
              <Badge variant="saffron" size="sm" pulse>
                Deterministic AI
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1">
              Transparent, explainable pedagogical rule engine identifying student conceptual roadblocks with plain-language reasons.
            </p>
          </div>
        </div>

        {/* 1. THRESHOLD SLIDER SANDBOX DEMO (Signature Feature) */}
        <Card data-tour="gaps-threshold" variant="glass" className="p-5 border-[#49352F]/15 bg-gradient-to-r from-[#F2DCB5]/80 via-[#FAF6E9] to-[#F2CAB3]/70 shadow-[0_8px_24px_rgba(73,53,47,0.06)] space-y-4 text-[#49352F]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#B26A1B]" />
              <h3 className="font-heading text-sm font-bold text-[#49352F]">
                Interactive Threshold Sandbox Demo
              </h3>
              <Badge variant="mint" size="sm">
                Jury Sandbox
              </Badge>
            </div>
            <span className="text-[11px] text-[#7A6862]">
              Slide to simulate real-time rule engine threshold adjustments
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Slider 1: Needs Support Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#C54738] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C54738]" />
                  <span>Developing / Support Threshold:</span>
                  <ContextualHelp termKey="masteryThreshold" />
                </span>
                <span className="font-heading font-black text-[#C54738] text-sm">
                  {supportThreshold}% Benchmark
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
                Any student scoring below {supportThreshold}% is flagged for immediate 5-step concrete remediation.
              </p>
            </div>

            {/* Slider 2: Mastery Benchmark Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2E7D5E] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5E]" />
                  Mastery Threshold:
                </span>
                <span className="font-heading font-black text-[#2E7D5E] text-sm">
                  {masteryThreshold}% Benchmark
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
                Students scoring &ge; {masteryThreshold}% cross the bridge into certified independent mastery.
              </p>
            </div>
          </div>

          {/* Sandbox Live Impact Stat Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#49352F]/10 text-xs">
            <div className="p-2.5 rounded-xl bg-white/90 border border-[#49352F]/10 text-center shadow-xs">
              <span className="text-[10px] text-[#7A6862] block font-semibold">Flagged Under Threshold</span>
              <span className="text-lg font-black text-[#C54738]">{flaggedCount} Gaps</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-[#49352F]/10 text-center shadow-xs">
              <span className="text-[10px] text-[#7A6862] block font-semibold">Over Mastery Threshold</span>
              <span className="text-lg font-black text-[#2E7D5E]">{masteredCount} Concepts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-[#49352F]/10 text-center shadow-xs">
              <span className="text-[10px] text-[#7A6862] block font-semibold">Decision Engine</span>
              <span className="text-lg font-black text-[#B26A1B]">Deterministic</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 border border-[#49352F]/10 text-center shadow-xs">
              <span className="text-[10px] text-[#7A6862] block font-semibold">API Latency / Cost</span>
              <span className="text-lg font-black text-[#2E7D5E]">0ms • $0.00</span>
            </div>
          </div>
        </Card>

        {/* Filter Controls */}
        <Card variant="glass" className="p-3.5 flex flex-wrap items-center justify-between gap-3 border-[#49352F]/15 bg-white text-[#49352F] shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A6862]">Priority:</span>
              <select
                value={priorityFilter}
                aria-label="Filter learning gaps by priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-full border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A6862]">Status:</span>
              <select
                value={statusFilter}
                aria-label="Filter learning gaps by status"
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-full border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Active Gap">Active Gaps</option>
                <option value="Monitoring/Developing">Monitoring / Developing</option>
                <option value="Closed Gap">Closed Gaps (Mastered)</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-[#7A6862]">
            Showing {filteredGaps.length} detected learning gaps
          </span>
        </Card>

        {/* 2. EXPLAINABLE AI GAP CARDS LIST */}
        <div className="space-y-4">
          {filteredGaps.map((gap) => {
            const isResolved = gap.status === "Closed Gap" || gap.status === "Resolved" || gap.dynamicStatus === "Mastered";

            return (
              <Card
                key={gap.id}
                variant="glass"
                className={`p-6 border-[#49352F]/12 bg-white text-[#49352F] space-y-4 transition-all hover:border-[#49352F]/25 shadow-xs ${
                  gap.dynamicStatus === "Mastered"
                    ? "border-l-4 border-l-[#2E7D5E]"
                    : gap.dynamicStatus === "Developing"
                    ? "border-l-4 border-l-[#B26A1B]"
                    : "border-l-4 border-l-[#C54738]"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg font-bold text-[#49352F]">
                        {gap.conceptName || "Curricular Concept"}
                      </h3>
                      <Badge
                        variant={getPriorityBadgeVariant(gap.dynamicPriority || gap.priority)}
                        size="sm"
                        dot
                      >
                        {formatPriorityText(gap.dynamicPriority || gap.priority, gap.dynamicSeverityScore ?? gap.severityScore)}
                      </Badge>
                      <Badge
                        variant={
                          gap.dynamicStatus === "Mastered"
                            ? "mastered"
                            : gap.dynamicStatus === "Developing"
                            ? "developing"
                            : "needsSupport"
                        }
                        size="sm"
                      >
                        {gap.dynamicLifecycle || gap.dynamicStatus}
                      </Badge>
                      {gap.trendText && (
                        <Badge
                          variant={
                            gap.trend === "Improving"
                              ? "mint"
                              : gap.trend === "Declining"
                              ? "coral"
                              : "default"
                          }
                          size="sm"
                        >
                          {gap.trendText}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A6862] mt-1">
                      <Link
                        href={`/students/${gap.studentId}`}
                        className="font-semibold text-[#B26A1B] hover:underline"
                      >
                        {gap.studentName || "Student"}
                      </Link>
                      <span>•</span>
                      <span>{formatClassSection(gap.grade, gap.section)}</span>
                      <span>•</span>
                      <span>{getSubjectLabel(gap)}</span>
                      {(gap.evidenceCount || gap.attemptsCount) > 1 && (
                        <>
                          <span>•</span>
                          <span>{gap.evidenceCount || gap.attemptsCount} Observations</span>
                        </>
                      )}
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
                      <span>{generatingPlanId === gap.id ? "Generating..." : "Generate 5-Step Plan"}</span>
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
                      <span>Reassess Delta</span>
                    </Button>
                  </div>
                </div>

                {/* Animated Bridge Progress Bar */}
                <BridgeProgress
                  score={gap.latestPercentage ?? 0}
                  previousScore={gap.previousPercentage}
                  thresholdDeveloping={supportThreshold}
                  thresholdMastery={masteryThreshold}
                  studentName={gap.studentName || "Student"}
                  height="md"
                />

                {/* Explainable AI Diagnosis Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  {/* Explainable Cognitive Diagnosis Card */}
                  <div data-tour="gaps-why-flagged" className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2.5 text-[#49352F]">
                    {/* Header Row: Title & Confidence Level */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#49352F]/10 pb-1.5">
                      <span className="font-bold uppercase tracking-wider text-[#C54738] text-[10px] flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        <span>
                          {gap.dynamicStatus === "Mastered"
                            ? "Mastery Status (Verified Benchmark)"
                            : "Why Flagged (Explainable Diagnosis)"}
                        </span>
                        <ContextualHelp termKey="gapDetection" />
                      </span>
                      {gap.dynamicStatus !== "Mastered" && (
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              gap.dynamicConfidenceLevel === "High"
                                ? "mint"
                                : gap.dynamicConfidenceLevel === "Medium"
                                ? "amber"
                                : "coral"
                            }
                            size="sm"
                          >
                            {gap.dynamicConfidenceLevel} Confidence ({Math.round(((gap.dynamicConfidenceScore ?? gap.dynamicConfidence) || 0.85) * 100)}%)
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Diagnosis & Gap Type Header */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6862]">
                          Diagnosis:
                        </span>
                        <span className="font-heading font-bold text-xs text-[#49352F]">
                          {gap.dynamicConfidenceLevel === "Low"
                            ? "Uncertain (Diagnostic Verification Required)"
                            : gap.dynamicDiagnosis || gap.dynamicGapType}
                        </span>
                        <Badge variant="saffron" size="sm">
                          {gap.dynamicGapType}
                        </Badge>
                      </div>

                      {/* Low-confidence caution (do not present as certain) */}
                      {gap.dynamicConfidenceLevel === "Low" ? (
                        <div className="p-2 rounded-xl bg-[#FBECE9] border border-[#C54738]/25 text-[#A93327] text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Insufficient evidence — run a short diagnostic check.</span>
                        </div>
                      ) : (
                        <p className="text-[#49352F] leading-relaxed text-xs">
                          {gap.dynamicStatus === "Mastered"
                            ? gap.reason || "Concept successfully mastered with verified retention above the mastery benchmark."
                            : gap.dynamicGapTypeReason || gap.gapTypeReason || gap.reason || "Performance dropped below developing benchmark across consecutive classroom observations."}
                        </p>
                      )}
                    </div>

                    {/* Diagnostic Metrics: Threshold, Assessments Analyzed, Questions Analyzed, Error Pattern */}
                    <div className="p-2.5 rounded-xl bg-white/70 border border-[#49352F]/10 space-y-1.5 text-[11px]">
                      <div>
                        <span className="font-semibold text-[#49352F]">Trigger Rule: </span>
                        <span className="text-[#7A6862]">{gap.dynamicTriggerRule}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[#7A6862]">
                        <span>
                          Assessments Analyzed: <strong className="text-[#49352F]">{gap.dynamicAssessmentsAnalyzed}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Relevant Questions Analyzed: <strong className="text-[#49352F]">{gap.dynamicQuestionsAnalyzed}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Score: <strong className="text-[#49352F]">{gap.currentScore ?? gap.latestPercentage}%</strong> (Target: &ge; {supportThreshold}%)
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-[#49352F]">Error Pattern Detected: </span>
                        <span className="font-medium text-[#C54738]">{gap.dynamicErrorPatternDetected}</span>
                      </div>
                    </div>

                    {/* Supporting Evidence List */}
                    {gap.dynamicSupportingEvidence && gap.dynamicSupportingEvidence.length > 0 && (
                      <div className="space-y-1 pt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6862] block">
                          Supporting Evidence:
                        </span>
                        <ul className="text-[11px] text-[#49352F] space-y-0.5 list-disc list-inside">
                          {gap.dynamicSupportingEvidence.map((ev: string, evIdx: number) => (
                            <li key={evIdx} className="leading-tight">{ev}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Expandable "View Evidence" Interaction */}
                    <div className="pt-1 border-t border-[#49352F]/10">
                      <button
                        type="button"
                        onClick={() => toggleEvidence(gap.id)}
                        className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-[#B26A1B] hover:text-[#8D4E10] transition-colors cursor-pointer"
                        aria-expanded={Boolean(expandedEvidenceGapIds[gap.id])}
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {expandedEvidenceGapIds[gap.id]
                              ? "Hide Question-Level Evidence"
                              : "View Evidence (Question Responses)"}
                          </span>
                          {gap.dynamicQuestionEvidence && gap.dynamicQuestionEvidence.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#B26A1B]/15 text-[10px] font-mono">
                              {gap.dynamicQuestionEvidence.length} {gap.dynamicQuestionEvidence.length === 1 ? "question" : "questions"}
                            </span>
                          )}
                        </span>
                        {expandedEvidenceGapIds[gap.id] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedEvidenceGapIds[gap.id] && (
                        <div className="mt-2 space-y-2">
                          {gap.dynamicQuestionEvidence && gap.dynamicQuestionEvidence.length > 0 ? (
                            gap.dynamicQuestionEvidence.map((q: any, qIdx: number) => (
                              <div
                                key={qIdx}
                                className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-[#49352F]">
                                    Q{q.questionNumber || qIdx + 1}: {q.topic || "Target Item"}
                                  </span>
                                  {q.relatedConcept && (
                                    <span className="rounded bg-[#FAF6E9] px-1.5 py-0.5 border border-[#49352F]/10 font-mono text-[9px] text-[#7A6862]">
                                      {q.relatedConcept}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-[#49352F] leading-snug">
                                  {q.questionText}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] pt-0.5">
                                  <div className="p-1.5 rounded-lg bg-[#FBECE9] border border-[#C54738]/20">
                                    <span className="text-[#A93327] font-semibold block">Student Response:</span>
                                    <span className="text-[#49352F] font-mono font-medium">{q.studentResponse}</span>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-[#EAF4EE] border border-[#2E7D5E]/20">
                                    <span className="text-[#2E7D5E] font-semibold block">Correct Response:</span>
                                    <span className="text-[#49352F] font-mono font-medium">{q.correctResponse}</span>
                                  </div>
                                </div>
                                <div className="text-[10px] pt-0.5">
                                  <span className="font-semibold text-[#A93327]">Detected Error: </span>
                                  <span className="text-[#49352F]">{q.detectedError}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2.5 rounded-xl bg-white/80 border border-[#49352F]/10 text-[11px] text-[#7A6862] space-y-1">
                              <div className="flex items-center gap-1 font-semibold text-[#49352F]">
                                <Info className="w-3.5 h-3.5 text-[#B26A1B]" />
                                <span>Question-level evidence unavailable for this record</span>
                              </div>
                              <p className="text-[10.5px] leading-relaxed">
                                This learning gap was recorded from an aggregate assessment score without itemized question logging.
                                A short 3–5 question diagnostic exit ticket is recommended to capture per-question student responses.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actionable Next Step */}
                  <div data-tour="gaps-action-plan" className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-1.5 text-[#49352F]">
                    <span className="font-bold uppercase tracking-wider text-[#B26A1B] text-[10px] flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Pedagogical Prescription
                    </span>
                    <p className="text-[#49352F] leading-relaxed">
                      {gap.dynamicStatus === "Mastered"
                        ? "Mastery certified; ready for advanced enrichment exercises or next curriculum topic."
                        : (gap.dynamicGapType === "Insufficient Evidence" || gap.gapType === "Insufficient Evidence")
                        ? gap.dynamicRecommendedDiagnosticAction || gap.suggestedAction || "Conduct a short 3-5 item diagnostic exit ticket with concrete physical manipulatives before prescribing full remediation."
                        : gap.suggestedAction || "Deploy Step 2 concrete manipulatives (counting beads / number lines) followed by paired practice."}
                    </p>
                    <div className="text-[11px] text-[#2E7D5E] pt-1 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {gap.dynamicStatus === "Mastered"
                          ? "Mastery Verified • Gap Closed"
                          : (gap.dynamicGapType === "Insufficient Evidence" || gap.gapType === "Insufficient Evidence")
                          ? "Recommend 3-5 Item Diagnostic Exit Ticket"
                          : "Ready for 5-Step Concrete Remedial Plan"}
                      </span>
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
