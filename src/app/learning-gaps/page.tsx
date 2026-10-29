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
  const { t, language } = useLanguage();

  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [competencyFilter, setCompetencyFilter] = useState("all");
  const [supportStatusFilter, setSupportStatusFilter] = useState("all");
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

  // Unique options for filters
  const uniqueClasses = Array.from(
    new Set(gaps.map((g) => g.classroomId || (g.grade ? `cls-${g.grade}a` : null)).filter(Boolean))
  );
  const uniqueSubjects = Array.from(new Set(gaps.map((g) => g.subjectCode).filter(Boolean)));
  const uniqueCompetencies = Array.from(new Set(gaps.map((g) => g.conceptName).filter(Boolean)));

  const isAnyFilterActive =
    priorityFilter !== "all" ||
    statusFilter !== "all" ||
    classFilter !== "all" ||
    subjectFilter !== "all" ||
    competencyFilter !== "all" ||
    supportStatusFilter !== "all";

  const resetAllFilters = () => {
    setPriorityFilter("all");
    setStatusFilter("all");
    setClassFilter("all");
    setSubjectFilter("all");
    setCompetencyFilter("all");
    setSupportStatusFilter("all");
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
    if (classFilter !== "all") {
      const classId = g.classroomId || (g.grade ? `cls-${g.grade}a` : "");
      if (classId !== classFilter && `Class ${g.grade}-${g.section}` !== classFilter) return false;
    }
    if (subjectFilter !== "all" && g.subjectCode !== subjectFilter) return false;
    if (competencyFilter !== "all" && g.conceptName !== competencyFilter) return false;
    if (supportStatusFilter !== "all" && g.dynamicStatus !== supportStatusFilter) return false;
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
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === "gu" ? "સ્માર્ટ લર્નિંગ ગેપ ડિટેક્શન એન્જિન" : "Smart Learning-Gap Detection Engine"}
              </h1>
              <Badge variant="saffron" size="sm" pulse>
                Deterministic AI
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Transparent, explainable pedagogical rule engine identifying student conceptual roadblocks with plain-language reasons.
            </p>
          </div>
        </div>

        {/* 1. THRESHOLD SLIDER SANDBOX DEMO (Signature Feature) */}
        <Card data-tour="gaps-threshold" variant="glass" className="p-5 border-amber-500/40 bg-gradient-to-r from-slate-900/90 via-[#14123D]/90 to-slate-900/90 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h3 className="font-heading text-sm font-bold text-white">
                Interactive Threshold Sandbox Demo
              </h3>
              <Badge variant="mint" size="sm">
                Jury Sandbox
              </Badge>
            </div>
            <span className="text-[11px] text-slate-400">
              Slide to simulate real-time rule engine threshold adjustments
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Slider 1: Needs Support Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Developing / Support Threshold:</span>
                  <ContextualHelp termKey="masteryThreshold" />
                </span>
                <span className="font-heading font-black text-rose-400 text-sm">
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
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[11px] text-slate-400">
                Any student scoring below {supportThreshold}% is flagged for immediate 5-step concrete remediation.
              </p>
            </div>

            {/* Slider 2: Mastery Benchmark Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Mastery Threshold:
                </span>
                <span className="font-heading font-black text-emerald-400 text-sm">
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
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                Students scoring &ge; {masteryThreshold}% cross the bridge into certified independent mastery.
              </p>
            </div>
          </div>

          {/* Sandbox Live Impact Stat Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Flagged Under Threshold</span>
              <span className="text-lg font-black text-rose-400">{flaggedCount} Gaps</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Over Mastery Threshold</span>
              <span className="text-lg font-black text-emerald-400">{masteredCount} Concepts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Decision Engine</span>
              <span className="text-lg font-black text-amber-400">Deterministic</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">API Latency / Cost</span>
              <span className="text-lg font-black text-emerald-400">0ms • $0.00</span>
            </div>
          </div>
        </Card>

        {/* Filter Controls */}
        <Card variant="glass" className="p-4 space-y-3 border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400">Class:</span>
                <select
                  value={classFilter}
                  aria-label="Filter learning gaps by class"
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Classes</option>
                  <option value="cls-3a">Class 3-A</option>
                  <option value="cls-4a">Class 4-A</option>
                  <option value="cls-5a">Class 5-A</option>
                  {uniqueClasses
                    .filter((c) => !["cls-3a", "cls-4a", "cls-5a"].includes(c))
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400">Subject:</span>
                <select
                  value={subjectFilter}
                  aria-label="Filter learning gaps by subject"
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  <option value="MATH">Mathematics</option>
                  <option value="GUJ">Gujarati</option>
                  <option value="ENG">English</option>
                  <option value="EVS">EVS</option>
                  {uniqueSubjects
                    .filter((s) => !["MATH", "GUJ", "ENG", "EVS"].includes(s))
                    .map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
              </div>

              {/* Competency Filter */}
              {uniqueCompetencies.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-400">Competency:</span>
                  <select
                    value={competencyFilter}
                    aria-label="Filter learning gaps by competency"
                    onChange={(e) => setCompetencyFilter(e.target.value)}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="all">All Competencies</option>
                    {uniqueCompetencies.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Support Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400">Classification:</span>
                <select
                  value={supportStatusFilter}
                  aria-label="Filter learning gaps by support status"
                  onChange={(e) => setSupportStatusFilter(e.target.value)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Classifications</option>
                  <option value="Needs Support">Needs Support (&lt; {supportThreshold}%)</option>
                  <option value="Developing">Developing ({supportThreshold}-{masteryThreshold}%)</option>
                  <option value="Mastered">Mastered (&ge; {masteryThreshold}%)</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400">Priority:</span>
                <select
                  value={priorityFilter}
                  aria-label="Filter learning gaps by priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400">Lifecycle:</span>
                <select
                  value={statusFilter}
                  aria-label="Filter learning gaps by status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Lifecycles</option>
                  <option value="Active">Active</option>
                  <option value="Under Intervention">Under Intervention</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAnyFilterActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  className="rounded-full text-xs text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset Filters
                </Button>
              )}
              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredGaps.length} of {gaps.length} records
              </span>
            </div>
          </div>
        </Card>

        {/* 2. EXPLAINABLE AI GAP CARDS LIST OR EMPTY STATES */}
        <div className="space-y-4">
          {loading ? (
            <Card variant="glass" className="p-8 text-center border-slate-800">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <BrainCircuit className="w-5 h-5 animate-spin text-amber-400" />
                <span>Evaluating student assessment records with deterministic AI engine...</span>
              </div>
            </Card>
          ) : gaps.length === 0 ? (
            /* Empty State 1: No assessments or gaps in database */
            <Card variant="glass" className="p-12 text-center border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-white">No Learning Gaps Detected</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  There are currently no recorded learning gaps or assessments in the database. When teachers enter assessments in the Assessment module, the deterministic gap detection engine will automatically evaluate student competencies.
                </p>
              </div>
              <Link href="/assessments">
                <Button variant="saffron" size="sm" className="rounded-full">
                  Record First Assessment &rarr;
                </Button>
              </Link>
            </Card>
          ) : filteredGaps.length === 0 ? (
            /* Empty State 2: Active filters matched zero records */
            <Card variant="glass" className="p-10 text-center border-slate-800 space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-800/60 border border-slate-700 text-slate-400 mx-auto flex items-center justify-center">
                <Filter className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold text-white">No Matching Gaps Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No learning gaps match your currently selected filters. Adjust your criteria or reset all filters to view all records.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetAllFilters} className="rounded-full text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset All Filters
              </Button>
            </Card>
          ) : (
            filteredGaps.map((gap) => {
              const isNeedsSupport = gap.dynamicStatus === "Needs Support";
              const isMastered = gap.dynamicStatus === "Mastered";
              const scoreBadgeVariant = isNeedsSupport
                ? "needsSupport"
                : isMastered
                ? "mastered"
                : "developing";

              const formattedDate = gap.assessmentDate
                ? new Date(gap.assessmentDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Assessment Record";

              return (
                <Card
                  key={gap.id}
                  variant="glass"
                  className={`p-6 border-slate-800 space-y-4 transition-all hover:border-amber-500/50 ${
                    gap.dynamicIsGap ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-emerald-500"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-white">
                          {gap.conceptName}
                        </h3>
                        {gap.conceptNameGujarati && (
                          <span className="text-xs text-slate-400 font-normal">
                            ({gap.conceptNameGujarati})
                          </span>
                        )}
                        <Badge
                          variant={gap.priority === "High" ? "high" : "medium"}
                          size="sm"
                          dot
                        >
                          {gap.priority} Priority
                        </Badge>
                        <Badge
                          variant={scoreBadgeVariant as any}
                          size="sm"
                        >
                          {gap.dynamicStatus}
                        </Badge>
                        <Badge
                          variant="outline"
                          size="sm"
                          className="text-[10px] text-slate-400 border-slate-700"
                        >
                          Benchmark: {gap.dynamicIsGap ? `<${supportThreshold}%` : isMastered ? `≥${masteryThreshold}%` : `${supportThreshold}-${masteryThreshold}%`}
                        </Badge>
                      </div>

                      {/* Student & Assessment Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                        <Link
                          href={`/students/${gap.studentId}`}
                          className="font-semibold text-amber-400 hover:underline"
                        >
                          {gap.studentName}
                        </Link>
                        {gap.studentCode && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                            ID: {gap.studentCode}
                          </span>
                        )}
                        <span>•</span>
                        <span>Class {gap.grade}-{gap.section || "A"}</span>
                        <span>•</span>
                        <span>{gap.subjectName || gap.subjectCode || "Mathematics"}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-300">
                          Score: {gap.marksObtained !== undefined && gap.maximumMarks !== undefined
                            ? `${gap.marksObtained}/${gap.maximumMarks} (${gap.latestPercentage}%)`
                            : `${gap.latestPercentage}%`}
                        </span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {gap.remedialPlanId ? (
                        <Link href="/remedial-plans">
                          <Button
                            variant="mint"
                            size="sm"
                            className="rounded-full text-xs font-bold shadow-sm shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            <span>View 5-Step Plan</span>
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="saffron"
                          size="sm"
                          onClick={() => handleGeneratePlan(gap.id)}
                          disabled={generatingPlanId === gap.id}
                          className="rounded-full text-xs font-bold"
                        >
                          <Layers className="w-3.5 h-3.5 mr-1" />
                          <span>
                            {generatingPlanId === gap.id ? "Generating..." : "Generate 5-Step Plan"}
                          </span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTargetGapForReassessment(gap);
                          setReassessModalOpen(true);
                        }}
                        className="rounded-full text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>Reassess Delta</span>
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
                    <div data-tour="gaps-why-flagged" className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <span className="font-bold uppercase tracking-wider text-rose-400 text-[10px] flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        <span>Why Flagged (Cognitive Obstacle)</span>
                        <ContextualHelp termKey="gapDetection" />
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {gap.reason || "Performance dropped below developing benchmark across classroom observations."}
                      </p>
                      <div className="text-[11px] text-slate-400 pt-1 font-mono flex flex-wrap items-center gap-2">
                        <span>Score: {gap.latestPercentage}%</span>
                        <span>•</span>
                        <span>Support Threshold: &lt;{supportThreshold}%</span>
                        {gap.attemptsCount > 1 && gap.deltaPercentagePoints !== undefined && (
                          <>
                            <span>•</span>
                            <span className={gap.deltaPercentagePoints >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              Trend: {gap.previousPercentage}% &rarr; {gap.latestPercentage}% ({gap.deltaPercentagePoints >= 0 ? "+" : ""}{gap.deltaPercentagePoints} pp)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actionable Next Step */}
                    <div data-tour="gaps-action-plan" className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <span className="font-bold uppercase tracking-wider text-amber-400 text-[10px] flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5" />
                        Pedagogical Prescription
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {gap.suggestedAction || "Deploy Step 2 concrete manipulatives (counting beads / number lines) followed by paired practice."}
                      </p>
                      <div className="text-[11px] text-emerald-400 pt-1 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready for 5-Step Concrete Remedial Plan</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
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
