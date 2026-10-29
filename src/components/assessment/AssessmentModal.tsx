"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { calculatePercentage } from "@/lib/engine/calculations";
import { AlertCircle, CheckCircle2, Award, BookOpen, Calendar, HelpCircle } from "lucide-react";

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
  defaultSubject?: "MATH" | "ENG" | "GUJ" | "EVS";
  onSuccess?: () => void;
}

export function AssessmentModal({
  isOpen,
  onClose,
  studentId: initialStudentId,
  studentName: initialStudentName,
  defaultSubject = "MATH",
  onSuccess,
}: AssessmentModalProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || "");
  const [subjectCode, setSubjectCode] = useState<"MATH" | "ENG" | "GUJ" | "EVS">(defaultSubject);
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [maxMarks, setMaxMarks] = useState<string>("20");
  const [marksObtained, setMarksObtained] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch students and concepts
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [resStd, resAsm] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/assessments"),
        ]);
        const [dataStd, dataAsm] = await Promise.all([resStd.json(), resAsm.json()]);

        if (dataStd.success) {
          setStudents(dataStd.students || []);
          if (!initialStudentId && dataStd.students?.length > 0) {
            setSelectedStudentId(dataStd.students[0].id);
          } else if (initialStudentId) {
            setSelectedStudentId(initialStudentId);
          }
        }

        if (dataAsm.success && Array.isArray(dataAsm.concepts)) {
          setConcepts(dataAsm.concepts);
        }
      } catch (err) {
        console.error("Failed to load assessment form dependencies", err);
        setError("Failed to load students and curriculum concepts");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, initialStudentId]);

  // Filter concepts based on subject
  const availableConcepts = concepts.filter((c) => c.subjectCode === subjectCode);

  // Auto-select first concept when subject changes or concepts load
  useEffect(() => {
    if (availableConcepts.length > 0) {
      const match = availableConcepts.find((c) => c.id === selectedConceptId);
      if (!match) {
        setSelectedConceptId(availableConcepts[0].id);
      }
    } else {
      setSelectedConceptId("");
    }
  }, [subjectCode, concepts]);

  // Auto-generate title if not manually changed
  useEffect(() => {
    if (selectedConceptId) {
      const concept = concepts.find((c) => c.id === selectedConceptId);
      if (concept) {
        setTitle(`${concept.name} Formative Evaluation`);
      }
    }
  }, [selectedConceptId, concepts]);

  // Reset form when reopened
  useEffect(() => {
    if (isOpen) {
      setMarksObtained("");
      setMaxMarks("20");
      setNotes("");
      setError(null);
      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
      }
      setSubjectCode(defaultSubject);
      setAssessmentDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, initialStudentId, defaultSubject]);

  const maxNum = parseFloat(maxMarks) || 0;
  const obtainedNum = parseFloat(marksObtained);
  const hasMarks = marksObtained.trim() !== "" && !isNaN(obtainedNum);

  const pct = hasMarks && maxNum > 0 ? calculatePercentage(obtainedNum, maxNum) : 0;

  const masteryStatus =
    !hasMarks
      ? null
      : pct >= 80
      ? "Mastered"
      : pct >= 60
      ? "Developing"
      : "Needs Support";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation rules:
    // 1. Required fields must not be empty
    if (!selectedStudentId) {
      setError("Please select a student.");
      return;
    }
    if (!selectedConceptId) {
      setError("Please select a competency or learning outcome.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide an assessment title.");
      return;
    }
    if (!assessmentDate) {
      setError("Please select an assessment date.");
      return;
    }
    // 2. Maximum marks must be greater than zero
    if (isNaN(maxNum) || maxNum <= 0) {
      setError("Maximum marks must be greater than zero.");
      return;
    }
    // 3. Marks obtained cannot be empty or negative
    if (isNaN(obtainedNum)) {
      setError("Please enter the marks obtained.");
      return;
    }
    if (obtainedNum < 0) {
      setError("Marks obtained cannot be negative.");
      return;
    }
    // 4. Marks obtained cannot exceed maximum marks
    if (obtainedNum > maxNum) {
      setError(`Marks obtained (${obtainedNum}) cannot exceed maximum marks (${maxNum}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const activeStudent = students.find((s) => s.id === selectedStudentId);
    const classroomId = activeStudent?.classroomId || "cls-4a";

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          subjectId: `sub-${subjectCode.toLowerCase()}`,
          subjectCode,
          title: title.trim(),
          assessmentDate,
          maxMarks: maxNum,
          conceptIds: [selectedConceptId],
          status: "published",
          scores: [
            {
              studentId: selectedStudentId,
              conceptId: selectedConceptId,
              marksObtained: obtainedNum,
              notes: notes.trim(),
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to save assessment record.");
      }
    } catch {
      setError("A network error occurred while recording the assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Student Assessment"
      description="Enter competency-level evaluation marks to persistently update learning-gap detection."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Student <span className="text-rose-400">*</span>
          </label>
          {initialStudentId && initialStudentName ? (
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-white">{initialStudentName}</span>
                <span className="text-xs text-slate-400 ml-2 font-mono">({selectedStudent?.studentCode || initialStudentId})</span>
              </div>
              <Badge variant="outline" size="sm">
                Class {selectedStudent?.grade || 4}-{selectedStudent?.section || "A"}
              </Badge>
            </div>
          ) : (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-bold text-white focus:border-amber-500 outline-hidden"
            >
              <option value="">-- Choose Student --</option>
              {students.map((std) => (
                <option key={std.id} value={std.id}>
                  {std.displayName} ({std.studentCode}) - Class {std.grade}-{std.section}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Subject & Competency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject <span className="text-rose-400">*</span>
            </label>
            <select
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-semibold text-white focus:border-amber-500 outline-hidden"
            >
              <option value="MATH">Mathematics (ગણિત)</option>
              <option value="ENG">English</option>
              <option value="GUJ">Gujarati (ગુજરાતી)</option>
              <option value="EVS">Environmental Studies (પર્યાવરણ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Competency / Learning Outcome <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedConceptId}
              onChange={(e) => setSelectedConceptId(e.target.value)}
              disabled={loading || availableConcepts.length === 0}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:border-amber-500 outline-hidden font-medium"
            >
              {availableConcepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.nameGujarati ? `(${c.nameGujarati})` : ""}
                </option>
              ))}
              {availableConcepts.length === 0 && (
                <option value="">No concepts defined for this subject</option>
              )}
            </select>
          </div>
        </div>

        {/* Title and Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assessment Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Division Check"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assessment Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-500 outline-hidden"
            />
          </div>
        </div>

        {/* Marks Entry & Live Calculation */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maximum Marks <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                placeholder="20"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm font-bold text-white focus:border-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Marks Obtained <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={maxNum > 0 ? maxNum : undefined}
                step="any"
                required
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                placeholder={`0 - ${maxNum || 20}`}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm font-bold text-amber-400 focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Real-time Percentage & Mastery Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Calculated Percentage</span>
              <span className="text-lg font-black text-white">
                {hasMarks ? `${pct}%` : "--"}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Algorithmic Classification</span>
              {masteryStatus ? (
                <Badge
                  variant={
                    masteryStatus === "Mastered"
                      ? "mastered"
                      : masteryStatus === "Developing"
                      ? "developing"
                      : "needsSupport"
                  }
                  size="sm"
                  dot
                >
                  {masteryStatus}
                </Badge>
              ) : (
                <span className="text-xs text-slate-500 italic">Enter marks above</span>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Thresholds: &ge; 80% = Mastered | 60% &ndash; 79.99% = Developing | &lt; 60% = Flagged for Learning Support
          </p>
        </div>

        {/* Teacher Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Teacher Notes / Observations (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Qualitative observations during assessment..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="saffron"
            size="sm"
            disabled={isSubmitting || loading}
            className="rounded-full text-xs font-bold shadow-md shadow-amber-500/20"
          >
            {isSubmitting ? "Saving Assessment..." : "Save Assessment & Recalculate Gaps"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
