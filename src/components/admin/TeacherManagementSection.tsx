"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import type { SubjectCode, TeacherAssignment } from "@/lib/types";
import {
  Users,
  UserPlus,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Power,
  ShieldCheck,
  BookOpen,
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Layers,
  ChevronRight,
} from "lucide-react";

export interface ManagedTeacher {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: "active" | "disabled" | "pending";
  teacherType: "subject" | "class";
  schoolId: string;
  avatarUrl?: string | null;
  assignments: TeacherAssignment[];
  createdAt?: string;
  updatedAt?: string;
}

const SUBJECT_CODES: SubjectCode[] = ["MATH", "ENG", "GUJ", "EVS", "SCI", "SST", "HIN"];

export function TeacherManagementSection() {
  const { t, tr, formatSubject, formatClass } = useLanguage();
  const at = t.adminTeachers;
  const { user, role } = useAuth();
  const isAdmin = user?.role === "admin" || role === "admin";

  // Data states
  const [teachers, setTeachers] = useState<ManagedTeacher[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Alert states
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Assignment Form states
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [assignSubject, setAssignSubject] = useState<SubjectCode>("MATH");
  const [assignGrades, setAssignGrades] = useState<number[]>([1, 2, 3]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  // Add / Edit Teacher Modal
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<ManagedTeacher | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formTeacherType, setFormTeacherType] = useState<"subject" | "class">("subject");
  const [formStatus, setFormStatus] = useState<"active" | "disabled">("active");
  const [formSubjects, setFormSubjects] = useState<SubjectCode[]>(["MATH"]);
  const [formGrades, setFormGrades] = useState<number[]>([1, 2, 3]);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Teacher Modal
  const [deletingTeacher, setDeletingTeacher] = useState<ManagedTeacher | null>(null);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);

  // Fetch all live data from database
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        fetch("/api/admin/teachers", { cache: "no-store" }),
        fetch("/api/admin/teachers/assignments", { cache: "no-store" }),
      ]);
      const [tData, aData] = await Promise.all([tRes.json(), aRes.json()]);

      if (tData.success && Array.isArray(tData.teachers)) {
        setTeachers(tData.teachers);
        setSelectedTeacherId((prev) => {
          if (prev && tData.teachers.some((t: ManagedTeacher) => t.id === prev)) return prev;
          return tData.teachers[0]?.id || "";
        });
      }
      if (aData.success && Array.isArray(aData.assignments)) {
        setAssignments(aData.assignments);
      }
    } catch (e: any) {
      console.error("Failed to load teacher management data", e);
      setGlobalError(at.errSyncDb);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Real-time SSE listener
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/admin/teachers/assignments/stream");
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ASSIGNMENT_SAVED" || data.type === "ASSIGNMENT_REMOVED") {
            loadData();
          }
        } catch {}
      };
    } catch {}

    // 15-second polling fallback
    const interval = setInterval(() => {
      loadData();
    }, 15000);

    return () => {
      clearInterval(interval);
      if (es) es.close();
    };
  }, [loadData]);

  // Compute filtered teachers
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.assignments.some((a) => a.subjectCode.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  // Teacher Initials helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Open modal to add teacher
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormTeacherType("subject");
    setFormStatus("active");
    setFormSubjects(["MATH"]);
    setFormGrades([1, 2, 3]);
    setFormError(null);
    setShowTeacherModal(true);
  };

  // Open modal to edit teacher
  const handleOpenEditTeacher = (t: ManagedTeacher) => {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormEmail(t.email);
    setFormPassword("");
    setFormTeacherType(t.teacherType || "subject");
    setFormStatus(t.status === "disabled" ? "disabled" : "active");
    const existingSubjects = Array.from(new Set(t.assignments.map((a) => a.subjectCode)));
    setFormSubjects(existingSubjects.length > 0 ? existingSubjects : ["MATH"]);
    const existingGrades = Array.from(new Set(t.assignments.flatMap((a) => a.grades || [])));
    setFormGrades(existingGrades.length > 0 ? existingGrades : [1, 2, 3]);
    setFormError(null);
    setShowTeacherModal(true);
  };

  // Save Teacher (Create or Update)
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError(at.errFullName);
      return;
    }
    if (!formEmail.trim() || !formEmail.includes("@")) {
      setFormError(at.errEmail);
      return;
    }

    setFormSaving(true);
    setFormError(null);

    try {
      if (editingTeacher) {
        // Update existing teacher
        const res = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim().toLowerCase(),
            status: formStatus,
            teacherType: formTeacherType,
            password: formPassword.trim() || undefined,
            assignedSubjects: formSubjects,
            assignedClasses: formGrades,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || at.errUpdateAccount);
        }
        setGlobalSuccess(tr("adminTeachers.msgUpdated", { name: formName }));
      } else {
        // Create new teacher
        const res = await fetch("/api/admin/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim().toLowerCase(),
            password: formPassword.trim() || "Teacher@123",
            teacherType: formTeacherType,
            status: formStatus,
            assignedSubjects: formSubjects,
            assignedClasses: formGrades,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || at.errCreateAccount);
        }
        setGlobalSuccess(tr("adminTeachers.msgRegistered", { name: formName }));
        if (data.teacher?.id) {
          setSelectedTeacherId(data.teacher.id);
        }
      }

      setShowTeacherModal(false);
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err: any) {
      setFormError(err.message || at.errSaveTeacher);
    } finally {
      setFormSaving(false);
    }
  };

  // Toggle active / deactivated status
  const handleToggleStatus = async (t: ManagedTeacher) => {
    const newStatus = t.status === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`/api/admin/teachers/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || at.errChangeStatus);
      }
      setGlobalSuccess(
        newStatus === "active"
          ? tr("adminTeachers.msgActivated", { name: t.name })
          : tr("adminTeachers.msgDeactivated", { name: t.name })
      );
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 3500);
    } catch (err: any) {
      setGlobalError(err.message || at.errToggleStatus);
      setTimeout(() => setGlobalError(null), 4000);
    }
  };

  // Delete Teacher after confirmation
  const handleConfirmDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setIsDeletingTeacher(true);
    try {
      const res = await fetch(`/api/admin/teachers/${deletingTeacher.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || at.errDeleteTeacher);
      }
      setGlobalSuccess(tr("adminTeachers.msgDeleted", { name: deletingTeacher.name }));
      setDeletingTeacher(null);
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err: any) {
      setGlobalError(err.message || at.errDeleteTeacher);
      setTimeout(() => setGlobalError(null), 4000);
    } finally {
      setIsDeletingTeacher(false);
    }
  };

  // Quick select teacher for assignment form
  const handleSelectTeacherForAssignment = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    const target = document.getElementById("assignment-form");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Pre-fill assignment form for editing
  const handleEditAssignment = (asg: TeacherAssignment) => {
    setSelectedTeacherId(asg.teacherId);
    setAssignSubject(asg.subjectCode);
    if (asg.grades && asg.grades.length > 0) {
      setAssignGrades(asg.grades.slice().sort((a, b) => a - b));
    }
    const target = document.getElementById("assignment-form");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Toggle grade in assignment form
  const handleToggleAssignGrade = (g: number) => {
    setAssignGrades((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g].sort((a, b) => a - b)
    );
  };

  // Toggle grade in modal form
  const handleToggleModalGrade = (g: number) => {
    setFormGrades((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g].sort((a, b) => a - b)
    );
  };

  // Toggle subject in modal form
  const handleToggleModalSubject = (code: SubjectCode) => {
    setFormSubjects((prev) =>
      prev.includes(code)
        ? (prev.length > 1 ? prev.filter((s) => s !== code) : prev)
        : [...prev, code]
    );
  };

  // Save Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      setAssignError(at.errSelectTeacher);
      return;
    }
    if (assignGrades.length === 0) {
      setAssignError(at.errSelectClass);
      return;
    }

    setAssignSaving(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      const targetTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
      const classroomIds = assignGrades.map((g) => `cls-${g}a`);
      const res = await fetch("/api/admin/teachers/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId || targetTeacher?.id,
          teacherEmail: targetTeacher?.email,
          teacherName: targetTeacher?.name,
          subjectCode: assignSubject,
          classroomIds,
          grades: assignGrades,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || at.errSaveAssignment);
      }

      // Optimistically update local assignments list immediately
      if (data.assignment) {
        setAssignments((prev) => {
          const existingIdx = prev.findIndex(
            (a) => a.id === data.assignment.id || (a.teacherId === data.assignment.teacherId && a.subjectCode === data.assignment.subjectCode)
          );
          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = data.assignment;
            return next;
          }
          return [data.assignment, ...prev];
        });
      }

      setAssignSuccess(at.msgAssignmentSaved);
      await loadData();
      setTimeout(() => setAssignSuccess(null), 3500);
    } catch (err: any) {
      setAssignError(err.message || at.errSaveAssignment);
    } finally {
      setAssignSaving(false);
    }
  };

  // Delete Individual Assignment
  const handleDeleteAssignment = (asgId: string) => {
    setAssignmentToDelete(asgId);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    const asgId = assignmentToDelete;
    setAssignmentToDelete(null);
    try {
      const res = await fetch(`/api/admin/teachers/assignments/${asgId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || at.errRemoveAssignment);
      }
      setAssignments((prev) => prev.filter((a) => a.id !== asgId));
      setGlobalSuccess(at.msgAssignmentRemoved);
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 3000);
    } catch (err: any) {
      setGlobalError(err.message || at.errRemoveAssignment);
      setTimeout(() => setGlobalError(null), 3500);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const selectedTeacherObj = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div id="teacher-management" className="space-y-6">
      {/* Global Alerts */}
      {globalSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{globalSuccess}</span>
        </div>
      )}
      {globalError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* SECTION 1: TEACHER DIRECTORY & ACCOUNT MANAGEMENT                */}
      {/* ================================================================ */}
      <Card variant="glass" className="p-5 sm:p-6 border-[#49352F]/15 space-y-5 text-[#49352F]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#49352F]/10">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#B26A1B]" />
              <h3 className="font-heading text-base sm:text-lg font-bold text-[#49352F]">
                {at.directoryTitle}
              </h3>
              <Badge variant="saffron" size="sm">
                {teachers.length} {at.teachersCountSuffix}
              </Badge>
            </div>
            <p className="text-xs text-[#7A6862] mt-0.5">
              {at.directoryDesc}
            </p>
          </div>

          <Button
            type="button"
            variant="saffron"
            size="sm"
            onClick={handleOpenAddTeacher}
            className="rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{at.addTeacherBtn}</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#26201C] px-3 py-2 rounded-xl border border-[#49352F]/15">
          <Search className="w-4 h-4 text-[#7A6862] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={at.searchPlaceholder}
            className="w-full bg-transparent text-xs text-[#49352F] dark:text-[#F4F1E1] focus:outline-hidden"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="text-[#7A6862] hover:text-[#49352F]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Teachers Table */}
        <div className="overflow-x-auto rounded-xl border border-[#49352F]/10 bg-white/70 dark:bg-[#26201C]/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#49352F]/10 bg-[#FAF6E9]/60 dark:bg-[#1E1916]/60 text-[#7A6862] font-semibold">
                <th className="py-2.5 px-3.5">{at.thTeacherInfo}</th>
                <th className="py-2.5 px-3">{at.thType}</th>
                <th className="py-2.5 px-3">{at.thAssignedSubjects}</th>
                <th className="py-2.5 px-3">{at.thStatus}</th>
                <th className="py-2.5 px-3 text-right">{at.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#49352F]/8">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#7A6862]">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-[#B26A1B] border-t-transparent mr-2" />
                    {at.loadingDirectory}
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#7A6862]">
                    {searchQuery ? at.noSearchMatch : at.noTeachersRegistered}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isActive = t.status === "active";
                  return (
                    <tr key={t.id} className="hover:bg-[#FAF6E9]/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#F2CAB3] dark:bg-[#F2CAB3]/30 border border-[#49352F]/15 text-[#49352F] flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(t.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#49352F] block truncate">{t.name}</span>
                            <span className="text-[10px] text-[#7A6862] font-mono block truncate">{t.email}</span>
                            <span className="text-[9px] text-[#7A6862]/70 font-mono block">{at.idPrefix} {t.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            t.teacherType === "class"
                              ? "bg-amber-500/15 text-amber-800 border-amber-500/30"
                              : "bg-blue-500/15 text-blue-800 border-blue-500/30"
                          }`}
                        >
                          {t.teacherType === "class" ? at.classTeacherType : at.subjectTeacherType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {t.assignments.length === 0 ? (
                          <span className="text-[11px] text-[#7A6862] italic">
                            {at.noAssignmentsYet}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {t.assignments.map((a) => (
                              <span
                                key={a.id}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FAF6E9] border border-[#49352F]/15 text-[#49352F]"
                              >
                                {formatSubject(a.subjectCode)} ({a.grades?.map((g) => formatClass(g)).join(", ")})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/30"
                              : "bg-slate-500/15 text-slate-700 border-slate-500/30"
                          }`}
                        >
                          {isActive ? at.activeStatus : at.deactivatedStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectTeacherForAssignment(t.id)}
                            title={at.assignSubjectsTitle}
                            className="p-1.5 text-xs text-[#B26A1B] hover:bg-[#B26A1B]/10 rounded-lg border border-[#B26A1B]/30 font-semibold transition-all cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            title={isActive ? at.deactivateTitle : at.activateTitle}
                            className={`p-1.5 text-xs rounded-lg border font-semibold transition-all cursor-pointer ${
                              isActive
                                ? "text-slate-700 hover:bg-slate-100 border-slate-300"
                                : "text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditTeacher(t)}
                            title={at.editTeacherTitle}
                            className="p-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 font-semibold transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeacher(t)}
                            title={at.deleteTeacherTitle}
                            className="p-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 font-semibold transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================================================================ */}
      {/* SECTION 2: SUBJECT & CLASS ASSIGNMENT MANAGEMENT                 */}
      {/* ================================================================ */}
      <Card id="assignment-form" variant="glass" className="p-5 sm:p-6 border-[#49352F]/15 space-y-5 text-[#49352F]">
        <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-[#49352F]">
                {at.assignmentSectionTitle}
              </h3>
              <Badge variant="saffron" size="sm">
                {at.adminControlBadge}
              </Badge>
            </div>
            <p className="text-xs text-[#7A6862] mt-0.5">
              {at.assignmentSectionDesc}
            </p>
          </div>
        </div>

        {/* Assignment Creation Form */}
        <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#B26A1B]">
            {at.assignSubheading}
          </h4>

          {assignError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
              {assignError}
            </div>
          )}
          {assignSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold">
              {assignSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#7A6862] mb-1">
                {at.selectTeacherLabel}
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F] cursor-pointer"
              >
                {teachers.length === 0 ? (
                  <option value="">{at.noTeachersOption}</option>
                ) : (
                  teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7A6862] mb-1">
                {at.subjectLabel}
              </label>
              <select
                value={assignSubject}
                onChange={(e) => setAssignSubject(e.target.value as SubjectCode)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F] cursor-pointer"
              >
                {SUBJECT_CODES.map((code) => (
                  <option key={code} value={code}>
                    {formatSubject(code)} ({code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7A6862] mb-1">
                {at.assignedClassesRangeLabel}
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((g) => {
                  const isChecked = assignGrades.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleToggleAssignGrade(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-[#B26A1B] text-white border-[#B26A1B]"
                          : "bg-white text-[#7A6862] border-[#49352F]/15 hover:border-[#B26A1B]"
                      }`}
                    >
                      {formatClass(g)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={assignSaving || teachers.length === 0}
              onClick={handleSaveAssignment}
              className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
            >
              {assignSaving ? at.savingBtn : at.saveAssignmentBtn}
            </Button>
          </div>
        </div>

        {/* Current Assignments Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#7A6862]">
            {at.currentAssignmentsHeading}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#49352F]/10 text-[#7A6862] font-semibold">
                  <th className="py-2 px-3">{at.thTeacher}</th>
                  <th className="py-2 px-3">{at.thSubject}</th>
                  <th className="py-2 px-3">{at.thAssignedClasses}</th>
                  <th className="py-2 px-3 text-right">{at.thAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/8">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[#7A6862]">
                      {at.noAssignmentsFound}
                    </td>
                  </tr>
                ) : (
                  assignments.map((asg) => {
                    const teacherObj = teachers.find((t) => t.id === asg.teacherId);
                    return (
                      <tr key={asg.id} className="hover:bg-[#FAF6E9]/40">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-[#49352F] block">
                            {teacherObj?.name || asg.teacherName || asg.teacherId}
                          </span>
                          <span className="block text-[10px] text-[#7A6862] font-mono">
                            {teacherObj?.email || asg.teacherEmail}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#B26A1B]">
                          {formatSubject(asg.subjectCode)}
                        </td>
                        <td className="py-2.5 px-3 text-[#49352F]">
                          {asg.grades && asg.grades.length > 0
                            ? asg.grades.slice().sort((a, b) => a - b).map((g) => formatClass(g)).join(", ")
                            : asg.classes && asg.classes.length > 0
                            ? asg.classes.join(", ")
                            : at.noneLabel}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditAssignment(asg)}
                              className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 font-bold transition-all cursor-pointer"
                            >
                              {at.editBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(asg.id)}
                              className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 font-bold transition-all cursor-pointer"
                            >
                              {at.deleteBtn}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* ================================================================ */}
      {/* SECTION 3: ADD / EDIT TEACHER MODAL                              */}
      {/* ================================================================ */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#26201C] p-6 shadow-2xl border border-[#49352F]/15 space-y-4 my-8 animate-in fade-in-50 zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#B26A1B]" />
                <h3 className="font-heading text-base font-bold text-[#49352F] dark:text-[#F4F1E1]">
                  {editingTeacher ? at.editModalTitle : at.registerModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherModal(false)}
                className="text-[#7A6862] hover:text-[#49352F] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {at.fullNameLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={at.namePlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/40 text-xs text-[#49352F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#B26A1B]"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {at.emailLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder={at.emailPlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/40 text-xs text-[#49352F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#B26A1B]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {editingTeacher ? at.newPasswordLabel : at.passwordLabel}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingTeacher ? "••••••••" : at.defaultPasswordPlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/40 text-xs text-[#49352F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#B26A1B]"
                />
              </div>

              {/* Teacher Type & Status Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {at.teacherTypeLabel}
                  </label>
                  <select
                    value={formTeacherType}
                    onChange={(e) => setFormTeacherType(e.target.value as "subject" | "class")}
                    className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F]"
                  >
                    <option value="subject">{at.subjectTeacherType}</option>
                    <option value="class">{at.classTeacherType}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {at.accountStatusLabel}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "active" | "disabled")}
                    className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F]"
                  >
                    <option value="active">{at.activeStatus}</option>
                    <option value="disabled">{at.deactivatedStatus}</option>
                  </select>
                </div>
              </div>

              {/* Initial Assigned Subjects */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {at.assignedSubjectsModalLabel}
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUBJECT_CODES.map((code) => {
                    const isSelected = formSubjects.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleToggleModalSubject(code)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#B26A1B] text-white border-[#B26A1B]"
                            : "bg-white text-[#49352F] border-[#49352F]/15 hover:border-[#B26A1B]"
                        }`}
                      >
                        {formatSubject(code)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Assigned Classes */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {at.assignedClassesModalLabel}
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((g) => {
                    const isChecked = formGrades.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleToggleModalGrade(g)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-[#B26A1B] text-white border-[#B26A1B]"
                            : "bg-white text-[#7A6862] border-[#49352F]/15 hover:border-[#B26A1B]"
                        }`}
                      >
                        {formatClass(g)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#49352F]/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTeacherModal(false)}
                  className="rounded-xl"
                >
                  {at.cancelBtn}
                </Button>
                <Button
                  type="submit"
                  variant="saffron"
                  size="sm"
                  disabled={formSaving}
                  className="rounded-xl font-bold shadow-sm"
                >
                  {formSaving ? at.savingBtn : editingTeacher ? at.updateTeacherBtn : at.saveTeacherBtn}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SECTION 4: DELETE CONFIRMATION DIALOG                            */}
      {/* ================================================================ */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#26201C] p-6 shadow-2xl border border-rose-300 space-y-4 animate-in fade-in-50 zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="font-heading text-base font-bold text-[#49352F] dark:text-[#F4F1E1]">
                {at.deleteModalTitle}
              </h3>
            </div>

            <p className="text-xs text-[#7A6862] leading-relaxed">
              {at.deleteModalBodyBefore} <strong>{deletingTeacher.name}</strong> ({deletingTeacher.email})?{" "}
              {at.deleteModalBodyAfter}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#49352F]/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingTeacher(null)}
                className="rounded-xl"
              >
                {at.cancelBtn}
              </Button>
              <button
                type="button"
                disabled={isDeletingTeacher}
                onClick={handleConfirmDeleteTeacher}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                {isDeletingTeacher ? at.deletingBtn : at.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Assignment Modal */}
      {assignmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-[#49352F]/15 space-y-3 text-[#49352F]">
            <h3 className="font-heading text-sm font-bold text-[#49352F]">
              {(at as any)?.confirmRemoveAssignmentTitle || "Remove Assignment?"}
            </h3>
            <p className="text-xs text-[#7A6862] leading-relaxed">
              {at.confirmRemoveAssignment}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignmentToDelete(null)}
                className="rounded-xl text-xs"
              >
                {t.actions?.cancel || "Cancel"}
              </Button>
              <button
                type="button"
                onClick={confirmDeleteAssignment}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                {t.actions?.confirm || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

