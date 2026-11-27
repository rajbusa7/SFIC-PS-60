"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, CheckCircle2, AlertCircle, Save, Calendar, User } from "lucide-react";
import type { PtmMeeting, PtmMeetingNote } from "@/lib/types";

interface MeetingNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: PtmMeeting;
  canEdit?: boolean;
}

export function MeetingNotesModal({
  isOpen,
  onClose,
  meeting,
  canEdit = true,
}: MeetingNotesModalProps) {
  const [notes, setNotes] = useState<PtmMeetingNote[]>([]);
  const [discussionSummary, setDiscussionSummary] = useState<string>("");
  const [learningConcerns, setLearningConcerns] = useState<string>("");
  const [studentStrengths, setStudentStrengths] = useState<string>("");
  const [agreedActions, setAgreedActions] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [sharedWithParent, setSharedWithParent] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch(`/api/ptm/meetings/${meeting.id}/notes`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notes) && data.notes.length > 0) {
          const latest = data.notes[0];
          setNotes(data.notes);
          setDiscussionSummary(latest.discussionSummary || "");
          setLearningConcerns(latest.learningConcerns || "");
          setStudentStrengths(latest.studentStrengths || "");
          setAgreedActions(latest.agreedActions || "");
          setFollowUpDate(latest.followUpDate || "");
          setSharedWithParent(Boolean(latest.sharedWithParent));
        }
      })
      .catch((err) => console.error("Failed to load notes", err))
      .finally(() => setIsLoading(false));
  }, [isOpen, meeting.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/ptm/meetings/${meeting.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussionSummary,
          learningConcerns,
          studentStrengths,
          agreedActions,
          followUpDate: followUpDate || undefined,
          sharedWithParent,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save meeting notes.");
      }

      setMessage({ type: "success", text: "Pedagogical meeting notes saved successfully." });
      setNotes((prev) => [json.note, ...prev.filter((n) => n.id !== json.note.id)]);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save notes." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF6E9] border border-[#49352F]/15 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#49352F]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#49352F]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D5E]/15 text-[#2E7D5E] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">PTM Consultation Notes</h2>
              <p className="text-xs text-[#7A6862]">
                Student: <strong className="text-[#49352F]">{meeting.studentName}</strong> • Teacher: {meeting.teacherName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div
            className={`my-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-[#2E7D5E]/10 border border-[#2E7D5E]/20 text-[#2E7D5E]"
                : "bg-red-500/10 border border-red-500/20 text-red-700"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
              Discussion Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              disabled={!canEdit || isSaving}
              value={discussionSummary}
              onChange={(e) => setDiscussionSummary(e.target.value)}
              placeholder="Outline the key observations, topics reviewed, and mutual feedback discussed..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B] disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                Observed Strengths
              </label>
              <textarea
                rows={2}
                disabled={!canEdit || isSaving}
                value={studentStrengths}
                onChange={(e) => setStudentStrengths(e.target.value)}
                placeholder="Visual patterns, verbal comprehension, peer collaboration..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                Specific Learning Gaps / Concerns
              </label>
              <textarea
                rows={2}
                disabled={!canEdit || isSaving}
                value={learningConcerns}
                onChange={(e) => setLearningConcerns(e.target.value)}
                placeholder="Carrying over in column subtraction, Matra confusion..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B] disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
              Agreed Remedial Action Items
            </label>
            <textarea
              rows={2}
              disabled={!canEdit || isSaving}
              value={agreedActions}
              onChange={(e) => setAgreedActions(e.target.value)}
              placeholder="Specific activities: 10 mins daily concrete manipulatives, practice worksheet #4..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B] disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6862] mb-1.5">
                Follow-up Check-in Date
              </label>
              <input
                type="date"
                disabled={!canEdit || isSaving}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#49352F]/20 text-[#49352F] focus:outline-hidden focus:ring-2 focus:ring-[#B26A1B] disabled:bg-gray-100"
              />
            </div>

            {canEdit && (
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="shareParent"
                  checked={sharedWithParent}
                  onChange={(e) => setSharedWithParent(e.target.checked)}
                  className="w-4 h-4 rounded text-[#B26A1B] focus:ring-[#B26A1B] border-gray-300"
                />
                <label htmlFor="shareParent" className="text-xs font-medium text-[#49352F]">
                  Share this summary on Parent Bridge portal
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#49352F]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/5 rounded-xl transition-colors"
            >
              Close
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#261B16] text-[#FAF6E9] hover:bg-[#49352F] shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Meeting Notes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
