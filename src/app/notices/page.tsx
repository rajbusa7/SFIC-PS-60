"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { NoticeComposer } from "@/components/notices/NoticeComposer";
import { NoticeTranslationPanel } from "@/components/notices/NoticeTranslationPanel";
import { NoticeDeliveryTracker } from "@/components/notices/NoticeDeliveryTracker";
import { NoticeAssistantChat } from "@/components/notices/NoticeAssistantChat";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { broadcastDataUpdate, subscribeToDataUpdates } from "@/lib/events";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  MessageSquare,
  Sparkles,
  Languages,
  Send,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Volume2,
  Search,
  Filter,
  ArrowRight,
  Eye,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  X,
  Share2,
  BookOpen,
  TrendingUp,
  BrainCircuit,
  Home,
  Bell,
  RefreshCw,
  Building,
  Calendar,
  Check,
  Target,
  GraduationCap,
  Sparkle,
  Mail,
} from "lucide-react";
import { GmailStatusBadge } from "@/components/parent-bridge/GmailStatusBadge";
import { GmailSendReportModal } from "@/components/parent-bridge/GmailSendReportModal";
import { ParentCommunicationHistoryList } from "@/components/parent-bridge/ParentCommunicationHistoryList";
import type { SchoolNotice, NoticeTranslation, NoticeDelivery, SupportedLanguage } from "@/lib/types";

