"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { useFilter } from "@/context/FilterContext";
import { StudentFormModal } from "@/components/student/StudentFormModal";
import { StudentCsvModal } from "@/components/student/StudentCsvModal";
import { StudentDeleteModal } from "@/components/student/StudentDeleteModal";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import {
  Users,
  Search,
  PlusCircle,
  Upload,
  Download,
  AlertTriangle,
  Sparkles,
  Edit,
  Trash2,
  RefreshCw,
  X,
  UserCheck,
} from "lucide-react";
import type { Student } from "@/lib/types";

export default function StudentsPage() {
  const { t, language } = useLanguage();
  const { searchTerm, setSearchTerm, selectedClass, setSelectedClass, gradeNumber } = useFilter();
  const { showToast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stdRes, gapsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/learning-gaps"),
      ]);
      const [stdData, gapsData] = await Promise.all([stdRes.json(), gapsRes.json()]);
      if (stdData.success) {
        setStudents(stdData.students || []);
      } else {
        setError(stdData.error || "Failed to load student directory");
      }
      if (gapsData.success) {
        setGaps(gapsData.gaps || []);
      }
    } catch (e: any) {
      console.error("Failed to load students", e);
      setError("Unable to connect to the persistent student store. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
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
      (g) => g.studentId === studentId && (g.status === "Active" || g.status === "Under Intervention")
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
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shikshasetu_students_class${activeGrade}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === "gu" ? "વિદ્યાર્થી ડિરેક્ટરી અને પ્રોફાઇલ્સ" : "Student Directory & 3D Profiles"}
              </h1>
              <Badge variant="indigo" size="sm">
                {students.length} Enrolled
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage primary school enrollments, track 3D skill trees, and coordinate 5-step remedial plans.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={filteredStudents.length === 0}
              className="rounded-full text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{t.actions.exportCsv}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCsvModal(true)}
              className="rounded-full text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-slate-400" />
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
        <Card variant="glass" className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-slate-800">
          <div data-tour="students-search" className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400 pointer-events-none" />
            <input
              type="text"
              placeholder={
                language === "gu"
                  ? "વિદ્યાર્થીનું નામ અથવા રોલ નંબર શોધો..."
                  : "Search students by name, roll number, or learning gap..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-slate-700 bg-slate-900/90 py-2.5 pl-12 pr-10 text-sm text-white placeholder-slate-400 focus:border-amber-500 focus:bg-slate-900 focus:ring-4 focus:ring-amber-500/20 outline-hidden transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div data-tour="students-filter" className="flex items-center gap-3 shrink-0 flex-wrap">
            <span className="text-xs font-bold text-slate-300">Class:</span>
            <select
              value={activeGrade}
              aria-label="Filter students by class"
              onChange={(e) => handleGradeFilterChange(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 outline-hidden cursor-pointer"
            >
              <option value="all">All Classes (1-5)</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="5">Class 5</option>
            </select>
            <span className="text-xs font-semibold text-amber-400/90 ml-1">
              Showing {filteredStudents.length} of {students.length} students
            </span>
          </div>
        </Card>

        {/* Error State Banner */}
        {error && !loading && (
          <Card variant="glass" className="p-6 border-rose-500/40 bg-rose-500/5 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The application was unable to fetch stored records. Please verify the server connection.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudents}
              className="rounded-full text-xs border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Retry Fetching Records</span>
            </Button>
          </Card>
        )}

        {/* Loading State: Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty States */}
        {!loading && !error && filteredStudents.length === 0 && (
          <Card variant="glass" className="py-14 px-6 text-center border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>

            {students.length === 0 ? (
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="font-heading text-base font-bold text-white">
                  No Students Enrolled Yet
                </h3>
                <p className="text-xs text-slate-400">
                  Get started by registering individual primary school students or importing your classroom roster via CSV.
                </p>
                <div className="pt-3">
                  <Button
                    variant="saffron"
                    size="sm"
                    onClick={() => setShowAddModal(true)}
                    className="rounded-full text-xs font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Register First Student</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="font-heading text-base font-bold text-white">
                  No Matching Students Found
                </h3>
                <p className="text-xs text-slate-400">
                  No student records match your current filter settings
                  {searchTerm ? ` ("${searchTerm}")` : ""}{activeGrade !== "all" ? ` in Class ${activeGrade}` : ""}.
                </p>
                <div className="pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedClass("all");
                    }}
                    className="rounded-full text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
                  >
                    <span>Clear Search &amp; Filters</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Student Cards Grid */}
        {!loading && !error && filteredStudents.length > 0 && (
          <div data-tour="students-table" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((std) => {
              const gapCount = getStudentGapCount(std.id);
              const isDemoCase = std.id === "std-aarav";
              const isArchived = std.enrollmentStatus === "transferred" || std.enrollmentStatus === "graduated";

              return (
                <Card
                  key={std.id}
                  variant="glass"
                  className={`p-5 flex flex-col justify-between transition-all border-slate-800 hover:border-amber-500/50 ${
                    isDemoCase
                      ? "ring-1 ring-amber-500/60 shadow-[0_0_20px_rgba(255,138,61,0.15)]"
                      : ""
                  } ${isArchived ? "opacity-75 bg-slate-900/40" : ""}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-600/30 text-amber-400 border border-amber-500/30 flex items-center justify-center font-heading font-black text-sm shrink-0">
                          {std.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/students/${std.id}`}
                              className="font-bold text-sm text-white hover:text-amber-400 transition-colors"
                            >
                              {std.displayName}
                            </Link>
                            {isDemoCase && (
                              <Badge variant="saffron" size="sm">
                                Demo Case
                              </Badge>
                            )}
                            {isArchived && (
                              <Badge variant="outline" size="sm" className="text-[10px] text-slate-400">
                                {std.enrollmentStatus.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {std.studentCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" size="sm">
                          Class {std.grade}-{std.section}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => setEditingStudent(std)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Student Record"
                          aria-label={`Edit ${std.displayName}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStudent(std)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Archive or Delete Student"
                          aria-label={`Archive or delete ${std.displayName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {std.notes && (
                      <p className="text-xs text-slate-300 line-clamp-2 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                        &quot;{std.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {gapCount > 0 ? (
                        <Badge variant="needsSupport" size="sm" dot>
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" />
                          <span>{gapCount} Active Gap{gapCount > 1 ? "s" : ""}</span>
                        </Badge>
                      ) : (
                        <Badge variant="mastered" size="sm" dot>
                          <span>On Track</span>
                        </Badge>
                      )}
                    </div>

                    <Link href={`/students/${std.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:text-white">
                        <span>3D Profile &rarr;</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <StudentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingCodes={students.map((s) => s.studentCode)}
        onSuccess={() => {
          fetchStudents();
          showToast({
            type: "success",
            title: "Student Registered",
            message: "New student record was persisted to database.",
          });
        }}
      />

      {/* Edit Student Modal */}
      {editingStudent && (
        <StudentFormModal
          isOpen={!!editingStudent}
          student={editingStudent}
          existingCodes={students.map((s) => s.studentCode)}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            fetchStudents();
            showToast({
              type: "success",
              title: "Record Updated",
              message: `Student ${editingStudent.displayName} updated successfully.`,
            });
            setEditingStudent(null);
          }}
        />
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deletingStudent && (
        <StudentDeleteModal
          isOpen={!!deletingStudent}
          student={deletingStudent}
          onClose={() => setDeletingStudent(null)}
          onSuccess={(msg) => {
            fetchStudents();
            showToast({
              type: "info",
              title: "Student Roster Updated",
              message: msg,
            });
            setDeletingStudent(null);
          }}
        />
      )}

      {/* CSV Import Modal */}
      <StudentCsvModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        existingCodes={students.map((s) => s.studentCode)}
        onSuccess={() => {
          fetchStudents();
          showToast({
            type: "success",
            title: "Roster Imported",
            message: "Student roster was processed and persisted.",
          });
        }}
      />

      {/* Guided Tour */}
      <SpotlightTour page="students" />
    </AppLayout>
  );
}
