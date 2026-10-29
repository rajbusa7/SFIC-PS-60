"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Plus, Trash2, HelpCircle, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import type { LearningActivity, ActivityQuestion, ActivityType, SubjectCode } from "@/lib/types";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (activity: LearningActivity) => void;
  activityToEdit?: LearningActivity | null;
  concepts?: { id: string; name: string; subjectCode: string }[];
}

export function QuizModal({
  isOpen,
  onClose,
  onSaved,
  activityToEdit,
  concepts = [],
}: QuizModalProps) {
  const [title, setTitle] = useState("");
  const [titleGujarati, setTitleGujarati] = useState("");
  const [subjectCode, setSubjectCode] = useState<SubjectCode>("MATH");
  const [grade, setGrade] = useState(4);
  const [conceptId, setConceptId] = useState("");
  const [conceptName, setConceptName] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [learningObjective, setLearningObjective] = useState("");
  const [questions, setQuestions] = useState<ActivityQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title || "");
      setTitleGujarati(activityToEdit.titleGujarati || "");
      setSubjectCode(activityToEdit.subjectCode || "MATH");
      setGrade(activityToEdit.grade || 4);
      setConceptId(activityToEdit.conceptId || "");
      setConceptName(activityToEdit.conceptName || "");
      setDifficulty(activityToEdit.difficulty || "Easy");
      setEstimatedMinutes(activityToEdit.estimatedMinutes || 10);
      setLearningObjective(activityToEdit.learningObjective || "");
      setQuestions(activityToEdit.questions || []);
    } else {
      setTitle("");
      setTitleGujarati("");
      setSubjectCode("MATH");
      setGrade(4);
      setConceptId(concepts[0]?.id || "c-div-01");
      setConceptName(concepts[0]?.name || "Division Basics & Equal Sharing");
      setDifficulty("Easy");
      setEstimatedMinutes(10);
      setLearningObjective("");
      setQuestions([
        {
          id: `q-1-${Date.now()}`,
          questionText: "",
          type: "mcq",
          options: ["", "", "", ""],
          correctAnswer: "",
          explanation: "",
        },
      ]);
    }
    setError(null);
  }, [isOpen, activityToEdit, concepts]);

  const handleConceptChange = (id: string) => {
    setConceptId(id);
    const found = concepts.find((c) => c.id === id);
    if (found) {
      setConceptName(found.name);
      if (found.subjectCode) setSubjectCode(found.subjectCode as SubjectCode);
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${prev.length + 1}-${Date.now()}`,
        questionText: "",
        type: "mcq",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setError("Quiz must have at least one question.");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, patch: Partial<ActivityQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const updated = { ...q, ...patch };
        // If type changed to true_false, automatically set options
        if (patch.type === "true_false" && q.type !== "true_false") {
          updated.options = ["True", "False"];
          updated.correctAnswer = "True";
        } else if (patch.type === "mcq" && q.type !== "mcq") {
          updated.options = ["", "", "", ""];
          updated.correctAnswer = "";
        }
        return updated;
      })
    );
  };

  const updateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...(q.options || [])];
        const oldVal = opts[optIdx];
        opts[optIdx] = val;
        // If the correct answer matched the old value, update it
        let correct = q.correctAnswer;
        if (correct === oldVal) correct = val;
        return { ...q, options: opts, correctAnswer: correct };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!title.trim()) {
      setError("Please provide a quiz title.");
      return;
    }
    if (!conceptId) {
      setError("Please select a target competency/concept.");
      return;
    }
    if (questions.length === 0) {
      setError("At least one question is required.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setError(`Question ${i + 1} is missing question text.`);
        return;
      }
      if (q.type === "mcq") {
        const filledOpts = (q.options || []).filter((o) => o.trim());
        if (filledOpts.length < 2) {
          setError(`Question ${i + 1} (MCQ) must have at least two non-empty options.`);
          return;
        }
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === "") {
        setError(`Question ${i + 1} must specify a correct answer.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: activityToEdit?.id,
        title: title.trim(),
        titleGujarati: titleGujarati.trim() || undefined,
        subjectCode,
        grade: Number(grade),
        conceptId,
        conceptName: conceptName || conceptId,
        difficulty,
        estimatedMinutes: Number(estimatedMinutes) || 10,
        learningObjective: learningObjective.trim() || undefined,
        activityType: questions[0]?.type || "mcq",
        questions: questions.map((q, idx) => ({
          ...q,
          id: q.id || `q-${idx + 1}`,
          questionText: q.questionText.trim(),
          options: q.type === "mcq" ? q.options?.filter((o) => o.trim()) : q.options,
          correctAnswer: String(q.correctAnswer).trim(),
        })),
      };

      const url = activityToEdit ? "/api/activities" : "/api/activities";
      const method = activityToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save quiz.");
        setIsSubmitting(false);
        return;
      }

      onSaved(data.activity);
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
      title={activityToEdit ? `Edit Quiz: ${activityToEdit.title}` : "Create New Interactive Practice Quiz"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Quiz Title (English) *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Division Equal Sharing Practice"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Quiz Title (Gujarati - Optional)</label>
            <input
              type="text"
              value={titleGujarati}
              onChange={(e) => setTitleGujarati(e.target.value)}
              placeholder="દા.ત. સરખા ભાગ અને જૂથ બનાવવાનો મહાવરો"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Subject *</label>
            <select
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value as SubjectCode)}
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
            <label className="block font-semibold mb-1">Target Competency / Learning Concept *</label>
            <select
              value={conceptId}
              onChange={(e) => handleConceptChange(e.target.value)}
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
            <label className="block font-semibold mb-1">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden cursor-pointer"
            >
              <option value="Easy">Beginner / Easy</option>
              <option value="Medium">Intermediate</option>
              <option value="Hard">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Estimated Minutes</label>
            <input
              type="number"
              min={2}
              max={60}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Relevant Learning Objective</label>
            <input
              type="text"
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
              placeholder="e.g. Understand division as equal sharing using concrete grouping models."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-hidden"
            />
          </div>
        </div>

        {/* Questions Header */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Questions & Validated Answer Keys</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {questions.length} items
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
            <span>Add Question</span>
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                  Question #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(idx, { type: e.target.value as ActivityType })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold cursor-pointer"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_in_the_blank">Fill in the Blank</option>
                    <option value="numerical">Numerical Answer</option>
                    <option value="word_problem">Word Problem</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[11px]">Question Text *</label>
                <textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                  placeholder="Enter the question prompt clearly..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Options for MCQ */}
              {q.type === "mcq" && (
                <div className="space-y-2">
                  <label className="block font-semibold text-[11px]">
                    Options & Mark the Correct Answer *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(q.options || ["", "", "", ""]).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id || idx}`}
                          checked={String(q.correctAnswer).trim() === String(opt).trim() && String(opt).trim() !== ""}
                          onChange={() => updateQuestion(idx, { correctAnswer: opt })}
                          className="w-4 h-4 text-indigo-600 cursor-pointer"
                          title="Select as correct answer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                          placeholder={`Option ${optIdx + 1}`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Radio button selects the verified answer key stored securely on the server.
                  </p>
                </div>
              )}

              {/* True/False selection */}
              {q.type === "true_false" && (
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-[11px]">Correct Answer:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${q.id || idx}`}
                      checked={String(q.correctAnswer).toLowerCase() === "true"}
                      onChange={() => updateQuestion(idx, { correctAnswer: "True" })}
                    />
                    <span>True</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${q.id || idx}`}
                      checked={String(q.correctAnswer).toLowerCase() === "false"}
                      onChange={() => updateQuestion(idx, { correctAnswer: "False" })}
                    />
                    <span>False</span>
                  </label>
                </div>
              )}

              {/* Fill in blank / numerical / word problem input */}
              {q.type !== "mcq" && q.type !== "true_false" && (
                <div>
                  <label className="block font-semibold mb-1 text-[11px]">Correct Answer *</label>
                  <input
                    type="text"
                    value={String(q.correctAnswer || "")}
                    onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                    placeholder="Enter the expected student answer..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-[11px]">Child-Friendly Explanation</label>
                  <input
                    type="text"
                    value={q.explanation || ""}
                    onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                    placeholder="e.g. 12 ÷ 3 = 4 because 3 groups of 4 equal 12."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[11px]">Hint (Optional)</label>
                  <input
                    type="text"
                    value={q.hint || ""}
                    onChange={(e) => updateQuestion(idx, { hint: e.target.value })}
                    placeholder="e.g. Think: what number multiplied by 3 gives 12?"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="saffron" size="sm" disabled={isSubmitting} className="font-bold">
            {isSubmitting ? "Saving Quiz..." : activityToEdit ? "Update Quiz" : "Save Quiz to Bank"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
