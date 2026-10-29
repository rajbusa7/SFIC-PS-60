"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { ActivityPlayerModal } from "@/components/activities/ActivityPlayerModal";
import { QuizModal } from "@/components/activities/QuizModal";
import { WorksheetModal } from "@/components/activities/WorksheetModal";
import { WorksheetViewModal } from "@/components/activities/WorksheetViewModal";
import {
  Gamepad2,
  Printer,
  Play,
  Clock,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileText,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter,
  UserCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import type { LearningActivity, WorksheetData, SubjectCode } from "@/lib/types";

export default function ActivitiesPage() {
  const { t } = useLanguage();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"quizzes" | "worksheets" | "recommendations">("quizzes");

  // Data states
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [worksheets, setWorksheets] = useState<WorksheetData[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [remedialPlans, setRemedialPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Recommendations tab state
  const [selectedStudentId, setSelectedStudentId] = useState<string>("std-aarav");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Modal states
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<LearningActivity | null>(null);

  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [worksheetToEdit, setWorksheetToEdit] = useState<WorksheetData | null>(null);

  const [viewingWorksheet, setViewingWorksheet] = useState<WorksheetData | null>(null);
  const [activePracticeActivity, setActivePracticeActivity] = useState<LearningActivity | null>(null);

  // Notifications
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showAlert = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [resActs, resWs, resAssess, resStuds, resPlans] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/worksheets"),
        fetch("/api/assessments"),
        fetch("/api/students"),
        fetch("/api/remedial-plans"),
      ]);

      const [dataActs, dataWs, dataAssess, dataStuds, dataPlans] = await Promise.all([
        resActs.json(),
        resWs.json(),
        resAssess.json(),
        resStuds.json(),
        resPlans.json(),
      ]);

      if (dataActs.success) setActivities(dataActs.activities || []);
      if (dataWs.success) setWorksheets(dataWs.worksheets || []);
      if (dataAssess.success) setConcepts(dataAssess.concepts || []);
      if (dataStuds.success) {
        setStudents(dataStuds.students || []);
        if (dataStuds.students?.length > 0 && !selectedStudentId) {
          setSelectedStudentId(dataStuds.students[0].id);
        }
      }
      if (dataPlans.success) setRemedialPlans(dataPlans.plans || []);
    } catch (e) {
      console.error("Failed to load activities data", e);
      showAlert("error", "Failed to connect to activity services.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch recommendations whenever selectedStudentId changes or tab becomes recommendations
  const fetchStudentRecommendations = async (studentId: string) => {
    if (!studentId) return;
    setLoadingRecommendations(true);
    try {
      const res = await fetch(`/api/activities?recommend=true&studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error("Failed to load gap recommendations", e);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (activeTab === "recommendations" && selectedStudentId) {
      fetchStudentRecommendations(selectedStudentId);
    }
  }, [activeTab, selectedStudentId]);

  // Quiz CRUD
  const handleOpenCreateQuiz = () => {
    setQuizToEdit(null);
    setIsQuizModalOpen(true);
  };

  const handleEditQuiz = (act: LearningActivity) => {
    setQuizToEdit(act);
    setIsQuizModalOpen(true);
  };

  const handleDeleteQuiz = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the quiz "${title}"?`)) return;
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActivities((prev) => prev.filter((a) => a.id !== id));
        showAlert("success", `Quiz "${title}" deleted successfully.`);
      } else {
        showAlert("error", data.error || "Failed to delete quiz.");
      }
    } catch (e) {
      showAlert("error", "Network error deleting quiz.");
    }
  };

  // Worksheet CRUD
  const handleOpenCreateWorksheet = () => {
    setWorksheetToEdit(null);
    setIsWorksheetModalOpen(true);
  };

  const handleEditWorksheet = (ws: WorksheetData) => {
    setWorksheetToEdit(ws);
    setIsWorksheetModalOpen(true);
  };

  const handleDeleteWorksheet = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the worksheet "${title}"?`)) return;
    try {
      const res = await fetch(`/api/worksheets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setWorksheets((prev) => prev.filter((w) => w.id !== id));
        showAlert("success", `Worksheet "${title}" deleted successfully.`);
      } else {
        showAlert("error", data.error || "Failed to delete worksheet.");
      }
    } catch (e) {
      showAlert("error", "Network error deleting worksheet.");
    }
  };

  // Filtered Quizzes
  const filteredActivities = activities.filter((a) => {
    if (subjectFilter !== "all" && a.subjectCode !== subjectFilter) return false;
    if (difficultyFilter !== "all" && a.difficulty !== difficultyFilter) return false;
    if (gradeFilter !== "all" && String(a.grade) !== gradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchConcept = a.conceptName?.toLowerCase().includes(q);
      if (!matchTitle && !matchConcept) return false;
    }
    return true;
  });

  // Filtered Worksheets
  const filteredWorksheets = worksheets.filter((w) => {
    if (subjectFilter !== "all" && w.subjectCode !== subjectFilter) return false;
    if (difficultyFilter !== "all" && w.difficulty !== difficultyFilter) return false;
    if (gradeFilter !== "all" && String(w.grade) !== gradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = w.title.toLowerCase().includes(q);
      const matchConcept = w.concept?.toLowerCase().includes(q);
      if (!matchTitle && !matchConcept) return false;
    }
    return true;
  });

  const selectedStudentObj = students.find((s) => s.id === selectedStudentId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                <Gamepad2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Quizzes, Worksheets & Remedial Practice
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Curated interactive digital quizzes with secure auto-scoring and printable offline A4 worksheets linked to detected student gaps.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadAllData}
              disabled={refreshing}
              className="rounded-xl text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenCreateWorksheet}
              className="rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-300"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              <span>New Worksheet</span>
            </Button>

            <Button
              type="button"
              variant="indigo"
              size="sm"
              onClick={handleOpenCreateQuiz}
              className="rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New Quiz</span>
            </Button>
          </div>
        </div>

        {/* Alert Notification Banner */}
        {alertMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all ${
              alertMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {alertMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{alertMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("quizzes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "quizzes"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Interactive Quizzes ({activities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("worksheets")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "worksheets"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Printable Worksheets ({worksheets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recommendations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "recommendations"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Learning Gap Recommendations</span>
          </button>
        </div>

        {/* Filters Bar (shown on Quizzes and Worksheets tabs) */}
        {activeTab !== "recommendations" && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by title or concept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-indigo-500 w-48 sm:w-64"
                />
              </div>

              {/* Subject selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subject:</span>
                <select
                  value={subjectFilter}
                  aria-label="Filter by subject"
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  <option value="MATH">Mathematics</option>
                  <option value="ENG">English</option>
                  <option value="GUJ">Gujarati</option>
                  <option value="EVS">EVS</option>
                </select>
              </div>

              {/* Grade selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Grade:</span>
                <select
                  value={gradeFilter}
                  aria-label="Filter by grade"
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Grades</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                </select>
              </div>

              {/* Difficulty selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Difficulty:</span>
                <select
                  value={difficultyFilter}
                  aria-label="Filter by difficulty"
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-400">
              Showing{" "}
              {activeTab === "quizzes" ? filteredActivities.length : filteredWorksheets.length} items
            </span>
          </div>
        )}

        {/* TAB 1: INTERACTIVE QUIZZES */}
        {activeTab === "quizzes" && (
          <div>
            {loading ? (
              <div className="text-center py-16 text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Loading quizzes repository...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                <Gamepad2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Quizzes Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No quizzes match your current filters. Click &quot;New Quiz&quot; above to create and save a new interactive quiz.
                </p>
                <Button
                  type="button"
                  variant="indigo"
                  size="sm"
                  onClick={handleOpenCreateQuiz}
                  className="mt-4 rounded-xl text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Create First Quiz</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.map((act) => (
                  <Card key={act.id} className="flex flex-col justify-between p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" size="sm">
                            {act.subjectCode} • Grade {act.grade}
                          </Badge>
                          <Badge
                            variant={
                              act.difficulty === "Easy"
                                ? "mastered"
                                : act.difficulty === "Medium"
                                ? "developing"
                                : "high"
                            }
                            size="sm"
                          >
                            {act.difficulty}
                          </Badge>
                          {act.estimatedMinutes && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {act.estimatedMinutes}m
                            </span>
                          )}
                        </div>

                        {/* Edit & Delete actions for teachers */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditQuiz(act)}
                            title="Edit Quiz"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuiz(act.id, act.title)}
                            title="Delete Quiz"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Titles & Concept */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                        {act.title}
                      </h3>
                      {act.titleGujarati && (
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 font-serif">
                          {act.titleGujarati}
                        </p>
                      )}

                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>
                          Concept: <strong className="text-slate-700 dark:text-slate-300">{act.conceptName}</strong>
                        </p>
                        {act.learningObjective && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                            🎯 Objective: {act.learningObjective}
                          </p>
                        )}
                        {act.remedialPlanId && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            🔗 Linked to Remedial Plan #{act.remedialPlanId.substring(0, 10)}
                          </span>
                        )}
                      </div>

                      {/* Question Preview Box */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">
                            Sample Questions ({act.questions?.length || 0} items):
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                            🔒 Server-graded
                          </span>
                        </div>
                        {act.questions?.slice(0, 2).map((q: any, i: number) => (
                          <p key={i} className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-1">
                            • {q.questionText}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Launch Practice button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {act.questions?.length || 0} Questions
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePracticeActivity(act)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch Practice</span>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRINTABLE WORKSHEETS */}
        {activeTab === "worksheets" && (
          <div>
            {loading ? (
              <div className="text-center py-16 text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Loading worksheets repository...</span>
              </div>
            ) : filteredWorksheets.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Worksheets Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No worksheets match your current filters. Click &quot;New Worksheet&quot; to build an offline printable worksheet.
                </p>
                <Button
                  type="button"
                  variant="indigo"
                  size="sm"
                  onClick={handleOpenCreateWorksheet}
                  className="mt-4 rounded-xl text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Create First Worksheet</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWorksheets.map((ws) => (
                  <Card key={ws.id} className="flex flex-col justify-between p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" size="sm">
                            {ws.subjectCode || ws.subject} • Class {ws.grade}
                          </Badge>
                          <Badge
                            variant={
                              ws.difficulty === "Easy"
                                ? "mastered"
                                : ws.difficulty === "Medium"
                                ? "developing"
                                : "high"
                            }
                            size="sm"
                          >
                            {ws.difficulty || "Medium"}
                          </Badge>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {ws.totalMarks || (ws.questions?.length || 0) * 2} Marks
                          </span>
                        </div>

                        {/* Edit & Delete actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditWorksheet(ws)}
                            title="Edit Worksheet"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWorksheet(ws.id || "", ws.title)}
                            title="Delete Worksheet"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Concept */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                        {ws.title}
                      </h3>
                      {ws.studentName && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                          Target Student: {ws.studentName}
                        </p>
                      )}

                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>
                          Concept: <strong className="text-slate-700 dark:text-slate-300">{ws.concept}</strong>
                        </p>
                        {ws.instructions && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                            &quot;{ws.instructions}&quot;
                          </p>
                        )}
                        {ws.remedialPlanId && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            🔗 Plan Step #{ws.remedialPlanId.substring(0, 10)}
                          </span>
                        )}
                      </div>

                      {/* Question Summary */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">
                            Exercise Items ({ws.questions?.length || 0}):
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Includes Teacher Answer Key
                          </span>
                        </div>
                        {ws.questions?.slice(0, 2).map((q, i) => (
                          <p key={i} className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-1">
                            Q{i + 1}. {q.question} ({q.marks || 2} marks)
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* View / Print button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        A4 Print Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingWorksheet(ws)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-500" />
                        <span>View & Print</span>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LEARNING GAP RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div className="space-y-6">
            {/* Student Selector Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                  <UserCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Select Target Student for Recommended Practice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Matches quizzes & worksheets to actual detected learning gaps from assessments.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="student-selector" className="text-xs font-semibold text-slate-500">Student:</label>
                <select
                  id="student-selector"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-hidden cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} (Class {s.grade}-{s.section})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pedagogical Rule Advisory Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Checklist Point 5 Pedagogical Invariant:</strong>
                Student completion of interactive quizzes and worksheets updates their remedial plan progress in real time. However, to safeguard rigorous academic integrity, practice activity completion does <em>not</em> automatically mark a competency as Mastered. Official mastery status is only updated when formative assessment criteria are met.
              </div>
            </div>

            {/* Recommendations Content */}
            {loadingRecommendations ? (
              <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Evaluating detected gaps and curating practice activities...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Active Learning Gaps Detected for {selectedStudentObj?.displayName || "this student"}!
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  All monitored competencies are either performing at grade-level (&ge;80%) or already fully mastered.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {recommendations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
                  >
                    {/* Gap Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Detected Learning Gap
                          </span>
                          <Badge
                            variant={item.gap.priority === "High" ? "high" : "developing"}
                            size="sm"
                          >
                            {item.gap.priority} Priority
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {item.gap.subjectCode} • Class {item.gap.grade}
                          </Badge>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                          {item.gap.conceptName}
                        </h4>
                        {item.gap.conceptNameGujarati && (
                          <p className="text-xs text-slate-500 font-serif">
                            {item.gap.conceptNameGujarati}
                          </p>
                        )}
                      </div>

                      <div className="text-right sm:self-center">
                        <div className="text-xs text-slate-400">Current Performance</div>
                        <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                          {item.gap.latestPercentage}%
                        </div>
                      </div>
                    </div>

                    {/* Linked Remedial Plan status if present */}
                    {item.remedialPlan && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Active Remedial Plan:
                          </span>
                          <Badge variant="indigo" size="sm">
                            {item.remedialPlan.status}
                          </Badge>
                          <span className="text-slate-500">
                            ({item.remedialPlan.completedStepsCount || 0}/{item.remedialPlan.steps?.length || 5} steps completed)
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {item.remedialPlan.progressPercentage || 0}% Progress
                        </span>
                      </div>
                    )}

                    {/* Recommended Quizzes */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Recommended Practice Quizzes ({item.recommendedActivities?.length || 0})</span>
                      </h5>

                      {item.recommendedActivities?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-5">
                          No targeted quiz found for this concept. Click &quot;New Quiz&quot; above to add one.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.recommendedActivities.map((act: LearningActivity) => (
                            <div
                              key={act.id}
                              className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/20 flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {act.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {act.questions?.length} Questions • {act.difficulty}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActivePracticeActivity(act)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                              >
                                Launch Practice
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recommended Worksheets */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5 text-teal-500" />
                        <span>Recommended Offline Worksheets ({item.recommendedWorksheets?.length || 0})</span>
                      </h5>

                      {item.recommendedWorksheets?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-5">
                          No offline worksheet created yet for this gap. Click &quot;New Worksheet&quot; above to create one.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.recommendedWorksheets.map((ws: WorksheetData) => (
                            <div
                              key={ws.id}
                              className="p-3.5 rounded-xl border border-teal-100 dark:border-teal-950 bg-teal-50/30 dark:bg-teal-950/20 flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {ws.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {ws.questions?.length} Exercises • {ws.totalMarks || 10} Marks
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setViewingWorksheet(ws)}
                                className="px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 text-xs font-bold shrink-0 hover:bg-teal-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                              >
                                View & Print
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUIZ MODAL (CREATE / EDIT) */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => {
          setIsQuizModalOpen(false);
          setQuizToEdit(null);
        }}
        onSaved={(savedActivity) => {
          setIsQuizModalOpen(false);
          setQuizToEdit(null);
          loadAllData();
          showAlert("success", `Quiz "${savedActivity.title}" saved successfully!`);
        }}
        activityToEdit={quizToEdit}
        concepts={concepts}
      />

      {/* WORKSHEET MODAL (CREATE / EDIT) */}
      <WorksheetModal
        isOpen={isWorksheetModalOpen}
        onClose={() => {
          setIsWorksheetModalOpen(false);
          setWorksheetToEdit(null);
        }}
        onSaved={(savedWorksheet) => {
          setIsWorksheetModalOpen(false);
          setWorksheetToEdit(null);
          loadAllData();
          showAlert("success", `Worksheet "${savedWorksheet.title}" saved successfully!`);
        }}
        worksheetToEdit={worksheetToEdit}
        concepts={concepts}
        remedialPlans={remedialPlans}
      />

      {/* WORKSHEET VIEW / PRINT MODAL */}
      <WorksheetViewModal
        isOpen={Boolean(viewingWorksheet)}
        onClose={() => setViewingWorksheet(null)}
        worksheet={viewingWorksheet}
      />

      {/* INTERACTIVE ACTIVITY PLAYER MODAL */}
      {activePracticeActivity && (
        <ActivityPlayerModal
          isOpen={Boolean(activePracticeActivity)}
          onClose={() => setActivePracticeActivity(null)}
          activity={activePracticeActivity}
          studentId={selectedStudentId}
          studentName={selectedStudentObj?.displayName || "Student"}
          onCompleted={(attemptData) => {
            loadAllData();
            if (activeTab === "recommendations") {
              fetchStudentRecommendations(selectedStudentId);
            }
            showAlert(
              "success",
              `Score recorded: ${attemptData.percentage}%! Remedial plan progress updated.`
            );
          }}
        />
      )}
    </AppLayout>
  );
}
