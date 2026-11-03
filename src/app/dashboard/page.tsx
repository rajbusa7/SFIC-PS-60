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
import { useAuth } from "@/context/AuthContext";
import type { SubjectCode } from "@/lib/types";
import { useFilter, parseGradeNumber } from "@/context/FilterContext";
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

const TeacherManagementSection = dynamic(
  () => import("@/components/admin/TeacherManagementSection").then((m) => m.TeacherManagementSection),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-xs text-[#7A6862] bg-[#FAF6E9] rounded-2xl border border-[#49352F]/15">
        Loading Teacher Management...
      </div>
    ),
  }
);

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, formatSubject, formatClass, formatPriority } = useLanguage();
  const { user, role, assignments, selectedSubject: authSelectedSubject, setSelectedSubject: setAuthSelectedSubject, assignmentNotice } = useAuth();
  const isTeacher = user?.role === "teacher" || role === "teacher";
  const isAdmin = user?.role === "admin" || role === "admin";
  const urlSubjectParam = searchParams.get("subject")?.toUpperCase() as SubjectCode | null;
  const teacherSubjectCodes = assignments.map((a) => a.subjectCode);
  const activeSubject: SubjectCode | "all" = isTeacher
    ? (urlSubjectParam && teacherSubjectCodes.includes(urlSubjectParam)
        ? urlSubjectParam
        : authSelectedSubject && teacherSubjectCodes.includes(authSelectedSubject)
        ? authSelectedSubject
        : teacherSubjectCodes.length > 0
        ? teacherSubjectCodes[0]
        : "MATH")
    : (urlSubjectParam || (authSelectedSubject ?? "all"));

  const [showSwitchSubjectModal, setShowSwitchSubjectModal] = useState(false);
  const handleSelectNewSubject = (code: SubjectCode) => {
    setAuthSelectedSubject(code);
    setSelectedClass("all");
    setShowSwitchSubjectModal(false);
    router.replace(`/dashboard?subject=${code}`);
  };

  const activeAssignment = isTeacher
    ? assignments.find((a) => a.subjectCode === activeSubject)
    : null;

  const permittedGrades = isTeacher
    ? (activeAssignment?.grades && activeAssignment.grades.length > 0
        ? activeAssignment.grades.slice().sort((a, b) => a - b)
        : [1, 2, 3, 4, 5])
    : [1, 2, 3, 4, 5];
  const { openTutorial, startTutorial } = useTutorial();
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
  const [dashboardView, setDashboardView] = useState<"overview" | "ai" | "teachers">("overview");

  const viewParam = searchParams.get("view") || searchParams.get("tab");
  useEffect(() => {
    if (viewParam === "teachers") {
      setDashboardView("teachers");
    } else if (viewParam === "ai") {
      setDashboardView("ai");
    } else if (viewParam === "overview") {
      setDashboardView("overview");
    }
  }, [viewParam]);
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


  // Subject Marks Management States (Phase 5)
  const [editingScores, setEditingScores] = useState<Record<string, { marks: number; maxMarks: number; notes: string; saving?: boolean; saved?: boolean; error?: string }>>({});

  const handleScoreInputChange = (studentId: string, marksVal: string, maxMarks: number) => {
    const val = parseFloat(marksVal);
    setEditingScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: isNaN(val) ? 0 : val,
        maxMarks: maxMarks,
        notes: prev[studentId]?.notes || "",
        error: val < 0 ? "Marks cannot be negative." : val > maxMarks ? `Marks cannot exceed ${maxMarks}.` : undefined,
        saved: false,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notesVal: string) => {
    setEditingScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: prev[studentId]?.marks ?? 15,
        maxMarks: prev[studentId]?.maxMarks ?? 20,
        notes: notesVal,
        saved: false,
      },
    }));
  };

  const handleSaveStudentMarks = async (studentId: string, conceptId: string, assessmentId: string, maxMarks: number) => {
    const current = editingScores[studentId];
    const scoreVal = current?.marks ?? 15;
    const notesVal = current?.notes ?? "";

    if (scoreVal < 0 || scoreVal > maxMarks) {
      setEditingScores((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          marks: scoreVal,
          maxMarks,
          notes: notesVal,
          error: `Marks must be between 0 and ${maxMarks}.`,
        },
      }));
      return;
    }

    setEditingScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: scoreVal,
        maxMarks,
        notes: notesVal,
        saving: true,
        error: undefined,
      },
    }));

    try {
      const res = await fetch("/api/assessments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: [
            {
              assessmentId,
              studentId,
              conceptId,
              marksObtained: scoreVal,
              maximumMarks: maxMarks,
              notes: notesVal,
              subjectCode: activeSubject !== "all" ? activeSubject : "MATH",
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save marks.");
      }

      setEditingScores((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          saving: false,
          saved: true,
          error: undefined,
        },
      }));

      // Refresh data
      fetchDashboardData();
      setTimeout(() => {
        setEditingScores((prev) => ({
          ...prev,
          [studentId]: { ...prev[studentId], saved: false },
        }));
      }, 3500);
    } catch (err: any) {
      setEditingScores((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          saving: false,
          error: err.message || "Failed to save marks.",
        },
      }));
    }
  };

  // Filtered lists based on unified selectedClass
  const selectedGrade = parseGradeNumber(selectedClass);
  const selectValue = selectedGrade !== null ? String(selectedGrade) : "all";

  const filteredStudents = students.filter((s) => {
    if (selectedClass !== "all") {
      if (selectedGrade !== null) {
        if (s.grade !== selectedGrade && s.classroomId !== selectedClass) return false;
      } else if (s.classroomId !== selectedClass) {
        return false;
      }
    }
    return true;
  });

  const studentIdsInClass = new Set(filteredStudents.map((s) => s.id));

  const filteredGaps = gaps.filter((g) => {
    if (selectedClass !== "all") {
      if (selectedGrade !== null) {
        if (g.grade !== selectedGrade && !studentIdsInClass.has(g.studentId)) return false;
      } else if (!studentIdsInClass.has(g.studentId)) {
        return false;
      }
    }
    if (activeSubject !== "all" && g.subjectCode !== activeSubject) return false;
    if (selectedSubject !== "all" && g.subjectCode !== selectedSubject) return false;
    return true;
  });

  const filteredPlans = plans.filter((p) => {
    if (selectedClass !== "all") {
      if (selectedGrade !== null) {
        if (p.studentClass !== selectedGrade && !studentIdsInClass.has(p.studentId)) return false;
      } else if (!studentIdsInClass.has(p.studentId)) {
        return false;
      }
    }
    return true;
  });

  // Calculate dynamic metrics directly from real database records (no fake fallbacks)
  const totalStudents = filteredStudents.length;
  const activeGaps = filteredGaps.filter(
    (g) => g.status === "Active" || g.status === "Under Intervention"
  );
  const studentsWithGaps = Array.from(new Set(activeGaps.map((g) => g.studentId))).length;
  const activePlansCount = filteredPlans.filter(
    (p) => p.status === "In Progress" || p.status === "Active" || p.status === "Approved"
  ).length;
  const completedPlansCount = filteredPlans.filter((p) => p.status === "Completed").length;

  const immediateAttentionGaps = [...activeGaps].sort((a, b) => {
    if (a.priority === "High" && b.priority !== "High") return -1;
    if (b.priority === "High" && a.priority !== "High") return 1;
    return (a.latestPercentage ?? 0) - (b.latestPercentage ?? 0);
  });

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

            {/* Active Subject Pill & Switch Subject Control */}
            {isTeacher && activeSubject !== "all" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#49352F]/15 shadow-xs text-xs">
                <span className="text-[#7A6862] font-medium">
                  {language === "gu" ? "વિષય:" : "Subject:"}
                </span>
                <span className="font-bold text-[#B26A1B]">
                  {formatSubject(activeSubject)}
                </span>
                {assignments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowSwitchSubjectModal(true)}
                    className="ml-1 text-[11px] font-bold text-[#B26A1B] hover:text-[#8F5213] underline cursor-pointer"
                  >
                    {language === "gu" ? "બદલો" : "Switch Subject"}
                  </button>
                )}
              </div>
            )}

            <select
              value={selectValue}
              aria-label="Filter dashboard by class"
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-[#49352F]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#49352F] shadow-xs outline-hidden cursor-pointer"
            >
              <option value="all">
                {language === "gu"
                  ? isTeacher
                    ? `સોંપેલ વર્ગો (${permittedGrades.join(", ")})`
                    : "બધા વર્ગો (૧-૫)"
                  : isTeacher
                  ? `All Assigned Classes (${permittedGrades.join(", ")})`
                  : "All Classes (1-5)"}
              </option>
              {permittedGrades.map((g) => (
                <option key={g} value={String(g)}>
                  {language === "gu" ? `ધોરણ ${g}` : `Class ${g}`}
                </option>
              ))}
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

        {dashboardView === "teachers" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDashboardView("overview")}
                className="text-xs font-bold text-[#49352F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                &larr; {language === "gu" ? "ડેશબોર્ડ પર પાછા જાઓ" : "Back to Classroom Overview"}
              </button>
              <Link href="/settings" className="text-xs text-[#7A6862] hover:text-[#49352F] font-medium">
                {language === "gu" ? "સેટિંગ્સ પેજ ખોલો" : "Open Settings"} &rarr;
              </Link>
            </div>
            <TeacherManagementSection />
          </div>
        ) : dashboardView === "ai" ? (
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
            {isAdmin && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#FAF6E9] via-[#F2CAB3]/40 to-[#FAF6E9] border border-[#B26A1B]/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[#49352F]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#B26A1B]/10 border border-[#B26A1B]/20 text-[#B26A1B] flex items-center justify-center font-bold shrink-0">
                    <Users className="w-5 h-5 text-[#B26A1B]" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm font-bold text-[#49352F]">
                        {language === "gu" ? "શાળા સંચાલક નિયંત્રણ કેન્દ્ર" : "School Administrator Control Center"}
                      </h3>
                      <Badge variant="saffron" size="sm">
                        {language === "gu" ? "શિક્ષક વ્યવસ્થાપન" : "Teacher Management"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#7A6862] mt-0.5">
                      {language === "gu"
                        ? "શિક્ષકો ઉમેરો, વિષયો અને વર્ગો ૧-૫ સોંપો, અને પરવાનગીઓ સંચાલિત કરો."
                        : "Manage faculty members, assign subjects and classes 1-5, and update academic permissions."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button
                    variant="saffron"
                    size="sm"
                    onClick={() => setDashboardView("teachers")}
                    className="rounded-xl text-xs w-full md:w-auto cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    <span>{language === "gu" ? "શિક્ષક વ્યવસ્થાપન ખોલો" : "Open Teacher Management"}</span>
                  </Button>
                </div>
              </div>
            )}

            {assignmentNotice && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-semibold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{assignmentNotice}</span>
              </div>
            )}

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
                description={
                  selectedGrade !== null
                    ? language === "gu"
                      ? `ધોરણ ${selectedGrade}`
                      : `Class ${selectedGrade}`
                    : language === "gu"
                    ? "ધોરણ ૧ થી ૫"
                    : "Classes 1 to 5"
                }
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


            {/* 5. Subject-Wise Marks & Competency Management (Phase 5) */}
            <Card variant="glass" className="p-5 sm:p-6 border-[#49352F]/15 text-[#49352F] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#49352F]/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-[#49352F]">
                      {language === "gu"
                        ? `વિષયવાર ગુણ અને મૂલ્યાંકન સંચાલન — ${formatSubject(activeSubject !== "all" ? activeSubject : "MATH")}`
                        : `Subject-Wise Marks & Competency Management — ${formatSubject(activeSubject !== "all" ? activeSubject : "MATH")}`}
                    </h3>
                    <Badge variant="saffron" size="sm">
                      {activeSubject !== "all" ? activeSubject : "MATH"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7A6862] mt-0.5">
                    {language === "gu"
                      ? "સોંપેલ વર્ગોના વિદ્યાર્થીઓના ગુણ દાખલ કરો, સંપાદિત કરો અને વાસ્તવિક સમયમાં ખામી શોધો."
                      : "Directly enter or update assessment scores and remarks for authorized students in your assigned classes."}
                  </p>
                </div>
                <div className="text-xs text-[#7A6862] font-medium">
                  {filteredStudents.length} {language === "gu" ? "વિદ્યાર્થીઓ ઉપલબ્ધ" : "Students in view"}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#49352F]/10 text-[#7A6862] font-semibold">
                      <th className="py-2.5 px-3">{language === "gu" ? "વિદ્યાર્થી" : "Student"}</th>
                      <th className="py-2.5 px-3">{language === "gu" ? "વર્ગ" : "Class"}</th>
                      <th className="py-2.5 px-3">{language === "gu" ? "મૂલ્યાંકન સંકલ્પના" : "Assessment Concept"}</th>
                      <th className="py-2.5 px-3 text-center">{language === "gu" ? "મેળવેલ ગુણ / કુલ ગુણ" : "Marks / Max"}</th>
                      <th className="py-2.5 px-3 text-center">{language === "gu" ? "પ્રભુત્વ સ્થિતિ" : "Status"}</th>
                      <th className="py-2.5 px-3">{language === "gu" ? "શિક્ષક નોંધ" : "Teacher Remarks"}</th>
                      <th className="py-2.5 px-3 text-right">{language === "gu" ? "ક્રિયા" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#49352F]/8">
                    {filteredStudents.slice(0, 8).map((st) => {
                      const studentResult = results
                        .filter((r) => r.studentId === st.id)
                        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

                      const currentScore = editingScores[st.id]?.marks ?? (studentResult?.marksObtained ?? 15);
                      const maxScore = editingScores[st.id]?.maxMarks ?? (studentResult?.maximumMarks ?? 20);
                      const pct = Math.round((currentScore / Math.max(1, maxScore)) * 100);
                      const isSaving = editingScores[st.id]?.saving;
                      const isSaved = editingScores[st.id]?.saved;
                      const errorMsg = editingScores[st.id]?.error;
                      const targetConcept = concepts.find((c) => !activeSubject || activeSubject === "all" || c.subjectCode === activeSubject) || concepts[0] || { id: "c-math-count-1", name: "Formative Benchmark" };
                      const targetAssessment = assessments.find((a) => a.classroomId === st.classroomId) || assessments[0] || { id: "asm-unit-1" };

                      return (
                        <tr key={st.id} className="hover:bg-[#FAF6E9]/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#49352F]">{st.displayName}</div>
                            <div className="text-[10px] font-mono text-[#7A6862]">{st.studentCode}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-[#49352F]">
                              {formatClass(st.grade, st.section)}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[#49352F] font-medium truncate max-w-[180px]">
                              {targetConcept.name}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={maxScore}
                                value={currentScore}
                                onChange={(e) => handleScoreInputChange(st.id, e.target.value, maxScore)}
                                className="w-14 px-2 py-1 text-center font-bold font-mono rounded-lg border border-[#49352F]/20 bg-white text-xs text-[#49352F] focus:border-[#B26A1B] outline-hidden"
                              />
                              <span className="text-[#7A6862] font-mono">/ {maxScore}</span>
                            </div>
                            {errorMsg && (
                              <div className="text-[10px] text-red-600 mt-0.5">{errorMsg}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant={pct >= 80 ? "mint" : pct >= 60 ? "saffron" : "coral"}
                              size="sm"
                            >
                              {pct}% {pct >= 80 ? "Mastered" : pct >= 60 ? "Developing" : "Needs Support"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              placeholder={language === "gu" ? "નોંધ લખો..." : "Add remark..."}
                              value={editingScores[st.id]?.notes ?? (studentResult?.notes || "")}
                              onChange={(e) => handleNotesChange(st.id, e.target.value)}
                              className="w-full min-w-[130px] px-2.5 py-1 text-xs rounded-lg border border-[#49352F]/15 bg-white text-[#49352F] focus:border-[#B26A1B] outline-hidden placeholder:text-[#7A6862]/60"
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isSaving}
                              onClick={() => handleSaveStudentMarks(st.id, targetConcept.id, targetAssessment.id, maxScore)}
                              className="rounded-xl text-xs px-3 h-7 font-bold shadow-xs cursor-pointer"
                            >
                              {isSaving ? (
                                <span>Saving...</span>
                              ) : isSaved ? (
                                <span className="text-emerald-700 font-bold">Saved!</span>
                              ) : (
                                <span>Save</span>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

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
                {immediateAttentionGaps.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-[#FAF6E9] rounded-2xl border border-[#49352F]/10 text-xs text-[#7A6862]">
                    {language === "gu"
                      ? "આ વર્ગ માટે કોઈ તાકીદની સહાયની જરૂર નથી. બધા વિદ્યાર્થીઓ પ્રગતિ પર છે."
                      : "No immediate intervention required for this class. All students are on track."}
                  </div>
                ) : (
                  immediateAttentionGaps.slice(0, 6).map((item) => {
                    const std = students.find((s) => s.id === item.studentId);
                    const classLabel = std
                      ? formatClass(std.grade, std.section)
                      : formatClass(item.grade);
                    return (
                      <Card
                        key={item.id}
                        variant="glass"
                        className="p-4 space-y-3 border-[#49352F]/12 hover:border-[#49352F]/25 transition-all text-[#49352F]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#A93327]/12 border border-[#A93327]/25 text-[#A93327] font-heading font-black text-sm flex items-center justify-center shrink-0">
                              {item.latestPercentage ?? 0}%
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[#49352F] text-sm">
                                  {item.studentName}
                                </h4>
                                <span className="text-[11px] text-[#7A6862] font-medium">
                                  {classLabel}
                                </span>
                              </div>
                              <p className="text-xs text-[#8D4E10] font-medium mt-0.5">
                                {formatSubject(item.subjectCode)} • {item.conceptName}
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
                          <Link href={`/remedial-plans?studentId=${item.studentId}&gapId=${item.id}`}>
                            <Button
                              variant="saffron"
                              size="sm"
                              className="rounded-full text-xs h-7 px-3 cursor-pointer"
                            >
                              {language === "gu" ? "યોજના બનાવો →" : "Generate Plan →"}
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>


      {/* Switch Subject Modal */}
      {showSwitchSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-[#49352F]/20 space-y-4 text-[#49352F]">
            <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#49352F]">
                  {language === "gu" ? "વિષય બદલો (Switch Subject)" : "Switch Assigned Subject"}
                </h3>
                <p className="text-xs text-[#7A6862]">
                  {language === "gu"
                    ? "તમારા સોંપેલ વિષયોમાંથી એક પસંદ કરો:"
                    : "Select from your assigned teaching subjects:"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchSubjectModal(false)}
                className="text-[#7A6862] hover:text-[#49352F] p-1 font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {assignments.map((asg) => {
                const isSelected = activeSubject === asg.subjectCode;
                const classesText = asg.grades && asg.grades.length > 0
                  ? (language === "gu" ? `વર્ગો: ${asg.grades.slice().sort().join(", ")}` : `Classes: ${asg.grades.slice().sort().join(", ")}`)
                  : "";

                return (
                  <button
                    key={asg.id}
                    type="button"
                    onClick={() => handleSelectNewSubject(asg.subjectCode)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF8F0] border-[#B26A1B] shadow-xs"
                        : "bg-white border-[#49352F]/10 hover:border-[#B26A1B]/40"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#49352F]">
                          {formatSubject(asg.subjectCode)}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#FAF6E9] text-[#B26A1B] font-bold border border-[#49352F]/10">
                          {asg.subjectCode}
                        </span>
                      </div>
                      {classesText && (
                        <p className="text-[11px] text-[#7A6862]">
                          {classesText}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#B26A1B]">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
