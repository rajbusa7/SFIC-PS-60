"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Printer, Eye, EyeOff, FileText, CheckCircle2 } from "lucide-react";
import type { WorksheetData } from "@/lib/types";

interface WorksheetViewModalProps {
  worksheet: WorksheetData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WorksheetViewModal({
  worksheet,
  isOpen,
  onClose,
}: WorksheetViewModalProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  if (!worksheet) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Worksheet: ${worksheet.title}`}
      maxWidth="2xl"
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={showAnswerKey ? "mint" : "outline"}
              size="sm"
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="rounded-full text-xs font-semibold"
            >
              {showAnswerKey ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 mr-1" />
                  <span>Hide Answer Keys</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>Show Answer Keys & Explanations</span>
                </>
              )}
            </Button>
            <span className="text-[11px] text-slate-500">
              {showAnswerKey
                ? "Teacher Master View (Includes solutions)"
                : "Student Practice View (Blank lines for student work)"}
            </span>
          </div>

          <Button
            type="button"
            variant="saffron"
            size="sm"
            onClick={handlePrint}
            className="rounded-full text-xs font-bold"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Print A4 Worksheet</span>
          </Button>
        </div>

        {/* Printable Worksheet Body */}
        <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Model Primary School, Gandhinagar
                </h2>
                <h3 className="text-base font-bold text-indigo-700 mt-0.5">
                  {worksheet.title}
                </h3>
              </div>
              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start">
                Total Marks: {worksheet.totalMarks || worksheet.questions.length * 2}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-700 mt-4 pt-3 border-t border-slate-200">
              <div>Subject: <span className="font-bold">{worksheet.subject}</span></div>
              <div>Class / Grade: <span className="font-bold">Class {worksheet.grade}</span></div>
              <div>Concept: <span className="font-bold">{worksheet.concept}</span></div>
              <div>Date: <span className="underline decoration-slate-400">_______________</span></div>
            </div>

            <div className="mt-3 pt-2 border-t border-dashed border-slate-200 text-xs text-slate-700 flex justify-between">
              <span>
                Student Name:{" "}
                <strong className="underline decoration-slate-400">
                  {worksheet.studentName || "____________________________________"}
                </strong>
              </span>
              <span>Roll / Gr No: ____________</span>
            </div>
          </div>

          {/* Instructions */}
          {worksheet.instructions && (
            <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900">Instructions: </span>
              {worksheet.instructions}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {worksheet.questions?.map((q, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-sm text-slate-900">
                    Q{q.questionNumber || idx + 1}. {q.question}
                  </p>
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    [{q.marks || 2} Marks]
                  </span>
                </div>

                {/* MCQ options if any */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pl-4 pt-1">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="text-xs text-slate-700 flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block"></span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* If answer key shown */}
                {showAnswerKey ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <p className="font-bold flex items-center gap-1 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Answer Key: {q.answerKey || "Verified"}</span>
                    </p>
                    {q.stepExplanation && (
                      <p className="text-[11px] text-emerald-700">
                        <strong>Explanation:</strong> {q.stepExplanation}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Blank writing lines for students */
                  <div className="pt-2 pb-4 border-b border-dashed border-slate-300">
                    <div className="h-10 border-b border-dotted border-slate-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer evaluation box */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-3">
            <div>
              <span>Teacher Evaluation & Signature: </span>
              <span className="inline-block w-40 border-b border-slate-500 ml-1"></span>
            </div>
            <div className="font-bold text-slate-900">
              Score: ______ / {worksheet.totalMarks || worksheet.questions.length * 2}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
