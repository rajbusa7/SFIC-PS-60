"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { StatTile } from "@/components/ui/StatTile";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  MeetingStatusBadge,
  MeetingTypeBadge,
  RsvpStatusBadge,
  formatMeetingDateTime,
} from "@/components/ptm/MeetingStatusBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { WhatsAppShareButton } from "@/components/ptm/WhatsAppShareButton";
import { buildMeetingJoinUrl } from "@/lib/auth/signedMeetingToken";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import type { ParentMeetingInviteItem } from "@shared/types";
import {
  Calendar,
  CalendarClock,
  Clock,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowLeft,
  LogOut,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";

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

export default function ParentMeetingsPage() {
  const router = useRouter();
  const { t: baseT, language, formatClass } = useLanguage();
  const t: any = baseT;
  const { logout } = useAuth();

  const [invites, setInvites] = useState<ParentMeetingInviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"upcoming" | "live" | "past">("upcoming");
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Request another time modal
  const [rescheduleTarget, setRescheduleTarget] = useState<ParentMeetingInviteItem | null>(null);
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Meeting Notes state for parents (PTM Step 4)
  const [meetingNotesMap, setMeetingNotesMap] = useState<Record<string, any[]>>({});

  const loadMyMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getMyMeetings();
      const list = res.invites || [];
      setInvites(list);

      // Pre-select slotTime if invite already has one or only 1 offered slot exists
      const defaults: Record<string, string> = {};
      for (const item of list) {
        if (item.invite.slotTime) {
          defaults[item.invite.id] = item.invite.slotTime;
        } else if (item.meeting.offeredSlots && item.meeting.offeredSlots.length === 1) {
          defaults[item.invite.id] = item.meeting.offeredSlots[0];
        }
      }
      setSelectedSlots((prev) => ({ ...defaults, ...prev }));

      // Fetch meeting notes for each meeting
      const notesMap: Record<string, any[]> = {};
      for (const item of list) {
        try {
          const notesRes = await apiClient.getMeetingNotes(item.meeting.id, item.student.id);
          if (notesRes.success && notesRes.notes.length > 0) {
            notesMap[item.meeting.id] = notesRes.notes;
          }
        } catch {
          // ignore notes fetch error
        }
      }
      setMeetingNotesMap(notesMap);
    } catch (err: any) {
      if (err?.status === 401) {
        router.push("/parent/login?redirect=/parent/meetings");
        return;
      }
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  }, [router, t.common.error]);

  useEffect(() => {
    loadMyMeetings();
  }, [loadMyMeetings]);

  const upcomingInvites = useMemo(
    () => invites.filter((item) => item.meeting.status === "scheduled"),
    [invites]
  );
  const liveInvites = useMemo(
    () => invites.filter((item) => item.meeting.status === "live"),
    [invites]
  );
  const pastInvites = useMemo(
    () => invites.filter((item) => item.meeting.status === "ended" || item.meeting.status === "cancelled"),
    [invites]
  );

  const displayedInvites =
    activeTab === "upcoming" ? upcomingInvites : activeTab === "live" ? liveInvites : pastInvites;

  const handleRsvp = async (
    item: ParentMeetingInviteItem,
    rsvpStatus: "accepted" | "declined"
  ) => {
    setError(null);
    const chosenSlot = selectedSlots[item.invite.id];

    if (
      rsvpStatus === "accepted" &&
      item.meeting.type === "one_to_one" &&
      item.meeting.offeredSlots &&
      item.meeting.offeredSlots.length > 0 &&
      !chosenSlot
    ) {
      setError(t.ptm.slotRequiredError);
      return;
    }

    setActionLoading((prev) => ({ ...prev, [item.invite.id]: true }));
    try {
      await apiClient.respondToMeetingInvite(item.meeting.id, {
        rsvpStatus,
        slotTime: rsvpStatus === "accepted" ? chosenSlot || item.meeting.startTime : undefined,
        studentId: item.student.id,
      });
      setFeedback(t.ptm.rsvpSuccess);
      await loadMyMeetings();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [item.invite.id]: false }));
    }
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduleSubmitting(true);
    setError(null);
    try {
      await apiClient.respondToMeetingInvite(rescheduleTarget.meeting.id, {
        rsvpStatus: "reschedule_requested",
        rescheduleNote: rescheduleNote.trim(),
        studentId: rescheduleTarget.student.id,
      });
      setRescheduleTarget(null);
      setRescheduleNote("");
      setFeedback(t.ptm.rsvpSuccess);
      await loadMyMeetings();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/parent/login");
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-gradient-to-br from-[#FAF6E9] via-[#F4F1E1] to-[#F2CAB3]/30 dark:from-[#1B1614] dark:via-[#1E1916] dark:to-[#26201C] text-[#49352F] dark:text-[#F4F1E1]">
      {/* Parent Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#221C18]/90 backdrop-blur-md border-b border-[#49352F]/15 dark:border-[#F2CAB3]/15 px-3 sm:px-8 py-2.5 sm:py-3 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/parent/dashboard" className="flex items-center gap-1.5">
              <BrandLogo size={30} />
            </Link>
            <div className="h-5 w-px bg-[#49352F]/20 dark:bg-[#F2CAB3]/20 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B26A1B]/10 border border-[#B26A1B]/25 text-[#B26A1B] text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{t.nav.parentBridge}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <Link
              href="/parent/dashboard"
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] hover:bg-[#FAF6E9] text-xs font-bold transition-all flex items-center gap-1.5"
              title={t.ptm.backToPortal}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.ptm.backToPortal}</span>
            </Link>
            <NotificationBell />
            <LanguageSelector variant="default" />
            <ThemeToggle variant="button" />
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#49352F]/15 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title={t.nav.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.nav.logout}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F2CAB3] border border-[#49352F]/15 flex items-center justify-center text-[#49352F] shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight">
                {t.ptm.myMeetingsTitle}
              </h1>
              <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#FAF6E9]/70">
                {t.ptm.myMeetingsSubtitle}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadMyMeetings}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            {t.ptm.refresh}
          </Button>
        </div>

        {/* Summary Stat Grid like the Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <StatTile
            label={t.ptm.tabUpcoming || "Upcoming Meetings"}
            value={upcomingInvites.length}
            icon={CalendarClock}
            variant="saffron"
            description={language === "gu" ? "આગામી વાલી મિલન" : "Scheduled discussions"}
          />
          <StatTile
            label={t.ptm.tabLive || "Live Now"}
            value={liveInvites.length}
            icon={Sparkles}
            variant="mint"
            description={language === "gu" ? "ચાલુ વિડિયો રૂમ" : "Active video calls"}
          />
          <StatTile
            label={t.ptm.tabPast || "Completed"}
            value={pastInvites.length}
            icon={Clock}
            variant="coral"
            description={language === "gu" ? "પૂર્ણ થયેલ સત્રો" : "Concluded sessions"}
          />
          <StatTile
            label={language === "gu" ? "સ્વીકૃત આમંત્રણો" : "Confirmed RSVP"}
            value={invites.filter((i) => i.invite.rsvpStatus === "accepted").length}
            icon={CheckCircle2}
            variant="indigo"
            description={language === "gu" ? `કુલ ${invites.length} આમંત્રણોમાંથી` : `Out of ${invites.length} total meetings`}
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
          <div className="p-3.5 rounded-2xl bg-[#FBECE9] border border-[#A93327]/25 text-[#A93327] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          tabs={[
            { id: "upcoming", label: t.ptm.tabUpcoming, count: upcomingInvites.length, icon: Calendar },
            { id: "live", label: t.ptm.tabLive, count: liveInvites.length, icon: Sparkles },
            { id: "past", label: t.ptm.tabPast, count: pastInvites.length, icon: Clock },
          ]}
        />

        {/* Invites List */}
        {loading ? (
          <div className="flex flex-col gap-4 w-full">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : displayedInvites.length === 0 ? (
          <article className="w-full rounded-2xl border bg-white dark:bg-[#26201C] p-10 sm:p-14 text-center space-y-4 border-[#49352F]/10 dark:border-[#F2CAB3]/15 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF6E9] dark:bg-[#221C18] border border-[#49352F]/12 dark:border-[#F2CAB3]/15 flex items-center justify-center mx-auto text-[#B26A1B] dark:text-[#F2CAB3] shadow-xs">
              <CalendarClock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {activeTab === "upcoming"
                  ? t.ptm.emptyParentTitle
                  : activeTab === "live"
                  ? t.ptm.emptyLiveTitle
                  : t.ptm.emptyPastTitle}
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#C2B3AC] max-w-md mx-auto leading-relaxed">
                {activeTab === "upcoming"
                  ? t.ptm.emptyParentDesc
                  : activeTab === "live"
                  ? t.ptm.emptyLiveDesc
                  : t.ptm.emptyPastDesc}
              </p>
            </div>
          </article>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            <AnimatePresence mode="popLayout">
              {displayedInvites.map((item) => {
                const { invite, meeting, student } = item;
                const isBusy = Boolean(actionLoading[invite.id]);
                const canRespond = meeting.status === "scheduled" || meeting.status === "live";
                const offeredSlots = meeting.offeredSlots || [];
                const meetingTime = invite.slotTime || meeting.startTime;
                const dateParts = getMeetingDateParts(meetingTime, language);

                return (
                  <motion.div
                    key={invite.id}
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
                              <Badge variant="outline" size="sm">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {student.displayName} ({formatClass(student.grade, student.section)})
                              </Badge>
                              <MeetingStatusBadge status={meeting.status} />
                              <MeetingTypeBadge type={meeting.type} />
                              <RsvpStatusBadge status={invite.rsvpStatus} />
                            </div>

                            <h3 className="mt-1 text-lg font-bold break-words text-[#49352F] dark:text-[#F4F1E1]">
                              {meeting.title}
                            </h3>

                            {meeting.agenda && (
                              <p className="mt-1 text-sm text-[#7A6862] dark:text-[#FAF6E9]/70 break-words leading-relaxed">
                                {meeting.agenda}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7A6862] dark:text-[#FAF6E9]/70">
                              <span className="inline-flex items-center gap-1 font-medium bg-[#FAF6E9] dark:bg-[#1E1916] px-2.5 py-1 rounded-lg border border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                                <Clock className="w-3.5 h-3.5 text-[#B26A1B]" />
                                {meeting.durationMin} {t.ptm.durationUnit}
                              </span>
                              {meeting.teacherName && (
                                <span className="inline-flex items-center gap-1 font-medium bg-[#FAF6E9] dark:bg-[#1E1916] px-2.5 py-1 rounded-lg border border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                                  <Users className="w-3.5 h-3.5 text-[#B26A1B]" />
                                  {t.ptm.teacherLabel}: {meeting.teacherName}
                                </span>
                              )}
                            </div>

                            {invite.rescheduleNote && (
                              <p className="mt-2 text-xs text-[#8D4E10] bg-[#FDF4E7] px-3 py-1.5 rounded-xl border border-[#8D4E10]/20 inline-block">
                                {t.ptm.rescheduleNoteDisplay}: &ldquo;{invite.rescheduleNote}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[180px]">
                          {(invite.rsvpStatus === "accepted" || meeting.status === "live") && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => router.push(`/meetings/room/${meeting.roomId}`)}
                              className="w-full font-bold"
                              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                            >
                              {meeting.status === "live"
                                ? language === "gu" ? "રૂમમાં પ્રવેશો (લાઈવ)" : "Join Room (Live)"
                                : t.ptm.enterVideoRoom || "Enter Room"}
                            </Button>
                          )}

                          {canRespond && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="mint"
                                size="sm"
                                isLoading={isBusy}
                                onClick={() => handleRsvp(item, "accepted")}
                                className="w-full text-xs"
                                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              >
                                {t.ptm.acceptBtn}
                              </Button>
                              <Button
                                variant="coral"
                                size="sm"
                                isLoading={isBusy}
                                onClick={() => handleRsvp(item, "declined")}
                                className="w-full text-xs"
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                {t.ptm.declineBtn}
                              </Button>
                            </div>
                          )}

                          {canRespond && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => {
                                setRescheduleTarget(item);
                                setRescheduleNote(invite.rescheduleNote || "");
                              }}
                              className="w-full text-xs"
                              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                            >
                              {t.ptm.requestRescheduleBtn}
                            </Button>
                          )}

                          <WhatsAppShareButton
                            meeting={meeting}
                            studentName={item.student.displayName}
                            variant="outline"
                            className="w-full"
                            joinUrl={buildMeetingJoinUrl(
                              typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
                              invite.joinToken
                            )}
                          />
                        </div>
                      </div>

                      {/* Offered Slots Selector for 1-to-1 */}
                      {canRespond && meeting.type === "one_to_one" && offeredSlots.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 space-y-2.5">
                          <p className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1]">{t.ptm.offeredSlotsPrompt}</p>
                          <div className="flex flex-wrap gap-2">
                            {offeredSlots.map((slot) => {
                              const isPicked = selectedSlots[invite.id] === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSlots((prev) => ({ ...prev, [invite.id]: slot }))
                                  }
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    isPicked
                                      ? "bg-[#F2CAB3] text-[#49352F] border-[#49352F]/25 shadow-xs font-extrabold"
                                      : "bg-white dark:bg-[#26201C] text-[#7A6862] dark:text-[#C2B3AC] border-[#49352F]/15 dark:border-[#F2CAB3]/20 hover:border-[#B26A1B]"
                                  }`}
                                >
                                  {formatMeetingDateTime(slot, language)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Meeting Notes & Action Items Display for Parent (PTM Step 4) */}
                      {meetingNotesMap[meeting.id] && meetingNotesMap[meeting.id].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#B26A1B]">
                            <Sparkles className="w-4 h-4" />
                            <span>{t.video.notesTitle}</span>
                          </div>
                          {meetingNotesMap[meeting.id].map((n: any) => (
                            <div key={n.id} className="space-y-2 text-xs">
                              {n.notes && (
                                <p className="text-[#49352F] dark:text-[#F4F1E1] bg-[#FAF6E9] dark:bg-[#26201C] p-3 rounded-xl border border-[#49352F]/10 leading-relaxed break-words">
                                  {n.notes}
                                </p>
                              )}
                              {n.actionItems && n.actionItems.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A6862]">
                                    {t.video.actionItemsHeading}:
                                  </p>
                                  <ul className="space-y-1.5">
                                    {n.actionItems.map((act: any, idx: number) => {
                                      const desc = typeof act === "string" ? act : act.description;
                                      const wsTitle = typeof act === "object" ? act.worksheetTitle : null;
                                      return (
                                        <li
                                          key={idx}
                                          className="p-2.5 rounded-xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10 flex flex-wrap items-center justify-between gap-2"
                                        >
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0" />
                                            <span className="font-medium text-[#49352F] dark:text-[#F4F1E1] break-words">
                                              {desc}
                                            </span>
                                          </div>
                                          {wsTitle && (
                                            <span className="px-2 py-0.5 rounded-md bg-[#2E7D5E]/10 text-[#2E7D5E] text-[10px] font-bold border border-[#2E7D5E]/20">
                                              {t.video.remedialPracticeBadge}: {wsTitle}
                                            </span>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Request Another Time Modal */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title={t.ptm.rescheduleModalTitle}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitReschedule} className="space-y-4">
          {rescheduleTarget && (
            <div className="p-3 rounded-xl bg-[#FAF6E9] dark:bg-[#1E1916] border border-[#49352F]/12 text-xs font-bold">
              {rescheduleTarget.meeting.title}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] block">{t.ptm.rescheduleNoteLabel}</label>
            <textarea
              rows={3}
              required
              value={rescheduleNote}
              onChange={(e) => setRescheduleNote(e.target.value)}
              placeholder={t.ptm.rescheduleNotePlaceholder}
              className="w-full px-4 py-3 rounded-2xl border border-[#49352F]/14 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#221C18] text-sm text-[#49352F] dark:text-[#F4F1E1] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F2CAB3] focus:border-[#F2CAB3] transition-all"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={rescheduleSubmitting}>
              {t.ptm.submitReschedule}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
