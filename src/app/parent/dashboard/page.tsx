"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { useLanguage } from "@/context/LanguageContext";
import {
  Users,
  GraduationCap,
  Sparkles,
  LogOut,
  Award,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  BookOpen,
  Send,
  Volume2,
  Plus,
  RefreshCw,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Bell,
  ChevronRight,
  ShieldCheck,
  Building,
  KeyRound,
  X,
} from "lucide-react";

function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  // Navigation tab state (can also be synced with ?tab=)
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Parent & Children data state
  const [parentData, setParentData] = useState<any>(null);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Link child modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingCodeInput, setLinkingCodeInput] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Teacher inquiry message form
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [pastMessages, setPastMessages] = useState<any[]>([]);

  // 1. Fetch authenticated parent profile and linked students
  const fetchParentProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/parent/me");
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          router.push("/parent/login");
          return;
        }
        throw new Error(data.error || "Failed to load parent portal");
      }

      setParentData(data);
      const students = data.linkedStudents || [];
      setLinkedStudents(students);

      if (students.length > 0) {
        // Default to first student if not selected
        setSelectedStudentId((prev) => prev || students[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load parent information.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch selected student details (scores, gaps, remedial plans, notices)
  const fetchStudentDetail = async (studentId: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/parent/students/${studentId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch student details");
      }

      setStudentDetail(data);
    } catch (err: any) {
      console.error("Error loading student detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // 3. Fetch past messages
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/parent/messages");
      const data = await res.json();
      if (data.success) {
        setPastMessages(data.messages || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchParentProfile();
    fetchMessages();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentDetail(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    router.push("/parent/login");
  };

  // Handle Linking Code Redemption
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingCodeInput.trim()) return;

    setLinkLoading(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      const res = await fetch("/api/parent/link-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: linkingCodeInput.trim().toUpperCase() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to redeem code.");
      }

      setLinkSuccess(
        language === "gu"
          ? `${data.student?.displayName || "બાળક"} સફળતાપૂર્વક જોડાયું!`
          : `Successfully linked ${data.student?.displayName || "student"}!`
      );
      setLinkingCodeInput("");

      // Refresh list
      await fetchParentProfile();
      if (data.studentId) {
        setSelectedStudentId(data.studentId);
      }

      setTimeout(() => {
        setLinkModalOpen(false);
        setLinkSuccess(null);
      }, 1500);
    } catch (err: any) {
      setLinkError(err.message || "Failed to redeem linking code.");
    } finally {
      setLinkLoading(false);
    }
  };

  // Handle Sending Message to Teacher
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !msgSubject.trim() || !msgBody.trim()) return;

    setMsgSending(true);
    setMsgError(null);
    setMsgSuccess(null);

    try {
      const res = await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          subject: msgSubject.trim(),
          message: msgBody.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send message.");
      }

      setMsgSuccess(
        language === "gu"
          ? "તમારો સંદેશ વર્ગ શિક્ષકને મોકલી દેવામાં આવ્યો છે."
          : "Your message has been sent to the class teacher."
      );
      setMsgSubject("");
      setMsgBody("");
      fetchMessages();

      setTimeout(() => setMsgSuccess(null), 4000);
    } catch (err: any) {
      setMsgError(err.message || "Failed to send inquiry.");
    } finally {
      setMsgSending(false);
    }
  };

  // Active student object
  const activeStudent = studentDetail?.student || linkedStudents.find((s) => s.id === selectedStudentId);

  // Calculate overview metrics
  const results = studentDetail?.results || [];
  const learningGaps = studentDetail?.learningGaps || [];
  const remedialPlans = studentDetail?.remedialPlans || [];
  const notices = studentDetail?.notices || [];

  const averageScore = results.length > 0
    ? Math.round(results.reduce((acc: number, r: any) => acc + (r.percentage || 0), 0) / results.length)
    : 0;

  const activeGapsCount = learningGaps.filter((g: any) => g.status === "active").length;
  const completedRemedialSteps = remedialPlans.reduce(
    (acc: number, p: any) => acc + (p.completedSteps || (p.steps?.filter((s: any) => s.completed)?.length || 0)),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/30 text-[#49352F]">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#49352F]/15 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size={36} />
            </Link>
            <div className="h-5 w-px bg-[#49352F]/20 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B26A1B]/10 border border-[#B26A1B]/25 text-[#B26A1B] text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{language === "gu" ? "વાલી પોર્ટલ" : "Parent Portal"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="glass" />
            <ThemeToggle variant="glass" />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-[#49352F]/15 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === "gu" ? "બહાર નીકળો" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER / WELCOME & CHILD SWITCHER */}
      <section className="bg-white/60 border-b border-[#49352F]/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#49352F] tracking-tight flex items-center gap-2">
              <span>{language === "gu" ? "નમસ્તે, " : "Welcome, "}</span>
              <span className="text-[#B26A1B]">{parentData?.user?.name || "Respected Parent"}</span>
              <span className="text-lg">👋</span>
            </h1>
            <p className="text-xs text-[#7A6862] mt-0.5">
              {language === "gu"
                ? "શિક્ષણ સેતુ વાલી પોર્ટલ &bull; તમારા બાળકની વાસ્તવિક શૈક્ષણિક પ્રગતિ અને ઉપચારાત્મક સહાય"
                : "Real-time pedagogical progress, conceptual gap diagnostics, and teacher-guided remediation"}
            </p>
          </div>

          {/* Child Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#7A6862] mr-1 hidden sm:inline">
              {language === "gu" ? "બાળક પસંદ કરો:" : "Select Child:"}
            </span>
            {linkedStudents.map((child: any) => {
              const isSelected = child.id === selectedStudentId;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedStudentId(child.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-[#261B16] text-[#FAF6E9] shadow-sm"
                      : "bg-white border border-[#49352F]/15 text-[#49352F] hover:bg-[#FAF6E9]"
                  }`}
                >
                  <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? "text-[#F2CAB3]" : "text-[#B26A1B]"}`} />
                  <span>{child.displayName}</span>
                  <span className="text-[10px] opacity-75">
                    ({child.grade ? `Class ${child.grade}-${child.section}` : "Student"})
                  </span>
                </button>
              );
            })}

            {/* "+ Link Another Child" Button */}
            <button
              onClick={() => {
                setLinkError(null);
                setLinkSuccess(null);
                setLinkModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[#B26A1B]/50 hover:border-[#B26A1B] bg-[#FAF6E9] hover:bg-[#F2CAB3]/30 text-[#B26A1B] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === "gu" ? "+ નવું બાળક જોડો" : "+ Link Another Child"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. NAVIGATION TABS */}
      <nav className="bg-white/40 border-b border-[#49352F]/10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex overflow-x-auto gap-2 py-2.5 no-scrollbar">
          {[
            { id: "overview", labelEn: "Overview", labelGu: "વિહંગાવલોકન", icon: BookOpen },
            { id: "progress", labelEn: "Academic Progress", labelGu: "શૈક્ષણિક પ્રગતિ", icon: TrendingUp },
            { id: "learning-gaps", labelEn: "Learning Gaps & Remedial", labelGu: "શિક્ષણ ત્રુટિ અને ઉપચાર", icon: BrainCircuit },
            { id: "children", labelEn: "Child Profiles", labelGu: "બાળકની પ્રોફાઇલ", icon: Users },
            { id: "communication", labelEn: "Teacher Notes", labelGu: "શિક્ષક સાથે વાતચીત", icon: MessageSquare },
            { id: "notices", labelEn: "School Notices", labelGu: "શાળા સૂચનાઓ", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#F2CAB3] text-[#49352F] shadow-xs border border-[#49352F]/15"
                    : "text-[#7A6862] hover:text-[#49352F] hover:bg-white/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#49352F]" : "text-[#7A6862]"}`} />
                <span>{language === "gu" ? tab.labelGu : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 animate-spin text-[#B26A1B] mx-auto" />
            <p className="text-sm font-bold text-[#49352F]">
              {language === "gu" ? "વાલી ડેશબોર્ડ લોડ થઈ રહ્યું છે..." : "Loading Parent Portal..."}
            </p>
          </div>
        ) : linkedStudents.length === 0 ? (
          /* Empty State: No child linked yet */
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF6E9] border border-[#49352F]/15 mx-auto flex items-center justify-center text-[#B26A1B]">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#49352F]">
              {language === "gu" ? "તમારા બાળકને જોડો" : "Link Your Child's Profile"}
            </h2>
            <p className="text-xs text-[#7A6862] leading-relaxed">
              {language === "gu"
                ? "તમારા બાળકના વર્ગ શિક્ષક પાસેથી ૬-અક્ષરનો સુરક્ષિત વેરિફિકેશન કોડ (દા.ત. PAR-4892) મેળવો અને અહીં દાખલ કરો."
                : "Enter the secure verification code issued by your child's primary school teacher (e.g. PAR-4892) to view authorized records."}
            </p>
            <form onSubmit={handleRedeemCode} className="space-y-3 pt-2">
              <input
                type="text"
                required
                value={linkingCodeInput}
                onChange={(e) => setLinkingCodeInput(e.target.value.toUpperCase())}
                placeholder="PAR-XXXX"
                className="w-full max-w-xs mx-auto text-center px-4 py-3 rounded-2xl border-2 border-[#B26A1B] font-mono text-base font-bold text-[#B26A1B] uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:text-xs"
              />
              {linkError && <p className="text-xs text-rose-600 font-semibold">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-emerald-600 font-semibold">{linkSuccess}</p>}
              <div>
                <Button
                  type="submit"
                  disabled={linkLoading}
                  className="rounded-xl px-6 py-2.5 text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10]"
                >
                  {linkLoading ? "Verifying..." : language === "gu" ? "કોડ ચકાસો અને જોડો" : "Verify & Connect Child"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Child Snapshot Header Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-white via-[#FAF6E9] to-[#F2CAB3]/40 border border-[#49352F]/15 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F2DCB5] to-[#F2CAB3] border border-[#49352F]/15 flex items-center justify-center font-black text-xl text-[#49352F] shadow-inner">
                        {activeStudent?.displayName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-[#49352F]">{activeStudent?.displayName}</h2>
                          <Badge variant={averageScore >= 80 ? "mastered" : averageScore >= 60 ? "developing" : "needsSupport"} size="sm">
                            {averageScore >= 80 ? "Mastery (≥80%)" : averageScore >= 60 ? "Developing (60-79%)" : "Support Needed (<60%)"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#7A6862] flex flex-wrap items-center gap-2 mt-0.5">
                          <span>Class {activeStudent?.grade}-{activeStudent?.section}</span>
                          <span>&bull;</span>
                          <span>Roll #{activeStudent?.rollNumber || "01"}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-[#7A6862]" />
                            {studentDetail?.school?.name || "Model Primary School, Gandhinagar"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchStudentDetail(selectedStudentId!)}
                        className="rounded-xl text-xs border-[#49352F]/20 text-[#49352F]"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        <span>{language === "gu" ? "રીફ્રેશ" : "Refresh"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* 4 Quick Stat Counters */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#49352F]/10">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {language === "gu" ? "સરેરાશ ગુણ" : "Average Score"}
                      </span>
                      <span className="text-2xl font-black text-[#B26A1B]">{averageScore}%</span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">{results.length} Assessments</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {language === "gu" ? "સક્રિય શિક્ષણ ખામીઓ" : "Active Learning Gaps"}
                      </span>
                      <span className={`text-2xl font-black ${activeGapsCount > 0 ? "text-[#C54738]" : "text-[#2E7D5E]"}`}>
                        {activeGapsCount}
                      </span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">Under 60% threshold</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {language === "gu" ? "ઉપચારાત્મક પ્રગતિ" : "Remedial Steps Closed"}
                      </span>
                      <span className="text-2xl font-black text-[#2E7D5E]">{completedRemedialSteps}</span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">5-Step Manipulatives</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {language === "gu" ? "શાળા સૂચનાઓ" : "School Notices"}
                      </span>
                      <span className="text-2xl font-black text-[#49352F]">{notices.length}</span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">Targeted to Class {activeStudent?.grade}</span>
                    </div>
                  </div>
                </div>

                {/* Two Column Grid: Recent Assessments & Learning Gaps */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Recent Assessments */}
                  <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-base font-extrabold text-[#49352F] flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#B26A1B]" />
                        <span>{language === "gu" ? "તાજેતરના મૂલ્યાંકન પરિણામો" : "Recent Assessments"}</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab("progress")}
                        className="text-xs font-bold text-[#B26A1B] hover:underline flex items-center gap-1"
                      >
                        <span>{language === "gu" ? "બધા જુઓ →" : "View All →"}</span>
                      </button>
                    </div>

                    {results.length === 0 ? (
                      <p className="text-xs text-[#7A6862] p-4 text-center">No assessments recorded yet for this student.</p>
                    ) : (
                      <div className="space-y-3">
                        {results.slice(0, 4).map((r: any) => (
                          <div
                            key={r.id}
                            className="p-3 rounded-2xl bg-[#FAF6E9]/60 border border-[#49352F]/10 flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-[#49352F] block">
                                {r.assessmentName || "Formative Unit Evaluation"}
                              </span>
                              <span className="text-[11px] text-[#7A6862]">
                                {r.recordedAt ? new Date(r.recordedAt).toLocaleDateString() : "Recent"} &bull; Marks: {r.marksObtained}/{r.maximumMarks}
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-sm font-black ${
                                  r.percentage >= 80 ? "text-[#2E7D5E]" : r.percentage >= 60 ? "text-[#B26A1B]" : "text-[#C54738]"
                                }`}
                              >
                                {r.percentage}%
                              </span>
                              <span className="block text-[10px] text-[#7A6862]">
                                {r.percentage >= 80 ? "Mastery" : r.percentage >= 60 ? "Developing" : "Needs Support"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Active Learning Gaps & Remedial Pathways */}
                  <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-base font-extrabold text-[#49352F] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#C54738]" />
                        <span>{language === "gu" ? "સક્રિય શિક્ષણ ત્રુટિઓ" : "Active Learning Gaps"}</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab("learning-gaps")}
                        className="text-xs font-bold text-[#B26A1B] hover:underline flex items-center gap-1"
                      >
                        <span>{language === "gu" ? "ઉપચાર યોજના જુઓ →" : "View Remedial Plan →"}</span>
                      </button>
                    </div>

                    {learningGaps.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-[#2E7D5E] mx-auto" />
                        <p className="text-xs font-bold text-[#2E7D5E]">
                          {language === "gu" ? "ઉત્કૃષ્ટ! કોઈ સક્રિય શિક્ષણ ખામી નથી." : "Excellent! No active learning gaps flagged."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {learningGaps.slice(0, 3).map((gap: any) => (
                          <div
                            key={gap.id}
                            className="p-3.5 rounded-2xl bg-[#FAF6E9]/60 border border-[#49352F]/10 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#49352F]">
                                {gap.conceptName || "Foundational Concept"}
                              </span>
                              <Badge variant={gap.priority === "High" ? "high" : "medium"} size="sm">
                                {gap.priority || "Medium"} Priority
                              </Badge>
                            </div>
                            <p className="text-xs text-[#7A6862] leading-relaxed">
                              {gap.reason || "Student scored below developing threshold on equal sharing with remainders."}
                            </p>
                            <div className="pt-1 flex items-center justify-between text-[11px] text-[#7A6862]">
                              <span>Latest Score: {gap.latestPercentage || gap.scoreRecorded || 35}%</span>
                              <span className="font-semibold text-[#B26A1B]">
                                {gap.remedialPlanId ? "Active 5-Step Plan In Progress" : "Plan Recommended"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: Teacher Consultation Box */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#FAF6E9] to-[#F2CAB3]/30 border border-[#B26A1B]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-[#B26A1B] uppercase tracking-wider block">
                      {language === "gu" ? "શિક્ષક પરામર્શ સમય" : "Teacher Consultation Hours"}
                    </span>
                    <h4 className="text-sm font-black text-[#49352F]">
                      {language === "gu"
                        ? "દર સોમવારથી શુક્રવાર બપોરે ૩:૧૫ થી ૪:૦૦ કલાક સુધી"
                        : "Monday - Friday: 3:15 PM – 4:00 PM (After Class Dismissal)"}
                    </h4>
                    <p className="text-xs text-[#7A6862]">
                      {language === "gu"
                        ? "તમારા બાળકના વર્ગ શિક્ષક પૂજા શર્મા સાથે સીધી વાતચીત કરવા માટે સંદેશ મોકલો."
                        : "Send an inquiry or request an in-person meeting regarding your child's progress."}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("communication")}
                    className="px-4 py-2.5 rounded-xl bg-[#261B16] text-[#FAF6E9] text-xs font-bold flex items-center gap-2 hover:bg-[#49352F] transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#F2CAB3]" />
                    <span>{language === "gu" ? "શિક્ષકને સંદેશ મોકલો" : "Message Teacher"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC PROGRESS */}
            {activeTab === "progress" && (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#49352F]">
                      {language === "gu" ? "વિષયવાર ગુણ અને પ્રદર્શન" : "Subject-Wise Academic Performance"}
                    </h2>
                    <p className="text-xs text-[#7A6862]">
                      {language === "gu"
                        ? "વાસ્તવિક વર્ગખંડ મૂલ્યાંકન અને દૈનિક નિરીક્ષણના આધારે પ્રમાણિત સ્કોર"
                        : "Real assessment data and formative evaluations recorded by class teachers"}
                    </p>
                  </div>

                  {/* Subject Proficiency Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(studentDetail?.subjectBreakdown && studentDetail.subjectBreakdown.length > 0
                      ? studentDetail.subjectBreakdown
                      : [
                          { subject: "Mathematics", averagePercentage: 42, assessmentsCount: 4 },
                          { subject: "Gujarati", averagePercentage: 74, assessmentsCount: 3 },
                          { subject: "English", averagePercentage: 68, assessmentsCount: 3 },
                          { subject: "Environmental Studies", averagePercentage: 81, assessmentsCount: 2 },
                        ]
                    ).map((sub: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#FAF6E9]/70 border border-[#49352F]/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#49352F]">{sub.subject}</span>
                          <span className="text-[10px] text-[#7A6862]">{sub.assessmentsCount} Tests</span>
                        </div>
                        <div className="text-2xl font-black text-[#B26A1B]">{sub.averagePercentage}%</div>
                        <div className="w-full h-2 rounded-full bg-white border border-[#49352F]/15 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sub.averagePercentage >= 80 ? "bg-[#2E7D5E]" : sub.averagePercentage >= 60 ? "bg-[#B26A1B]" : "bg-[#C54738]"
                            }`}
                            style={{ width: `${Math.min(100, sub.averagePercentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Complete Assessment History Table */}
                  <div className="pt-4">
                    <h3 className="text-sm font-extrabold text-[#49352F] mb-3">
                      {language === "gu" ? "સંપૂર્ણ મૂલ્યાંકન ઇતિહાસ" : "Complete Assessment Records"}
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-[#49352F]/15 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF6E9] border-b border-[#49352F]/15 text-[#49352F] font-bold">
                          <tr>
                            <th className="py-3 px-4">Assessment Name</th>
                            <th className="py-3 px-4">Concept / Topic</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Marks Obtained</th>
                            <th className="py-3 px-4">Score</th>
                            <th className="py-3 px-4">Mastery Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#49352F]/10">
                          {results.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-[#7A6862]">
                                No assessment records found.
                              </td>
                            </tr>
                          ) : (
                            results.map((r: any) => (
                              <tr key={r.id} className="hover:bg-[#FAF6E9]/40 transition-colors">
                                <td className="py-3 px-4 font-bold text-[#49352F]">{r.assessmentName || "Formative Unit Evaluation"}</td>
                                <td className="py-3 px-4 text-[#7A6862]">{r.conceptName || "Curriculum Benchmark"}</td>
                                <td className="py-3 px-4 text-[#7A6862]">{r.recordedAt ? new Date(r.recordedAt).toLocaleDateString() : "Recent"}</td>
                                <td className="py-3 px-4 font-mono font-bold text-[#49352F]">{r.marksObtained} / {r.maximumMarks}</td>
                                <td className="py-3 px-4">
                                  <span className={`font-black ${r.percentage >= 80 ? "text-[#2E7D5E]" : r.percentage >= 60 ? "text-[#B26A1B]" : "text-[#C54738]"}`}>
                                    {r.percentage}%
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant={r.percentage >= 80 ? "mastered" : r.percentage >= 60 ? "developing" : "needsSupport"} size="sm">
                                    {r.percentage >= 80 ? "Mastered" : r.percentage >= 60 ? "Developing" : "Needs Support"}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LEARNING GAPS & REMEDIAL PATHWAY */}
            {activeTab === "learning-gaps" && (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#49352F] flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-[#B26A1B]" />
                      <span>{language === "gu" ? "શિક્ષણ ત્રુટિઓ અને ૫-પગલાંની ઉપચાર યોજના" : "Learning Gaps & 5-Step Remedial Pathways"}</span>
                    </h2>
                    <p className="text-xs text-[#7A6862]">
                      {language === "gu"
                        ? "બાળક ક્યાં અટકે છે તે સ્પષ્ટ સમજો અને શિક્ષક-માન્ય મૂર્ત સાધનોથી શીખવાની રીત જુઓ"
                        : "Transparent conceptual diagnosis with step-by-step concrete manipulative learning pathways"}
                    </p>
                  </div>

                  {learningGaps.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-[#2E7D5E] mx-auto" />
                      <h4 className="text-sm font-bold text-[#2E7D5E]">
                        {language === "gu" ? "કોઈ સક્રિય ત્રુટિ નોંધાયેલ નથી" : "No Active Gaps Found"}
                      </h4>
                      <p className="text-xs text-[#7A6862]">
                        {activeStudent?.displayName} is currently performing above developing benchmarks across all tested concepts.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningGaps.map((gap: any) => {
                        const matchingPlan = remedialPlans.find((p: any) => p.gapId === gap.id || p.conceptId === gap.conceptId);
                        return (
                          <div
                            key={gap.id}
                            className="p-5 rounded-3xl bg-[#FAF6E9]/60 border border-[#49352F]/15 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
                              <div>
                                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#C54738] block">
                                  Foundational Concept Gap
                                </span>
                                <h3 className="text-base font-black text-[#49352F]">
                                  {gap.conceptName || "Concept Mastery Roadblock"}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="needsSupport" size="sm">
                                  Score: {gap.latestPercentage || gap.scoreRecorded || 35}% (&lt;60% threshold)
                                </Badge>
                                <Badge variant={gap.priority === "High" ? "high" : "medium"} size="sm">
                                  {gap.priority || "Medium"} Priority
                                </Badge>
                              </div>
                            </div>

                            {/* Why Flagged (Pedagogical Root Cause) */}
                            <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 space-y-1">
                              <span className="text-[11px] font-bold text-[#B26A1B] flex items-center gap-1.5">
                                <BrainCircuit className="w-3.5 h-3.5" />
                                <span>{language === "gu" ? "શા માટે ફ્લેગ થયું (શિક્ષણશાસ્ત્રીય કારણ):" : "Why Flagged (Pedagogical Root Cause):"}</span>
                              </span>
                              <p className="text-xs text-[#49352F] leading-relaxed">
                                {gap.reason ||
                                  "Student understands basic division as equal sharing, but stumbles when remainder values are introduced without physical counters."}
                              </p>
                            </div>

                            {/* 5-Step Remedial Plan Steps */}
                            {matchingPlan && matchingPlan.steps && matchingPlan.steps.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <span className="text-xs font-extrabold text-[#49352F] flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-[#2E7D5E]" />
                                  <span>{language === "gu" ? "શિક્ષક-માન્ય ૫-પગલાંની ઉપચાર યોજના:" : "Teacher-Approved 5-Step Concrete Remedial Plan:"}</span>
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                  {matchingPlan.steps.map((st: any, sIdx: number) => {
                                    const isDone = st.completed || sIdx === 0;
                                    return (
                                      <div
                                        key={sIdx}
                                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                          isDone
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
                                            : "bg-white border-[#49352F]/15 text-[#7A6862]"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-bold">Step {sIdx + 1}</span>
                                          {isDone ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          ) : (
                                            <Clock className="w-3.5 h-3.5 text-[#7A6862]" />
                                          )}
                                        </div>
                                        <p className="text-[11px] font-semibold leading-tight">{st.title || `Concrete Activity ${sIdx + 1}`}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: MY CHILDREN */}
            {activeTab === "children" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#49352F]">
                      {language === "gu" ? "મારા બાળકોની યાદી" : "Authorized Linked Children"}
                    </h2>
                    <p className="text-xs text-[#7A6862]">
                      {language === "gu"
                        ? "તમારા ખાતા સાથે જોડાયેલા બાળકો અને શાળાનું સત્તાવાર રેકોર્ડ"
                        : "Children linked to your parent account verified by school authority"}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setLinkError(null);
                      setLinkSuccess(null);
                      setLinkModalOpen(true);
                    }}
                    className="rounded-xl text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>{language === "gu" ? "બીજું બાળક જોડો" : "Link Another Child"}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {linkedStudents.map((ch: any) => {
                    const isSelected = ch.id === selectedStudentId;
                    return (
                      <div
                        key={ch.id}
                        className={`p-5 rounded-3xl border transition-all ${
                          isSelected
                            ? "bg-white border-2 border-[#B26A1B] shadow-md"
                            : "bg-white/80 border-[#49352F]/15 hover:border-[#49352F]/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 flex items-center justify-center font-black text-lg text-[#49352F]">
                              {ch.displayName?.charAt(0) || "S"}
                            </div>
                            <div>
                              <h3 className="font-heading text-base font-extrabold text-[#49352F]">{ch.displayName}</h3>
                              <p className="text-xs text-[#7A6862]">
                                Class {ch.grade}-{ch.section} &bull; Roll #{ch.rollNumber || "01"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="mastered" size="sm">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified Link
                          </Badge>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex items-center justify-between text-xs">
                          <span className="text-[#7A6862] flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />
                            Model Primary School, Gandhinagar
                          </span>
                          <button
                            onClick={() => {
                              setSelectedStudentId(ch.id);
                              setActiveTab("overview");
                            }}
                            className="font-bold text-[#B26A1B] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{language === "gu" ? "વિહંગાવલોકન જુઓ →" : "View Dashboard →"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: TEACHER COMMUNICATION */}
            {activeTab === "communication" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Send inquiry */}
                  <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                    <div>
                      <h2 className="font-heading text-base font-black text-[#49352F] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#B26A1B]" />
                        <span>{language === "gu" ? "વર્ગ શિક્ષકને પૂછપરછ અથવા નોંધ મોકલો" : "Send Inquiry to Class Teacher"}</span>
                      </h2>
                      <p className="text-xs text-[#7A6862]">
                        {language === "gu"
                          ? `${activeStudent?.displayName} ના વર્ગ શિક્ષક પૂજા શર્માને સંદેશ મોકલો. અંગત ફોન નંબર જાહેર કર્યા વગર સુરક્ષિત સંચાર.`
                          : `Direct pedagogical communication with ${activeStudent?.displayName}'s teacher without exchanging private phone numbers.`}
                      </p>
                    </div>

                    {msgSuccess && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{msgSuccess}</span>
                      </div>
                    )}

                    {msgError && (
                      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-900 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{msgError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#49352F] block">
                          {language === "gu" ? "વિષય *" : "Subject *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={msgSubject}
                          onChange={(e) => setMsgSubject(e.target.value)}
                          placeholder={language === "gu" ? "દા.ત. ગણિત હોમવર્ક અને ઉપચાર યોજના બાબત" : "e.g. Inquiring about Mathematics remedial worksheet"}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#49352F] block">
                          {language === "gu" ? "તમારો સંદેશ *" : "Message / Query *"}
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                          placeholder={
                            language === "gu"
                              ? "શિક્ષક માટે તમારો પ્રશ્ન અથવા વર્ગ પછી મળવાનો સમય વિનંતી લખો..."
                              : "Write your question for the teacher or request consultation timing..."
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={msgSending}
                        className="py-2.5 px-5 rounded-xl bg-[#261B16] text-[#FAF6E9] text-xs font-bold flex items-center gap-2 hover:bg-[#49352F] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 text-[#F2CAB3]" />
                        <span>{msgSending ? "Sending..." : language === "gu" ? "સંદેશ મોકલો" : "Submit Inquiry"}</span>
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Teacher Hours & Message History */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3">
                      <h3 className="text-sm font-extrabold text-[#49352F] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#B26A1B]" />
                        <span>Consultation Timings</span>
                      </h3>
                      <p className="text-xs text-[#7A6862] leading-relaxed">
                        Class teachers are available for parent meetings every weekday from <strong>3:15 PM – 4:00 PM</strong> at the primary school staff room.
                      </p>
                      <div className="p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs text-[#7A6862]">
                        <span className="font-bold text-[#49352F] block">Assigned Teacher:</span>
                        <span>Pooja Sharma (Class 4-A In-Charge)</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3">
                      <h3 className="text-sm font-extrabold text-[#49352F]">Past Conversations</h3>
                      {pastMessages.length === 0 ? (
                        <p className="text-xs text-[#7A6862]">No previous inquiries submitted.</p>
                      ) : (
                        <div className="space-y-2">
                          {pastMessages.map((m: any) => (
                            <div key={m.id} className="p-3 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-[#49352F]">
                                <span>{m.subject}</span>
                                <Badge variant={m.status === "replied" ? "mastered" : "default"} size="sm">
                                  {m.status}
                                </Badge>
                              </div>
                              <p className="text-[#7A6862] text-[11px]">{m.message}</p>
                              {m.reply && (
                                <div className="mt-1 p-2 rounded-lg bg-emerald-50 text-emerald-950 text-[11px] border border-emerald-200">
                                  <strong>Teacher reply:</strong> {m.reply}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SCHOOL NOTICES */}
            {activeTab === "notices" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-lg font-black text-[#49352F] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#B26A1B]" />
                    <span>{language === "gu" ? "શાળા પરિપત્રો અને સૂચનાઓ" : "Official School Notices & Announcements"}</span>
                  </h2>
                  <p className="text-xs text-[#7A6862]">
                    {language === "gu"
                      ? "પ્રાથમિક શાળા દ્વારા બહાર પાડવામાં આવેલ મહત્વપૂર્ણ પરિપત્રો અને કાર્યક્રમો"
                      : "Official circulars and meeting announcements applicable to your ward"}
                  </p>
                </div>

                <div className="space-y-4">
                  {notices.map((n: any) => (
                    <div
                      key={n.id}
                      className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-[#B26A1B]">
                              {n.category || "Announcement"}
                            </span>
                            {n.urgency === "urgent" && <Badge variant="needsSupport" size="sm">Urgent</Badge>}
                          </div>
                          <h3 className="text-base font-extrabold text-[#49352F]">{n.title}</h3>
                        </div>
                        <span className="text-xs text-[#7A6862] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent"}
                        </span>
                      </div>

                      <p className="text-xs text-[#49352F] leading-relaxed">
                        {n.simplifiedContent || n.originalContent}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#49352F]/10 text-xs">
                        <span className="text-[#7A6862]">
                          Issued by: <strong>{n.senderTeacherName || "Head Teacher"}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const utterance = new SpeechSynthesisUtterance(n.simplifiedContent || n.originalContent);
                              utterance.lang = "gu-IN";
                              window.speechSynthesis?.speak(utterance);
                            }}
                            className="px-3 py-1 rounded-xl bg-[#FAF6E9] border border-[#49352F]/15 text-[#B26A1B] font-bold text-xs flex items-center gap-1.5 hover:bg-[#F2CAB3]/30 transition-all cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{language === "gu" ? "ઓડિયો સાંભળો" : "Listen (Gujarati Audio)"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 5. MODAL: LINK ANOTHER CHILD */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#49352F]/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-3">
              <h3 className="font-heading text-base font-black text-[#49352F] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#B26A1B]" />
                <span>{language === "gu" ? "બીજું બાળક જોડો" : "Link Another Child"}</span>
              </h3>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="text-[#7A6862] hover:text-[#49352F] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A6862] leading-relaxed">
              {language === "gu"
                ? "તમારા બીજા બાળકના વર્ગ શિક્ષક પાસેથી ૬-અક્ષરનો વેરિફિકેશન કોડ મેળવીને અહીં દાખલ કરો."
                : "Enter the secure linking code generated by your other child's class teacher (e.g. PAR-5219)."}
            </p>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <input
                type="text"
                required
                value={linkingCodeInput}
                onChange={(e) => setLinkingCodeInput(e.target.value.toUpperCase())}
                placeholder="PAR-XXXX"
                className="w-full text-center px-4 py-3 rounded-2xl border-2 border-[#B26A1B] font-mono text-base font-bold text-[#B26A1B] uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:text-xs"
              />

              {linkError && <p className="text-xs text-rose-600 font-semibold">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-emerald-600 font-semibold">{linkSuccess}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLinkModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={linkLoading}
                  className="rounded-xl text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10]"
                >
                  {linkLoading ? "Verifying..." : "Verify & Connect"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#7A6862] border-t border-[#49352F]/10">
        <p>
          StudySaathi AI &bull; {language === "gu" ? "વાલી-શિક્ષક સહભાગિતા સેતુ" : "Parent-Teacher Engagement Bridge"}{" "}
          &bull; Primary Education Department, Gujarat
        </p>
      </footer>
    </div>
  );
}


export default function ParentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6E9] flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-white shadow-md text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#B26A1B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#49352F]">Loading Parent Portal...</p>
          </div>
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}
