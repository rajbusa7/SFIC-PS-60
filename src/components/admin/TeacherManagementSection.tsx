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

const AVAILABLE_SUBJECTS: { code: SubjectCode; nameEn: string; nameGu: string; color: string }[] = [
  { code: "MATH", nameEn: "Mathematics", nameGu: "ગણિત", color: "text-amber-800 bg-amber-500/15 border-amber-500/30" },
  { code: "ENG", nameEn: "English", nameGu: "અંગ્રેજી", color: "text-blue-800 bg-blue-500/15 border-blue-500/30" },
  { code: "GUJ", nameEn: "Gujarati", nameGu: "ગુજરાતી", color: "text-emerald-800 bg-emerald-500/15 border-emerald-500/30" },
  { code: "EVS", nameEn: "Environmental Studies", nameGu: "પર્યાવરણ", color: "text-teal-800 bg-teal-500/15 border-teal-500/30" },
  { code: "SCI", nameEn: "Science", nameGu: "વિજ્ઞાન", color: "text-purple-800 bg-purple-500/15 border-purple-500/30" },
  { code: "SST", nameEn: "Social Science", nameGu: "સામાજિક વિજ્ઞાન", color: "text-orange-800 bg-orange-500/15 border-orange-500/30" },
  { code: "HIN", nameEn: "Hindi", nameGu: "હિન્દી", color: "text-rose-800 bg-rose-500/15 border-rose-500/30" },
];

