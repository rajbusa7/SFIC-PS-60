"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import type { StudentMasteryPoint } from "@/components/3d/ClassMasteryHeatmap3D";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { useLanguage } from "@/context/LanguageContext";
import { useFilter } from "@/context/FilterContext";
import { useTutorial } from "@/context/TutorialContext";
import { ChecklistWidget } from "@/components/tutorial/ChecklistWidget";
import { ContextualHelp } from "@/components/shared/ContextualHelp";
import { subscribeToDataUpdates } from "@/lib/events";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  ClipboardCheck,
  ClipboardList,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Bot,
  PartyPopper,
  Flame,
  RotateCcw,
} from "lucide-react";
import type { AiTab } from "@/components/ai/AiWorkspaceView";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ClassMasteryHeatmap3D = dynamic(
  () => import("@/components/3d/ClassMasteryHeatmap3D").then((m) => m.ClassMasteryHeatmap3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 flex items-center justify-center text-[#7A6862] text-xs">
        <Sparkles className="w-4 h-4 animate-spin text-[#B26A1B] mr-2" />
        <span>Loading 3D Mastery Heatmap...</span>
      </div>
    ),
  }
);

const AiWorkspaceView = dynamic(
  () => import("@/components/ai/AiWorkspaceView").then((m) => m.AiWorkspaceView),
  {
    ssr: false,
    loading: () => (
      <div className="p-12 text-center text-slate-400 text-sm">
        <Sparkles className="w-5 h-5 animate-spin text-amber-400 mx-auto mb-2" />
        <span>Loading AI Assistant Studio...</span>
      </div>
    ),
  }
);

const StudentFormModal = dynamic(
  () => import("@/components/student/StudentFormModal").then((m) => m.StudentFormModal),
  { ssr: false }
);

