"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { StatTile } from "@/components/ui/StatTile";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  MeetingStatusBadge,
  MeetingTypeBadge,
  RsvpStatusBadge,
  formatMeetingDateTime,
  toLocalDateTimeInput,
} from "@/components/ptm/MeetingStatusBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { WhatsAppShareButton } from "@/components/ptm/WhatsAppShareButton";
import { MeetingNotesModal } from "@/components/ptm/MeetingNotesModal";
import { MeetingAttendanceModal } from "@/components/ptm/MeetingAttendanceModal";
import { buildMeetingJoinUrl } from "@/lib/auth/signedMeetingToken";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import type { MeetingWithInvites, MeetingType, MeetingTargetMode } from "@shared/types";
import {
  CalendarClock,
  Plus,
  Clock,
  Users,
  UserCheck,
  RefreshCw,
  Edit3,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles,
  GraduationCap,
} from "lucide-react";

type TargetData = Awaited<ReturnType<typeof apiClient.getPtmTargets>>;

function getMeetingDateParts(isoString: string, lang: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { month: "--", day: "--", time: "--" };
    }
    const month = d.toLocaleDateString(lang === "gu" ? "gu-IN" : "en-IN", { month: "short" }).toUpperCase();
    const day = d.toLocaleDateString(lang === "gu" ? "gu-IN" : "en-IN", { day: "numeric" });
    const time = d.toLocaleTimeString(lang === "gu" ? "gu-IN" : "en-IN", { hour: "numeric", minute: "2-digit" });
    return { month, day, time };
  } catch {
    return { month: "--", day: "--", time: "--" };
  }
}

