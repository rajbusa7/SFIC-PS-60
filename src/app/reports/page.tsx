"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToDataUpdates } from "@/lib/events";
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
  const { t, language, formatSubject, formatPriority, formatStatus, formatClass } = useLanguage();

  const [reportType, setReportType] = useState<
    "student" | "classGap" | "parentSummary"
  >("student");
  const [selectedStudentId, setSelectedStudentId] = useState("std-aarav");
  const [students, setStudents] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataUpdates(() => {
      loadData();
    });
    return () => unsubscribe();
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
    link.setAttribute("download", `studysaathi_learning_gaps_report.csv`);
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
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#49352F] tracking-tight">
                {t.reports.title || "Official Report Cards & A4 Sheets"}
              </h1>
              <Badge variant="saffron" size="sm">
                {language === "gu" ? "A4 પ્રિન્ટ તૈયાર" : "A4 Print Ready"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-1">
              {t.reports.subtitle || "Printable official Gujarat primary progress cards, parent-friendly summaries, and CSV data audits."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="rounded-full text-xs font-semibold border-[#49352F]/15 bg-white text-[#49352F]"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-[#B26A1B]" />
              <span>{t.actions.exportCsv}</span>
            </Button>
            <div data-tour="report-print">
              <Button
                variant="saffron"
                size="sm"
                onClick={handlePrint}
                className="rounded-full text-xs font-bold shadow-md"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                <span>{t.actions.printReport}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Report Type Selector & Student Chooser - Hidden on Print */}
        <div className="p-4 rounded-2xl bg-white/95 border border-[#49352F]/12 shadow-[0_4px_16px_rgba(73,53,47,0.04)] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReportType("student")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                reportType === "student"
                  ? "bg-[#F2CAB3] text-[#49352F] font-black shadow-xs border border-[#49352F]/15"
                  : "text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9]"
              }`}
            >
              {language === "gu" ? "વ્યક્તિગત વિદ્યાર્થી અહેવાલ" : "Individual Student Report"}
            </button>
            <button
              type="button"
              onClick={() => setReportType("parentSummary")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                reportType === "parentSummary"
                  ? "bg-[#F2CAB3] text-[#49352F] font-black shadow-xs border border-[#49352F]/15"
                  : "text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9]"
              }`}
            >
              {language === "gu" ? "વાલી-અનુકૂળ સારાંશ" : "Parent-Friendly Summary"}
            </button>
            <button
              type="button"
              onClick={() => setReportType("classGap")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                reportType === "classGap"
                  ? "bg-[#F2CAB3] text-[#49352F] font-black shadow-xs border border-[#49352F]/15"
                  : "text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9]"
              }`}
            >
              {language === "gu" ? "વર્ગ શીખવાની ખામીઓનું ઓડિટ" : "Class Learning-Gap Audit"}
            </button>
          </div>

          {(reportType === "student" || reportType === "parentSummary") && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A6862]">
                {language === "gu" ? "વિદ્યાર્થી પસંદ કરો:" : "Select Student:"}
              </span>
              <select
                value={selectedStudentId}
                aria-label="Select student for report"
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="rounded-full border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({formatClass(`Class ${s.grade}-${s.section}`)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* REPORT CANVAS (PRINT READY A4 FORMAT)                           */}
        {/* ============================================================== */}
        <div data-tour="report-card" className="rounded-3xl border border-[#49352F]/12 bg-white text-[#49352F] p-8 sm:p-12 shadow-[0_12px_40px_rgba(73,53,47,0.08)] print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Official Gujarat Primary Education Letterhead */}
          <div className="border-b-2 border-[#49352F]/30 pb-5 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 flex items-center justify-center font-heading font-black text-2xl shadow-xs shrink-0">
                શ
              </div>
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-black text-[#49352F] tracking-tight uppercase">
                  {language === "gu" ? "મોડેલ પ્રાથમિક શાળા, ગાંધીનગર" : "Model Primary School, Gandhinagar"}
                </h2>
                <p className="text-xs text-[#7A6862] font-semibold mt-0.5">
                  {language === "gu"
                    ? "ગુજરાત રાજ્ય પ્રાથમિક શિક્ષણ વિભાગ • SFIC સમસ્યા નિવેદન PS-60"
                    : "Gujarat State Primary Education Department • SFIC Problem Statement PS-60"}
                </p>
                <p className="text-[11px] text-[#7A6862]/80">
                  {language === "gu"
                    ? "શાળા કોડ: GUJ-GNR-042 • શૈક્ષણિક વર્ષ: ૨૦૨૬-૨૭"
                    : "School Code: GUJ-GNR-042 • Academic Year: 2026–27"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-md bg-[#49352F] text-white font-mono text-[10px] font-bold uppercase">
                {language === "gu" ? "સત્તાવાર પ્રગતિ પત્રક" : "Official Report Card"}
              </span>
              <div className="text-[11px] text-[#7A6862] mt-1.5 font-medium">
                {language === "gu" ? "તૈયાર કરેલ:" : "Generated:"} {new Date().toLocaleDateString(language === "gu" ? "gu-IN" : "en-IN")}
              </div>
            </div>
          </div>

          {/* REPORT 1: INDIVIDUAL STUDENT REPORT */}
          {reportType === "student" && (
            <div className="space-y-6">
              {/* Student Metadata Box */}
              <div className="bg-[#FAF6E9] p-4 rounded-2xl border border-[#49352F]/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                    {language === "gu" ? "વિદ્યાર્થીનું નામ" : "Student Name"}
                  </span>
                  <span className="text-sm font-bold text-[#49352F]">
                    {selectedStudent?.displayName}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                    {language === "gu" ? "રોલ કોડ" : "Roll Code"}
                  </span>
                  <span className="text-sm font-mono font-bold text-[#49352F]">
                    {selectedStudent?.studentCode}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                    {language === "gu" ? "વર્ગ અને વિભાગ" : "Class & Section"}
                  </span>
                  <span className="text-sm font-bold text-[#49352F]">
                    {language === "gu"
                      ? `ધોરણ ${selectedStudent?.grade} - વિભાગ ${selectedStudent?.section}`
                      : `Class ${selectedStudent?.grade} - Section ${selectedStudent?.section}`}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A6862] font-semibold block uppercase text-[10px]">
                    {language === "gu" ? "નોંધણી સ્થિતિ" : "Enrollment Status"}
                  </span>
                  <span className="text-sm font-bold text-[#2E7D5E]">
                    {language === "gu" ? "સક્રિય પ્રાથમિક" : "Active Primary"}
                  </span>
                </div>
              </div>

              {/* Learning Gaps Overview & Bridge Progress */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-extrabold text-[#49352F] uppercase tracking-wider">
                  {language === "gu"
                    ? "સંકલ્પના પ્રભુત્વ અને અધ્યયન સેતુ"
                    : "Concept Mastery & The Learning Bridge"}
                </h3>

                <div className="space-y-3">
                  {studentGaps.length === 0 ? (
                    <div className="p-5 text-center text-xs text-[#7A6862] bg-[#FAF6E9] rounded-2xl border border-[#49352F]/15">
                      {language === "gu"
                        ? "હાલમાં કોઈ શીખવાની ખામી નોંધાયેલ નથી. વિદ્યાર્થી અપેક્ષિત પ્રભુત્વ દર્શાવે છે."
                        : "No learning gaps currently flagged. Student is demonstrating expected mastery."}
                    </div>
                  ) : (
                    studentGaps.map((g) => (
                      <div
                        key={g.id}
                        className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-[#49352F] text-sm">
                              {g.conceptName}
                            </span>
                            <span className="text-[#7A6862] ml-2">({formatSubject(g.subjectName || "Mathematics")})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#49352F]">{g.latestPercentage}%</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                g.latestPercentage >= 80
                                  ? "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20"
                                  : g.latestPercentage >= 60
                                  ? "bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/20"
                                  : "bg-rose-100 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {formatStatus(g.latestPercentage >= 80 ? "Mastered" : g.latestPercentage >= 60 ? "Developing" : "Needs Support")}
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
                          <p className="text-[11px] text-[#7A6862] italic border-t border-[#49352F]/10 pt-1.5">
                            <strong className="text-[#49352F] not-italic">
                              {language === "gu" ? "નિદાન:" : "Diagnosis:"}
                            </strong>{" "}
                            {g.reason}
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
                  <h3 className="font-heading text-sm font-extrabold text-[#49352F] uppercase tracking-wider">
                    {language === "gu"
                      ? "સૂચિત ૫-પગલાં પ્રવૃત્તિ આધારિત ઉપચાર પગલાં"
                      : "Prescribed 5-Step Concrete Remedial Actions"}
                  </h3>
                  {studentPlans.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15 text-xs space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#49352F] text-sm">{p.conceptName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#B26A1B]/15 text-[#B26A1B] font-bold text-[10px] border border-[#B26A1B]/20">
                          {formatStatus(p.status)}
                        </span>
                      </div>
                      <p className="text-[#49352F]">
                        <strong className="text-[#49352F]">{language === "gu" ? "શિક્ષણશાસ્ત્રીય ઉદ્દેશ્ય:" : "Pedagogical Objective:"}</strong> {p.learningObjective}
                      </p>
                      <p className="text-[#49352F]">
                        <strong className="text-[#49352F]">{language === "gu" ? "ઉપયોગમાં લીધેલ સાધનો:" : "Manipulatives Used:"}</strong> {p.requiredMaterials?.join(", ")}
                      </p>
                      <p className="text-[#49352F]">
                        <strong className="text-[#49352F]">{language === "gu" ? "પુનઃમૂલ્યાંકન માપદંડ:" : "Reassessment Criteria:"}</strong> {p.reassessmentCriteria}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORT 2: PARENT FRIENDLY SUMMARY */}
          {reportType === "parentSummary" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F2DCB5]/50 to-[#F2CAB3]/40 border border-[#49352F]/15">
                <h3 className="font-heading text-base font-bold text-[#49352F]">
                  {language === "gu"
                    ? `${selectedStudent?.displayName} ના વાલીશ્રી,`
                    : `Dear Parents / Guardians of ${selectedStudent?.displayName},`}
                </h3>
                <p className="text-xs text-[#7A6862] mt-1 leading-relaxed">
                  {language === "gu"
                    ? "મોડેલ પ્રાથમિક શાળા ખાતે, અમે દરેક બાળકની વ્યક્તિગત શીખવાની શૈલીને સમજવા અને કોઈ મૂળભૂત સંકલ્પનાઓ છૂટી ન જાય તે સુનિશ્ચિત કરવા StudySaathi AI નો ઉપયોગ કરીએ છીએ. આ સારાંશ તમારા બાળકની શક્તિઓ અને ઘેર તેમને સહાય કરવાના સરળ, આનંદપ્રદ ઉપાયો દર્શાવે છે."
                    : "At Model Primary School, we use StudySaathi AI to understand each child's individual learning style and ensure no fundamental concepts are missed. This summary highlights what your child does well and simple, fun ways you can support them at home."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2 shadow-2xs">
                  <h4 className="font-bold text-[#2E7D5E] flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D5E]" />
                    <span>{language === "gu" ? "શક્તિઓ અને પ્રગતિના ક્ષેત્રો" : "Areas of Strength & Growth"}</span>
                  </h4>
                  <ul className="space-y-1.5 text-[#7A6862] ml-4 list-disc text-xs">
                    <li>{language === "gu" ? "વર્ગખંડમાં સક્રિય ભાગીદારી અને સર્જનાત્મક સમસ્યા નિવારણ." : "Active classroom participation and creative problem-solving."}</li>
                    <li>{language === "gu" ? "પર્યાવરણ અને વાર્તા સત્રો દરમિયાન મજબૂત જિજ્ઞાસા." : "Strong curiosity during science, environmental, and storytelling lessons."}</li>
                    <li>{language === "gu" ? "દ્રશ્ય આકૃતિઓ અને મૂર્ત વસ્તુઓ સાથે કામ કરતી વખતે સતત સુધારો દર્શાવે છે." : "Shows steady improvement when working with visual diagrams and hands-on objects."}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 space-y-2 shadow-2xs">
                  <h4 className="font-bold text-[#B26A1B] flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-[#B26A1B]" />
                    <span>{language === "gu" ? "હાલમાં અભ્યાસ હેઠળની સંકલ્પનાઓ" : "Concepts Currently Practicing"}</span>
                  </h4>
                  {studentGaps.map((g) => (
                    <div key={g.id} className="p-2.5 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                      <span className="font-bold text-[#49352F]">{g.conceptName}</span>
                      <p className="text-[11px] text-[#7A6862] mt-0.5">
                        {language === "gu"
                          ? "ધ્યાન કેન્દ્રિત: ચમચી, બટન કે મણકા જેવી રોજિંદી વસ્તુઓનો ઉપયોગ કરીને સમાન જૂથ બનાવવાનો મહાવરો."
                          : "Focus: Practicing equal grouping using everyday objects like spoons, buttons, or beads."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#49352F]/15 text-xs space-y-1.5 shadow-2xs">
                <span className="font-bold text-[#49352F]">
                  {language === "gu" ? "ઘર માટે ભલામણ કરેલ દૈનિક પ્રવૃત્તિઓ:" : "Recommended Everyday Home Activities:"}
                </span>
                <p className="text-[#7A6862]">
                  {language === "gu"
                    ? "• સમાન વહેંચણી તરીકે ભાગાકારને દ્રઢ કરવા માટે નાસ્તાની વહેંચણી (દા.ત. પરિવારના ૩ સભ્યો વચ્ચે ૧૨ બિસ્કિટ) માં ૧૦ મિનિટ ફાળવો."
                    : "• Spend 10 minutes sharing snacks (e.g. 12 biscuits among 3 family members) to reinforce division as equal sharing."}
                </p>
                <p className="text-[#7A6862]">
                  {language === "gu"
                    ? "• દરરોજ રાત્રે ૧૫ મિનિટ ગુજરાતી અને અંગ્રેજી વાર્તા વાંચવા માટે પ્રોત્સાહિત કરો."
                    : "• Encourage daily 15-minute Gujarati and English bedtime story reading."}
                </p>
              </div>
            </div>
          )}

          {/* REPORT 3: CLASS GAP AUDIT */}
          {reportType === "classGap" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-[#7A6862] pb-2 border-b border-[#49352F]/15">
                <span className="font-bold text-sm text-[#49352F]">
                  {language === "gu"
                    ? `ધોરણ ૪-અ શીખવાની ખામીઓનું વ્યાપક ઓડિટ (${gaps.length} ખામીઓ)`
                    : `Class 4-A Learning-Gap Comprehensive Audit (${gaps.length} Gaps)`}
                </span>
                <span>
                  {language === "gu" ? "મર્યાદા: ૬૦% પ્રગતિશીલ • ૮૦% પ્રભુત્વ" : "Threshold: 60% Developing • 80% Mastery"}
                </span>
              </div>

              <div className="rounded-2xl border border-[#49352F]/15 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6E9] border-b border-[#49352F]/15 text-[#7A6862] uppercase text-[10px]">
                    <tr>
                      <th className="p-3">{language === "gu" ? "વિદ્યાર્થી" : "Student"}</th>
                      <th className="p-3">{language === "gu" ? "વિષય" : "Subject"}</th>
                      <th className="p-3">{language === "gu" ? "સંકલ્પના અવરોધ" : "Concept Roadblock"}</th>
                      <th className="p-3">{language === "gu" ? "તાજેતરનો %" : "Latest %"}</th>
                      <th className="p-3">{language === "gu" ? "અગ્રતા" : "Priority"}</th>
                      <th className="p-3">{language === "gu" ? "સ્થિતિ" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#49352F]/10">
                    {gaps.map((g) => (
                      <tr key={g.id} className="hover:bg-[#FAF6E9]/40">
                        <td className="p-3 font-bold text-[#49352F]">{g.studentName}</td>
                        <td className="p-3 font-mono text-[#7A6862]">{formatSubject(g.subjectCode)}</td>
                        <td className="p-3 font-semibold text-[#49352F]">{g.conceptName}</td>
                        <td className="p-3 font-bold text-[#49352F]">{g.latestPercentage}%</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.priority === "High"
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/20"
                            }`}
                          >
                            {formatPriority(g.priority)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.status === "Resolved"
                                ? "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20"
                                : "bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/20"
                            }`}
                          >
                            {formatStatus(g.status)}
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
          <div className="mt-12 pt-6 border-t-2 border-[#49352F]/20 grid grid-cols-3 gap-6 text-xs text-[#7A6862]">
            <div>
              <div className="h-10 border-b border-dashed border-[#49352F]/30" />
              <span className="block mt-1.5 font-bold text-[#49352F]">
                {language === "gu" ? "વર્ગ શિક્ષકની સહી" : "Class Teacher Signature"}
              </span>
              <span className="text-[10px] text-[#7A6862]">
                {language === "gu" ? "પૂજા શર્મા (પ્રાથમિક શિક્ષિકા)" : "Pooja Sharma (Primary Educator)"}
              </span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-[#49352F]/30" />
              <span className="block mt-1.5 font-bold text-[#49352F]">
                {language === "gu" ? "આચાર્યશ્રી / સંચાલક" : "Principal / Administrator"}
              </span>
              <span className="text-[10px] text-[#7A6862]">
                {language === "gu" ? "આચાર્ય આર.કે. ત્રિવેદી" : "Principal R.K. Trivedi"}
              </span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-[#49352F]/30" />
              <span className="block mt-1.5 font-bold text-[#49352F]">
                {language === "gu" ? "વાલીની સહી" : "Parent / Guardian Signature"}
              </span>
              <span className="text-[10px] text-[#7A6862]">
                {language === "gu" ? "તારીખ: ____________" : "Date: ____________"}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Guided Tour */}
      <SpotlightTour page="reports" />
    </AppLayout>
  );
}
