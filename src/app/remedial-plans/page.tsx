"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/context/LanguageContext";
import { ActivityPlayerModal } from "@/components/activities/ActivityPlayerModal";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { ContextualHelp } from "@/components/shared/ContextualHelp";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Printer,
  Boxes,
  Compass,
  FileCheck,
  Award,
  Layers,
  Circle,
  CheckSquare,
  Square,
  Search,
  Filter,
  Plus,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  ExternalLink,
} from "lucide-react";

// Step material icons mapping
function getStepMaterialIcon(stepNum: number) {
  switch (stepNum) {
    case 1:
      return <ClipboardList className="w-4 h-4 text-sky-400" />;
    case 2:
      return <Boxes className="w-4 h-4 text-amber-400" />;
    case 3:
      return <Compass className="w-4 h-4 text-teal-400" />;
    case 4:
      return <BookOpen className="w-4 h-4 text-indigo-400" />;
    case 5:
      return <Award className="w-4 h-4 text-emerald-400" />;
    default:
      return <Layers className="w-4 h-4 text-amber-400" />;
  }
}

// Activity Type Badge
function getActivityTypeBadge(type?: string) {
  switch (type) {
    case "discussion":
    case "instructional":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">Discussion / Review</span>;
    case "hands_on":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">Hands-on Tactile</span>;
    case "guided_practice":
    case "diagram_practice":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-800">Guided Modeling</span>;
    case "independent_practice":
    case "interactive_drill":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">Independent Practice</span>;
    case "check_for_understanding":
    case "verbal_explanation":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">Exit Check</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">Concrete Activity</span>;
  }
}

// Circular Progress Ring Component
function ProgressRing({
  completedSteps,
  totalSteps,
}: {
  completedSteps: number;
  totalSteps: number;
}) {
  const percentage = Math.round((completedSteps / Math.max(1, totalSteps)) * 100);
  const strokeWidth = 5;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width="56" height="56" className="transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={percentage === 100 ? "#3DDBA9" : "#FF8A3D"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute text-[11px] font-mono font-black text-white">
        {percentage}%
      </div>
    </div>
  );
}

