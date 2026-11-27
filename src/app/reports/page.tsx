"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToDataUpdates } from "@/lib/events";
import {
  FileText,
  Printer,
  Download,
  Users,
  Award,
  Sparkles,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  BrainCircuit,
  BookOpen,
  Target,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  BookMarked,
  GraduationCap,
  TrendingUp,
  HeartHandshake,
  Gamepad2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function ReportsPage() {
  const { t, tr, language, formatSubject, formatPriority, formatStatus, formatClass, formatDate } = useLanguage();
  const rp = t.reports;

  // Top Mode Tabs: Reports System vs Intelligent Worksheet Generator vs History
  const [activeMainTab, setActiveMainTab] = useState<"reports" | "generator" | "history">("reports");

  // Report Controls (17 types)
  const [reportType, setReportType] = useState<string>("student");
  const [selectedStudentId, setSelectedStudentId] = useState("std-aarav");
  const [gradeFilter, setGradeFilter] = useState("4");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Loaded Data
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Worksheet Generator State
  const [wsGrade, setWsGrade] = useState(4);
  const [wsSubject, setWsSubject] = useState("MATH");
  const [wsType, setWsType] = useState("remedial");
  const [wsDifficulty, setWsDifficulty] = useState("Medium");
  const [wsQuestionCount, setWsQuestionCount] = useState(5);
  const [wsLanguage, setWsLanguage] = useState<"en" | "gu">(language === "gu" ? "gu" : "en");
  const [wsStudentId, setWsStudentId] = useState("std-aarav");
  const [wsIsAdaptive, setWsIsAdaptive] = useState(true);
  const [generatingWs, setGeneratingWs] = useState(false);
  const [currentWorksheet, setCurrentWorksheet] = useState<any>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [threeTierBundle, setThreeTierBundle] = useState<any>(null);

  // Worksheet History & Evaluation
  const [savedWorksheets, setSavedWorksheets] = useState<any[]>([]);
  const [evaluatingWs, setEvaluatingWs] = useState<any>(null);
  const [evalScores, setEvalScores] = useState<Record<number, number>>({});
  const [evalComments, setEvalComments] = useState("");

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [resReport, resWs] = await Promise.all([
        fetch(`/api/reports?type=${reportType}&studentId=${selectedStudentId}&grade=${gradeFilter}&_t=${Date.now()}`, {
          cache: "no-store",
        }),
        fetch(`/api/worksheets?_t=${Date.now()}`, { cache: "no-store" }),
      ]);

      const [dataReport, dataWs] = await Promise.all([resReport.json(), resWs.json()]);

      if (dataReport.success) {
        setReportsData(dataReport);
      }
      if (dataWs.success) {
        setSavedWorksheets(dataWs.worksheets || []);
      }
    } catch (e) {
      console.error("Failed to load report data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
    const unsubscribe = subscribeToDataUpdates(() => {
      loadReportData();
    });
    return () => unsubscribe();
  }, [reportType, selectedStudentId, gradeFilter]);

  const students = reportsData?.allStudents || [];
  const selectedStudent = reportsData?.selectedStudent || students[0];
  const metrics = reportsData?.metrics || {};
  const conceptBreakdown = reportsData?.conceptBreakdown || [];
  const subjectBreakdown = reportsData?.subjectBreakdown || [];
  const studentGaps = reportsData?.studentGaps || [];
  const studentPlans = reportsData?.studentPlans || [];
  const monthlyData = reportsData?.monthlyData || [];
  const weeklyData = reportsData?.weeklyData || { dailyBreakdown: [] };
  const termData = reportsData?.termData || {};
  const classMetrics = reportsData?.classMetrics || {};

  // Print & Export Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Student Name", "Student ID", "Class", "Concept / Subject", "Evaluations", "Initial %", "Latest %", "Delta (pp)", "Status"];
    const rows = conceptBreakdown.map((c: any) => [
      `"${selectedStudent?.displayName}"`,
      selectedStudent?.rollNumber || selectedStudent?.id,
      `Class ${selectedStudent?.grade}-${selectedStudent?.section || "A"}`,
      `"${c.conceptName} (${c.subjectCode})"`,
      c.evaluationsCount,
      c.initialScore,
      c.latestScore,
      c.deltaPercentagePoints !== null ? c.deltaPercentagePoints : "N/A",
      c.masteryStatus,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `studysaathi_${selectedStudent?.displayName?.replace(/\s+/g, "_") || "student"}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Worksheet Handler
  const handleGenerateWorksheet = async (isBundle = false) => {
    setGeneratingWs(true);
    setThreeTierBundle(null);
    try {
      const res = await fetch("/api/worksheets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: wsGrade,
          subjectCode: wsSubject,
          worksheetType: wsType,
          difficulty: wsDifficulty,
          questionCount: wsQuestionCount,
          language: wsLanguage,
          studentId: wsStudentId !== "class" ? wsStudentId : undefined,
          studentName: wsStudentId !== "class" ? students.find((s: any) => s.id === wsStudentId)?.displayName : "Class",
          isThreeTier: isBundle,
          studentPreviousScore: wsIsAdaptive && wsStudentId === "std-aarav" ? 35 : undefined,
          activeGapConceptId: wsIsAdaptive && wsStudentId === "std-aarav" ? "c-div-01" : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.isBundle) {
          setThreeTierBundle(data.bundle);
          setCurrentWorksheet(data.bundle.developingTier);
        } else {
          setCurrentWorksheet(data.worksheet);
        }
        // Refresh saved worksheets
        const resWs = await fetch(`/api/worksheets?_t=${Date.now()}`);
        const wsJson = await resWs.json();
        if (wsJson.success) setSavedWorksheets(wsJson.worksheets || []);
      }
    } catch (e) {
      console.error("Failed to generate worksheet", e);
    } finally {
      setGeneratingWs(false);
    }
  };

  // Submit Evaluation Handler
  const handleSaveEvaluation = async () => {
    if (!evaluatingWs) return;
    try {
      const res = await fetch("/api/worksheets/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheetId: evaluatingWs.id,
          studentId: evaluatingWs.targetStudentId || selectedStudentId,
          studentName: evaluatingWs.targetStudentName || selectedStudent?.displayName,
          scoresPerQuestion: evalScores,
          teacherComments: evalComments || "Evaluated with pedagogical accuracy.",
          timeSpentMinutes: 20,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEvaluatingWs(null);
        setEvalScores({});
        setEvalComments("");
        loadReportData();
      }
    } catch (e) {
      console.error("Failed to record evaluation", e);
    }
  };

  // Delete Worksheet Handler
  const handleDeleteWorksheet = async (id: string) => {
    try {
      await fetch(`/api/worksheets?id=${id}`, { method: "DELETE" });
      setSavedWorksheets((prev) => prev.filter((w) => w.id !== id));
      if (currentWorksheet?.id === id) setCurrentWorksheet(null);
    } catch (e) {
      console.error("Failed to delete worksheet", e);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header - Hidden on Print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight">
                {rp.pageHeading}
              </h1>
              <Badge variant="saffron" size="sm">
                {rp.a4PrintReady}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1">
              {rp.pageSubheading}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="rounded-full text-xs font-semibold border-[#49352F]/15 bg-white text-[#49352F]"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-[#B26A1B]" />
              <span>{rp.exportCsvBtn}</span>
            </Button>
            <Button
              variant="saffron"
              size="sm"
              onClick={handlePrint}
              className="rounded-full text-xs font-bold shadow-md"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>{rp.printReportBtn}</span>
            </Button>
          </div>
        </div>

        {/* Primary Main Tab Selector (Reports System vs Worksheet Generator vs History) */}
        <div className="flex items-center gap-2 border-b border-[#49352F]/15 pb-2 print:hidden">
          <button
            type="button"
            onClick={() => setActiveMainTab("reports")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "reports"
                ? "bg-[#49352F] text-[#FAF6E9] shadow-xs"
                : "bg-white text-[#7A6862] hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <FileText className="w-4 h-4 text-[#F2CAB3]" />
            <span>{rp.tabReports}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("generator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "generator"
                ? "bg-[#49352F] text-[#FAF6E9] shadow-xs"
                : "bg-white text-[#7A6862] hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-[#B26A1B]" />
            <span>{rp.tabGenerator}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "history"
                ? "bg-[#49352F] text-[#FAF6E9] shadow-xs"
                : "bg-white text-[#7A6862] hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <Clock className="w-4 h-4 text-[#2E7D5E]" />
            <span>{rp.tabHistory}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white">
              {savedWorksheets.length}
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: ACADEMIC REPORTS SYSTEM (17 REPORT TYPES)               */}
        {/* ============================================================== */}
        {activeMainTab === "reports" && (
          <div className="space-y-6">
            {/* Filter Bar for Reports */}
            <div className="p-4 rounded-2xl bg-white/95 border border-[#49352F]/12 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                {/* 17 Report Types Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#49352F]">
                    {rp.reportTypeLabel}
                  </span>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    aria-label="Select Academic Report Type"
                    className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-bold text-[#49352F] outline-hidden cursor-pointer"
                  >
                    <optgroup label={rp.groupIndividual}>
                      <option value="student">{rp.optStudent}</option>
                      <option value="parentSummary">{rp.optParentSummary}</option>
                    </optgroup>
                    <optgroup label={rp.groupClasswide}>
                      <option value="classGap">{rp.optClassGap}</option>
                      <option value="term">{rp.optTerm}</option>
                    </optgroup>
                  </select>
                </div>

                {/* Standard Chooser */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#7A6862]">{rp.stdFilterLabel}</span>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    aria-label="Filter report by standard"
                    className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-2.5 py-1.5 text-xs font-semibold text-[#49352F] cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={String(n)}>
                        {formatClass(n)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Chooser (if student-specific report) */}
                {!["classGap", "classPerformance"].includes(reportType) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#7A6862]">{rp.studentFilterLabel}</span>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      aria-label="Select student"
                      className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-bold text-[#49352F] cursor-pointer"
                    >
                      {students.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.displayName} ({formatClass(`Class ${s.grade}-${s.section || "A"}`)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================== */}
            {/* PRINT-READY A4 REPORT CANVAS                                   */}
            {/* ============================================================== */}
            <div data-tour="report-card" className="rounded-3xl border border-[#49352F]/12 bg-white text-[#49352F] p-8 sm:p-12 shadow-[0_12px_40px_rgba(73,53,47,0.08)] print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
              {/* Official Gujarat Primary Education Letterhead */}
              <div className="border-b-2 border-[#49352F]/30 pb-5 mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 flex items-center justify-center font-heading font-black text-2xl shadow-xs shrink-0">
                    શ
                  </div>
                  <div>
                    <h2 className="font-heading text-lg sm:text-xl font-black text-[#49352F] tracking-tight uppercase">
                      {rp.schoolTitle}
                    </h2>
                    <p className="text-xs text-[#7A6862] font-semibold mt-0.5">
                      {rp.deptSubtitle}
                    </p>
                    <p className="text-[11px] text-[#7A6862]/80">
                      {rp.schoolMeta}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md bg-[#49352F] text-white font-mono text-[10px] font-bold uppercase">
                    {reportType === "parentSummary"
                      ? rp.badgeParentSummary
                      : reportType === "classGap"
                      ? rp.badgeClassGap
                      : rp.badgeOfficialReport}
                  </span>
                  <div suppressHydrationWarning className="text-[11px] text-[#7A6862] mt-1.5 font-medium">
                    {rp.generatedLabel} {formatDate(new Date().toISOString())}
                  </div>
                </div>
              </div>

              {/* Dynamic Report Content based on reportType */}

              {/* REPORT 1: INDIVIDUAL STUDENT REPORT (Preserved & Upgraded) */}
              {reportType === "student" && (
                <div className="space-y-6">
                  {/* Student Metadata Box */}
                  <div className="bg-[#FAF6E9] p-4 rounded-2xl border border-[#49352F]/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                        {rp.studentNameHeading}
                      </span>
                      <span className="text-sm font-bold text-[#49352F]">{selectedStudent?.displayName}</span>
                    </div>
                    <div>
                      <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                        {rp.rollCodeHeading}
                      </span>
                      <span className="text-sm font-mono font-bold text-[#49352F]">{selectedStudent?.rollNumber}</span>
                    </div>
                    <div>
                      <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                        {rp.classSectionHeading}
                      </span>
                      <span className="text-sm font-bold text-[#49352F]">
                        {formatClass(`Class ${selectedStudent?.grade}-${selectedStudent?.section || "A"}`)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                        {rp.overallAvgHeading}
                      </span>
                      <span className="text-sm font-bold text-[#2E7D5E]">{metrics.averageScore || 0}%</span>
                    </div>
                  </div>

                  {/* Concept Mastery & Learning Bridge */}
                  <div className="space-y-3">
                    <h3 className="font-heading text-sm font-extrabold text-[#49352F] uppercase tracking-wider">
                      {rp.conceptMasteryBridge}
                    </h3>

                    <div className="space-y-3">
                      {conceptBreakdown.length === 0 ? (
                        <div className="p-5 text-center text-xs text-[#7A6862] bg-[#FAF6E9] rounded-2xl border border-[#49352F]/15">
                          {rp.noConceptEvals}
                        </div>
                      ) : (
                        conceptBreakdown.map((c: any) => (
                          <div key={c.conceptId} className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-[#49352F] text-sm">{c.conceptName}</span>
                                <span className="text-[#7A6862] ml-2">({formatSubject(c.subjectCode)})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[#49352F]">{c.latestScore}%</span>
                                <Badge
                                  variant={c.latestScore >= 80 ? "mastered" : c.latestScore >= 60 ? "developing" : "needsSupport"}
                                  size="sm"
                                >
                                  {formatStatus(c.masteryStatus)}
                                </Badge>
                              </div>
                            </div>
                            <BridgeProgress
                              score={c.latestScore}
                              previousScore={c.initialScore}
                              studentName={selectedStudent?.displayName}
                              height="sm"
                            />
                            <div className="flex items-center justify-between text-[11px] text-[#7A6862] border-t border-[#49352F]/10 pt-1.5">
                              <span>{rp.evaluationsLabel} {tr("reports.testsCountText", { count: c.evaluationsCount })}</span>
                              {c.deltaPercentagePoints !== null && (
                                <span className={`font-bold ${c.deltaPercentagePoints >= 0 ? "text-[#2E7D5E]" : "text-[#C54738]"}`}>
                                  {rp.deltaLabel} {c.deltaPercentagePoints > 0 ? "+" : ""}{c.deltaPercentagePoints} pp
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Prescribed 5-Step Remedial Actions */}
                  {studentPlans.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-heading text-sm font-extrabold text-[#49352F] uppercase tracking-wider">
                        {rp.prescribedActionsTitle}
                      </h3>
                      {studentPlans.map((p: any) => (
                        <div key={p.id} className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 text-xs space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#49352F] text-sm">{p.conceptName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#B26A1B]/15 text-[#B26A1B] font-bold text-[10px] border border-[#B26A1B]/20">
                              {formatStatus(p.status)}
                            </span>
                          </div>
                          <p className="text-[#49352F]">
                            <strong>{rp.pedagogicalObjectiveLabel}</strong> {p.learningObjective}
                          </p>
                          <p className="text-[#49352F]">
                            <strong>{rp.manipulativesUsedLabel}</strong> {p.requiredMaterials?.join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REPORT 2: COMPLETE STUDENT PORTFOLIO */}
              {reportType === "portfolio" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 text-center">
                      <span className="text-[10px] text-[#7A6862] uppercase font-bold block">{rp.totalTestsTaken}</span>
                      <span className="text-2xl font-extrabold text-[#49352F] mt-1 block">{metrics.totalAssessments || 0}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 text-center">
                      <span className="text-[10px] text-[#7A6862] uppercase font-bold block">{rp.questionAccuracy}</span>
                      <span className="text-2xl font-extrabold text-[#2E7D5E] mt-1 block">{metrics.accuracy || 0}%</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 text-center">
                      <span className="text-[10px] text-[#7A6862] uppercase font-bold block">{rp.activitiesCompleted}</span>
                      <span className="text-2xl font-extrabold text-[#B26A1B] mt-1 block">{metrics.activitiesCompleted || 0}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 text-center">
                      <span className="text-[10px] text-[#7A6862] uppercase font-bold block">{rp.totalXpEarned}</span>
                      <span className="text-2xl font-extrabold text-[#49352F] mt-1 block">{metrics.xpEarned || 0} XP</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#49352F]/15 p-4 shadow-2xs space-y-3">
                    <h4 className="font-heading text-sm font-bold text-[#49352F] uppercase">
                      {rp.longitudinalTrajectory}
                    </h4>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={conceptBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DEC9" />
                          <XAxis dataKey="conceptName" tick={{ fontSize: 10, fill: "#7A6862" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#7A6862" }} />
                          <Tooltip />
                          <Bar dataKey="initialScore" fill="#C9BDAF" name={rp.initialBaselineBar} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="latestScore" fill="#2E7D5E" name={rp.latestScoreBar} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT 3: SUBJECT-WISE PERFORMANCE REPORT */}
              {reportType === "subject" && (
                <div className="space-y-6">
                  <h3 className="font-heading text-base font-bold text-[#49352F]">
                    {rp.subjectWiseHeading}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectBreakdown.map((sb: any) => (
                      <div key={sb.subjectCode} className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#49352F]">{formatSubject(sb.subjectCode)} ({sb.subjectCode})</span>
                          <span className="text-lg font-black text-[#2E7D5E]">{sb.averageScore}%</span>
                        </div>
                        <div className="space-y-1 text-xs text-[#7A6862]">
                          <div className="flex justify-between">
                            <span>{rp.conceptsEvaluatedLabel}</span>
                            <span className="font-bold text-[#49352F]">{sb.conceptsTested}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{rp.masteredTopicsLabel}</span>
                            <span className="font-bold text-[#2E7D5E]">{sb.masteredCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{rp.requiringSupportLabel}</span>
                            <span className="font-bold text-[#C54738]">{sb.supportCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REPORT 8: TERM-WISE EVALUATION (Gujarat Board Scale) */}
              {reportType === "term" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#7A6862] font-bold uppercase">{termData.termName}</span>
                      <h3 className="text-xl font-black text-[#49352F]">{termData.letterGrade} ({termData.overallPercentage}%)</h3>
                    </div>
                    <Badge variant={termData.overallPercentage >= 60 ? "mastered" : "needsSupport"}>
                      {termData.promotionReadiness}
                    </Badge>
                  </div>

                  <div className="rounded-2xl border border-[#49352F]/15 overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF6E9] border-b border-[#49352F]/15 text-[#7A6862] uppercase text-[10px]">
                        <tr>
                          <th className="p-3">{rp.colSubject}</th>
                          <th className="p-3">{rp.colAveragePct}</th>
                          <th className="p-3">{rp.colGrade}</th>
                          <th className="p-3">{rp.colStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#49352F]/10">
                        {termData.subjectsGraded?.map((sg: any) => (
                          <tr key={sg.subjectCode} className="hover:bg-[#FAF6E9]/40">
                            <td className="p-3 font-bold text-[#49352F]">{formatSubject(sg.subjectCode)}</td>
                            <td className="p-3 font-semibold text-[#49352F]">{sg.averageScore}%</td>
                            <td className="p-3 font-bold text-[#B26A1B]">{sg.gradeLetter}</td>
                            <td className="p-3">
                              <Badge variant={sg.averageScore >= 80 ? "mastered" : sg.averageScore >= 60 ? "developing" : "needsSupport"} size="sm">
                                {formatStatus(sg.averageScore >= 80 ? "Mastered" : sg.averageScore >= 60 ? "Developing" : "Needs Support")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORT 14: CLASS GAP AUDIT (Preserved) */}
              {reportType === "classGap" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs text-[#7A6862] pb-2 border-b border-[#49352F]/15">
                    <span className="font-bold text-sm text-[#49352F]">
                      {tr("reports.classGapAuditSummary", {
                        cls: formatClass(gradeFilter, "A"),
                        count: classMetrics.totalGaps || 0,
                      })}
                    </span>
                    <span>{rp.thresholdScaleHint}</span>
                  </div>

                  <div className="rounded-2xl border border-[#49352F]/15 overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF6E9] border-b border-[#49352F]/15 text-[#7A6862] uppercase text-[10px]">
                        <tr>
                          <th className="p-3">{rp.colStudent}</th>
                          <th className="p-3">{rp.colSubject}</th>
                          <th className="p-3">{rp.colRoadblock}</th>
                          <th className="p-3">{rp.colLatestPct}</th>
                          <th className="p-3">{rp.colPriority}</th>
                          <th className="p-3">{rp.colStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#49352F]/10">
                        {classMetrics.gapsList?.map((g: any) => (
                          <tr key={g.id} className="hover:bg-[#FAF6E9]/40">
                            <td className="p-3 font-bold text-[#49352F]">{g.studentName}</td>
                            <td className="p-3 font-mono text-[#7A6862]">{formatSubject(g.subjectCode)}</td>
                            <td className="p-3 font-semibold text-[#49352F]">{g.conceptName}</td>
                            <td className="p-3 font-bold text-[#49352F]">{g.latestPercentage}%</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  g.priority === "High"
                                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                                    : "bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/20"
                                }`}
                              >
                                {formatPriority(g.priority)}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  g.status === "Resolved"
                                    ? "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20"
                                    : "bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/20"
                                }`}
                              >
                                {formatStatus(g.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORT 15: PARENT FRIENDLY SUMMARY (Preserved) */}
              {reportType === "parentSummary" && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F2DCB5]/50 to-[#F2CAB3]/40 border border-[#49352F]/15">
                    <h3 className="font-heading text-base font-bold text-[#49352F]">
                      {tr("reports.dearParents", { name: selectedStudent?.displayName || "" })}
                    </h3>
                    <p className="text-xs text-[#7A6862] mt-1 leading-relaxed">
                      {rp.parentSummaryIntro}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2 shadow-2xs">
                      <h4 className="font-bold text-[#2E7D5E] flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#2E7D5E]" />
                        <span>{rp.areasOfStrength}</span>
                      </h4>
                      <ul className="space-y-1.5 text-[#7A6862] ml-4 list-disc text-xs">
                        <li>{rp.strengthBullet1}</li>
                        <li>{rp.strengthBullet2}</li>
                        <li>{rp.strengthBullet3}</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2 shadow-2xs">
                      <h4 className="font-bold text-[#B26A1B] flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-4 h-4 text-[#B26A1B]" />
                        <span>{rp.conceptsPracticing}</span>
                      </h4>
                      {studentGaps.map((g: any) => (
                        <div key={g.id} className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                          <span className="font-bold text-[#49352F]">{g.conceptName}</span>
                          <p className="text-[11px] text-[#7A6862] mt-0.5">
                            {rp.focusDefaultDesc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 text-xs space-y-1.5 shadow-2xs">
                    <span className="font-bold text-[#49352F]">
                      {rp.recommendedHomeActs}
                    </span>
                    <p className="text-[#7A6862]">
                      {rp.homeAct1}
                    </p>
                    <p className="text-[#7A6862]">
                      {rp.homeAct2}
                    </p>
                  </div>
                </div>
              )}

              {/* REPORT 16: PTM REPORT */}
              {reportType === "ptm" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15">
                    <h4 className="font-bold text-sm text-[#49352F] flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-[#B26A1B]" />
                      <span>{rp.ptmTitle}</span>
                    </h4>
                    <p className="text-xs text-[#7A6862] mt-1">
                      {rp.ptmSubtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2">
                      <span className="font-bold text-[#49352F] uppercase block">{rp.teacherObservations}</span>
                      <p className="text-[#7A6862]">
                        {tr("reports.ptmObservationNote", { name: selectedStudent?.displayName || "" })}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2">
                      <span className="font-bold text-[#2E7D5E] uppercase block">{rp.agreedGoals}</span>
                      <p className="text-[#7A6862]">
                        {rp.ptmGoalsNote}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT 17: ATTENDANCE & LEARNING ACTIVITY REPORT */}
              {reportType === "attendanceActivity" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15">
                      <span className="text-[10px] text-[#7A6862] font-bold block">{rp.attendanceRate}</span>
                      <span className="text-2xl font-black text-[#2E7D5E] mt-1 block">94%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15">
                      <span className="text-[10px] text-[#7A6862] font-bold block">{rp.activitySessions}</span>
                      <span className="text-2xl font-black text-[#B26A1B] mt-1 block">{metrics.activitiesCompleted || 0}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15">
                      <span className="text-[10px] text-[#7A6862] font-bold block">{rp.worksheetsSubmitted}</span>
                      <span className="text-2xl font-black text-[#49352F] mt-1 block">{metrics.worksheetsCompleted || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Official Signatures Row (Preserved for All Printable Reports) */}
              <div className="mt-12 pt-6 border-t-2 border-[#49352F]/20 grid grid-cols-3 gap-6 text-xs text-[#7A6862]">
                <div>
                  <div className="h-10 border-b border-dashed border-[#49352F]/30" />
                  <span className="block mt-1.5 font-bold text-[#49352F]">
                    {rp.sigTeacher}
                  </span>
                  <span className="text-[10px] text-[#7A6862]">
                    {rp.sigTeacherName}
                  </span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-[#49352F]/30" />
                  <span className="block mt-1.5 font-bold text-[#49352F]">
                    {rp.sigPrincipal}
                  </span>
                  <span className="text-[10px] text-[#7A6862]">
                    {rp.sigPrincipalName}
                  </span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-[#49352F]/30" />
                  <span className="block mt-1.5 font-bold text-[#49352F]">
                    {rp.sigParent}
                  </span>
                  <span className="text-[10px] text-[#7A6862]">
                    {rp.sigDateBlank}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: INTELLIGENT AI WORKSHEET GENERATOR                      */}
        {/* ============================================================== */}
        {activeMainTab === "generator" && (
          <div className="space-y-6">
            {/* Generator Control Panel */}
            <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4 print:hidden">
              <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#B26A1B]" />
                  <h3 className="text-base font-extrabold text-[#49352F] font-heading">
                    {rp.wsGenHeading}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7A6862] font-semibold">{rp.adaptiveModeLabel}</span>
                  <button
                    type="button"
                    onClick={() => setWsIsAdaptive(!wsIsAdaptive)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      wsIsAdaptive ? "bg-[#2E7D5E] text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {wsIsAdaptive ? rp.adaptiveOn : rp.adaptiveOff}
                  </button>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Standard */}
                <div>
                  <label className="font-bold text-[#49352F] block mb-1">{rp.lblStdClass}</label>
                  <select
                    value={wsGrade}
                    onChange={(e) => setWsGrade(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2 font-semibold text-[#49352F]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                      <option key={g} value={g}>{formatClass(g)}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="font-bold text-[#49352F] block mb-1">{rp.lblSubject}</label>
                  <select
                    value={wsSubject}
                    onChange={(e) => setWsSubject(e.target.value)}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2 font-semibold text-[#49352F]"
                  >
                    <option value="MATH">{formatSubject("MATH")}</option>
                    <option value="ENG">{formatSubject("ENG")}</option>
                    <option value="GUJ">{formatSubject("GUJ")}</option>
                    <option value="EVS">{formatSubject("EVS")}</option>
                    <option value="SCI">{formatSubject("SCI")}</option>
                    <option value="SST">{formatSubject("SST")}</option>
                    <option value="HIN">{formatSubject("HIN")}</option>
                  </select>
                </div>

                {/* Worksheet Type (12 Types) */}
                <div>
                  <label className="font-bold text-[#49352F] block mb-1">{rp.lblWsType}</label>
                  <select
                    value={wsType}
                    onChange={(e) => setWsType(e.target.value)}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2 font-semibold text-[#49352F]"
                  >
                    <option value="practice">{rp.wsPractice}</option>
                    <option value="chapter">{rp.wsChapter}</option>
                    <option value="topic">{rp.wsTopic}</option>
                    <option value="revision">{rp.wsRevision}</option>
                    <option value="diagnostic">{rp.wsDiagnostic}</option>
                    <option value="remedial">{rp.wsRemedial}</option>
                    <option value="assessment">{rp.wsAssessment}</option>
                    <option value="challenge">{rp.wsChallenge}</option>
                    <option value="homework">{rp.wsHomework}</option>
                    <option value="mixed_practice">{rp.wsMixed}</option>
                    <option value="exam_prep">{rp.wsExamPrep}</option>
                    <option value="mastery">{rp.wsMastery}</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="font-bold text-[#49352F] block mb-1">{rp.lblDifficulty}</label>
                  <select
                    value={wsDifficulty}
                    onChange={(e) => setWsDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2 font-semibold text-[#49352F]"
                  >
                    <option value="Easy">{rp.diffEasy}</option>
                    <option value="Medium">{rp.diffMedium}</option>
                    <option value="Hard">{rp.diffHard}</option>
                    <option value="Mixed">{rp.diffMixed}</option>
                  </select>
                </div>

                {/* Target Student */}
                <div>
                  <label className="font-bold text-[#49352F] block mb-1">{rp.lblTargetStudent}</label>
                  <select
                    value={wsStudentId}
                    onChange={(e) => setWsStudentId(e.target.value)}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2 font-semibold text-[#49352F]"
                  >
                    <option value="class">{rp.entireClass}</option>
                    {students.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({formatClass(s.grade)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Count */}
                <div>
                  <label className="font-bold text-[#49352F] block mb-1">{rp.lblQuestionsCount}</label>
                  <select
                    value={wsQuestionCount}
                    onChange={(e) => setWsQuestionCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2 font-semibold text-[#49352F]"
                  >
                    {[3, 5, 8, 10].map((c) => (
                      <option key={c} value={c}>{tr("reports.questionsCountOption", { count: c })}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="font-bold text-[#49352F] block mb-1">{rp.lblLanguage}</label>
                  <select
                    value={wsLanguage}
                    onChange={(e) => setWsLanguage(e.target.value as any)}
                    className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2 font-semibold text-[#49352F]"
                  >
                    <option value="en">{rp.langEnglish}</option>
                    <option value="gu">{rp.langGujarati}</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2">
                  <Button
                    variant="saffron"
                    onClick={() => handleGenerateWorksheet(false)}
                    disabled={generatingWs}
                    className="w-full text-xs font-bold py-2 rounded-xl shadow-xs"
                  >
                    {generatingWs ? rp.generatingWs : rp.generateWorksheetBtn}
                  </Button>
                </div>
              </div>

              {/* 3-Tier Bundle Button */}
              <div className="pt-2 border-t border-[#49352F]/10 flex items-center justify-between">
                <span className="text-[11px] text-[#7A6862]">
                  {rp.bundleHint}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateWorksheet(true)}
                  disabled={generatingWs}
                  className="text-xs font-bold rounded-xl border-[#B26A1B] text-[#B26A1B]"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  <span>{rp.generateBundleBtn}</span>
                </Button>
              </div>
            </div>

            {/* Live Generated Worksheet Canvas (Printable A4) */}
            {currentWorksheet && (
              <div className="rounded-3xl border border-[#49352F]/15 bg-white p-8 sm:p-12 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                {/* Worksheet Header */}
                <div className="border-b-2 border-[#49352F] pb-4 flex items-start justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#49352F] uppercase">
                      {wsLanguage === "gu" ? currentWorksheet.schoolNameGujarati : currentWorksheet.schoolName}
                    </h2>
                    <h3 className="font-heading text-base font-extrabold text-[#B26A1B] mt-0.5">
                      {wsLanguage === "gu" ? currentWorksheet.titleGujarati : currentWorksheet.title}
                    </h3>
                    <p className="text-xs text-[#7A6862] mt-0.5">
                      {wsLanguage === "gu" ? currentWorksheet.chapterGujarati : currentWorksheet.chapter} •{" "}
                      {wsLanguage === "gu" ? currentWorksheet.topicGujarati : currentWorksheet.topic}
                    </p>
                  </div>

                  <div className="text-right text-xs text-[#7A6862]">
                    <span className="px-2.5 py-1 rounded-md bg-[#49352F] text-white font-mono text-[10px] font-bold block mb-1">
                      {tr("reports.tierBadge", { tier: currentWorksheet.difficulty })}
                    </span>
                    <span>{wsLanguage === "gu" ? "કુલ ગુણ:" : "Total Marks:"} <strong>{currentWorksheet.totalMarks}</strong></span>
                    <span className="block">{wsLanguage === "gu" ? "સમય:" : "Time:"} {currentWorksheet.estimatedMinutes} mins</span>
                  </div>
                </div>

                {/* Student Info Box */}
                <div className="p-3.5 rounded-xl border border-[#49352F]/20 grid grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <span>{wsLanguage === "gu" ? "વિદ્યાર્થીનું નામ:" : "Student Name:"}</span>{" "}
                    <strong>{currentWorksheet.targetStudentName || "____________________"}</strong>
                  </div>
                  <div>
                    <span>{wsLanguage === "gu" ? "ધોરણ / વિભાગ:" : "Class & Section:"}</span>{" "}
                    <strong>{formatClass(currentWorksheet.grade, currentWorksheet.section)}</strong>
                  </div>
                  <div>
                    <span>{wsLanguage === "gu" ? "તારીખ:" : "Date:"}</span>{" "}
                    <strong suppressHydrationWarning>{formatDate(new Date().toISOString())}</strong>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3 bg-[#FAF6E9] rounded-xl text-xs text-[#49352F] italic border-l-4 border-l-[#B26A1B]">
                  <strong>{wsLanguage === "gu" ? "સૂચનાઓ:" : "Instructions:"}</strong>{" "}
                  {wsLanguage === "gu" ? currentWorksheet.instructionsGujarati : currentWorksheet.instructions}
                </div>

                {/* Questions List */}
                <div className="space-y-6 pt-2">
                  {currentWorksheet.questions?.map((q: any) => (
                    <div key={q.id} className="space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-[#49352F] text-sm flex gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#FAF6E9] border border-[#49352F]/20 flex items-center justify-center text-xs shrink-0">
                            {q.questionNumber}
                          </span>
                          <span className="leading-snug">
                            {wsLanguage === "gu" ? q.questionTextGujarati : q.questionText}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF6E9] border border-[#49352F]/15 font-mono text-[10px] font-bold text-[#7A6862] shrink-0">
                          [{q.marks} {wsLanguage === "gu" ? "ગુણ" : "Marks"}]
                        </span>
                      </div>

                      {/* Visual / Diagram representation */}
                      {q.diagramOrVisual && (
                        <div className="ml-8 p-2.5 rounded-xl bg-[#FAF6E9]/60 border border-dashed border-[#49352F]/30 font-mono text-xs text-center text-[#49352F]">
                          {q.diagramOrVisual}
                        </div>
                      )}

                      {/* Options for MCQ */}
                      {q.options && q.options.length > 0 && (
                        <div className="ml-8 grid grid-cols-2 gap-2 pt-1">
                          {(wsLanguage === "gu" && q.optionsGujarati ? q.optionsGujarati : q.options).map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="p-2 rounded-lg border border-[#49352F]/15 bg-white text-xs flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-[#49352F]/40 flex items-center justify-center text-[10px] font-bold">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Workspace for Short Answer / Word Problem */}
                      {!q.options && (
                        <div className="ml-8 h-20 rounded-xl border border-dashed border-[#49352F]/20 bg-[#FAF6E9]/20 p-2 text-[10px] text-[#7A6862]/60 italic">
                          {wsLanguage === "gu" ? "ગણતરી અને જવાબ માટેની જગ્યા:" : "Workspace for calculations and answer:"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Teacher Answer Key Toggle & Box (Hidden on normal student print) */}
                <div className="pt-6 border-t-2 border-[#49352F]/20 space-y-4 print:hidden">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className="text-xs font-bold text-[#B26A1B] hover:text-[#49352F] flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4" />
                      <span>{showAnswerKey ? rp.hideAnswerKey : rp.viewAnswerKey}</span>
                      {showAnswerKey ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <Button
                      variant="saffron"
                      size="sm"
                      onClick={() => {
                        setEvaluatingWs(currentWorksheet);
                        const initialScores: Record<number, number> = {};
                        currentWorksheet.questions.forEach((q: any) => {
                          initialScores[q.questionNumber] = q.marks;
                        });
                        setEvalScores(initialScores);
                      }}
                      className="text-xs font-bold rounded-xl"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>{rp.evaluateRecordBtn}</span>
                    </Button>
                  </div>

                  {showAnswerKey && currentWorksheet.teacherAnswerKey && (
                    <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#B26A1B]/30 space-y-3 text-xs animate-in fade-in duration-200">
                      <div className="font-bold text-[#49352F] uppercase text-xs flex items-center justify-between">
                        <span>{wsLanguage === "gu" ? "સત્તાવાર શિક્ષક ઉત્તરાવલી અને પદ્ધતિ" : "Official Teacher Answer Key & Marking Criteria"}</span>
                        <span>{tr("reports.totalMarksBadge", { marks: currentWorksheet.teacherAnswerKey.totalMarks })}</span>
                      </div>
                      <div className="space-y-2.5">
                        {currentWorksheet.teacherAnswerKey.answers?.map((ans: any) => (
                          <div key={ans.questionNumber} className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 space-y-1">
                            <div className="flex justify-between font-bold text-[#49352F]">
                              <span>{tr("reports.qCorrectPrefix", { num: ans.questionNumber, answer: String(ans.correctAnswer) })}</span>
                              <span>{tr("reports.wsMarksTag", { marks: ans.marks })}</span>
                            </div>
                            <p className="text-[#7A6862] text-[11px]">
                              <strong>{rp.explanationLabel}</strong> {wsLanguage === "gu" ? ans.stepExplanationGujarati : ans.stepExplanation}
                            </p>
                            {ans.rubricCriteria && (
                              <p className="text-[10px] text-[#B26A1B] italic">{tr("reports.rubricPrefix", { text: ans.rubricCriteria })}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Printable Signature Row */}
                <div className="mt-8 pt-4 border-t border-[#49352F]/20 grid grid-cols-2 gap-8 text-xs text-[#7A6862]">
                  <div>
                    <div className="h-8 border-b border-dashed border-[#49352F]/30" />
                    <span className="block mt-1 font-bold text-[#49352F]">
                      {wsLanguage === "gu" ? "તપાસનાર શિક્ષકની સહી:" : "Evaluator Signature:"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="h-8 border-b border-dashed border-[#49352F]/30" />
                    <span className="block mt-1 font-bold text-[#49352F]">
                      {wsLanguage === "gu" ? "મેળવેલ ગુણ: ______ / " + currentWorksheet.totalMarks : "Marks Obtained: ______ / " + currentWorksheet.totalMarks}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: WORKSHEET HISTORY & EVALUATION TRACKER                  */}
        {/* ============================================================== */}
        {activeMainTab === "history" && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{rp.historyHeading}</CardTitle>
                <CardDescription>
                  {rp.historySub}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6E9] border-b border-[#49352F]/15 text-[#7A6862] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">{rp.colWsTitle}</th>
                    <th className="p-3">{rp.colGradeSubject}</th>
                    <th className="p-3">{rp.colType}</th>
                    <th className="p-3">{rp.colTargetStudent}</th>
                    <th className="p-3 text-center">{rp.colTotalMarks}</th>
                    <th className="p-3 text-center">{rp.colDate}</th>
                    <th className="p-3 text-right">{rp.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#49352F]/10">
                  {savedWorksheets.length > 0 ? (
                    savedWorksheets.map((ws: any) => (
                      <tr key={ws.id} className="hover:bg-[#FAF6E9]/40">
                        <td className="p-3 font-bold text-[#49352F]">
                          <div>{ws.title}</div>
                          <span className="text-[10px] text-[#7A6862]">{ws.chapter}</span>
                        </td>
                        <td className="p-3 font-semibold text-[#49352F]">
                          {formatClass(ws.grade)} • {formatSubject(ws.subjectCode)}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-[#FAF6E9] border border-[#49352F]/15 text-[10px] font-bold text-[#49352F] capitalize">
                            {ws.worksheetType}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[#B26A1B]">
                          {ws.targetStudentName || rp.classTargetFallback}
                        </td>
                        <td className="p-3 text-center font-bold text-[#49352F]">
                          {ws.totalMarks}
                        </td>
                        <td className="p-3 text-center text-[#7A6862] text-[11px]">
                          {formatDate(ws.createdAt)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setCurrentWorksheet(ws);
                                setActiveMainTab("generator");
                              }}
                              className="px-2 py-1 rounded-lg bg-[#FAF6E9] text-[#49352F] hover:bg-[#F2CAB3]/40 text-xs font-bold transition-colors"
                              title={rp.viewWsTitle}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEvaluatingWs(ws);
                                const initialScores: Record<number, number> = {};
                                ws.questions?.forEach((q: any) => {
                                  initialScores[q.questionNumber] = q.marks;
                                });
                                setEvalScores(initialScores);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#2E7D5E]/15 text-[#2E7D5E] hover:bg-[#2E7D5E]/25 text-xs font-bold transition-colors"
                              title={rp.evalStudentTitle}
                            >
                              <Award className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorksheet(ws.id)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              title={rp.deleteWsTitle}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-[#7A6862]">
                        {rp.noSavedWs}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Modal: Record Student Evaluation */}
        {evaluatingWs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-xl bg-white border border-[#49352F]/15 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-3">
                <h3 className="font-heading text-base font-bold text-[#49352F]">
                  {rp.evalModalTitle}
                </h3>
                <button
                  onClick={() => setEvaluatingWs(null)}
                  className="p-1.5 rounded-lg text-[#7A6862] hover:bg-[#FAF6E9]"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[#7A6862]">
                {tr("reports.evalMetaSummary", { title: evaluatingWs.title, student: evaluatingWs.targetStudentName || rp.evalStudentFallback })}
              </div>

              <div className="space-y-3 pt-2">
                {evaluatingWs.questions?.map((q: any) => (
                  <div key={q.id} className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-[#49352F]">Q{q.questionNumber}: {q.questionText}</span>
                      <p className="text-[11px] text-[#7A6862] mt-0.5">{tr("reports.evalCorrectPrefix", { answer: String(q.correctAnswer) })}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold text-[#7A6862]">{rp.evalMarksLabel}</span>
                      <input
                        type="number"
                        min="0"
                        max={q.marks}
                        value={evalScores[q.questionNumber] ?? q.marks}
                        onChange={(e) =>
                          setEvalScores({
                            ...evalScores,
                            [q.questionNumber]: Math.min(q.marks, Math.max(0, Number(e.target.value))),
                          })
                        }
                        className="w-14 rounded-lg border border-[#49352F]/20 bg-white p-1 text-center font-bold text-[#49352F]"
                      />
                      <span className="text-[#7A6862]">/ {q.marks}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-[#49352F] block mb-1">
                  {rp.evalCommentsLabel}
                </label>
                <textarea
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  placeholder={rp.evalCommentsPlaceholder}
                  className="w-full rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] p-2.5 text-xs text-[#49352F]"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#49352F]/10">
                <Button variant="outline" size="sm" onClick={() => setEvaluatingWs(null)}>
                  {rp.cancelBtn}
                </Button>
                <Button variant="saffron" size="sm" onClick={handleSaveEvaluation}>
                  {rp.saveEvalBtn}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
