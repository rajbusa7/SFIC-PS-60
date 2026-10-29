"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { calculatePercentage } from "@/lib/engine/calculations";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  User,
  Users,
  Sparkles,
} from "lucide-react";

function NewAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStudentParam = searchParams.get("studentId");
  const initialClassroomParam = searchParams.get("classroomId");

  const { t } = useLanguage();

  // Mode: "single" for one student, "class" for whole classroom roster
  const [entryMode, setEntryMode] = useState<"class" | "single">(
    initialStudentParam ? "single" : "class"
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentParam || "");

  const [title, setTitle] = useState("Formative Evaluation Check");
  const [classroomId, setClassroomId] = useState(initialClassroomParam || "cls-4a");
  const [subjectCode, setSubjectCode] = useState<"MATH" | "ENG" | "GUJ" | "EVS">("MATH");
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

  // Single student specific marks
  const [singleStudentMarks, setSingleStudentMarks] = useState<string>("15");
  const [singleStudentNotes, setSingleStudentNotes] = useState<string>("");

  // Classroom roster scores: studentId -> { marks, notes }
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { marks: number | string; notes: string }>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load classroom students and concepts
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [resStd, resAsm, resAllStd] = await Promise.all([
          fetch(`/api/students?classroomId=${classroomId}`),
          fetch("/api/assessments"),
          fetch("/api/students"),
        ]);
        const [dataStd, dataAsm, dataAllStd] = await Promise.all([
          resStd.json(),
          resAsm.json(),
          resAllStd.json(),
        ]);

        if (dataStd.success) {
          const list = dataStd.students || [];
          setStudents(list);

          // Populate initial scores
          const initialScores: Record<string, { marks: number | string; notes: string }> = {};
          list.forEach((s: any) => {
            initialScores[s.id] = { marks: 15, notes: "" };
          });
          setScores(initialScores);
        }

        if (dataAllStd.success) {
          setAllStudents(dataAllStd.students || []);
          if (initialStudentParam) {
            const matched = (dataAllStd.students || []).find((s: any) => s.id === initialStudentParam);
            if (matched) {
              setSelectedStudentId(matched.id);
              if (matched.classroomId) setClassroomId(matched.classroomId);
            }
          }
        }

        if (dataAsm.success && Array.isArray(dataAsm.concepts)) {
          setConcepts(dataAsm.concepts);
        }
      } catch (e) {
        console.error("Failed to load setup data", e);
        setError("Failed to load students and curriculum concepts");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [classroomId, initialStudentParam]);

  // When subject changes, select first relevant concept
  useEffect(() => {
    const relevant = concepts.filter((c) => c.subjectCode === subjectCode);
    if (relevant.length > 0) {
      setSelectedConcepts([relevant[0].id]);
      setTitle(`${relevant[0].name} Diagnostic Check`);
    } else {
      setSelectedConcepts([]);
    }
  }, [subjectCode, concepts]);

  // When single student selection changes, sync classroom
  const handleSelectSingleStudent = (sId: string) => {
    setSelectedStudentId(sId);
    const found = allStudents.find((s) => s.id === sId);
    if (found && found.classroomId && found.classroomId !== classroomId) {
      setClassroomId(found.classroomId);
    }
  };

  const handleScoreChange = (studentId: string, marksVal: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: marksVal },
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

  const relevantConcepts = concepts.filter((c) => c.subjectCode === subjectCode);

  const handleSubmit = async (publish: boolean) => {
    // Validation
    if (!title.trim()) {
      setError("Please enter an assessment title.");
      return;
    }
    if (selectedConcepts.length === 0) {
      setError("Please select at least one competency or learning outcome evaluated.");
      return;
    }
    if (isNaN(maxMarks) || maxMarks <= 0) {
      setError("Maximum marks must be greater than zero.");
      return;
    }

    let scoresPayload: Array<{
      studentId: string;
      conceptId: string;
      marksObtained: number;
      notes?: string;
    }> = [];

    if (entryMode === "single") {
      if (!selectedStudentId) {
        setError("Please select a student for this assessment.");
        return;
      }
      const obtained = parseFloat(singleStudentMarks);
      if (isNaN(obtained)) {
        setError("Please enter the marks obtained.");
        return;
      }
      if (obtained < 0) {
        setError("Marks obtained cannot be negative.");
        return;
      }
      if (obtained > maxMarks) {
        setError(`Marks obtained (${obtained}) cannot exceed maximum marks (${maxMarks}).`);
        return;
      }

      scoresPayload = [
        {
          studentId: selectedStudentId,
          conceptId: selectedConcepts[0],
          marksObtained: obtained,
          notes: singleStudentNotes.trim(),
        },
      ];
    } else {
      if (students.length === 0) {
        setError("No students found in the selected classroom.");
        return;
      }

      for (const std of students) {
        const valStr = String(scores[std.id]?.marks ?? "");
        const num = parseFloat(valStr);
        if (isNaN(num)) {
          setError(`Please provide valid marks for student ${std.displayName}.`);
          return;
        }
        if (num < 0) {
          setError(`Marks obtained for ${std.displayName} cannot be negative.`);
          return;
        }
        if (num > maxMarks) {
          setError(`Marks for ${std.displayName} (${num}) cannot exceed maximum marks (${maxMarks}).`);
          return;
        }
        scoresPayload.push({
          studentId: std.id,
          conceptId: selectedConcepts[0],
          marksObtained: num,
          notes: scores[std.id]?.notes?.trim() || "",
        });
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          subjectId: `sub-${subjectCode.toLowerCase()}`,
          subjectCode,
          title: title.trim(),
          assessmentDate,
          maxMarks,
          conceptIds: selectedConcepts,
          status: publish ? "published" : "draft",
          scores: scoresPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (entryMode === "single" && selectedStudentId) {
          router.push(`/students/${selectedStudentId}`);
        } else {
          router.push("/assessments");
        }
      } else {
        setError(data.error || "Failed to record assessment.");
      }
    } catch {
      setError("Network error submitting assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single student live metrics
  const singleObtainedNum = parseFloat(singleStudentMarks);
  const singleHasMarks = !isNaN(singleObtainedNum) && singleStudentMarks.trim() !== "";
  const singlePct = singleHasMarks && maxMarks > 0 ? calculatePercentage(singleObtainedNum, maxMarks) : 0;
  const singleStatus =
    !singleHasMarks
      ? null
      : singlePct >= 80
      ? "Mastered"
      : singlePct >= 60
      ? "Developing"
      : "Needs Support";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessments</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Record Concept Assessment
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Input student scores mapped directly to curriculum outcomes to update the learning gap bridge.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setEntryMode("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryMode === "single"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single Student</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("class")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryMode === "class"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Whole Classroom</span>
            </button>
          </div>
        </div>

        {/* Assessment Configuration Card */}
        <Card variant="glass" className="p-5 space-y-4 border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assessment Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 3 Division & Multiplication Check"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-semibold text-white focus:border-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assessment Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {entryMode === "class" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Classroom</label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:border-amber-500 outline-hidden"
                >
                  <option value="cls-3a">Class 3 - Section A</option>
                  <option value="cls-4a">Class 4 - Section A</option>
                  <option value="cls-5a">Class 5 - Section A</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Student <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleSelectSingleStudent(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:border-amber-500 outline-hidden font-bold"
                >
                  <option value="">-- Choose Student --</option>
                  {allStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.displayName} ({std.studentCode}) - Class {std.grade}-{std.section}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:border-amber-500 outline-hidden"
              >
                <option value="MATH">Mathematics (ગણિત)</option>
                <option value="ENG">English</option>
                <option value="GUJ">Gujarati (ગુજરાતી)</option>
                <option value="EVS">Environmental Studies (પર્યાવરણ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maximum Marks <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-bold text-white focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Competency / Concept Selector */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Evaluated Competency / Learning Outcome <span className="text-rose-400">*</span>
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
                        ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-xs"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {c.name} {c.nameGujarati ? `(${c.nameGujarati})` : ""}
                  </button>
                );
              })}
              {relevantConcepts.length === 0 && (
                <span className="text-xs text-slate-500 italic">No concepts found for {subjectCode}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Single Student Score Entry Form */}
        {entryMode === "single" && (
          <Card variant="glass" className="p-5 space-y-4 border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-white">Student Score & Observations</h3>
                <p className="text-xs text-slate-400">
                  Enter marks obtained out of {maxMarks}. Percentage and learning gap statuses update automatically.
                </p>
              </div>
              <Badge variant="outline" size="sm">
                Target: {selectedConcepts[0] || "None selected"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Marks Obtained (0 &ndash; {maxMarks}) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxMarks > 0 ? maxMarks : undefined}
                  step="any"
                  value={singleStudentMarks}
                  onChange={(e) => setSingleStudentMarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-base font-bold text-amber-400 focus:border-amber-500 outline-hidden"
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Calculated Percentage</span>
                  <span className="text-2xl font-black text-white">
                    {singleHasMarks ? `${singlePct}%` : "--"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Mastery Classification</span>
                  {singleStatus ? (
                    <Badge
                      variant={
                        singleStatus === "Mastered"
                          ? "mastered"
                          : singleStatus === "Developing"
                          ? "developing"
                          : "needsSupport"
                      }
                      size="sm"
                      dot
                    >
                      {singleStatus}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-500">Awaiting score</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teacher Notes / Observations (Optional)
              </label>
              <textarea
                rows={2}
                value={singleStudentNotes}
                onChange={(e) => setSingleStudentNotes(e.target.value)}
                placeholder="Qualitative observations during evaluation..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
              />
            </div>
          </Card>
        )}

        {/* Whole Classroom Roster Grid */}
        {entryMode === "class" && (
          <Card variant="glass" className="space-y-4 border-slate-800">
            <CardHeader className="mb-0">
              <div>
                <CardTitle>Record Marks by Classroom Roster</CardTitle>
                <CardDescription>
                  Enter marks obtained out of {maxMarks}. Percentage and gap detection update automatically.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Marks (0 &ndash; {maxMarks})</th>
                    <th className="p-3">Calculated %</th>
                    <th className="p-3">Mastery Status</th>
                    <th className="p-3">Teacher Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.map((std) => {
                    const studentMarksVal = scores[std.id]?.marks ?? 12;
                    const num = parseFloat(String(studentMarksVal)) || 0;
                    const pct = calculatePercentage(num, maxMarks);
                    const status =
                      pct >= 80 ? "Mastered" : pct >= 60 ? "Developing" : "Needs Support";

                    return (
                      <tr key={std.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <div className="font-bold text-white">{std.displayName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{std.studentCode}</div>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max={maxMarks}
                            value={scores[std.id]?.marks ?? ""}
                            onChange={(e) => handleScoreChange(std.id, e.target.value)}
                            className="w-20 rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs font-bold text-amber-400 focus:border-amber-500 outline-hidden"
                          />
                        </td>
                        <td className="p-3 font-bold text-white">{pct}%</td>
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
                            dot
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Observations..."
                            value={scores[std.id]?.notes ?? ""}
                            onChange={(e) => handleNotesChange(std.id, e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Submission Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-full shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Publishing & Recalculating..." : "Publish & Recalculate Gaps"}</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
            Loading assessment builder...
          </div>
        </AppLayout>
      }
    >
      <NewAssessmentContent />
    </Suspense>
  );
}
