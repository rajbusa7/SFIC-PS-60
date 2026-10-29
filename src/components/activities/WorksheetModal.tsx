"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Plus, Trash2, FileSpreadsheet, AlertCircle } from "lucide-react";
import type { WorksheetData, WorksheetQuestion, SubjectCode } from "@/lib/types";

interface WorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (ws: WorksheetData) => void;
  worksheetToEdit?: WorksheetData | null;
  concepts?: { id: string; name: string; subjectCode: string }[];
  remedialPlans?: { id: string; studentName?: string; conceptName?: string }[];
}

export function WorksheetModal({
  isOpen,
  onClose,
  onSaved,
  worksheetToEdit,
  concepts = [],
  remedialPlans = [],
}: WorksheetModalProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [subjectCode, setSubjectCode] = useState<SubjectCode>("MATH");
  const [grade, setGrade] = useState(4);
  const [concept, setConcept] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [remedialPlanId, setRemedialPlanId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [instructions, setInstructions] = useState(
    "Read each question carefully and write your answers with neat step-by-step working."
  );
  const [teacherGuidelines, setTeacherGuidelines] = useState("");
  const [questions, setQuestions] = useState<WorksheetQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worksheetToEdit) {
      setTitle(worksheetToEdit.title || "");
      setSubject(worksheetToEdit.subject || "Mathematics");
      setSubjectCode(worksheetToEdit.subjectCode || "MATH");
      setGrade(worksheetToEdit.grade || 4);
      setConcept(worksheetToEdit.concept || "");
      setConceptId(worksheetToEdit.conceptId || "");
      setRemedialPlanId(worksheetToEdit.remedialPlanId || "");
      setStudentName(worksheetToEdit.studentName || "");
      setDifficulty(worksheetToEdit.difficulty || "Medium");
      setInstructions(worksheetToEdit.instructions || "Read each question carefully.");
      setTeacherGuidelines(worksheetToEdit.teacherGuidelines || "");
      setQuestions(worksheetToEdit.questions || []);
    } else {
      setTitle("");
      setSubject("Mathematics");
      setSubjectCode("MATH");
      setGrade(4);
      const defaultConcept = concepts[0];
      setConcept(defaultConcept?.name || "Division Basics & Equal Sharing");
      setConceptId(defaultConcept?.id || "c-div-01");
      setRemedialPlanId("");
      setStudentName("");
      setDifficulty("Medium");
      setInstructions(
        "Read each problem carefully and write your answers with neat step-by-step working."
      );
      setTeacherGuidelines("Encourage using concrete manipulative counters to model solutions.");
      setQuestions([
        {
          questionNumber: 1,
          question: "",
          marks: 2,
          type: "word_problem",
          answerKey: "",
          stepExplanation: "",
        },
      ]);
    }
    setError(null);
  }, [isOpen, worksheetToEdit, concepts]);

  const handleConceptSelect = (cId: string) => {
    setConceptId(cId);
    const found = concepts.find((c) => c.id === cId);
    if (found) {
      setConcept(found.name);
      if (found.subjectCode) {
        setSubjectCode(found.subjectCode as SubjectCode);
        setSubject(
          found.subjectCode === "MATH"
            ? "Mathematics"
            : found.subjectCode === "ENG"
            ? "English"
            : found.subjectCode === "GUJ"
            ? "Gujarati"
            : "EVS"
        );
      }
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionNumber: prev.length + 1,
        question: "",
        marks: 2,
        type: "word_problem",
        answerKey: "",
        stepExplanation: "",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setError("Worksheet must have at least one exercise question.");
      return;
    }
    setQuestions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, questionNumber: i + 1 }))
    );
  };

  const updateQuestion = (idx: number, patch: Partial<WorksheetQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide a worksheet title.");
      return;
    }
    if (!concept.trim()) {
      setError("Please specify the learning competency/concept.");
      return;
    }
    if (questions.length === 0) {
      setError("At least one exercise question is required.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} is missing question text.`);
        return;
      }
      if (!q.marks || Number(q.marks) <= 0) {
        setError(`Question ${i + 1} must have a valid positive mark value.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 2), 0);
      const payload = {
        id: worksheetToEdit?.id,
        title: title.trim(),
        subject: subject.trim(),
        subjectCode,
        grade: Number(grade),
        concept: concept.trim(),
        conceptId: conceptId || undefined,
        remedialPlanId: remedialPlanId || undefined,
        studentName: studentName.trim() || undefined,
        difficulty,
        instructions: instructions.trim(),
        totalMarks,
        teacherGuidelines: teacherGuidelines.trim() || undefined,
        questions: questions.map((q, idx) => ({
          questionNumber: idx + 1,
          question: q.question.trim(),
          marks: Number(q.marks) || 2,
          type: q.type || "word_problem",
          options: q.options,
          answerKey: q.answerKey?.trim() || "",
          stepExplanation: q.stepExplanation?.trim() || "",
        })),
      };

      const url = "/api/worksheets";
      const method = worksheetToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save worksheet.");
        setIsSubmitting(false);
        return;
      }

      onSaved(data.worksheet);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={worksheetToEdit ? `Edit Worksheet: ${worksheetToEdit.title}` : "Create Printable Remedial Worksheet"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Worksheet Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Equal Sharing & Division Word Problems Worksheet"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Subject *</label>
            <select
              value={subjectCode}
              onChange={(e) => {
                const code = e.target.value as SubjectCode;
                setSubjectCode(code);
                setSubject(
                  code === "MATH"
                    ? "Mathematics"
                    : code === "ENG"
                    ? "English"
                    : code === "GUJ"
                    ? "Gujarati"
                    : "EVS"
                );
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden cursor-pointer"
            >
              <option value="MATH">Mathematics</option>
              <option value="ENG">English</option>
              <option value="GUJ">Gujarati</option>
              <option value="EVS">EVS</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Class / Grade *</label>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((g) => (
                <option key={g} value={g}>
                  Class {g}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Learning Competency / Concept *</label>
            <select
              value={conceptId}
              onChange={(e) => handleConceptSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden cursor-pointer"
            >
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.subjectCode}] {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Associate with Remedial Plan (Optional)</label>
            <select
              value={remedialPlanId}
              onChange={(e) => setRemedialPlanId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden cursor-pointer"
            >
              <option value="">-- No specific plan linkage --</option>
              {remedialPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.studentName ? `${p.studentName}: ` : ""} {p.conceptName || p.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Personalized Student Name (Optional)</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Aarav Patel (Class 4-A)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Student Instructions</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Teacher Guidelines (Optional)</label>
            <input
              type="text"
              value={teacherGuidelines}
              onChange={(e) => setTeacherGuidelines(e.target.value)}
              placeholder="e.g. Encourage students to sketch grouping circles or use pebbles."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden"
            />
          </div>
        </div>

        {/* Questions Header */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Worksheet Exercises & Answer Key</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {questions.length} problems
            </span>
          </h4>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            className="rounded-full text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Exercise</span>
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  Problem #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-500">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={q.marks}
                      onChange={(e) => updateQuestion(idx, { marks: Number(e.target.value) })}
                      className="w-12 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xs font-bold"
                    />
                  </div>

                  <select
                    value={q.type || "word_problem"}
                    onChange={(e) => updateQuestion(idx, { type: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold cursor-pointer"
                  >
                    <option value="word_problem">Word Problem</option>
                    <option value="numerical">Numerical Equation</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="fill_in_the_blank">Fill in the Blank</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove problem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[11px]">Problem Prompt / Exercise *</label>
                <textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                  placeholder="e.g. Pooja has 20 marbles. She divides them equally into 4 bags..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-[11px]">Teacher's Answer Key</label>
                  <input
                    type="text"
                    value={q.answerKey}
                    onChange={(e) => updateQuestion(idx, { answerKey: e.target.value })}
                    placeholder="e.g. 5 marbles per bag"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px]">Step-by-Step Explanation</label>
                  <input
                    type="text"
                    value={q.stepExplanation}
                    onChange={(e) => updateQuestion(idx, { stepExplanation: e.target.value })}
                    placeholder="e.g. 20 ÷ 4 = 5 because 4 × 5 = 20."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="mint" size="sm" disabled={isSubmitting} className="font-bold">
            {isSubmitting ? "Saving Worksheet..." : worksheetToEdit ? "Update Worksheet" : "Save Worksheet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
