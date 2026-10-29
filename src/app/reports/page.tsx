"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { useLanguage } from "@/context/LanguageContext";
import {
  FileText,
  Printer,
  Download,
  Users,
  Award,
  Sparkles,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  BrainCircuit,
} from "lucide-react";

export default function ReportsPage() {
  const { t, language } = useLanguage();

  const [reportType, setReportType] = useState<
    "student" | "classGap" | "parentSummary"
  >("student");
  const [selectedStudentId, setSelectedStudentId] = useState("std-aarav");
  const [students, setStudents] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resStd, resGaps, resPlans] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/learning-gaps"),
          fetch("/api/remedial-plans"),
        ]);
        const [dataStd, dataGaps, dataPlans] = await Promise.all([
          resStd.json(),
          resGaps.json(),
          resPlans.json(),
        ]);

        if (dataStd.success) setStudents(dataStd.students || []);
        if (dataGaps.success) setGaps(dataGaps.gaps || []);
        if (dataPlans.success) setPlans(dataPlans.plans || []);
      } catch (e) {
        console.error("Failed to load report data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentGaps = gaps.filter((g) => g.studentId === selectedStudent?.id);
  const studentPlans = plans.filter((p) => p.studentId === selectedStudent?.id);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Student", "Code", "Class", "Concept", "LatestScore", "Status", "Priority"];
    const rows = gaps.map((g) => [
      `"${g.studentName}"`,
      g.studentId,
      `Class ${g.grade}-A`,
      `"${g.conceptName}"`,
      `${g.latestPercentage}%`,
      g.masteryStatus,
      g.priority,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shikshasetu_learning_gaps_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header - Hidden on Print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === "gu" ? "પ્રગતિ પત્રક અને સત્તાવાર અહેવાલો" : "Official Report Cards & A4 Sheets"}
              </h1>
              <Badge variant="saffron" size="sm">
                A4 Print Ready
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Printable official Gujarat primary progress cards, parent-friendly summaries, and CSV data audits.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="rounded-full text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{t.actions.exportCsv}</span>
            </Button>
            <div data-tour="report-print">
              <Button
                variant="saffron"
                size="sm"
                onClick={handlePrint}
                className="rounded-full text-xs font-bold shadow-md shadow-amber-500/20"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                <span>{t.actions.printReport}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Report Type Selector & Student Chooser - Hidden on Print */}
        <Card variant="glass" className="p-4 flex flex-wrap items-center justify-between gap-3 border-slate-800 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReportType("student")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                reportType === "student"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Individual Student Report
            </button>
            <button
              type="button"
              onClick={() => setReportType("parentSummary")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                reportType === "parentSummary"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Parent-Friendly Summary
            </button>
            <button
              type="button"
              onClick={() => setReportType("classGap")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                reportType === "classGap"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Class Learning-Gap Audit
            </button>
          </div>

          {(reportType === "student" || reportType === "parentSummary") && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Select Student:</span>
              <select
                value={selectedStudentId}
                aria-label="Select student for report"
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white outline-hidden cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} (Class {s.grade}-{s.section})
                  </option>
                ))}
              </select>
            </div>
          )}
        </Card>

        {/* ============================================================== */}
        {/* REPORT CANVAS (PRINT READY A4 FORMAT)                           */}
        {/* ============================================================== */}
        <div data-tour="report-card" className="rounded-3xl border border-slate-800 bg-[#FFF8EC] text-slate-900 p-8 sm:p-12 shadow-2xl print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Official Gujarat Primary Education Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#14123D] text-amber-400 flex items-center justify-center font-heading font-black text-2xl shadow-sm shrink-0">
                શ
              </div>
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase">
                  Model Primary School, Gandhinagar
                </h2>
                <p className="text-xs text-slate-700 font-semibold mt-0.5">
                  Gujarat State Primary Education Department • SFIC Problem Statement PS-60
                </p>
                <p className="text-[11px] text-slate-500">
                  School Code: GUJ-GNR-042 • Academic Year: 2026–27
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                Official Report Card
              </span>
              <div className="text-[11px] text-slate-600 mt-1.5 font-medium">
                Generated: {new Date().toLocaleDateString("en-IN")}
              </div>
            </div>
          </div>

          {/* REPORT 1: INDIVIDUAL STUDENT REPORT */}
          {reportType === "student" && (
            <div className="space-y-6">
              {/* Student Metadata Box */}
              <div className="bg-white/80 p-4 rounded-2xl border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                    Student Name
                  </span>
                  <span className="text-sm font-bold text-slate-950">
                    {selectedStudent?.displayName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                    Roll Code
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {selectedStudent?.studentCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                    Class &amp; Section
                  </span>
                  <span className="text-sm font-bold text-slate-950">
                    Class {selectedStudent?.grade} - Section {selectedStudent?.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                    Enrollment Status
                  </span>
                  <span className="text-sm font-bold text-emerald-700">Active Primary</span>
                </div>
              </div>

              {/* Learning Gaps Overview & Bridge Progress */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Concept Mastery &amp; The Learning Bridge
                </h3>

                <div className="space-y-3">
                  {studentGaps.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-300">
                      No learning gaps currently flagged. Student is demonstrating expected mastery.
                    </div>
                  ) : (
                    studentGaps.map((g) => (
                      <div
                        key={g.id}
                        className="p-4 rounded-2xl bg-white border border-slate-300 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-950 text-sm">
                              {g.conceptName}
                            </span>
                            <span className="text-slate-500 ml-2">({g.subjectName || "Mathematics"})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{g.latestPercentage}%</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                g.latestPercentage >= 80
                                  ? "bg-emerald-100 text-emerald-800"
                                  : g.latestPercentage >= 60
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {g.latestPercentage >= 80 ? "Mastered" : g.latestPercentage >= 60 ? "Developing" : "Needs Support"}
                            </span>
                          </div>
                        </div>

                        {/* Bridge Progress */}
                        <BridgeProgress
                          score={g.latestPercentage}
                          previousScore={g.previousPercentage}
                          studentName={selectedStudent?.displayName}
                          height="sm"
                        />

                        {g.reason && (
                          <p className="text-[11px] text-slate-700 italic border-t border-slate-100 pt-1.5">
                            <strong className="text-slate-900 not-italic">Diagnosis:</strong> {g.reason}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Remedial Interventions Prescribed */}
              {studentPlans.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-heading text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Prescribed 5-Step Concrete Remedial Actions
                  </h3>
                  {studentPlans.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-white border border-slate-300 text-xs space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-sm">{p.conceptName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-slate-700"><strong>Pedagogical Objective:</strong> {p.learningObjective}</p>
                      <p className="text-slate-700"><strong>Manipulatives Used:</strong> {p.requiredMaterials?.join(", ")}</p>
                      <p className="text-slate-700"><strong>Reassessment Criteria:</strong> {p.reassessmentCriteria}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORT 2: PARENT FRIENDLY SUMMARY */}
          {reportType === "parentSummary" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-100/70 to-orange-100/50 border border-amber-300">
                <h3 className="font-heading text-base font-bold text-amber-950">
                  Dear Parents / Guardians of {selectedStudent?.displayName},
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  At Model Primary School, we use ShikshaSetu AI to understand each child&apos;s individual learning style and ensure no fundamental concepts are missed. This summary highlights what your child does well and simple, fun ways you can support them at home.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-2 shadow-2xs">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Areas of Strength &amp; Growth</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 ml-4 list-disc text-xs">
                    <li>Active classroom participation and creative problem-solving.</li>
                    <li>Strong curiosity during science, environmental, and storytelling lessons.</li>
                    <li>Shows steady improvement when working with visual diagrams and hands-on objects.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-2 shadow-2xs">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Concepts Currently Practicing</span>
                  </h4>
                  {studentGaps.map((g) => (
                    <div key={g.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-900">{g.conceptName}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Focus: Practicing equal grouping using everyday objects like spoons, buttons, or beads.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-300 text-xs space-y-1.5 shadow-2xs">
                <span className="font-bold text-slate-900">Recommended Everyday Home Activities:</span>
                <p className="text-slate-700">
                  • Spend 10 minutes sharing snacks (e.g. 12 biscuits among 3 family members) to reinforce division as equal sharing.
                </p>
                <p className="text-slate-700">
                  • Encourage daily 15-minute Gujarati and English bedtime story reading.
                </p>
              </div>
            </div>
          )}

          {/* REPORT 3: CLASS GAP AUDIT */}
          {reportType === "classGap" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-700 pb-2 border-b border-slate-300">
                <span className="font-bold text-sm">Class 4-A Learning-Gap Comprehensive Audit ({gaps.length} Gaps)</span>
                <span>Threshold: 60% Developing • 80% Mastery</span>
              </div>

              <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Concept Roadblock</th>
                      <th className="p-3">Latest %</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {gaps.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{g.studentName}</td>
                        <td className="p-3 font-mono text-slate-600">{g.subjectCode}</td>
                        <td className="p-3 font-semibold text-slate-800">{g.conceptName}</td>
                        <td className="p-3 font-bold text-slate-900">{g.latestPercentage}%</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.priority === "High"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {g.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.status === "Resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-indigo-100 text-indigo-800"
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Official Signatures Row */}
          <div className="mt-12 pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-xs text-slate-700">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400" />
              <span className="block mt-1.5 font-bold text-slate-900">Class Teacher Signature</span>
              <span className="text-[10px] text-slate-500">Pooja Sharma (Primary Educator)</span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400" />
              <span className="block mt-1.5 font-bold text-slate-900">Principal / Administrator</span>
              <span className="text-[10px] text-slate-500">Principal R.K. Trivedi</span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400" />
              <span className="block mt-1.5 font-bold text-slate-900">Parent / Guardian Signature</span>
              <span className="text-[10px] text-slate-500">Date: ____________</span>
            </div>
          </div>
        </div>
      </div>
      {/* Guided Tour */}
      <SpotlightTour page="reports" />
    </AppLayout>
  );
}
