"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { AlertCircle, ShieldCheck } from "lucide-react";
import type { Student } from "@/lib/types";

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSuccess: () => void;
  existingCodes?: string[];
}

export function StudentFormModal({
  isOpen,
  onClose,
  student,
  onSuccess,
  existingCodes = [],
}: StudentFormModalProps) {
  const [studentCode, setStudentCode] = useState(student?.studentCode || "");
  const [displayName, setDisplayName] = useState(student?.displayName || "");
  const [grade, setGrade] = useState<number>(student?.grade || 4);
  const [section, setSection] = useState(student?.section || "A");
  const [enrollmentStatus, setEnrollmentStatus] = useState<"active" | "transferred" | "graduated">(
    student?.enrollmentStatus || "active"
  );
  const [notes, setNotes] = useState(student?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setStudentCode(student.studentCode);
      setDisplayName(student.displayName);
      setGrade(student.grade);
      setSection(student.section);
      setEnrollmentStatus(student.enrollmentStatus || "active");
      setNotes(student.notes || "");
      setError(null);
    } else if (isOpen) {
      // Auto-generate unique placeholder code if blank
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setStudentCode((prev) => (prev ? prev : `MPS-4A-${randomSuffix}`));
      setDisplayName("");
      setGrade(4);
      setSection("A");
      setEnrollmentStatus("active");
      setNotes("");
      setError(null);
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanCode = studentCode.trim();

    if (!cleanName) {
      setError("Please provide the student's full name.");
      return;
    }

    if (!cleanCode) {
      setError("Please provide a unique student roll/ID code.");
      return;
    }

    // Check duplicate code against existing codes (excluding student's current code when editing)
    const normalizedCode = cleanCode.toLowerCase();
    const isDuplicate = existingCodes.some((code) => {
      if (student && student.studentCode.toLowerCase() === normalizedCode) {
        return false;
      }
      return code.toLowerCase() === normalizedCode;
    });

    if (isDuplicate) {
      setError(`Student ID '${cleanCode}' is already registered to another student. Please enter a unique ID.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = student ? `/api/students/${student.id}` : "/api/students";
      const method = student ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCode: cleanCode,
          displayName: cleanName,
          grade: Number(grade),
          section: section.toUpperCase(),
          classroomId: `cls-${grade}${section.toLowerCase()}`,
          notes,
          enrollmentStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to save student record");
      }
    } catch {
      setError("Network error saving student. Your inputs have been kept, please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={student ? "Edit Student Record" : "Register New Student"}
      description="Record primary school enrollment information. Sensitive family/biometric data is not collected."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Student Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Aarav Patel"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student ID / Roll Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={studentCode}
              onChange={(e) => {
                setStudentCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. MPS-4A-12"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm font-mono text-slate-900 dark:text-amber-400 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Must be unique across the school</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Grade (Class) <span className="text-rose-500">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden cursor-pointer"
            >
              <option value={1}>Class 1</option>
              <option value={2}>Class 2</option>
              <option value={3}>Class 3</option>
              <option value={4}>Class 4</option>
              <option value={5}>Class 5</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Section <span className="text-rose-500">*</span>
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden cursor-pointer"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Enrollment Status
            </label>
            <select
              value={enrollmentStatus}
              onChange={(e) => setEnrollmentStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden cursor-pointer"
            >
              <option value="active">Active Enrolled</option>
              <option value="transferred">Transferred (Archived)</option>
              <option value="graduated">Graduated (Archived)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Teacher Notes & Observations
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Responsive to visual charts; needs extra time for reading."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
          />
        </div>

        {/* Data Privacy Guarantee Notice */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Child Privacy Preserved: Aadhaar, biometric, and personal financial data are strictly excluded.</span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : student ? "Update Student Record" : "Register Student"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
