"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { ActivityPlayerModal } from "@/components/activities/ActivityPlayerModal";
import {
  Gamepad2,
  Printer,
  Play,
  Clock,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileText,
} from "lucide-react";

export default function ActivitiesPage() {
  const { t } = useLanguage();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Interactive practice player
  const [activeActivity, setActiveActivity] = useState<any>(null);
  // Printable worksheet preview
  const [printingActivity, setPrintingActivity] = useState<any>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.error("Failed to load activities", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handlePrintWorksheet = (act: any) => {
    setPrintingActivity(act);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const filteredActivities = activities.filter((a) => {
    if (subjectFilter !== "all" && a.subjectCode !== subjectFilter) return false;
    if (difficultyFilter !== "all" && a.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Curated Remedial Practice Activities & Worksheets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Interactive digital questions for classroom devices and printable offline worksheets for primary students.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Subject:</span>
              <select
                value={subjectFilter}
                aria-label="Filter activities by subject"
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="all">All Subjects</option>
                <option value="MATH">Mathematics</option>
                <option value="ENG">English</option>
                <option value="GUJ">Gujarati</option>
                <option value="EVS">EVS</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Difficulty:</span>
              <select
                value={difficultyFilter}
                aria-label="Filter activities by difficulty"
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="Easy">Beginner / Easy</option>
                <option value="Medium">Intermediate</option>
                <option value="Hard">Advanced</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-slate-400">
            {filteredActivities.length} available practice banks
          </span>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((act) => (
            <Card key={act.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
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
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{act.title}</h3>
                {act.titleGujarati && (
                  <p className="text-xs font-medium text-slate-600 mt-0.5 font-serif">
                    {act.titleGujarati}
                  </p>
                )}

                <p className="text-xs text-slate-500 mt-1">
                  Concept: <strong>{act.conceptName}</strong>
                </p>

                {/* Questions Preview */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <span className="font-semibold text-slate-700 block">
                    Sample Questions ({act.questions?.length} items):
                  </span>
                  {act.questions?.slice(0, 2).map((q: any, i: number) => (
                    <p key={i} className="text-slate-600 text-[11px] line-clamp-1">
                      • {q.questionText}
                    </p>
                  ))}
                </div>
              </div>

              {/* Actions: Start Practice or Print Worksheet */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePrintWorksheet(act)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Worksheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveActivity(act)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Practice</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Interactive Activity Player Modal */}
      {activeActivity && (
        <ActivityPlayerModal
          activity={activeActivity}
          studentId="std-aarav"
          studentName="Aarav Patel (Class 4-A)"
          isOpen={Boolean(activeActivity)}
          onClose={() => setActiveActivity(null)}
        />
      )}

      {/* Print-Only Worksheet Overlay (Hidden on screen, visible during window.print) */}
      {printingActivity && (
        <div className="hidden print:block print:w-full print:p-8">
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <h1 className="text-2xl font-bold">Model Primary School, Gandhinagar</h1>
            <h2 className="text-lg font-semibold mt-1">
              Remedial Practice Worksheet: {printingActivity.title}
            </h2>
            <div className="flex justify-between text-sm mt-3 pt-2 border-t border-slate-300">
              <span>Student Name: ____________________________________</span>
              <span>Class: {printingActivity.grade} _____</span>
              <span>Date: ____________</span>
            </div>
          </div>

          <div className="space-y-6">
            {printingActivity.questions?.map((q: any, i: number) => (
              <div key={i} className="space-y-2">
                <p className="font-semibold text-base">
                  Q{i + 1}. {q.questionText}
                </p>
                {q.questionTextGujarati && (
                  <p className="text-sm font-serif italic text-slate-700">
                    {q.questionTextGujarati}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pl-4 pt-1">
                  {(q.options || ["True", "False"]).map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="text-sm">
                      ( ) {opt}
                    </div>
                  ))}
                </div>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-400 flex justify-between text-xs text-slate-500">
            <span>Teacher Evaluation & Signature: __________________</span>
            <span>Marks Obtained: _____ / {printingActivity.questions?.length}</span>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
