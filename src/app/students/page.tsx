"use client";

import React, { useState, useEffect } from "react";
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
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { broadcastDataUpdate, subscribeToDataUpdates } from "@/lib/events";
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
} from "lucide-react";

export default function StudentsPage() {
  const { t, language } = useLanguage();
  const { searchTerm, setSearchTerm, selectedClass, setSelectedClass, gradeNumber } = useFilter();

  const [students, setStudents] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [stdRes, gapsRes] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }),
        fetch("/api/learning-gaps", { cache: "no-store" }),
      ]);
      const [stdData, gapsData] = await Promise.all([stdRes.json(), gapsRes.json()]);
      if (stdData.success) setStudents(stdData.students || []);
      if (gapsData.success) setGaps(gapsData.gaps || []);
    } catch (e) {
      console.error("Failed to load students", e);
      showToast(
        language === "gu"
          ? "વિદ્યાર્થીઓ લાવવામાં નિષ્ફળતા"
          : "Failed to load students from database",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    if (val === "all") {
      setSelectedClass("all");
    } else {
      setSelectedClass(`cls-${val}a`);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (activeGrade !== "all" && s.grade !== Number(activeGrade)) return false;
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
    link.setAttribute("download", `shikshasetu_students_class${activeGrade}.csv`);
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
          language === "gu"
            ? `${deleteTarget.name} ને સફળતાપૂર્વક દૂર કરવામાં આવ્યા.`
            : `${deleteTarget.name} was successfully removed from database.`,
          "success"
        );
        setDeleteTarget(null);
        await fetchStudents();
      } else {
        showToast(
          data.error ||
            (language === "gu" ? "વિદ્યાર્થી દૂર કરવામાં નિષ્ફળ" : "Failed to remove student"),
          "error"
        );
      }
    } catch {
      showToast(
        language === "gu" ? "નેટવર્ક ભૂલ: દૂર કરી શકાયું નથી" : "Network error deleting student",
        "error"
      );
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
                {t.students.title || "Student Directory & 3D Profiles"}
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
              className="rounded-full text-xs bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-[#7A6862]" />
              <span>{t.actions.exportCsv}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCsvModal(true)}
              className="rounded-full text-xs bg-white hover:bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-[#7A6862]" />
              <span>{t.actions.importCsv}</span>
            </Button>
            <div data-tour="students-add">
              <Button
                variant="saffron"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="rounded-full text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>{t.actions.addStudent}</span>
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
              placeholder={
                language === "gu"
                  ? "વિદ્યાર્થીનું નામ, રોલ નંબર અથવા વિષય શોધો..."
                  : "Search students by name, roll number, or learning gap..."
              }
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
              {language === "gu" ? "વર્ગ:" : "Class:"}
            </span>
            <select
              value={activeGrade}
              aria-label="Filter students by class"
              onChange={(e) => handleGradeFilterChange(e.target.value)}
              className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3.5 py-2 text-xs font-bold text-[#49352F] outline-hidden cursor-pointer"
            >
              <option value="all">
                {language === "gu" ? "બધા વર્ગો (૧-૫)" : "All Classes (1-5)"}
              </option>
              <option value="3">{language === "gu" ? "ધોરણ ૩" : "Class 3"}</option>
              <option value="4">{language === "gu" ? "ધોરણ ૪" : "Class 4"}</option>
              <option value="5">{language === "gu" ? "ધોરણ ૫" : "Class 5"}</option>
            </select>
            <span className="text-xs font-semibold text-[#7A6862] ml-1">
              {language === "gu"
                ? `${filteredStudents.length} વિદ્યાર્થીઓ દર્શાવે છે`
                : `Showing ${filteredStudents.length} students`}
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
              {language === "gu" ? "કોઈ વિદ્યાર્થી મળ્યા નથી" : "No Students Found"}
            </h3>
            <p className="text-xs sm:text-sm text-[#7A6862] max-w-md mx-auto mt-1 mb-5">
              {searchTerm
                ? language === "gu"
                  ? `"${searchTerm}" માટે કોઈ મેળ ખાતો વિદ્યાર્થી નથી. તમારી શોધ સાફ કરવાનો પ્રયાસ કરો.`
                  : `No students match the search term "${searchTerm}". Try adjusting your filters.`
                : language === "gu"
                ? "આ વર્ગ માટે હજી સુધી કોઈ વિદ્યાર્થી નોંધાયા નથી. પ્રથમ વિદ્યાર્થી ઉમેરો."
                : "No students are enrolled for this selection. Register your first student to begin."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="rounded-full text-xs"
                >
                  {language === "gu" ? "શોધ સાફ કરો" : "Clear Search"}
                </Button>
              )}
              <Button
                variant="saffron"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="rounded-full text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>{language === "gu" ? "વિદ્યાર્થી ઉમેરો" : "Add Student"}</span>
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

            return (
              <Card
                key={std.id}
                variant="glass"
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
                              {language === "gu" ? "ડેમો કેસ" : "Demo Case"}
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-[#7A6862]">
                          {std.studentCode}
                        </span>
                      </div>
                    </div>

                    <Badge variant="outline" size="sm">
                      {language === "gu"
                        ? `ધોરણ ${std.grade}-${std.section}`
                        : `Class ${std.grade}-${std.section}`}
                    </Badge>
                  </div>

                  {std.notes && (
                    <p className="text-xs text-[#7A6862] line-clamp-2 italic bg-[#FAF6E9] p-2.5 rounded-xl border border-[#49352F]/10">
                      &quot;{std.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {gapCount > 0 ? (
                      <Badge variant="needsSupport" size="sm" dot>
                        <AlertTriangle className="w-3 h-3 mr-1 text-[#C54738]" aria-hidden="true" />
                        <span>
                          {language === "gu"
                            ? `${gapCount} સક્રિય ખામીઓ`
                            : `${gapCount} Active Gap${gapCount > 1 ? "s" : ""}`}
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant="mastered" size="sm" dot>
                        <span>{language === "gu" ? "પ્રગતિશીલ" : "On Track"}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Inline Edit Button */}
                    <button
                      type="button"
                      onClick={() => setEditingStudent(std)}
                      className="p-1.5 rounded-lg text-[#7A6862]/60 hover:text-[#B26A1B] hover:bg-[#F2CAB3]/30 transition-colors cursor-pointer"
                      title={
                        language === "gu"
                          ? `${std.displayName} ની વિગતો સંપાદિત કરો`
                          : `Edit ${std.displayName}`
                      }
                      aria-label={`Edit ${std.displayName}`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: std.id, name: std.displayName })}
                      className="p-1.5 rounded-lg text-[#7A6862]/60 hover:text-[#C54738] hover:bg-[#C54738]/10 transition-colors cursor-pointer"
                      title={
                        language === "gu" ? `${std.displayName} ને દૂર કરો` : `Remove ${std.displayName}`
                      }
                      aria-label={`Remove ${std.displayName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Link href={`/students/${std.id}`} aria-label={`View 3D Profile for ${std.displayName}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#B26A1B] hover:text-[#49352F]"
                      >
                        <span>{t.students.viewProfile || "3D Profile →"}</span>
                      </Button>
                    </Link>
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
            showToast(
              language === "gu"
                ? "નવો વિદ્યાર્થી સફળતાપૂર્વક સાચવવામાં આવ્યો."
                : "New student saved successfully to database.",
              "success"
            );
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
            showToast(
              language === "gu"
                ? "વિદ્યાર્થીની માહિતી સફળતાપૂર્વક અપડેટ કરવામાં આવી."
                : "Student details successfully updated.",
              "success"
            );
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
            showToast(
              language === "gu"
                ? "વિદ્યાર્થીઓની બેચ સફળતાપૂર્વક આયાત કરવામાં આવી."
                : "Student roster imported successfully.",
              "success"
            );
          }}
        />
      )}

      {/* Deletion Confirmation Dialog */}
      {deleteTarget && (
        <Dialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title={
            language === "gu" ? "વિદ્યાર્થી કાઢી નાખવાની પુષ્ટિ કરો" : "Confirm Student Deletion"
          }
          description={
            language === "gu"
              ? `શું તમે ખરેખર ${deleteTarget.name} ને કાયમ માટે કાઢી નાખવા માંગો છો? આ ક્રિયા તેમના તમામ લર્નિંગ ગેપ્સ, એસેસમેન્ટ રેકોર્ડ્સ અને રિમીડિયલ પ્લાનને પણ ડેટાબેઝમાંથી સુરક્ષિત રીતે દૂર કરશે.`
              : `Are you sure you want to permanently delete ${deleteTarget.name}? This will also safely cascade-remove their learning gaps, assessment records, and remedial plans from the database.`
          }
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
              {language === "gu" ? "રદ કરો" : "Cancel"}
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
                  <span>{language === "gu" ? "કાઢી રહ્યું છે..." : "Deleting..."}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>{language === "gu" ? "હા, કાઢી નાખો" : "Delete Student"}</span>
                </>
              )}
            </Button>
          </div>
        </Dialog>
      )}

      {/* Guided Tour */}
      <SpotlightTour page="students" />
    </AppLayout>
  );
}
