"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Users, BookOpen, AlertCircle, CheckCircle2, Video } from "lucide-react";
import type { Student, PtmDurationMinutes } from "@/lib/types";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
  initialStudentId?: string;
}

export function ScheduleMeetingModal({
  isOpen,
  onClose,
  onScheduled,
  initialStudentId,
}: ScheduleMeetingModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || "");
  const [parents, setParents] = useState<Array<{ id: string; name: string; email?: string; phone?: string; relationship?: string }>>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [title, setTitle] = useState<string>("Pedagogical Progress Review");
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]!
  );
  const [startTime, setStartTime] = useState<string>("14:30");
  const [durationMinutes, setDurationMinutes] = useState<PtmDurationMinutes>(30);
  const [agenda, setAgenda] = useState<string>(
    "Review student learning gap analysis, evaluate recent formative assessment results, and agree on actionable home-school remedial steps."
  );
  const [teacherNotes, setTeacherNotes] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ joinUrl: string; meetingCode: string; emailSent: boolean } | null>(null);

  // Load students
  useEffect(() => {
    if (!isOpen) return;
    setIsFetchingData(true);
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.students || [];
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      })
      .catch((err) => console.error("Failed to load students", err))
      .finally(() => setIsFetchingData(false));
  }, [isOpen]);

  // Load parents when selected student changes
  useEffect(() => {
    if (!selectedStudentId) {
      setParents([]);
      setSelectedParentId("");
      return;
    }

    fetch(`/api/students/${selectedStudentId}`)
      .then((r) => r.json())
      .then((data) => {
        // Find parents associated with this student
        const studentData = data.student || data;
        const studentParents = studentData?.parents || [];
        if (studentParents.length > 0) {
          setParents(studentParents);
          setSelectedParentId(studentParents[0].id);
        } else {
          // Fallback: fetch from contact list or mock parents
          fetch("/api/connect/contacts")
            .then((r) => r.json())
            .then((cData) => {
              const contacts = cData.contacts || [];
              const matching = contacts.filter((c: any) => c.role === "parent");
              if (matching.length > 0) {
                setParents(matching);
                setSelectedParentId(matching[0].id || matching[0].userId);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => console.error("Failed to fetch student details", err));
  }, [selectedStudentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ptm/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          parentId: selectedParentId,
          title,
          scheduledDate,
          startTime,
          durationMinutes,
          agenda,
          teacherNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to schedule meeting.");
      }

      setSuccessInfo({
        joinUrl: json.joinUrl,
        meetingCode: json.meeting?.meetingCode || "",
        emailSent: Boolean(json.invitationSentTo),
      });

      onScheduled();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while scheduling.");
    } finally {
      setIsLoading(false);
    }
  };

  const todayMinDate = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF6E9] border border-[#49352F]/15 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#49352F]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#49352F]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B26A1B]/15 text-[#B26A1B] flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Schedule Parent-Teacher Meeting</h2>
              <p className="text-xs text-[#7A6862]">Live video consultation via StudySaathi AI Meet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successInfo ? (
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-xl bg-[#2E7D5E]/10 border border-[#2E7D5E]/20 text-[#2E7D5E] flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Meeting Successfully Scheduled!</h4>
                <p className="text-xs mt-1 text-[#2E7D5E]/90">
                  Meeting Code: <strong className="font-mono text-sm">{successInfo.meetingCode}</strong>
                </p>
                {successInfo.emailSent && (
                  <p className="text-xs mt-1 text-[#2E7D5E]/80">
                    Official email invitation with join link has been dispatched to the parent.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#49352F]/10 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A6862]">Secure Join URL</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={successInfo.joinUrl}
                  className="w-full text-xs font-mono p-2 bg-[#FAF6E9] border border-[#49352F]/15 rounded-lg text-[#49352F] selection:bg-[#B26A1B]/20"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(successInfo.joinUrl)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#261B16] text-[#FAF6E9] hover:bg-[#49352F] shrink-0"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#49352F]/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#261B16] text-[#FAF6E9] hover:bg-[#49352F] transition-colors"
              >
                Close & View Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Student & Parent Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                  Select Student <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} (Class {s.grade}-{s.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                  Parent / Guardian <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
                >
                  {parents.length > 0 ? (
                    parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.relationship ? `(${p.relationship})` : ""} {p.email ? `• ${p.email}` : ""}
                      </option>
                    ))
                  ) : (
                    <option value="">No linked parent found</option>
                  )}
                </select>
              </div>
            </div>

            {/* Meeting Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Remedial Multiplication Review"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
              />
            </div>

            {/* Date, Time, Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                  Meeting Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayMinDate}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) as PtmDurationMinutes)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            {/* Agenda */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                Meeting Agenda & Focus Area
              </label>
              <textarea
                rows={3}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Key learning gaps, concrete manipulatives, or assessment topics to discuss..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
              />
            </div>

            {/* Optional Teacher Notes (Private) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                Internal Teacher Preparation Notes <span className="text-[#7A6862] font-normal">(Private)</span>
              </label>
              <textarea
                rows={2}
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="Private reminders for the meeting (not visible to parent)..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#49352F]/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 text-sm font-semibold text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedParentId}
                className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#261B16] text-[#FAF6E9] hover:bg-[#49352F] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? "Scheduling..." : "Schedule Meeting & Send Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
