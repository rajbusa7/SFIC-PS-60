"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { ActivityPlayerModal } from "@/components/activities/ActivityPlayerModal";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { ContextualHelp } from "@/components/shared/ContextualHelp";
import { broadcastDataUpdate, subscribeToDataUpdates } from "@/lib/events";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  BookOpen,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Printer,
  Boxes,
  Compass,
  Award,
  Layers,
  CheckSquare,
  Square,
  Check,
  FileText,
  AlertCircle,
  Calendar,
  Edit3,
  Target,
  TrendingUp,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Step material icons mapping
function getStepMaterialIcon(stepNum: number) {
  switch (stepNum) {
    case 1:
      return <ClipboardList className="w-4 h-4 text-sky-500" />;
    case 2:
      return <Boxes className="w-4 h-4 text-amber-500" />; // Manipulatives
    case 3:
      return <Compass className="w-4 h-4 text-teal-500" />; // Guided models
    case 4:
      return <BookOpen className="w-4 h-4 text-indigo-500" />; // Independent practice
    case 5:
      return <Award className="w-4 h-4 text-emerald-500" />; // Reassessment
    default:
      return <Layers className="w-4 h-4 text-amber-500" />;
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
  const percentage = Math.min(100, Math.max(0, Math.round((completedSteps / Math.max(1, totalSteps)) * 100)));
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
          stroke="rgba(73, 53, 47, 0.12)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={percentage === 100 ? "#2E7D5E" : "#B26A1B"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute text-[11px] font-mono font-black text-[#49352F]">
        {percentage}%
      </div>
    </div>
  );
}

