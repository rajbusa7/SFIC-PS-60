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
  Check,
} from "lucide-react";

// Step material icons mapping
function getStepMaterialIcon(stepNum: number) {
  switch (stepNum) {
    case 1:
      return <ClipboardList className="w-4 h-4 text-sky-400" />;
    case 2:
      return <Boxes className="w-4 h-4 text-amber-400" />; // Beads & counters
    case 3:
      return <Compass className="w-4 h-4 text-teal-400" />; // Number lines & diagrams
    case 4:
      return <BookOpen className="w-4 h-4 text-indigo-400" />; // Flashcards & quizzes
    case 5:
      return <Award className="w-4 h-4 text-emerald-400" />; // Reassessment
    default:
      return <Layers className="w-4 h-4 text-amber-400" />;
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

  // Activity player modal
  const [activeActivity, setActiveActivity] = useState<any>(null);
  const [targetStudent, setTargetStudent] = useState<any>(null);

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
        // Initialize completed steps from database record or smart status mapping
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

    // Persist step completion and update status in database
    const newStatus = updated.length === 5 ? "Completed" : updated.length > 0 ? "In Progress" : "Suggested";
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
              {t.remedialPlans.subtitle || "Targeted step-by-step manipulative pathways (counting beads, number lines, flashcards) to close student learning gaps."}
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
            </select>
          </div>
          <span className="text-xs text-[#7A6862]">
            {language === "gu"
              ? `${filteredPlans.length} સક્રિય ઉપચાર યોજનાઓ`
              : `${filteredPlans.length} active remedial plans`}
          </span>
        </Card>

        {/* Plans List */}
        <div className="space-y-6">
          {filteredPlans.map((plan) => {
            const completedList = completedStepsMap[plan.id] || [1];
            const steps = plan.steps && plan.steps.length > 0 ? plan.steps : [
              {
                stepNumber: 1,
                title: language === "gu" ? "નિદાનાત્મક મૂલ્યાંકન" : "Diagnostic Assessment",
                durationMinutes: 10,
                description: language === "gu" ? "મૂળભૂત ભૂલ પેટર્ન નોંધો અને શેષ સાથેની ચોક્કસ મૂંઝવણ ઓળખો." : "Record baseline error patterns and identify specific confusion with remainders.",
              },
              {
                stepNumber: 2,
                title: language === "gu" ? "મૂર્ત સાધનો (મણકા અને કાઉન્ટર્સ)" : "Concrete Manipulatives (Beads & Counters)",
                durationMinutes: 20,
                description: language === "gu" ? "વાટકીઓમાં જૂથબદ્ધ ૧૨ અને ૧૫ મણકા સાથે સમાન વહેંચણીનો વાસ્તવિક મહાવરો." : "Physical equal-sharing practice with 12 and 15 beads grouped into bowls.",
              },
              {
                stepNumber: 3,
                title: language === "gu" ? "દ્રશ્ય સંખ્યા રેખાઓ" : "Visual Number Lines",
                durationMinutes: 15,
                description: language === "gu" ? "ભૌતિક મણકાથી દોરેલી સંખ્યા રેખાઓ પર પાછળ કૂદવાની પ્રક્રિયા." : "Transition from physical beads to jumping backward on drawn number lines.",
              },
              {
                stepNumber: 4,
                title: language === "gu" ? "ઇન્ટરેક્ટિવ મહાવરો અને ક્વિઝ" : "Interactive Practice & Quizzes",
                durationMinutes: 15,
                description: language === "gu" ? "ત્વરિત પ્રતિસાદ અને સ્વ-સુધારણા સંકેતો સાથે ડિજિટલ પ્રશ્નો." : "Digital tablet questions with immediate feedback and self-correction prompts.",
              },
              {
                stepNumber: 5,
                title: language === "gu" ? "રચનાત્મક પુનઃમૂલ્યાંકન" : "Formative Reassessment",
                durationMinutes: 10,
                description: language === "gu" ? "વિદ્યાર્થી ૮૦% પ્રભુત્વ મર્યાદા પાર કરે છે તે ચકાસવા માટે અંતિમ મૂલ્યાંકન." : "Final assessment to verify student crosses the 80% mastery threshold.",
              },
            ];

            const isFullyCompleted = completedList.length >= steps.length;

            return (
              <Card
                key={plan.id}
                variant="glass"
                className={`p-6 border-[#49352F]/12 bg-white text-[#49352F] space-y-5 transition-all shadow-xs print:border-black print:bg-white print:text-black ${
                  isFullyCompleted ? "border-l-4 border-l-[#2E7D5E]" : "border-l-4 border-l-[#F2CAB3]"
                }`}
              >
                {/* Header of Plan */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#49352F]/10 print:border-slate-300">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/students/${plan.studentId}`}
                        className="font-heading font-extrabold text-lg text-[#49352F] hover:text-[#B26A1B] transition-colors print:text-black"
                      >
                        {plan.studentName}
                      </Link>
                      <Badge variant="outline" size="sm">
                        {formatSubject(plan.subjectCode || "MATH")}
                      </Badge>
                      <Badge
                        variant={
                          plan.status === "Completed"
                            ? "completed"
                            : plan.status === "Approved"
                            ? "approved"
                            : "inProgress"
                        }
                        size="sm"
                        dot
                      >
                        {formatStatus(plan.status)}
                      </Badge>
                      <span className="text-xs text-[#7A6862] font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#7A6862]" aria-hidden="true" />
                        <span>
                          {plan.estimatedMinutes || 60}{" "}
                          {language === "gu" ? "મિનિટ અનુક્રમ" : "mins sequence"}
                        </span>
                      </span>
                    </div>

                    <h3 className="font-heading text-base font-bold text-[#B26A1B] mt-1 print:text-black">
                      {language === "gu" ? "લક્ષિત સંકલ્પના:" : "Target Competency:"} {plan.conceptName}
                    </h3>

                    {plan.learningObjective && (
                      <p className="text-xs text-[#7A6862] max-w-2xl leading-relaxed print:text-slate-700">
                        <strong className="text-[#49352F] print:text-black">
                          {language === "gu" ? "શિક્ષણશાસ્ત્રીય ઉદ્દેશ્ય:" : "Pedagogical Objective:"}
                        </strong>{" "}
                        {plan.learningObjective}
                      </p>
                    )}
                  </div>

                  {/* Circular Progress Ring & Actions */}
                  <div className="flex items-center gap-4 self-end sm:self-start">
                    <div className="flex items-center gap-2 text-right">
                      <div className="hidden sm:block">
                        <span className="text-[10px] uppercase font-bold text-[#7A6862] block">
                          {language === "gu" ? "પ્રગતિ" : "Progress"}
                        </span>
                        <span className="text-xs font-extrabold text-[#49352F] print:text-black">
                          {completedList.length}/{steps.length} {language === "gu" ? "પગલાં" : "Steps"}
                        </span>
                      </div>
                      <ProgressRing
                        completedSteps={completedList.length}
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
                      {plan.status === "In Progress" && (
                        <Button
                          variant="mint"
                          size="sm"
                          onClick={() => handleUpdateStatus(plan.id, "Completed")}
                          className="rounded-full text-xs h-7"
                        >
                          {language === "gu" ? "પૂર્ણ તરીકે ચિહ્નિત કરો" : "Mark Completed"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Required Materials Chips */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs print:bg-slate-100 print:text-black">
                  <span className="font-bold text-[#49352F] flex items-center gap-1.5 print:text-black">
                    <Boxes className="w-3.5 h-3.5 text-[#B26A1B]" />
                    {language === "gu" ? "જરૂરી સાધનો:" : "Manipulatives Needed:"}
                  </span>
                  {(plan.requiredMaterials && plan.requiredMaterials.length > 0
                    ? plan.requiredMaterials
                    : ["Counting beads", "10-grouping bowls", "Drawn number lines", "Flashcards"]
                  ).map((mat: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-white border border-[#49352F]/12 text-[#49352F] text-[11px] font-medium print:bg-white print:border-slate-300 print:text-black"
                    >
                      {mat}
                    </span>
                  ))}
                </div>

                {/* 5-STEP VERTICAL STEPPER WITH MATERIAL ICONS & CHECKBOXES */}
                <div data-tour="plan-5steps" className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#7A6862] uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span>{language === "gu" ? "૫-પગલાં ઉપચાર ક્રમ" : "5-Step Remedial Sequence"}</span>
                      <ContextualHelp termKey="remedialPlan" />
                    </span>
                    <span className="text-[11px] font-normal lowercase">
                      {language === "gu"
                        ? "પગલું પૂર્ણ કરવા ચેકબોક્સ પર ક્લિક કરો"
                        : "Click checkbox to mark step done"}
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-3 border-l-2 border-[#49352F]/15 ml-3 print:border-slate-300">
                    {steps.map((step: any) => {
                      const isDone = completedList.includes(step.stepNumber);

                      return (
                        <div
                          key={step.stepNumber}
                          data-tour={step.stepNumber === 1 ? "plan-mark-done" : undefined}
                          onClick={() => toggleStepCompleted(plan.id, step.stepNumber)}
                          className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                            isDone
                              ? "bg-[#FAF6E9] border-[#2E7D5E]/30 text-[#49352F]"
                              : "bg-white border-[#49352F]/12 text-[#49352F] hover:border-[#49352F]/25 shadow-xs"
                          } print:bg-white print:border-slate-200 print:text-black`}
                        >
                          {/* Step Node Marker on Vertical Line */}
                          <div
                            className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border ${
                              isDone
                                ? "bg-[#2E7D5E] text-white border-[#2E7D5E]"
                                : "bg-[#FAF6E9] text-[#49352F] border-[#49352F]/20"
                            } print:bg-white print:text-black print:border-black`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" /> : step.stepNumber}
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
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
                                <span className="text-[10px] text-[#7A6862] font-mono">
                                  {step.durationMinutes}m
                                </span>
                              </div>

                              <p className="text-[11px] text-[#7A6862] leading-relaxed pl-7 print:text-slate-700">
                                {step.description}
                              </p>
                            </div>

                            {/* Mark-Done Interactive Checkbox */}
                            <div className="shrink-0 mt-1">
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-[#2E7D5E]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#7A6862] group-hover:text-[#B26A1B]" />
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
                  <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-1">
                    <span className="font-bold text-[#B26A1B] block text-[10px] uppercase">
                      {language === "gu" ? "શિક્ષક માટે મૂર્ત સૂચનાઓ:" : "Teacher Concrete Instructions:"}
                    </span>
                    <p className="text-[#7A6862] leading-relaxed text-[11px]">
                      {plan.teacherInstructions || (language === "gu"
                        ? "મણકાથી કાર્યપત્રિકા નંબરો તરફ જતાં પહેલાં વિદ્યાર્થી શેષ જૂથો મૌખિક રીતે સમજાવે તેની ખાતરી કરો."
                        : "Ensure student verbally explains remainder groups before transitioning from tactile beads to worksheet numbers.")}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-1">
                    <span className="font-bold text-[#2E7D5E] block text-[10px] uppercase">
                      {language === "gu" ? "પુનઃમૂલ્યાંકન લક્ષ્ય બેન્ચમાર્ક:" : "Reassessment Target Benchmark:"}
                    </span>
                    <p className="text-[#7A6862] leading-relaxed text-[11px]">
                      {plan.reassessmentCriteria || (language === "gu"
                        ? "વિદ્યાર્થી પ્રવૃત્તિ સાધનો વગર ૫-પ્રશ્નોની ચકાસણીમાં સ્વતંત્ર રીતે ≥ ૮૦% મેળવે છે."
                        : "Student achieves ≥ 80% independently on a 5-question formative check without counting manipulatives.")}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

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
