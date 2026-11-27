"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { apiClient } from "@/services/apiClient";
import type { MeetingWithInvites, MeetingActionItem } from "@shared/types";

interface MeetingNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingWithInvites | null;
  onSaved?: () => void;
}

export function MeetingNotesModal({
  isOpen,
  onClose,
  meeting,
  onSaved,
}: MeetingNotesModalProps) {
  const { t, language } = useLanguage();
  const langKey = language === "gu" ? "gu" : "en";
  const vt = {
    ...translations[langKey].video,
    ...((t as any).video || {}),
  };

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
  const [worksheets, setWorksheets] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set default student when modal opens
  useEffect(() => {
    if (meeting && meeting.invites && meeting.invites.length > 0) {
      if (!selectedStudentId || !meeting.invites.some((i) => i.studentId === selectedStudentId)) {
        setSelectedStudentId(meeting.invites[0].studentId);
      }
    }
  }, [meeting, selectedStudentId]);

  // Load existing notes for this student & meeting
  useEffect(() => {
    if (!isOpen || !meeting) return;

    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      setFeedback(null);

      // 1. Fetch worksheets safely
      try {
        const wsRes = await apiClient.getWorksheetsList();
        if (mounted && wsRes && wsRes.success) {
          setWorksheets(wsRes.worksheets || []);
        }
      } catch (wsErr) {
        console.warn("[MeetingNotes] Non-blocking worksheets warning:", wsErr);
      }

      // 2. Fetch notes for this meeting and student
      try {
        const notesRes = await apiClient.getMeetingNotes(meeting!.id, selectedStudentId || undefined);
        if (mounted && notesRes && notesRes.success && notesRes.notes && notesRes.notes.length > 0) {
          const currentNote = notesRes.notes[0];
          setNotes(currentNote.notes || "");
          const formattedActions: MeetingActionItem[] = (currentNote.actionItems || []).map(
            (act: any, idx: number) => {
              if (typeof act === "string") {
                return {
                  id: "act-" + idx,
                  description: act,
                  worksheetId: null,
                };
              }
              return act;
            }
          );
          setActionItems(formattedActions);
        } else if (mounted) {
          setNotes("");
          setActionItems([]);
        }
      } catch (notesErr) {
        console.warn("[MeetingNotes] Non-blocking notes warning:", notesErr);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [isOpen, meeting, selectedStudentId]);

  const handleAddActionItem = () => {
    const newItem: MeetingActionItem = {
      id: "act-" + Date.now(),
      description: "",
      worksheetId: null,
    };
    setActionItems((prev) => [...prev, newItem]);
  };

  const handleRemoveActionItem = (id: string) => {
    setActionItems((prev) => prev.filter((a) => a.id !== id));
  };

  const handleActionChange = (id: string, updates: Partial<MeetingActionItem>) => {
    setActionItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = { ...item, ...updates };
          if (updates.worksheetId) {
            const foundWs = worksheets.find((w) => w.id === updates.worksheetId);
            if (foundWs) next.worksheetTitle = foundWs.title;
          } else if (updates.worksheetId === null) {
            next.worksheetTitle = null;
          }
          return next;
        }
        return item;
      })
    );
  };

  const handleSave = async () => {
    if (!meeting) return;
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const validActions = actionItems
        .filter((a) => a.description.trim().length > 0)
        .map((a) => ({
          id: a.id,
          description: a.description.trim(),
          worksheetId: a.worksheetId || null,
          worksheetTitle: a.worksheetTitle || null,
        }));

      const res = await apiClient.saveMeetingNote(meeting.id, {
        studentId: selectedStudentId || null,
        notes: notes.trim(),
        actionItems: validActions,
      });

      if (!res.success) {
        throw new Error((res as any).error || "Failed to save meeting notes");
      }

      setFeedback(vt.saveNotesSuccess);
      onSaved?.();
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vt.notesTitle}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-[#49352F] dark:text-[#F4F1E1]">
        <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/75 leading-relaxed">
          {vt.notesSubtitle}
        </p>

        {/* Feedback / Error */}
        {feedback && (
          <div className="p-3 rounded-xl bg-[#EAF4EE] border border-[#2E7D5E]/25 text-[#2E7D5E] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-[#FBECE9] border border-[#A93327]/25 text-[#A93327] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Student Selector (for group meetings) */}
        {meeting?.invites && meeting.invites.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold">{vt.selectStudentPrompt}</label>
            <div className="flex flex-wrap gap-2">
              {meeting.invites.map((inv) => {
                const isSelected = selectedStudentId === inv.studentId;
                return (
                  <button
                    key={inv.studentId}
                    type="button"
                    onClick={() => setSelectedStudentId(inv.studentId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#261B16] text-[#FAF6E9] border-[#261B16] shadow-xs"
                        : "bg-white dark:bg-[#1E1916] text-[#49352F] dark:text-[#F4F1E1] border-[#49352F]/15 hover:border-[#B26A1B]"
                    }`}
                  >
                    {inv.studentName || inv.studentId}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Teacher Notes Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#49352F] dark:text-[#FAF6E9]">
            {vt.discussionNotes || (language === "gu" ? "ચર્ચા નોંધો" : "Discussion Notes")}
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={vt.notesPlaceholder || (language === "gu" ? "મીટિંગ દરમિયાન થયેલી મુખ્ય ચર્ચાઓ અને મુદ્દાઓ અહીં લખો..." : "Record key discussion points and pedagogical observations from this meeting...")}
            className="w-full rounded-2xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 px-3.5 py-2.5 text-xs text-[#49352F] dark:text-[#FAF6E9] focus:outline-none focus:ring-2 focus:ring-[#B26A1B]"
          />
        </div>

        {/* Action Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6862] dark:text-[#FAF6E9]/70">
              {vt.actionItemsHeading || (language === "gu" ? "ઘર અને શાળા માટે કાર્ય આઇટમ્સ" : "Action Items for Home & School")}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddActionItem}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {vt.addActionItemBtn || (language === "gu" ? "+ કાર્ય આઇટમ ઉમેરો" : "+ Add Action Item")}
            </Button>
          </div>

          {actionItems.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#FAF6E9] dark:bg-[#1E1916] border border-dashed border-[#49352F]/20 text-center">
              <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/70">
                {language === "gu"
                  ? `હજુ સુધી કોઈ કાર્ય આઇટમ્સ ઉમેરાયેલ નથી. પ્રેક્ટિસ સોંપવા માટે "${vt.addActionItemBtn || '+ કાર્ય આઇટમ ઉમેરો'}" પર ક્લિક કરો.`
                  : `No action items added yet. Click "${vt.addActionItemBtn || '+ Add Action Item'}" to assign practice for home.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {actionItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#B26A1B]/15 text-[#B26A1B] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleActionChange(item.id, { description: e.target.value })}
                      placeholder={vt.actionItemPlaceholder || (language === "gu" ? "દા.ત. ૧૦ મિનિટ ૨-અંકના સરવાળાની કાર્ડ્સ સાથે પ્રેક્ટિસ" : "e.g. Practice 2-digit regrouping for 10 mins daily")}
                      className="flex-1 rounded-xl bg-transparent border border-[#49352F]/15 dark:border-[#F2CAB3]/20 px-2.5 py-1.5 text-xs text-[#49352F] dark:text-[#FAF6E9] focus:outline-none focus:ring-2 focus:ring-[#B26A1B]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveActionItem(item.id)}
                      className="text-[#A93327] hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Remove action item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Worksheet Link Dropdown */}
                  <div className="flex items-center gap-2 pl-7 text-[11px]">
                    <span className="text-[#7A6862] dark:text-[#FAF6E9]/70 shrink-0">
                      {vt.linkWorksheetPrompt || (language === "gu" ? "પૂરક કાર્યપત્રક જોડો" : "Link Remedial Worksheet")}:
                    </span>
                    <select
                      value={item.worksheetId || ""}
                      onChange={(e) =>
                        handleActionChange(item.id, {
                          worksheetId: e.target.value ? e.target.value : null,
                        })
                      }
                      className="flex-1 rounded-lg bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/15 px-2 py-1 text-[11px] text-[#49352F] dark:text-[#FAF6E9] focus:outline-none"
                    >
                      <option value="">{vt.noWorksheetLinked || (language === "gu" ? "કોઈ નહીં (સામાન્ય કાર્ય)" : "None (General Task)")}</option>
                      {worksheets.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.title} ({ws.subjectCode || "All"} • Grade {ws.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15">
          <Button variant="outline" size="sm" onClick={onClose}>
            {vt.closeBtn || (language === "gu" ? "બંધ કરો" : "Close")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={saving}
            onClick={handleSave}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            {vt.saveNotesBtn || (language === "gu" ? "નોંધો સાચવો" : "Save Notes")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
