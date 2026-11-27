"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { AlertCircle, Building, Sparkles, UserCheck, Phone, Mail, Users } from "lucide-react";
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
  const { t, formatClass } = useLanguage();
  const sf = t.studentForm;

  // Student Basic Information
  const [studentCode, setStudentCode] = useState(student?.studentCode || "");
  const [displayName, setDisplayName] = useState(student?.displayName || "");
  const [grade, setGrade] = useState<number>(student?.grade || 4);
  const [section, setSection] = useState(student?.section || "A");
  const [notes, setNotes] = useState(student?.notes || "");

  // Parent / Guardian Information
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelationship, setParentRelationship] = useState<"father" | "mother" | "guardian">("father");
  const [selectedExistingParentId, setSelectedExistingParentId] = useState<string>("new");
  const [availableParents, setAvailableParents] = useState<Array<{ id: string; name: string; phone?: string; relationship?: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomCode, setIsCustomCode] = useState(false);

  // Fetch available school parents for quick selection
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/parents")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.parents)) {
          setAvailableParents(data.parents);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Load student & linked parent data when opening
  useEffect(() => {
    if (student) {
      setStudentCode(student.studentCode);
      setDisplayName(student.displayName);
      setGrade(student.grade);
      setSection(student.section);
      setNotes(student.notes || "");
      setIsCustomCode(true);

      // Fetch linked parent for this student
      fetch(`/api/students/${student.id}`)
        .then((r) => r.json())
        .then((data) => {
          const linkedParents = data.parents || data.student?.parents || [];
          if (linkedParents.length > 0) {
            const firstP = linkedParents[0];
            setParentName(firstP.name || "");
            setParentPhone(firstP.phone || "");
            setParentEmail(firstP.email || "");
            setParentRelationship(firstP.relationship || "father");
            setSelectedExistingParentId(firstP.id || "new");
          } else {
            setParentName("");
            setParentPhone("");
            setParentEmail("");
            setParentRelationship("father");
            setSelectedExistingParentId("new");
          }
        })
        .catch(() => {});
    } else if (isOpen) {
      setIsCustomCode(false);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setStudentCode(`MPS-4A-${randomSuffix}`);
      setDisplayName("");
      setNotes("");
      setGrade(4);
      setSection("A");
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setParentRelationship("father");
      setSelectedExistingParentId("new");
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

  const handleExistingParentSelect = (pId: string) => {
    setSelectedExistingParentId(pId);
    if (pId === "new") {
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setParentRelationship("father");
    } else {
      const p = availableParents.find((item) => item.id === pId);
      if (p) {
        setParentName(p.name || "");
        setParentPhone(p.phone || "");
        setParentRelationship((p.relationship as any) || "guardian");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError(sf.nameRequired);
      return;
    }

    if (!studentCode.trim()) {
      setError(sf.codeRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = student ? `/api/students/${student.id}` : "/api/students";
      const method = student ? "PUT" : "POST";

      const payload: any = {
        studentCode: studentCode.trim(),
        displayName: displayName.trim(),
        grade: Number(grade),
        section: section.trim().toUpperCase(),
        classroomId: `cls-${grade}${section.toLowerCase()}`,
        notes: notes.trim(),
        enrollmentStatus: "active",
      };

      // Include parent record information
      if (selectedExistingParentId && selectedExistingParentId !== "new") {
        payload.parentId = selectedExistingParentId;
        payload.parentRelationship = parentRelationship;
      } else if (parentName.trim()) {
        payload.parentName = parentName.trim();
        payload.parentPhone = parentPhone.trim();
        payload.parentEmail = parentEmail.trim();
        payload.parentRelationship = parentRelationship;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        broadcastDataUpdate("students", student ? "update" : "create", data.student?.id);
        onSuccess();
        onClose();
      } else {
        setError(data.error || sf.saveFailed);
      }
    } catch {
      setError(sf.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={student ? sf.editTitle : sf.registerTitle}
      description={sf.description}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* School Association Display */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs">
          <span className="text-[#7A6862] font-semibold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#B26A1B]" />
            {sf.schoolAssociation}
          </span>
          <span className="font-bold text-[#49352F] font-heading">
            Model Primary School, Gandhinagar
          </span>
        </div>

        {/* Student Basic Info Section */}
        <div className="space-y-3 p-3 rounded-xl bg-black/2 border border-[#49352F]/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A6862] flex items-center gap-1.5 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-[#2E7D5E]" />
            <span>Student Academic Information</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#49352F] mb-1">
              {sf.fullNameLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error) setError(null);
              }}
              placeholder={sf.fullNamePlaceholder}
              className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                {sf.codeLabel} <span className="text-rose-500">*</span>
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
                {sf.gradeLabel}
              </label>
              <select
                value={grade}
                onChange={(e) => handleGradeChange(Number(e.target.value))}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden cursor-pointer"
              >
                <option value={1}>{formatClass(1)}</option>
                <option value={2}>{formatClass(2)}</option>
                <option value={3}>{formatClass(3)}</option>
                <option value={4}>{formatClass(4)}</option>
                <option value={5}>{formatClass(5)}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#49352F] mb-1">
              {sf.sectionLabel}
            </label>
            <select
              value={section}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-sm text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden cursor-pointer"
            >
              <option value="A">{sf.sectionA}</option>
              <option value="B">{sf.sectionB}</option>
              <option value="C">{sf.sectionC}</option>
            </select>
          </div>
        </div>

        {/* Parent / Guardian Information Section */}
        <div className="space-y-3 p-3.5 rounded-xl bg-[#FAF8F2] border-2 border-[#2E7D5E]/30">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#1F513F] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#2E7D5E]" />
              <span>Parent / Guardian Record</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E]">
              WhatsApp Chat &amp; PTM Connected
            </span>
          </div>

          {/* Quick-Link Existing Parent Dropdown */}
          {availableParents.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                Link Registered School Parent or Add New
              </label>
              <select
                value={selectedExistingParentId}
                onChange={(e) => handleExistingParentSelect(e.target.value)}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2 text-xs text-[#49352F] focus:border-[#2E7D5E] focus:ring-1 focus:ring-[#2E7D5E] outline-hidden cursor-pointer"
              >
                <option value="new">+ Enter New Parent Details</option>
                {availableParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.relationship ? `(${p.relationship})` : ""} {p.phone ? `• ${p.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                Parent / Guardian Full Name
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Dineshbhai Patel"
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2 text-xs text-[#49352F] focus:border-[#2E7D5E] focus:ring-1 focus:ring-[#2E7D5E] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+91 98250 12345"
                  className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-[#49352F]/15 bg-white text-[#49352F] focus:border-[#2E7D5E] focus:ring-1 focus:ring-[#2E7D5E] outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                Relationship to Student
              </label>
              <select
                value={parentRelationship}
                onChange={(e) => setParentRelationship(e.target.value as any)}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2 text-xs text-[#49352F] focus:border-[#2E7D5E] focus:ring-1 focus:ring-[#2E7D5E] outline-hidden cursor-pointer"
              >
                <option value="father">Father (પિતા)</option>
                <option value="mother">Mother (માતા)</option>
                <option value="guardian">Guardian (વાલી)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-[#49352F]/15 bg-white text-[#49352F] focus:border-[#2E7D5E] focus:ring-1 focus:ring-[#2E7D5E] outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#49352F] mb-1">
            {sf.notesLabel}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={sf.notesPlaceholder}
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
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#B26A1B]" />
                <span>{sf.saving}</span>
              </>
            ) : student ? (
              sf.updateBtn
            ) : (
              sf.registerBtn
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