export default function RemedialPlansPage() {
  const { t, language, formatSubject, formatStatus } = useLanguage();

  const [plans, setPlans] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Track completed step IDs for interactive checkboxes: planId -> set of completed step numbers
  const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, number[]>>({});

  // Expanded step details toggles: planId -> boolean
  const [expandedPlanSteps, setExpandedPlanSteps] = useState<Record<string, boolean>>({});

  // Activity player modal
  const [activeActivity, setActiveActivity] = useState<any>(null);
  const [targetStudent, setTargetStudent] = useState<any>(null);

  // Reassessment Modal State
  const [reassessmentModalPlan, setReassessmentModalPlan] = useState<any>(null);
  const [reassessmentAnswers, setReassessmentAnswers] = useState<Record<number, string>>({});
  const [reassessmentMarks, setReassessmentMarks] = useState<number>(4);
  const [reassessmentMaxMarks, setReassessmentMaxMarks] = useState<number>(5);
  const [reassessmentNotes, setReassessmentNotes] = useState<string>("");
  const [reassessmentSubmitting, setReassessmentSubmitting] = useState<boolean>(false);
  const [reassessmentError, setReassessmentError] = useState<string | null>(null);

  // Worksheet Viewer Modal State
  const [worksheetModalPlan, setWorksheetModalPlan] = useState<any>(null);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Teacher Notes & Schedule Edit Modal State
  const [editingNotesPlan, setEditingNotesPlan] = useState<any>(null);
  const [editNotesValue, setEditNotesValue] = useState<string>("");
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editTargetDate, setEditTargetDate] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const [resPlans, resAct] = await Promise.all([
        fetch("/api/remedial-plans"),
        fetch("/api/activities"),
      ]);
      const [dataPlans, dataAct] = await Promise.all([resPlans.json(), resAct.json()]);

      if (dataPlans.success) {
        setPlans(dataPlans.plans || []);
        const initialMap: Record<string, number[]> = {};
        (dataPlans.plans || []).forEach((p: any) => {
          if (Array.isArray(p.completedSteps)) {
            initialMap[p.id] = p.completedSteps;
          } else if (p.status === "Completed") {
            initialMap[p.id] = [1, 2, 3, 4, 5];
          } else if (p.status === "In Progress" || p.status === "Active") {
            initialMap[p.id] = [1, 2];
          } else {
            initialMap[p.id] = [1];
          }
        });
        setCompletedStepsMap(initialMap);
      }
      if (dataAct.success) setActivities(dataAct.activities || []);
    } catch (e) {
      console.error("Failed to load plans", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    const unsubscribe = subscribeToDataUpdates(() => {
      fetchPlans();
    }, ["plans", "gaps", "all"]);
    return () => unsubscribe();
  }, []);

  const toggleStepCompleted = async (planId: string, stepNumber: number) => {
    const current = completedStepsMap[planId] || [];
    const updated = current.includes(stepNumber)
      ? current.filter((n) => n !== stepNumber)
      : [...current, stepNumber].sort((a, b) => a - b);

    setCompletedStepsMap((prev) => ({ ...prev, [planId]: updated }));

    // Persist step completion without marking Completed unless reassessment passed
    const currentPlan = plans.find((p) => p.id === planId);
    let newStatus = currentPlan?.status || "Suggested";
    if (newStatus !== "Completed") {
      newStatus = updated.length > 0 ? "In Progress" : "Suggested";
    }

    try {
      await fetch("/api/remedial-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: planId, completedSteps: updated, status: newStatus }),
      });
      broadcastDataUpdate("plans", "update", planId);
    } catch (e) {
      console.error("Failed to persist step progress", e);
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
      if (data.success) {
        broadcastDataUpdate("plans", "update", planId);
        fetchPlans();
      }
    } catch (e) {
      console.error("Failed to update plan status", e);
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

  const openReassessmentModal = (plan: any) => {
    setReassessmentModalPlan(plan);
    const questions = plan.reassessmentQuestions || [];
    const defaultAnswers: Record<number, string> = {};
    questions.forEach((q: any) => {
      defaultAnswers[q.questionNumber] = plan.reassessmentResult?.studentAnswers?.[q.questionNumber] || "";
    });
    setReassessmentAnswers(defaultAnswers);
    setReassessmentMaxMarks(questions.length > 0 ? questions.length : 5);
    setReassessmentMarks(
      plan.reassessmentResult?.marksObtained !== undefined
        ? plan.reassessmentResult.marksObtained
        : questions.length > 0
        ? Math.round(questions.length * 0.8)
        : 4
    );
    setReassessmentNotes(plan.reassessmentResult?.teacherFeedback || "");
    setReassessmentError(null);
  };

  const submitReassessment = async () => {
    if (!reassessmentModalPlan) return;
    const marks = Number(reassessmentMarks);
    const max = Number(reassessmentMaxMarks);

    if (isNaN(marks) || isNaN(max) || max <= 0) {
      setReassessmentError(language === "gu" ? "મહત્તમ ગુણ શૂન્યથી વધુ હોવા જોઈએ." : "Maximum marks must be greater than zero.");
      return;
    }
    if (marks < 0 || marks > max) {
      setReassessmentError(
        language === "gu"
          ? `મેળવેલ ગુણ ૦ અને ${max} ની વચ્ચે હોવા જોઈએ.`
          : `Marks obtained must be between 0 and ${max}.`
      );
      return;
    }

    setReassessmentSubmitting(true);
    setReassessmentError(null);

    try {
      const res = await fetch("/api/remedial-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassess",
          planId: reassessmentModalPlan.id,
          marksObtained: marks,
          maximumMarks: max,
          answers: reassessmentAnswers,
          teacherFeedback: reassessmentNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("plans", "update", reassessmentModalPlan.id);
        broadcastDataUpdate("gaps", "update");
        broadcastDataUpdate("results", "update");
        setReassessmentModalPlan(null);
        fetchPlans();
      } else {
        setReassessmentError(data.error || "Failed to save reassessment result.");
      }
    } catch {
      setReassessmentError("Network error recording reassessment.");
    } finally {
      setReassessmentSubmitting(false);
    }
  };

  const handleGenerateFollowUp = async (parentPlanId: string) => {
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "followUp",
          parentPlanId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("plans", "create", data.plan?.id);
        broadcastDataUpdate("gaps", "update");
        fetchPlans();
      }
    } catch (e) {
      console.error("Failed to generate follow up plan", e);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade", planId }),
      });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("plans", "update", planId);
        fetchPlans();
      }
    } catch (e) {
      console.error("Failed to upgrade plan", e);
    }
  };

  const openEditNotesModal = (plan: any) => {
    setEditingNotesPlan(plan);
    setEditNotesValue(plan.teacherNotes || plan.teacherObservations || "");
    setEditStartDate(plan.startDate || "");
    setEditTargetDate(plan.targetDate || "");
  };

  const saveNotesAndSchedule = async () => {
    if (!editingNotesPlan) return;
    setSavingNotes(true);
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingNotesPlan.id,
          teacherNotes: editNotesValue,
          teacherObservations: editNotesValue,
          startDate: editStartDate,
          targetDate: editTargetDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("plans", "update", editingNotesPlan.id);
        setEditingNotesPlan(null);
        fetchPlans();
      }
    } catch (e) {
      console.error("Failed to update notes", e);
    } finally {
      setSavingNotes(false);
    }
  };

  const toggleExpandSteps = (planId: string) => {
    setExpandedPlanSteps((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  const filteredPlans = plans.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight">
                {t.remedialPlans.title || "5-Step Concrete Remedial Plans"}
              </h1>
              <Badge variant="saffron" size="sm" pulse>
                {language === "gu" ? "સક્રિય અભ્યાસક્રમ" : "Active Curricula"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1">
              {t.remedialPlans.subtitle ||
                "Targeted step-by-step manipulative pathways (counting beads, number lines, flashcards) to close student learning gaps."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div data-tour="plan-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPlan}
                className="rounded-full text-xs font-semibold print:hidden bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15"
              >
                <Printer className="w-3.5 h-3.5 mr-1 text-[#7A6862]" />
                <span>{language === "gu" ? "A4 યોજનાઓ પ્રિન્ટ કરો" : "Print A4 Plans"}</span>
              </Button>
            </div>

            <Link href="/ai?tab=remedial" className="print:hidden">
              <Button variant="saffron" size="sm" className="rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>{language === "gu" ? "યોજના બનાવો" : "Generate Plan"}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <Card variant="glass" className="p-3.5 flex items-center justify-between border-[#49352F]/15 bg-white text-[#49352F] print:hidden shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#7A6862]">
              {language === "gu" ? "સ્થિતિ દ્વારા ફિલ્ટર કરો:" : "Filter by Status:"}
            </span>
            <select
              value={statusFilter}
              aria-label="Filter remedial plans by status"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
            >
              <option value="all">{language === "gu" ? "બધી સ્થિતિ" : "All Statuses"}</option>
              <option value="Suggested">{language === "gu" ? "સૂચિત" : "Suggested"}</option>
              <option value="Approved">{language === "gu" ? "મંજૂર" : "Approved"}</option>
              <option value="In Progress">{language === "gu" ? "પ્રગતિ હેઠળ" : "In Progress"}</option>
              <option value="Completed">{language === "gu" ? "પૂર્ણ થયેલ" : "Completed"}</option>
              <option value="Needs Review">{language === "gu" ? "સમીક્ષા જરૂરી" : "Needs Review"}</option>
            </select>
          </div>
          <span className="text-xs text-[#7A6862]">
            {language === "gu"
              ? `${filteredPlans.length} સક્રિય ઉપચાર યોજનાઓ`
              : `${filteredPlans.length} active remedial plans`}
          </span>
        </Card>

        {/* Empty State */}
        {!loading && filteredPlans.length === 0 && (
          <Card variant="glass" className="p-8 text-center space-y-3 bg-white border-[#49352F]/15">
            <BookOpen className="w-8 h-8 text-[#B26A1B] mx-auto opacity-70" />
            <h3 className="font-heading font-bold text-base text-[#49352F]">
              {language === "gu" ? "કોઈ ઉપચાર યોજનાઓ મળી નથી" : "No Remedial Plans Found"}
            </h3>
            <p className="text-xs text-[#7A6862] max-w-md mx-auto">
              {language === "gu"
                ? "પસંદ કરેલ ફિલ્ટરમાં કોઈ યોજનાઓ નથી. શિક્ષણ ત્રુટિઓમાંથી નવી યોજના બનાવો અથવા ફિલ્ટર બદલો."
                : "No remedial plans match your selected criteria. Create a new plan from detected gaps or reset the filter."}
            </p>
          </Card>
        )}

        {/* Plans List */}
        <div className="space-y-6">
          {filteredPlans.map((plan) => {
            const completedList = completedStepsMap[plan.id] || [];
            const steps = Array.isArray(plan.steps) && plan.steps.length > 0 ? plan.steps : [];
            const isFullyCompleted = plan.status === "Completed";
            const isExpanded = expandedPlanSteps[plan.id] ?? true;

            const baseline = plan.baselineScore ?? 35;
            const reassessment = plan.reassessmentResult;
            const benchmark = plan.masteryBenchmark ?? 80;

            return (
              <Card
                key={plan.id}
                variant="glass"
                className={`p-6 border-[#49352F]/12 bg-white text-[#49352F] space-y-5 transition-all shadow-xs print:border-black print:bg-white print:text-black ${
                  isFullyCompleted
                    ? "border-l-4 border-l-[#2E7D5E]"
                    : plan.status === "Needs Review"
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-[#F2CAB3]"
                }`}
              >
                {/* Header of Plan */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#49352F]/10 print:border-slate-300">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/students/${plan.studentId}`}
                        className="font-heading font-extrabold text-lg text-[#49352F] hover:text-[#B26A1B] transition-colors print:text-black"
                      >
                        {plan.studentName}
                      </Link>
                      <Badge variant="outline" size="sm" className="font-semibold">
                        {plan.studentClass ? `Class ${plan.studentClass}-${plan.studentSection || "A"}` : "Class 4-A"}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {formatSubject(plan.subjectCode || "MATH")}
                      </Badge>
                      <Badge
                        variant={
                          plan.status === "Completed"
                            ? "completed"
                            : plan.status === "Approved"
                            ? "approved"
                            : plan.status === "Needs Review"
                            ? "amber"
                            : "inProgress"
                        }
                        size="sm"
                        dot
                      >
                        {formatStatus(plan.status)}
                      </Badge>

                      {plan.isFollowUp && (
                        <Badge variant="saffron" size="sm">
                          {language === "gu" ? "અનુકૂલિત ફોલો-અપ યોજના" : "Adaptive Follow-Up"}
                        </Badge>
                      )}

                      <span className="text-xs text-[#7A6862] font-mono flex items-center gap-1 ml-auto sm:ml-0">
                        <Clock className="w-3.5 h-3.5 text-[#7A6862]" aria-hidden="true" />
                        <span>
                          {plan.estimatedMinutes || 20}{" "}
                          {language === "gu" ? "મિનિટ અનુક્રમ" : "mins sequence"}
                        </span>
                      </span>
                    </div>

                    <h3 className="font-heading text-base font-bold text-[#B26A1B] mt-1 print:text-black">
                      {language === "gu" ? "લક્ષિત સંકલ્પના:" : "Target Competency:"} {plan.conceptName}
                    </h3>

                    {/* Baseline vs Reassessment Performance Banner */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10">
                        <span className="text-[#7A6862] font-medium">{language === "gu" ? "પ્રારંભિક સ્કોર:" : "Baseline:"}</span>
                        <span className="font-bold text-[#49352F]">{baseline}%</span>
                      </div>

                      {reassessment ? (
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                            reassessment.isMastered
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-amber-50 border-amber-300 text-amber-800"
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="font-medium">{language === "gu" ? "પુનઃમૂલ્યાંકન:" : "Reassessed:"}</span>
                          <span className="font-bold">{reassessment.percentage}%</span>
                          <span className="font-extrabold ml-1">
                            ({reassessment.deltaPercentagePoints >= 0 ? `+${reassessment.deltaPercentagePoints}` : reassessment.deltaPercentagePoints} {language === "gu" ? "ટકાવારી પોઇન્ટ" : "pp"})
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{language === "gu" ? "પુનઃમૂલ્યાંકન બાકી" : "Reassessment Pending"}</span>
                        </div>
                      )}

                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10 text-[11px]">
                        <Target className="w-3 h-3 text-[#B26A1B]" />
                        <span className="text-[#7A6862]">{language === "gu" ? "લક્ષ્ય બેન્ચમાર્ક:" : "Target Benchmark:"}</span>
                        <span className="font-bold text-[#49352F]">{benchmark}%</span>
                      </div>

                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {plan.confirmedOrInferred === "confirmed"
                          ? (language === "gu" ? "પ્રમાણિત શિક્ષણ ત્રુટિ" : "Confirmed Gap")
                          : (language === "gu" ? "અનુમાનિત સહાય જરૂરિયાત" : "Inferred Need")}
                      </Badge>
                    </div>

                    {/* Pedagogical Objective & Expected Competency */}
                    {plan.learningObjective && (
                      <p className="text-xs text-[#7A6862] leading-relaxed pt-1">
                        <strong className="text-[#49352F]">
                          {language === "gu" ? "શિક્ષણશાસ્ત્રીય ઉદ્દેશ્ય:" : "Pedagogical Objective:"}
                        </strong>{" "}
                        {plan.learningObjective}
                      </p>
                    )}

                    {plan.expectedSkill && (
                      <p className="text-xs text-[#7A6862] leading-relaxed">
                        <strong className="text-[#2E7D5E]">
                          {language === "gu" ? "અપેક્ષિત કૌશલ્ય સિદ્ધિ:" : "Expected Post-Remediation Skill:"}
                        </strong>{" "}
                        {plan.expectedSkill}
                      </p>
                    )}

                    {/* Error Analysis & Misconception */}
                    {plan.knownMisconceptions && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 mt-2">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          {language === "gu" ? "ઓળખાયેલી ભૂલ પેટર્ન / ગેરસમજણ:" : "Identified Error Pattern & Misconception:"}
                        </span>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          {plan.knownMisconceptions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Circular Progress Ring & Actions */}
                  <div className="flex flex-col sm:items-end gap-3 self-end sm:self-start">
                    <div className="flex items-center gap-2 text-right">
                      <div className="hidden sm:block">
                        <span className="text-[10px] uppercase font-bold text-[#7A6862] block">
                          {language === "gu" ? "પ્રગતિ" : "Progress"}
                        </span>
                        <span className="text-xs font-extrabold text-[#49352F] print:text-black">
                          {completedList.length}/{steps.length || 5} {language === "gu" ? "પગલાં" : "Steps"}
                        </span>
                      </div>
                      <ProgressRing
                        completedSteps={completedList.length}
                        totalSteps={steps.length || 5}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap sm:flex-col gap-1.5 print:hidden">
                      {plan.status === "Suggested" && (
                        <Button
                          variant="saffron"
                          size="sm"
                          onClick={() => handleUpdateStatus(plan.id, "Approved")}
                          className="rounded-full text-xs h-7"
                        >
                          {language === "gu" ? "યોજના મંજૂર કરો" : "Approve Plan"}
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
                          <span>{language === "gu" ? "પ્રવૃત્તિ શરૂ કરો" : "Start Activity"}</span>
                        </Button>
                      )}

                      {/* Reassessment Action Button */}
                      <Button
                        variant={reassessment?.isMastered ? "outline" : "saffron"}
                        size="sm"
                        onClick={() => openReassessmentModal(plan)}
                        className="rounded-full text-xs h-7 font-bold border border-[#B26A1B]"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        <span>
                          {reassessment
                            ? language === "gu"
                              ? "પુનઃકસોટી સ્કોર બદલો"
                              : "Update Reassessment"
                            : language === "gu"
                            ? "પુનઃમૂલ્યાંકન નોંધો"
                            : "Record Reassessment"}
                        </span>
                      </Button>

                      {/* View Practice Worksheet */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWorksheetModalPlan(plan);
                          setShowAnswerKey(false);
                        }}
                        className="rounded-full text-xs h-7 bg-white text-[#49352F] border border-[#49352F]/15"
                      >
                        <FileText className="w-3 h-3 mr-1 text-[#7A6862]" />
                        <span>{language === "gu" ? "કાર્યપત્રક જુઓ" : "View Worksheet"}</span>
                      </Button>

                      {/* Notes & Dates */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditNotesModal(plan)}
                        className="rounded-full text-xs h-7 text-[#7A6862] hover:text-[#49352F]"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        <span>{language === "gu" ? "નોંધ / તારીખ" : "Notes & Schedule"}</span>
                      </Button>

                      {/* Safe Upgrade if legacy plan had < 5 steps */}
                      {steps.length < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpgradePlan(plan.id)}
                          className="rounded-full text-xs h-7 text-amber-700 border-amber-300 bg-amber-50"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          <span>{language === "gu" ? "૫ પગલાંમાં અપગ્રેડ કરો" : "Upgrade to 5 Steps"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Required Materials Chips */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs print:bg-slate-100 print:text-black">
                  <span className="font-bold text-[#49352F] flex items-center gap-1.5 print:text-black">
                    <Boxes className="w-3.5 h-3.5 text-[#B26A1B]" />
                    {language === "gu" ? "જરૂરી મૂર્ત સાધનો:" : "Required Manipulatives:"}
                  </span>
                  {(Array.isArray(plan.requiredMaterials) && plan.requiredMaterials.length > 0
                    ? plan.requiredMaterials
                    : ["Counting tokens", "10-grouping cups", "Drawn number lines", "Practice worksheet"]
                  ).map((mat: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-white border border-[#49352F]/12 text-[#49352F] text-[11px] font-medium print:bg-white print:border-slate-300 print:text-black"
                    >
                      {mat}
                    </span>
                  ))}
                </div>

                {/* 5-STEP VERTICAL STEPPER WITH FULL PEDAGOGICAL DETAILS */}
                <div data-tour="plan-5steps" className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#7A6862] uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span>{language === "gu" ? "૫-પગલાં પદ્ધતિસરનો ઉપચાર ક્રમ" : "5-Step Remedial Instructional Sequence"}</span>
                      <ContextualHelp termKey="remedialPlan" />
                    </span>
                    <button
                      onClick={() => toggleExpandSteps(plan.id)}
                      className="text-[11px] font-normal lowercase flex items-center gap-1 text-[#B26A1B] hover:underline cursor-pointer"
                    >
                      <span>
                        {isExpanded
                          ? (language === "gu" ? "વિગત સંક્ષિપ્ત કરો" : "Collapse details")
                          : (language === "gu" ? "બધી વિગતો જુઓ" : "Expand all step details")}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="relative pl-6 space-y-3 border-l-2 border-[#49352F]/15 ml-3 print:border-slate-300">
                    {steps.map((step: any) => {
                      const isDone = completedList.includes(step.stepNumber);

                      return (
                        <div
                          key={step.stepNumber}
                          data-tour={step.stepNumber === 1 ? "plan-mark-done" : undefined}
                          className={`relative p-3.5 rounded-2xl border transition-all ${
                            isDone
                              ? "bg-[#FAF6E9] border-[#2E7D5E]/30 text-[#49352F]"
                              : "bg-white border-[#49352F]/12 text-[#49352F] hover:border-[#49352F]/25 shadow-xs"
                          } print:bg-white print:border-slate-200 print:text-black`}
                        >
                          {/* Step Node Marker on Vertical Line */}
                          <div
                            onClick={() => toggleStepCompleted(plan.id, step.stepNumber)}
                            className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border cursor-pointer ${
                              isDone
                                ? "bg-[#2E7D5E] text-white border-[#2E7D5E]"
                                : "bg-[#FAF6E9] text-[#49352F] border-[#49352F]/20"
                            } print:bg-white print:text-black print:border-black`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" /> : step.stepNumber}
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-[#FAF6E9] border border-[#49352F]/10">
                                  {getStepMaterialIcon(step.stepNumber)}
                                </div>
                                <h4
                                  className={`text-xs font-bold ${
                                    isDone ? "line-through text-[#7A6862]" : "text-[#49352F]"
                                  } print:text-black`}
                                >
                                  {step.title}
                                </h4>
                                <span className="text-[10px] text-[#7A6862] font-mono px-2 py-0.5 rounded-full bg-slate-100">
                                  {step.durationMinutes || 4}m
                                </span>
                              </div>

                              <p className="text-[11px] text-[#7A6862] leading-relaxed pl-7 print:text-slate-700">
                                {step.description}
                              </p>

                              {/* Rich step details when expanded */}
                              {isExpanded && (
                                <div className="pl-7 pt-2 space-y-2 text-[11px] border-t border-[#49352F]/8 mt-2">
                                  {step.learningObjective && (
                                    <div>
                                      <span className="font-bold text-[#49352F] block">
                                        {language === "gu" ? "પગલાનો ઉદ્દેશ્ય:" : "Step Objective:"}
                                      </span>
                                      <span className="text-[#7A6862]">{step.learningObjective}</span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {step.teacherInstructions && (
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                                        <span className="font-bold text-[#B26A1B] text-[10px] uppercase block">
                                          {language === "gu" ? "શિક્ષક માટે સૂચના:" : "Teacher Instructions:"}
                                        </span>
                                        <span className="text-[#7A6862] text-[10px] leading-relaxed">
                                          {step.teacherInstructions}
                                        </span>
                                      </div>
                                    )}

                                    {step.studentInstructions && (
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                                        <span className="font-bold text-[#2E7D5E] text-[10px] uppercase block">
                                          {language === "gu" ? "વિદ્યાર્થી માટે સૂચના:" : "Student Instructions:"}
                                        </span>
                                        <span className="text-[#7A6862] text-[10px] leading-relaxed">
                                          {step.studentInstructions}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {step.expectedResult && (
                                    <div className="text-[10px] text-[#2E7D5E] font-medium flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>
                                        {language === "gu" ? "અપેક્ષિત પરિણામ:" : "Expected Learning Evidence:"}{" "}
                                        {step.expectedResult}
                                      </span>
                                    </div>
                                  )}

                                  {step.stepNumber === 5 && (
                                    <div className="pt-1">
                                      <Button
                                        variant="saffron"
                                        size="sm"
                                        onClick={() => openReassessmentModal(plan)}
                                        className="rounded-full text-xs h-6 font-bold"
                                      >
                                        <Award className="w-3 h-3 mr-1" />
                                        <span>
                                          {language === "gu" ? "પગલું ૫ ની પુનઃકસોટી આપો / નોંધો" : "Conduct / Record Step 5 Reassessment"}
                                        </span>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Mark-Done Interactive Checkbox */}
                            <div
                              onClick={() => toggleStepCompleted(plan.id, step.stepNumber)}
                              className="shrink-0 mt-1 cursor-pointer p-1"
                              title={language === "gu" ? "પગલું પૂર્ણ ચિહ્નિત કરો" : "Mark step complete"}
                            >
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-[#2E7D5E]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#7A6862] hover:text-[#B26A1B]" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reassessment Outcome Summary & Follow-up Section */}
                {reassessment && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      reassessment.isMastered
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                        : "bg-amber-50/70 border-amber-300 text-amber-950"
                    } space-y-2`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {reassessment.isMastered ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <h4 className="font-bold text-xs">
                            {reassessment.isMastered
                              ? (language === "gu" ? "લક્ષિત સંકલ્પના સિદ્ધ થઈ — સ્વતંત્ર નિપુણતા પ્રમાણિત" : "Target Competency Achieved — Certified Independent Mastery")
                              : (language === "gu" ? "સંકલ્પના અણઉકેલાયેલી છે — વધારાનો મહાવરો જરૂરી" : "Target Objective Unresolved — Follow-Up Required")}
                          </h4>
                          <span className="text-[11px] opacity-80">
                            {language === "gu"
                              ? `મેળવેલ ગુણ: ${reassessment.marksObtained}/${reassessment.maximumMarks} (${reassessment.percentage}%) • પ્રારંભિક સ્કોર પરથી સુધારો: +${reassessment.deltaPercentagePoints} ટકાવારી પોઇન્ટ`
                              : `Score: ${reassessment.marksObtained}/${reassessment.maximumMarks} (${reassessment.percentage}%) • Growth: +${reassessment.deltaPercentagePoints} percentage points from baseline.`}
                          </span>
                        </div>
                      </div>

                      {/* If benchmark not met, offer 1-click follow-up plan generation */}
                      {!reassessment.isMastered && (
                        <Button
                          variant="saffron"
                          size="sm"
                          onClick={() => handleGenerateFollowUp(plan.id)}
                          className="rounded-full text-xs h-7 font-bold shrink-0 shadow-xs"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          <span>{language === "gu" ? "અનુકૂલિત ફોલો-અપ યોજના બનાવો" : "Generate Follow-Up Plan"}</span>
                        </Button>
                      )}
                    </div>

                    {/* Mastered vs Support Skills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      {reassessment.masteredSkills && reassessment.masteredSkills.length > 0 && (
                        <div>
                          <span className="font-semibold text-emerald-800 block text-[10px] uppercase">
                            {language === "gu" ? "પ્રભુત્વ મેળવેલ કૌશલ્યો:" : "Mastered Skills:"}
                          </span>
                          <span className="opacity-90">{reassessment.masteredSkills.join(", ")}</span>
                        </div>
                      )}
                      {reassessment.needsSupportSkills && reassessment.needsSupportSkills.length > 0 && (
                        <div>
                          <span className="font-semibold text-amber-800 block text-[10px] uppercase">
                            {language === "gu" ? "હજુ સહાય જરૂરી કૌશલ્યો:" : "Skills Still Requiring Support:"}
                          </span>
                          <span className="opacity-90">{reassessment.needsSupportSkills.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    {reassessment.retentionCheckDate && (
                      <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {language === "gu" ? "સૂચિત રીટેન્શન ચકાસણી તારીખ:" : "Scheduled Retention Check:"}{" "}
                          {new Date(reassessment.retentionCheckDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher Instructions & Reassessment Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-1">
                    <span className="font-bold text-[#B26A1B] block text-[10px] uppercase">
                      {language === "gu" ? "શિક્ષક માટે મૂર્ત સૂચનાઓ:" : "Teacher Concrete Instructions:"}
                    </span>
                    <p className="text-[#7A6862] leading-relaxed text-[11px]">
                      {plan.teacherInstructions ||
                        (language === "gu"
                          ? "મણકાથી કાર્યપત્રિકા નંબરો તરફ જતાં પહેલાં વિદ્યાર્થી શેષ જૂથો મૌખિક રીતે સમજાવે તેની ખાતરી કરો."
                          : "Ensure student verbally explains remainder groups before transitioning from tactile beads to worksheet numbers.")}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-1">
                    <span className="font-bold text-[#2E7D5E] block text-[10px] uppercase">
                      {language === "gu" ? "પુનઃમૂલ્યાંકન લક્ષ્ય બેન્ચમાર્ક:" : "Reassessment Target Benchmark:"}
                    </span>
                    <p className="text-[#7A6862] leading-relaxed text-[11px]">
                      {plan.reassessmentCriteria ||
                        (language === "gu"
                          ? "વિદ્યાર્થી પ્રવૃત્તિ સાધનો વગર ૫-પ્રશ્નોની ચકાસણીમાં સ્વતંત્ર રીતે ≥ ૮૦% મેળવે છે."
                          : "Student achieves ≥ 80% independently on a 5-question formative check without counting manipulatives.")}
                    </p>
                  </div>
                </div>

                {/* Teacher Notes & Scheduling Metadata */}
                {(plan.teacherNotes || plan.teacherObservations || plan.startDate || plan.targetDate) && (
                  <div className="p-3 rounded-2xl bg-white border border-[#49352F]/10 text-xs text-[#7A6862] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {(plan.startDate || plan.targetDate) && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-[#B26A1B]" />
                          <span>
                            {plan.startDate || "Active"} → {plan.targetDate || "Review in 7d"}
                          </span>
                        </span>
                      )}
                      {(plan.teacherNotes || plan.teacherObservations) && (
                        <span className="text-[11px] text-[#49352F]">
                          <strong>{language === "gu" ? "શિક્ષક નોંધ:" : "Notes:"}</strong> {plan.teacherNotes || plan.teacherObservations}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* REASSESSMENT RECORDING MODAL */}
      {reassessmentModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-[#49352F]/20 space-y-5 max-h-[90vh] overflow-y-auto text-[#49352F]">
            <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#B26A1B]" />
                <h3 className="font-heading font-extrabold text-lg text-[#49352F]">
                  {language === "gu" ? "૫-પ્રશ્નો પુનઃમૂલ્યાંકન પરિણામ નોંધો" : "Record 5-Question Reassessment"}
                </h3>
              </div>
              <button
                onClick={() => setReassessmentModalPlan(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-[#7A6862] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student context */}
            <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>{reassessmentModalPlan.studentName}</span>
                <span>{reassessmentModalPlan.conceptName}</span>
              </div>
              <div className="text-[#7A6862] flex justify-between">
                <span>
                  {language === "gu" ? "પ્રારંભિક સ્કોર:" : "Baseline Score:"} {reassessmentModalPlan.baselineScore ?? 35}%
                </span>
                <span>
                  {language === "gu" ? "લક્ષ્ય બેન્ચમાર્ક:" : "Target Benchmark:"} {reassessmentModalPlan.masteryBenchmark ?? 80}%
                </span>
              </div>
            </div>

            {/* Formative Questions List */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[#49352F] uppercase tracking-wider">
                {language === "gu" ? "પુનઃકસોટી પ્રશ્નો અને વિદ્યાર્થી જવાબો:" : "Reassessment Questions & Student Responses:"}
              </h4>

              {(reassessmentModalPlan.reassessmentQuestions && reassessmentModalPlan.reassessmentQuestions.length > 0
                ? reassessmentModalPlan.reassessmentQuestions
                : [
                    { questionNumber: 1, question: "Divide 15 candies equally among 3 children.", correctAnswer: "5 candies", marks: 1 },
                    { questionNumber: 2, question: "A teacher has 18 kites and gives an equal amount to 6 students. How many kites per student?", correctAnswer: "3 kites", marks: 1 },
                    { questionNumber: 3, question: "Calculate: 24 ÷ 4.", correctAnswer: "6", marks: 1 },
                    { questionNumber: 4, question: "Which multiplication fact shows that 20 ÷ 5 = 4?", correctAnswer: "5 × 4 = 20", marks: 1 },
                    { questionNumber: 5, question: "Divide 16 marbles into 2 equal bowls.", correctAnswer: "8 marbles", marks: 1 },
                  ]
              ).map((q: any) => (
                <div key={q.questionNumber} className="p-3 rounded-2xl border border-[#49352F]/10 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#49352F]">
                    <span>Q{q.questionNumber}: {q.question}</span>
                    <span className="text-[11px] text-[#7A6862] font-mono">{q.marks || 1} mark</span>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {q.options.map((opt: string, optIdx: number) => (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            setReassessmentAnswers((prev) => ({ ...prev, [q.questionNumber]: opt }))
                          }
                          className={`px-2.5 py-1 rounded-xl border text-xs cursor-pointer transition-colors ${
                            reassessmentAnswers[q.questionNumber] === opt
                              ? "bg-[#B26A1B] text-white border-[#B26A1B]"
                              : "bg-white text-[#49352F] border-[#49352F]/15 hover:bg-[#FAF6E9]"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {!q.options && (
                    <input
                      type="text"
                      placeholder={language === "gu" ? "વિદ્યાર્થીનો જવાબ લખો..." : "Student response..."}
                      value={reassessmentAnswers[q.questionNumber] || ""}
                      onChange={(e) =>
                        setReassessmentAnswers({ ...reassessmentAnswers, [q.questionNumber]: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-[#49352F]/15 text-xs bg-white text-[#49352F] outline-hidden"
                    />
                  )}

                  <div className="text-[10px] text-[#2E7D5E] font-medium flex items-center justify-between">
                    <span>{language === "gu" ? "સાચો ઉત્તર કી:" : "Correct Answer Key:"} {q.correctAnswer}</span>
                    {q.skillTarget && <span className="text-[#7A6862]">{q.skillTarget}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Score Entry & Validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15">
              <div>
                <label className="block text-xs font-bold text-[#49352F] mb-1">
                  {language === "gu" ? "મેળવેલ ગુણ:" : "Marks Obtained:"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={reassessmentMaxMarks}
                  value={reassessmentMarks}
                  onChange={(e) => setReassessmentMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white font-bold text-sm text-[#49352F] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#49352F] mb-1">
                  {language === "gu" ? "કુલ ગુણ:" : "Maximum Marks:"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={reassessmentMaxMarks}
                  onChange={(e) => setReassessmentMaxMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white font-bold text-sm text-[#49352F] outline-hidden"
                />
              </div>

              {/* Real-time Percentage & Delta Preview */}
              <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#49352F]/10 text-xs">
                <div>
                  <span className="text-[#7A6862]">{language === "gu" ? "ગણતરી કરેલ ટકાવારી:" : "Calculated Score:"} </span>
                  <span className="font-extrabold text-[#49352F]">
                    {Math.round((reassessmentMarks / Math.max(1, reassessmentMaxMarks)) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6862]">{language === "gu" ? "સુધારો:" : "Gain:"} </span>
                  <span className="font-extrabold text-[#2E7D5E]">
                    +{Math.round((reassessmentMarks / Math.max(1, reassessmentMaxMarks)) * 100) - (reassessmentModalPlan.baselineScore ?? 35)} pp
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6862]">{language === "gu" ? "બેન્ચમાર્ક સ્થિતિ:" : "Benchmark Status:"} </span>
                  {Math.round((reassessmentMarks / Math.max(1, reassessmentMaxMarks)) * 100) >= (reassessmentModalPlan.masteryBenchmark ?? 80) ? (
                    <Badge variant="completed" size="sm">
                      {language === "gu" ? "સિદ્ધ" : "Achieved"}
                    </Badge>
                  ) : (
                    <Badge variant="amber" size="sm">
                      {language === "gu" ? "અપૂર્ણ" : "Pending"}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#49352F] mb-1">
                  {language === "gu" ? "શિક્ષક પ્રતિક્રિયા / અવલોકન નોંધ:" : "Teacher Feedback & Error Observations:"}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === "gu" ? "વિદ્યાર્થીની મુશ્કેલી અથવા સુધારો નોંધો..." : "Notes on remaining misconceptions or student strengths..."}
                  value={reassessmentNotes}
                  onChange={(e) => setReassessmentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white text-xs text-[#49352F] outline-hidden"
                />
              </div>
            </div>

            {reassessmentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {reassessmentError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReassessmentModalPlan(null)}
                className="rounded-full text-xs"
              >
                {language === "gu" ? "રદ કરો" : "Cancel"}
              </Button>
              <Button
                variant="saffron"
                size="sm"
                onClick={submitReassessment}
                disabled={reassessmentSubmitting}
                className="rounded-full text-xs font-bold"
              >
                {reassessmentSubmitting
                  ? (language === "gu" ? "સાચવી રહ્યું છે..." : "Saving...")
                  : (language === "gu" ? "પુનઃમૂલ્યાંકન સાચવો" : "Save Reassessment Result")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PRACTICE WORKSHEET VIEWER MODAL */}
      {worksheetModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl border border-[#49352F]/20 space-y-5 max-h-[90vh] overflow-y-auto text-[#49352F]">
            <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#B26A1B]" />
                <h3 className="font-heading font-extrabold text-lg text-[#49352F]">
                  {worksheetModalPlan.worksheet?.worksheetTitle || `${worksheetModalPlan.conceptName} Practice Worksheet`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className="rounded-full text-xs h-7"
                >
                  {showAnswerKey ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                  <span>{showAnswerKey ? (language === "gu" ? "જવાબ છુપાવો" : "Hide Key") : (language === "gu" ? "જવાબ કી જુઓ" : "Show Key")}</span>
                </Button>
                <Button
                  variant="saffron"
                  size="sm"
                  onClick={handlePrintPlan}
                  className="rounded-full text-xs h-7 font-bold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  <span>{language === "gu" ? "પ્રિન્ટ" : "Print"}</span>
                </Button>
                <button
                  onClick={() => setWorksheetModalPlan(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-[#7A6862] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Worksheet Header */}
            <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span>Model Primary School, Gandhinagar</span>
                <span>Class {worksheetModalPlan.studentClass || 4} - {formatSubject(worksheetModalPlan.subjectCode || "MATH")}</span>
              </div>
              <div className="flex justify-between items-center text-[#7A6862]">
                <span>Student: {worksheetModalPlan.studentName}</span>
                <span>Time: 15 mins • Total Marks: 10</span>
              </div>
              <p className="text-[11px] text-[#49352F] italic pt-1 border-t border-[#49352F]/10">
                {language === "gu"
                  ? "સૂચના: દરેક પ્રશ્ન ધ્યાનપૂર્વક વાંચો અને નીચે આપેલી જગ્યામાં ગણતરી દર્શાવી સાચો ઉત્તર લખો."
                  : "Instructions: Read each question carefully. Show your rough work in the answer space provided."}
              </p>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {(worksheetModalPlan.worksheet?.questions && worksheetModalPlan.worksheet.questions.length > 0
                ? worksheetModalPlan.worksheet.questions
                : worksheetModalPlan.reassessmentQuestions || []
              ).map((q: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl border border-[#49352F]/12 bg-white space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-[#49352F]">
                    <span>Q{q.questionNumber || idx + 1}: {q.questionText || q.question}</span>
                    <span className="text-[11px] font-mono text-[#7A6862]">{q.marks || 2} marks</span>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {q.options.map((opt: string, optI: number) => (
                        <div key={optI} className="p-2 rounded-xl border border-slate-200 bg-slate-50/50">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Student Answer Space */}
                  <div className="h-12 border-b border-dashed border-[#49352F]/20 flex items-end pb-1 text-[11px] text-[#7A6862]">
                    <span>{language === "gu" ? "વિદ્યાર્થીનો જવાબ / ગણતરી:" : "Answer / Rough Work:"}</span>
                  </div>

                  {/* Optional Answer Key & Teacher Explanation */}
                  {showAnswerKey && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <span className="font-bold block text-[11px]">
                        {language === "gu" ? "સાચો ઉત્તર:" : "Answer Key:"} {q.answerKey || q.correctAnswer}
                      </span>
                      {(q.stepExplanation || q.explanation) && (
                        <span className="text-[10px] opacity-90 block">
                          {language === "gu" ? "સમજૂતી:" : "Step Explanation:"} {q.stepExplanation || q.explanation}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEACHER NOTES & SCHEDULE MODAL */}
      {editingNotesPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#49352F]/20 space-y-4 text-[#49352F]">
            <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#B26A1B]" />
                <h3 className="font-heading font-extrabold text-lg text-[#49352F]">
                  {language === "gu" ? "શિક્ષક નોંધ અને સમયપત્રક" : "Teacher Notes & Schedule"}
                </h3>
              </div>
              <button
                onClick={() => setEditingNotesPlan(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-[#7A6862] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#49352F] mb-1">
                  {language === "gu" ? "શિક્ષક અવલોકન અને પ્રગતિ નોંધ:" : "Teacher Observations & Activity Notes:"}
                </label>
                <textarea
                  rows={3}
                  value={editNotesValue}
                  onChange={(e) => setEditNotesValue(e.target.value)}
                  placeholder={language === "gu" ? "વિદ્યાર્થીની મુશ્કેલી અથવા સુધારો નોંધો..." : "Notes on student engagement, specific hurdle, or next steps..."}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#49352F] mb-1">
                    {language === "gu" ? "શરૂઆત તારીખ:" : "Start Date:"}
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#49352F]/20 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#49352F] mb-1">
                    {language === "gu" ? "લક્ષ્ય પૂર્ણતા તારીખ:" : "Target Completion Date:"}
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#49352F]/20 text-xs outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingNotesPlan(null)}
                className="rounded-full text-xs"
              >
                {language === "gu" ? "રદ કરો" : "Cancel"}
              </Button>
              <Button
                variant="saffron"
                size="sm"
                onClick={saveNotesAndSchedule}
                disabled={savingNotes}
                className="rounded-full text-xs font-bold"
              >
                {savingNotes
                  ? (language === "gu" ? "સાચવી રહ્યું છે..." : "Saving...")
                  : (language === "gu" ? "સાચવો" : "Save Changes")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Player Modal */}
      {activeActivity && (
        <ActivityPlayerModal
          activity={activeActivity}
          studentId={targetStudent?.id}
          studentName={targetStudent?.name}
          isOpen={Boolean(activeActivity)}
          onClose={() => setActiveActivity(null)}
          onCompleted={() => {
            fetchPlans();
          }}
        />
      )}

      {/* Guided Tour */}
      <SpotlightTour page="remedialPlans" />
    </AppLayout>
  );
}
