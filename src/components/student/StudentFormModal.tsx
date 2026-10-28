"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { broadcastDataUpdate } from "@/lib/events";
import type { Student } from "@/lib/types";

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSuccess: () => void;
}

export function StudentFormModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: StudentFormModalProps) {
  const { language } = useLanguage();
  const [studentCode, setStudentCode] = useState(student?.studentCode || "");
  const [displayName, setDisplayName] = useState(student?.displayName || "");
  const [grade, setGrade] = useState<number>(student?.grade || 4);
  const [section, setSection] = useState(student?.section || "A");
  const [notes, setNotes] = useState(student?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomCode, setIsCustomCode] = useState(false);

  useEffect(() => {
    if (student) {
      setStudentCode(student.studentCode);
      setDisplayName(student.displayName);
      setGrade(student.grade);
      setSection(student.section);
      setNotes(student.notes || "");
      setIsCustomCode(true);
    } else if (isOpen) {
      setIsCustomCode(false);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setStudentCode(`MPS-4A-${randomSuffix}`);
      setDisplayName("");
      setNotes("");
      setGrade(4);
      setSection("A");
      setError(null);
    }
  }, [student, isOpen]);

  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    if (!student && !isCustomCode) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setStudentCode(`MPS-${newGrade}${section}-${randomSuffix}`);
    }
  };

  const handleSectionChange = (newSec: string) => {
    setSection(newSec);
    if (!student && !isCustomCode) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setStudentCode(`MPS-${grade}${newSec}-${randomSuffix}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !studentCode.trim()) {
      setError(
        language === "gu"
          ? "કૃપા કરીને વિદ્યાર્થીનું નામ અને રોલ કોડ બંને આપો."
          : "Please provide both student name and roll code."
      );
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
        cache: "no-store",
        body: JSON.stringify({
          studentCode: studentCode.trim(),
          displayName: displayName.trim(),
          grade: Number(grade),
          section: section.trim().toUpperCase(),
          classroomId: `cls-${grade}${section.toLowerCase()}`,
          notes: notes.trim(),
          enrollmentStatus: "active",
        }),
      });

      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("students", student ? "update" : "create", data.student?.id);
        onSuccess();
        onClose();
      } else {
        setError(
          data.error ||
            (language === "gu" ? "વિદ્યાર્થી રેકોર્ડ સાચવવામાં નિષ્ફળ" : "Failed to save student record")
        );
      }
    } catch {
      setError(
        language === "gu" ? "નેટવર્ક ભૂલ: વિદ્યાર્થી સાચવી શકાયો નથી" : "Network error saving student"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        student
          ? language === "gu"
            ? "વિદ્યાર્થી વિગતો સંપાદિત કરો"
            : "Edit Student Details"
          : language === "gu"
          ? "નવા વિદ્યાર્થીની નોંધણી કરો"
          : "Register New Student"
      }
      description={
        language === "gu"
          ? "પ્રાથમિક શાળા પ્રવેશ માહિતી નોંધો. સંવેદનશીલ પારિવારિક/બાયોમેટ્રિક ડેટા એકત્રિત કરવામાં આવતો નથી."
          : "Record primary school enrollment information. Sensitive family/biometric data is not collected."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#49352F] mb-1">
            {language === "gu" ? "વિદ્યાર્થીનું પૂરું નામ" : "Student Full Name"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={language === "gu" ? "દા.ત. આરવ પટેલ" : "e.g. Aarav Patel"}
            className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#49352F] mb-1">
              {language === "gu" ? "વિદ્યાર્થી કોડ / રોલ" : "Student Code / Roll"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={studentCode}
              onChange={(e) => {
                setStudentCode(e.target.value);
                setIsCustomCode(true);
              }}
              placeholder="e.g. MPS-4A-12"
              className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm font-mono text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#49352F] mb-1">
              {language === "gu" ? "ધોરણ (વર્ગ)" : "Grade (Class)"}
            </label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(Number(e.target.value))}
              className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden cursor-pointer"
            >
              <option value={1}>{language === "gu" ? "ધોરણ ૧" : "Class 1"}</option>
              <option value={2}>{language === "gu" ? "ધોરણ ૨" : "Class 2"}</option>
              <option value={3}>{language === "gu" ? "ધોરણ ૩" : "Class 3"}</option>
              <option value={4}>{language === "gu" ? "ધોરણ ૪" : "Class 4"}</option>
              <option value={5}>{language === "gu" ? "ધોરણ ૫" : "Class 5"}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#49352F] mb-1">
            {language === "gu" ? "વિભાગ" : "Section"}
          </label>
          <select
            value={section}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden cursor-pointer"
          >
            <option value="A">{language === "gu" ? "વિભાગ અ (Section A)" : "Section A"}</option>
            <option value="B">{language === "gu" ? "વિભાગ બ (Section B)" : "Section B"}</option>
            <option value="C">{language === "gu" ? "વિભાગ ક (Section C)" : "Section C"}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#49352F] mb-1">
            {language === "gu" ? "શિક્ષકની નોંધ અને અવલોકનો" : "Teacher Notes & Observations"}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              language === "gu"
                ? "દા.ત. વિઝ્યુઅલ ચાર્ટ્સ દ્વારા ઝડપી શીખે છે; વાંચન માટે વધારાના સમયની જરૂર છે."
                : "e.g. Responsive to visual charts; needs extra time for reading."
            }
            className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs text-[#49352F] placeholder-[#7A6862]/60 focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#49352F]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] hover:text-[#49352F] rounded-xl cursor-pointer transition-colors"
          >
            {language === "gu" ? "રદ કરો" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? language === "gu"
                ? "સાચવી રહ્યું છે..."
                : "Saving..."
              : student
              ? language === "gu"
                ? "વિદ્યાર્થી અપડેટ કરો"
                : "Update Student"
              : language === "gu"
              ? "વિદ્યાર્થી નોંધણી કરો"
              : "Register Student"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