export function TeacherManagementSection() {
  const { language } = useLanguage();
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
        if (tData.teachers.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(tData.teachers[0].id);
        }
      }
      if (aData.success && Array.isArray(aData.assignments)) {
        setAssignments(aData.assignments);
      }
    } catch (e: any) {
      console.error("Failed to load teacher management data", e);
      setGlobalError("Failed to synchronize teacher records with database.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeacherId]);

  useEffect(() => {
    loadData();
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
      setFormError(language === "gu" ? "કૃપા કરીને પૂરું નામ દાખલ કરો." : "Please enter the teacher's full name.");
      return;
    }
    if (!formEmail.trim() || !formEmail.includes("@")) {
      setFormError(language === "gu" ? "કૃપા કરીને માન્ય ઇમેઇલ દાખલ કરો." : "Please enter a valid email address.");
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
          throw new Error(data.error || "Failed to update teacher account.");
        }
        setGlobalSuccess(
          language === "gu"
            ? `શિક્ષક '${formName}' ની વિગતો સફળતાપૂર્વક અપડેટ થઈ.`
            : `Teacher '${formName}' updated successfully.`
        );
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
          throw new Error(data.error || "Failed to create teacher account.");
        }
        setGlobalSuccess(
          language === "gu"
            ? `નવા શિક્ષક '${formName}' સફળતાપૂર્વક ઉમેરાયા અને ડ્રોપડાઉનમાં ઉપલબ્ધ છે.`
            : `Teacher '${formName}' registered successfully and available in assignments.`
        );
        if (data.teacher?.id) {
          setSelectedTeacherId(data.teacher.id);
        }
      }

      setShowTeacherModal(false);
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save teacher.");
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
        throw new Error(data.error || "Failed to change account status.");
      }
      setGlobalSuccess(
        newStatus === "active"
          ? (language === "gu" ? `શિક્ષક '${t.name}' નું ખાતું સક્રિય કરાયું.` : `Teacher account '${t.name}' activated.`)
          : (language === "gu" ? `શિક્ષક '${t.name}' નું ખાતું નિષ્ક્રિય કરાયું.` : `Teacher account '${t.name}' deactivated.`)
      );
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 3500);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to toggle status.");
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
        throw new Error(data.error || "Failed to delete teacher.");
      }
      setGlobalSuccess(
        language === "gu"
          ? `શિક્ષક '${deletingTeacher.name}' અને સોંપણીઓ સફળતાપૂર્વક કાઢી નાખવામાં આવ્યા.`
          : `Teacher '${deletingTeacher.name}' and all assignments safely deleted.`
      );
      setDeletingTeacher(null);
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to delete teacher.");
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
      setAssignError(language === "gu" ? "કૃપા કરીને શિક્ષક પસંદ કરો." : "Please select a teacher.");
      return;
    }
    if (assignGrades.length === 0) {
      setAssignError(language === "gu" ? "ઓછામાં ઓછો એક વર્ગ પસંદ કરો." : "Please select at least one class.");
      return;
    }

    setAssignSaving(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      const classroomIds = assignGrades.map((g) => `cls-${g}a`);
      const res = await fetch("/api/admin/teachers/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          subjectCode: assignSubject,
          classroomIds,
          grades: assignGrades,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save teacher assignment.");
      }

      setAssignSuccess(
        language === "gu"
          ? "શિક્ષક વિષય અને વર્ગ સોંપણી ડેટાબેઝમાં સાચવવામાં આવી."
          : "Teacher subject and class assignment saved successfully."
      );
      await loadData();
      setTimeout(() => setAssignSuccess(null), 3500);
    } catch (err: any) {
      setAssignError(err.message || "Failed to save assignment.");
    } finally {
      setAssignSaving(false);
    }
  };

  // Delete Individual Assignment
  const handleDeleteAssignment = async (asgId: string) => {
    if (typeof window !== "undefined" && !window.confirm(language === "gu" ? "શું તમે આ વિષય સોંપણી રદ કરવા માંગો છો? શિક્ષક ખાતું સુરક્ષિત રહેશે." : "Are you sure you want to remove this subject assignment? The teacher account will remain intact.")) return;
    try {
      const res = await fetch(`/api/admin/teachers/assignments/${asgId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove assignment.");
      }
      setGlobalSuccess(
        language === "gu" ? "વિષય સોંપણી રદ કરવામાં આવી." : "Subject assignment removed successfully."
      );
      await loadData();
      setTimeout(() => setGlobalSuccess(null), 3000);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to remove assignment.");
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
                {language === "gu" ? "શિક્ષક સંચાલન અને ખાતા યાદી" : "Teacher Management & Directory"}
              </h3>
              <Badge variant="saffron" size="sm">
                {teachers.length} {language === "gu" ? "શિક્ષકો" : "Teachers"}
              </Badge>
            </div>
            <p className="text-xs text-[#7A6862] mt-0.5">
              {language === "gu"
                ? "શિક્ષકોના ખાતાઓ ઉમેરો, સંપાદિત કરો, સક્રિય/નિષ્ક્રિય કરો અથવા સુરક્ષિત રીતે કાઢી નાખો."
                : "Register, modify, activate/deactivate, or safely manage school teacher accounts."}
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
            <span>{language === "gu" ? "નવા શિક્ષક ઉમેરો" : "Add Teacher"}</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#26201C] px-3 py-2 rounded-xl border border-[#49352F]/15">
          <Search className="w-4 h-4 text-[#7A6862] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "gu"
                ? "નામ, ઇમેઇલ કે વિષય દ્વારા શિક્ષક શોધો..."
                : "Search teachers by name, email, or subject..."
            }
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
                <th className="py-2.5 px-3.5">{language === "gu" ? "શિક્ષક" : "Teacher Name & Info"}</th>
                <th className="py-2.5 px-3">{language === "gu" ? "પ્રકાર" : "Type"}</th>
                <th className="py-2.5 px-3">{language === "gu" ? "સોંપેલ વિષયો અને વર્ગો" : "Assigned Subjects & Classes"}</th>
                <th className="py-2.5 px-3">{language === "gu" ? "સ્થિતિ" : "Status"}</th>
                <th className="py-2.5 px-3 text-right">{language === "gu" ? "ક્રિયાઓ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#49352F]/8">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#7A6862]">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-[#B26A1B] border-t-transparent mr-2" />
                    Loading teacher directory...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#7A6862]">
                    {searchQuery
                      ? "No teachers found matching your search query."
                      : "No teachers registered yet. Click 'Add Teacher' to create one."}
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
                            <span className="text-[9px] text-[#7A6862]/70 font-mono block">ID: {t.id}</span>
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
                          {t.teacherType === "class" ? "Class Teacher" : "Subject Teacher"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {t.assignments.length === 0 ? (
                          <span className="text-[11px] text-[#7A6862] italic">
                            {language === "gu" ? "કોઈ વિષય સોંપાયેલ નથી" : "No assignments yet"}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {t.assignments.map((a) => (
                              <span
                                key={a.id}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FAF6E9] border border-[#49352F]/15 text-[#49352F]"
                              >
                                {a.subjectCode} ({a.grades?.map((g) => `C${g}`).join(",")})
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
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectTeacherForAssignment(t.id)}
                            title={language === "gu" ? "વિષય સોંપો" : "Assign Subjects & Classes"}
                            className="p-1.5 text-xs text-[#B26A1B] hover:bg-[#B26A1B]/10 rounded-lg border border-[#B26A1B]/30 font-semibold transition-all cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            title={isActive ? "Deactivate account" : "Activate account"}
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
                            title={language === "gu" ? "સંપાદિત કરો" : "Edit Teacher"}
                            className="p-1.5 text-xs text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 font-semibold transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeacher(t)}
                            title={language === "gu" ? "કાઢી નાખો" : "Delete Teacher"}
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
                {language === "gu"
                  ? "શિક્ષક વિષય અને વર્ગ સોંપણી સંચાલન (Admin RBAC)"
                  : "Teacher Subject & Class Assignment Management (Admin RBAC)"}
              </h3>
              <Badge variant="saffron" size="sm">
                {language === "gu" ? "સંચાલક નિયંત્રણ" : "Administrator Control"}
              </Badge>
            </div>
            <p className="text-xs text-[#7A6862] mt-0.5">
              {language === "gu"
                ? "શિક્ષકો માટે વિષયો અને વર્ગો સોંપો, સંપાદિત કરો અથવા રદ કરો. તમામ ફેરફારો ડેટાબેઝમાં સાચવવામાં આવે છે."
                : "Assign, update, or remove subjects and classes for teachers. All assignments are enforced server-side."}
            </p>
          </div>
        </div>

        {/* Assignment Creation Form */}
        <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/12 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#B26A1B]">
            {language === "gu" ? "નવી વિષય-વર્ગ સોંપણી ઉમેરો" : "ASSIGN SUBJECT & CLASSES TO TEACHER"}
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
                {language === "gu" ? "શિક્ષક પસંદ કરો:" : "Select Teacher:"}
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F] cursor-pointer"
              >
                {teachers.length === 0 ? (
                  <option value="">No teachers available - Add one first</option>
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
                {language === "gu" ? "વિષય:" : "Subject:"}
              </label>
              <select
                value={assignSubject}
                onChange={(e) => setAssignSubject(e.target.value as SubjectCode)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F] cursor-pointer"
              >
                <option value="MATH">Mathematics (ગણિત)</option>
                <option value="ENG">English (અંગ્રેજી)</option>
                <option value="GUJ">Gujarati (ગુજરાતી)</option>
                <option value="EVS">Environmental Studies (પર્યાવરણ)</option>
                <option value="SCI">Science (વિજ્ઞાન)</option>
                <option value="SST">Social Science (સામાજિક વિજ્ઞાન)</option>
                <option value="HIN">Hindi (હિન્દી)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7A6862] mb-1">
                {language === "gu" ? "સોંપેલ વર્ગો પસંદ કરો:" : "Assigned Classes (1-5):"}
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
                      C{g}
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
              {assignSaving
                ? "Saving..."
                : language === "gu"
                ? "સોંપણી સાચવો"
                : "Save Assignment"}
            </Button>
          </div>
        </div>

        {/* Current Assignments Table */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#7A6862]">
            {language === "gu" ? "હાલની સક્રિય સોંપણીઓ" : "CURRENT TEACHER ASSIGNMENTS"}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#49352F]/10 text-[#7A6862] font-semibold">
                  <th className="py-2 px-3">{language === "gu" ? "શિક્ષક" : "Teacher"}</th>
                  <th className="py-2 px-3">{language === "gu" ? "સોંપેલ વિષય" : "Subject"}</th>
                  <th className="py-2 px-3">{language === "gu" ? "સોંપેલ વર્ગો" : "Assigned Classes"}</th>
                  <th className="py-2 px-3 text-right">{language === "gu" ? "ક્રિયા" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/8">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[#7A6862]">
                      No assignments found.
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
                          {asg.subjectCode}
                        </td>
                        <td className="py-2.5 px-3 text-[#49352F]">
                          {asg.grades && asg.grades.length > 0
                            ? asg.grades.slice().sort((a, b) => a - b).map((g) => `Class ${g}`).join(", ")
                            : asg.classes && asg.classes.length > 0
                            ? asg.classes.join(", ")
                            : "None"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditAssignment(asg)}
                              className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 font-bold transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(asg.id)}
                              className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 font-bold transition-all cursor-pointer"
                            >
                              {language === "gu" ? "રદ કરો" : "Delete"}
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
                  {editingTeacher
                    ? language === "gu"
                      ? "શિક્ષકની વિગતો સુધારો"
                      : "Edit Teacher Account"
                    : language === "gu"
                    ? "નવા શિક્ષક ઉમેરો"
                    : "Register New Teacher"}
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
                  {language === "gu" ? "શિક્ષકનું પૂરું નામ:" : "Full Name:"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Raj Busa"
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/40 text-xs text-[#49352F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#B26A1B]"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "ઇમેઇલ સરનામું:" : "Email Address:"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. raj.busa@shikshasetu.edu.in"
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/40 text-xs text-[#49352F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#B26A1B]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {editingTeacher
                    ? (language === "gu" ? "નવો પાસવર્ડ (વૈકલ્પિક):" : "New Password (Leave blank to keep current):")
                    : (language === "gu" ? "પાસવર્ડ:" : "Password:")}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingTeacher ? "••••••••" : "Default: Teacher@123"}
                  className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-[#FAF6E9]/40 text-xs text-[#49352F] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#B26A1B]"
                />
              </div>

              {/* Teacher Type & Status Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {language === "gu" ? "શિક્ષકનો પ્રકાર:" : "Teacher Type:"}
                  </label>
                  <select
                    value={formTeacherType}
                    onChange={(e) => setFormTeacherType(e.target.value as "subject" | "class")}
                    className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F]"
                  >
                    <option value="subject">Subject Teacher (વિષય શિક્ષક)</option>
                    <option value="class">Class Teacher (વર્ગ શિક્ષક)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {language === "gu" ? "ખાતાની સ્થિતિ:" : "Account Status:"}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "active" | "disabled")}
                    className="w-full px-3 py-2 rounded-xl border border-[#49352F]/20 bg-white text-xs font-semibold text-[#49352F]"
                  >
                    <option value="active">Active (સક્રિય)</option>
                    <option value="disabled">Deactivated (નિષ્ક્રિય)</option>
                  </select>
                </div>
              </div>

              {/* Initial Assigned Subjects */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "સોંપવા માટેના વિષયો:" : "Assigned Subjects:"}
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {AVAILABLE_SUBJECTS.map((sub) => {
                    const isSelected = formSubjects.includes(sub.code);
                    return (
                      <button
                        key={sub.code}
                        type="button"
                        onClick={() => handleToggleModalSubject(sub.code)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#B26A1B] text-white border-[#B26A1B]"
                            : "bg-white text-[#49352F] border-[#49352F]/15 hover:border-[#B26A1B]"
                        }`}
                      >
                        {sub.nameEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Assigned Classes */}
              <div>
                <label className="block text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  {language === "gu" ? "સોંપવા માટેના વર્ગો (ધોરણ ૧ થી ૫):" : "Assigned Classes (Classes 1-5):"}
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
                        Class {g}
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
                  {language === "gu" ? "રદ કરો" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  variant="saffron"
                  size="sm"
                  disabled={formSaving}
                  className="rounded-xl font-bold shadow-sm"
                >
                  {formSaving
                    ? "Saving..."
                    : editingTeacher
                    ? (language === "gu" ? "અપડેટ કરો" : "Update Teacher")
                    : (language === "gu" ? "શિક્ષક સાચવો" : "Save Teacher")}
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
                {language === "gu" ? "શિક્ષકનું ખાતું કાઢી નાખો?" : "Delete Teacher Account?"}
              </h3>
            </div>

            <p className="text-xs text-[#7A6862] leading-relaxed">
              {language === "gu" ? (
                <>
                  શું તમે ખરેખર શિક્ષક <strong>{deletingTeacher.name}</strong> ({deletingTeacher.email}) નું ખાતું કાઢી નાખવા માંગો છો?
                  આ ક્રિયાથી તેમના બધા વિષય અને વર્ગ સોંપણીઓ સુરક્ષિત રીતે દૂર થઈ જશે. ઐતિહાસિક વિદ્યાર્થી ગુણ અકબંધ રહેશે.
                </>
              ) : (
                <>
                  Are you sure you want to delete teacher <strong>{deletingTeacher.name}</strong> ({deletingTeacher.email})?
                  This action will safely remove all their subject and class assignments. Existing student evaluation records and historical grades will remain preserved.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#49352F]/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingTeacher(null)}
                className="rounded-xl"
              >
                {language === "gu" ? "ના, રાખો" : "Cancel"}
              </Button>
              <button
                type="button"
                disabled={isDeletingTeacher}
                onClick={handleConfirmDeleteTeacher}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                {isDeletingTeacher
                  ? "Deleting..."
                  : language === "gu"
                  ? "હા, કાઢી નાખો"
                  : "Delete Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

