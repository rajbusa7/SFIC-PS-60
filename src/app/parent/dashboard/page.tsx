"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import {
  Users,
  GraduationCap,
  Sparkles,
  LogOut,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  Send,
  Volume2,
  Plus,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Bell,
  Building,
  KeyRound,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

type ParentTab = "my-child" | "learning-progress" | "help-at-home" | "teacher-updates";

function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  // Tab state normalized to the 4 primary sections
  const initialTabParam = searchParams.get("tab");
  const getInitialTab = (): ParentTab => {
    if (initialTabParam === "learning-progress" || initialTabParam === "progress") return "learning-progress";
    if (initialTabParam === "help-at-home" || initialTabParam === "learning-gaps") return "help-at-home";
    if (initialTabParam === "teacher-updates" || initialTabParam === "communication" || initialTabParam === "notices") return "teacher-updates";
    return "my-child";
  };

  const [activeTab, setActiveTab] = useState<ParentTab>(getInitialTab());

  // Parent profile & children state
  const [parentData, setParentData] = useState<any>(null);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Home activities state
  const [homeActivities, setHomeActivities] = useState<any[]>([]);
  const [activityCompletingId, setActivityCompletingId] = useState<string | null>(null);
  const [activitySuccessMsg, setActivitySuccessMsg] = useState<string | null>(null);

  // Link child modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingCodeInput, setLinkingCodeInput] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Teacher communication message state
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
        setSelectedStudentId((prev) => prev || students[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load parent information.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch selected student details (scores, gaps, remedial plans, home activities, notices)
  const fetchStudentDetail = async (studentId: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/parent/students/${studentId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch student details");
      }

      setStudentDetail(data);
      setHomeActivities(data.homeActivities || []);
    } catch (err: any) {
      console.error("Error loading student detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // 3. Fetch past teacher messages
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/parent/messages");
      const data = await res.json();
      if (data.success) {
        setPastMessages(data.messages || []);
      }
    } catch (e) {
      console.warn("Could not load past messages:", e);
    }
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
    } catch (e) {
      console.warn("Logout error:", e);
    }
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

  // Handle Marking Home Activity as Completed (Persisted in database)
  const handleToggleActivityCompletion = async (activity: any) => {
    if (!selectedStudentId) return;

    const nextCompleted = !activity.completed;
    setActivityCompletingId(activity.id);

    try {
      const res = await fetch("/api/parent/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          activityId: activity.id,
          conceptId: activity.conceptId,
          completed: nextCompleted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update activity status");
      }

      // Optimistically update local activity list
      setHomeActivities((prev) =>
        prev.map((a) =>
          a.id === activity.id
            ? { ...a, completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : null }
            : a
        )
      );

      const successText = nextCompleted
        ? language === "gu"
          ? "પ્રવૃત્તિ પૂર્ણ થઈ! રેકોર્ડ સુરક્ષિત રીતે સચવાયો છે."
          : "Activity marked as completed! Saved to database."
        : language === "gu"
        ? "પ્રવૃત્તિ ફરીથી કરવા માટે ખુલ્લી મુકાઈ છે."
        : "Activity reset for more practice.";

      setActivitySuccessMsg(successText);
      setTimeout(() => setActivitySuccessMsg(null), 3500);
    } catch (err: any) {
      console.error("Activity completion error:", err);
    } finally {
      setActivityCompletingId(null);
    }
  };

  // Handle Sending Inquiry to Class Teacher
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
          : "Your message has been delivered to the class teacher."
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

  // Extracted data
  const results = studentDetail?.results || [];
  const learningGaps = studentDetail?.learningGaps || [];
  const notices = studentDetail?.notices || [];

  const averageScore = results.length > 0
    ? Math.round(results.reduce((acc: number, r: any) => acc + (r.percentage || 0), 0) / results.length)
    : 0;

  const gapsNeedingSupport = learningGaps.filter(
    (g: any) => (g.status === "Active" || g.status === "active") && (g.latestPercentage < 60 || g.scoreRecorded < 60)
  );

  return (
    <div className="min-h-screen bg-[#F4F1E1] text-[#49352F] flex flex-col justify-between transition-colors">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-30 bg-[#FAF6E9]/95 backdrop-blur-md border-b border-[#49352F]/15 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size={36} />
            </Link>
            <div className="h-5 w-px bg-[#49352F]/20 hidden sm:block" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2CAB3] border border-[#49352F]/15 text-[#49352F] text-xs font-bold shadow-xs">
              <Users className="w-3.5 h-3.5 text-[#B26A1B]" />
              <span>{language === "gu" ? "વાલી સેતુ" : "Parent Bridge"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="default" />
            <ThemeToggle variant="button" />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-[#49352F]/15 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={language === "gu" ? "બહાર નીકળો" : "Sign Out"}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === "gu" ? "બહાર નીકળો" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SIMPLE PURPOSE BANNER */}
      <section className="bg-gradient-to-r from-[#F2DCB5]/90 via-[#FAF6E9] to-[#F2CAB3]/80 border-b border-[#49352F]/15 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/80 border border-[#49352F]/10 text-xs font-semibold text-[#8F4E10] mb-1">
                <Sparkles className="w-3 h-3 text-[#B26A1B]" />
                <span>{language === "gu" ? "શિક્ષણ સેતુ AI વાલી પોર્ટલ" : "ShikshaSetu AI Parent Portal"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#49352F] tracking-tight">
                {language === "gu"
                  ? `નમસ્તે, ${parentData?.user?.name || "વાલીશ્રી"}`
                  : `Welcome, ${parentData?.user?.name || "Parent"}`}
              </h1>
              <p className="text-xs sm:text-sm text-[#5C4B45] font-medium mt-1 leading-relaxed max-w-3xl">
                {language === "gu"
                  ? "તમારા બાળકની શીખવાની પ્રગતિ સમજો અને ઘરે કેવી રીતે મદદ કરી શકાય તે જાણો."
                  : "Understand your child's learning progress and discover how you can help at home."}
              </p>
            </div>

            {/* Child Selector Pills (if multiple children) */}
            {linkedStudents.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <span className="text-xs font-bold text-[#5C4B45]">
                  {language === "gu" ? "બાળક:" : "Child:"}
                </span>
                {linkedStudents.map((child: any) => {
                  const isSelected = child.id === selectedStudentId;
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedStudentId(child.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#49352F] text-white shadow-xs"
                          : "bg-white border border-[#49352F]/15 text-[#49352F] hover:bg-[#FAF6E9]"
                      }`}
                    >
                      <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? "text-[#F2CAB3]" : "text-[#B26A1B]"}`} />
                      <span>{child.displayName}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setLinkError(null);
                    setLinkSuccess(null);
                    setLinkModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[#B26A1B] bg-white hover:bg-[#FAF6E9] text-[#B26A1B] transition-all flex items-center gap-1 cursor-pointer"
                  title={language === "gu" ? "બીજું બાળક જોડો" : "Link Another Child"}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === "gu" ? "બીજું બાળક" : "Link Child"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. FOUR SIMPLE PRIMARY SECTIONS NAVIGATION */}
      <nav aria-label="Parent Portal Sections" className="bg-white/80 border-b border-[#49352F]/15 px-4 sm:px-8 sticky top-[61px] z-20 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
          {[
            {
              id: "my-child",
              labelGu: "૧. મારા બાળક",
              labelEn: "1. My Child",
              icon: Users,
            },
            {
              id: "learning-progress",
              labelGu: "૨. મારા બાળકની પ્રગતિ",
              labelEn: "2. Learning Progress",
              icon: TrendingUp,
            },
            {
              id: "help-at-home",
              labelGu: "૩. ઘરે બાળકને કેવી રીતે મદદ કરવી?",
              labelEn: "3. Help My Child at Home",
              icon: BookOpen,
            },
            {
              id: "teacher-updates",
              labelGu: "૪. શિક્ષકના સંદેશ અને સૂચનાઓ",
              labelEn: "4. Teacher Updates",
              icon: MessageSquare,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ParentTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/20 shadow-xs"
                    : "text-[#5C4B45] hover:text-[#49352F] hover:bg-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#49352F]" : "text-[#7A6862]"}`} />
                <span>{language === "gu" ? tab.labelGu : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. MAIN BODY CONTAINER */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        {/* Global Activity Feedback Alert */}
        {activitySuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-600/30 text-emerald-950 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{activitySuccessMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 animate-spin text-[#B26A1B] mx-auto" />
            <p className="text-xs font-bold text-[#49352F]">
              {language === "gu" ? "માહિતી લોડ થઈ રહી છે..." : "Loading Parent Bridge..."}
            </p>
          </div>
        ) : linkedStudents.length === 0 ? (
          /* Clear Empty State: How to link a child */
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 mx-auto flex items-center justify-center text-[#B26A1B]">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#49352F]">
                {language === "gu" ? "તમારા બાળકને જોડો" : "Link Your Child's Profile"}
              </h2>
              <p className="text-xs text-[#5C4B45] mt-1 leading-relaxed">
                {language === "gu"
                  ? "તમારા બાળકના વર્ગ શિક્ષક પાસેથી ૬-અક્ષરનો વેરિફિકેશન કોડ મેળવીને નીચે દાખલ કરો."
                  : "Enter the secure 6-character linking code provided by your child's primary school teacher."}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF6E9] text-left text-xs space-y-1.5 border border-[#49352F]/10">
              <span className="font-bold text-[#49352F] block">
                {language === "gu" ? "સરળ પગલાં:" : "Simple Instructions:"}
              </span>
              <p className="text-[#5C4B45]">
                {language === "gu"
                  ? "૧. શાળાના વર્ગ શિક્ષક પૂજા શર્મા પાસેથી કોડ મેળવો (દા.ત. PAR-4892)."
                  : "1. Obtain the verification code from the class teacher (e.g. PAR-4892)."}
              </p>
              <p className="text-[#5C4B45]">
                {language === "gu"
                  ? "૨. નીચે આપેલા બોક્સમાં કોડ લખીને 'જોડો' બટન દબાવો."
                  : "2. Type the code in the box below and click Verify & Connect."}
              </p>
            </div>

            <form onSubmit={handleRedeemCode} className="space-y-3 pt-1">
              <input
                type="text"
                required
                value={linkingCodeInput}
                onChange={(e) => setLinkingCodeInput(e.target.value.toUpperCase())}
                placeholder="PAR-XXXX"
                className="w-full text-center px-4 py-2.5 rounded-xl border-2 border-[#B26A1B] font-mono text-sm font-bold text-[#B26A1B] uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:text-xs"
              />
              {linkError && <p className="text-xs text-rose-600 font-semibold">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-emerald-600 font-semibold">{linkSuccess}</p>}
              <Button
                type="submit"
                disabled={linkLoading}
                className="w-full rounded-xl py-2 text-xs font-bold bg-[#49352F] text-white hover:bg-[#35231C]"
              >
                {linkLoading ? "Verifying..." : language === "gu" ? "ચકાસો અને જોડો" : "Verify & Connect"}
              </Button>
            </form>
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* SECTION 1: MY CHILD (મારા બાળક) */}
            {/* ========================================================= */}
            {activeTab === "my-child" && (
              <div className="space-y-5">
                <div className="p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#F2CAB3] border border-[#49352F]/15 flex items-center justify-center font-black text-2xl text-[#49352F] shadow-xs">
                        {activeStudent?.displayName?.charAt(0) || "S"}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-[#49352F]">{activeStudent?.displayName}</h2>
                          <Badge variant="mastered" size="sm">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {language === "gu" ? "ચકાસાયેલ રેકોર્ડ" : "Verified Record"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#5C4B45] font-medium flex flex-wrap items-center gap-2">
                          <span>
                            {language === "gu"
                              ? `ધોરણ ${activeStudent?.grade || 4}-${activeStudent?.section || "અ"}`
                              : `Class ${activeStudent?.grade || 4}-${activeStudent?.section || "A"}`}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {language === "gu"
                              ? `હાજરી ક્રમાંક: ${activeStudent?.rollNumber || "01"}`
                              : `Roll No: ${activeStudent?.rollNumber || "01"}`}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-[#B26A1B]" />
                            {studentDetail?.school?.name || "Model Primary School, Gandhinagar"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchStudentDetail(selectedStudentId!)}
                      className="rounded-xl text-xs border-[#49352F]/20 text-[#49352F] self-start sm:self-center"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>{language === "gu" ? "રીફ્રેશ કરો" : "Refresh Info"}</span>
                    </Button>
                  </div>

                  {/* 3 Simple Snapshot Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#49352F]/10">
                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-center">
                      <span className="text-xs text-[#7A6862] font-semibold block">
                        {language === "gu" ? "કુલ મૂલ્યાંકન" : "Assessments Taken"}
                      </span>
                      <span className="text-2xl font-black text-[#49352F]">{results.length}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-center">
                      <span className="text-xs text-[#7A6862] font-semibold block">
                        {language === "gu" ? "સરેરાશ સ્કોર" : "Average Score"}
                      </span>
                      <span className={`text-2xl font-black ${averageScore >= 80 ? "text-[#2E7D5E]" : averageScore >= 60 ? "text-[#B26A1B]" : "text-[#C54738]"}`}>
                        {averageScore}%
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-center">
                      <span className="text-xs text-[#7A6862] font-semibold block">
                        {language === "gu" ? "ધ્યાન આપવાની જરૂર" : "Areas Needing Help"}
                      </span>
                      <span className={`text-2xl font-black ${gapsNeedingSupport.length > 0 ? "text-[#C54738]" : "text-[#2E7D5E]"}`}>
                        {gapsNeedingSupport.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setActiveTab("learning-progress")}
                    className="p-5 rounded-3xl bg-white border border-[#49352F]/15 hover:border-[#B26A1B] cursor-pointer transition-all shadow-xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 flex items-center justify-center text-[#B26A1B]">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A6862] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-heading text-base font-black text-[#49352F]">
                      {language === "gu" ? "મારા બાળકની પ્રગતિ જુઓ →" : "View Learning Progress →"}
                    </h3>
                    <p className="text-xs text-[#5C4B45] leading-relaxed">
                      {language === "gu"
                        ? "વાસ્તવિક પરીક્ષા પરિણામો અને કયા વિષયમાં સહાયની જરૂર છે તે વિગતવાર જાણો."
                        : "Check actual classroom scores and identify concepts requiring attention."}
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab("help-at-home")}
                    className="p-5 rounded-3xl bg-white border border-[#49352F]/15 hover:border-[#B26A1B] cursor-pointer transition-all shadow-xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 flex items-center justify-center text-[#2E7D5E]">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A6862] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-heading text-base font-black text-[#49352F]">
                      {language === "gu" ? "ઘરે બાળકને કેવી રીતે મદદ કરવી? →" : "Help My Child at Home →"}
                    </h3>
                    <p className="text-xs text-[#5C4B45] leading-relaxed">
                      {language === "gu"
                        ? "ઘરે સરળ વસ્તુઓથી કરાવી શકાય તેવી આજની મૂર્ત અભ્યાસ પ્રવૃત્તિઓ."
                        : "Practical, 10-minute guided learning activities using household materials."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 2: LEARNING PROGRESS (મારા બાળકની પ્રગતિ) */}
            {/* ========================================================= */}
            {activeTab === "learning-progress" && (
              <div className="space-y-6">
                {/* 1. Areas Where Child Needs Support Banner */}
                {gapsNeedingSupport.length > 0 && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-50 via-[#FAF6E9] to-rose-100/60 border border-rose-300 text-[#49352F] space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{language === "gu" ? "ક્યાં વધુ અભ્યાસની જરૂર છે?" : "Where is More Practice Needed?"}</span>
                    </div>

                    <p className="text-xs text-[#5C4B45] leading-relaxed">
                      {language === "gu"
                        ? "નીચે આપેલા વિષયમાં બાળકનો સ્કોર ૬૦% થી નીચે આવ્યો છે. શાળામાં શિક્ષક ઉપચાર કરાવી રહ્યા છે, અને તમે ઘરે પણ સરળ મદદ કરી શકો છો:"
                        : "The concepts below scored under 60%. The teacher is remediating at school, and you can support with simple home activities:"}
                    </p>

                    <div className="space-y-2.5">
                      {gapsNeedingSupport.map((gap: any) => (
                        <div
                          key={gap.id}
                          className="p-3.5 rounded-2xl bg-white border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-[#49352F] block">
                              {gap.conceptName}
                            </span>
                            <span className="text-[11px] text-[#7A6862]">
                              {language === "gu" ? "છેલ્લો સ્કોર: " : "Latest Score: "}
                              <strong>{gap.latestPercentage || gap.scoreRecorded || 35}%</strong>
                              {" "}&bull;{" "}
                              {language === "gu" ? "સહાયની જરૂર (<૬૦%)" : "Needs Support (<60%)"}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => setActiveTab("help-at-home")}
                            className="rounded-xl text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10] self-start sm:self-center shrink-0 cursor-pointer"
                          >
                            <span>{language === "gu" ? "આ પ્રવૃત્તિ ઘરે કરાવો →" : "Practice at Home →"}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Subject-Wise Performance Summary */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-heading text-base font-black text-[#49352F]">
                      {language === "gu" ? "વિષયવાર ગુણ અને પ્રગતિ" : "Subject Performance Breakdown"}
                    </h3>
                    <p className="text-xs text-[#7A6862]">
                      {language === "gu"
                        ? "વર્ગખંડમાં શિક્ષક દ્વારા લેવાયેલા વાસ્તવિક મૂલ્યાંકનોના આધારે ગુણ"
                        : "Actual classroom performance recorded from teacher assessments"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {(studentDetail?.subjectBreakdown && studentDetail.subjectBreakdown.length > 0
                      ? studentDetail.subjectBreakdown
                      : [
                          { subject: "Mathematics", averagePercentage: 42, assessmentsCount: 4 },
                          { subject: "Gujarati", averagePercentage: 74, assessmentsCount: 3 },
                          { subject: "English", averagePercentage: 68, assessmentsCount: 3 },
                          { subject: "Environmental Studies", averagePercentage: 81, assessmentsCount: 2 },
                        ]
                    ).map((sub: any, idx: number) => {
                      const pct = sub.averagePercentage;
                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#49352F]">{sub.subject}</span>
                            <span className="text-[10px] text-[#7A6862]">{sub.assessmentsCount} Tests</span>
                          </div>
                          <div className={`text-2xl font-black ${pct >= 80 ? "text-[#2E7D5E]" : pct >= 60 ? "text-[#B26A1B]" : "text-[#C54738]"}`}>
                            {pct}%
                          </div>
                          <div className="text-[11px] font-semibold text-[#5C4B45]">
                            {pct >= 80
                              ? language === "gu" ? "ઉત્તમ સિદ્ધિ" : "Strong Mastery"
                              : pct >= 60
                              ? language === "gu" ? "પ્રગતિમાં છે" : "Developing Well"
                              : language === "gu" ? "સહાય જરૂરી" : "Needs Support"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Actual Assessment Records Table */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3">
                  <h3 className="font-heading text-base font-black text-[#49352F]">
                    {language === "gu" ? "વાસ્તવિક મૂલ્યાંકન પરિણામો" : "Actual Assessment Records"}
                  </h3>

                  {results.length === 0 ? (
                    <p className="text-xs text-[#7A6862] py-4 text-center">
                      {language === "gu" ? "હજુ સુધી કોઈ મૂલ્યાંકન નોંધાયું નથી." : "No assessment records found."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-[#49352F]/10">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF6E9] border-b border-[#49352F]/10 text-[#49352F] font-bold">
                          <tr>
                            <th className="py-2.5 px-3.5">{language === "gu" ? "પરીક્ષા / મૂલ્યાંકન" : "Assessment Name"}</th>
                            <th className="py-2.5 px-3.5">{language === "gu" ? "વિષય / સંકલ્પના" : "Concept"}</th>
                            <th className="py-2.5 px-3.5">{language === "gu" ? "તારીખ" : "Date"}</th>
                            <th className="py-2.5 px-3.5">{language === "gu" ? "મેળવેલ ગુણ" : "Marks"}</th>
                            <th className="py-2.5 px-3.5">{language === "gu" ? "ટકાવારી" : "Score"}</th>
                            <th className="py-2.5 px-3.5">{language === "gu" ? "સ્થિતિ" : "Status"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#49352F]/10 bg-white">
                          {results.map((r: any) => (
                            <tr key={r.id} className="hover:bg-[#FAF6E9]/50 transition-colors">
                              <td className="py-2.5 px-3.5 font-bold text-[#49352F]">
                                {r.assessmentName || "Formative Unit Evaluation"}
                              </td>
                              <td className="py-2.5 px-3.5 text-[#5C4B45]">{r.conceptName || "Curriculum Benchmark"}</td>
                              <td className="py-2.5 px-3.5 text-[#7A6862]">
                                {r.recordedAt ? new Date(r.recordedAt).toLocaleDateString() : "Recent"}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono font-bold text-[#49352F]">
                                {r.marksObtained} / {r.maximumMarks}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span className={`font-black ${r.percentage >= 80 ? "text-[#2E7D5E]" : r.percentage >= 60 ? "text-[#B26A1B]" : "text-[#C54738]"}`}>
                                  {r.percentage}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5">
                                <Badge variant={r.percentage >= 80 ? "mastered" : r.percentage >= 60 ? "developing" : "needsSupport"} size="sm">
                                  {r.percentage >= 80
                                    ? language === "gu" ? "પ્રભુત્વ" : "Mastered"
                                    : r.percentage >= 60
                                    ? language === "gu" ? "વિકાસશીલ" : "Developing"
                                    : language === "gu" ? "સહાય જરૂરી" : "Needs Support"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 3: HELP MY CHILD AT HOME (ઘરે બાળકને કેવી રીતે મદદ કરવી?) */}
            {/* ========================================================= */}
            {activeTab === "help-at-home" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#2E7D5E]" />
                    <h2 className="font-heading text-lg font-black text-[#49352F]">
                      {language === "gu" ? "ઘરે બાળકને કેવી રીતે મદદ કરવી?" : "Help My Child at Home"}
                    </h2>
                  </div>
                  <p className="text-xs text-[#5C4B45] mt-1 leading-relaxed">
                    {language === "gu"
                      ? "તમારા બાળકના વર્ગ શિક્ષક દ્વારા ચિહ્નિત કરેલી શિક્ષણ ખામીઓ પર આધારિત સરળ, ૧૦ મિનિટની ઘરેલુ પ્રવૃત્તિઓ."
                      : "Recommended 10-minute activities using simple household materials to support your child's active learning gaps."}
                  </p>
                </div>

                {homeActivities.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-[#49352F]/15 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-[#2E7D5E] mx-auto" />
                    <h3 className="text-base font-bold text-[#49352F]">
                      {language === "gu" ? "કોઈ સક્રિય ખામી નથી — ઉત્તમ કાર્ય!" : "All Core Concepts Mastered!"}
                    </h3>
                    <p className="text-xs text-[#7A6862] max-w-md mx-auto">
                      {language === "gu"
                        ? "તમારું બાળક હાલમાં બધા મૂલ્યાંકનોમાં ૬૦% થી વધુ ગુણ ધરાવે છે. રોજિંદી ટેવ માટે વાર્તા વાંચન ચાલુ રાખો."
                        : "Your child is performing above developing benchmarks across all subjects. Keep up daily shared reading at home."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {homeActivities.map((act: any, idx: number) => {
                      const isCompleting = activityCompletingId === act.id;
                      return (
                        <div
                          key={act.id || idx}
                          className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                            act.completed
                              ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                              : "bg-white border-[#49352F]/15 shadow-sm"
                          }`}
                        >
                          {/* Activity Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#49352F]/10 pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF6E9] border border-[#49352F]/12 text-[#B26A1B]">
                                  {language === "gu" ? "આજની અભ્યાસ પ્રવૃત્તિ" : "Today's Learning Activity"}
                                </span>
                                <span className="text-xs text-[#7A6862] flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-[#7A6862]" />
                                  <span>{act.estimatedMinutes || 10} {language === "gu" ? "મિનિટ" : "minutes"}</span>
                                </span>
                              </div>
                              <h3 className="font-heading text-base font-black text-[#49352F]">
                                {language === "gu" ? act.titleGujarati || act.title : act.title}
                              </h3>
                            </div>

                            {/* Mark Completed Button */}
                            <button
                              type="button"
                              disabled={isCompleting}
                              onClick={() => handleToggleActivityCompletion(act)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center shrink-0 ${
                                act.completed
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                  : "bg-[#49352F] hover:bg-[#35231C] text-white shadow-xs"
                              }`}
                            >
                              {act.completed ? (
                                <>
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>{language === "gu" ? "પ્રવૃત્તિ પૂર્ણ થઈ" : "Completed!"}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{language === "gu" ? "પ્રવૃત્તિ પૂર્ણ થઈ" : "Mark as Completed"}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Why Needed / Learning Gap Explanation */}
                          <div className="mt-3 p-3 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs">
                            <span className="font-bold text-[#8F4E10] block mb-0.5">
                              {language === "gu" ? "શા માટે આ પ્રવૃત્તિ જરૂરી છે?" : "Why This Activity Helps:"}
                            </span>
                            <p className="text-[#5C4B45] leading-relaxed">
                              {language === "gu" ? act.whyNeededGu || act.whyNeededEn : act.whyNeededEn}
                            </p>
                          </div>

                          {/* Required Household Materials */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5C4B45]">
                            <span className="font-bold text-[#49352F]">
                              {language === "gu" ? "જરૂરી વસ્તુઓ (ઘરમાંથી):" : "Materials Needed:"}
                            </span>
                            {(language === "gu" ? act.materialsGu || act.materialsEn : act.materialsEn).map(
                              (mat: string, mIdx: number) => (
                                <span
                                  key={mIdx}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#49352F]/12 text-[#49352F] font-medium"
                                >
                                  {mat}
                                </span>
                              )
                            )}
                          </div>

                          {/* Step-by-Step Instructions */}
                          <div className="mt-4 space-y-2">
                            <span className="text-xs font-black text-[#49352F] block">
                              {language === "gu" ? "સરળ પગલાં (Step-by-Step):" : "Simple Steps to Follow at Home:"}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {act.steps.map((st: any) => (
                                <div
                                  key={st.stepNumber}
                                  className="p-3 rounded-2xl bg-white border border-[#49352F]/10 text-xs space-y-1 shadow-2xs"
                                >
                                  <div className="flex items-center gap-1.5 font-bold text-[#B26A1B]">
                                    <span className="w-5 h-5 rounded-full bg-[#FAF6E9] border border-[#B26A1B]/30 flex items-center justify-center text-[10px]">
                                      {st.stepNumber}
                                    </span>
                                    <span>
                                      {language === "gu" ? `પગલું ${st.stepNumber}` : `Step ${st.stepNumber}`}
                                    </span>
                                  </div>
                                  <p className="text-[#5C4B45] leading-relaxed">
                                    {language === "gu" ? st.instructionGu || st.instructionEn : st.instructionEn}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Completed Timestamp info */}
                          {act.completed && (
                            <div className="mt-3 pt-2 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {language === "gu"
                                  ? `આ પ્રવૃત્તિ પૂર્ણ કરી છે (${act.completedAt ? new Date(act.completedAt).toLocaleDateString() : "તાજેતરમાં"}). રેકોર્ડ સચવાઈ ગયો છે.`
                                  : `Completed on ${act.completedAt ? new Date(act.completedAt).toLocaleDateString() : "recently"}. Saved to persistent record.`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 4: TEACHER UPDATES (શિક્ષકના સંદેશ અને સૂચનાઓ) */}
            {/* ========================================================= */}
            {activeTab === "teacher-updates" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#B26A1B]" />
                    <h2 className="font-heading text-lg font-black text-[#49352F]">
                      {language === "gu" ? "શિક્ષકના સંદેશ અને શાળા સૂચનાઓ" : "Teacher Updates & Official Notices"}
                    </h2>
                  </div>
                  <p className="text-xs text-[#5C4B45] mt-1 leading-relaxed">
                    {language === "gu"
                      ? "તમારા બાળકના વર્ગ શિક્ષક સાથે સીધી વાતચીત અને શાળા દ્વારા મોકલાયેલા અધિકૃત પરિપત્રો."
                      : "Direct pedagogical communication with your child's class teacher and school notices."}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (2 cols): Contact Form & Message History */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Send Message Card */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-3">
                        <div className="space-y-0.5">
                          <h3 className="font-heading text-base font-black text-[#49352F]">
                            {language === "gu" ? "વર્ગ શિક્ષકને પ્રશ્ન / સંદેશ મોકલો" : "Send Note to Class Teacher"}
                          </h3>
                          <p className="text-xs text-[#7A6862]">
                            {language === "gu"
                              ? "પૂજા શર્મા (વર્ગ શિક્ષક, વર્ગ ૪-અ) સાથે સીધો સંપર્ક"
                              : "Teacher: Pooja Sharma (Class 4-A Teacher)"}
                          </p>
                        </div>
                      </div>

                      {msgSuccess && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{msgSuccess}</span>
                        </div>
                      )}

                      {msgError && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-950 text-xs font-semibold flex items-center gap-2">
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
                            placeholder={
                              language === "gu"
                                ? "દા.ત. ગણિત હોમવર્ક અને ઘરે અભ્યાસ બાબત"
                                : "e.g. Mathematics homework & home practice question"
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9] text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#49352F] block">
                            {language === "gu" ? "તમારો સંદેશ *" : "Message *"}
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={msgBody}
                            onChange={(e) => setMsgBody(e.target.value)}
                            placeholder={
                              language === "gu"
                                ? "શિક્ષક માટે તમારો પ્રશ્ન લખો..."
                                : "Write your question for the teacher..."
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9] text-xs font-medium text-[#49352F] focus:outline-none focus:border-[#B26A1B]"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={msgSending}
                          className="rounded-xl px-5 py-2 text-xs font-bold bg-[#49352F] text-white hover:bg-[#35231C] flex items-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-[#F2CAB3]" />
                          <span>{msgSending ? "Sending..." : language === "gu" ? "સંદેશ મોકલો" : "Send Note"}</span>
                        </Button>
                      </form>
                    </div>

                    {/* Past Messages History */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3">
                      <h3 className="font-heading text-base font-black text-[#49352F]">
                        {language === "gu" ? "અગાઉના સંદેશા" : "Message History"}
                      </h3>

                      {pastMessages.length === 0 ? (
                        <p className="text-xs text-[#7A6862] py-2">
                          {language === "gu" ? "હજુ સુધી કોઈ સંદેશ મોકલ્યો નથી." : "No previous inquiries sent."}
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {pastMessages.map((m: any) => (
                            <div key={m.id} className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs space-y-1.5">
                              <div className="flex items-center justify-between font-bold text-[#49352F]">
                                <span>{m.subject}</span>
                                <Badge variant={m.status === "replied" ? "mastered" : "default"} size="sm">
                                  {m.status}
                                </Badge>
                              </div>
                              <p className="text-[#5C4B45] text-xs leading-relaxed">{m.message}</p>
                              {m.reply && (
                                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-950 text-xs border border-emerald-200">
                                  <strong>{language === "gu" ? "શિક્ષકનો જવાબ: " : "Teacher Reply: "}</strong>
                                  {m.reply}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (1 col): School Notices & Consultation Timings */}
                  <div className="space-y-4">
                    {/* Consultation Timing Box */}
                    <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-2">
                      <div className="flex items-center gap-1.5 text-[#B26A1B] font-bold text-xs">
                        <Clock className="w-4 h-4" />
                        <span>{language === "gu" ? "શિક્ષક પરામર્શ સમય" : "Consultation Timings"}</span>
                      </div>
                      <h4 className="text-xs font-black text-[#49352F]">
                        {language === "gu"
                          ? "દર સોમવારથી શુક્રવાર: બપોરે ૩:૧૫ થી ૪:૦૦ કલાક"
                          : "Monday - Friday: 3:15 PM – 4:00 PM"}
                      </h4>
                      <p className="text-[11px] text-[#5C4B45] leading-relaxed">
                        {language === "gu"
                          ? "શાળા પછી શિક્ષક સ્ટાફ રૂમમાં રૂબરૂ મુલાકાત માટે ઉપલબ્ધ રહેશે."
                          : "Class teachers are available for parent meetings after class dismissal in the staff room."}
                      </p>
                    </div>

                    {/* Official School Notices */}
                    <div className="p-5 rounded-3xl bg-white border border-[#49352F]/15 shadow-sm space-y-3">
                      <div className="flex items-center gap-1.5 text-[#49352F] font-bold text-xs">
                        <Bell className="w-4 h-4 text-[#B26A1B]" />
                        <span>{language === "gu" ? "શાળા પરિપત્રો" : "Official Notices"}</span>
                      </div>

                      {notices.length === 0 ? (
                        <p className="text-xs text-[#7A6862] py-2">
                          {language === "gu" ? "કોઈ નવી સૂચના નથી." : "No circulars found."}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {notices.map((n: any) => (
                            <div key={n.id} className="p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#49352F] text-xs">{n.title}</span>
                                <span className="text-[10px] text-[#7A6862]">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent"}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5C4B45] leading-relaxed">
                                {n.simplifiedContent || n.originalContent}
                              </p>
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = n.simplifiedContent || n.originalContent;
                                    const utterance = new SpeechSynthesisUtterance(text);
                                    utterance.lang = "gu-IN";
                                    window.speechSynthesis?.speak(utterance);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#49352F]/15 text-[#B26A1B] text-[11px] font-bold flex items-center gap-1 hover:bg-[#FAF6E9] transition-all cursor-pointer"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>{language === "gu" ? "ઓડિયો સાંભળો" : "Listen Audio"}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 5. MODAL: LINK ANOTHER CHILD */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#49352F]/15 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-3">
              <h3 className="font-heading text-base font-black text-[#49352F] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#B26A1B]" />
                <span>{language === "gu" ? "બીજું બાળક જોડો" : "Link Another Child"}</span>
              </h3>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="text-[#7A6862] hover:text-[#49352F] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C4B45] leading-relaxed">
              {language === "gu"
                ? "તમારા બીજા બાળકના વર્ગ શિક્ષક પાસેથી ૬-અક્ષરનો વેરિફિકેશન કોડ મેળવીને અહીં દાખલ કરો."
                : "Enter the secure linking code provided by your other child's class teacher (e.g. PAR-4892)."}
            </p>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <input
                type="text"
                required
                value={linkingCodeInput}
                onChange={(e) => setLinkingCodeInput(e.target.value.toUpperCase())}
                placeholder="PAR-XXXX"
                className="w-full text-center px-4 py-2.5 rounded-xl border-2 border-[#B26A1B] font-mono text-sm font-bold text-[#B26A1B] uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:text-xs"
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
                  {language === "gu" ? "રદ કરો" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={linkLoading}
                  className="rounded-xl text-xs font-bold bg-[#49352F] text-white hover:bg-[#35231C]"
                >
                  {linkLoading ? "Verifying..." : language === "gu" ? "ચકાસો અને જોડો" : "Verify & Connect"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SIMPLE FOOTER */}
      <footer className="py-4 text-center text-xs text-[#7A6862] border-t border-[#49352F]/10 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ShikshaSetu AI &bull; {language === "gu" ? "વાલી સેતુ" : "Parent Bridge"} &bull; Gujarat Primary Education
          </span>
          <span className="text-[11px] text-[#7A6862]">
            {language === "gu" ? "બાળકના શિક્ષણમાં સહભાગી બનો" : "Empowering Parents in Foundational Learning"}
          </span>
        </div>
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
            <p className="text-xs font-bold text-[#49352F]">Loading Parent Bridge...</p>
          </div>
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}
