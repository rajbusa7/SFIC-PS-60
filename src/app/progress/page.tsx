"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToDataUpdates } from "@/lib/events";
import { StudentProgressModal } from "@/components/progress/StudentProgressModal";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Filter,
  Printer,
  Download,
  Users,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  X,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ProgressTrackingPage() {
  const { t, language, formatSubject, formatClass } = useLanguage();
  const isGu = language === "gu";

  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);

  // Filters
  const [standardFilter, setStandardFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [masteryFilter, setMasteryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);

  // UI View state
  const [activeViewTab, setActiveViewTab] = useState<"ledger" | "students">("ledger");
  const [showAllKpis, setShowAllKpis] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any>(null);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/progress");
      const data = await res.json();
      if (data.success) {
        setProgressData(data);
      }
    } catch (e) {
      console.error("Failed to load progress data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    const unsubscribe = subscribeToDataUpdates(() => {
      fetchProgress();
    });
    return () => unsubscribe();
  }, []);

  const kpis = progressData?.kpis || {
    totalStudentsTracked: 0,
    studentsShowingGrowth: progressData?.improvingCount ?? 0,
    studentsShowingDecline: 0,
    studentsMaintaining: 0,
    studentsMastery: 0,
    studentsNeedingSupport: 0,
    totalAssessmentsCompleted: 0,
    totalActivitiesCompleted: 0,
    interventionsCompleted: progressData?.completedPlansCount ?? 0,
    activeInterventions: progressData?.activeGapsCount ?? 0,
    gapsResolved: progressData?.resolvedGapsCount ?? 0,
    overallClassAverage: 0,
    avgPercentagePointImprovement: 0,
    studentsWithoutRecentAssessments: 0,
  };

  // Filtered Concept Items for Ledger
  const filteredConceptItems = useMemo(() => {
    const items = progressData?.progressItems || [];
    return items.filter((item: any) => {
      // Standard filter
      if (standardFilter !== "all" && item.grade !== parseInt(standardFilter, 10)) {
        return false;
      }
      // Subject filter
      if (subjectFilter !== "all" && item.subjectCode !== subjectFilter) {
        return false;
      }
      // Mastery status filter
      if (masteryFilter !== "all") {
        const itemStatus = item.masteryStatus.toLowerCase().replace(/\s+/g, "");
        if (itemStatus !== masteryFilter.toLowerCase()) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesRoll = (item.rollNumber || "").toLowerCase().includes(q);
        const matchesConcept = item.conceptName.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesConcept) return false;
      }
      // KPI-driven click filter
      if (activeKpiFilter) {
        if (activeKpiFilter === "growth" && (item.deltaPercentagePoints ?? 0) <= 0) return false;
        if (activeKpiFilter === "decline" && (item.deltaPercentagePoints ?? 0) >= 0) return false;
        if (activeKpiFilter === "maintaining" && item.deltaPercentagePoints !== 0) return false;
        if (activeKpiFilter === "mastery" && item.latestPercentage < 80) return false;
        if (activeKpiFilter === "needsSupport" && item.latestPercentage >= 60) return false;
      }
      return true;
    });
  }, [progressData, standardFilter, subjectFilter, masteryFilter, searchQuery, activeKpiFilter]);

  // Filtered Student Records
  const filteredStudentRecords = useMemo(() => {
    const students = progressData?.studentRecords || [];
    return students.filter((s: any) => {
      // Standard filter
      if (standardFilter !== "all" && s.grade !== parseInt(standardFilter, 10)) {
        return false;
      }
      // Subject filter (must have evaluated this subject)
      if (subjectFilter !== "all") {
        const hasSubject = s.subjectBreakdown?.some((sb: any) => sb.subjectCode === subjectFilter);
        if (!hasSubject) return false;
      }
      // Mastery filter
      if (masteryFilter !== "all") {
        if (masteryFilter === "mastered" && (s.latestScore ?? 0) < 80) return false;
        if (masteryFilter === "developing" && ((s.latestScore ?? 0) < 60 || (s.latestScore ?? 0) >= 80)) return false;
        if (masteryFilter === "needssupport" && (s.latestScore ?? 0) >= 60) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.displayName.toLowerCase().includes(q);
        const matchesRoll = (s.rollNumber || "").toLowerCase().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }
      // KPI-driven filter
      if (activeKpiFilter) {
        if (activeKpiFilter === "growth" && (s.deltaPercentagePoints ?? 0) <= 0) return false;
        if (activeKpiFilter === "decline" && (s.deltaPercentagePoints ?? 0) >= 0) return false;
        if (activeKpiFilter === "maintaining" && (s.deltaPercentagePoints !== 0 || s.assessmentsAttempted < 2)) return false;
        if (activeKpiFilter === "mastery" && (s.latestScore ?? 0) < 80) return false;
        if (activeKpiFilter === "needsSupport" && (s.latestScore ?? 0) >= 60) return false;
        if (activeKpiFilter === "inactive" && s.assessmentsAttempted > 0 && (s.daysSinceLastAssessment ?? 0) <= 30) return false;
      }
      return true;
    });
  }, [progressData, standardFilter, subjectFilter, masteryFilter, searchQuery, activeKpiFilter]);

  // Chart data for Before-and-After
  const beforeAfterChartData = useMemo(() => {
    return filteredConceptItems
      .filter((i: any) => i.hasSufficientEvidence)
      .map((i: any) => ({
        name: `${i.studentName.split(" ")[0]} (${i.conceptName.split(" ")[0]})`,
        fullName: `${i.studentName} - ${i.conceptName}`,
        Baseline: i.initialPercentage,
        Latest: i.latestPercentage,
        delta: i.deltaPercentagePoints,
      }));
  }, [filteredConceptItems]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!filteredConceptItems || filteredConceptItems.length === 0) return;

    const headers = [
      "Student Name",
      "Student ID",
      "Class/Standard",
      "Subject",
      "Concept Name",
      "Evaluations Count",
      "Initial Score (%)",
      "Latest Score (%)",
      "Delta (pp)",
      "Relative Growth (%)",
      "Mastery Status",
      "Last Assessment Date",
    ];

    const rows = filteredConceptItems.map((item: any) => [
      `"${item.studentName}"`,
      `"${item.rollNumber}"`,
      `"Std ${item.grade}-${item.section}"`,
      `"${item.subjectCode}"`,
      `"${item.conceptName}"`,
      item.attemptsCount,
      item.initialPercentage,
      item.latestPercentage,
      item.deltaPercentagePoints !== null ? item.deltaPercentagePoints : "N/A",
      item.relativeGrowth !== null ? `${item.relativeGrowth}%` : "N/A",
      `"${item.masteryStatus}"`,
      item.lastAssessmentDate ? `"${item.lastAssessmentDate.split("T")[0]}"` : "N/A",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `StudySaathi_Progress_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header - Preserving exact heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#49352F] tracking-tight font-heading">
              {isGu ? "વર્ગ અધ્યયન પ્રગતિ અને પ્રભુત્વ પ્રવાહો" : "Class Learning Progress & Mastery Trends"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-0.5">
              {isGu
                ? "ઉપચારાત્મક હસ્તક્ષેપ પછી સાચા ટકાવારી-ગુણ (pp) ડેલ્ટા વૃદ્ધિનું માપન કરતું પ્રયોગમૂલક મૂલ્યાંકન."
                : "Empirical before-and-after evaluation measuring true percentage-point (pp) delta growth following remedial intervention."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handlePrint}
              aria-label="Print class progress report"
              className="px-3 py-2 rounded-xl border border-[#49352F]/15 bg-white text-[#49352F] hover:bg-[#FAF6E9] transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#7A6862]" />
              <span>{isGu ? "પ્રિન્ટ રિપોર્ટ (A4)" : "Print Report (A4)"}</span>
            </button>
            <button
              onClick={handleExportCSV}
              aria-label="Export progress data as CSV"
              className="px-3 py-2 rounded-xl bg-[#49352F] text-[#FAF6E9] hover:bg-[#382823] transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-[#F2CAB3]" />
              <span>{isGu ? "CSV એક્સપોર્ટ" : "Export CSV"}</span>
            </button>
          </div>
        </div>

        {/* Printable Header for A4 Printout only */}
        <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold text-black">
            {isGu ? "વર્ગ અધ્યયન પ્રગતિ અને પ્રભુત્વ પ્રવાહો રિપોર્ટ" : "StudySaathi AI - Academic Progress & Mastery Report"}
          </h1>
          <p className="text-sm text-gray-700">
            {isGu ? "ગુજરાત પ્રાથમિક શાળા શિક્ષણ પ્લેટફોર્મ" : "Gujarat Primary Education Board - Student Academic Analytics"}
          </p>
          <div className="text-xs text-gray-600 mt-2 flex gap-4">
            <span>Date: {new Date().toLocaleDateString("en-IN")}</span>
            <span>Total Students: {kpis.totalStudentsTracked}</span>
            <span>Class Average: {kpis.overallClassAverage}%</span>
          </div>
        </div>

        {/* Primary 4 KPI Cards - Preserved Design & Colors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card
            onClick={() => setActiveKpiFilter(activeKpiFilter === "growth" ? null : "growth")}
            className={`border-l-4 border-l-[#2E7D5E] cursor-pointer transition-all hover:shadow-md ${
              activeKpiFilter === "growth" ? "ring-2 ring-[#2E7D5E] bg-[#2E7D5E]/5" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2E7D5E]">
                {isGu ? "પ્રગતિ દર્શાવતા વિદ્યાર્થીઓ" : "Students Showing Growth"}
              </span>
              <TrendingUp className="w-4 h-4 text-[#2E7D5E]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2E7D5E] mt-1 font-heading">
              {kpis.studentsShowingGrowth} {isGu ? "વિદ્યાર્થીઓ" : "Students"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {isGu ? "સકારાત્મક ટકાવારી-ગુણ ફેરફાર" : "Positive percentage-point delta"}
            </span>
          </Card>

          <Card className="border-l-4 border-l-[#B26A1B]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B26A1B]">
                {isGu ? "પૂર્ણ થયેલ હસ્તક્ષેપ" : "Interventions Completed"}
              </span>
              <Award className="w-4 h-4 text-[#B26A1B]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#B26A1B] mt-1 font-heading">
              {kpis.interventionsCompleted} {isGu ? "યોજનાઓ" : "Plans"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {isGu ? "પ્રમાણિત મહાવરા સત્રો" : "Validated practice sessions"}
            </span>
          </Card>

          <Card
            onClick={() => setActiveKpiFilter(activeKpiFilter === "mastery" ? null : "mastery")}
            className={`border-l-4 border-l-[#F2CAB3] cursor-pointer transition-all hover:shadow-md ${
              activeKpiFilter === "mastery" ? "ring-2 ring-[#49352F] bg-[#FAF6E9]" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#49352F]">
                {isGu ? "ઉકેલાયેલી ખામીઓ" : "Gaps Resolved"}
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#49352F]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#49352F] mt-1 font-heading">
              {kpis.gapsResolved} {isGu ? "ખામીઓ" : "Gaps"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {isGu ? "≥૮૦% પ્રભુત્વ સિદ્ધ કર્યું" : "Met ≥80% mastery"}
            </span>
          </Card>

          <Card className="border-l-4 border-l-[#C54738]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C54738]">
                {isGu ? "સક્રિય હસ્તક્ષેપ" : "Active Interventions"}
              </span>
              <AlertCircle className="w-4 h-4 text-[#C54738]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#C54738] mt-1 font-heading">
              {kpis.activeInterventions} {isGu ? "ખામીઓ" : "Gaps"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {isGu ? "ચાલુ ઉપચાર મહાવરો" : "Ongoing remedial practice"}
            </span>
          </Card>
        </div>

        {/* Expandable 14 Calculated KPIs Ribbon */}
        <div className="bg-white rounded-2xl border border-[#49352F]/10 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#B26A1B]" />
              <span className="text-xs font-bold text-[#49352F] uppercase tracking-wider">
                {isGu ? "સમગ્ર ૧૪ શૈક્ષણિક પ્રદર્શન મેટ્રિક્સ" : "All 14 Academic Performance Metrics"}
              </span>
              {activeKpiFilter && (
                <span className="inline-flex items-center gap-1 bg-[#49352F] text-[#FAF6E9] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {isGu ? "ફિલ્ટર સક્રિય:" : "Active:"} {activeKpiFilter}
                  <button
                    onClick={() => setActiveKpiFilter(null)}
                    className="hover:text-red-300 ml-1"
                    title="Clear filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAllKpis(!showAllKpis)}
              className="text-xs font-semibold text-[#B26A1B] hover:text-[#49352F] flex items-center gap-1"
            >
              <span>{showAllKpis ? (isGu ? "સંકોચો" : "Collapse") : (isGu ? "વિસ્તૃત કરો" : "Expand All")}</span>
              {showAllKpis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showAllKpis && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 mt-3 border-t border-[#49352F]/10 animate-in fade-in duration-200">
              <div
                onClick={() => setActiveKpiFilter(null)}
                className="p-2.5 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10 cursor-pointer hover:bg-[#FAF6E9]"
              >
                <span className="text-[10px] text-[#7A6862] block font-medium">
                  {isGu ? "૧. કુલ ટ્રેક કરેલા વિદ્યાર્થીઓ" : "1. Total Tracked"}
                </span>
                <span className="text-lg font-extrabold text-[#49352F]">{kpis.totalStudentsTracked}</span>
              </div>

              <div
                onClick={() => setActiveKpiFilter(activeKpiFilter === "growth" ? null : "growth")}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  activeKpiFilter === "growth" ? "bg-[#2E7D5E]/15 border-[#2E7D5E]" : "bg-[#FAF6E9]/60 border-[#49352F]/10 hover:bg-[#FAF6E9]"
                }`}
              >
                <span className="text-[10px] text-[#2E7D5E] block font-medium">
                  {isGu ? "૨. વૃદ્ધિ દર્શાવતા" : "2. Showing Growth"}
                </span>
                <span className="text-lg font-extrabold text-[#2E7D5E]">{kpis.studentsShowingGrowth}</span>
              </div>

              <div
                onClick={() => setActiveKpiFilter(activeKpiFilter === "decline" ? null : "decline")}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  activeKpiFilter === "decline" ? "bg-[#C54738]/15 border-[#C54738]" : "bg-[#FAF6E9]/60 border-[#49352F]/10 hover:bg-[#FAF6E9]"
                }`}
              >
                <span className="text-[10px] text-[#C54738] block font-medium">
                  {isGu ? "૩. ઘટાડો દર્શાવતા" : "3. Showing Decline"}
                </span>
                <span className="text-lg font-extrabold text-[#C54738]">{kpis.studentsShowingDecline}</span>
              </div>

              <div
                onClick={() => setActiveKpiFilter(activeKpiFilter === "maintaining" ? null : "maintaining")}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  activeKpiFilter === "maintaining" ? "bg-[#7A6862]/15 border-[#7A6862]" : "bg-[#FAF6E9]/60 border-[#49352F]/10 hover:bg-[#FAF6E9]"
                }`}
              >
                <span className="text-[10px] text-[#7A6862] block font-medium">
                  {isGu ? "૪. સ્થિર પ્રદર્શન" : "4. Maintaining"}
                </span>
                <span className="text-lg font-extrabold text-[#7A6862]">{kpis.studentsMaintaining}</span>
              </div>

              <div
                onClick={() => setActiveKpiFilter(activeKpiFilter === "mastery" ? null : "mastery")}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  activeKpiFilter === "mastery" ? "bg-[#2E7D5E]/15 border-[#2E7D5E]" : "bg-[#FAF6E9]/60 border-[#49352F]/10 hover:bg-[#FAF6E9]"
                }`}
              >
                <span className="text-[10px] text-[#2E7D5E] block font-medium">
                  {isGu ? "૫. પ્રભુત્વ સિદ્ધ (≥૮૦%)" : "5. Mastery (≥80%)"}
                </span>
                <span className="text-lg font-extrabold text-[#2E7D5E]">{kpis.studentsMastery}</span>
              </div>

              <div
                onClick={() => setActiveKpiFilter(activeKpiFilter === "needsSupport" ? null : "needsSupport")}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  activeKpiFilter === "needsSupport" ? "bg-[#C54738]/15 border-[#C54738]" : "bg-[#FAF6E9]/60 border-[#49352F]/10 hover:bg-[#FAF6E9]"
                }`}
              >
                <span className="text-[10px] text-[#C54738] block font-medium">
                  {isGu ? "૬. સહાય જરૂરી (<૬૦%)" : "6. Needing Support"}
                </span>
                <span className="text-lg font-extrabold text-[#C54738]">{kpis.studentsNeedingSupport}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10">
                <span className="text-[10px] text-[#7A6862] block font-medium">
                  {isGu ? "૭. કુલ કસોટીઓ" : "7. Total Tests"}
                </span>
                <span className="text-lg font-extrabold text-[#49352F]">{kpis.totalAssessmentsCompleted}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10">
                <span className="text-[10px] text-[#7A6862] block font-medium">
                  {isGu ? "૮. અધ્યયન પ્રવૃત્તિઓ" : "8. Activities Done"}
                </span>
                <span className="text-lg font-extrabold text-[#B26A1B]">{kpis.totalActivitiesCompleted}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10">
                <span className="text-[10px] text-[#7A6862] block font-medium">
                  {isGu ? "૧૨. વર્ગ સરેરાશ સ્કોર" : "12. Class Average"}
                </span>
                <span className="text-lg font-extrabold text-[#49352F]">{kpis.overallClassAverage}%</span>
              </div>

              <div
                onClick={() => setActiveKpiFilter(activeKpiFilter === "inactive" ? null : "inactive")}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  activeKpiFilter === "inactive" ? "bg-[#B26A1B]/15 border-[#B26A1B]" : "bg-[#FAF6E9]/60 border-[#49352F]/10 hover:bg-[#FAF6E9]"
                }`}
              >
                <span className="text-[10px] text-[#B26A1B] block font-medium">
                  {isGu ? "૧૪. તાજેતરની કસોટી વિના" : "14. No Recent Test"}
                </span>
                <span className="text-lg font-extrabold text-[#B26A1B]">{kpis.studentsWithoutRecentAssessments}</span>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Faceted Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#49352F]/10 p-4 shadow-xs space-y-3 print:hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7A6862] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isGu ? "વિદ્યાર્થીનું નામ, ID અથવા સંકલ્પના શોધો..." : "Search student name, ID or concept..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#49352F]/15 bg-[#FAF6E9]/40 text-[#49352F] placeholder:text-[#7A6862]/60 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#49352F]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6862] hover:text-[#49352F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Standard Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#7A6862]">
                  {isGu ? "ધોરણ:" : "Std:"}
                </span>
                <select
                  value={standardFilter}
                  onChange={(e) => setStandardFilter(e.target.value)}
                  aria-label="Filter by standard"
                  className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-2.5 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
                >
                  <option value="all">{isGu ? "બધા ધોરણ (૧-૮)" : "All Standards"}</option>
                  <option value="1">Std 1</option>
                  <option value="2">Std 2</option>
                  <option value="3">Std 3</option>
                  <option value="4">Std 4</option>
                  <option value="5">Std 5</option>
                  <option value="6">Std 6</option>
                  <option value="7">Std 7</option>
                  <option value="8">Std 8</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#7A6862]">
                  {isGu ? "વિષય:" : "Subject:"}
                </span>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  aria-label="Filter by subject"
                  className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-2.5 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
                >
                  <option value="all">{isGu ? "બધા વિષયો" : "All Subjects"}</option>
                  <option value="MATH">{formatSubject("MATH")}</option>
                  <option value="ENG">{formatSubject("ENG")}</option>
                  <option value="GUJ">{formatSubject("GUJ")}</option>
                  <option value="EVS">{formatSubject("EVS")}</option>
                  <option value="SCI">{formatSubject("SCI")}</option>
                  <option value="SST">{formatSubject("SST")}</option>
                  <option value="HIN">{formatSubject("HIN")}</option>
                </select>
              </div>

              {/* Mastery Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#7A6862]">
                  {isGu ? "સ્થિતિ:" : "Status:"}
                </span>
                <select
                  value={masteryFilter}
                  onChange={(e) => setMasteryFilter(e.target.value)}
                  aria-label="Filter by mastery status"
                  className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-2.5 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
                >
                  <option value="all">{isGu ? "બધી સ્થિતિ" : "All Status"}</option>
                  <option value="mastered">{isGu ? "સિદ્ધ (≥૮૦%)" : "Mastered (≥80%)"}</option>
                  <option value="developing">{isGu ? "પ્રગતિ હેઠળ (૬૦-૭૯%)" : "Developing (60-79%)"}</option>
                  <option value="needsSupport">{isGu ? "સહાય જરૂરી (<૬૦%)" : "Needs Support (<60%)"}</option>
                </select>
              </div>

              {/* Reset Filters button */}
              {(standardFilter !== "all" || subjectFilter !== "all" || masteryFilter !== "all" || searchQuery || activeKpiFilter) && (
                <button
                  onClick={() => {
                    setStandardFilter("all");
                    setSubjectFilter("all");
                    setMasteryFilter("all");
                    setSearchQuery("");
                    setActiveKpiFilter(null);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-[#C54738] hover:bg-[#C54738]/10 rounded-xl transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isGu ? "રીસેટ" : "Reset"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actionable Teacher Alerts (if declining students or active gaps exist) */}
        {progressData?.teacherAlerts && progressData.teacherAlerts.length > 0 && (
          <div className="bg-[#FAF6E9] border border-[#C54738]/30 rounded-2xl p-4 shadow-xs print:hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#C54738]/15 text-[#C54738] shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#49352F] uppercase tracking-wider">
                    {isGu ? "શિક્ષક ચેતવણી અને તાત્કાલિક ધ્યાનાકર્ષક બાબતો" : "Teacher Actionable Alerts & Declining Trends"}
                  </h4>
                  <span className="text-[10px] text-[#7A6862] font-semibold">
                    {progressData.teacherAlerts.length} {isGu ? "ચેતવણીઓ" : "alerts"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {progressData.teacherAlerts.slice(0, 4).map((alert: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-[#49352F]/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-[#49352F] truncate">{alert.studentName}</div>
                        <p className="text-[11px] text-[#7A6862] line-clamp-1">{alert.message}</p>
                      </div>
                      <Link
                        href={`/students/${alert.studentId}`}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF6E9] text-[#B26A1B] hover:text-[#49352F] text-[11px] font-bold shrink-0 transition-colors"
                      >
                        {isGu ? "પગલાં લો" : "Review"}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Before and After Chart - Preserved with Fix for Blank Content Area */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                {isGu
                  ? "મૂળ આધાર વિરુદ્ધ તાજેતરનું પુનઃમૂલ્યાંકન સરખામણી"
                  : "Baseline vs. Latest Reassessment Comparison"}
              </CardTitle>
              <CardDescription>
                {isGu
                  ? "ઉપચાર કાર્ય પહેલા અને પછીના વિદ્યાર્થી ગુણ દર્શાવતી વાસ્તવિક સરખામણી. ડેલ્ટા ચોક્કસ ટકાવારી-ગુણ (pp) માં ગણવામાં આવે છે."
                  : "Empirical comparison showing student scores before and after remedial action. Delta is calculated in absolute percentage points (pp)."}
              </CardDescription>
            </div>
          </CardHeader>

          <div className="h-72 w-full pt-2">
            {beforeAfterChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beforeAfterChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DEC9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#7A6862" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#7A6862" }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val}%`, name]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]?.payload?.fullName) {
                        return payload[0].payload.fullName;
                      }
                      return label;
                    }}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid rgba(73,53,47,0.15)",
                      backgroundColor: "#FAF6E9",
                      color: "#49352F",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                  />
                  <Bar
                    dataKey="Baseline"
                    fill="#C9BDAF"
                    name={isGu ? "પ્રારંભિક આધાર સ્કોર" : "Initial Baseline Score"}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Latest"
                    fill="#2E7D5E"
                    name={isGu ? "ઉપચાર પછીનો સ્કોર" : "Post-Intervention Score"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#FAF6E9]/40 rounded-2xl border border-dashed border-[#49352F]/20">
                <BookOpen className="w-8 h-8 text-[#7A6862]/60 mb-2" />
                <h4 className="text-xs font-bold text-[#49352F]">
                  {isGu ? "પસંદ કરેલ ફિલ્ટર માટે કોઈ બહુ-મૂલ્યાંકન સરખામણી ઉપલબ્ધ નથી" : "No Before-and-After Comparisons Available for Current Filter"}
                </h4>
                <p className="text-[11px] text-[#7A6862] max-w-md mt-1">
                  {isGu
                    ? "આ ચાર્ટ એવા વિદ્યાર્થીઓને દર્શાવે છે જેમણે મૂળ આધાર કસોટી અને ઉપચાર પછીની પુનઃકસોટી બંને પૂર્ણ કરી છે. અન્ય વિષય અથવા 'બધા ધોરણ' પસંદ કરો."
                    : "This visualization displays students with both initial diagnostic baseline and post-remediation reassessment evaluations. Try switching to 'All Standards' or 'Mathematics'."}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* View Switcher: Concept-Level Mastery Ledger VS Student Records Table */}
        <div className="flex items-center justify-between border-b border-[#49352F]/15 pb-2 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewTab("ledger")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewTab === "ledger"
                  ? "bg-[#49352F] text-[#FAF6E9] shadow-xs"
                  : "bg-white text-[#7A6862] hover:text-[#49352F] border border-[#49352F]/10"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isGu ? "સંકલ્પના-સ્તર પ્રભુત્વ ખાતાવહી" : "Concept-Level Mastery Ledger"}</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                {filteredConceptItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveViewTab("students")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeViewTab === "students"
                  ? "bg-[#49352F] text-[#FAF6E9] shadow-xs"
                  : "bg-white text-[#7A6862] hover:text-[#49352F] border border-[#49352F]/10"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isGu ? "વિદ્યાર્થી પ્રદર્શન પત્રક" : "Student Performance Records"}</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                {filteredStudentRecords.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-[#7A6862]">
            {isGu ? "કુલ નોંધણી:" : "Showing:"}{" "}
            {activeViewTab === "ledger" ? filteredConceptItems.length : filteredStudentRecords.length}{" "}
            {isGu ? "રેકોર્ડ" : "records"}
          </span>
        </div>

        {/* TAB 1: Detailed Concept Growth Table - Preserving Exact Structure and Fixing Aarav Patel Test Count */}
        {activeViewTab === "ledger" && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>
                  {isGu ? "સંકલ્પના-સ્તર પ્રભુત્વ ખાતાવહી" : "Concept-Level Mastery Ledger"}
                </CardTitle>
                <CardDescription>
                  {isGu
                    ? "મૂળ સ્કોર, પુનઃમૂલ્યાંકન અને ગણતરી કરેલ ટકાવારી-ગુણ ડેલ્ટાની વિગતવાર નોંધણી"
                    : "Detailed audit trail of baseline score, reassessment, and calculated percentage-point delta"}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6E9] border-b border-[#49352F]/10 text-[#7A6862] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">{isGu ? "વિદ્યાર્થી" : "Student"}</th>
                    <th className="p-3">{isGu ? "વિષય અને સંકલ્પના" : "Subject & Concept"}</th>
                    <th className="p-3">{isGu ? "મૂલ્યાંકનો" : "Evaluations"}</th>
                    <th className="p-3">{isGu ? "પ્રારંભિક સ્કોર" : "Initial Score"}</th>
                    <th className="p-3">{isGu ? "તાજેતરનો સ્કોર" : "Latest Score"}</th>
                    <th className="p-3">{isGu ? "ફેરફાર (ગુણ)" : "Change (pp)"}</th>
                    <th className="p-3">{isGu ? "પ્રભુત્વ સ્થિતિ" : "Mastery Status"}</th>
                    <th className="p-3 text-right">{isGu ? "વિગતવાર જુઓ" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#49352F]/10">
                  {filteredConceptItems.length > 0 ? (
                    filteredConceptItems.map((item: any, i: number) => {
                      const isMastered = item.latestPercentage >= 80;

                      return (
                        <tr key={i} className="hover:bg-[#FAF6E9]/50 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-[#49352F]">{item.studentName}</div>
                            <div className="text-[10px] text-[#7A6862]">
                              {formatClass(`Class ${item.grade}-${item.section}`)} • {item.rollNumber}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-[#49352F]">{item.conceptName}</div>
                            <span className="text-[10px] text-[#7A6862] font-mono">
                              {formatSubject(item.subjectCode)} • {item.chapter}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-[#49352F]">
                            {/* Strictly displays exact count of evaluated results */}
                            {item.attemptsCount} {isGu ? "કસોટી(ઓ)" : "test(s)"}
                          </td>
                          <td className="p-3 font-medium text-[#7A6862]">
                            {item.hasSufficientEvidence ? `${item.initialPercentage}%` : "—"}
                          </td>
                          <td className="p-3 font-bold text-[#49352F]">{item.latestPercentage}%</td>
                          <td className="p-3">
                            {item.hasSufficientEvidence ? (
                              <div className="flex flex-col">
                                <span
                                  className={`font-bold ${
                                    item.deltaPercentagePoints > 0
                                      ? "text-[#2E7D5E]"
                                      : item.deltaPercentagePoints < 0
                                      ? "text-[#C54738]"
                                      : "text-[#7A6862]"
                                  }`}
                                >
                                  {item.deltaPercentagePoints > 0 ? `+${item.deltaPercentagePoints}` : item.deltaPercentagePoints} pp
                                </span>
                                {item.relativeGrowth !== null && (
                                  <span className="text-[9px] text-[#7A6862]">
                                    ({item.relativeGrowth > 0 ? "+" : ""}{item.relativeGrowth}%)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#7A6862] italic">
                                {isGu ? "એક જ અવલોકન" : "Single Observation"}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                isMastered
                                  ? "mastered"
                                  : item.latestPercentage >= 60
                                  ? "developing"
                                  : "needsSupport"
                              }
                              size="sm"
                            >
                              {isMastered
                                ? isGu ? "સિદ્ધ" : "Mastered"
                                : item.latestPercentage >= 60
                                ? isGu ? "પ્રગતિ હેઠળ" : "Developing"
                                : isGu ? "સહાય જરૂરી" : "Needs Support"}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                const matchedStudent = (progressData?.studentRecords || []).find(
                                  (s: any) => s.id === item.studentId
                                );
                                if (matchedStudent) {
                                  setSelectedStudentForModal(matchedStudent);
                                }
                              }}
                              className="font-bold text-[#B26A1B] hover:text-[#49352F] inline-flex items-center gap-1 bg-[#FAF6E9] px-2.5 py-1 rounded-lg border border-[#49352F]/10 text-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isGu ? "જુઓ" : "View"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-[#7A6862]">
                        {isGu ? "કોઈ મેળ ખાતા સંકલ્પના રેકોર્ડ મળ્યા નથી" : "No concept records found matching your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: Student Performance Records Table */}
        {activeViewTab === "students" && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>
                  {isGu ? "વિદ્યાર્થી પ્રદર્શન અને પ્રગતિ પત્રક" : "Student Performance & Academic Mastery"}
                </CardTitle>
                <CardDescription>
                  {isGu
                    ? "વિદ્યાર્થી વાઇઝ સરેરાશ સ્કોર, ડેલ્ટા પ્રવાહ, પ્રવૃત્તિ પૂર્ણતા અને શિક્ષક ભલામણો"
                    : "Comprehensive student-level audit measuring average score, overall delta trend, activities, and individual remediation."}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6E9] border-b border-[#49352F]/10 text-[#7A6862] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">{isGu ? "વિદ્યાર્થી" : "Student"}</th>
                    <th className="p-3">{isGu ? "ધોરણ / વર્ગ" : "Standard / Section"}</th>
                    <th className="p-3 text-center">{isGu ? "કસોટીઓ" : "Assessments"}</th>
                    <th className="p-3 text-center">{isGu ? "પ્રવૃત્તિઓ" : "Activities"}</th>
                    <th className="p-3 text-center">{isGu ? "પ્રારંભિક" : "Initial"}</th>
                    <th className="p-3 text-center">{isGu ? "તાજેતરનો" : "Latest"}</th>
                    <th className="p-3 text-center">{isGu ? "પ્રગતિ ડેલ્ટા" : "Delta (pp)"}</th>
                    <th className="p-3 text-center">{isGu ? "ચોકસાઈ" : "Accuracy"}</th>
                    <th className="p-3">{isGu ? "પ્રભુત્વ સ્થિતિ" : "Status"}</th>
                    <th className="p-3 text-right">{isGu ? "ક્રિયા" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#49352F]/10">
                  {filteredStudentRecords.length > 0 ? (
                    filteredStudentRecords.map((s: any) => {
                      const isMastered = (s.latestScore ?? 0) >= 80;

                      return (
                        <tr key={s.id} className="hover:bg-[#FAF6E9]/50 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-[#49352F]">{s.displayName}</div>
                            <span className="text-[10px] text-[#7A6862] font-mono">
                              {s.rollNumber}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-[#49352F]">
                              {formatClass(`Class ${s.grade}-${s.section}`)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-[#49352F]">
                            {s.assessmentsAttempted}
                          </td>
                          <td className="p-3 text-center text-[#B26A1B] font-semibold">
                            {s.activitiesCompleted} {isGu ? "પૂર્ણ" : "done"}
                          </td>
                          <td className="p-3 text-center text-[#7A6862]">
                            {s.initialScore !== null ? `${s.initialScore}%` : "—"}
                          </td>
                          <td className="p-3 text-center font-bold text-[#49352F]">
                            {s.latestScore !== null ? `${s.latestScore}%` : "—"}
                          </td>
                          <td className="p-3 text-center">
                            {s.deltaPercentagePoints !== null ? (
                              <span
                                className={`font-bold ${
                                  s.deltaPercentagePoints > 0
                                    ? "text-[#2E7D5E]"
                                    : s.deltaPercentagePoints < 0
                                    ? "text-[#C54738]"
                                    : "text-[#7A6862]"
                                }`}
                              >
                                {s.deltaPercentagePoints > 0 ? `+${s.deltaPercentagePoints}` : s.deltaPercentagePoints} pp
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#7A6862] italic">
                                {s.assessmentsAttempted === 1 ? (isGu ? "૧ કસોટી" : "1 test") : "—"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-semibold text-[#49352F]">
                            {s.assessmentsAttempted > 0 ? `${s.accuracy}%` : "—"}
                          </td>
                          <td className="p-3">
                            {s.assessmentsAttempted > 0 ? (
                              <Badge
                                variant={
                                  isMastered
                                    ? "mastered"
                                    : (s.latestScore ?? 0) >= 60
                                    ? "developing"
                                    : "needsSupport"
                                }
                                size="sm"
                              >
                                {isMastered
                                  ? isGu ? "સિદ્ધ" : "Mastered"
                                  : (s.latestScore ?? 0) >= 60
                                  ? isGu ? "પ્રગતિ હેઠળ" : "Developing"
                                  : isGu ? "સહાય જરૂરી" : "Needs Support"}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-[#7A6862] italic">
                                {isGu ? "બાકી" : "Pending"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedStudentForModal(s)}
                              className="font-bold text-[#B26A1B] hover:text-[#49352F] inline-flex items-center gap-1 bg-[#FAF6E9] px-2.5 py-1 rounded-lg border border-[#49352F]/10 text-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isGu ? "પ્રોફાઇલ" : "Details"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-xs text-[#7A6862]">
                        {isGu ? "કોઈ મેળ ખાતા વિદ્યાર્થીઓ મળ્યા નથી" : "No students found matching your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Detailed Student Progress Modal */}
        {selectedStudentForModal && (
          <StudentProgressModal
            student={selectedStudentForModal}
            onClose={() => setSelectedStudentForModal(null)}
            language={language}
            formatSubject={formatSubject}
            formatClass={formatClass}
          />
        )}
      </div>
    </AppLayout>
  );
}
