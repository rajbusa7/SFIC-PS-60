"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  Calendar,
  Clock,
  User,
  Users,
  Plus,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ScheduleMeetingModal } from "@/components/ptm/ScheduleMeetingModal";
import { MeetingNotesModal } from "@/components/ptm/MeetingNotesModal";
import { useLanguage } from "@/context/LanguageContext";
import type { PtmMeeting, PtmMeetingStats, PtmMeetingStatus } from "@/lib/types";

export default function PtmDashboardPage() {
  const { t } = useLanguage();
  const [meetings, setMeetings] = useState<PtmMeeting[]>([]);
  const [stats, setStats] = useState<PtmMeetingStats>({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [activeTab, setActiveTab] = useState<"upcoming" | "today" | "past" | "all">("upcoming");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [selectedMeetingForNotes, setSelectedMeetingForNotes] = useState<PtmMeeting | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMeetings = () => {
    setIsLoading(true);
    fetch(`/api/ptm/meetings?tab=${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMeetings(data.meetings || []);
          if (data.stats) setStats(data.stats);
        }
      })
      .catch((err) => console.error("Error fetching PTM meetings:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMeetings();
  }, [activeTab]);

  const handleCopyLink = (meeting: PtmMeeting) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/ptm/room/${meeting.meetingCode}/lobby`;
    navigator.clipboard.writeText(url);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled meeting?")) return;
    try {
      const res = await fetch(`/api/ptm/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        fetchMeetings();
      }
    } catch (e) {
      console.error("Cancel meeting failed", e);
    }
  };

  const getStatusBadge = (status: PtmMeetingStatus) => {
    switch (status) {
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5E]" />
            Live In Progress
          </span>
        );
      case "waiting":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 border border-amber-500/30">
            Waiting Room
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-700 border border-gray-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case "no_show":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-800 border border-orange-500/20">
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/30">
            <Calendar className="w-3.5 h-3.5" />
            Scheduled
          </span>
        );
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#49352F]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#B26A1B]/10 text-[#B26A1B] border border-[#B26A1B]/20">
                WebRTC Video Conference
              </span>
              <span className="text-xs text-[#7A6862]">No App Required</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight mt-1">
              Parent–Teacher Meetings (PTM)
            </h1>
            <p className="text-sm text-[#7A6862] mt-0.5">
              Conduct high-definition 1:1 online video consultations with parents directly through StudySaathi AI.
            </p>
          </div>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#261B16] text-[#FAF6E9] font-bold text-sm hover:bg-[#49352F] shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>

        {/* Database-Backed Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#49352F]/10 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A6862]">Total Meetings</span>
            <div className="text-2xl sm:text-3xl font-black text-[#49352F] mt-1">{stats.total}</div>
            <p className="text-[11px] text-[#7A6862] mt-1">All recorded consultations</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#49352F]/10 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B26A1B]">Upcoming Consultations</span>
            <div className="text-2xl sm:text-3xl font-black text-[#B26A1B] mt-1">{stats.upcoming}</div>
            <p className="text-[11px] text-[#7A6862] mt-1">Scheduled & active</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#49352F]/10 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D5E]">Completed Meetings</span>
            <div className="text-2xl sm:text-3xl font-black text-[#2E7D5E] mt-1">{stats.completed}</div>
            <p className="text-[11px] text-[#7A6862] mt-1">Notes and summaries recorded</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#49352F]/10 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cancelled / No Show</span>
            <div className="text-2xl sm:text-3xl font-black text-gray-700 mt-1">{stats.cancelled}</div>
            <p className="text-[11px] text-[#7A6862] mt-1">Rescheduled or cancelled</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#49352F]/15 gap-2 sm:gap-6 overflow-x-auto">
          {[
            { id: "upcoming", label: "Upcoming Meetings" },
            { id: "today", label: "Today's Schedule" },
            { id: "past", label: "Past Meetings & History" },
            { id: "all", label: "All Records" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#B26A1B] text-[#B26A1B]"
                  : "border-transparent text-[#7A6862] hover:text-[#49352F]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="py-16 text-center text-[#7A6862] space-y-2">
            <div className="w-8 h-8 border-3 border-[#B26A1B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading meetings from database...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="py-16 text-center bg-white border border-dashed border-[#49352F]/15 rounded-2xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF6E9] text-[#7A6862] flex items-center justify-center mx-auto">
              <Video className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#49352F]">No meetings found in this view</h3>
              <p className="text-xs text-[#7A6862] max-w-md mx-auto mt-1">
                Schedule a real-time online video consultation with a student’s parent to discuss their learning progress.
              </p>
            </div>
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#261B16] text-[#FAF6E9] text-xs font-bold hover:bg-[#49352F]"
            >
              <Plus className="w-4 h-4" />
              Schedule First Consultation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white border border-[#49352F]/12 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-[#7A6862]">
                        {meeting.meetingCode}
                      </span>
                      <h3 className="text-base font-bold text-[#49352F] leading-snug mt-0.5">
                        {meeting.title}
                      </h3>
                    </div>
                    {getStatusBadge(meeting.status)}
                  </div>

                  {/* Student & Parent Info */}
                  <div className="p-3 rounded-xl bg-[#FAF6E9]/70 border border-[#49352F]/8 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6862] block">
                        Student
                      </span>
                      <strong className="text-[#49352F] font-semibold">{meeting.studentName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6862] block">
                        Parent / Guardian
                      </span>
                      <strong className="text-[#49352F] font-semibold">{meeting.parentName}</strong>
                    </div>
                  </div>

                  {/* Time & Duration */}
                  <div className="flex items-center gap-4 text-xs text-[#7A6862]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#B26A1B]" />
                      <span>{meeting.scheduledDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#B26A1B]" />
                      <span>{meeting.startTime} IST ({meeting.durationMinutes}m)</span>
                    </div>
                  </div>

                  {/* Agenda Snippet */}
                  {meeting.agenda && (
                    <p className="text-xs text-[#7A6862] line-clamp-2 italic">
                      "{meeting.agenda}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-[#49352F]/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(meeting)}
                      title="Copy Parent Invitation URL"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#49352F]/20 text-xs font-semibold text-[#49352F] hover:bg-[#FAF6E9] transition-colors"
                    >
                      {copiedId === meeting.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#2E7D5E]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Invite Link
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedMeetingForNotes(meeting)}
                      title="View / Edit Pedagogical Notes"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#49352F]/20 text-xs font-semibold text-[#49352F] hover:bg-[#FAF6E9] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Notes
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {meeting.status !== "completed" && meeting.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancelMeeting(meeting.id)}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-1 font-medium hover:underline"
                      >
                        Cancel
                      </button>
                    )}

                    <Link
                      href={`/ptm/room/${meeting.meetingCode}/lobby`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#261B16] text-[#FAF6E9] text-xs font-bold hover:bg-[#49352F] transition-all shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Meeting
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <ScheduleMeetingModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onScheduled={() => {
            fetchMeetings();
          }}
        />

        {selectedMeetingForNotes && (
          <MeetingNotesModal
            isOpen={Boolean(selectedMeetingForNotes)}
            onClose={() => setSelectedMeetingForNotes(null)}
            meeting={selectedMeetingForNotes}
          />
        )}
      </div>
    </AppLayout>
  );
}
