"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { calculatePercentage } from "@/lib/engine/calculations";
import { broadcastDataUpdate } from "@/lib/events";
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Plus,
} from "lucide-react";

export default function NewAssessmentPage() {
  const router = useRouter();
  const { t, tr, formatClass, formatSubject, formatStatus } = useLanguage();
  const an = t.assessments.new;

  const [title, setTitle] = useState("Class 4: Division & Multiplication Check");
  const [classroomId, setClassroomId] = useState("cls-4a");
  const [subjectCode, setSubjectCode] = useState<string>("MATH");
  const [assessmentDate, setAssessmentDate] = useState("2026-10-18");
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(["c-div-01"]);

  const [students, setStudents] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { marks: number; notes: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [resStd, resAsm] = await Promise.all([
          fetch(`/api/students?classroomId=${classroomId}`),
          fetch("/api/assessments"),
        ]);
        const [dataStd, dataAsm] = await Promise.all([resStd.json(), resAsm.json()]);

        if (dataStd.success) {
          setStudents(dataStd.students || []);
          // Initialize scores map with default scores
          const initialScores: Record<string, { marks: number; notes: string }> = {};
          dataStd.students.forEach((s: any) => {
            initialScores[s.id] = { marks: 15, notes: "" };
          });
          setScores(initialScores);
        }

        if (dataAsm.success) {
          setConcepts(dataAsm.concepts || []);
        }
      } catch (e) {
        console.error("Failed to load setup data", e);
      }
    }
    loadData();
  }, [classroomId]);

  useEffect(() => {
    if (concepts.length > 0) {
      const match = concepts.filter((c) => c.subjectCode === subjectCode);
      if (match.length > 0) {
        setSelectedConcepts([match[0].id]);
      }
    }
  }, [subjectCode, concepts]);

  const handleScoreChange = (studentId: string, marksVal: string) => {
    const num = Math.min(maxMarks, Math.max(0, parseFloat(marksVal) || 0));
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: num },
    }));
  };

  const handleNotesChange = (studentId: string, notesVal: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes: notesVal },
    }));
  };

  const toggleConcept = (conceptId: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(conceptId) ? prev.filter((id) => id !== conceptId) : [...prev, conceptId]
    );
  };

  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) {
      setError(an.titleRequired);
      return;
    }
    if (selectedConcepts.length === 0) {
      setError(an.conceptRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Map scores to results array
      const scoresPayload = Object.keys(scores).map((studentId) => ({
        studentId,
        conceptId: selectedConcepts[0], // primary concept
        marksObtained: scores[studentId].marks,
        notes: scores[studentId].notes,
      }));

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          subjectId: `sub-${subjectCode.toLowerCase()}`,
          subjectCode,
          title,
          assessmentDate,
          maxMarks,
          conceptIds: selectedConcepts,
          status: publish ? "published" : "draft",
          scores: scoresPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        broadcastDataUpdate("assessments", "create", data.assessment?.id);
        broadcastDataUpdate("gaps", "update");
        broadcastDataUpdate("results", "create");
        router.push("/assessments");
      } else {
        setError(data.error || an.createFailed);
      }
    } catch {
      setError(an.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const relevantConcepts = concepts.filter((c) => c.subjectCode === subjectCode);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6862] hover:text-[#49352F]"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{an.backToAssessments}</span>
        </Link>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#49352F] tracking-tight font-heading">
            {an.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6862] mt-0.5">
            {an.pageSubtitle}
          </p>
        </div>

        {/* Assessment Settings Card */}
        <Card className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                {an.assessmentTitleLabel}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={an.assessmentTitlePlaceholder}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs font-semibold text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                {an.dateLabel}
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                {an.classroomLabel}
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden cursor-pointer"
              >
                <option value="cls-1a">{formatClass("Class 1 - Section A")}</option>
                <option value="cls-2a">{formatClass("Class 2 - Section A")}</option>
                <option value="cls-3a">{formatClass("Class 3 - Section A")}</option>
                <option value="cls-4a">{formatClass("Class 4 - Section A")}</option>
                <option value="cls-5a">{formatClass("Class 5 - Section A")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                {an.subjectLabel}
              </label>
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden cursor-pointer"
              >
                <option value="MATH">{formatSubject("MATH")}</option>
                <option value="ENG">{formatSubject("ENG")}</option>
                <option value="GUJ">{formatSubject("GUJ")}</option>
                <option value="EVS">{formatSubject("EVS")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49352F] mb-1">
                {an.maxMarksLabel}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-[#49352F]/15 bg-white p-2.5 text-xs font-semibold text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
              />
            </div>
          </div>

          {/* Concepts Selector */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#49352F] mb-2">
              {an.selectConceptsLabel}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {relevantConcepts.map((c) => {
                const isSelected = selectedConcepts.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleConcept(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#49352F] bg-[#F2CAB3] text-[#49352F] font-bold shadow-2xs"
                        : "border-[#49352F]/12 bg-white text-[#7A6862] hover:bg-[#FAF6E9]"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Student Marks Entry Grid */}
        <Card className="space-y-4">
          <CardHeader className="mb-0">
            <div>
              <CardTitle>{an.recordMarksHeading}</CardTitle>
              <CardDescription>
                {tr("assessments.new.recordMarksSubtitle", { max: maxMarks })}
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#FAF6E9] border-b border-[#49352F]/10 text-[#7A6862] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">{an.studentCol}</th>
                  <th className="p-3">
                    {tr("assessments.new.marksRangeHeader", { max: maxMarks })}
                  </th>
                  <th className="p-3">{an.calculatedPctCol}</th>
                  <th className="p-3">{an.masteryStatusCol}</th>
                  <th className="p-3">{an.teacherNotesCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/10">
                {students.map((std) => {
                  const studentScore = scores[std.id]?.marks ?? 12;
                  const pct = calculatePercentage(studentScore, maxMarks);
                  const status =
                    pct >= 80 ? "Mastered" : pct >= 60 ? "Developing" : "Needs Support";
                  const statusLabel = formatStatus(status);

                  return (
                    <tr key={std.id} className="hover:bg-[#FAF6E9]/50">
                      <td className="p-3">
                        <div className="font-bold text-[#49352F]">{std.displayName}</div>
                        <div className="text-[10px] font-mono text-[#7A6862]">{std.studentCode}</div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={maxMarks}
                          value={scores[std.id]?.marks ?? ""}
                          onChange={(e) => handleScoreChange(std.id, e.target.value)}
                          className="w-20 rounded-lg border border-[#49352F]/15 bg-white p-1.5 text-xs font-bold text-[#49352F] focus:border-[#B26A1B] focus:ring-1 focus:ring-[#B26A1B] outline-hidden"
                        />
                      </td>
                      <td className="p-3 font-bold text-[#49352F]">{pct}%</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            status === "Mastered"
                              ? "mastered"
                              : status === "Developing"
                              ? "developing"
                              : "needsSupport"
                          }
                          size="sm"
                        >
                          {statusLabel}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder={an.optionalObsPlaceholder}
                          value={scores[std.id]?.notes ?? ""}
                          onChange={(e) => handleNotesChange(std.id, e.target.value)}
                          className="w-full rounded-lg border border-[#49352F]/15 bg-white p-1.5 text-xs text-[#49352F] placeholder-[#7A6862]/60 focus:border-[#B26A1B] outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#49352F] bg-white hover:bg-[#FAF6E9] rounded-xl border border-[#49352F]/15 shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{an.saveDraftBtn}</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-[#49352F] bg-[#F2CAB3] hover:bg-white border border-[#49352F]/16 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSubmitting ? an.savingBtn : an.publishBtn}
            </span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
