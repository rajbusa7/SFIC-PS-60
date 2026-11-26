"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTutorial } from "@/context/TutorialContext";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useLanguage } from "@/context/LanguageContext";
import { useFilter } from "@/context/FilterContext";
import { StudentFormModal } from "@/components/student/StudentFormModal";
import { StudentCsvModal } from "@/components/student/StudentCsvModal";
import { ParentLinkCodeModal } from "@/components/student/ParentLinkCodeModal";
import { broadcastDataUpdate, subscribeToDataUpdates } from "@/lib/events";
import { fetchWithCache, getCachedDataSync } from "@/lib/cache/localCache";
import {
  Users,
  Search,
  PlusCircle,
  Upload,
  Download,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  X,
  Trash2,
  Edit,
  AlertCircle,
  Clock,
  Building,
  KeyRound,
} from "lucide-react";

function StudentsPageContent() {
  const { t, tr, formatClass } = useLanguage();
  const st = t.students;
  const { searchTerm, setSearchTerm, selectedClass, setSelectedClass, gradeNumber } = useFilter();

  const [students, setStudents] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [linkingTarget, setLinkingTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { startTutorial } = useTutorial();
  const tourParam = searchParams.get("tour");
  const hasTriggeredAaravTour = useRef(false);

  useEffect(() => {
    const isAaravTourIntent = tourParam === "aarav" || tourParam === "AARAV_CASE_TOUR";
    if (!isAaravTourIntent) {
      hasTriggeredAaravTour.current = false;
      return;
    }

    // Wait until students UI is ready and loaded from DB
    if (loading || students.length === 0) {
      return;
    }

    if (hasTriggeredAaravTour.current) {
      return;
    }

    hasTriggeredAaravTour.current = true;

    // Reset filters so Aarav is guaranteed to be in view
    if (activeGrade !== "all") {
      setSelectedClass("all");
    }
    if (searchTerm) {
      setSearchTerm("");
    }

    // Start Aarav's Case tutorial from Step 1
    startTutorial("AARAV_CASE_TOUR");

    // Consume and clear navigation intent from URL
    router.replace("/students", { scroll: false });
  }, [tourParam, loading, students.length, gradeNumber, searchTerm, setSelectedClass, setSearchTerm, startTutorial, router]);


  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchStudents = async () => {
    if (students.length === 0) {
      setLoading(true);
    }
    try {
      const [stdData, gapsData, resultsData] = await Promise.all([
        fetchWithCache<any>("/api/students", { ttlMs: 25000 }).then((r) => r.data),
        fetchWithCache<any>("/api/learning-gaps", { ttlMs: 25000 }).then((r) => r.data),
        fetchWithCache<any>("/api/assessments/results", { ttlMs: 25000 }).then((r) => r.data),
      ]);
      if (stdData?.success) setStudents(stdData.students || []);
      if (gapsData?.success) setGaps(gapsData.gaps || []);
      if (resultsData?.success) setResults(resultsData.results || []);
    } catch (e) {
      console.error("Failed to load students", e);
      showToast(st.loadFailedToast, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Immediately hydrate from local cache on mount if available
    const cachedStd = getCachedDataSync<any>("/api/students", 30000);
    const cachedGaps = getCachedDataSync<any>("/api/learning-gaps", 30000);
    const cachedResults = getCachedDataSync<any>("/api/assessments/results", 30000);

    if (cachedStd?.students && cachedStd.students.length > 0) {
      setStudents(cachedStd.students);
      if (cachedGaps?.gaps) setGaps(cachedGaps.gaps);
      if (cachedResults?.results) setResults(cachedResults.results);
      setLoading(false);
    }

    fetchStudents();

    const unsubscribe = subscribeToDataUpdates(() => {
      fetchStudents();
    }, ["students", "gaps", "all"]);

    return () => {
      unsubscribe();
    };
  }, []);

  const activeGrade = gradeNumber ? String(gradeNumber) : "all";

  const handleGradeFilterChange = (val: string) => {
    setSelectedClass(val);
  };

  const filteredStudents = students.filter((s) => {
    if (activeGrade !== "all") {
      const gNum = Number(activeGrade);
      if (s.grade !== gNum && s.classroomId !== `cls-${activeGrade}a`) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        s.displayName.toLowerCase().includes(term) ||
        s.studentCode.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getStudentGapCount = (studentId: string) => {
    return gaps.filter(
      (g) =>
        g.studentId === studentId &&
        (g.status === "Active" || g.status === "Under Intervention")
    ).length;
  };

  const handleExportCsv = () => {
    const headers = ["StudentCode", "DisplayName", "Grade", "Section", "Status", "ActiveGaps"];
    const rows = filteredStudents.map((s) => [
      s.studentCode,
      `"${s.displayName}"`,
      s.grade,
      s.section,
      s.enrollmentStatus,
      getStudentGapCount(s.id),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `studysaathi_students_class${activeGrade}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("students", "delete", deleteTarget.id);
        showToast(
          tr("students.removedToast", { name: deleteTarget.name }),
          "success"
        );
        setDeleteTarget(null);
        await fetchStudents();
      } else {
        showToast(data.error || st.removeFailedToast, "error");
      }
    } catch {
      showToast(st.networkDeleteError, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Dynamic Notification Toast Banner */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-sm shadow-sm transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight">
                {t.students.title || "Student Directory & Profiles"}
              </h1>
              <Badge variant="saffron" size="sm">
                {students.length} {t.students.enrolledBadge || "Enrolled"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1">
              {t.students.subtitle ||
                "Manage primary school enrollments, track 3D skill trees, and coordinate 5-step remedial plans."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="rounded-full text-xs bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#7A6862] shrink-0" />
              <span className="whitespace-nowrap">{t.actions.exportCsv}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCsvModal(true)}
              className="rounded-full text-xs bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-[#7A6862] shrink-0" />
              <span className="whitespace-nowrap">{t.actions.importCsv}</span>
            </Button>
            <div data-tour="students-add">
              <Button
                variant="saffron"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="rounded-full text-xs font-bold whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t.actions.addStudent}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Card
          variant="glass"
          className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-[#49352F]/15 bg-white text-[#49352F]"
        >
          <div data-tour="students-search" className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B26A1B] pointer-events-none" />
            <input
              type="text"
              aria-label="Search students by name, roll number, or learning gap"
              placeholder={st.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-[#49352F]/15 bg-[#FAF6E9] py-2.5 pl-12 pr-10 text-sm text-[#49352F] placeholder-[#7A6862] focus:border-[#F2CAB3] focus:bg-white focus:ring-4 focus:ring-[#F2CAB3]/30 outline-hidden transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9] transition-colors cursor-pointer"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div data-tour="students-filter" className="flex items-center gap-3 shrink-0 flex-wrap">
            <span className="text-xs font-bold text-[#49352F]">
              {st.classFilter}
            </span>
            <select
              value={activeGrade}
              aria-label="Filter students by class"
              onChange={(e) => handleGradeFilterChange(e.target.value)}
              className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3.5 py-2 text-xs font-bold text-[#49352F] outline-hidden cursor-pointer"
            >
              <option value="all">{st.allClassesOption}</option>
              <option value="1">{formatClass(1)}</option>
              <option value="2">{formatClass(2)}</option>
              <option value="3">{formatClass(3)}</option>
              <option value="4">{formatClass(4)}</option>
              <option value="5">{formatClass(5)}</option>
            </select>
            <span className="text-xs font-semibold text-[#7A6862] ml-1">
              {tr("students.showingCount", { count: filteredStudents.length })}
            </span>
          </div>
        </Card>

        {/* Loading State */}
        {loading && students.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white/60 dark:bg-stone-900/40 border border-[#49352F]/10 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F2CAB3]/40" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#49352F]/15 rounded-md w-3/4" />
                    <div className="h-3 bg-[#49352F]/10 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-[#49352F]/10 rounded-xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredStudents.length === 0 && (
          <Card
            variant="glass"
            className="py-16 px-6 text-center border-dashed border-2 border-[#49352F]/20 bg-white/70"
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FAF6E9] border border-[#49352F]/15 flex items-center justify-center text-[#B26A1B] mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[#49352F]">
              {st.noStudentsFoundTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#7A6862] max-w-md mx-auto mt-1 mb-5">
              {searchTerm
                ? tr("students.searchNoMatch", { term: searchTerm })
                : st.noEnrolledYet}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="rounded-full text-xs"
                >
                  {st.clearSearchBtn}
                </Button>
              )}
              <Button
                variant="saffron"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="rounded-full text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>{st.addStudentBtn}</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Student Cards Grid */}
        <div
          data-tour="students-table"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredStudents.map((std) => {
            const gapCount = getStudentGapCount(std.id);
            const isDemoCase = std.id === "std-aarav";
            const studentResults = results.filter((r) => r.studentId === std.id);
            const hasAssessments = studentResults.length > 0;

            return (
              <Card
                key={std.id}
                variant="glass"
                data-tour={isDemoCase ? "aarav-card" : undefined}
                className={`p-5 flex flex-col justify-between transition-all border-[#49352F]/12 hover:border-[#49352F]/25 bg-white text-[#49352F] ${
                  isDemoCase
                    ? "ring-1 ring-[#F2CAB3] shadow-[0_8px_24px_rgba(73,53,47,0.08)]"
                    : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 flex items-center justify-center font-heading font-black text-sm shrink-0">
                        {std.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/students/${std.id}`}
                            className="font-bold text-sm text-[#49352F] hover:text-[#B26A1B] transition-colors"
                          >
                            {std.displayName}
                          </Link>
                          {isDemoCase && (
                            <Badge variant="saffron" size="sm">
                              {st.demoCaseBadge}
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-[#7A6862]">
                          {std.studentCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" size="sm">
                        {formatClass(std.grade, std.section)}
                      </Badge>
                      <span className="text-[10px] text-[#7A6862] font-medium hidden sm:inline">
                        Model Primary School
                      </span>
                    </div>
                  </div>

                  {std.notes && (
                    <p className="text-xs text-[#7A6862] line-clamp-2 italic bg-[#FAF6E9] p-2.5 rounded-xl border border-[#49352F]/10">
                      &quot;{std.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {!hasAssessments ? (
                      <Badge variant="outline" size="sm" className="bg-[#FAF6E9] border-[#49352F]/15 text-[#7A6862] whitespace-nowrap">
                        <Clock className="w-3 h-3 text-[#B26A1B] shrink-0" aria-hidden="true" />
                        <span className="whitespace-nowrap">{st.assessmentPending}</span>
                      </Badge>
                    ) : gapCount > 0 ? (
                      <Badge data-tour={isDemoCase ? "aarav-gap-badge" : undefined} variant="needsSupport" size="sm">
                        <AlertTriangle className="w-3 h-3 text-[#C54738] shrink-0" aria-hidden="true" />
                        <span className="whitespace-nowrap">
                          {gapCount === 1
                            ? st.activeGapSingle
                            : tr("students.activeGapsCount", { count: gapCount })}
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant="mastered" size="sm" dot>
                        <span className="whitespace-nowrap">{st.onTrackBadge}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Parent Link Code Button */}
                    <button
                      type="button"
                      onClick={() => setLinkingTarget({ id: std.id, name: std.displayName })}
                      className="p-1.5 rounded-lg text-[#7A6862]/60 hover:text-[#B26A1B] hover:bg-[#F2CAB3]/30 transition-colors cursor-pointer"
                      title={
                        language === "gu"
                          ? `${std.displayName} માટે વાલી કોડ જનરેટ કરો`
                          : `Parent Link Code for ${std.displayName}`
                      }
                      aria-label={`Parent Link Code for ${std.displayName}`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {/* Inline Edit Button */}
                    <button
                      type="button"
                      onClick={() => setEditingStudent(std)}
                      className="p-1.5 rounded-lg text-[#7A6862]/60 hover:text-[#B26A1B] hover:bg-[#F2CAB3]/30 transition-colors cursor-pointer"
                      title={tr("students.editTooltip", { name: std.displayName })}
                      aria-label={`Edit ${std.displayName}`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: std.id, name: std.displayName })}
                      className="p-1.5 rounded-lg text-[#7A6862]/60 hover:text-[#C54738] hover:bg-[#C54738]/10 transition-colors cursor-pointer"
                      title={tr("students.removeStudentTitle", { name: std.displayName })}
                      aria-label={`Remove ${std.displayName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Button
                      href={`/students/${std.id}`}
                      data-tour={isDemoCase ? "aarav-inspect-btn" : undefined}
                      aria-label={`View Profile for ${std.displayName}`}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#B26A1B] hover:text-[#49352F]"
                    >
                      <span>{st.viewProfile}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <StudentFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchStudents();
            showToast(st.registeredToast, "success");
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <StudentFormModal
          isOpen={Boolean(editingStudent)}
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            fetchStudents();
            showToast(st.updatedToast, "success");
          }}
        />
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <StudentCsvModal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          existingCodes={students.map((s) => s.studentCode)}
          onSuccess={() => {
            fetchStudents();
            showToast(st.importedToast, "success");
          }}
        />
      )}

      {/* Deletion Confirmation Dialog */}
      {deleteTarget && (
        <Dialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title={st.deleteConfirmTitle}
          description={tr("students.deleteConfirmDesc", { name: deleteTarget.name })}
          maxWidth="sm"
        >
          <div className="pt-4 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="rounded-full text-xs"
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="coral"
              size="sm"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-full text-xs font-bold"
            >
              {isDeleting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>{st.deletingBtn}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>{st.confirmDeleteBtn}</span>
                </>
              )}
            </Button>
          </div>
        </Dialog>
      )}

      {/* Parent Linking Code Modal */}
      {linkingTarget && (
        <ParentLinkCodeModal
          isOpen={Boolean(linkingTarget)}
          onClose={() => setLinkingTarget(null)}
          studentId={linkingTarget.id}
          studentName={linkingTarget.name}
        />
      )}

      {/* Guided Tour */}
          </AppLayout>
  );
}


export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#7A6862]">Loading Students...</div>}>
      <StudentsPageContent />
    </Suspense>
  );
}
