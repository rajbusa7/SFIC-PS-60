"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { ActivityPlayerModal } from "@/components/activities/ActivityPlayerModal";
import { subscribeToDataUpdates } from "@/lib/events";
import {
  Gamepad2,
  Printer,
  Play,
  Clock,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileText,
  Search,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Share2,
  UserCheck,
  Filter,
  X,
  Award,
} from "lucide-react";

export default function ActivitiesPage() {
  const { t, language, formatSubject, formatClass } = useLanguage();

  const [activities, setActivities] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "recommended" | "attempted" | "bookmarked">("all");

  // Selected Student for practice session
  const [selectedStudentId, setSelectedStudentId] = useState("std-aarav");

  // Local state for bookmarks and attempts
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [studentAttempts, setStudentAttempts] = useState<Record<string, any>>({});

  // Interactive practice player
  const [activeActivity, setActiveActivity] = useState<any>(null);
  // Printable worksheet preview
  const [printingActivity, setPrintingActivity] = useState<any>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  // Quick Assign Modal
  const [assigningActivity, setAssigningActivity] = useState<any>(null);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState("");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activities?studentId=${selectedStudentId}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
        if (data.attempts) {
          const map: Record<string, any> = {};
          data.attempts.forEach((att: any) => {
            if (!map[att.activityId] || att.percentage > map[att.activityId].percentage) {
              map[att.activityId] = att;
            }
          });
          setStudentAttempts(map);
        }
      }
    } catch (e) {
      console.error("Failed to load activities", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success && data.students) {
        setStudents(data.students);
      }
    } catch {}
  };

  useEffect(() => {
    fetchActivities();
    fetchStudents();

    // Load saved bookmarks from localStorage
    try {
      const saved = localStorage.getItem("studysaathi_bookmarks");
      if (saved) setBookmarkedIds(JSON.parse(saved));
    } catch {}

    const unsubscribe = subscribeToDataUpdates(() => {
      fetchActivities();
    }, ["activities", "all"]);
    return () => unsubscribe();
  }, [selectedStudentId]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter((b) => b !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    try {
      localStorage.setItem("studysaathi_bookmarks", JSON.stringify(updated));
    } catch {}
  };

  const handlePrintWorksheet = (act: any) => {
    setPrintingActivity(act);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || {
      id: "std-aarav",
      displayName: "Aarav Patel",
      grade: 4,
      section: "A",
    };
  }, [students, selectedStudentId]);

  // Comprehensive Filtering
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      // Subject filter
      if (subjectFilter !== "all" && a.subjectCode !== subjectFilter) return false;

      // Grade filter
      if (gradeFilter !== "all" && String(a.grade) !== String(gradeFilter)) return false;

      // Difficulty filter
      if (difficultyFilter !== "all" && a.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) return false;

      // Activity Type filter
      if (typeFilter !== "all" && a.activityType !== typeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const haystack = [
          a.title,
          a.titleGujarati,
          a.conceptName,
          a.chapter,
          a.chapterGujarati,
          a.topic,
          a.topicGujarati,
          a.subjectCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      // Tab Filters
      if (activeTab === "bookmarked") {
        return bookmarkedIds.includes(a.id);
      }
      if (activeTab === "attempted") {
        return Boolean(studentAttempts[a.id]);
      }
      if (activeTab === "recommended") {
        // Recommend activities matching current student's grade
        return a.grade === (selectedStudent?.grade || 4);
      }

      return true;
    });
  }, [activities, subjectFilter, gradeFilter, difficultyFilter, typeFilter, searchQuery, activeTab, bookmarkedIds, studentAttempts, selectedStudent]);

  const handleLaunchNext = (nextId: string) => {
    const nextAct = activities.find((a) => a.id === nextId);
    if (nextAct) {
      setActiveActivity(nextAct);
    }
  };

  const handleQuickAssign = (act: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssigningActivity(act);
    setAssignSuccessMsg("");
  };

  const confirmAssignment = () => {
    setAssignSuccessMsg(
      language === "gu"
        ? `પ્રવૃત્તિ "${assigningActivity?.title}" સફળતાપૂર્વક વર્ગ ${selectedStudent.grade}-${selectedStudent.section} ને સોંપાઈ!`
        : `Activity "${assigningActivity?.title}" assigned to Class ${selectedStudent.grade}-${selectedStudent.section} successfully!`
    );
    setTimeout(() => {
      setAssigningActivity(null);
      setAssignSuccessMsg("");
    }, 1800);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#49352F] tracking-tight font-heading">
              {t.activities.title || "Curated Remedial Practice Activities & Worksheets"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-0.5">
              {t.activities.subtitle || "Interactive digital questions for classroom devices and printable offline worksheets for primary students."}
            </p>
          </div>

          {/* Student Selector Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-2xl bg-white border border-[#49352F]/12 shadow-2xs">
            <UserCheck className="w-4 h-4 text-[#B26A1B]" />
            <span className="text-xs font-semibold text-[#7A6862]">
              {language === "gu" ? "વિદ્યાર્થી:" : "Practicing for:"}
            </span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#49352F] outline-hidden cursor-pointer"
            >
              {students.length > 0 ? (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} (Std {s.grade}-{s.section})
                  </option>
                ))
              ) : (
                <option value="std-aarav">Aarav Patel (Std 4-A)</option>
              )}
            </select>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#49352F]/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#49352F] text-white shadow-xs"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F]"
            }`}
          >
            {language === "gu" ? "બધી પ્રવૃત્તિઓ" : "All Activities"} ({activities.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recommended")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "recommended"
                ? "bg-[#49352F] text-white shadow-xs"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B26A1B]" />
            <span>
              {language === "gu" ? `ધોરણ ${selectedStudent.grade} ભલામણ` : `Std ${selectedStudent.grade} Recommended`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attempted")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "attempted"
                ? "bg-[#49352F] text-white shadow-xs"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5E]" />
            <span>
              {language === "gu" ? "તાજેતરમાં કરેલ" : "Recently Attempted"} (
              {Object.keys(studentAttempts).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookmarked")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "bookmarked"
                ? "bg-[#49352F] text-white shadow-xs"
                : "bg-white/80 text-[#7A6862] hover:bg-white hover:text-[#49352F]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#B26A1B]" />
            <span>{language === "gu" ? "સાચવેલ (બુકમાર્ક)" : "Bookmarked"} ({bookmarkedIds.length})</span>
          </button>
        </div>

        {/* Enhanced Multi-Filter Bar */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-white/95 border border-[#49352F]/12 shadow-[0_4px_16px_rgba(73,53,47,0.04)]">
          {/* Top Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Subject Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#7A6862]">
                  {language === "gu" ? "વિષય:" : "Subject:"}
                </span>
                <select
                  value={subjectFilter}
                  aria-label="Filter activities by subject"
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
                >
                  <option value="all">{language === "gu" ? "બધા વિષયો" : "All Subjects"}</option>
                  <option value="MATH">{formatSubject("MATH")}</option>
                  <option value="ENG">{formatSubject("ENG")}</option>
                  <option value="GUJ">{formatSubject("GUJ")}</option>
                  <option value="EVS">{formatSubject("EVS")}</option>
                  <option value="SCI">{formatSubject("SCI")}</option>
                  <option value="SST">{formatSubject("SST")}</option>
                  <option value="HIN">{formatSubject("HIN")}</option>
                </select>
              </div>

              {/* Standard Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#7A6862]">
                  {language === "gu" ? "ધોરણ:" : "Standard:"}
                </span>
                <select
                  value={gradeFilter}
                  aria-label="Filter activities by grade"
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
                >
                  <option value="all">{language === "gu" ? "બધા ધોરણ" : "All Standards"}</option>
                  <option value="1">{language === "gu" ? "ધોરણ ૧" : "Std 1"}</option>
                  <option value="2">{language === "gu" ? "ધોરણ ૨" : "Std 2"}</option>
                  <option value="3">{language === "gu" ? "ધોરણ ૩" : "Std 3"}</option>
                  <option value="4">{language === "gu" ? "ધોરણ ૪" : "Std 4"}</option>
                  <option value="5">{language === "gu" ? "ધોરણ ૫" : "Std 5"}</option>
                  <option value="6">{language === "gu" ? "ધોરણ ૬" : "Std 6"}</option>
                  <option value="7">{language === "gu" ? "ધોરણ ૭" : "Std 7"}</option>
                  <option value="8">{language === "gu" ? "ધોરણ ૮" : "Std 8"}</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#7A6862]">
                  {language === "gu" ? "મુશ્કેલી:" : "Difficulty:"}
                </span>
                <select
                  value={difficultyFilter}
                  aria-label="Filter activities by difficulty"
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
                >
                  <option value="all">{language === "gu" ? "બધા સ્તરો" : "All Levels"}</option>
                  <option value="Easy">{language === "gu" ? "સરળ / પ્રારંભિક" : "Beginner / Easy"}</option>
                  <option value="Medium">{language === "gu" ? "મધ્યમ" : "Intermediate"}</option>
                  <option value="Hard">{language === "gu" ? "કઠિન" : "Advanced"}</option>
                </select>
              </div>

              {/* Activity Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#7A6862]">
                  {language === "gu" ? "પ્રકાર:" : "Type:"}
                </span>
                <select
                  value={typeFilter}
                  aria-label="Filter activities by activity type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
                >
                  <option value="all">{language === "gu" ? "બધા પ્રકાર" : "All Types"}</option>
                  <option value="mcq">MCQ Quiz</option>
                  <option value="fill_in_the_blank">{language === "gu" ? "ખાલી જગ્યા" : "Fill in Blanks"}</option>
                  <option value="true_false">{language === "gu" ? "સાચું કે ખોટું" : "True or False"}</option>
                  <option value="word_problem">{language === "gu" ? "શાબ્દિક દાખલા" : "Word Problem"}</option>
                  <option value="reading_comprehension">{language === "gu" ? "વાંચન સમજ" : "Comprehension"}</option>
                  <option value="sorting">{language === "gu" ? "વર્ગીકરણ" : "Sorting"}</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <span className="text-xs font-semibold text-[#7A6862]">
              {filteredActivities.length} {language === "gu" ? "ઉપલબ્ધ મહાવરા બેંકો" : "available practice banks"}
            </span>
          </div>

          {/* Search Box Row */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#7A6862] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "gu"
                  ? "પ્રવૃત્તિ, સંકલ્પના કે પ્રકરણ શોધો (દા.ત. ભાગાકાર, fractions, water, phonics)..."
                  : "Search activities, concepts, or chapters (e.g. division, fractions, water, phonics)..."
              }
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] text-xs font-medium text-[#49352F] placeholder-[#7A6862]/70 outline-hidden focus:border-[#49352F]/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6862] hover:text-[#49352F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredActivities.length === 0 && !loading && (
          <div className="text-center py-12 rounded-2xl bg-white border border-[#49352F]/12 p-8 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF6E9] flex items-center justify-center text-[#B26A1B]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#49352F]">
              {language === "gu" ? "કોઈ મેળ ખાતી પ્રવૃત્તિ મળી નથી" : "No matching activities found"}
            </h3>
            <p className="text-xs text-[#7A6862] max-w-sm mx-auto">
              {language === "gu"
                ? "કૃપા કરીને વિષય, ધોરણ કે મુશ્કેલી સ્તરના ફિલ્ટર્સ બદલીને ફરી તપાસો."
                : "Try adjusting your subject, standard, or difficulty filters to see more available activities."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSubjectFilter("all");
                setGradeFilter("all");
                setDifficultyFilter("all");
                setTypeFilter("all");
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#49352F] text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{language === "gu" ? "બધા ફિલ્ટર્સ સાફ કરો" : "Reset All Filters"}</span>
            </button>
          </div>
        )}

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((act) => {
            const isBookmarked = bookmarkedIds.includes(act.id);
            const prevAttempt = studentAttempts[act.id];

            return (
              <Card key={act.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" size="sm">
                        {formatSubject(act.subjectCode)} • {language === "gu" ? `ધોરણ ${act.grade}` : `Grade ${act.grade}`}
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
                        {act.difficulty === "Easy"
                          ? language === "gu" ? "સરળ" : "Easy"
                          : act.difficulty === "Medium"
                          ? language === "gu" ? "મધ્યમ" : "Medium"
                          : language === "gu" ? "કઠિન" : "Hard"}
                      </Badge>

                      {prevAttempt && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2E7D5E]/15 text-[#1B5E41]">
                          <CheckCircle2 className="w-3 h-3" />
                          {prevAttempt.percentage}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Teacher Quick-Assign */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickAssign(act, e)}
                        title={language === "gu" ? "વર્ગને સોંપો" : "Assign to Class"}
                        className="p-1.5 rounded-lg text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9] transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Bookmark Toggle */}
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(act.id, e)}
                        aria-label="Bookmark activity"
                        className="p-1.5 rounded-lg text-[#7A6862] hover:text-[#B26A1B] hover:bg-[#FAF6E9] transition-colors cursor-pointer"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4 text-[#B26A1B] fill-current" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[#49352F] mt-2 leading-snug">
                    {act.title}
                  </h3>
                  {act.titleGujarati && (
                    <p className="text-xs font-medium text-[#7A6862] mt-0.5 font-serif">
                      {act.titleGujarati}
                    </p>
                  )}

                  {/* Chapter / Topic */}
                  <div className="mt-1 text-xs text-[#7A6862] space-y-0.5">
                    {act.chapter && (
                      <p>
                        <strong className="text-[#49352F]">{language === "gu" ? "પ્રકરણ:" : "Chapter:"}</strong>{" "}
                        {language === "gu" && act.chapterGujarati ? act.chapterGujarati : act.chapter}
                      </p>
                    )}
                    <p>
                      <strong className="text-[#49352F]">{language === "gu" ? "સંકલ્પના:" : "Concept:"}</strong>{" "}
                      {language === "gu" && act.conceptNameGujarati ? act.conceptNameGujarati : act.conceptName}
                    </p>
                  </div>

                  {/* Sample Questions Preview */}
                  <div className="mt-3 p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#49352F]">
                      <span>
                        {language === "gu"
                          ? `નમૂના પ્રશ્નો (${act.questions?.length} પ્રશ્નો):`
                          : `Sample Questions (${act.questions?.length} items):`}
                      </span>
                      <span className="text-[#7A6862] flex items-center gap-1 font-normal">
                        <Clock className="w-3 h-3" />
                        ~{act.estimatedMinutes || 10}m
                      </span>
                    </div>

                    {act.questions?.slice(0, 2).map((q: any, i: number) => (
                      <p key={i} className="text-[#7A6862] text-[11px] line-clamp-1">
                        • {language === "gu" && q.questionTextGujarati ? q.questionTextGujarati : q.questionText}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Actions: Start Practice or Print Worksheet */}
                <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintWorksheet(act)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#49352F]/15 bg-white hover:bg-[#FAF6E9] text-[#49352F] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#B26A1B]" />
                    <span>{language === "gu" ? "કાર્યપત્રિકા પ્રિન્ટ કરો" : "Print Worksheet"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveActivity(act)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{language === "gu" ? "મહાવરો શરૂ કરો" : "Launch Practice"}</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Interactive Activity Player Modal */}
      {activeActivity && (
        <ActivityPlayerModal
          activity={activeActivity}
          studentId={selectedStudent.id}
          studentName={`${selectedStudent.displayName} (Std ${selectedStudent.grade}-${selectedStudent.section})`}
          isOpen={Boolean(activeActivity)}
          onClose={() => setActiveActivity(null)}
          onLaunchNext={handleLaunchNext}
          onCompleted={() => {
            fetchActivities();
          }}
        />
      )}

      {/* Quick Teacher Assignment Modal */}
      {assigningActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#49352F]/15 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#49352F]">
                {language === "gu" ? "પ્રવૃત્તિ સોંપો (Teacher Assignment)" : "Assign Practice Activity"}
              </h3>
              <button
                type="button"
                onClick={() => setAssigningActivity(null)}
                className="text-[#7A6862] hover:text-[#49352F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 text-xs space-y-1">
              <span className="font-bold text-[#49352F] block">{assigningActivity.title}</span>
              <span className="text-[#7A6862]">
                {formatSubject(assigningActivity.subjectCode)} • Std {assigningActivity.grade} • {assigningActivity.difficulty}
              </span>
            </div>

            {assignSuccessMsg ? (
              <div className="p-3 rounded-xl bg-[#2E7D5E]/15 border border-[#2E7D5E]/20 text-xs text-[#1B5E41] font-bold">
                {assignSuccessMsg}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#7A6862] block mb-1">
                    {language === "gu" ? "લક્ષિત વર્ગ / વિદ્યાર્થી:" : "Target Classroom:"}
                  </label>
                  <select className="w-full p-2 rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] font-semibold text-[#49352F]">
                    <option value="cls-4a">Class 4-A (Whole Roster - 6 Students)</option>
                    <option value="cls-3a">Class 3-A (Whole Roster - 5 Students)</option>
                    <option value="cls-5a">Class 5-A (Whole Roster - 4 Students)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#7A6862] block mb-1">
                    {language === "gu" ? "પૂર્ણ કરવાની સમયસીમા:" : "Completion Deadline:"}
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}
                    className="w-full p-2 rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] font-medium text-[#49352F]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssigningActivity(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#7A6862] hover:bg-[#FAF6E9] rounded-xl"
                  >
                    {language === "gu" ? "રદ કરો" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={confirmAssignment}
                    className="px-5 py-2 text-xs font-bold bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 rounded-xl shadow-xs cursor-pointer"
                  >
                    {language === "gu" ? "સોંપણી મંજૂર કરો" : "Confirm Assignment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print-Only Worksheet Overlay (A4 Structured Layout) */}
      {printingActivity && (
        <div className="hidden print:block print:w-full print:p-8 font-sans">
          {/* School Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Model Primary School, Gandhinagar
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Gujarat Primary Education Department • Remedial Practice Worksheet
            </p>
            <h2 className="text-lg font-bold mt-2 text-slate-800">
              {printingActivity.title}
            </h2>
            {printingActivity.titleGujarati && (
              <p className="text-sm font-serif italic text-slate-600">
                {printingActivity.titleGujarati}
              </p>
            )}

            <div className="flex justify-between items-center text-xs mt-4 pt-2 border-t border-slate-300 font-medium">
              <span>Student Name: ____________________________________</span>
              <span>Class: Std {printingActivity.grade} _____</span>
              <span>Roll No: ______</span>
              <span>Date: ____________</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-3 border border-slate-300 rounded text-xs text-slate-700">
            <strong>Instructions:</strong> Read each question carefully. Write your answer in the space provided or tick the correct option. Show all working steps where required.
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {printingActivity.questions?.map((q: any, i: number) => (
              <div key={i} className="space-y-2 page-break-inside-avoid">
                <div className="flex justify-between text-sm font-semibold text-slate-900">
                  <span>
                    Q{i + 1}. {q.questionText}
                  </span>
                  <span className="text-xs text-slate-500 font-normal">[{q.marks || 1} mark]</span>
                </div>

                {q.questionTextGujarati && (
                  <p className="text-xs font-serif italic text-slate-700">
                    {q.questionTextGujarati}
                  </p>
                )}

                {/* MCQ Options */}
                {q.options && q.options.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 pl-4 pt-1">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="text-xs flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border border-slate-400 rounded-full text-center text-[10px]"></span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-14 border-b border-dashed border-slate-300 pl-4 text-xs text-slate-400 italic flex items-end pb-1">
                    Answer: __________________________________________________
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Teacher Signature & Marks */}
          <div className="mt-8 pt-4 border-t-2 border-slate-400 flex justify-between text-xs text-slate-600">
            <span>Teacher Evaluation & Signature: __________________</span>
            <span>Marks Obtained: _____ / {printingActivity.questions?.length}</span>
            <span>Teacher Remarks: __________________</span>
          </div>

          {/* Teacher Answer Key Page Break */}
          <div className="mt-12 pt-6 border-t-2 border-dashed border-slate-400 page-break-before-always">
            <div className="text-center font-bold text-sm mb-4">
              [TEACHER REFERENCE ANSWER KEY — DO NOT DISTRIBUTE TO STUDENTS]
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {printingActivity.questions?.map((q: any, i: number) => (
                <div key={i} className="p-2 border border-slate-200 rounded bg-slate-50">
                  <span className="font-bold">Q{i + 1} Answer:</span> {String(q.correctAnswer)}
                  <p className="text-[11px] text-slate-500 mt-0.5">{q.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
