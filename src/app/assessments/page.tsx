"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { AssessmentDetailModal } from "@/components/assessment/AssessmentDetailModal";
import {
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function AssessmentsPage() {
  const { t } = useLanguage();

  const [assessments, setAssessments] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Detail Modal state
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assessments");
      const data = await res.json();
      if (data.success) {
        setAssessments(data.assessments || []);
        setConcepts(data.concepts || []);
      }
    } catch (e) {
      console.error("Failed to load assessments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    if (subjectFilter !== "all" && a.subjectCode !== subjectFilter) return false;
    return true;
  });

  const getConceptNames = (conceptIds: string[]) => {
    if (!conceptIds || !Array.isArray(conceptIds)) return [];
    return conceptIds
      .map((id) => concepts.find((c) => c.id === id)?.name || id)
      .slice(0, 3);
  };

  const openDetails = (id: string) => {
    setSelectedAssessmentId(id);
    setIsDetailOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Classroom Assessments & Diagnostic Evaluations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Record concept-level assessment results to automatically trigger learning-gap detection.
            </p>
          </div>

          <Link
            href="/assessments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-center"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t.actions.createAssessment}</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter by Subject:</span>
            <select
              value={subjectFilter}
              aria-label="Filter assessments by subject"
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="all">All Subjects</option>
              <option value="MATH">Mathematics (ગણિત)</option>
              <option value="ENG">English</option>
              <option value="GUJ">Gujarati (ગુજરાતી)</option>
              <option value="EVS">Environmental Studies (પર્યાવરણ)</option>
            </select>
          </div>
          <span className="text-xs text-slate-400">
            {filteredAssessments.length} assessment records
          </span>
        </div>

        {/* Loading state skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60 p-4"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredAssessments.length === 0 && (
          <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Assessment Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {subjectFilter === "all"
                ? "No assessments have been recorded yet. Create an assessment to log formative marks and detect learning gaps."
                : `No assessments found for subject '${subjectFilter}'. Create one or change your filter.`}
            </p>
            <Link
              href="/assessments/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Assessment</span>
            </Link>
          </div>
        )}

        {/* Assessment Cards */}
        {!loading && filteredAssessments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.map((asm) => {
              const conceptNames = getConceptNames(asm.conceptIds);

              return (
                <Card key={asm.id} className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" size="sm">
                        {asm.subjectCode}
                      </Badge>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          asm.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {asm.status === "published" ? "Published & Analyzed" : "Draft"}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-2 line-clamp-2">
                      {asm.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{asm.assessmentDate}</span>
                      </span>
                      <span>Max Marks: <strong>{asm.maxMarks}</strong></span>
                    </div>

                    {/* Concepts evaluated */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Target Concepts Assessed:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {conceptNames.map((name, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {asm.classroomId ? asm.classroomId.toUpperCase() : "CLASS 4-A"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openDetails(asm.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details & Scores</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Assessment Details & Editing Modal */}
      {isDetailOpen && selectedAssessmentId && (
        <AssessmentDetailModal
          isOpen={isDetailOpen}
          assessmentId={selectedAssessmentId}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedAssessmentId(null);
          }}
          onUpdated={() => {
            fetchAssessments();
          }}
          onDeleted={() => {
            fetchAssessments();
          }}
        />
      )}
    </AppLayout>
  );
}
