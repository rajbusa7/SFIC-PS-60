"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { calculatePercentage } from "@/lib/engine/calculations";
import {
  Calendar,
  Layers,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface AssessmentDetailModalProps {
  isOpen: boolean;
  assessmentId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export function AssessmentDetailModal({
  isOpen,
  assessmentId,
  onClose,
  onUpdated,
  onDeleted,
}: AssessmentDetailModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editMaxMarks, setEditMaxMarks] = useState<number>(20);
  const [editScores, setEditScores] = useState<Record<string, { marks: number; notes: string }>>({});

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`);
      const data = await res.json();
      if (data.success) {
        setAssessment(data.assessment);
        setResults(data.results || []);
        setConcepts(data.concepts || []);
        setStudents(data.students || []);

        setEditTitle(data.assessment.title);
        setEditDate(data.assessment.assessmentDate);
        setEditMaxMarks(data.assessment.maxMarks);

        // Prepopulate edit scores
        const scoreMap: Record<string, { marks: number; notes: string }> = {};
        (data.results || []).forEach((r: any) => {
          scoreMap[r.studentId] = {
            marks: r.marksObtained,
            notes: r.notes || "",
          };
        });
        setEditScores(scoreMap);
      } else {
        setError(data.error || "Failed to load assessment details");
      }
    } catch {
      setError("Network error fetching assessment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assessmentId) {
      setIsEditing(false);
      setConfirmDelete(false);
      fetchDetails();
    }
  }, [isOpen, assessmentId]);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = Math.max(0, Math.min(editMaxMarks, parseFloat(val) || 0));
    setEditScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: num,
      },
    }));
  };

  const handleNotesChange = (studentId: string, val: string) => {
    setEditScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: val,
      },
    }));
  };

  const handleSaveEdits = async () => {
    if (!editTitle.trim()) {
      setError("Assessment title cannot be empty");
      return;
    }
    if (editMaxMarks <= 0) {
      setError("Maximum marks must be greater than zero");
      return;
    }

    // Validate marks
    for (const [sId, sData] of Object.entries(editScores)) {
      if (sData.marks < 0) {
        setError("Marks obtained cannot be negative");
        return;
      }
      if (sData.marks > editMaxMarks) {
        setError(`Marks for student cannot exceed maximum marks (${editMaxMarks})`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scoresPayload = Object.entries(editScores).map(([studentId, sData]) => ({
        studentId,
        marksObtained: sData.marks,
        notes: sData.notes,
      }));

      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          assessmentDate: editDate,
          maxMarks: editMaxMarks,
          scores: scoresPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        setError(data.error || "Failed to save assessment edits");
      }
    } catch {
      setError("Network error saving changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (onDeleted) onDeleted();
        onClose();
      } else {
        setError(data.error || "Failed to delete assessment");
      }
    } catch {
      setError("Network error deleting assessment");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const conceptNames = (assessment?.conceptIds || [])
    .map((id: string) => concepts.find((c: any) => c.id === id)?.name || id)
    .join(", ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Assessment & Scores" : assessment?.title || "Assessment Details"}
      description={
        isEditing
          ? "Update assessment properties, max marks, or individual student scores."
          : `Recorded on ${assessment?.assessmentDate || ""} • Max Marks: ${assessment?.maxMarks || 0}`
      }
      maxWidth="xl"
    >
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
          Loading assessment roster and concept records...
        </div>
      ) : error && !assessment ? (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Metadata */}
          {!isEditing ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {assessment?.subjectCode}
                  </Badge>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      assessment?.status === "published"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {assessment?.status === "published" ? "Published & Analyzed" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full text-xs"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>

                  {!confirmDelete ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      className="rounded-full text-xs border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Delete</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-950/80 p-1 rounded-xl border border-rose-800">
                      <span className="text-[10px] text-rose-300 font-bold px-1.5">Confirm?</span>
                      <Button
                        variant="coral"
                        size="sm"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="rounded-lg text-[10px] px-2 py-1 h-auto"
                      >
                        {isDeleting ? "..." : "Yes, Delete"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-slate-400 hover:text-white px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date</span>
                  <span className="font-semibold text-white">{assessment?.assessmentDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Maximum Marks</span>
                  <span className="font-semibold text-white">{assessment?.maxMarks}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px]">Target Concept(s)</span>
                  <span className="font-semibold text-amber-300 line-clamp-1">{conceptNames}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Editing Controls */
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assessment Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assessment Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maximum Marks <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={editMaxMarks}
                  onChange={(e) => setEditMaxMarks(Number(e.target.value))}
                  className="w-32 rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-bold text-white focus:border-amber-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Student Scores Roster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Student Scores ({results.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Thresholds: &ge;80% Mastered | 60-79.99% Developing | &lt;60% Needs Support
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3">%</th>
                    <th className="p-3">Mastery Status</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                        No individual student scores recorded under this assessment.
                      </td>
                    </tr>
                  ) : (
                    results.map((r) => {
                      const studentObj = students.find((s) => s.id === r.studentId);
                      const currentMarks = isEditing
                        ? editScores[r.studentId]?.marks ?? r.marksObtained
                        : r.marksObtained;
                      const max = isEditing ? editMaxMarks : r.maximumMarks || assessment?.maxMarks || 20;
                      const pct = calculatePercentage(currentMarks, max);
                      const status =
                        pct >= 80 ? "Mastered" : pct >= 60 ? "Developing" : "Needs Support";

                      return (
                        <tr key={r.id} className="hover:bg-slate-900/40">
                          <td className="p-3">
                            <span className="font-bold text-white block">
                              {studentObj?.displayName || r.studentId}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {studentObj?.studentCode || ""}
                            </span>
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={editMaxMarks}
                                value={editScores[r.studentId]?.marks ?? r.marksObtained}
                                onChange={(e) => handleScoreChange(r.studentId, e.target.value)}
                                className="w-20 rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs font-bold text-amber-400 focus:border-amber-500 outline-hidden"
                              />
                            ) : (
                              <span className="font-bold text-slate-200">
                                {r.marksObtained} / {r.maximumMarks}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-white">{pct}%</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                status === "Mastered"
                                  ? "mastered"
                                  : status === "Developing"
                                  ? "developing"
                                  : "needsSupport"
                              }
                              size="sm"
                              dot
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-300">
                            {isEditing ? (
                              <input
                                type="text"
                                placeholder="Observations..."
                                value={editScores[r.studentId]?.notes ?? r.notes ?? ""}
                                onChange={(e) => handleNotesChange(r.studentId, e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-amber-500 outline-hidden"
                              />
                            ) : (
                              r.notes || <span className="text-slate-500 italic">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="saffron"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleSaveEdits}
                  className="rounded-full text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? "Saving..." : "Save Assessment Changes"}
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