export default function RemedialPlansPage() {
  const { t, language } = useLanguage();

  const [plans, setPlans] = useState<any[]>([]);
  const [learningGaps, setLearningGaps] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Plan generation modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"gaps" | "custom">("gaps");
  const [selectedGapId, setSelectedGapId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");
  const [customTeacherNotes, setCustomTeacherNotes] = useState<string>("");
  const [forceRecreate, setForceRecreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Step saving indicators
  const [updatingStepPlanId, setUpdatingStepPlanId] = useState<string | null>(null);

  // Activity player modal
  const [activeActivity, setActiveActivity] = useState<any>(null);
  const [targetStudent, setTargetStudent] = useState<any>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resPlans, resGaps, resStudents, resAssessments, resAct] = await Promise.all([
        fetch("/api/remedial-plans"),
        fetch("/api/learning-gaps"),
        fetch("/api/students"),
        fetch("/api/assessments"),
        fetch("/api/activities"),
      ]);

      const [dataPlans, dataGaps, dataStudents, dataAssessments, dataAct] = await Promise.all([
        resPlans.json(),
        resGaps.json(),
        resStudents.json(),
        resAssessments.json(),
        resAct.json(),
      ]);

      if (dataPlans.success) setPlans(dataPlans.plans || []);
      if (dataGaps.success) setLearningGaps(dataGaps.gaps || []);
      if (dataStudents.success) setStudents(dataStudents.students || []);
      if (dataAssessments.success) setConcepts(dataAssessments.concepts || []);
      if (dataAct.success) setActivities(dataAct.activities || []);
    } catch (e) {
      console.error("Failed to load remedial plan data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Step toggle handler with immediate optimistic update and persistent backend sync
  const toggleStepCompleted = async (planId: string, stepNumber: number) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || !plan.steps) return;

    const currentStep = plan.steps.find((s: any) => s.stepNumber === stepNumber);
    const newStatus = !currentStep?.completed;

    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const updatedSteps = p.steps.map((s: any) =>
          s.stepNumber === stepNumber ? { ...s, completed: newStatus } : s
        );
        const completedCount = updatedSteps.filter((s: any) => s.completed).length;
        const progressPercentage = Math.round((completedCount / updatedSteps.length) * 100);
        const newPlanStatus =
          completedCount === updatedSteps.length
            ? "Completed"
            : completedCount > 0
            ? "In Progress"
            : p.status;

        return {
          ...p,
          steps: updatedSteps,
          completedStepsCount: completedCount,
          progressPercentage,
          status: newPlanStatus,
        };
      })
    );

    setUpdatingStepPlanId(`${planId}-${stepNumber}`);
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: planId, stepNumber, completed: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        // Sync with exact server plan
        setPlans((prev) => prev.map((p) => (p.id === planId ? data.plan : p)));
      } else {
        // Rollback on server failure
        fetchInitialData();
      }
    } catch (e) {
      console.error("Failed to update step progress", e);
      fetchInitialData();
    } finally {
      setUpdatingStepPlanId(null);
    }
  };

  const handleUpdateStatus = async (planId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: planId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlans((prev) => prev.map((p) => (p.id === planId ? data.plan : p)));
      }
    } catch (e) {
      console.error("Failed to update plan status", e);
    }
  };

  const handleReopenPlan = async (planId: string) => {
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: planId, action: "reopen" }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlans((prev) => prev.map((p) => (p.id === planId ? data.plan : p)));
      }
    } catch (e) {
      console.error("Failed to reopen plan", e);
    }
  };

  const handleLaunchPractice = (plan: any) => {
    const act = activities.find((a) => a.conceptId === plan.conceptId) || activities[0];
    setActiveActivity(act);
    setTargetStudent({ id: plan.studentId, name: plan.studentName });
  };

  const handlePrintPlan = () => {
    window.print();
  };

  // Submit plan generation
  const handleGeneratePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      let payload: any = { forceRecreate, customNotes: customTeacherNotes.trim() || undefined };

      if (modalTab === "gaps") {
        if (!selectedGapId) {
          setFormError("Please select an identified learning gap needing intervention.");
          setIsSubmitting(false);
          return;
        }
        payload.gapId = selectedGapId;
      } else {
        if (!selectedStudentId) {
          setFormError("Please select a student.");
          setIsSubmitting(false);
          return;
        }
        if (!selectedConceptId) {
          setFormError("Please select a competency needing support.");
          setIsSubmitting(false);
          return;
        }
        payload.studentId = selectedStudentId;
        payload.conceptId = selectedConceptId;
      }

      const res = await fetch("/api/remedial-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "Failed to generate remedial plan.");
        setIsSubmitting(false);
        return;
      }

      setFormSuccess("5-Step concrete remedial plan generated successfully!");
      await fetchInitialData();

      setTimeout(() => {
        setIsGenerateModalOpen(false);
        setFormSuccess(null);
        setSelectedGapId("");
        setSelectedStudentId("");
        setSelectedConceptId("");
        setCustomTeacherNotes("");
        setForceRecreate(false);
      }, 700);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred while generating the plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if a plan already exists for current modal selection
  const existingPlanForModalSelection = plans.find((p) => {
    if (modalTab === "gaps" && selectedGapId) {
      const gap = learningGaps.find((g) => g.id === selectedGapId);
      if (!gap) return false;
      return p.studentId === gap.studentId && p.conceptId === gap.conceptId;
    }
    if (modalTab === "custom" && selectedStudentId && selectedConceptId) {
      return p.studentId === selectedStudentId && p.conceptId === selectedConceptId;
    }
    return false;
  });

  // Unique classes for filter
  const uniqueClasses = Array.from(
    new Set(plans.map((p) => p.classroomId).filter(Boolean))
  );

  // Filtered plans
  const filteredPlans = plans.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (subjectFilter !== "all" && p.subjectCode !== subjectFilter) return false;
    if (classFilter !== "all" && p.classroomId !== classFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesStudent = p.studentName?.toLowerCase().includes(q);
      const matchesCode = p.studentCode?.toLowerCase().includes(q);
      const matchesConcept = p.conceptName?.toLowerCase().includes(q);
      const matchesObj = p.learningObjective?.toLowerCase().includes(q);
      if (!matchesStudent && !matchesCode && !matchesConcept && !matchesObj) return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === "gu" ? "૫-પગલાંની ઉપચારાત્મક શિક્ષણ યોજનાઓ" : "5-Step Concrete Remedial Plans"}
              </h1>
              <Badge variant="saffron" size="sm" pulse>
                Active Curricula
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Deterministic, five-step manipulative pathways (tactile counters, visual diagrams, scaffolded worksheets) to close student learning gaps.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div data-tour="plan-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPlan}
                className="rounded-full text-xs font-semibold print:hidden"
              >
                <Printer className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Print A4 Plans</span>
              </Button>
            </div>

            <Button
              variant="saffron"
              size="sm"
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsGenerateModalOpen(true);
              }}
              className="rounded-full text-xs font-bold print:hidden shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Generate Remedial Plan</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Card variant="glass" className="p-4 border-slate-800 space-y-3 print:hidden">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll code, or competency..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                aria-label="Filter remedial plans by status"
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Suggested">Suggested</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Subject Filter */}
              <select
                value={subjectFilter}
                aria-label="Filter remedial plans by subject"
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
              >
                <option value="all">All Subjects</option>
                <option value="MATH">Mathematics (MATH)</option>
                <option value="ENG">English (ENG)</option>
                <option value="GUJ">Gujarati (GUJ)</option>
                <option value="EVS">Environment (EVS)</option>
              </select>

              {/* Class Filter */}
              {uniqueClasses.length > 0 && (
                <select
                  value={classFilter}
                  aria-label="Filter remedial plans by classroom"
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Classrooms</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}

              {(statusFilter !== "all" || subjectFilter !== "all" || classFilter !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSubjectFilter("all");
                    setClassFilter("all");
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <span>
              Showing <strong className="text-white font-mono">{filteredPlans.length}</strong> of{" "}
              <span className="font-mono">{plans.length}</span> total remedial plans
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {plans.filter((p) => p.status === "Completed").length} Completed
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-2" />
              <span>
                {plans.filter((p) => p.status === "In Progress").length} In Progress
              </span>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
            <p className="text-sm font-semibold text-slate-400">Loading structured remedial plans...</p>
          </div>
        )}

        {/* Empty State: No filter matches */}
        {!loading && filteredPlans.length === 0 && plans.length > 0 && (
          <Card variant="glass" className="p-12 text-center border-slate-800 space-y-4">
            <Filter className="w-10 h-10 mx-auto text-slate-500" />
            <h3 className="text-base font-bold text-white">No remedial plans match your selected filters</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your status, subject, or classroom filters, or clear your search keyword.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setSubjectFilter("all");
                setClassFilter("all");
                setSearchQuery("");
              }}
              className="rounded-full text-xs font-semibold"
            >
              Reset All Filters
            </Button>
          </Card>
        )}

        {/* Empty State: Zero plans in database */}
        {!loading && plans.length === 0 && (
          <Card variant="glass" className="p-12 text-center border-slate-800 space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-amber-400" />
            <h3 className="text-lg font-bold text-white">No Remedial Plans Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              ShikshaSetu AI analyzes student assessment results and detects competencies needing support. Generate a 5-step concrete sequence to start intervention.
            </p>
            <Button
              variant="saffron"
              size="sm"
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsGenerateModalOpen(true);
              }}
              className="rounded-full text-xs font-bold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Generate First Remedial Plan
            </Button>
          </Card>
        )}

        {/* Plans List */}
        <div className="space-y-6">
          {filteredPlans.map((plan) => {
            const steps = plan.steps && plan.steps.length > 0 ? plan.steps : [];
            const completedCount = steps.filter((s: any) => s.completed).length;
            const isFullyCompleted = steps.length > 0 && completedCount === steps.length;

            return (
              <Card
                key={plan.id}
                variant="glass"
                className={`p-6 border-slate-800 space-y-5 transition-all print:border-black print:bg-white print:text-black ${
                  isFullyCompleted
                    ? "border-l-4 border-l-emerald-500"
                    : plan.status === "In Progress"
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-sky-500"
                }`}
              >
                {/* Header of Plan */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800 print:border-slate-300">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/students/${plan.studentId}`}
                        className="font-heading font-extrabold text-lg text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 print:text-black"
                      >
                        <span>{plan.studentName}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 inline" />
                      </Link>

                      {plan.studentCode && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {plan.studentCode}
                        </span>
                      )}

                      {plan.classroomId && (
                        <span className="text-xs text-slate-400 font-semibold">
                          {plan.classroomId.toUpperCase()}
                        </span>
                      )}

                      <Badge variant="outline" size="sm">
                        {plan.subjectName || plan.subjectCode || "MATH"}
                      </Badge>

                      <Badge
                        variant={
                          plan.status === "Completed"
                            ? "completed"
                            : plan.status === "Approved"
                            ? "approved"
                            : plan.status === "In Progress"
                            ? "inProgress"
                            : "outline"
                        }
                        size="sm"
                        dot
                      >
                        {plan.status}
                      </Badge>

                      <span className="text-xs text-slate-400 font-mono">
                        ⏱ {plan.estimatedMinutes || 20} mins sequence
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <h3 className="font-heading text-base font-bold text-amber-400 print:text-black">
                        Target Competency: {plan.conceptName}
                      </h3>

                      {plan.baselineScore !== undefined && (
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                            plan.baselineScore < 60
                              ? "bg-rose-950/70 text-rose-300 border-rose-800"
                              : "bg-amber-950/70 text-amber-300 border-amber-800"
                          }`}
                        >
                          Triggering Baseline: {plan.baselineScore}% (
                          {plan.baselineScore < 60 ? "Needs Support" : "Developing"})
                        </span>
                      )}
                    </div>

                    {plan.learningObjective && (
                      <p className="text-xs text-slate-300 max-w-3xl leading-relaxed print:text-slate-700 pt-0.5">
                        <strong className="text-white print:text-black">Pedagogical Objective:</strong>{" "}
                        {plan.learningObjective}
                      </p>
                    )}

                    {plan.recommendationReason && (
                      <p className="text-[11px] text-slate-400 italic">
                        Evidence: {plan.recommendationReason}
                      </p>
                    )}
                  </div>

                  {/* Circular Progress Ring & Actions */}
                  <div className="flex items-center gap-4 self-end sm:self-start">
                    <div className="flex items-center gap-2 text-right">
                      <div className="hidden sm:block">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Progress
                        </span>
                        <span className="text-xs font-extrabold text-white print:text-black font-mono">
                          {completedCount}/{steps.length} Steps
                        </span>
                      </div>
                      <ProgressRing
                        completedSteps={completedCount}
                        totalSteps={steps.length}
                      />
                    </div>

                    {/* Quick Status Buttons */}
                    <div className="flex flex-col gap-1.5 print:hidden">
                      {plan.status === "Suggested" && (
                        <Button
                          variant="saffron"
                          size="sm"
                          onClick={() => handleUpdateStatus(plan.id, "Approved")}
                          className="rounded-full text-xs h-7"
                        >
                          Approve Plan
                        </Button>
                      )}
                      {plan.status === "Approved" && (
                        <Button
                          variant="mint"
                          size="sm"
                          onClick={() => handleLaunchPractice(plan)}
                          className="rounded-full text-xs h-7 font-bold"
                        >
                          <Play className="w-3 h-3 fill-current mr-1" />
                          <span>Start Activity</span>
                        </Button>
                      )}
                      {plan.status === "In Progress" && (
                        <Button
                          variant="mint"
                          size="sm"
                          onClick={() => handleUpdateStatus(plan.id, "Completed")}
                          className="rounded-full text-xs h-7 font-semibold"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          <span>Mark Completed</span>
                        </Button>
                      )}
                      {plan.status === "Completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReopenPlan(plan.id)}
                          className="rounded-full text-xs h-7 text-amber-400 hover:text-amber-300"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          <span>Reopen Plan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Required Materials Chips */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs print:bg-slate-100 print:text-black">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 print:text-black">
                    <Boxes className="w-3.5 h-3.5 text-amber-400" />
                    Required Manipulatives & Resources:
                  </span>
                  {(plan.requiredMaterials && plan.requiredMaterials.length > 0
                    ? plan.requiredMaterials
                    : ["Counting beads", "Place-value chart", "Worksheet", "Pencil"]
                  ).map((mat: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 text-[11px] font-medium print:bg-white print:border-slate-300 print:text-black"
                    >
                      {mat}
                    </span>
                  ))}
                </div>

                {/* 5-STEP VERTICAL STEPPER WITH OBJECTIVES, MATERIALS & CHECKS */}
                <div data-tour="plan-5steps" className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span>Structured 5-Step Remedial Sequence</span>
                      <ContextualHelp termKey="remedialPlan" />
                    </span>
                    <span className="text-[11px] font-normal lowercase text-slate-400">
                      Click checkbox to mark step complete
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-3.5 border-l-2 border-slate-800 ml-3 print:border-slate-300">
                    {steps.map((step: any) => {
                      const isDone = Boolean(step.completed);
                      const isUpdating = updatingStepPlanId === `${plan.id}-${step.stepNumber}`;

                      return (
                        <div
                          key={step.stepNumber}
                          data-tour={step.stepNumber === 1 ? "plan-mark-done" : undefined}
                          onClick={() => toggleStepCompleted(plan.id, step.stepNumber)}
                          className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${
                            isDone
                              ? "bg-slate-900/40 border-emerald-500/40 text-slate-300 shadow-sm shadow-emerald-500/5"
                              : "bg-slate-900/80 border-slate-800 text-white hover:border-amber-500/40"
                          } print:bg-white print:border-slate-200 print:text-black`}
                        >
                          {/* Step Node Marker on Vertical Line */}
                          <div
                            className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                              isDone
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_10px_#3DDBA9]"
                                : "bg-slate-900 text-slate-300 border-slate-700 group-hover:border-amber-400"
                            } print:bg-white print:text-black print:border-black`}
                          >
                            {isDone ? "✓" : step.stepNumber}
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              {/* Step Header */}
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="p-1 rounded-lg bg-slate-800/80 border border-slate-700">
                                  {getStepMaterialIcon(step.stepNumber)}
                                </div>
                                <h4
                                  className={`text-xs sm:text-sm font-bold ${
                                    isDone ? "line-through text-slate-400" : "text-white"
                                  } print:text-black`}
                                >
                                  Step {step.stepNumber}: {step.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800">
                                  ⏱ {step.durationMinutes}m
                                </span>
                                {getActivityTypeBadge(step.activityType)}
                              </div>

                              {/* Step Learning Objective */}
                              {step.learningObjective && (
                                <p className="text-[11px] font-semibold text-amber-300/90 pl-7 print:text-black">
                                  🎯 Objective: {step.learningObjective}
                                </p>
                              )}

                              {/* Step Activity Description */}
                              <p className="text-[11px] text-slate-300 leading-relaxed pl-7 print:text-slate-700">
                                {step.description}
                              </p>

                              {/* Step Materials Pills */}
                              {step.materials && step.materials.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pl-7 pt-0.5">
                                  <span className="text-[10px] text-slate-400 font-medium">Materials:</span>
                                  {step.materials.map((m: string, mIdx: number) => (
                                    <span
                                      key={mIdx}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Check Understanding Callout */}
                              {step.checkUnderstanding && (
                                <div className="mt-2 ml-7 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] flex items-start gap-2 text-slate-300">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-amber-400">Check for Understanding: </strong>
                                    {step.checkUnderstanding}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Mark-Done Interactive Checkbox */}
                            <div className="shrink-0 mt-1 pl-2">
                              {isUpdating ? (
                                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                              ) : isDone ? (
                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Teacher Instructions & Reassessment Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-400 block text-[10px] uppercase tracking-wider">
                      Pedagogical Guidance for Teacher:
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {plan.teacherInstructions ||
                        "Reinforce concrete manipulatives first. Avoid jumping to abstract equations until conceptual grouping is secure."}
                    </p>
                    {plan.teacherNotes && (
                      <p className="text-amber-300/80 text-[10px] pt-1">
                        <strong>Teacher Custom Notes:</strong> {plan.teacherNotes}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400 block text-[10px] uppercase tracking-wider">
                      Reassessment Target Benchmark:
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {plan.reassessmentCriteria ||
                        "Student must achieve at least 80% on a 5-question parallel assessment without teacher hints."}
                    </p>
                    {plan.reviewDate && (
                      <p className="text-slate-400 text-[10px] pt-1">
                        <strong>Target Review Date:</strong>{" "}
                        {new Date(plan.reviewDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* GENERATE REMEDIAL PLAN MODAL */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsGenerateModalOpen(false);
        }}
        title="Generate 5-Step Concrete Remedial Plan"
        description="Create an actionable, manipulative-grounded remedial plan linked to real assessment records."
        maxWidth="xl"
      >
        <form onSubmit={handleGeneratePlanSubmit} className="space-y-4">
          {/* Tabs: From Identified Gaps vs Select Student & Competency */}
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalTab("gaps");
                setFormError(null);
              }}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                modalTab === "gaps"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              From Detected Learning Gaps ({learningGaps.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab("custom");
                setFormError(null);
              }}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                modalTab === "custom"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Select Student & Competency
            </button>
          </div>

          {/* Form Error / Success Banners */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* TAB 1: From Real Learning Gaps */}
          {modalTab === "gaps" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Select an Identified Learning Gap:
              </label>

              {learningGaps.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                  No active learning gaps detected in recent assessments.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {learningGaps.map((gap) => {
                    const isSelected = selectedGapId === gap.id;
                    const hasExistingPlan = plans.some(
                      (p) => p.studentId === gap.studentId && p.conceptId === gap.conceptId
                    );

                    return (
                      <div
                        key={gap.id}
                        onClick={() => setSelectedGapId(gap.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-950/40 border-amber-500 text-white"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{gap.studentName}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              ({gap.studentCode || gap.studentId})
                            </span>
                            <Badge variant="outline" size="sm">
                              {gap.subjectCode}
                            </Badge>
                          </div>
                          <span
                            className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-full ${
                              gap.latestPercentage < 60
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                          >
                            Score: {gap.latestPercentage}%
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Competency: <strong className="text-slate-200">{gap.conceptName}</strong></span>
                          {hasExistingPlan && (
                            <span className="text-[10px] text-amber-400 font-semibold">
                              Plan already active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Select Student & Competency */}
          {modalTab === "custom" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Student:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 outline-hidden"
                >
                  <option value="">-- Choose a student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName || s.name} ({s.studentCode || s.id}) - {s.grade ? `Grade ${s.grade}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Competency Needing Support:
                </label>
                <select
                  value={selectedConceptId}
                  onChange={(e) => setSelectedConceptId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 outline-hidden"
                >
                  <option value="">-- Choose a competency --</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.subjectCode || "CORE"}] {c.name} ({c.grade ? `Grade ${c.grade}` : ""})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Custom Teacher Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Custom Teacher Notes (Optional):
            </label>
            <textarea
              value={customTeacherNotes}
              onChange={(e) => setCustomTeacherNotes(e.target.value)}
              placeholder="e.g. Schedule for daily zero-period session. Focus on hands-on counters first."
              rows={2}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Duplicate Plan Warning & Option to Force Recreate */}
          {existingPlanForModalSelection && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Notice: An active plan already exists for this student and competency.</span>
              </div>
              <p className="text-[11px] text-slate-300">
                To prevent accidental duplicates, repeated clicks load the existing plan. Check the box below if you deliberately want to generate a fresh new plan.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-white pt-1">
                <input
                  type="checkbox"
                  checked={forceRecreate}
                  onChange={(e) => setForceRecreate(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 cursor-pointer"
                />
                <span>Generate a brand new plan anyway (Regenerate)</span>
              </label>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={isSubmitting}
              className="rounded-full text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="saffron"
              size="sm"
              disabled={
                isSubmitting ||
                (modalTab === "gaps" && !selectedGapId) ||
                (modalTab === "custom" && (!selectedStudentId || !selectedConceptId))
              }
              className="rounded-full text-xs font-bold min-w-36"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Generating 5-Step Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  <span>{forceRecreate ? "Regenerate Fresh Plan" : "Generate 5-Step Plan"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Activity Player Modal */}
      {activeActivity && (
        <ActivityPlayerModal
          activity={activeActivity}
          studentId={targetStudent?.id}
          studentName={targetStudent?.name}
          isOpen={Boolean(activeActivity)}
          onClose={() => setActiveActivity(null)}
          onCompleted={() => {
            fetchInitialData();
          }}
        />
      )}

      {/* Guided Tour */}
      <SpotlightTour page="remedialPlans" />
    </AppLayout>
  );
}