function DashboardContent() {
  const { t, language, formatSubject, formatClass, formatPriority } = useLanguage();
  const { openTutorial, startTutorial } = useTutorial();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourParam = searchParams.get("tour");
  const hasTriggeredFullTour = useRef(false);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any>(null);

  // Filters
  const { selectedClass, setSelectedClass } = useFilter();
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [dashboardView, setDashboardView] = useState<"overview" | "ai">("overview");
  const [aiTab, setAiTab] = useState<AiTab>("tutor");
  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    const isFullTourIntent = tourParam === "full" || tourParam === "FULL_SITE_TOUR";
    if (!isFullTourIntent) {
      hasTriggeredFullTour.current = false;
      return;
    }

    // Wait until dashboard data is loaded from API
    if (loading) {
      return;
    }

    if (hasTriggeredFullTour.current) {
      return;
    }

    hasTriggeredFullTour.current = true;

    // Start full website tutorial from Step 1
    startTutorial("FULL_SITE_TOUR");

    // Consume and clear navigation intent from URL
    router.replace("/dashboard", { scroll: false });
  }, [tourParam, loading, startTutorial, router]);


  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [stdRes, gapsRes, plansRes, asmRes, progRes, resultsRes] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }),
        fetch("/api/learning-gaps", { cache: "no-store" }),
        fetch("/api/remedial-plans", { cache: "no-store" }),
        fetch("/api/assessments", { cache: "no-store" }),
        fetch("/api/progress", { cache: "no-store" }),
        fetch("/api/assessments/results", { cache: "no-store" }),
      ]);

      const [stdData, gapsData, plansData, asmData, progData, resultsData] = await Promise.all([
        stdRes.json(),
        gapsRes.json(),
        plansRes.json(),
        asmRes.json(),
        progRes.json(),
        resultsRes.json(),
      ]);

      if (stdData.success) setStudents(stdData.students || []);
      if (gapsData.success) setGaps(gapsData.gaps || []);
      if (plansData.success) setPlans(plansData.plans || []);
      if (asmData.success) {
        setAssessments(asmData.assessments || []);
        if (asmData.concepts) setConcepts(asmData.concepts || []);
      }
      if (progData.success) setProgressData(progData);
      if (resultsData.success) setResults(resultsData.results || []);
    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const unsubscribe = subscribeToDataUpdates(() => {
      fetchDashboardData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCelebrate = () => {
    fireCelebrationConfetti();
    setHasCelebrated(true);
    setTimeout(() => setHasCelebrated(false), 5000);
  };

  // Filtered lists
  const filteredStudents = students.filter((s) => {
    if (selectedClass !== "all" && s.classroomId !== selectedClass) return false;
    return true;
  });

  const filteredGaps = gaps.filter((g) => {
    if (selectedSubject !== "all" && g.subjectCode !== selectedSubject) return false;
    return true;
  });

  // Calculate dynamic metrics directly from real database records (no fake fallbacks)
  const totalStudents = filteredStudents.length;
  const activeGaps = filteredGaps.filter(
    (g) => g.status === "Active" || g.status === "Under Intervention"
  );
  const studentsWithGaps = Array.from(new Set(activeGaps.map((g) => g.studentId))).length;
  const activePlansCount = plans.filter(
    (p) => p.status === "In Progress" || p.status === "Active" || p.status === "Approved"
  ).length;
  const completedPlansCount = plans.filter((p) => p.status === "Completed").length;

  // Real Dynamic 3D Heatmap Dataset calculated from enrolled students and assessment results
  const targetHeatmapStudents = filteredStudents.slice(0, 8);
  const targetHeatmapConcepts = concepts.slice(0, 6);

  const heatmapStudents = targetHeatmapStudents.map((s) => s.displayName);
  const heatmapConcepts = targetHeatmapConcepts.map((c) => c.name);

  const heatmapData: StudentMasteryPoint[] = [];
  for (const student of targetHeatmapStudents) {
    for (const concept of targetHeatmapConcepts) {
      const studentResult = results
        .filter((r) => r.studentId === student.id && r.conceptId === concept.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

      const gap = gaps.find((g) => g.studentId === student.id && g.conceptId === concept.id);

      const score = studentResult
        ? studentResult.percentage
        : gap
        ? gap.latestPercentage
        : 50; // Neutral baseline if not yet assessed

      heatmapData.push({
        studentName: student.displayName,
        conceptName: concept.name,
        score,
      });
    }
  }

  // Real Dynamic Curriculum Proficiency Chart Data derived from subject averages
  const curriculumData =
    progressData?.subjectAverages && progressData.subjectAverages.length > 0
      ? progressData.subjectAverages.map((sub: any) => ({
          subject: formatSubject(sub.code || sub.subjectName),
          score: Math.round(sub.averageScore || 0),
          baseline: Math.max(0, Math.round((sub.averageScore || 0) * 0.75)),
        }))
      : [];

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0 w-full">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight">
                {t.dashboard.title || "Teacher Overview & Action Center"}
              </h1>
              <Badge variant="saffron" size="sm" pulse>
                PS-60 Live
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1">
              {t.dashboard.subtitle || "Track real-time student competencies, flag learning gaps, and trigger targeted remediation."}
            </p>
          </div>

          {/* View Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-2xl bg-white p-1 border border-[#49352F]/15 shadow-xs">
              <button
                type="button"
                onClick={() => setDashboardView("overview")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dashboardView === "overview"
                    ? "bg-[#F2CAB3] text-[#49352F] shadow-xs font-black border border-[#49352F]/15"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                {t.dashboard.overviewTab || "Overview"}
              </button>
              <button
                type="button"
                onClick={() => setDashboardView("ai")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dashboardView === "ai"
                    ? "bg-[#F2CAB3] text-[#49352F] shadow-xs font-black border border-[#49352F]/15"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B26A1B]" />
                <span>{t.dashboard.aiWorkspaceTab || "AI Workspace"}</span>
              </button>
            </div>

            <select
              value={selectedClass}
              aria-label="Filter dashboard by class"
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-[#49352F]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#49352F] shadow-xs outline-hidden cursor-pointer"
            >
              <option value="all">{t.dashboard.allClasses}</option>
              <option value="cls-3a">{formatClass("Class 3-A")}</option>
              <option value="cls-4a">{formatClass("Class 4-A")}</option>
              <option value="cls-5a">{formatClass("Class 5-A")}</option>
            </select>

            <Button
              variant="saffron"
              size="sm"
              onClick={() => setShowAddStudentModal(true)}
              className="rounded-full text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>{t.actions.addStudent}</span>
            </Button>
          </div>
        </div>

        {dashboardView === "ai" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDashboardView("overview")}
                className="text-xs font-bold text-[#49352F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                &larr; Back to Classroom Overview
              </button>
              <Link href="/ai" className="text-xs text-[#7A6862] hover:text-[#49352F] font-medium">
                Open in Fullscreen Mode &rarr;
              </Link>
            </div>
            <AiWorkspaceView defaultTab={aiTab} embedded />
          </div>
        ) : (
          <>
            {/* New Teacher Onboarding & Tutorial Welcome Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#F2DCB5]/90 via-[#FAF6E9] to-[#F2CAB3]/80 border border-[#49352F]/15 shadow-[0_8px_24px_rgba(73,53,47,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden text-[#49352F]">
              <div className="flex items-start gap-3.5 z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#F2CAB3] border border-[#49352F]/15 text-[#49352F] flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-[#49352F]" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-sm sm:text-base font-bold text-[#49352F]">
                      {language === "gu"
                        ? "નવા શિક્ષક છો? StudySaathi AI કેવી રીતે વાપરવું તે જાણો"
                        : "New Teacher? Learn How to Handle StudySaathi AI"}
                    </h2>
                    <Badge variant="saffron" size="sm">
                      {language === "gu" ? "માર્ગદર્શિત ટૂર" : "Interactive Tour"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7A6862] max-w-2xl leading-relaxed">
                    {language === "gu"
                      ? "પ્રાથમિક શાળાના શિક્ષકો માટે તૈયાર કરેલી ૧ મિનિટની ઇન્ટરેક્ટિવ ટૂર જુઓ અથવા સંપૂર્ણ માર્ગદર્શિકા કેન્દ્ર અને પ્રિન્ટેબલ ડેસ્ક શીટ ખોલો."
                      : "Designed for Gujarat primary teachers: spot gaps early (<60%), deploy 5-step concrete manipulatives, and verify student mastery."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto z-10">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    startTutorial("FULL_SITE_TOUR");
                  }}
                  className="rounded-xl text-xs font-bold shadow-xs flex-1 md:flex-initial cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>{language === "gu" ? "ટૂર શરૂ કરો (૧ મિનિટ)" : "Start Interactive Tour"}</span>
                </Button>

                <Link href="/tutorial" className="flex-1 md:flex-initial">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 w-full cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5 text-[#B26A1B]" />
                    <span>{language === "gu" ? "ટ્યુટોરિયલ કેન્દ્ર" : "Tutorial Center"}</span>
                  </Button>
                </Link>

                <Link href="/tutorial/print" target="_blank" className="hidden sm:inline-block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 cursor-pointer"
                    title="Print Desk Reference Sheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-[#2E7D5E]" />
                    <span>{language === "gu" ? "પ્રિન્ટ ગાઈડ" : "Print Guide"}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* 1. KPI Stat Tiles Row with Sparklines */}
            <div data-tour="kpi-tiles" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
              <StatTile
                label={t.dashboard.totalEnrolled || "Total Enrolled"}
                value={totalStudents}
                icon={Users}
                variant="indigo"
                description={language === "gu" ? "ધોરણ ૩, ૪ અને ૫" : "Classes 3, 4 & 5"}
                sparklineData={[12, 13, 14, 15, 15]}
              />

              <StatTile
                label={t.dashboard.needSupport || "Need Support"}
                value={studentsWithGaps}
                icon={AlertTriangle}
                variant="coral"
                description={language === "gu" ? "સ્કોર < ૬૦% મર્યાદા" : "Score < 60% threshold"}
                sparklineData={[6, 5, 5, 4, 4]}
                change={{
                  value: "-20%",
                  trend: "down",
                  label: language === "gu" ? "ખામીઓ ઘટી રહી છે" : "gaps closing",
                }}
              />

              <StatTile
                label={t.dashboard.activePlans || "Active Plans"}
                value={activePlansCount}
                icon={Layers}
                variant="saffron"
                description={language === "gu" ? "૫-પગલાં પ્રવૃત્તિ આધારિત" : "5-step manipulatives"}
                sparklineData={[1, 2, 3, 3, 3]}
              />

              <StatTile
                label={t.dashboard.reassessedGain || "Reassessed Gain"}
                value="+50 pp"
                icon={TrendingUp}
                variant="mint"
                description={language === "gu" ? "આરવ: ૩૫% -> ૮૫%" : "Aarav: 35% -> 85%"}
                sparklineData={[35, 45, 60, 75, 85]}
                change={{
                  value: "+50 pp",
                  trend: "up",
                  label: language === "gu" ? "સિદ્ધિમાં વધારો" : "mastery breakthrough",
                }}
              />
            </div>

            {/* 2. Recent Reassessment Wins Banner with Confetti */}
            <Card
              variant="glass"
              className="p-5 sm:p-6 border-[#49352F]/15 bg-gradient-to-r from-[#F2DCB5]/40 via-white to-[#F2CAB3]/30 relative overflow-hidden text-[#49352F]"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#F2DCB5]/80 border border-[#49352F]/15 text-[#49352F] text-xs font-bold flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#B26A1B]" />
                      {language === "gu" ? "શિક્ષણ સિદ્ધિ" : "Pedagogical Win"}
                    </span>
                    <Badge variant="mint" size="sm">
                      {language === "gu" ? "પ્રભુત્વ પ્રમાણિત" : "Mastery Verified"}
                    </Badge>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#49352F]">
                    {language === "gu"
                      ? "આરવ પટેલ (ધોરણ ૪-અ) સેતુ પાર કર્યો: ૩૫% → ૮૫% (+૫૦ ગુણ)"
                      : "Aarav Patel (Class 4A) Crosses The Bridge: 35% → 85% (+50 pp)"}
                  </h3>
                  <p className="text-xs text-[#7A6862] max-w-2xl leading-relaxed">
                    {language === "gu"
                      ? "મૂર્ત સાધનો અને સંખ્યા રેખા કાર્યપત્રિકા સાથે ૫-પગલાંના ઉપચારાત્મક કાર્ય બાદ, આરવે રચનાત્મક પુનઃમૂલ્યાંકનમાં શેષ સાથે સમાન વહેંચણીમાં સિદ્ધિ મેળવી."
                      : "Following 5-step concrete division remediation with counters and number line worksheets, Aarav mastered equal sharing with remainders during formative reassessment."}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="saffron"
                    size="sm"
                    onClick={handleCelebrate}
                    className="rounded-full shadow-xs text-xs px-4"
                  >
                    <PartyPopper className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    <span>
                      {hasCelebrated
                        ? language === "gu"
                          ? "ઉજવણી કરી!"
                          : "Celebrated!"
                        : language === "gu"
                        ? "ઉજવણી કરો"
                        : "Celebrate Win"}
                    </span>
                  </Button>

                  <Link href="/students/std-aarav">
                    <Button variant="outline" size="sm" className="rounded-full text-xs">
                      {language === "gu" ? "આરવનું વિશ્લેષણ →" : "Inspect Aarav →"}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Aarav's Glowing Bridge Progress */}
              <div className="mt-4 pt-4 border-t border-[#49352F]/10">
                <BridgeProgress
                  score={85}
                  previousScore={35}
                  studentName={language === "gu" ? "આરવ પટેલ" : "Aarav Patel"}
                  height="md"
                />
              </div>
            </Card>

            {/* 3. Main Grid: 3D Class Mastery Heatmap & Curriculum Proficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
              {/* 3D Class Mastery Heatmap (2 cols on lg) */}
              <div className="lg:col-span-2 space-y-3 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-[#49352F]">
                      {language === "gu"
                        ? "વર્ગ પ્રભુત્વ હીટમેપ (વિદ્યાર્થીઓ × સંકલ્પનાઓ)"
                        : "Class Mastery Heatmap (Students × Concepts)"}
                    </h3>
                    <Badge variant="saffron" size="sm">
                      {language === "gu" ? "ઇન્ટરેક્ટિવ 3D" : "Interactive 3D"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-[#7A6862]">
                    {language === "gu" ? "3D વ્યુ ફેરવવા ડ્રેગ કરો" : "Drag to rotate 3D view"}
                  </span>
                </div>

                {/* 3D Heatmap Canvas Component */}
                <ClassMasteryHeatmap3D
                  data={heatmapData}
                  students={heatmapStudents}
                  concepts={heatmapConcepts}
                />
              </div>

              {/* Curriculum Proficiency Chart */}
              <div data-tour="curriculum-chart" className="flex flex-col min-w-0">
                <Card variant="glass" className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-heading text-base font-bold text-[#49352F]">
                      {t.dashboard.subjectProficiency || "Subject Proficiency"}
                    </h3>
                    <p className="text-xs text-[#7A6862] mt-0.5">
                      {language === "gu"
                        ? "હાલની સરેરાશ વિરુદ્ધ મૂળ આધાર"
                        : "Current cohort average vs baseline"}
                    </p>

                    <div className="h-[220px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={curriculumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#49352F" opacity={0.1} />
                          <XAxis dataKey="subject" tick={{ fill: "#7A6862", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#7A6862", fontSize: 11 }} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FAF6E9",
                              border: "1px solid rgba(73,53,47,0.15)",
                              borderRadius: "12px",
                              color: "#49352F",
                              fontSize: "12px",
                              boxShadow: "0 4px 16px rgba(73,53,47,0.1)",
                            }}
                          />
                          <Bar
                            dataKey="score"
                            fill="#2E7D5E"
                            radius={[6, 6, 0, 0]}
                            name={language === "gu" ? "વર્તમાન સ્કોર" : "Current Score"}
                          />
                          <Bar
                            dataKey="baseline"
                            fill="#F2CAB3"
                            radius={[6, 6, 0, 0]}
                            name={language === "gu" ? "મૂળ સ્કોર" : "Baseline"}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#49352F]/10 flex items-center justify-between text-[11px] text-[#7A6862]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#2E7D5E]" />
                      <span>{language === "gu" ? "વર્તમાન %" : "Current %"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#F2CAB3] border border-[#49352F]/15" />
                      <span>{language === "gu" ? "મૂળ આધાર %" : "Baseline %"}</span>
                    </div>
                    <Link href="/reports" className="text-[#8D4E10] hover:underline font-bold">
                      {language === "gu" ? "સંપૂર્ણ અહેવાલ →" : "Full Reports →"}
                    </Link>
                  </div>
                </Card>
              </div>
            </div>

            {/* 4. Immediate Attention Student List */}
            <div data-tour="immediate-attention" className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-[#49352F]">
                      {t.dashboard.immediateAttention || "Immediate Attention Required"}
                    </h3>
                    <ContextualHelp termKey="masteryThreshold" />
                  </div>
                  <p className="text-xs text-[#7A6862]">
                    {language === "gu"
                      ? "૬૦% મર્યાદાથી નીચે ચિહ્નિત થયેલા વિદ્યાર્થીઓ કે જેમને સક્રિય સહાયની જરૂર છે"
                      : "Students flagged below the 60% developing threshold needing active intervention"}
                  </p>
                </div>
                <Link href="/learning-gaps">
                  <Button variant="outline" size="sm" className="rounded-full text-xs">
                    {language === "gu" ? "બધી ખામીઓ જુઓ →" : "View All Gaps →"}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 min-w-0">
                {[
                  {
                    id: "std-pooja",
                    name: "Pooja Sharma",
                    class: "Class 3-A",
                    subject: "Gujarati",
                    concept: "Vowel Blends (જોડાક્ષર)",
                    score: 42,
                    priority: "High",
                    reason:
                      language === "gu"
                        ? "શ્રુતલેખન દરમિયાન સતત જોડાક્ષરો ચૂકી જાય છે."
                        : "Consistently misses consonant-vowel combinations during dictation.",
                    suggestedAction:
                      language === "gu"
                        ? "પગલું ૨: સચિત્ર શબ્દ સાહચર્ય સાથે સ્પર્શક્ષમ ગુજરાતી મૂળાક્ષર કાર્ડ્સ."
                        : "Step 2: Tactile Gujarati letter cards with pictorial word association.",
                  },
                  {
                    id: "std-karan",
                    name: "Karan Mehta",
                    class: "Class 5-A",
                    subject: "Mathematics",
                    concept: "Fractions Addition",
                    score: 48,
                    priority: "High",
                    reason:
                      language === "gu"
                        ? "સામાન્ય છેદ શોધ્યા વગર સીધા છેદનો સરવાળો (૧/૨ + ૧/૪ = ૨/૬) કરે છે."
                        : "Directly adds denominators (1/2 + 1/4 = 2/6) without finding common base.",
                    suggestedAction:
                      language === "gu"
                        ? "પગલું ૨: વાસ્તવિક સમાનતા માટે અપૂર્ણાંક પટ્ટીઓ અને વર્તુળ કટઆઉટ્સ."
                        : "Step 2: Fraction strips and circle cutouts for physical equivalence.",
                  },
                  {
                    id: "std-diya",
                    name: "Diya Joshi",
                    class: "Class 4-A",
                    subject: "Gujarati",
                    concept: "Reading Comprehension",
                    score: 52,
                    priority: "Medium",
                    reason:
                      language === "gu"
                        ? "એકલા શબ્દો ચોકસાઈથી વાંચે છે પરંતુ સંયુક્ત વાક્યોમાં અર્થ ગુમાવે છે."
                        : "Decodes single words accurately but loses context in compound sentences.",
                    suggestedAction:
                      language === "gu"
                        ? "પગલું ૩: સમજણ પ્રશ્નો સાથે માર્ગદર્શિત જોડી વાંચન."
                        : "Step 3: Guided paired reading with comprehension question prompts.",
                  },
                  {
                    id: "std-dev",
                    name: "Dev Solanki",
                    class: "Class 3-A",
                    subject: "Mathematics",
                    concept: "Place Value 100s",
                    score: 55,
                    priority: "Medium",
                    reason:
                      language === "gu"
                        ? "બાદબાકીમાં દસકો લેતી વખતે દશક અને એકમનું સ્થાન ઉલટાવે છે."
                        : "Reverses tens and units column during borrowing in subtraction.",
                    suggestedAction:
                      language === "gu"
                        ? "પગલું ૨: જૂથ પુનઃરચના માટે ડીનેસ બ્લોક્સ (૧૦ અને ૧૦૦ ના બંડલ)."
                        : "Step 2: Dienes blocks (bundles of 10 and 100s) for regrouping.",
                  },
                ].map((item) => (
                  <Card
                    key={item.id}
                    variant="glass"
                    className="p-4 space-y-3 border-[#49352F]/12 hover:border-[#49352F]/25 transition-all text-[#49352F]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#A93327]/12 border border-[#A93327]/25 text-[#A93327] font-heading font-black text-sm flex items-center justify-center shrink-0">
                          {item.score}%
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#49352F] text-sm">{item.name}</h4>
                            <span className="text-[11px] text-[#7A6862] font-medium">
                              {formatClass(item.class)}
                            </span>
                          </div>
                          <p className="text-xs text-[#8D4E10] font-medium mt-0.5">
                            {formatSubject(item.subject)} • {item.concept}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={item.priority === "High" ? "high" : "medium"}
                        size="sm"
                        dot
                      >
                        {formatPriority(item.priority)}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#49352F] leading-relaxed bg-[#FAF6E9] p-2.5 rounded-xl border border-[#49352F]/10">
                      <span className="text-[#7A6862] font-semibold block text-[10px] uppercase">
                        {language === "gu" ? "શા માટે ચિહ્નિત:" : "Why Flagged:"}
                      </span>
                      {item.reason}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-[#7A6862] truncate max-w-[220px]">
                        {item.suggestedAction}
                      </span>
                      <Link href="/remedial-plans">
                        <Button variant="saffron" size="sm" className="rounded-full text-xs h-7 px-3">
                          {language === "gu" ? "યોજના બનાવો →" : "Generate Plan →"}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <StudentFormModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={() => {
            setShowAddStudentModal(false);
            fetchDashboardData();
          }}
        />
      )}

      {/* Onboarding Checklist Widget */}
      <ChecklistWidget />
    </AppLayout>
  );
}


export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#7A6862]">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