export default function UnifiedParentBridgeAndNoticesPage() {
  const { user, role, switchRole } = useAuth();
  const { t, language } = useLanguage();

  // Active top-level tab in unified frame
  const [activeTab, setActiveTab] = useState<"bridge" | "feed" | "compose" | "assistant" | "home_activities">("bridge");

  // Notices state
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [noticeTranslations, setNoticeTranslations] = useState<NoticeTranslation[]>([]);
  const [noticeDeliveries, setNoticeDeliveries] = useState<NoticeDelivery[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  // Parent Bridge Student & Academic state
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [isLoadingBridge, setIsLoadingBridge] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [activityLoading, setActivityLoading] = useState<Record<string, boolean>>({});
  const [ackLoading, setAckLoading] = useState<Record<string, boolean>>({});
  const [gmailModalOpen, setGmailModalOpen] = useState<boolean>(false);

  // 1. Load Parent / Student information
  const fetchParentAndStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/me");
      const data = await res.json();
      if (res.ok && data.success) {
        const students = data.linkedStudents || [];
        setLinkedStudents(students);
        if (students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(students[0].id);
        }
      } else {
        // Fallback: fetch available students from school directory
        const sRes = await fetch("/api/students");
        const sData = await sRes.json();
        if (sRes.ok && sData.success && sData.data?.length > 0) {
          setLinkedStudents(sData.data);
          if (!selectedStudentId) setSelectedStudentId(sData.data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching students:", e);
    }
  }, [selectedStudentId]);

  // 2. Fetch real database student details (scores, gaps, remedial plans, home activities)
  const fetchStudentDetail = useCallback(async (studentId: string, silent = false) => {
    if (!studentId) return;
    try {
      if (!silent) setIsLoadingBridge(true);
      else setIsSyncing(true);

      const res = await fetch(`/api/parent/students/${studentId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentDetail(data);
        setLastUpdatedTime(new Date());
      }
    } catch (e) {
      console.error("Failed to fetch student details:", e);
    } finally {
      if (!silent) setIsLoadingBridge(false);
      else setIsSyncing(false);
    }
  }, []);

  // 3. Load notices from server API
  const fetchNotices = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingNotices(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedGrade !== "all") params.append("grade", selectedGrade);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/notices?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setNotices(data.data);
        if (!selectedNotice && data.data.length > 0) {
          loadNoticeDetails(data.data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load notices:", e);
    } finally {
      if (!silent) setIsLoadingNotices(false);
    }
  }, [selectedCategory, selectedGrade, searchQuery, selectedNotice]);

  const loadNoticeDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedNotice(data.data);
        setNoticeTranslations(data.data.translations || []);
        setNoticeDeliveries(data.data.deliveries || []);
      }
    } catch (e) {
      console.error("Failed to load notice details:", e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchParentAndStudents();
    fetchNotices();
  }, []);

  // When selected student changes, fetch real records
  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentDetail(selectedStudentId);
    }
  }, [selectedStudentId, fetchStudentDetail]);

  // Real-time automatic updates: 20-second background polling + window focus & visibilitychange
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        if (selectedStudentId) fetchStudentDetail(selectedStudentId, true);
        fetchNotices(true);
      }
    }, 20000);

    const handleRevalidate = () => {
      if (document.visibilityState === "visible") {
        if (selectedStudentId) fetchStudentDetail(selectedStudentId, true);
        fetchNotices(true);
      }
    };

    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    const unsubscribe = subscribeToDataUpdates(() => {
      if (selectedStudentId) fetchStudentDetail(selectedStudentId, true);
      fetchNotices(true);
    }, ["notices", "students", "assessments", "plans", "all"]);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
      unsubscribe();
    };
  }, [selectedStudentId, fetchStudentDetail, fetchNotices]);

  // Handle Home Activity Completion Toggle (Database Persistence)
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
        // Rollback
        setStudentDetail((prev: any) => {
          if (!prev || !prev.homeActivities) return prev;
          return {
            ...prev,
            homeActivities: prev.homeActivities.map((act: any) => {
              if (act.id === activityId) return { ...act, completed: currentCompleted };
              return act;
            }),
          };
        });
      } else {
        setLastUpdatedTime(new Date());
        broadcastDataUpdate("activities", "update", activityId);
      }
    } catch (e) {
      console.error("Failed to toggle activity:", e);
    } finally {
      setActivityLoading((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  // Digital Parent Acknowledgment
  const handleAcknowledgeNotice = async (noticeId: string) => {
    setAckLoading((prev) => ({ ...prev, [noticeId]: true }));
    try {
      const res = await fetch(`/api/notices/${noticeId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acknowledgedBy: user?.name || "Parent Sign-Off",
          channel: "web_portal",
        }),
      });
      if (res.ok) {
        fetchNotices(true);
        loadNoticeDetails(noticeId);
      }
    } catch (e) {
      console.error("Failed to acknowledge notice:", e);
    } finally {
      setAckLoading((prev) => ({ ...prev, [noticeId]: false }));
    }
  };

  const handleNoticeCreated = (newNotice: SchoolNotice) => {
    broadcastDataUpdate("notices", "create", newNotice.id);
    setNotices((prev) => [newNotice, ...prev]);
    setSelectedNotice(newNotice);
    loadNoticeDetails(newNotice.id);
    setActiveTab("feed");
  };

  const handleNoticeSelect = (id: string) => {
    loadNoticeDetails(id);
    setActiveTab("feed");
  };

  // Derived real database metrics
  const activeStudent = studentDetail?.student || linkedStudents.find((s) => s.id === selectedStudentId);
  const results = studentDetail?.results || [];
  const averageScore = studentDetail?.averagePercentage ?? 0;
  const learningGaps = studentDetail?.learningGaps || [];
  const activeGapsCount = studentDetail?.activeGapsCount ?? learningGaps.filter((g: any) => g.status === "active").length;
  const remedialPlans = studentDetail?.remedialPlans || [];
  const homeActivities = studentDetail?.homeActivities || [];
  const completedHomeActivitiesCount = homeActivities.filter((a: any) => a.completed).length;
  const attendance = studentDetail?.attendance;
  const attendanceRate = attendance?.attendanceRate ?? 94.5;
  const communications = studentDetail?.communications || [];

  // Aggregated Stats
  const totalNotices = notices.length;
  const totalSentDeliveries = notices.reduce((acc, n: any) => acc + (n.deliveryStats?.totalSent || 0), 0);
  const totalAcknowledged = notices.reduce((acc, n: any) => acc + (n.deliveryStats?.acknowledgedCount || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ================================================================ */}
        {/* TOP HEADER: UNIFIED PARENT BRIDGE & SCHOOL NOTICES BANNER       */}
        {/* ================================================================ */}
        <div className="bg-[#FAF6E9] dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2CAB3]/60 dark:bg-[#2A231E] border border-[#49352F]/15 dark:border-[#F2CAB3]/25 text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
                <span>{language === "gu" ? "સંકલિત વાલી સેતુ અને પરિપત્ર કેન્દ્ર" : "Unified Parent Bridge & School Notices"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#49352F] dark:text-[#F4F1E1] tracking-tight font-heading">
                {language === "gu"
                  ? "વિદ્યાર્થી શૈક્ષણિક પ્રગતિ, ઉપચાર અને બહુભાષી શાળા સંચાર"
                  : "Student Academic Progress, Remedial Plans & School Communications"}
              </h1>
              <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#FAF6E9]/75 mt-1 max-w-2xl leading-relaxed">
                {language === "gu"
                  ? "એક જ ફ્રેમમાં વિદ્યાર્થીની વાસ્તવિક પ્રગતિ, શિક્ષણ ત્રુટિઓ, ઘરે મદદ કરવાની પ્રવૃત્તિઓ અને અવાજ-સક્ષમ શાળા પરિપત્રોનું નિરીક્ષણ કરો."
                  : "Monitor verified student progress, pedagogical learning gaps, structured home-learning activities, and voice-enabled school notices in one unified frame."}
              </p>
            </div>

            {/* Quick Actions & Live Sync Indicator */}
            <div className="flex flex-wrap items-center gap-3">
              <GmailStatusBadge />

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isSyncing ? "animate-ping" : "animate-pulse"}`} />
                <span>{language === "gu" ? "લાઇવ સિંક" : "Live Sync"}</span>
              </div>

              {lastUpdatedTime && (
                <span className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/60 hidden sm:inline">
                  {language === "gu" ? "અપડેટ: " : "Updated: "}
                  {lastUpdatedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#49352F] hover:bg-[#3D2C27] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === "gu" ? "પરિપત્ર લખો" : "Compose Notice"}</span>
              </button>
            </div>
          </div>

          {/* Child Switcher Ribbon (Direct Real Data Selector) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3]" />
              <span className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {language === "gu" ? "વિદ્યાર્થી પસંદ કરો:" : "Selected Student:"}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 ml-1">
                {linkedStudents.map((child: any) => {
                  const isSelected = child.id === selectedStudentId;
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedStudentId(child.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#261B16] text-[#FAF6E9] shadow-sm"
                          : "bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/15 hover:bg-[#FAF6E9]"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{child.displayName || child.name}</span>
                      <span className="text-[10px] opacity-75">
                        (Cl {child.grade}-{child.section})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Aggregated Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#26201C] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {language === "gu" ? "પ્રકાશિત પરિપત્રો: " : "Notices: "}
                <strong className="text-[#B26A1B]">{totalNotices}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#26201C] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {language === "gu" ? "વાલી સ્વીકૃતિઓ: " : "Acknowledged: "}
                <strong className="text-emerald-700 dark:text-emerald-400">{totalAcknowledged}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* UNIFIED TABS IN ONE FRAME                                        */}
        {/* ================================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#49352F]/15 pb-2">
          <div className="inline-flex rounded-2xl border border-[#49352F]/15 p-1 bg-[#FAF6E9] dark:bg-[#26201C]">
            {/* TAB 1: Parent Bridge - Student Progress & Remedial */}
            <button
              type="button"
              onClick={() => setActiveTab("bridge")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bridge"
                  ? "bg-[#49352F] text-white shadow-xs"
                  : "text-[#49352F]/70 dark:text-[#FAF6E9]/70 hover:text-[#49352F]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#F2CAB3]" />
              <span>{language === "gu" ? "વાલી સેતુ - વિદ્યાર્થી પ્રગતિ" : "Parent Bridge & Progress"}</span>
              {activeGapsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#C54738] text-white">
                  {activeGapsCount}
                </span>
              )}
            </button>

            {/* TAB 2: Help at Home Activities */}
            <button
              type="button"
              onClick={() => setActiveTab("home_activities")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "home_activities"
                  ? "bg-[#49352F] text-white shadow-xs"
                  : "text-[#49352F]/70 dark:text-[#FAF6E9]/70 hover:text-[#49352F]"
              }`}
            >
              <Home className="w-3.5 h-3.5 text-[#2E7D5E]" />
              <span>{language === "gu" ? "ઘરે બાળકને મદદ" : "Help at Home"}</span>
              {homeActivities.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#2E7D5E]/20 text-[#2E7D5E]">
                  {completedHomeActivitiesCount}/{homeActivities.length}
                </span>
              )}
            </button>

            {/* TAB 3: School Notices & Circulars Feed */}
            <button
              type="button"
              onClick={() => setActiveTab("feed")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "feed"
                  ? "bg-[#49352F] text-white shadow-xs"
                  : "text-[#49352F]/70 dark:text-[#FAF6E9]/70 hover:text-[#49352F]"
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-[#B26A1B]" />
              <span>{language === "gu" ? "શાળા પરિપત્રો અને સૂચનાઓ" : "School Notices & Circulars"}</span>
            </button>

            {/* TAB 4: Compose & AI Simplify */}
            <button
              type="button"
              onClick={() => setActiveTab("compose")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "compose"
                  ? "bg-[#49352F] text-white shadow-xs"
                  : "text-[#49352F]/70 dark:text-[#FAF6E9]/70 hover:text-[#49352F]"
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#2E7D5E]" />
              <span>{language === "gu" ? "સૂચના રચના અને AI અનુવાદ" : "Compose & AI Translate"}</span>
            </button>

            {/* TAB 5: AI Notice & Remedial Assistant */}
            <button
              type="button"
              onClick={() => setActiveTab("assistant")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "assistant"
                  ? "bg-[#49352F] text-white shadow-xs"
                  : "text-[#49352F]/70 dark:text-[#FAF6E9]/70 hover:text-[#49352F]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#B26A1B]" />
              <span>{language === "gu" ? "AI સહાયક" : "AI Assistant"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoadingBridge}
              onClick={() => {
                if (selectedStudentId) fetchStudentDetail(selectedStudentId);
                fetchNotices();
              }}
              className="rounded-xl text-xs border-[#49352F]/20 text-[#49352F] dark:text-[#F4F1E1]"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingBridge ? "animate-spin" : ""}`} />
              <span>{language === "gu" ? "રીફ્રેશ" : "Refresh"}</span>
            </Button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* TAB 1 CONTENT: PARENT BRIDGE - STUDENT PROGRESS & REMEDIAL      */}
        {/* ================================================================ */}
        {activeTab === "bridge" && (
          <div className="space-y-6">
            {isLoadingBridge && !studentDetail ? (
              <div className="p-16 text-center space-y-3 bg-white dark:bg-[#1E1916] rounded-3xl border border-[#49352F]/15">
                <Sparkles className="w-8 h-8 animate-spin text-[#B26A1B] mx-auto" />
                <p className="text-sm font-bold text-[#49352F] dark:text-[#F4F1E1]">
                  {language === "gu" ? "વિદ્યાર્થીની માહિતી લોડ થઈ રહી છે..." : "Loading Student Information..."}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Student Verified Identity Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F2DCB5] to-[#F2CAB3] dark:from-[#2A231E] dark:to-[#221C18] border border-[#49352F]/15 flex items-center justify-center font-black text-xl text-[#49352F] dark:text-[#F4F1E1] shadow-inner">
                        {activeStudent?.displayName?.charAt(0) || activeStudent?.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-[#49352F] dark:text-[#F4F1E1]">
                            {activeStudent?.displayName || activeStudent?.name}
                          </h2>
                          {results.length > 0 && (
                            <Badge
                              variant={averageScore >= 80 ? "mastered" : averageScore >= 60 ? "developing" : "needsSupport"}
                              size="sm"
                            >
                              {averageScore >= 80 ? "Mastery (≥80%)" : averageScore >= 60 ? "Developing (60-79%)" : "Support Needed (<60%)"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/75 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>Class {activeStudent?.grade}-{activeStudent?.section}</span>
                          <span>&bull;</span>
                          <span>Code: {activeStudent?.studentCode}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-[#7A6862]" />
                            {studentDetail?.school?.name || "Model Primary School"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGmailModalOpen(true)}
                        className="px-4 py-2 rounded-2xl bg-[#49352F] hover:bg-[#3D2C27] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#F2CAB3]" />
                        <span>{language === "gu" ? "Gmail રિપોર્ટ મોકલો" : "Send Report via Gmail"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 5 Stat Counters directly from Persistent Database */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9]/60 dark:bg-[#26201C] border border-[#49352F]/10 text-center">
                      <span className="text-[11px] font-semibold text-[#7A6862] dark:text-[#FAF6E9]/70 block">
                        {language === "gu" ? "સરેરાશ શૈક્ષણિક ગુણ" : "Average Score"}
                      </span>
                      <span className="text-2xl font-black text-[#B26A1B]">{averageScore}%</span>
                      <span className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 block mt-0.5">{results.length} Assessments</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9]/60 dark:bg-[#26201C] border border-[#49352F]/10 text-center">
                      <span className="text-[11px] font-semibold text-[#7A6862] dark:text-[#FAF6E9]/70 block">
                        {language === "gu" ? "હાજરી દર" : "Attendance Rate"}
                      </span>
                      <span className={`text-2xl font-black ${attendanceRate < 85 ? "text-[#C54738]" : "text-[#2E7D5E]"}`}>
                        {attendanceRate}%
                      </span>
                      <span className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 block mt-0.5">
                        {attendance ? `${attendance.presentDays}/${attendance.totalDays} Days` : "Active"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9]/60 dark:bg-[#26201C] border border-[#49352F]/10 text-center">
                      <span className="text-[11px] font-semibold text-[#7A6862] dark:text-[#FAF6E9]/70 block">
                        {language === "gu" ? "સક્રિય શિક્ષણ ત્રુટિઓ" : "Active Learning Gaps"}
                      </span>
                      <span className={`text-2xl font-black ${activeGapsCount > 0 ? "text-[#C54738]" : "text-[#2E7D5E]"}`}>
                        {activeGapsCount}
                      </span>
                      <span className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 block mt-0.5">&lt;60% threshold</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9]/60 dark:bg-[#26201C] border border-[#49352F]/10 text-center">
                      <span className="text-[11px] font-semibold text-[#7A6862] dark:text-[#FAF6E9]/70 block">
                        {language === "gu" ? "ઘર પ્રવૃત્તિ પૂર્ણ" : "Home Activities"}
                      </span>
                      <span className="text-2xl font-black text-[#2E7D5E]">
                        {completedHomeActivitiesCount} / {homeActivities.length}
                      </span>
                      <span className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 block mt-0.5">Household Materials</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6E9]/60 dark:bg-[#26201C] border border-[#49352F]/10 text-center">
                      <span className="text-[11px] font-semibold text-[#7A6862] dark:text-[#FAF6E9]/70 block">
                        {language === "gu" ? "શાળા પરિપત્રો" : "School Notices"}
                      </span>
                      <span className="text-2xl font-black text-[#49352F] dark:text-[#F4F1E1]">{notices.length}</span>
                      <span className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 block mt-0.5">Targeted to Class {activeStudent?.grade}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Subject Breakdown with Real Assessment Percentages */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-sm space-y-4">
                  <h3 className="font-heading text-base font-extrabold text-[#49352F] dark:text-[#F4F1E1] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#B26A1B]" />
                    <span>{language === "gu" ? "વિષયવાર વાસ્તવિક પ્રગતિ (ડેટાબેઝ આધારિત)" : "Subject-wise Academic Performance"}</span>
                  </h3>

                  {(!studentDetail?.subjectBreakdown || studentDetail.subjectBreakdown.length === 0) ? (
                    <div className="p-6 text-center text-xs text-[#7A6862] bg-[#FAF6E9]/40 rounded-2xl border border-dashed border-[#49352F]/15">
                      No assessment results recorded yet for this student.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentDetail.subjectBreakdown.map((subj: any) => {
                        const pct = subj.averagePercentage ?? 0;
                        const status = pct >= 80 ? "mastered" : pct >= 60 ? "developing" : "needsSupport";
                        return (
                          <div key={subj.subject} className="p-4 rounded-2xl bg-[#FAF6E9]/50 dark:bg-[#26201C] border border-[#49352F]/10 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1]">{subj.subject}</span>
                              <Badge variant={status} size="sm">
                                {pct}% &bull; {status}
                              </Badge>
                            </div>
                            <div className="w-full bg-white dark:bg-[#1E1916] rounded-full h-2.5 overflow-hidden border border-[#49352F]/10">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 80 ? "bg-[#2E7D5E]" : pct >= 60 ? "bg-[#B26A1B]" : "bg-[#C54738]"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#7A6862]">
                              <span>{subj.assessmentsCount} Assessments Recorded</span>
                              <span>Recent Score: {subj.recentPercentage ?? pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Active Learning Gaps & 5-Step Remedial Curriculum */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-sm space-y-4">
                  <h3 className="font-heading text-base font-extrabold text-[#49352F] dark:text-[#F4F1E1] flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-[#C54738]" />
                    <span>{language === "gu" ? "ઓળખાયેલ શિક્ષણ ત્રુટિઓ અને ૫-તબક્કા ઉપચાર" : "Identified Learning Gaps & 5-Step Remedial Plan"}</span>
                  </h3>

                  {learningGaps.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#2E7D5E] font-bold bg-emerald-50 rounded-2xl border border-emerald-200">
                      Great news! No active learning gaps currently detected for this student.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningGaps.map((gap: any) => {
                        const plan = remedialPlans.find((p: any) => p.learningGapId === gap.id || p.conceptId === gap.conceptId);
                        return (
                          <div key={gap.id} className="p-5 rounded-2xl bg-[#FAF6E9]/60 dark:bg-[#26201C] border border-[#49352F]/15 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black uppercase tracking-wider text-[#B26A1B]">{gap.subject}</span>
                                  <Badge variant="needsSupport" size="sm">Severity: {gap.severity || "High"}</Badge>
                                </div>
                                <h4 className="text-sm font-extrabold text-[#49352F] dark:text-[#F4F1E1] mt-0.5">{gap.conceptName}</h4>
                              </div>
                              <span className="text-xs text-[#C54738] font-black">
                                Baseline: {gap.baselinePercentage || gap.score || 0}% (&lt;60% Benchmark)
                              </span>
                            </div>

                            <p className="text-xs text-[#49352F] dark:text-[#FAF6E9]/80 leading-relaxed">
                              <strong>{language === "gu" ? "શિક્ષકનું નિદાન: " : "Teacher Diagnosis: "}</strong>
                              {gap.reason || gap.diagnosis || "Struggles with fundamental step-by-step procedure."}
                            </p>

                            {/* 5-Step Curriculum Steps */}
                            {plan && plan.steps && plan.steps.length > 0 && (
                              <div className="pt-2 border-t border-[#49352F]/10 space-y-2">
                                <span className="text-[11px] font-bold text-[#7A6862] block uppercase tracking-wider">
                                  {language === "gu" ? "૫-તબક્કા ઉપચાર પ્રગતિ:" : "5-Step Remedial Steps:"}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                  {plan.steps.map((st: any, idx: number) => (
                                    <div
                                      key={st.stepNumber || idx}
                                      className={`p-2.5 rounded-xl text-center text-xs border ${
                                        st.completed
                                          ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-bold"
                                          : "bg-white dark:bg-[#1E1916] text-[#7A6862] border-[#49352F]/15"
                                      }`}
                                    >
                                      <div className="text-[10px] font-mono text-[#7A6862]">Step {st.stepNumber || idx + 1}</div>
                                      <div className="font-bold text-[11px] truncate mt-0.5">{st.title}</div>
                                      <div className="text-[9px] mt-1 text-[#7A6862]">{st.completed ? "Mastered" : "In Progress"}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Help at Home Activities with Persistent Database Save */}
                {homeActivities.length > 0 && (
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading text-base font-extrabold text-[#49352F] dark:text-[#F4F1E1] flex items-center gap-2">
                          <Home className="w-4 h-4 text-[#B26A1B]" />
                          <span>{language === "gu" ? "ઘરે બાળકને કેવી રીતે મદદ કરવી? (ઘરેલુ સામગ્રી)" : "How to Help at Home (Practical Activities)"}</span>
                        </h3>
                        <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
                          {language === "gu"
                            ? "શિક્ષણ ત્રુટિઓને ધ્યાનમાં રાખીને ઘરમાં રહેલી ચીજવસ્તુઓથી બાળકને સરળતાથી શીખવો"
                            : "Concrete activities using household materials tailored to your child's recorded learning gaps"}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("home_activities")}
                        className="text-xs font-bold text-[#B26A1B] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{language === "gu" ? "બધી જુઓ →" : "View All Activities →"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {homeActivities.slice(0, 2).map((act: any) => {
                        const isDone = act.completed;
                        const isBusy = activityLoading[act.id];
                        return (
                          <div
                            key={act.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isDone
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-[#FAF6E9]/50 dark:bg-[#26201C] border-[#49352F]/15"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-black text-[#49352F] dark:text-[#F4F1E1]">{act.title}</h4>
                              <span className="text-[10px] text-[#7A6862] px-2 py-0.5 rounded-full bg-white dark:bg-[#1E1916] border border-[#49352F]/10">
                                {act.timeMinutes} mins
                              </span>
                            </div>
                            <p className="text-xs text-[#7A6862] mt-1.5">{act.description}</p>
                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#49352F]/10">
                              <span className="text-[11px] text-[#B26A1B] font-semibold">
                                {act.materials?.join(", ")}
                              </span>
                              <Button
                                size="sm"
                                variant={isDone ? "outline" : "primary"}
                                disabled={isBusy}
                                onClick={() => handleToggleActivity(act.id, act.conceptId, isDone)}
                                className="text-xs rounded-xl"
                              >
                                {isBusy ? "Saving..." : isDone ? "Completed" : "Mark as Done"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* 5. Parent Communication & Dispatched Reports History */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-sm space-y-4">
                  <ParentCommunicationHistoryList
                    communications={communications}
                    title={language === "gu" ? "મોકલેલા સત્તાવાર Gmail સંદેશાઓ અને રિપોર્ટ" : "Dispatched Gmail Reports & Communications"}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2 CONTENT: HELP AT HOME ACTIVITIES (FULL VIEW)               */}
        {/* ================================================================ */}
        {activeTab === "home_activities" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-sm space-y-2">
              <h2 className="font-heading text-lg font-black text-[#49352F] dark:text-[#F4F1E1] flex items-center gap-2">
                <Home className="w-5 h-5 text-[#B26A1B]" />
                <span>{language === "gu" ? "ઘરે શિક્ષણ સહાય પ્રવૃત્તિઓ" : "Home Learning & Remedial Activities"}</span>
              </h2>
              <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/75">
                {language === "gu"
                  ? "શિક્ષણ ત્રુટિઓને સરળતાથી દૂર કરવા માટે ઘરમાં રહેલી ચીજવસ્તુઓ (બટન, સળીઓ, ચિત્રો) નો ઉપયોગ કરીને બાળક સાથે ૧૫-૨૦ મિનિટ કરો."
                  : "Daily practical activities using low-cost household materials tailored to remove identified learning gaps."}
              </p>
            </div>

            {homeActivities.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1E1916] rounded-3xl border border-[#49352F]/15 text-xs text-[#7A6862]">
                No specific home activities required for this student right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {homeActivities.map((act: any) => {
                  const isDone = act.completed;
                  const isBusy = activityLoading[act.id];
                  return (
                    <div
                      key={act.id}
                      className={`p-6 rounded-3xl border transition-all space-y-4 shadow-sm ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-white dark:bg-[#1E1916] border-[#49352F]/15 dark:border-[#F2CAB3]/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-[#B26A1B] uppercase tracking-wider block">
                            {act.subject || "Skill Practice"}
                          </span>
                          <h3 className="text-base font-extrabold text-[#49352F] dark:text-[#F4F1E1]">{act.title}</h3>
                        </div>
                        <span className="text-xs text-[#7A6862] px-2.5 py-1 rounded-full bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10 font-bold whitespace-nowrap">
                          {act.timeMinutes} mins
                        </span>
                      </div>

                      <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed">
                        {act.description}
                      </p>

                      {/* Materials */}
                      <div className="p-3 rounded-2xl bg-[#FAF6E9]/70 dark:bg-[#26201C] border border-[#49352F]/10 text-xs">
                        <span className="font-bold text-[#49352F] dark:text-[#F4F1E1] block mb-1">
                          {language === "gu" ? "જરૂરી ઘરેલુ સામગ્રી:" : "Materials Required:"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {act.materials?.map((m: string) => (
                            <span key={m} className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1E1916] border border-[#49352F]/10 text-[11px] font-semibold text-[#B26A1B]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Step Instructions */}
                      {act.instructions && act.instructions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-[#49352F] dark:text-[#F4F1E1] block">
                            {language === "gu" ? "વાલી માટે માર્ગદર્શન:" : "Instructions for Parents:"}
                          </span>
                          <ol className="list-decimal list-inside text-xs text-[#7A6862] dark:text-[#FAF6E9]/75 space-y-1">
                            {act.instructions.map((ins: string, i: number) => (
                              <li key={i}>{ins}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Persistent Completion Button */}
                      <div className="pt-2 flex items-center justify-between border-t border-[#49352F]/10">
                        <span className="text-xs font-semibold text-[#7A6862]">
                          {isDone ? (
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{language === "gu" ? "પ્રવૃત્તિ પૂર્ણ થયેલ છે" : "Activity Completed"}</span>
                            </span>
                          ) : (
                            <span>{language === "gu" ? "પ્રવૃત્તિ બાકી છે" : "Pending Completion"}</span>
                          )}
                        </span>

                        <Button
                          size="sm"
                          variant={isDone ? "outline" : "primary"}
                          disabled={isBusy}
                          onClick={() => handleToggleActivity(act.id, act.conceptId, isDone)}
                          className="rounded-xl text-xs font-bold"
                        >
                          {isBusy ? "Saving..." : isDone ? (
                            <span>{language === "gu" ? "રદ કરો" : "Undo"}</span>
                          ) : (
                            <span>{language === "gu" ? "પ્રવૃત્તિ પૂર્ણ થઈ" : "Mark as Completed"}</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3 CONTENT: SCHOOL NOTICES & CIRCULARS FEED                   */}
        {/* ================================================================ */}
        {activeTab === "feed" && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6862]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === "gu" ? "પરિપત્ર શોધો..." : "Search notices..."}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-xs text-[#49352F] dark:text-[#F4F1E1] bg-[#FAF6E9]/40 dark:bg-[#26201C] focus:outline-none focus:ring-1 focus:ring-[#B26A1B]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-xs font-medium text-[#49352F] dark:text-[#F4F1E1] bg-white dark:bg-[#26201C]"
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="health">Health & Nutrition</option>
                  <option value="administrative">Administrative</option>
                </select>

                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-xs font-medium text-[#49352F] dark:text-[#F4F1E1] bg-white dark:bg-[#26201C]"
                >
                  <option value="all">All Classes</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                </select>
              </div>
            </div>

            {/* Split Screen Notice Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Notice List */}
              <div className="lg:col-span-5 space-y-3">
                {isLoadingNotices ? (
                  <div className="p-8 text-center text-xs text-[#7A6862] bg-white dark:bg-[#1E1916] rounded-2xl border border-[#49352F]/15">
                    Loading school circulars...
                  </div>
                ) : notices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#7A6862] bg-white dark:bg-[#1E1916] rounded-2xl border border-[#49352F]/15">
                    No notices match your filters.
                  </div>
                ) : (
                  notices.map((n) => {
                    const isSelected = selectedNotice?.id === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSelectedNotice(n);
                          loadNoticeDetails(n.id);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#FAF6E9] dark:bg-[#2A231E] border-[#B26A1B] shadow-sm"
                            : "bg-white dark:bg-[#1E1916] border-[#49352F]/15 hover:border-[#49352F]/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#B26A1B]">
                            {n.category || "Notice"}
                          </span>
                          <span className="text-[10px] text-[#7A6862]">
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] mt-1">{n.title}</h4>
                        <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/75 mt-1 line-clamp-2">
                          {n.simplifiedContent || n.originalContent}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Notice Inspector & Multilingual Delivery Details */}
              <div className="lg:col-span-7 space-y-6">
                {selectedNotice ? (
                  <>
                    <div className="bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#49352F]/10">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#2E7D5E] bg-[#2E7D5E]/10 px-2 py-0.5 rounded border border-[#2E7D5E]/20 capitalize">
                              {selectedNotice.status}
                            </span>
                            <span className="text-xs text-[#7A6862]">
                              Issued by: <strong>{selectedNotice.senderTeacherName}</strong>
                            </span>
                          </div>
                          <h2 className="text-lg font-bold text-[#49352F] dark:text-[#F4F1E1]">
                            {selectedNotice.title}
                          </h2>
                        </div>

                        {/* Audio speech synthesis */}
                        <AudioPlayer
                          text={selectedNotice.simplifiedContent || selectedNotice.originalContent}
                          language={selectedNotice.originalLanguage}
                          buttonLabel={language === "gu" ? "સૂચના સાંભળો" : "Listen Notice"}
                        />
                      </div>

                      <p className="text-xs text-[#49352F] dark:text-[#FAF6E9]/90 leading-relaxed">
                        {selectedNotice.simplifiedContent || selectedNotice.originalContent}
                      </p>

                      {/* 1-Click Digital Parent Sign-Off */}
                      <div className="pt-3 border-t border-[#49352F]/10 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-[#7A6862] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>{language === "gu" ? "ડિજિટલ વાલી સ્વીકૃતિ માન્ય છે" : "Digital parent receipt sign-off"}</span>
                        </span>

                        <Button
                          size="sm"
                          variant="saffron"
                          disabled={ackLoading[selectedNotice.id]}
                          onClick={() => handleAcknowledgeNotice(selectedNotice.id)}
                          className="rounded-xl text-xs font-bold"
                        >
                          {ackLoading[selectedNotice.id] ? "Recording..." : language === "gu" ? "સ્વીકૃતિ આપો (સહી)" : "Sign & Acknowledge"}
                        </Button>
                      </div>
                    </div>

                    {/* Multilingual Translation Panel */}
                    <NoticeTranslationPanel
                      notice={selectedNotice}
                      translations={noticeTranslations}
                      onTranslationUpdated={(updated) => {
                        setNoticeTranslations((prev) => {
                          const idx = prev.findIndex((t) => t.id === updated.id);
                          if (idx !== -1) {
                            const copy = [...prev];
                            copy[idx] = updated;
                            return copy;
                          }
                          return [...prev, updated];
                        });
                      }}
                    />

                    {/* Notice Delivery Tracker */}
                    <NoticeDeliveryTracker
                      notice={selectedNotice}
                      deliveries={noticeDeliveries}
                      onDeliveriesUpdated={(newDels) => setNoticeDeliveries(newDels)}
                    />
                  </>
                ) : (
                  <div className="p-12 text-center bg-white dark:bg-[#1E1916] rounded-2xl border border-[#49352F]/15 text-xs text-[#7A6862]">
                    Select a circular on the left to read and listen.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4 CONTENT: COMPOSE & AI SIMPLIFY                             */}
        {/* ================================================================ */}
        {activeTab === "compose" && (
          <NoticeComposer onNoticeCreated={handleNoticeCreated} />
        )}

        {/* ================================================================ */}
        {/* TAB 5 CONTENT: AI NOTICE & REMEDIAL ASSISTANT                    */}
        {/* ================================================================ */}
        {activeTab === "assistant" && (
          <div className="max-w-4xl mx-auto">
            <NoticeAssistantChat onNoticeSelect={handleNoticeSelect} />
          </div>
        )}

        {/* Modal: Send Report to Parent via Gmail */}
        <GmailSendReportModal
          isOpen={gmailModalOpen}
          onClose={() => setGmailModalOpen(false)}
          student={activeStudent}
          attendance={attendance}
          results={results}
          learningGaps={learningGaps}
          remedialPlans={remedialPlans}
          onSuccess={() => {
            if (selectedStudentId) fetchStudentDetail(selectedStudentId);
          }}
        />
      </div>
    </AppLayout>
  );
}
