"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
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
  const { language, setLanguage } = useLanguage();
  const { aiAssistantName } = useSettings();
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
  const [tutorQuery, setTutorQuery] = useState(
    "My Class 4 students are struggling with division. How can I teach equal sharing?"
  );
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
        setTutorError(data.error || "Failed to generate AI tutor explanation.");
      }
    } catch {
      setTutorError("Network error contacting AI Tutor service.");
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
          studentName: student?.displayName || "Student",
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
        setAnalyzerError(data.error || "Failed to analyze student gap.");
      }
    } catch {
      setAnalyzerError("Network error contacting AI Gap Analyzer.");
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
          studentName: student?.displayName || "Student",
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
        setRemError(data.error || "Failed to generate AI remedial plan.");
      }
    } catch {
      setRemError("Network error contacting AI Remedial Plan service.");
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
          studentGapContext: targetGap?.reason || (wsPersonalize ? "Needs division support" : undefined),
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
        setWsError(data.error || "Failed to generate worksheet.");
      }
    } catch {
      setWsError("Network error generating worksheet.");
    } finally {
      setWsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 5: TEACHER AI ASSISTANT CHAT STATE
  // -------------------------------------------------------------
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<
    { role: "user" | "assistant"; content: string; isAiGenerated?: boolean; modelUsed?: string }[]
  >([
    {
      role: "assistant",
      content:
        language === "gu"
          ? "નમસ્તે! હું StudySaathi પ્રાથમિક શિક્ષક સહાયક છું. હું આપને પાયાની સંકલ્પનાઓ શીખવવામાં, ઉપચારાત્મક પ્રવૃત્તિઓ ગોઠવવામાં અને વર્ગખંડના શિક્ષણ ત્રુટિ ડેટાનું વિશ્લેષણ કરવામાં મદદ કરી શકું છું. આપ શું પૂછવા માંગો છો?"
          : "Hello! I am your StudySaathi Primary Teacher AI Assistant. I can help you with foundational FLN concepts, manipulative-based remedial plans, worksheet ideas, or summarizing your classroom's latest assessment gaps. How can I support your teaching today?",
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
            content: "Sorry, I encountered an issue processing your request. Please try again.",
          },
        ]);
      }
    } catch {
      setAssistantMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Network error communicating with the Teacher Assistant service.",
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
                StudySaathi AI Intelligence Hub
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-[#49352F]">
              {language === "gu" ? "StudySaathi ઇન્ટરેક્ટિવ AI વર્કસ્પેસ" : "Functional AI Workspace"}
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1 max-w-2xl leading-relaxed">
              {language === "gu"
                ? "વાસ્તવિક શૈક્ષણિક AI ક્ષમતાઓ: શિક્ષા ટ્યુટર, ત્રુટિ વિશ્લેષક, ઉપચાર યોજના જનરેટર અને સ્માર્ટ વર્કશીટ નિર્માતા."
                : "Fully functional pedagogical AI capabilities: AI Tutor, Learning-Gap Analyzer, Remedial Plan Generator, Worksheet Creator, and Teacher Assistant."}
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
                  ? "Live external model connection active."
                  : "No external key configured (GEMINI_API_KEY). Transparent offline pedagogical fallback active."
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus.isLive ? "bg-[#2E7D5E] animate-ping" : "bg-[#B26A1B]"
                }`}
              />
              <span>
                {aiStatus.isLive
                  ? `Live AI: ${aiStatus.model || "Gemini"}`
                  : "Offline Pedagogical Fallback"}
              </span>
            </div>

            <div className="flex items-center rounded-xl bg-white border border-[#49352F]/15 p-1 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("gu")}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  language === "gu"
                    ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                    : "text-[#7A6862] hover:text-[#49352F]"
                }`}
              >
                ગુજરાતી
              </button>
            </div>
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
            <span>{language === "gu" ? "૧. AI ટ્યુટર" : "1. AI Tutor"}</span>
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
            <span>{language === "gu" ? "૨. અધ્યયન ત્રુટિ વિશ્લેષક" : "2. Learning-Gap Analyzer"}</span>
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
            <span>{language === "gu" ? "૩. ઉપચાર યોજના નિર્માતા" : "3. Remedial Plan Generator"}</span>
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
            <span>{language === "gu" ? "૪. વર્કશીટ નિર્માતા" : "4. Worksheet Generator"}</span>
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
            <span>{language === "gu" ? `૫. ${aiAssistantName || "શિક્ષક સહાયક"}` : `5. ${aiAssistantName || "Teacher Assistant"}`}</span>
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
                  <span>Primary Classroom AI Tutor</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ask how to teach any primary concept using concrete manipulatives, child-friendly analogies, and 3 practice questions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={tutorGrade}
                  onChange={(e) => setTutorGrade(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value={1}>Class 1</option>
                  <option value={2}>Class 2</option>
                  <option value={3}>Class 3</option>
                  <option value={4}>Class 4</option>
                  <option value={5}>Class 5</option>
                </select>

                <select
                  value={tutorSubject}
                  onChange={(e) => setTutorSubject(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="EVS">EVS</option>
                </select>
              </div>
            </div>

            <div className="py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Suggested Teacher Queries (Click to load):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "My Class 4 students are struggling with division. How can I teach equal sharing?",
                  "How can I teach fractions using rotis or paper folding in Class 4?",
                  "How can I explain 2-digit subtraction with borrowing using matchstick bundles?",
                  language === "gu"
                    ? "ધોરણ ૪ માં ભાગાકારની સમાન વહેંચણી કાંકરા દ્વારા કેવી રીતે શીખવવી?"
                    : "Engaging Gujarati vowel matras activity for Grade 3",
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
                  placeholder="Enter your teaching question... e.g. 'My Class 4 students are struggling with division. How can I teach equal sharing?'"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Supports English & Gujarati • Aligned with Gujarat Primary Curriculum
                </span>

                <button
                  type="submit"
                  disabled={tutorLoading || !tutorQuery.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {tutorLoading ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Lesson Support...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask AI Tutor</span>
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
                      AI Pedagogical Lesson Guide
                    </span>
                    {tutorMeta && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {tutorMeta.isAiGenerated ? `Generated live via ${tutorMeta.modelUsed}` : "Offline Pedagogical Rule Engine"}
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
                    <span>{copiedId === "tutor" ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Guide</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Child-Friendly Explanation (Primary Level)</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {tutorResponse.simpleExplanation}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Concrete Classroom Demonstration (Low-Cost TLM)</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {tutorResponse.classroomExample}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Step-by-Step Teaching Sequence:
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
                            <span>{step.durationMinutes}m</span>
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
                  Three Progressive Practice Questions:
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
                              Question {pq.questionNumber || idx + 1}:
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
                            <span>{isExpanded ? "Hide Answer" : "Reveal Answer"}</span>
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
                              Correct Answer: <span className="font-semibold">{pq.answer}</span>
                            </div>
                            <p className="text-emerald-800">
                              <strong>Explanation:</strong> {pq.explanation}
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
                    <span>Actionable Teacher Pedagogy Tip:</span>
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
                <span>AI Learning-Gap Diagnostic Analyzer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Input student assessment evidence to calculate deterministic scores and trigger AI-guided pedagogical gap explanations without medical or subjective labeling.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-hidden"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} (Class {s.grade}-{s.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={analyzerSubject}
                  onChange={(e) => setAnalyzerSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-hidden"
                >
                  <option value="MATH">Mathematics (ગણિત)</option>
                  <option value="ENG">English (અંગ્રેજી)</option>
                  <option value="GUJ">Gujarati (ગુજરાતી)</option>
                  <option value="EVS">EVS (પર્યાવરણ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Concept Evaluated</label>
                <input
                  type="text"
                  value={analyzerConcept}
                  onChange={(e) => setAnalyzerConcept(e.target.value)}
                  placeholder="e.g. Division Basics & Equal Sharing"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marks Obtained</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks</label>
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
                Teacher Observations / Specific Errors Recorded:
              </label>
              <textarea
                rows={2}
                value={teacherObs}
                onChange={(e) => setTeacherObs(e.target.value)}
                placeholder="Record observations, e.g. 'Struggled with Q3 word problem dividing 15 laddus into 3 boxes. Confused division with subtraction.'"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400">
                Deterministic thresholds: <strong>Mastered (&ge;80%)</strong> • <strong>Developing (60-79%)</strong> • <strong>Needs Support (&lt;60%)</strong>
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
                    <span>Analyzing Assessment Evidence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Learning Gap</span>
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
                    Deterministic Mathematical Calculation
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
                    {analyzerResult.deterministicMetrics.masteryStatus} (
                    {analyzerResult.deterministicMetrics.priority} Priority)
                  </span>
                </div>

                <div className="flex items-baseline gap-4 pt-1">
                  <span className="text-3xl font-extrabold text-white">
                    {analyzerResult.deterministicMetrics.calculatedPercentage}%
                  </span>
                  <span className="text-xs text-slate-300">
                    ({analyzerResult.deterministicMetrics.marksObtained} /{" "}
                    {analyzerResult.deterministicMetrics.maximumMarks} marks)
                  </span>
                  <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
                    Threshold Rule: {analyzerResult.deterministicMetrics.operationalThresholdApplied}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Evidence-Based Pedagogical Diagnosis</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {analyzerResult.isAiGenerated
                      ? `Live AI: ${analyzerResult.modelUsed}`
                      : "Deterministic Gujarat Primary Pedagogical Rules"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-800 block">Observable Assessment Evidence:</span>
                  <p className="text-slate-700 leading-relaxed">
                    {analyzerResult.aiPedagogicalDiagnosis.evidenceSummary}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">
                    Underlying Conceptual Misconception:
                  </span>
                  <p className="text-amber-800 leading-relaxed">
                    {analyzerResult.aiPedagogicalDiagnosis.underlyingMisconception}
                  </p>
                </div>

                {analyzerResult.aiPedagogicalDiagnosis.prerequisiteGapsIdentified?.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-700">Identified Prerequisite Gaps:</span>
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
                    Recommended Classroom Remedial Interventions:
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
                            <span><strong>Materials:</strong> {act.concreteMaterials}</span>
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-indigo-950 block">Suggested Reassessment:</span>
                    <p className="text-indigo-800 mt-0.5">
                      {analyzerResult.aiPedagogicalDiagnosis.suggestedReassessmentMethod?.format} (within{" "}
                      {analyzerResult.aiPedagogicalDiagnosis.suggestedReassessmentMethod?.timelineDays} days).
                    </p>
                    <span className="text-[11px] text-indigo-600 block mt-0.5">
                      Mastery Criterion:{" "}
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
                    <span>Generate AI Remedial Plan →</span>
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
                  <span>AI Remedial Plan Generator</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate an authentic 5-step remedial curriculum for Gujarat primary schools using the student&apos;s actual assessment results.
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
                      {s.displayName} (Class {s.grade}-{s.section})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Concept to Remediate</label>
                <input
                  type="text"
                  value={remConceptName}
                  onChange={(e) => setRemConceptName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
                <select
                  value={remSubject}
                  onChange={(e) => setRemSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="MATH">MATH (Mathematics)</option>
                  <option value="ENG">ENG (English)</option>
                  <option value="GUJ">GUJ (Gujarati)</option>
                  <option value="EVS">EVS (Environmental Studies)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recent Baseline Score (%)</label>
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
                Identified Conceptual Gap / Evidence:
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
                Targeted for Gujarat Primary Schools • Generates 5 Steps + Low-Cost TLM + Practice Questions
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
                    <span>Generating Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Remedial Plan</span>
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
                      Remedial Action Plan
                    </span>
                    <span className="text-xs text-slate-400">
                      Student: <strong>{remPlan.studentName}</strong> (Class 4-A)
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
                        ? "Saving..."
                        : remSaveStatus === "saved"
                        ? "Saved to Database"
                        : "Save to Remedial Plans"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Plan</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
                  <span className="font-bold text-purple-950 block">Target Learning Objective:</span>
                  <p className="text-purple-900 leading-relaxed">{remPlan.learningObjective}</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
                  <span className="font-bold text-indigo-950 block">Identified Gap & Need:</span>
                  <p className="text-indigo-900 leading-relaxed">{remPlan.recommendationReason}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">
                  Low-Cost Materials (Local TLM):
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
                    5-Step Targeted Remedial Sequence (Total: {remPlan.estimatedMinutes} mins):
                  </span>
                  <span className="text-xs text-slate-400">Editable by Teacher</span>
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
                          <span>{step.durationMinutes} mins</span>
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
                    Reassessment Method & Mastery Criteria:
                  </span>
                  <p className="text-amber-900">{remPlan.reassessmentCriteria}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="font-bold text-emerald-950 block mb-1">
                    Teacher Pedagogical Advice:
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
                  <span>AI Classroom Worksheet & Practice Generator</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate printable primary worksheets with step-by-step answer keys and optional personalized gap alignment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Grade</label>
                <select
                  value={wsGrade}
                  onChange={(e) => setWsGrade(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value={1}>Class 1</option>
                  <option value={2}>Class 2</option>
                  <option value={3}>Class 3</option>
                  <option value={4}>Class 4</option>
                  <option value={5}>Class 5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={wsSubject}
                  onChange={(e) => setWsSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="MATH">Mathematics</option>
                  <option value="ENG">English</option>
                  <option value="GUJ">Gujarati</option>
                  <option value="EVS">EVS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={wsDifficulty}
                  onChange={(e) => setWsDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="Easy">Easy (Foundational)</option>
                  <option value="Medium">Medium (Grade-Level)</option>
                  <option value="Challenging">Challenging</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Count</label>
                <select
                  value={wsCount}
                  onChange={(e) => setWsCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={8}>8 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Concept</label>
                <input
                  type="text"
                  value={wsConcept}
                  onChange={(e) => setWsConcept(e.target.value)}
                  placeholder="e.g. Division Basics & Equal Sharing"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
                <select
                  value={wsType}
                  onChange={(e) => setWsType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="mixed">Mixed (MCQ, Short Answer, Word Problem)</option>
                  <option value="mcq">Multiple Choice Only</option>
                  <option value="short_answer">Short Answer Only</option>
                  <option value="word_problems">Word Problems Only</option>
                  <option value="fill_blanks">Fill in the Blanks</option>
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
                  Personalize worksheet based on student learning gap
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
                      Target: {s.displayName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Formatted for clean A4 printing • Teacher answer key included
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
                    <span>Generating Worksheet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Printable Worksheet</span>
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
                  <span className="text-xs font-bold text-slate-700">Worksheet Generated:</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    {wsResult.questions?.length} Verified Questions
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {showAnswerKeys ? "Hide Answer Key" : "Show Answer Key & Solutions"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Worksheet</span>
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
                    <span>Class: {wsResult.grade}-A</span>
                    <span>Subject: {wsResult.subject}</span>
                    <span>Concept: {wsResult.concept}</span>
                    <span>Total Marks: {wsResult.totalMarks}</span>
                    <span>Time: {wsResult.estimatedMinutes} mins</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold py-3 border-b border-slate-200">
                  <div>Student Name: ___________________________________</div>
                  <div>Roll No: _______</div>
                  <div>Date: ____________</div>
                </div>

                {wsResult.personalizedStudentNote && (
                  <div className="py-2 text-[11px] font-semibold text-indigo-700 print:hidden inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                    <span>{wsResult.personalizedStudentNote}</span>
                  </div>
                )}

                <div className="py-3 text-xs text-slate-600 italic">
                  <strong>Instructions:</strong> {wsResult.instructions}
                </div>

                <div className="space-y-6 pt-2">
                  {wsResult.questions?.map((q: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                        <div className="font-semibold text-slate-900 flex-1">
                          <span className="font-bold mr-1.5">Q{q.questionNumber || idx + 1}.</span>
                          <span>{q.questionText}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 shrink-0">
                          [{q.marks || 2} Marks]
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
                            Answer Key: <span className="font-semibold">{q.answerKey}</span>
                          </div>
                          <div className="text-emerald-800">
                            <strong>Step-by-Step Solution:</strong> {q.stepExplanation}
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
                    StudySaathi Teacher AI Assistant
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pedagogical coaching, foundational lesson ideas, & authorized classroom telemetry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                  {role === "admin" ? "Admin Access" : "Teacher Mode"}
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
                      {isUser ? user?.name?.charAt(0) || "T" : (aiAssistantName || "AI").slice(0, 2).trim()}
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs space-y-2 whitespace-pre-line"
                      }`}
                    >
                      {msg.content}

                      {!isUser && msg.modelUsed && (
                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                          {msg.isAiGenerated ? `Generated live via ${msg.modelUsed}` : "Offline Pedagogical Rule Engine"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {assistantLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pl-10">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                  <span>Analyzing classroom telemetry & pedagogical context...</span>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-wrap gap-2">
              {[
                "Summarize all Class 4 learning gaps",
                "How to introduce fractions using rotis or paper folding?",
                "What remedial strategies work best for students scoring under 40%?",
                "Suggest a quick 5-minute exit ticket for multiplication",
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
                  placeholder="Ask about remedial strategies, classroom TLM, or student gaps..."
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
