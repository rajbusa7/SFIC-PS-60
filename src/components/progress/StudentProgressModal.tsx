"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Printer,
  Clock,
  Target,
  FileText,
} from "lucide-react";

import type { SupportedLanguage } from "@/lib/types";

interface StudentProgressModalProps {
  student: any;
  onClose: () => void;
  language: SupportedLanguage;
  formatSubject: (code: string) => string;
  formatClass: (cls: string) => string;
}

export function StudentProgressModal({
  student,
  onClose,
  language,
  formatSubject,
  formatClass,
}: StudentProgressModalProps) {
  const { t, tr, formatStatus, formatDate } = useLanguage();
  const pm = t.progressModal;
  void language;

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTrendIcon = () => {
    if (student.trend === "improving") {
      return <TrendingUp className="w-4 h-4 text-[#2E7D5E]" />;
    } else if (student.trend === "declining") {
      return <TrendingDown className="w-4 h-4 text-[#C54738]" />;
    }
    return <Minus className="w-4 h-4 text-[#7A6862]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#FAF6E9] border border-[#49352F]/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:max-h-none print:h-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#49352F]/10 bg-white/60 backdrop-blur-sm print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#49352F] text-[#FAF6E9] flex items-center justify-center font-bold font-heading text-lg">
              {student.displayName?.charAt(0) || "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#49352F] font-heading">
                  {student.displayName}
                </h2>
                <Badge variant="outline" size="sm">
                  {student.rollNumber || `ID: ${student.id}`}
                </Badge>
              </div>
              <p className="text-xs text-[#7A6862]">
                {formatClass(`Class ${student.grade}-${student.section}`)} •{" "}
                {pm.academicProfile}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              aria-label="Print student report"
              className="p-2 rounded-xl border border-[#49352F]/15 text-[#49352F] hover:bg-[#F2CAB3]/20 transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{pm.printBtn}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-[#7A6862] hover:text-[#49352F] hover:bg-[#49352F]/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-[#49352F]/10 shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6862] block">
                {pm.overallAverage}
              </span>
              <div className="text-2xl font-extrabold text-[#49352F] font-heading mt-1">
                {student.averageScore !== null ? `${student.averageScore}%` : "—"}
              </div>
              <span className="text-[10px] text-[#7A6862] mt-0.5 block">
                {pm.highestPrefix} {student.highestScore !== null ? `${student.highestScore}%` : "—"}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#49352F]/10 shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6862] block">
                {pm.trendDelta}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {getTrendIcon()}
                <span
                  className={`text-xl font-extrabold font-heading ${
                    (student.deltaPercentagePoints ?? 0) > 0
                      ? "text-[#2E7D5E]"
                      : (student.deltaPercentagePoints ?? 0) < 0
                      ? "text-[#C54738]"
                      : "text-[#7A6862]"
                  }`}
                >
                  {student.deltaPercentagePoints !== null
                    ? `${student.deltaPercentagePoints > 0 ? "+" : ""}${student.deltaPercentagePoints} pp`
                    : "—"}
                </span>
              </div>
              <span className="text-[10px] text-[#7A6862] mt-0.5 block">
                {student.relativeGrowth !== null
                  ? tr("progressModal.relativeUnit", { val: `${student.relativeGrowth > 0 ? "+" : ""}${student.relativeGrowth}` })
                  : pm.singleTest}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#49352F]/10 shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6862] block">
                {pm.questionAccuracy}
              </span>
              <div className="text-2xl font-extrabold text-[#49352F] font-heading mt-1">
                {student.accuracy}%
              </div>
              <span className="text-[10px] text-[#7A6862] mt-0.5 block">
                {tr("progressModal.correctCount", { correct: student.correctAnswers, total: student.totalQuestions })}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#49352F]/10 shadow-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A6862] block">
                {pm.activitiesXp}
              </span>
              <div className="text-2xl font-extrabold text-[#B26A1B] font-heading mt-1">
                {tr("progressModal.doneCount", { count: student.activitiesCompleted })}
              </div>
              <span className="text-[10px] text-[#7A6862] mt-0.5 block">
                {tr("progressModal.earnedXp", { xp: student.xpEarned })}
              </span>
            </div>
          </div>

          {/* Teacher Recommendation Box */}
          <div className="bg-[#FAF6E9] border border-[#B26A1B]/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#B26A1B]/15 text-[#B26A1B] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#49352F] uppercase tracking-wider">
                  {pm.teacherRecTitle}
                </h4>
                <p className="text-xs sm:text-sm text-[#49352F]/90 font-medium leading-relaxed">
                  {student.recommendation}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[#7A6862]">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-[#2E7D5E]" />
                    {tr("progressModal.masteredCount", { count: student.conceptsMasteredCount })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#B26A1B]" />
                    {tr("progressModal.developingCount", { count: student.conceptsDevelopingCount })}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C54738]" />
                    {tr("progressModal.needsSupportCount", { count: student.conceptsSupportCount })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject & Concept Breakdown Table */}
          <div className="bg-white rounded-2xl border border-[#49352F]/10 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#49352F] font-heading flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#B26A1B]" />
                {pm.subjectLedgerTitle}
              </h3>
              <span className="text-xs text-[#7A6862]">
                {tr("progressModal.conceptsEvaluated", { count: student.concepts?.length || 0 })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6E9] border-b border-[#49352F]/10 text-[#7A6862] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5">{pm.colSubject}</th>
                    <th className="p-2.5">{pm.colConcept}</th>
                    <th className="p-2.5 text-center">{pm.colTests}</th>
                    <th className="p-2.5 text-center">{pm.colInitial}</th>
                    <th className="p-2.5 text-center">{pm.colLatest}</th>
                    <th className="p-2.5 text-center">{pm.colDelta}</th>
                    <th className="p-2.5 text-right">{pm.colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#49352F]/10">
                  {student.concepts && student.concepts.length > 0 ? (
                    student.concepts.map((item: any, idx: number) => {
                      const isMastered = item.latestPercentage >= 80;
                      return (
                        <tr key={idx} className="hover:bg-[#FAF6E9]/40">
                          <td className="p-2.5 font-bold text-[#49352F]">
                            {formatSubject(item.subjectCode)}
                          </td>
                          <td className="p-2.5">
                            <div className="font-semibold text-[#49352F]">{item.conceptName}</div>
                            <span className="text-[10px] text-[#7A6862]">{item.chapter}</span>
                          </td>
                          <td className="p-2.5 text-center font-semibold text-[#49352F]">
                            {tr("progressModal.testsCountUnit", { count: item.attemptsCount })}
                          </td>
                          <td className="p-2.5 text-center text-[#7A6862]">
                            {item.initialPercentage}%
                          </td>
                          <td className="p-2.5 text-center font-bold text-[#49352F]">
                            {item.latestPercentage}%
                          </td>
                          <td className="p-2.5 text-center">
                            {item.deltaPercentagePoints !== null ? (
                              <span
                                className={`font-bold ${
                                  item.deltaPercentagePoints > 0
                                    ? "text-[#2E7D5E]"
                                    : item.deltaPercentagePoints < 0
                                    ? "text-[#C54738]"
                                    : "text-[#7A6862]"
                                }`}
                              >
                                {item.deltaPercentagePoints > 0 ? `+${item.deltaPercentagePoints}` : item.deltaPercentagePoints} pp
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#7A6862] italic">
                                {pm.oneTestShort}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <Badge
                              variant={
                                isMastered
                                  ? "mastered"
                                  : item.latestPercentage >= 60
                                  ? "developing"
                                  : "needsSupport"
                              }
                              size="sm"
                            >
                              {formatStatus(isMastered ? "Mastered" : item.latestPercentage >= 60 ? "Developing" : "Needs Support")}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-xs text-[#7A6862]">
                        {pm.noConceptRecords}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assessment Chronology & History */}
          <div className="bg-white rounded-2xl border border-[#49352F]/10 p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#49352F] font-heading flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#B26A1B]" />
              {pm.auditTrailTitle}
            </h3>

            <div className="space-y-2.5">
              {student.concepts?.flatMap((c: any) =>
                c.history.map((h: any, hIdx: number) => ({
                  ...h,
                  conceptName: c.conceptName,
                  subjectCode: c.subjectCode,
                  uniqueKey: `${c.conceptId}-${hIdx}`,
                }))
              )
              ?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              ?.map((entry: any) => (
                <div
                  key={entry.uniqueKey}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/10 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#49352F] flex items-center gap-2">
                      <span>{entry.conceptName}</span>
                      <span className="text-[10px] text-[#7A6862] font-mono">
                        ({formatSubject(entry.subjectCode)})
                      </span>
                    </div>
                    <div className="text-[10px] text-[#7A6862] flex items-center gap-2">
                      <span>{formatDate(entry.date)}</span>
                      <span>•</span>
                      <span>{tr("progressModal.marksPrefix", { marks: entry.marks })}</span>
                      {entry.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-[#49352F]/80">"{entry.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#49352F]">{entry.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3 border-t border-[#49352F]/10 bg-white/60 flex items-center justify-between print:hidden">
          <span className="text-xs text-[#7A6862]">
            {pm.lastAssessmentPrefix}{" "}
            {student.lastAssessmentDate
              ? formatDate(student.lastAssessmentDate)
              : pm.noRecord}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#49352F] text-[#FAF6E9] hover:bg-[#382823] text-xs font-bold transition-colors"
          >
            {pm.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
