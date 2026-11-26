"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { useLanguage } from "@/context/LanguageContext";
import { normalizePriority } from "@/lib/learningGapFormatters";
import { getRoleAwareGapInterpretation } from "@/lib/engine/roleAwareGapEngine";
import { LinkChildModal, type LinkedChildSummary } from "@/components/parent/LinkChildModal";
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
  Check,
  CheckSquare,
  Square,
  Home,
  FileText,
  RotateCcw,
  Wrench,
} from "lucide-react";

function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tr, language, formatClass, formatPriority, formatSubject, formatStatus, formatDate } = useLanguage();
  const pp = t.parentPortal;
  const showGuField = language === "gu";

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

  // Real-time synchronization state
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activityLoading, setActivityLoading] = useState<Record<string, boolean>>({});

  // Link child modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingCodeInput, setLinkingCodeInput] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkErrorCode, setLinkErrorCode] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [newlyLinkedChild, setNewlyLinkedChild] = useState<LinkedChildSummary | null>(null);

  // Teacher inquiry message form
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [pastMessages, setPastMessages] = useState<any[]>([]);

  // 1. Fetch authenticated parent profile and linked students
  const fetchParentProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetch("/api/parent/me", { cache: "no-store" });
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
        setSelectedStudentId((prev) => prev || students[0].id);
      }
    } catch (err: any) {
      setError(err.message || pp.loadInfoError);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 2. Fetch selected student details (scores, gaps, remedial plans, notices, home activities)
  const fetchStudentDetail = async (studentId: string, silent = false) => {
    try {
      if (!silent) setDetailLoading(true);
      else setIsSyncing(true);

      const res = await fetch(`/api/parent/students/${studentId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch student details");
      }

      setStudentDetail(data);
      setLastUpdatedTime(new Date());
    } catch (err: any) {
      console.error("Error loading student detail:", err);
    } finally {
      if (!silent) setDetailLoading(false);
      else setIsSyncing(false);
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

  // 4. Real-time background synchronization (every 20s) and focus revalidation
  useEffect(() => {
    if (!selectedStudentId) return;

    let intervalId: NodeJS.Timeout | null = null;

    const performSync = () => {
      if (document.visibilityState === "visible" && selectedStudentId) {
        fetchStudentDetail(selectedStudentId, true);
      }
    };

    window.addEventListener("focus", performSync);
    document.addEventListener("visibilitychange", performSync);

    intervalId = setInterval(performSync, 20000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("focus", performSync);
      document.removeEventListener("visibilitychange", performSync);
    };
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
    const cleanedCode = linkingCodeInput.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanedCode) {
      setLinkErrorCode("INVALID_CODE");
      setLinkError(
        language === "gu"
          ? "કૃપા કરીને શાળા દ્વારા આપવામાં આવેલ વેરિફિકેશન કોડ દાખલ કરો."
          : "Please enter the verification code provided by your school."
      );
      return;
    }

    setLinkLoading(true);
    setLinkError(null);
    setLinkErrorCode(null);
    setLinkSuccess(null);
    setNewlyLinkedChild(null);

    try {
      const res = await fetch("/api/parent/link-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanedCode }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLinkErrorCode(data.errorCode || "INVALID_CODE");
        throw new Error(data.error || "Invalid verification code. Please check the code provided by your school.");
      }

      const linkedSummary: LinkedChildSummary | null = data.student
        ? {
            id: data.student.id,
            displayName: data.student.displayName,
            studentCode: data.student.studentCode,
            grade: data.student.grade,
            section: data.student.section,
            schoolName: data.school?.name || "Model Primary School, Gandhinagar",
          }
        : null;

      setNewlyLinkedChild(linkedSummary);
      setLinkSuccess(tr("parentPortal.linkSuccessMsg", { name: data.student?.displayName || pp.studentFallback }));
      setLinkingCodeInput("");

      // Refresh parent profile & linked students silently so UI updates smoothly
      await fetchParentProfile(true);
      if (data.studentId) {
        setSelectedStudentId(data.studentId);
      }
    } catch (err: any) {
      setLinkError(err.message || pp.redeemCodeFailError);
    } finally {
      setLinkLoading(false);
    }
  };

  const openLinkChildModal = () => {
    setLinkError(null);
    setLinkErrorCode(null);
    setLinkSuccess(null);
    setNewlyLinkedChild(null);
    setLinkModalOpen(true);
  };

  // Handle Home Activity Completion Toggle
  const handleToggleActivity = async (activityId: string, conceptId?: string, currentCompleted = false) => {
    if (!selectedStudentId) return;

    const newCompleted = !currentCompleted;

    // Optimistic UI update
    setStudentDetail((prev: any) => {
      if (!prev || !prev.homeActivities) return prev;
      return {
        ...prev,
        homeActivities: prev.homeActivities.map((act: any) => {
          if (act.id === activityId) {
            return {
              ...act,
              completed: newCompleted,
              completedAt: newCompleted ? new Date().toISOString() : null,
            };
          }
          return act;
        }),
      };
    });

    setActivityLoading((prev) => ({ ...prev, [activityId]: true }));

    try {
      const res = await fetch("/api/parent/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          activityId,
          conceptId,
          completed: newCompleted,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback optimistic update
        setStudentDetail((prev: any) => {
          if (!prev || !prev.homeActivities) return prev;
          return {
            ...prev,
            homeActivities: prev.homeActivities.map((act: any) => {
              if (act.id === activityId) {
                return {
                  ...act,
                  completed: currentCompleted,
                };
              }
              return act;
            }),
          };
        });
        alert(data.error || pp.activityUpdateFailAlert);
      } else {
        setLastUpdatedTime(new Date());
      }
    } catch (e: any) {
      console.error("Activity completion error:", e);
    } finally {
      setActivityLoading((prev) => ({ ...prev, [activityId]: false }));
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

      setMsgSuccess(pp.msgSentSuccess);
      setMsgSubject("");
      setMsgBody("");
      fetchMessages();

      setTimeout(() => setMsgSuccess(null), 4000);
    } catch (err: any) {
      setMsgError(err.message || pp.sendMsgFailError);
    } finally {
      setMsgSending(false);
    }
  };

  // Active student object
  const activeStudent = studentDetail?.student || linkedStudents.find((s) => s.id === selectedStudentId);

  // Calculate overview metrics from real database data
  const results = studentDetail?.results || [];
  const learningGaps = studentDetail?.learningGaps || [];
  const remedialPlans = studentDetail?.remedialPlans || [];
  const homeActivities = studentDetail?.homeActivities || [];
  const notices = studentDetail?.notices || [];

  const averageScore = results.length > 0
    ? Math.round(results.reduce((acc: number, r: any) => acc + (r.percentage || 0), 0) / results.length)
    : 0;

  const activeGapsCount = learningGaps.filter((g: any) => g.status === "Active" || g.status === "active").length;
  const completedRemedialSteps = remedialPlans.reduce(
    (acc: number, p: any) => acc + (Array.isArray(p.completedSteps) ? p.completedSteps.length : (p.completedSteps || 0)),
    0
  );
  const completedHomeActivitiesCount = homeActivities.filter((a: any) => a.completed).length;

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
              <span>{pp.parentBridgeBadge}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="default" />
            <ThemeToggle variant="button" />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-[#49352F]/15 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{pp.signOutBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-HEADER / WELCOME & CHILD SWITCHER */}
      <section className="bg-white/60 border-b border-[#49352F]/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#49352F] tracking-tight">
                <span>{pp.welcomePrefix}</span>
                <span className="text-[#B26A1B]">{parentData?.user?.name || pp.respectedParentFallback}</span>
              </h1>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#B26A1B]/15 text-[#B26A1B]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xs text-[#7A6862] mt-0.5">
              {pp.dashboardSubtitle}
            </p>
          </div>

          {/* Real-time Live Sync Indicator & Child Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
              <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isSyncing ? "animate-ping" : "animate-pulse"}`} />
              <span>{pp.liveSyncLabel}</span>
            </div>
            {lastUpdatedTime && (
              <span className="text-[11px] text-[#7A6862] hidden sm:inline">
                {pp.updatedLabel}
                {lastUpdatedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}

            {/* Child Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2 ml-1">
              {linkedStudents.map((child: any) => {
                const isSelected = child.id === selectedStudentId;
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedStudentId(child.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#261B16] text-[#FAF6E9] shadow-sm"
                        : "bg-white border border-[#49352F]/15 text-[#49352F] hover:bg-[#FAF6E9]"
                    }`}
                  >
                    <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? "text-[#F2CAB3]" : "text-[#B26A1B]"}`} />
                    <span>{child.displayName}</span>
                    <span className="text-[10px] opacity-75">
                      ({formatClass(child.grade, child.section) || pp.studentFallback})
                    </span>
                  </button>
                );
              })}

              {/* Link Another Child Button */}
              <button
                type="button"
                onClick={openLinkChildModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[#B26A1B]/50 hover:border-[#B26A1B] bg-[#FAF6E9] hover:bg-[#F2CAB3]/30 text-[#B26A1B] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{pp.linkChildPlusBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NAVIGATION TABS */}
      <nav className="bg-white/40 border-b border-[#49352F]/10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex overflow-x-auto gap-2 py-2.5 no-scrollbar">
          {[
            { id: "overview", label: pp.tabOverview, icon: BookOpen },
            { id: "progress", label: pp.tabProgress, icon: TrendingUp },
            { id: "learning-gaps", label: pp.tabLearningGaps, icon: BrainCircuit },
            { id: "home-activities", label: pp.tabHomeActivities, icon: Home, count: homeActivities.length },
            { id: "children", label: pp.tabChildren, icon: Users },
            { id: "communication", label: pp.tabCommunication, icon: MessageSquare },
            { id: "notices", label: pp.tabNotices, icon: Bell },
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
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#B26A1B]/15 text-[#B26A1B]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Direct ClassConnect WhatsApp-style Chat Link */}
          <Link
            href="/connect"
            className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer bg-[#2E7D5E] text-white hover:bg-[#24634B] shadow-xs ml-auto"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            <span>{pp.connectChatBtn}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-[#2E7D5E]">
              {pp.liveBadge}
            </span>
          </Link>
        </div>
      </nav>

      {/* 4. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 animate-spin text-[#B26A1B] mx-auto" />
            <p className="text-sm font-bold text-[#49352F]">
              {pp.loadingPortal}
            </p>
          </div>
        ) : linkedStudents.length === 0 ? (
          /* Empty State: No child linked yet */
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm text-center max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF6E9] border border-[#49352F]/15 mx-auto flex items-center justify-center text-[#B26A1B]">
              <KeyRound className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-[#49352F]">
                {pp.linkProfileHeading}
              </h2>
              <p className="text-xs text-[#7A6862] leading-relaxed">
                {pp.linkProfileDesc}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 text-left text-[11px] text-[#49352F] space-y-1">
              <p className="font-bold">
                {language === "gu" ? "કોડ કેવી રીતે મેળવવો?" : "How to obtain your verification code:"}
              </p>
              <p className="text-[#7A6862] leading-relaxed">
                {language === "gu"
                  ? "તમારા બાળકના વર્ગ શિક્ષક StudySaathi માં વિદ્યાર્થીની પ્રોફાઇલ ખોલીને 'Parent Link Code' બટન પરથી કોડ બનાવી આપશે."
                  : "Ask your child's teacher or school administrator to open your child's Student Profile in StudySaathi and click \"Parent Link Code\" → \"+ Generate Code\"."}
              </p>
            </div>

            <form onSubmit={handleRedeemCode} className="space-y-3 pt-1">
              <label htmlFor="empty-state-link-code" className="sr-only">
                {language === "gu" ? "શાળા ચકાસણી કોડ" : "School Verification Code"}
              </label>
              <input
                id="empty-state-link-code"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                maxLength={32}
                disabled={linkLoading}
                value={linkingCodeInput}
                onChange={(e) => setLinkingCodeInput(e.target.value.toUpperCase())}
                placeholder="PAR-XXXX"
                className="w-full max-w-xs mx-auto text-center px-4 py-3 rounded-2xl border-2 border-[#B26A1B] bg-[#FAF6E9]/40 font-mono text-base font-bold text-[#B26A1B] uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:text-xs focus:outline-none focus:ring-4 focus:ring-[#B26A1B]/20 disabled:opacity-60"
              />
              {linkError && (
                <p role="alert" className="text-xs text-rose-700 font-semibold max-w-sm mx-auto bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {linkError}
                </p>
              )}
              {linkSuccess && (
                <p role="status" className="text-xs text-emerald-700 font-semibold max-w-sm mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  {linkSuccess}
                </p>
              )}
              <div>
                <Button
                  type="submit"
                  disabled={linkLoading || !linkingCodeInput.trim()}
                  className="rounded-xl px-6 py-2.5 text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10] disabled:opacity-50"
                >
                  {linkLoading ? pp.verifyingBtn : pp.verifyConnectBtn}
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
                          {results.length > 0 && (
                            <Badge variant={averageScore >= 80 ? "mastered" : averageScore >= 60 ? "developing" : "needsSupport"} size="sm">
                              {averageScore >= 80 ? pp.masteryThresholdBadge : averageScore >= 60 ? pp.developingThresholdBadge : pp.supportNeededThresholdBadge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#7A6862] flex flex-wrap items-center gap-2 mt-0.5">
                          {formatClass(activeStudent?.grade, activeStudent?.section) && (
                            <>
                              <span>{formatClass(activeStudent?.grade, activeStudent?.section)}</span>
                              <span>&bull;</span>
                            </>
                          )}
                          <span>{pp.studentCodePrefix} {activeStudent?.studentCode}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-[#7A6862]" />
                            {studentDetail?.school?.name || pp.defaultSchoolName}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={detailLoading}
                        onClick={() => fetchStudentDetail(selectedStudentId!)}
                        className="rounded-xl text-xs border-[#49352F]/20 text-[#49352F]"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${detailLoading ? "animate-spin" : ""}`} />
                        <span>{pp.refreshBtn}</span>
                      </Button>
                    </div>
                  </div>

                  {/* 4 Quick Stat Counters from Real Database */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#49352F]/10">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {pp.averageScoreLabel}
                      </span>
                      <span className="text-2xl font-black text-[#B26A1B]">{averageScore}%</span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">{tr("parentPortal.assessmentsCount", { count: results.length })}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {pp.activeLearningGapsLabel}
                      </span>
                      <span className={`text-2xl font-black ${activeGapsCount > 0 ? "text-[#C54738]" : "text-[#2E7D5E]"}`}>
                        {activeGapsCount}
                      </span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">{pp.thresholdHint}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {pp.homeActivitiesDoneLabel}
                      </span>
                      <span className="text-2xl font-black text-[#2E7D5E]">
                        {completedHomeActivitiesCount} / {homeActivities.length}
                      </span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">{pp.householdMaterialsHint}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 text-center shadow-xs">
                      <span className="text-[11px] font-semibold text-[#7A6862] block">
                        {pp.schoolNoticesLabel}
                      </span>
                      <span className="text-2xl font-black text-[#49352F]">{notices.length}</span>
                      <span className="text-[10px] text-[#7A6862] block mt-0.5">{tr("parentPortal.targetedToClass", { classLabel: formatClass(activeStudent?.grade) || `${activeStudent?.grade || ""}` })}</span>
                    </div>
                  </div>
                </div>

                {/* Home Learning Activities Priority Section */}
                {homeActivities.length > 0 && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading text-base font-extrabold text-[#49352F] flex items-center gap-2">
                          <Home className="w-4 h-4 text-[#B26A1B]" />
                          <span>{pp.homeHelpHeading}</span>
                        </h3>
                        <p className="text-xs text-[#7A6862]">
                          {pp.homeHelpSubtitle}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("home-activities")}
                        className="text-xs font-bold text-[#B26A1B] hover:underline flex items-center gap-1"
                      >
                        <span>{pp.viewAllActivitiesBtn}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {homeActivities.slice(0, 2).map((act: any) => (
                        <div
                          key={act.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            act.completed
                              ? "bg-emerald-50/60 border-emerald-500/30"
                              : "bg-[#FAF6E9]/70 border-[#49352F]/15"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B26A1B] block">
                                {act.conceptName}
                              </span>
                              <h4 className="text-sm font-bold text-[#49352F]">
                                {showGuField ? act.titleGujarati || act.title : act.title}
                              </h4>
                            </div>
                            <span className="text-[11px] font-semibold text-[#7A6862] flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />
                              {act.estimatedMinutes} {pp.minsUnit}
                            </span>
                          </div>

                          <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-[#49352F]/10 text-xs text-[#49352F]">
                            <span className="font-bold text-[#B26A1B] block text-[11px] mb-1">
                              {pp.materialsNeededLabel}
                            </span>
                            <span className="text-[#7A6862]">
                              {Array.isArray(showGuField ? act.materialsGu : act.materialsEn)
                                ? (showGuField ? act.materialsGu : act.materialsEn).join(", ")
                                : act.materialsEn || pp.householdCountersFallback}
                            </span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-[#49352F]/10 flex items-center justify-between">
                            <span className="text-[11px] text-[#7A6862]">
                              {act.completed ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  {pp.completedLabel}
                                </span>
                              ) : (
                                pp.pendingPracticeLabel
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant={act.completed ? "outline" : "saffron"}
                              disabled={activityLoading[act.id]}
                              onClick={() => handleToggleActivity(act.id, act.conceptId, act.completed)}
                              className="rounded-xl text-xs font-bold"
                            >
                              {act.completed ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  {pp.doneBtn}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Square className="w-3.5 h-3.5" />
                                  {pp.markDoneBtn}
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Two Column Grid: Recent Assessments & Learning Gaps */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Recent Assessments */}
                  <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-base font-extrabold text-[#49352F] flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#B26A1B]" />
                        <span>{pp.recentAssessmentsHeading}</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab("progress")}
                        className="text-xs font-bold text-[#B26A1B] hover:underline flex items-center gap-1"
                      >
                        <span>{pp.viewAllBtn}</span>
                      </button>
                    </div>

                    {results.length === 0 ? (
                      <p className="text-xs text-[#7A6862] p-4 text-center">{pp.noAssessmentsMsg}</p>
                    ) : (
                      <div className="space-y-3">
                        {results.slice(0, 4).map((r: any) => (
                          <div
                            key={r.id}
                            className="p-3 rounded-2xl bg-[#FAF6E9]/60 border border-[#49352F]/10 flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-[#49352F] block">
                                {r.assessmentName || pp.formativeEvaluationFallback}
                              </span>
                              <span className="text-[11px] text-[#7A6862]">
                                {r.recordedAt ? formatDate(r.recordedAt) : pp.recentLabel} &bull; {pp.marksLabel} {r.marksObtained}/{r.maximumMarks}
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
                                {r.percentage >= 80 ? formatStatus("Mastered") : r.percentage >= 60 ? formatStatus("Developing") : formatStatus("Needs Support")}
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
                        <span>{pp.activeGapsHeading}</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab("learning-gaps")}
                        className="text-xs font-bold text-[#B26A1B] hover:underline flex items-center gap-1"
                      >
                        <span>{pp.viewRemedialPlanBtn}</span>
                      </button>
                    </div>

                    {learningGaps.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-[#2E7D5E] mx-auto" />
                        <p className="text-xs font-bold text-[#2E7D5E]">
                          {pp.noActiveGapsMsg}
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
                                {gap.conceptName || pp.foundationalConceptFallback}
                              </span>
                              <Badge
                                variant={
                                  normalizePriority(gap.priority) === "High Priority"
                                    ? "high"
                                    : normalizePriority(gap.priority) === "Medium Priority"
                                    ? "medium"
                                    : "low"
                                }
                                size="sm"
                              >
                                {formatPriority(gap.priority)}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#7A6862] leading-relaxed">
                              {gap.reason || pp.gapBelowThresholdReason}
                            </p>
                            <div className="pt-1 flex items-center justify-between text-[11px] text-[#7A6862]">
                              <span>{tr("parentPortal.latestScoreLabel", { score: gap.latestPercentage || gap.scoreRecorded || 35 })}</span>
                              <span className="font-semibold text-[#B26A1B]">
                                {gap.remedialPlanId ? pp.activePlanInProgress : pp.planRecommended}
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
                      {pp.consultationHoursHeading}
                    </span>
                    <h4 className="text-sm font-black text-[#49352F]">
                      {pp.consultationHoursSchedule}
                    </h4>
                    <p className="text-xs text-[#7A6862]">
                      {pp.consultationHoursDesc}
                    </p>
                  </div>
                  <Link
                    href="/connect"
                    className="px-4 py-2.5 rounded-xl bg-[#2E7D5E] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#24634B] transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                    <span>{pp.chatWithTeacherLiveBtn}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC PROGRESS */}
            {activeTab === "progress" && (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#49352F]">
                      {pp.subjectPerformanceHeading}
                    </h2>
                    <p className="text-xs text-[#7A6862]">
                      {pp.subjectPerformanceSubtitle}
                    </p>
                  </div>

                  {/* Subject Proficiency Cards from Real Results */}
                  {studentDetail?.subjectBreakdown && studentDetail.subjectBreakdown.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {studentDetail.subjectBreakdown.map((sub: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-[#FAF6E9]/70 border border-[#49352F]/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#49352F]">{formatSubject(sub.subject)}</span>
                            <span className="text-[10px] text-[#7A6862]">{tr("parentPortal.testsCount", { count: sub.assessmentsCount })}</span>
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
                  ) : (
                    <div className="p-6 text-center text-xs text-[#7A6862] bg-[#FAF6E9]/40 rounded-2xl border border-[#49352F]/10">
                      {pp.noSubjectAveragesMsg}
                    </div>
                  )}

                  {/* Complete Assessment History Table */}
                  <div className="pt-4">
                    <h3 className="text-sm font-extrabold text-[#49352F] mb-3">
                      {pp.completeRecordsHeading}
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-[#49352F]/15 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF6E9] border-b border-[#49352F]/15 text-[#49352F] font-bold">
                          <tr>
                            <th className="py-3 px-4">{pp.thAssessmentName}</th>
                            <th className="py-3 px-4">{pp.thConceptTopic}</th>
                            <th className="py-3 px-4">{pp.thDate}</th>
                            <th className="py-3 px-4">{pp.thMarksObtained}</th>
                            <th className="py-3 px-4">{pp.thScore}</th>
                            <th className="py-3 px-4">{pp.thMasteryLevel}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#49352F]/10">
                          {results.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-[#7A6862]">
                                {pp.noRecordsInDb}
                              </td>
                            </tr>
                          ) : (
                            results.map((r: any) => (
                              <tr key={r.id} className="hover:bg-[#FAF6E9]/40 transition-colors">
                                <td className="py-3 px-4 font-bold text-[#49352F]">{r.assessmentName || pp.formativeUnitFallback}</td>
                                <td className="py-3 px-4 text-[#7A6862]">{r.conceptName || pp.curriculumBenchmarkFallback}</td>
                                <td className="py-3 px-4 text-[#7A6862]">{r.recordedAt ? formatDate(r.recordedAt) : pp.recentLabel}</td>
                                <td className="py-3 px-4 font-mono font-bold text-[#49352F]">{r.marksObtained} / {r.maximumMarks}</td>
                                <td className="py-3 px-4">
                                  <span className={`font-black ${r.percentage >= 80 ? "text-[#2E7D5E]" : r.percentage >= 60 ? "text-[#B26A1B]" : "text-[#C54738]"}`}>
                                    {r.percentage}%
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant={r.percentage >= 80 ? "mastered" : r.percentage >= 60 ? "developing" : "needsSupport"} size="sm">
                                    {r.percentage >= 80 ? formatStatus("Mastered") : r.percentage >= 60 ? formatStatus("Developing") : formatStatus("Needs Support")}
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
                      <span>{pp.gapsPathwaysHeading}</span>
                    </h2>
                    <p className="text-xs text-[#7A6862]">
                      {pp.gapsPathwaysSubtitle}
                    </p>
                  </div>

                  {learningGaps.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-[#2E7D5E] mx-auto" />
                      <h4 className="text-sm font-bold text-[#2E7D5E]">
                        {pp.noActiveGapsHeading}
                      </h4>
                      <p className="text-xs text-[#7A6862]">
                        {tr("parentPortal.noActiveGapsSubtitle", { name: activeStudent?.displayName || pp.yourChildFallback })}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningGaps.map((gap: any) => {
                        const matchingPlan = remedialPlans.find((p: any) => p.gapId === gap.id || p.conceptId === gap.conceptId);
                        const engineLang = showGuField ? "gu" : "en";
                        const interp = getRoleAwareGapInterpretation(
                          {
                            ...gap,
                            studentName: activeStudent?.displayName || gap.studentName,
                          },
                          "parent",
                          engineLang
                        );
                        const act = interp.parentHomeActivity;

                        return (
                          <div
                            key={gap.id}
                            className="p-5 rounded-3xl bg-[#FAF6E9]/60 border border-[#49352F]/15 space-y-4"
                          >
                            {/* Card Header: Topic & Supportive Status */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
                              <div>
                                <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#B26A1B] block">
                                  {pp.currentFocusEyebrow}
                                </span>
                                <h3 className="text-base font-black text-[#49352F]">
                                  {interp.growthFocus || gap.conceptName || pp.curricularConceptFallback}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={interp.badgeVariant as BadgeVariant} size="sm">
                                  {interp.badgeLabel}
                                </Badge>
                              </div>
                            </div>

                            {/* Section 1: Strengths & What child does well */}
                            <div className="p-4 rounded-2xl bg-white border border-[#2E7D5E]/20 space-y-1.5 shadow-xs">
                              <span className="text-xs font-bold text-[#2E7D5E] flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-[#2E7D5E] shrink-0" />
                                <span>{tr("parentPortal.whatChildDoingWell", { name: activeStudent?.displayName || pp.yourChildFallback })}</span>
                              </span>
                              <p className="text-xs text-[#49352F] leading-relaxed">
                                {interp.strengthsSummary}
                              </p>
                            </div>

                            {/* Section 2: Progress & Teacher Guidance */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 space-y-1">
                                <span className="text-[11px] font-bold text-[#49352F] flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-[#B26A1B]" />
                                  <span>{pp.classroomProgressLabel}</span>
                                </span>
                                <p className="text-xs text-[#7A6862] leading-relaxed">
                                  {interp.progressNarrative}
                                </p>
                              </div>

                              <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 space-y-1">
                                <span className="text-[11px] font-bold text-[#49352F] flex items-center gap-1.5">
                                  <GraduationCap className="w-3.5 h-3.5 text-[#2E7D5E]" />
                                  <span>{pp.teacherRecommendationLabel}</span>
                                </span>
                                <p className="text-xs text-[#49352F] leading-relaxed">
                                  {interp.teacherRecommendation}
                                </p>
                                {interp.reassessmentUpdate && (
                                  <div className="text-[11px] text-[#B26A1B] font-semibold pt-1 flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3 shrink-0" />
                                    <span>{interp.reassessmentUpdate}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Section 3: One Simple 5-Minute Home Activity */}
                            {act && (
                              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF6E9] to-white border border-[#B26A1B]/30 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-1.5">
                                  <span className="font-heading font-extrabold text-xs text-[#B26A1B] flex items-center gap-1.5">
                                    <Home className="w-4 h-4 text-[#B26A1B]" />
                                    <span>{pp.oneMinuteHomeActivity}</span>
                                  </span>
                                  <Badge variant="mint" size="sm">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {act.durationMinutes} {pp.minsUnit}
                                  </Badge>
                                </div>

                                <div>
                                  <h4 className="font-bold text-xs text-[#49352F]">{act.title}</h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {act.commonHouseholdMaterials.map((m: string, mIdx: number) => (
                                      <span
                                        key={mIdx}
                                        className="px-2 py-0.5 rounded-full bg-white border border-[#49352F]/10 text-[10.5px] text-[#7A6862] inline-flex items-center gap-1"
                                      >
                                        <Wrench className="w-2.5 h-2.5 text-[#B26A1B] shrink-0" />
                                        <span>{m}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-xs text-[#49352F]">
                                  <p className="leading-snug">
                                    <strong>{pp.whatToDoLabel}</strong> {act.whatParentDoes}
                                  </p>
                                  <p className="italic text-[#8D4E10] text-[11px] bg-white/70 p-2 rounded-xl border border-[#49352F]/8 flex items-start gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5 text-[#B26A1B] shrink-0 mt-0.5 not-italic" />
                                    <span><strong>{pp.conversationalPromptLabel}</strong> {act.conversationalPrompt}</span>
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Section 4: Teacher-Approved 5-Step Remedial Plan Steps (if active) */}
                            {matchingPlan && matchingPlan.steps && matchingPlan.steps.length > 0 && (
                              <div className="space-y-2 pt-1 border-t border-[#49352F]/10">
                                <span className="text-xs font-extrabold text-[#49352F] flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-[#2E7D5E]" />
                                  <span>{pp.approvedPlanLabel}</span>
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                  {matchingPlan.steps.map((st: any, sIdx: number) => {
                                    const isDone = Boolean(st.completed);
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
                                          <span className="text-[10px] font-bold">{tr("parentPortal.stepLabel", { step: sIdx + 1 })}</span>
                                          {isDone ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          ) : (
                                            <Clock className="w-3.5 h-3.5 text-[#7A6862]" />
                                          )}
                                        </div>
                                        <p className="text-[11px] font-semibold leading-tight">{st.title || tr("parentPortal.concreteActivityLabel", { step: sIdx + 1 })}</p>
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

            {/* TAB 4: HELP AT HOME (PRACTICAL HOME ACTIVITIES) */}
            {activeTab === "home-activities" && (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#49352F] flex items-center gap-2">
                      <Home className="w-5 h-5 text-[#B26A1B]" />
                      <span>{pp.helpChildHeading}</span>
                    </h2>
                    <p className="text-xs text-[#7A6862]">
                      {pp.helpChildSubtitle}
                    </p>
                  </div>

                  {homeActivities.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-[#2E7D5E] mx-auto" />
                      <h4 className="text-sm font-bold text-[#2E7D5E]">
                        {pp.noHomeActivitiesHeading}
                      </h4>
                      <p className="text-xs text-[#7A6862]">
                        {tr("parentPortal.noHomeActivitiesSubtitle", { name: activeStudent?.displayName || pp.yourChildFallback })}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {homeActivities.map((act: any) => (
                        <div
                          key={act.id}
                          className={`p-5 rounded-3xl border transition-all space-y-4 ${
                            act.completed
                              ? "bg-emerald-50/50 border-emerald-500/30"
                              : "bg-[#FAF6E9]/70 border-[#49352F]/15"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B26A1B] block">
                                {act.conceptName} &bull; {formatSubject(act.subjectCode)}
                              </span>
                              <h3 className="text-base font-black text-[#49352F]">
                                {showGuField ? act.titleGujarati || act.title : act.title}
                              </h3>
                              <p className="text-xs text-[#7A6862] mt-0.5">
                                {showGuField ? act.whyNeededGu : act.whyNeededEn}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-semibold text-[#7A6862] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#B26A1B]" />
                                {act.estimatedMinutes} {pp.minsUnit}
                              </span>
                              <Button
                                size="sm"
                                variant={act.completed ? "outline" : "saffron"}
                                disabled={activityLoading[act.id]}
                                onClick={() => handleToggleActivity(act.id, act.conceptId, act.completed)}
                                className="rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                              >
                                {act.completed ? (
                                  <span className="flex items-center gap-1.5 text-emerald-800">
                                    <Check className="w-3.5 h-3.5" />
                                    {pp.activityCompletedLabel}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <Square className="w-3.5 h-3.5" />
                                    {pp.markCompletedBtn}
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Household Materials */}
                          <div className="p-3.5 rounded-2xl bg-white border border-[#49352F]/10 space-y-1">
                            <span className="text-xs font-bold text-[#B26A1B] block">
                              {pp.householdMaterialsLabel}
                            </span>
                            <span className="text-xs text-[#49352F]">
                              {Array.isArray(showGuField ? act.materialsGu : act.materialsEn)
                                ? (showGuField ? act.materialsGu : act.materialsEn).join(", ")
                                : act.materialsEn || pp.householdObjectsFallback}
                            </span>
                          </div>

                          {/* Step-by-Step Instructions */}
                          {act.steps && act.steps.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-extrabold text-[#49352F] block">
                                {pp.stepByStepInstructionsLabel}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {act.steps.map((st: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-2xl bg-white border border-[#49352F]/10 space-y-1 text-xs"
                                  >
                                    <span className="text-[10px] font-bold text-[#B26A1B] uppercase tracking-wider block">
                                      {tr("parentPortal.stepLabel", { step: st.stepNumber || idx + 1 })}
                                    </span>
                                    <p className="text-[#49352F] leading-snug">
                                      {showGuField ? st.instructionGu || st.instructionEn : st.instructionEn}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {act.completedAt && (
                            <p className="text-[11px] text-emerald-700 italic">
                              {pp.completedOnPrefix}
                              {formatDate(act.completedAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: MY CHILDREN */}
            {activeTab === "children" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#49352F]">
                      {pp.linkedChildrenHeading}
                    </h2>
                    <p className="text-xs text-[#7A6862]">
                      {pp.linkedChildrenSubtitle}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={openLinkChildModal}
                    className="rounded-xl text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>{pp.linkAnotherChildBtn}</span>
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
                                {formatClass(ch.grade, ch.section)} &bull; {pp.studentCodePrefix} {ch.studentCode}
                              </p>
                            </div>
                          </div>
                          <Badge variant="mastered" size="sm">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {pp.verifiedLinkBadge}
                          </Badge>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex items-center justify-between text-xs">
                          <span className="text-[#7A6862] flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />
                            {studentDetail?.school?.name || pp.defaultSchoolName}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedStudentId(ch.id);
                              setActiveTab("overview");
                            }}
                            className="font-bold text-[#B26A1B] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{pp.viewDashboardBtn}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 6: TEACHER COMMUNICATION */}
            {activeTab === "communication" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Send inquiry */}
                  <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                    <div>
                      <h2 className="font-heading text-base font-black text-[#49352F] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#B26A1B]" />
                        <span>{pp.sendInquiryHeading}</span>
                      </h2>
                      <p className="text-xs text-[#7A6862]">
                        {tr("parentPortal.sendInquirySubtitle", { name: activeStudent?.displayName || pp.yourChildFallback })}
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
                          {pp.inquirySubjectLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={msgSubject}
                          onChange={(e) => setMsgSubject(e.target.value)}
                          placeholder={pp.inquirySubjectPlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#49352F] block">
                          {pp.inquiryMessageLabel}
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                          placeholder={pp.inquiryMessagePlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/60 text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={msgSending}
                        className="py-2.5 px-5 rounded-xl bg-[#261B16] text-[#FAF6E9] text-xs font-bold flex items-center gap-2 hover:bg-[#49352F] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 text-[#F2CAB3]" />
                        <span>{msgSending ? pp.sendingInquiryBtn : pp.submitInquiryBtn}</span>
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Teacher Hours & Message History */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3">
                      <h3 className="text-sm font-extrabold text-[#49352F] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#B26A1B]" />
                        <span>{pp.consultationTimingsHeading}</span>
                      </h3>
                      <p className="text-xs text-[#7A6862] leading-relaxed">
                        {pp.consultationTimingsBefore} <strong>{pp.consultationTimingsWindow}</strong> {pp.consultationTimingsAfter}
                      </p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3">
                      <h3 className="text-sm font-extrabold text-[#49352F]">{pp.pastConversationsHeading}</h3>
                      {pastMessages.length === 0 ? (
                        <p className="text-xs text-[#7A6862]">{pp.noPreviousInquiries}</p>
                      ) : (
                        <div className="space-y-2">
                          {pastMessages.map((m: any) => (
                            <div key={m.id} className="p-3 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-[#49352F]">
                                <span>{m.subject}</span>
                                <Badge variant={m.status === "replied" ? "mastered" : "default"} size="sm">
                                  {m.status === "replied" ? pp.messageStatusReplied : pp.messageStatusSent}
                                </Badge>
                              </div>
                              <p className="text-[#7A6862] text-[11px]">{m.message}</p>
                              {m.reply && (
                                <div className="mt-1 p-2 rounded-lg bg-emerald-50 text-emerald-950 text-[11px] border border-emerald-200">
                                  <strong>{pp.teacherReplyPrefix}</strong> {m.reply}
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

            {/* TAB 7: SCHOOL NOTICES */}
            {activeTab === "notices" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-lg font-black text-[#49352F] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#B26A1B]" />
                    <span>{pp.noticesTabHeading}</span>
                  </h2>
                  <p className="text-xs text-[#7A6862]">
                    {pp.noticesTabSubtitle}
                  </p>
                </div>

                <div className="space-y-4">
                  {notices.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-[#49352F]/15 text-xs text-[#7A6862]">
                      {pp.noNoticesForGrade}
                    </div>
                  ) : (
                    notices.map((n: any) => (
                      <div
                        key={n.id}
                        className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider text-[#B26A1B]">
                                {n.category || pp.defaultNoticeCategory}
                              </span>
                              {n.urgency === "urgent" && <Badge variant="needsSupport" size="sm">{pp.urgentBadge}</Badge>}
                            </div>
                            <h3 className="text-base font-extrabold text-[#49352F]">{n.title}</h3>
                          </div>
                          <span className="text-xs text-[#7A6862] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {n.createdAt ? formatDate(n.createdAt) : pp.recentLabel}
                          </span>
                        </div>

                        <p className="text-xs text-[#49352F] leading-relaxed">
                          {n.simplifiedContent || n.originalContent}
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#49352F]/10 text-xs">
                          <span className="text-[#7A6862]">
                            {pp.issuedByPrefix} <strong>{n.senderTeacherName || pp.classTeacherFallback}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const utterance = new SpeechSynthesisUtterance(n.simplifiedContent || n.originalContent);
                                utterance.lang = language === "en" ? "en-IN" : `${language}-IN`;
                                window.speechSynthesis?.speak(utterance);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-[#49352F]/15 hover:bg-[#FAF6E9] text-xs font-bold text-[#49352F] flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-[#B26A1B]" />
                              <span>{pp.listenAudioBtn}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* LINK CHILD MODAL */}
      <LinkChildModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          setNewlyLinkedChild(null);
          setLinkSuccess(null);
          setLinkError(null);
          setLinkErrorCode(null);
        }}
        language={language}
        codeValue={linkingCodeInput}
        onCodeChange={setLinkingCodeInput}
        onSubmit={handleRedeemCode}
        loading={linkLoading}
        error={linkError}
        errorCode={linkErrorCode}
        successMessage={linkSuccess}
        linkedChild={newlyLinkedChild}
        onViewLinkedChild={() => {
          if (newlyLinkedChild?.id) {
            setSelectedStudentId(newlyLinkedChild.id);
          }
          setActiveTab("overview");
          setLinkModalOpen(false);
          setNewlyLinkedChild(null);
          setLinkSuccess(null);
        }}
        formatClass={formatClass}
      />
    </div>
  );
}

export default function ParentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6E9] flex items-center justify-center p-8">
          <Sparkles className="w-8 h-8 animate-spin text-[#B26A1B]" />
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}