export default function TeacherMeetingsPage() {
  const router = useRouter();
  const { t, language, formatClass } = useLanguage();
  const { user } = useAuth();

  const [meetings, setMeetings] = useState<MeetingWithInvites[]>([]);
  const [targets, setTargets] = useState<TargetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"upcoming" | "live" | "past">("upcoming");
  const [expandedInvites, setExpandedInvites] = useState<Record<string, boolean>>({});

  // Schedule Form Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingWithInvites | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("one_to_one");
  const [startTimeLocal, setStartTimeLocal] = useState(() => toLocalDateTimeInput());
  const [durationMin, setDurationMin] = useState(20);
  const [targetMode, setTargetMode] = useState<MeetingTargetMode>("class");
  const [selectedClassId, setSelectedClassId] = useState("cls-4a");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [offeredSlots, setOfferedSlots] = useState<string[]>([]);

  // Cancel confirmation modal
  const [cancelTarget, setCancelTarget] = useState<MeetingWithInvites | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Notes and Attendance modal states (PTM Step 4)
  const [notesTarget, setNotesTarget] = useState<MeetingWithInvites | null>(null);
  const [attendanceTarget, setAttendanceTarget] = useState<MeetingWithInvites | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [meetingsRes, targetsRes] = await Promise.all([
        apiClient.getTeacherMeetings(),
        apiClient.getPtmTargets(),
      ]);
      setMeetings(meetingsRes.meetings || []);
      setTargets(targetsRes);
      if (targetsRes.parents?.length > 0) {
        setSelectedParentId((prev) => prev || targetsRes.parents[0].id);
      }
      if (targetsRes.classrooms?.length > 0) {
        setSelectedClassId((prev) => prev || targetsRes.classrooms[0].id);
      }
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const upcomingMeetings = useMemo(
    () => meetings.filter((m) => m.status === "scheduled"),
    [meetings]
  );
  const liveMeetings = useMemo(
    () => meetings.filter((m) => m.status === "live"),
    [meetings]
  );
  const pastMeetings = useMemo(
    () => meetings.filter((m) => m.status === "ended" || m.status === "cancelled"),
    [meetings]
  );

  const acceptedInvitesCount = useMemo(
    () =>
      meetings.reduce(
        (acc, m) => acc + m.invites.filter((i) => i.rsvpStatus === "accepted").length,
        0
      ),
    [meetings]
  );

  const displayedMeetings =
    activeTab === "upcoming"
      ? upcomingMeetings
      : activeTab === "live"
      ? liveMeetings
      : pastMeetings;

  const openCreateModal = () => {
    const defaultStart = toLocalDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    setEditingMeeting(null);
    setTitle("");
    setAgenda("");
    setMeetingType("one_to_one");
    setStartTimeLocal(defaultStart);
    setDurationMin(20);
    setTargetMode("class");
    setSelectedClassId(targets?.classrooms?.[0]?.id || "cls-4a");
    setSelectedStudentIds([]);
    setSelectedParentId(targets?.parents?.[0]?.id || "");
    setOfferedSlots([
      defaultStart,
      toLocalDateTimeInput(new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()),
    ]);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (m: MeetingWithInvites) => {
    setEditingMeeting(m);
    setTitle(m.title);
    setAgenda(m.agenda);
    setMeetingType(m.type);
    setStartTimeLocal(toLocalDateTimeInput(m.startTime));
    setDurationMin(m.durationMin);
    setOfferedSlots((m.offeredSlots || []).map((s) => toLocalDateTimeInput(s)));
    setFormError(null);
    setFormOpen(true);
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleAddSlot = () => {
    const nextSlot = toLocalDateTimeInput(
      new Date(Date.now() + (offeredSlots.length + 2) * 24 * 60 * 60 * 1000).toISOString()
    );
    setOfferedSlots((prev) => [...prev, nextSlot]);
  };

  const handleSlotChange = (index: number, value: string) => {
    setOfferedSlots((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const handleRemoveSlot = (index: number) => {
    setOfferedSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError(t.ptm.titleLabel + " is required.");
      return;
    }

    const startIso = new Date(startTimeLocal).toISOString();
    const validSlots =
      meetingType === "one_to_one"
        ? offeredSlots
            .filter((s) => s && !isNaN(new Date(s).getTime()))
            .map((s) => new Date(s).toISOString())
        : [];

    setSubmitting(true);
    try {
      if (editingMeeting) {
        await apiClient.updateMeeting(editingMeeting.id, {
          title: title.trim(),
          agenda: agenda.trim(),
          startTime: startIso,
          durationMin: Number(durationMin),
          offeredSlots: editingMeeting.type === "one_to_one" ? validSlots : undefined,
        });
        setFeedback(t.ptm.updateSuccess);
      } else {
        await apiClient.createMeeting({
          title: title.trim(),
          agenda: agenda.trim(),
          type: meetingType,
          startTime: startIso,
          durationMin: Number(durationMin),
          targetMode,
          classId: targetMode === "class" ? selectedClassId : undefined,
          studentIds: targetMode === "students" ? selectedStudentIds : undefined,
          parentId: targetMode === "parent" ? selectedParentId : undefined,
          offeredSlots: validSlots,
        });
        setFeedback(t.ptm.createSuccess);
      }

      setFormOpen(false);
      await loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFormError(err.message || t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await apiClient.cancelMeeting(cancelTarget.id);
      setCancelTarget(null);
      setFeedback(t.ptm.cancelSuccess);
      await loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setCancelling(false);
    }
  };

  const studentsWithParents = useMemo(
    () => (targets?.students || []).filter((s) => s.linkedParents.length > 0),
    [targets]
  );

  const totalParentsInvited = useMemo(
    () => meetings.reduce((acc, m) => acc + (m.invites?.length || 0), 0),
    [meetings]
  );

  return (
    <AppLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#F2CAB3] border border-[#49352F]/15 flex items-center justify-center text-[#49352F] shadow-xs">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-[#49352F] dark:text-[#F4F1E1]">
                  {t.ptm.pageTitle}
                </h1>
                <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#FAF6E9]/70">
                  {t.ptm.pageSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            >
              {t.ptm.refresh}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t.ptm.scheduleBtn}
            </Button>
          </div>
        </div>

        {/* Summary Stat Grid like the Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <StatTile
            label={t.ptm.summaryUpcoming || "Upcoming Meetings"}
            value={upcomingMeetings.length}
            icon={CalendarClock}
            variant="saffron"
            description={language === "gu" ? "સુનિશ્ચિત વાલી મિલન" : "Scheduled discussions"}
          />
          <StatTile
            label={t.ptm.summaryLive || "Live Now"}
            value={liveMeetings.length}
            icon={Sparkles}
            variant="mint"
            description={language === "gu" ? "ચાલુ વિડિયો રૂમ" : "Active video calls"}
          />
          <StatTile
            label={t.ptm.tabPast || "Completed"}
            value={pastMeetings.length}
            icon={Clock}
            variant="coral"
            description={language === "gu" ? "સંપન્ન થયેલ સત્રો" : "Concluded sessions"}
          />
          <StatTile
            label={language === "gu" ? "વાલીઓ આમંત્રિત" : "Parents Invited"}
            value={totalParentsInvited}
            icon={Users}
            variant="indigo"
            description={language === "gu" ? `${acceptedInvitesCount} વાલીઓએ સ્વીકાર્યું` : `${acceptedInvitesCount} accepted RSVP`}
          />
        </div>

        {/* Feedback / Error Alerts */}
        {feedback && (
          <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#2E7D5E]/25 text-[#2E7D5E] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-2xl bg-[#FBECE9] border border-[#A93327]/25 text-[#A93327] text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {(error.toLowerCase().includes("authentication") ||
              error.toLowerCase().includes("session") ||
              error.toLowerCase().includes("sign in") ||
              error.toLowerCase().includes("401")) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
                className="self-start sm:self-auto text-xs py-1 px-3 border-[#A93327]/40 text-[#A93327] hover:bg-[#A93327]/10"
              >
                Sign In
              </Button>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <Tabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          tabs={[
            { id: "upcoming", label: t.ptm.tabUpcoming, count: upcomingMeetings.length, icon: Calendar },
            { id: "live", label: t.ptm.tabLive, count: liveMeetings.length, icon: Sparkles },
            { id: "past", label: t.ptm.tabPast, count: pastMeetings.length, icon: Clock },
          ]}
        />

        {/* Content List */}
        {loading ? (
          <div className="flex flex-col gap-4 w-full">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : displayedMeetings.length === 0 ? (
          <article className="w-full rounded-2xl border bg-white dark:bg-[#26201C] p-10 sm:p-14 text-center space-y-4 border-[#49352F]/10 dark:border-[#F2CAB3]/15 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF6E9] dark:bg-[#221C18] border border-[#49352F]/12 dark:border-[#F2CAB3]/15 flex items-center justify-center mx-auto text-[#B26A1B] dark:text-[#F2CAB3] shadow-xs">
              <CalendarClock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {activeTab === "upcoming"
                  ? t.ptm.emptyUpcomingTitle
                  : activeTab === "live"
                  ? t.ptm.emptyLiveTitle
                  : t.ptm.emptyPastTitle}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] max-w-md mx-auto leading-relaxed">
                {activeTab === "upcoming"
                  ? t.ptm.emptyUpcomingDesc
                  : activeTab === "live"
                  ? t.ptm.emptyLiveDesc
                  : t.ptm.emptyPastDesc}
              </p>
            </div>
            {activeTab === "upcoming" && (
              <div className="pt-2">
                <Button variant="primary" size="md" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
                  {t.ptm.scheduleBtn}
                </Button>
              </div>
            )}
          </article>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            <AnimatePresence mode="popLayout">
              {displayedMeetings.map((mtg) => {
                const isExpanded = Boolean(expandedInvites[mtg.id]);
                const canModify =
                  (user?.role === "admin" || mtg.teacherId === user?.id) &&
                  mtg.status !== "cancelled" &&
                  mtg.status !== "ended";

                const accepted = mtg.invites.filter((i) => i.rsvpStatus === "accepted").length;
                const pending = mtg.invites.filter((i) => i.rsvpStatus === "pending").length;
                const rescheduleReq = mtg.invites.filter((i) => i.rsvpStatus === "reschedule_requested").length;
                const dateParts = getMeetingDateParts(mtg.startTime, language);

                return (
                  <motion.div
                    key={mtg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <article className="w-full rounded-2xl border bg-white dark:bg-[#26201C] p-5 shadow-sm border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 flex-1 gap-4">
                          <div className="shrink-0 w-16 rounded-xl bg-[#FAF6E9] dark:bg-[#1E1916] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 p-2 text-center flex flex-col items-center justify-center">
                            <span className="text-[11px] font-extrabold text-[#B26A1B] dark:text-[#F2CAB3] tracking-wider uppercase">
                              {dateParts.month}
                            </span>
                            <span className="font-heading text-xl sm:text-2xl font-black text-[#49352F] dark:text-[#F4F1E1] leading-none my-0.5">
                              {dateParts.day}
                            </span>
                            <span className="text-[10px] font-semibold text-[#7A6862] dark:text-[#FAF6E9]/75 mt-0.5 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-[#B26A1B]" />
                              {dateParts.time}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {mtg.classId && (
                                <Badge variant="outline" size="sm">
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  {formatClass(mtg.classId)}
                                </Badge>
                              )}
                              <MeetingStatusBadge status={mtg.status} />
                              <MeetingTypeBadge type={mtg.type} />
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/20">
                                {accepted} {t.ptm.rsvpAccepted}
                              </span>
                              {pending > 0 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDF4E7] text-[#8D4E10] border border-[#8D4E10]/20">
                                  {pending} {t.ptm.rsvpPending}
                                </span>
                              )}
                              {rescheduleReq > 0 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F2DCB5] text-[#49352F] border border-[#49352F]/15">
                                  {rescheduleReq} {t.ptm.rsvpRescheduleRequested}
                                </span>
                              )}
                            </div>

                            <h3 className="mt-1 text-lg font-bold break-words text-[#49352F] dark:text-[#F4F1E1]">
                              {mtg.title}
                            </h3>

                            {mtg.agenda && (
                              <p className="mt-1 text-sm text-[#7A6862] dark:text-[#FAF6E9]/70 break-words leading-relaxed">
                                {mtg.agenda}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7A6862] dark:text-[#FAF6E9]/70">
                              <span className="inline-flex items-center gap-1 font-medium bg-[#FAF6E9] dark:bg-[#1E1916] px-2.5 py-1 rounded-lg border border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                                <Clock className="w-3.5 h-3.5 text-[#B26A1B]" />
                                {mtg.durationMin} {t.ptm.durationUnit}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium bg-[#FAF6E9] dark:bg-[#1E1916] px-2.5 py-1 rounded-lg border border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                                <Users className="w-3.5 h-3.5 text-[#B26A1B]" />
                                {mtg.invites.length} {language === "gu" ? "વાલીઓ" : "Parents"}
                              </span>
                              <span className="font-mono text-[11px] bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                                {t.ptm.roomLabel}: {mtg.roomId}
                              </span>
                            </div>

                            {mtg.type === "one_to_one" && mtg.offeredSlots && mtg.offeredSlots.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[#7A6862] mr-1">
                                  {t.ptm.offeredSlotsLabel}:
                                </span>
                                {mtg.offeredSlots.map((slot, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF6E9] dark:bg-[#1E1916] border border-[#49352F]/12 dark:border-[#F2CAB3]/20 text-[#49352F] dark:text-[#F4F1E1]"
                                  >
                                    {formatMeetingDateTime(slot, language)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[180px]">
                          {mtg.status !== "cancelled" && mtg.status !== "ended" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => router.push(`/meetings/room/${mtg.roomId}`)}
                              className="w-full font-bold"
                              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                            >
                              {mtg.status === "live"
                                ? language === "gu" ? "રૂમમાં પ્રવેશો (લાઈવ)" : "Join Room (Live)"
                                : t.ptm.enterVideoRoom || "Enter Room"}
                            </Button>
                          )}

                          <WhatsAppShareButton meeting={mtg} variant="outline" className="w-full" />

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAttendanceTarget(mtg)}
                              className="w-full text-xs"
                              leftIcon={<Users className="w-3 h-3" />}
                            >
                              {t.video.attendanceTab || "Attendance"}
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setNotesTarget(mtg)}
                              className="w-full text-xs"
                              leftIcon={<Edit3 className="w-3 h-3" />}
                            >
                              {t.video.addNotesBtn || "Notes"}
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedInvites((prev) => ({ ...prev, [mtg.id]: !prev[mtg.id] }))
                            }
                            className="w-full text-xs"
                            rightIcon={
                              isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                            }
                          >
                            {isExpanded ? t.ptm.hideInvites : `${t.ptm.viewInvites} (${mtg.invites.length})`}
                          </Button>

                          {canModify && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditModal(mtg)}
                                className="w-full text-xs"
                                leftIcon={<Edit3 className="w-3 h-3" />}
                              >
                                {t.ptm.editReschedule}
                              </Button>
                              <Button
                                variant="coral"
                                size="sm"
                                onClick={() => setCancelTarget(mtg)}
                                className="w-full text-xs"
                                leftIcon={<XCircle className="w-3 h-3" />}
                              >
                                {t.ptm.cancelMeeting}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Invited Parents Table */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 space-y-2">
                          {mtg.invites.length === 0 ? (
                            <p className="text-xs text-[#7A6862]">{t.ptm.noInvites}</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {mtg.invites.map((inv) => (
                                <div
                                  key={inv.id}
                                  className="p-3 rounded-2xl bg-[#FAF6E9]/80 dark:bg-[#1E1916] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 flex items-start justify-between gap-3"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] truncate">
                                      {inv.parentName || inv.parentId}
                                    </p>
                                    <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/70">
                                      {t.ptm.studentLabel}: {inv.studentName || inv.studentId}
                                      {inv.studentGrade ? ` (${formatClass(inv.studentGrade, inv.studentSection)})` : ""}
                                    </p>
                                    {inv.slotTime && (
                                      <p className="text-[11px] text-[#2E7D5E] font-semibold">
                                        {t.ptm.chosenSlotLabel}: {formatMeetingDateTime(inv.slotTime, language)}
                                      </p>
                                    )}
                                    {inv.rescheduleNote && (
                                      <p className="text-[11px] text-[#8D4E10] italic">
                                        {t.ptm.rescheduleNoteDisplay}: &ldquo;{inv.rescheduleNote}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <RsvpStatusBadge status={inv.rsvpStatus} />
                                    <WhatsAppShareButton
                                      meeting={mtg}
                                      studentName={inv.studentName}
                                      parentPhone={inv.parentPhone}
                                      joinUrl={buildMeetingJoinUrl(
                                        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
                                        inv.joinToken
                                      )}
                                      variant="icon"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Schedule / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingMeeting ? t.ptm.editFormTitle : t.ptm.scheduleFormTitle}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FBECE9] border border-[#A93327]/25 text-[#A93327] text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
              {t.ptm.titleLabel}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.ptm.titlePlaceholder}
              className="w-full px-4 py-3 rounded-2xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#221C18] text-sm text-[#49352F] dark:text-[#F4F1E1] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F2CAB3] focus:border-[#F2CAB3] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
              {t.ptm.agendaLabel}
            </label>
            <textarea
              rows={2}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder={t.ptm.agendaPlaceholder}
              className="w-full px-4 py-3 rounded-2xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#221C18] text-sm text-[#49352F] dark:text-[#F4F1E1] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F2CAB3] focus:border-[#F2CAB3] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {!editingMeeting && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
                  {t.ptm.typeLabel}
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#221C18] text-sm text-[#49352F] dark:text-[#F4F1E1] font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
                >
                  <option value="one_to_one">{t.ptm.typeOneToOne}</option>
                  <option value="group">{t.ptm.typeGroup}</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
                {t.ptm.startTimeLabel}
              </label>
              <input
                type="datetime-local"
                required
                value={startTimeLocal}
                onChange={(e) => setStartTimeLocal(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#221C18] text-sm text-[#49352F] dark:text-[#F4F1E1] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
                {t.ptm.durationLabel}
              </label>
              <input
                type="number"
                min={5}
                max={240}
                step={5}
                required
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full px-3.5 py-3 rounded-2xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#221C18] text-sm text-[#49352F] dark:text-[#F4F1E1] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
              />
            </div>
          </div>

          {/* Offered Time Slots for One-to-One */}
          {meetingType === "one_to_one" && (
            <div className="p-4 rounded-2xl bg-[#FAF6E9] dark:bg-[#221C18] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1]">
                  {t.ptm.offeredSlotsLabel}
                </label>
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="text-xs font-bold text-[#B26A1B] dark:text-[#F2CAB3] hover:underline cursor-pointer"
                >
                  + {t.ptm.addSlotBtn}
                </button>
              </div>
              <div className="space-y-2">
                {offeredSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={slot}
                      onChange={(e) => handleSlotChange(index, e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
                    />
                    {offeredSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(index)}
                        className="p-2 rounded-xl text-[#A93327] hover:bg-[#FBECE9] dark:hover:bg-[#3B1F1B] cursor-pointer transition-colors"
                        aria-label={t.ptm.removeSlot}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Selection (only on create) */}
          {!editingMeeting && (
            <div className="p-4 rounded-2xl bg-[#FAF6E9] dark:bg-[#221C18] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 space-y-3.5">
              <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">
                {t.ptm.inviteTargetLabel}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: "class", label: t.ptm.targetClass, icon: Users },
                    { id: "students", label: t.ptm.targetStudents, icon: UserCheck },
                    { id: "parent", label: t.ptm.targetParent, icon: Users },
                  ] as const
                ).map((mode) => {
                  const Icon = mode.icon;
                  const active = targetMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTargetMode(mode.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        active
                          ? "bg-[#F2CAB3] text-[#49352F] border-[#49352F]/25 shadow-xs -translate-y-0.5"
                          : "bg-white dark:bg-[#26201C] text-[#7A6862] dark:text-[#C2B3AC] border-[#49352F]/12 dark:border-[#F2CAB3]/15 hover:bg-[#FAF6E9]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {targetMode === "class" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#7A6862] dark:text-[#C2B3AC] block">
                    {t.ptm.selectClassLabel}
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] shadow-2xs focus:ring-2 focus:ring-[#F2CAB3]"
                  >
                    {(targets?.classrooms || []).map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {formatClass(cls.grade, cls.section)} ({cls.academicYear})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetMode === "students" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#7A6862] dark:text-[#C2B3AC]">
                      {t.ptm.selectStudentsLabel}
                    </label>
                    <span className="text-[11px] text-[#7A6862] dark:text-[#C2B3AC]">{t.ptm.noLinkedParentsHint}</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                    {studentsWithParents.map((std) => {
                      const checked = selectedStudentIds.includes(std.id);
                      return (
                        <label
                          key={std.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-colors ${
                            checked
                              ? "bg-[#F2CAB3]/40 border-[#B26A1B] text-[#49352F] dark:text-[#F4F1E1] font-bold"
                              : "bg-white dark:bg-[#26201C] border-[#49352F]/12 dark:border-[#F2CAB3]/15 text-[#49352F] dark:text-[#F4F1E1]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleStudent(std.id)}
                            className="rounded text-[#B26A1B] focus:ring-[#F2CAB3]"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{std.displayName}</p>
                            <p className="text-[10px] text-[#7A6862] dark:text-[#C2B3AC] truncate">
                              {formatClass(std.grade, std.section)} • {std.linkedParents.map((p) => p.name).join(", ")}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {targetMode === "parent" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#7A6862] dark:text-[#C2B3AC] block">
                    {t.ptm.selectParentLabel}
                  </label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] shadow-2xs focus:ring-2 focus:ring-[#F2CAB3]"
                  >
                    {(targets?.parents || []).map((par) => (
                      <option key={par.id} value={par.id}>
                        {par.name} {par.phone ? `(${par.phone})` : ""} — {par.studentIds.length} child(ren)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={submitting}>
              {editingMeeting ? t.ptm.saveChanges : t.ptm.createSubmit}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title={t.ptm.confirmCancelTitle}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed">
            {t.ptm.confirmCancelDesc}
          </p>
          {cancelTarget && (
            <div className="p-3 rounded-xl bg-[#FAF6E9] dark:bg-[#1E1916] border border-[#49352F]/12 text-xs font-bold">
              {cancelTarget.title}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
              {t.ptm.keepMeetingBtn}
            </Button>
            <Button variant="coral" size="sm" isLoading={cancelling} onClick={handleConfirmCancel}>
              {t.ptm.confirmCancelBtn}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meeting Notes Modal (PTM Step 4) */}
      <MeetingNotesModal
        isOpen={Boolean(notesTarget)}
        onClose={() => setNotesTarget(null)}
        meeting={notesTarget}
        onSaved={loadData}
      />

      {/* Meeting Attendance Log Modal (PTM Step 4) */}
      <MeetingAttendanceModal
        isOpen={Boolean(attendanceTarget)}
        onClose={() => setAttendanceTarget(null)}
        meeting={attendanceTarget}
      />
    </AppLayout>
  );
}
