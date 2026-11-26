"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { useAuth } from "@/context/AuthContext";
import { broadcastDataUpdate } from "@/lib/events";
import {
  Sparkles,
  GraduationCap,
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  Bot,
  Send,
  Printer,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lightbulb,
  Clock,
  Package,
  Info,
  MessageSquare,
} from "lucide-react";

export type AiTab = "tutor" | "analyzer" | "remedial" | "worksheet" | "assistant";

interface AiWorkspaceViewProps {
  defaultTab?: AiTab;
  embedded?: boolean;
}

export function AiWorkspaceView({ defaultTab = "tutor", embedded = false }: AiWorkspaceViewProps) {
  const searchParams = useSearchParams();
  const { t, tr, language, formatSubject, formatClass, formatStatus, formatPriority } = useLanguage();
  const ai = t.ai;
  const { user, role } = useAuth();

  const queryTab = (searchParams?.get("tab") as AiTab) || defaultTab;
  const [activeTab, setActiveTab] = useState<AiTab>(queryTab);

  useEffect(() => {
    if (searchParams?.get("tab")) {
      setActiveTab(searchParams.get("tab") as AiTab);
    }
  }, [searchParams]);

  // Global students & concepts cache from DB
  const [students, setStudents] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status of AI provider
  const [aiStatus, setAiStatus] = useState<{
    checked: boolean;
    provider: string;
    model: string;
    isLive: boolean;
  }>({
    checked: false,
    provider: "checking...",
    model: "",
    isLive: false,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [resStd, resAsm, resGaps] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/assessments"),
          fetch("/api/learning-gaps"),
        ]);
        const [dataStd, dataAsm, dataGaps] = await Promise.all([
          resStd.json(),
          resAsm.json(),
          resGaps.json(),
        ]);
        if (dataStd.success) setStudents(dataStd.students || []);
        if (dataAsm.success) setConcepts(dataAsm.concepts || []);
        if (dataGaps.success) setGaps(dataGaps.gaps || []);
      } catch (e) {
        console.error("Failed to load initial workspace data", e);
      }
    }
    loadData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // -------------------------------------------------------------
  // TAB 1: AI TUTOR STATE
  // -------------------------------------------------------------
  const [tutorQuery, setTutorQuery] = useState(ai.tutorChip1);
  const [tutorGrade, setTutorGrade] = useState<number>(4);
  const [tutorSubject, setTutorSubject] = useState("Mathematics");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<any>(null);
  const [tutorMeta, setTutorMeta] = useState<any>(null);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});

  const handleTutorSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || tutorQuery;
    if (!q.trim()) return;

    setTutorLoading(true);
    setTutorError(null);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          grade: tutorGrade,
          subject: tutorSubject,
          language,
        }),
      });
      const data = await res.json();
      if (data.success && data.tutorResponse) {
        setTutorResponse(data.tutorResponse);
        setTutorMeta({
          isAiGenerated: data.isAiGenerated,
          provider: data.provider,
          modelUsed: data.modelUsed,
          note: data.note,
        });
        setAiStatus({
          checked: true,
          provider: data.provider,
          model: data.modelUsed,
          isLive: data.isAiGenerated,
        });
      } else {
        setTutorError(data.error || ai.errTutorGen);
      }
    } catch {
      setTutorError(ai.errTutorNet);
    } finally {
      setTutorLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: AI LEARNING-GAP ANALYZER STATE
  // -------------------------------------------------------------
  const [selectedStudentId, setSelectedStudentId] = useState<string>("std-aarav");
  const [analyzerConcept, setAnalyzerConcept] = useState<string>("Division Basics & Equal Sharing");
  const [analyzerSubject, setAnalyzerSubject] = useState<string>("MATH");
  const [analyzerClass, setAnalyzerClass] = useState<number>(4);
  const [marksObtained, setMarksObtained] = useState<number>(7);
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [teacherObs, setTeacherObs] = useState<string>(
    "Student counts on fingers correctly but struggles when dividing items into 3 or 4 equal groups. Forgets multiplication tables 3 and 4."
  );
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);

  const handleStudentSelect = (stdId: string) => {
    setSelectedStudentId(stdId);
    const student = students.find((s) => s.id === stdId);
    if (student) {
      setAnalyzerClass(student.grade);
      const studentGap = gaps.find((g) => g.studentId === stdId);
      if (studentGap) {
        setAnalyzerConcept(studentGap.conceptName);
        setAnalyzerSubject(studentGap.subjectCode || "MATH");
        setMarksObtained(Math.round((studentGap.latestPercentage / 100) * 20));
      }
    }
  };

  const handleAnalyzeGap = async () => {
    setAnalyzerLoading(true);
    setAnalyzerError(null);
    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const res = await fetch("/api/ai/gap-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          studentName: student?.displayName || ai.defaultStudentLabel,
          studentClass: analyzerClass,
          subject: analyzerSubject,
          conceptName: analyzerConcept,
          marksObtained,
          maximumMarks: maxMarks,
          teacherObservations: teacherObs,
          language,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalyzerResult(data.analysis);
        setAiStatus({
          checked: true,
          provider: data.analysis.provider,
          model: data.analysis.modelUsed,
          isLive: data.analysis.isAiGenerated,
        });
      } else {
        setAnalyzerError(data.error || ai.errGapGen);
      }
    } catch {
      setAnalyzerError(ai.errGapNet);
    } finally {
      setAnalyzerLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: AI REMEDIAL PLAN GENERATOR STATE
  // -------------------------------------------------------------
  const [remStudentId, setRemStudentId] = useState<string>("std-aarav");
  const [remConceptId, setRemConceptId] = useState<string>("c-div-01");
  const [remConceptName, setRemConceptName] = useState<string>("Division Basics & Equal Sharing");
  const [remSubject, setRemSubject] = useState<string>("MATH");
  const [remLatestScore, setRemLatestScore] = useState<number>(35);
  const [remGapReason, setRemGapReason] = useState<string>(
    "Underperforms on division equal sharing; needs concrete token manipulation."
  );
  const [remLoading, setRemLoading] = useState(false);
  const [remPlan, setRemPlan] = useState<any>(null);
  const [remMeta, setRemMeta] = useState<any>(null);
  const [remError, setRemError] = useState<string | null>(null);
  const [remSaveStatus, setRemSaveStatus] = useState<string | null>(null);

  const handleRemStudentSelect = (stdId: string) => {
    setRemStudentId(stdId);
    const studentGap = gaps.find((g) => g.studentId === stdId);
    if (studentGap) {
      setRemConceptId(studentGap.conceptId);
      setRemConceptName(studentGap.conceptName);
      setRemSubject(studentGap.subjectCode || "MATH");
      setRemLatestScore(studentGap.latestPercentage);
      setRemGapReason(studentGap.reason);
    }
  };

  const handleGenerateRemedialPlan = async () => {
    setRemLoading(true);
    setRemError(null);
    setRemSaveStatus(null);
    try {
      const student = students.find((s) => s.id === remStudentId);
      const res = await fetch("/api/ai/remedial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: remStudentId,
          studentName: student?.displayName || ai.defaultStudentLabel,
          conceptId: remConceptId,
          conceptName: remConceptName,
          subjectCode: remSubject,
          grade: student?.grade || 4,
          latestPercentage: remLatestScore,
          gapReason: remGapReason,
          language,
        }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setRemPlan(data.plan);
        setRemMeta({
          isAiGenerated: data.isAiGenerated,
          provider: data.provider,
          modelUsed: data.modelUsed,
          note: data.note,
          rawGenerated: data.rawGenerated,
        });
      } else {
        setRemError(data.error || ai.errRemGen);
      }
    } catch {
      setRemError(ai.errRemNet);
    } finally {
      setRemLoading(false);
    }
  };

  const handleSavePlanToDb = async () => {
    if (!remPlan) return;
    setRemSaveStatus("saving");
    try {
      const res = await fetch("/api/remedial-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: remPlan }),
      });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("plans", "create", data.plan?.id);
        broadcastDataUpdate("gaps", "update");
        setRemSaveStatus("saved");
        setTimeout(() => setRemSaveStatus(null), 4000);
      } else {
        setRemSaveStatus("error");
      }
    } catch {
      setRemSaveStatus("error");
    }
  };

  // -------------------------------------------------------------
  // TAB 4: AI WORKSHEET GENERATOR STATE
  // -------------------------------------------------------------
  const [wsGrade, setWsGrade] = useState<number>(4);
  const [wsSubject, setWsSubject] = useState<string>("MATH");
  const [wsConcept, setWsConcept] = useState<string>("Division Basics & Equal Sharing");
  const [wsDifficulty, setWsDifficulty] = useState<"Easy" | "Medium" | "Challenging">("Medium");
  const [wsCount, setWsCount] = useState<number>(5);
  const [wsType, setWsType] = useState<string>("mixed");
  const [wsPersonalize, setWsPersonalize] = useState<boolean>(true);
  const [wsPersonalStudentId, setWsPersonalStudentId] = useState<string>("std-aarav");
  const [wsLoading, setWsLoading] = useState(false);
  const [wsResult, setWsResult] = useState<any>(null);
  const [wsMeta, setWsMeta] = useState<any>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [showAnswerKeys, setShowAnswerKeys] = useState(false);

  const handleGenerateWorksheet = async () => {
    setWsLoading(true);
    setWsError(null);
    try {
      const targetStudent = wsPersonalize ? students.find((s) => s.id === wsPersonalStudentId) : null;
      const targetGap = wsPersonalize ? gaps.find((g) => g.studentId === wsPersonalStudentId) : null;

      const res = await fetch("/api/ai/worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: wsGrade,
          subject: wsSubject,
          concept: wsConcept,
          difficulty: wsDifficulty,
          questionCount: wsCount,
          language,
          questionType: wsType,
          studentName: targetStudent?.displayName,
          studentGapContext: targetGap?.reason || (wsPersonalize ? ai.defaultGapContext : undefined),
        }),
      });
      const data = await res.json();
      if (data.success && data.worksheet) {
        setWsResult(data.worksheet);
        setWsMeta({
          isAiGenerated: data.isAiGenerated,
          provider: data.provider,
          modelUsed: data.modelUsed,
          note: data.note,
        });
      } else {
        setWsError(data.error || ai.errWsGen);
      }
    } catch {
      setWsError(ai.errWsNet);
    } finally {
      setWsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 5: TEACHER AI ASSISTANT CHAT STATE
  // -------------------------------------------------------------
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<
    { role: "user" | "assistant"; content: string; isWelcome?: boolean; isAiGenerated?: boolean; modelUsed?: string }[]
  >([
    {
      role: "assistant",
      content: ai.wsAssistantWelcome,
      isWelcome: true,
    },
  ]);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const handleAssistantSend = async (customMessage?: string) => {
    const textToSend = customMessage || assistantInput;
    if (!textToSend.trim()) return;

    const newMessages = [...assistantMessages, { role: "user" as const, content: textToSend }];
    setAssistantMessages(newMessages);
    setAssistantInput("");
    setAssistantLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: newMessages.slice(-6),
          language,
          userRole: role,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setAssistantMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
            isAiGenerated: data.isAiGenerated,
            modelUsed: data.modelUsed,
          },
        ]);
      } else {
        setAssistantMessages([
          ...newMessages,
          {
            role: "assistant",
            content: ai.errAssistantGen,
          },
        ]);
      }
    } catch {
      setAssistantMessages([
        ...newMessages,
        {
          role: "assistant",
          content: ai.errAssistantNet,
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: ShikshaSetu AI Workspace Branding with Warm Cream & Peach Styling */}
      <div className="rounded-3xl border border-[#49352F]/15 bg-gradient-to-r from-[#F2DCB5]/90 via-[#FAF6E9] to-[#F2CAB3]/80 p-6 shadow-[0_8px_24px_rgba(73,53,47,0.06)] text-[#49352F] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-white border border-[#49352F]/15 text-[#B26A1B] shadow-xs">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#B26A1B]">
                {ai.hubBadge}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-[#49352F]">
              {ai.wsHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1 max-w-2xl leading-relaxed">
              {ai.wsSubtitle}
            </p>
          </div>

          {/* Model & Language Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md ${
                aiStatus.isLive
                  ? "bg-[#2E7D5E]/15 border-[#2E7D5E]/30 text-[#2E7D5E]"
                  : "bg-white border-[#49352F]/15 text-[#49352F]"
              }`}
              title={
                aiStatus.isLive
                  ? ai.aiStatusLiveTooltip
                  : ai.aiStatusOfflineTooltip
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus.isLive ? "bg-[#2E7D5E] animate-ping" : "bg-[#B26A1B]"
                }`}
              />
              <span>
                {aiStatus.isLive
                  ? tr("ai.aiStatusLiveLabel", { model: aiStatus.model || "Gemini" })
                  : ai.aiStatusOfflineLabel}
              </span>
            </div>

            <LanguageSelector variant="default" />
          </div>
        </div>

        {/* 5 Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#49352F]/10 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("tutor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tutor"
                ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#B26A1B]" />
            <span>{ai.wsTabTutor}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analyzer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "analyzer"
                ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#C54738]" />
            <span>{ai.wsTabAnalyzer}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("remedial")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "remedial"
                ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <ClipboardList className="w-4 h-4 text-[#2E7D5E]" />
            <span>{ai.wsTabRemedial}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("worksheet")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "worksheet"
                ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#B26A1B]" />
            <span>{ai.wsTabWorksheet}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("assistant")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "assistant"
                ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F] border border-[#49352F]/10"
            }`}
          >
            <Bot className="w-4 h-4 text-[#2E7D5E]" />
            <span>{ai.wsTabAssistant}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI TUTOR                                                           */}
      {/* ========================================================================= */}
      {activeTab === "tutor" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <span>{ai.tutorCardTitle}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ai.tutorCardDesc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={tutorGrade}
                  onChange={(e) => setTutorGrade(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>{formatClass(g)}</option>
                  ))}
                </select>

                <select
                  value={tutorSubject}
                  onChange={(e) => setTutorSubject(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="Mathematics">{formatSubject("MATH")}</option>
                  <option value="English">{formatSubject("ENG")}</option>
                  <option value="Gujarati">{formatSubject("GUJ")}</option>
                  <option value="EVS">{formatSubject("EVS")}</option>
                </select>
              </div>
            </div>

            <div className="py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                {ai.suggestedQueriesLabel}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  ai.tutorChip1,
                  ai.tutorChip2,
                  ai.tutorChip3,
                  ai.tutorChip4,
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTutorQuery(chip);
                      handleTutorSubmit(undefined, chip);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs text-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleTutorSubmit} className="mt-3 space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={tutorQuery}
                  onChange={(e) => setTutorQuery(e.target.value)}
                  placeholder={ai.tutorTextareaPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {ai.tutorCurriculumNote}
                </span>

                <button
                  type="submit"
                  disabled={tutorLoading || !tutorQuery.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {tutorLoading ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>{ai.tutorGeneratingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{ai.askButton}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {tutorError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{tutorError}</span>
              </div>
            )}
          </div>

          {tutorResponse && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {ai.tutorResultHeader}
                    </span>
                    {tutorMeta && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {tutorMeta.isAiGenerated ? tr("ai.generatedLiveVia", { model: tutorMeta.modelUsed }) : ai.offlineRuleEngine}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {tutorResponse.topic}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(tutorResponse, null, 2), "tutor")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {copiedId === "tutor" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === "tutor" ? ai.copied : ai.copyResponse}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{ai.printGuideBtn}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>{ai.childFriendlyTitle}</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {tutorResponse.simpleExplanation}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{ai.concreteDemoTitle}</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {tutorResponse.classroomExample}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {ai.stepByStepTitle}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tutorResponse.stepByStepActivity?.map((step: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">
                            {step.stepNumber || i + 1}
                          </span>
                          <span>{step.title}</span>
                        </span>
                        {step.durationMinutes && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                            <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
                            <span>{tr("ai.minutesShort", { min: step.durationMinutes })}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6">
                        {step.instruction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {ai.practiceQuestionsTitle}
                </span>
                <div className="space-y-3">
                  {tutorResponse.practiceQuestions?.map((pq: any, idx: number) => {
                    const isExpanded = expandedAnswers[idx];
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <span className="text-xs font-bold text-indigo-700">
                              {tr("ai.questionNumLabel", { num: pq.questionNumber || idx + 1 })}
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">
                              {pq.question}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>{isExpanded ? ai.hideAnswer : ai.revealAnswer}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {pq.options && Array.isArray(pq.options) && pq.options.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {pq.options.map((opt: string, optIdx: number) => (
                              <div
                                key={optIdx}
                                className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1 animate-fadeIn">
                            <div className="font-bold text-emerald-900">
                              {ai.correctAnswerLabel} <span className="font-semibold">{pq.answer}</span>
                            </div>
                            <p className="text-emerald-800">
                              <strong>{ai.explanationLabel}</strong> {pq.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {tutorResponse.teacherPedagogyTip && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold flex items-center gap-1.5 mb-1">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>{ai.pedagogyTipLabel}</span>
                  </span>
                  <p>{tutorResponse.teacherPedagogyTip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI LEARNING-GAP ANALYZER                                           */}
      {/* ========================================================================= */}
      {activeTab === "analyzer" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>{ai.analyzerCardTitle}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {ai.analyzerCardDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.selectStudentLabel}</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-hidden"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({formatClass(s.grade, s.section)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.subjectLabel}</label>
                <select
                  value={analyzerSubject}
                  onChange={(e) => setAnalyzerSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-hidden"
                >
                  <option value="MATH">{formatSubject("MATH")}</option>
                  <option value="ENG">{formatSubject("ENG")}</option>
                  <option value="GUJ">{formatSubject("GUJ")}</option>
                  <option value="EVS">{formatSubject("EVS")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.targetConceptLabel}</label>
                <input
                  type="text"
                  value={analyzerConcept}
                  onChange={(e) => setAnalyzerConcept(e.target.value)}
                  placeholder={ai.targetConceptPlaceholder}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.marksObtainedLabel}</label>
                <input
                  type="number"
                  min="0"
                  max={maxMarks}
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-900 focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.maxMarksLabel}</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-900 focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {ai.teacherObsLabel}
              </label>
              <textarea
                rows={2}
                value={teacherObs}
                onChange={(e) => setTeacherObs(e.target.value)}
                placeholder={ai.teacherObsPlaceholder}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400">
                {ai.thresholdsNotePrefix} <strong>{ai.thresholdMastered}</strong> • <strong>{ai.thresholdDeveloping}</strong> • <strong>{ai.thresholdNeedsSupport}</strong>
              </div>

              <button
                type="button"
                disabled={analyzerLoading}
                onClick={handleAnalyzeGap}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {analyzerLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{ai.analyzingBtn}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{ai.analyzeBtn}</span>
                  </>
                )}
              </button>
            </div>

            {analyzerError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {analyzerError}
              </div>
            )}
          </div>

          {analyzerResult && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    {ai.deterministicCalcLabel}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      analyzerResult.deterministicMetrics.calculatedPercentage >= 80
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : analyzerResult.deterministicMetrics.calculatedPercentage >= 60
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {formatStatus(analyzerResult.deterministicMetrics.masteryStatus)} (
                    {formatPriority(analyzerResult.deterministicMetrics.priority)} {ai.prioritySuffix})
                  </span>
                </div>

                <div className="flex items-baseline gap-4 pt-1">
                  <span className="text-3xl font-extrabold text-white">
                    {analyzerResult.deterministicMetrics.calculatedPercentage}%
                  </span>
                  <span className="text-xs text-slate-300">
                    ({analyzerResult.deterministicMetrics.marksObtained} /{" "}
                    {analyzerResult.deterministicMetrics.maximumMarks} {ai.marksUnit})
                  </span>
                  <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
                    {ai.thresholdRuleLabel} {analyzerResult.deterministicMetrics.operationalThresholdApplied}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{ai.pedagogicalDiagHeading}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {analyzerResult.isAiGenerated
                      ? tr("ai.aiStatusLiveLabel", { model: analyzerResult.modelUsed })
                      : ai.deterministicRulesLabel}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-800 block">{ai.observableEvidenceLabel}</span>
                  <p className="text-slate-700 leading-relaxed">
                    {analyzerResult.aiPedagogicalDiagnosis.evidenceSummary}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">
                    {ai.underlyingMisconceptionLabel}
                  </span>
                  <p className="text-amber-800 leading-relaxed">
                    {analyzerResult.aiPedagogicalDiagnosis.underlyingMisconception}
                  </p>
                </div>

                {analyzerResult.aiPedagogicalDiagnosis.prerequisiteGapsIdentified?.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-700">{ai.prereqGapsLabel}</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analyzerResult.aiPedagogicalDiagnosis.prerequisiteGapsIdentified.map(
                        (gapItem: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium"
                          >
                            • {gapItem}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    {ai.recommendedInterventionsLabel}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analyzerResult.aiPedagogicalDiagnosis.recommendedRemedialActivities?.map(
                      (act: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs text-xs space-y-1"
                        >
                          <span className="font-bold text-indigo-900 block">{act.activityTitle}</span>
                          <p className="text-slate-600">{act.description}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                            <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
                            <span><strong>{ai.materialsLabel}</strong> {act.concreteMaterials}</span>
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-indigo-950 block">{ai.suggestedReassessmentLabel}</span>
                    <p className="text-indigo-800 mt-0.5">
                      {analyzerResult.aiPedagogicalDiagnosis.suggestedReassessmentMethod?.format} (
                      {tr("ai.withinDays", { days: analyzerResult.aiPedagogicalDiagnosis.suggestedReassessmentMethod?.timelineDays })}).
                    </p>
                    <span className="text-[11px] text-indigo-600 block mt-0.5">
                      {ai.masteryCriterionLabel}{" "}
                      {analyzerResult.aiPedagogicalDiagnosis.suggestedReassessmentMethod?.masteryCriterion}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRemStudentId(selectedStudentId);
                      setRemConceptName(analyzerConcept);
                      setRemSubject(analyzerSubject);
                      setRemLatestScore(analyzerResult.deterministicMetrics.calculatedPercentage);
                      setRemGapReason(analyzerResult.aiPedagogicalDiagnosis.underlyingMisconception);
                      setActiveTab("remedial");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <span>{ai.generateRemedialFromGapBtn} <span className="rtl:inline-block rtl:rotate-180">→</span></span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 italic pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{analyzerResult.aiPedagogicalDiagnosis.ethicalSafetyDisclosure}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI REMEDIAL PLAN GENERATOR                                         */}
      {/* ========================================================================= */}
      {activeTab === "remedial" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  <span>{ai.remCardTitle}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ai.remCardDesc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={remStudentId}
                  onChange={(e) => handleRemStudentSelect(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({formatClass(s.grade, s.section)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.remConceptLabel}</label>
                <input
                  type="text"
                  value={remConceptName}
                  onChange={(e) => setRemConceptName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.remSubjectCodeLabel}</label>
                <select
                  value={remSubject}
                  onChange={(e) => setRemSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="MATH">{formatSubject("MATH")}</option>
                  <option value="ENG">{formatSubject("ENG")}</option>
                  <option value="GUJ">{formatSubject("GUJ")}</option>
                  <option value="EVS">{formatSubject("EVS")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.remBaselineLabel}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={remLatestScore}
                  onChange={(e) => setRemLatestScore(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-rose-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {ai.remGapEvidenceLabel}
              </label>
              <textarea
                rows={2}
                value={remGapReason}
                onChange={(e) => setRemGapReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {ai.remScopeNote}
              </span>

              <button
                type="button"
                disabled={remLoading}
                onClick={handleGenerateRemedialPlan}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {remLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{ai.remGeneratingBtn}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{ai.remGenerateBtn}</span>
                  </>
                )}
              </button>
            </div>

            {remError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {remError}
              </div>
            )}
          </div>

          {remPlan && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                      {ai.remActionPlanBadge}
                    </span>
                    <span className="text-xs text-slate-400">
                      {ai.remStudentLabel} <strong>{remPlan.studentName}</strong> ({formatClass(remPlan.grade || 4, remPlan.section)})
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {remPlan.conceptName}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={remSaveStatus === "saving"}
                    onClick={handleSavePlanToDb}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {remSaveStatus === "saving"
                        ? ai.remSavingBtn
                        : remSaveStatus === "saved"
                        ? ai.remSavedBtn
                        : ai.remSaveBtn}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{ai.printPlanBtn}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
                  <span className="font-bold text-purple-950 block">{ai.targetObjectiveLabel}</span>
                  <p className="text-purple-900 leading-relaxed">{remPlan.learningObjective}</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
                  <span className="font-bold text-indigo-950 block">{ai.identifiedNeedLabel}</span>
                  <p className="text-indigo-900 leading-relaxed">{remPlan.recommendationReason}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">
                  {ai.lowCostMaterialsLabel}
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {remPlan.requiredMaterials?.map((mat: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium"
                    >
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>{mat}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {tr("ai.fiveStepSeqLabel", { minutes: remPlan.estimatedMinutes })}
                  </span>
                  <span className="text-xs text-slate-400">{ai.editableByTeacher}</span>
                </div>

                <div className="space-y-2.5">
                  {remPlan.steps?.map((step: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-900 font-bold">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">
                            {step.stepNumber}
                          </span>
                          <span>{step.title}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-400 font-normal">
                          <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
                          <span>{tr("ai.minutesFull", { min: step.durationMinutes })}</span>
                        </span>
                      </div>
                      <p className="text-slate-600 pl-7 leading-relaxed">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="font-bold text-amber-950 block mb-1">
                    {ai.reassessCriteriaLabel}
                  </span>
                  <p className="text-amber-900">{remPlan.reassessmentCriteria}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="font-bold text-emerald-950 block mb-1">
                    {ai.teacherAdviceLabel}
                  </span>
                  <p className="text-emerald-900">{remPlan.teacherInstructions}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI WORKSHEET GENERATOR                                             */}
      {/* ========================================================================= */}
      {activeTab === "worksheet" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>{ai.wsCardTitle}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ai.wsCardDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.classGradeLabel}</label>
                <select
                  value={wsGrade}
                  onChange={(e) => setWsGrade(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>{formatClass(g)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.subjectLabel}</label>
                <select
                  value={wsSubject}
                  onChange={(e) => setWsSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="MATH">{formatSubject("MATH")}</option>
                  <option value="ENG">{formatSubject("ENG")}</option>
                  <option value="GUJ">{formatSubject("GUJ")}</option>
                  <option value="EVS">{formatSubject("EVS")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.difficultyLabel}</label>
                <select
                  value={wsDifficulty}
                  onChange={(e) => setWsDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="Easy">{ai.diffEasy}</option>
                  <option value="Medium">{ai.diffMedium}</option>
                  <option value="Challenging">{ai.diffChallenging}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.questionCountLabel}</label>
                <select
                  value={wsCount}
                  onChange={(e) => setWsCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  {[3, 5, 8, 10].map((c) => (
                    <option key={c} value={c}>{tr("ai.nQuestions", { count: c })}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.conceptLabel}</label>
                <input
                  type="text"
                  value={wsConcept}
                  onChange={(e) => setWsConcept(e.target.value)}
                  placeholder={ai.targetConceptPlaceholder}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{ai.questionTypeLabel}</label>
                <select
                  value={wsType}
                  onChange={(e) => setWsType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="mixed">{ai.qTypeMixed}</option>
                  <option value="mcq">{ai.qTypeMcq}</option>
                  <option value="short_answer">{ai.qTypeShort}</option>
                  <option value="word_problems">{ai.qTypeWord}</option>
                  <option value="fill_blanks">{ai.qTypeFill}</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wsPersonalize}
                  onChange={(e) => setWsPersonalize(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">
                  {ai.personalizeLabel}
                </span>
              </label>

              {wsPersonalize && (
                <select
                  value={wsPersonalStudentId}
                  onChange={(e) => setWsPersonalStudentId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {tr("ai.targetPrefix", { name: s.displayName })}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {ai.wsPrintNote}
              </span>

              <button
                type="button"
                disabled={wsLoading}
                onClick={handleGenerateWorksheet}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {wsLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{ai.wsGeneratingBtn}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{ai.wsGenerateBtn}</span>
                  </>
                )}
              </button>
            </div>

            {wsError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {wsError}
              </div>
            )}
          </div>

          {wsResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{ai.wsGeneratedLabel}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    {tr("ai.wsVerifiedQuestions", { count: wsResult.questions?.length || 0 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {showAnswerKeys ? ai.hideAnswerKey : ai.showAnswerKey}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{ai.printWorksheetBtn}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm text-slate-900 print:border-none print:shadow-none print:p-0">
                <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                  <h3 className="text-lg font-black tracking-tight uppercase">
                    {wsResult.schoolName}
                  </h3>
                  <h4 className="text-base font-bold text-slate-800">
                    {wsResult.worksheetTitle}
                  </h4>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                    <span>{tr("ai.wsMetaClass", { grade: formatClass(wsResult.grade) })}</span>
                    <span>{tr("ai.wsMetaSubject", { subject: formatSubject(wsResult.subject) })}</span>
                    <span>{tr("ai.wsMetaConcept", { concept: wsResult.concept })}</span>
                    <span>{tr("ai.wsMetaTotalMarks", { marks: wsResult.totalMarks })}</span>
                    <span>{tr("ai.wsMetaTime", { minutes: wsResult.estimatedMinutes })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold py-3 border-b border-slate-200">
                  <div>{ai.wsStudentNameLine} ___________________________________</div>
                  <div>{ai.wsRollNoLine} _______</div>
                  <div>{ai.wsDateLine} ____________</div>
                </div>

                {wsResult.personalizedStudentNote && (
                  <div className="py-2 text-[11px] font-semibold text-indigo-700 print:hidden inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                    <span>{wsResult.personalizedStudentNote}</span>
                  </div>
                )}

                <div className="py-3 text-xs text-slate-600 italic">
                  <strong>{ai.wsInstructionsLabel}</strong> {wsResult.instructions}
                </div>

                <div className="space-y-6 pt-2">
                  {wsResult.questions?.map((q: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                        <div className="font-semibold text-slate-900 flex-1">
                          <span className="font-bold mr-1.5">{tr("ai.wsQuestionShort", { num: q.questionNumber || idx + 1 })}</span>
                          <span>{q.questionText}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 shrink-0">
                          {tr("ai.wsMarksBracket", { marks: q.marks || 2 })}
                        </span>
                      </div>

                      {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-5 pt-1">
                          {q.options.map((opt: string, optI: number) => (
                            <div
                              key={optI}
                              className="p-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="h-10 border-b border-dashed border-slate-200 print:block hidden" />

                      {showAnswerKeys && (
                        <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 print:hidden">
                          <div className="font-bold text-emerald-900">
                            {ai.wsAnswerKeyLabel} <span className="font-semibold">{q.answerKey}</span>
                          </div>
                          <div className="text-emerald-800">
                            <strong>{ai.wsStepSolutionLabel}</strong> {q.stepExplanation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TEACHER AI ASSISTANT CHAT                                          */}
      {/* ========================================================================= */}
      {activeTab === "assistant" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {ai.assistantHeaderTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {ai.assistantHeaderDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                  {role === "admin" ? ai.roleBadgeAdmin : ai.roleBadgeTeacher}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
              {assistantMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUser
                          ? "bg-indigo-600 text-white"
                          : "bg-cyan-600 text-white shadow-xs"
                      }`}
                    >
                      {isUser ? user?.name?.charAt(0) || "T" : "AI"}
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs space-y-2 whitespace-pre-line"
                      }`}
                    >
                      {msg.isWelcome ? ai.wsAssistantWelcome : msg.content}

                      {!isUser && msg.modelUsed && (
                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                          {msg.isAiGenerated ? tr("ai.generatedLiveVia", { model: msg.modelUsed }) : ai.offlineRuleEngine}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {assistantLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pl-10">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                  <span>{ai.assistantAnalyzing}</span>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-wrap gap-2">
              {[
                ai.assistantChip1,
                ai.assistantChip2,
                ai.assistantChip3,
                ai.assistantChip4,
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAssistantSend(chip)}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 text-slate-600 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 text-cyan-600 shrink-0" aria-hidden="true" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAssistantSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder={ai.assistantInputPlaceholder}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={assistantLoading || !assistantInput.trim()}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
