"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToDataUpdates } from "@/lib/events";
import {
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export default function ProgressTrackingPage() {
  const { t, language, formatSubject, formatClass } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);
  const [subjectFilter, setSubjectFilter] = useState("all");

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/progress");
      const data = await res.json();
      if (data.success) {
        setProgressData(data);
      }
    } catch (e) {
      console.error("Failed to load progress data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    const unsubscribe = subscribeToDataUpdates(() => {
      fetchProgress();
    });
    return () => unsubscribe();
  }, []);

  const items = progressData?.progressItems || [];
  const filteredItems = items.filter((item: any) => {
    if (subjectFilter !== "all" && item.subjectCode !== subjectFilter) return false;
    return true;
  });

  // Chart data for Before-and-After
  const beforeAfterChartData = filteredItems
    .filter((i: any) => i.hasSufficientEvidence)
    .map((i: any) => ({
      name: `${i.studentName.split(" ")[0]} (${i.conceptName.split(" ")[0]})`,
      Baseline: i.initialPercentage,
      Latest: i.latestPercentage,
      delta: i.deltaPercentagePoints,
    }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#49352F] tracking-tight font-heading">
              {t.progress.title || "Curriculum Mastery & Progress Tracking"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-0.5">
              {t.progress.subtitle || "Empirical before-and-after evaluation measuring true percentage-point (pp) delta growth following remedial intervention."}
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-l-4 border-l-[#2E7D5E]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2E7D5E]">
              {language === "gu" ? "પ્રગતિ દર્શાવતા વિદ્યાર્થીઓ" : "Students Showing Growth"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2E7D5E] mt-1 font-heading">
              {progressData?.improvingCount ?? 0} {language === "gu" ? "વિદ્યાર્થીઓ" : "Students"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {language === "gu" ? "સકારાત્મક ટકાવારી-ગુણ ફેરફાર" : "Positive percentage-point delta"}
            </span>
          </Card>

          <Card className="border-l-4 border-l-[#B26A1B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B26A1B]">
              {language === "gu" ? "પૂર્ણ થયેલ હસ્તક્ષેપ" : "Interventions Completed"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#B26A1B] mt-1 font-heading">
              {progressData?.completedPlansCount ?? 0} {language === "gu" ? "યોજનાઓ" : "Plans"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {language === "gu" ? "પ્રમાણિત મહાવરા સત્રો" : "Validated practice sessions"}
            </span>
          </Card>

          <Card className="border-l-4 border-l-[#F2CAB3]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#49352F]">
              {language === "gu" ? "ઉકેલાયેલી ખામીઓ" : "Gaps Resolved"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#49352F] mt-1 font-heading">
              {progressData?.resolvedGapsCount ?? 0} {language === "gu" ? "ખામીઓ" : "Gaps"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {language === "gu" ? "≥૮૦% પ્રભુત્વ સિદ્ધ કર્યું" : "Met ≥80% mastery"}
            </span>
          </Card>

          <Card className="border-l-4 border-l-[#C54738]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C54738]">
              {language === "gu" ? "સક્રિય હસ્તક્ષેપ" : "Active Interventions"}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#C54738] mt-1 font-heading">
              {progressData?.activeGapsCount ?? 0} {language === "gu" ? "ખામીઓ" : "Gaps"}
            </div>
            <span className="text-[11px] text-[#7A6862] mt-1 block font-medium">
              {language === "gu" ? "ચાલુ ઉપચાર મહાવરો" : "Ongoing remedial practice"}
            </span>
          </Card>
        </div>

        {/* Before and After Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                {language === "gu"
                  ? "મૂળ આધાર વિરુદ્ધ તાજેતરનું પુનઃમૂલ્યાંકન સરખામણી"
                  : "Baseline vs. Latest Reassessment Comparison"}
              </CardTitle>
              <CardDescription>
                {language === "gu"
                  ? "ઉપચાર કાર્ય પહેલા અને પછીના વિદ્યાર્થી ગુણ દર્શાવતી વાસ્તવિક સરખામણી."
                  : "Empirical comparison showing student scores before and after remedial action. Delta is calculated in absolute percentage points (pp)."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7A6862]">
                {language === "gu" ? "વિષય:" : "Subject:"}
              </span>
              <select
                value={subjectFilter}
                aria-label="Filter progress by subject"
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
              >
                <option value="all">{language === "gu" ? "બધા" : "All"}</option>
                <option value="MATH">{formatSubject("MATH")}</option>
                <option value="ENG">{formatSubject("ENG")}</option>
                <option value="GUJ">{formatSubject("GUJ")}</option>
              </select>
            </div>
          </CardHeader>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beforeAfterChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DEC9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7A6862" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#7A6862" }} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                  contentStyle={{ borderRadius: "14px", border: "1px solid rgba(73,53,47,0.15)", backgroundColor: "#FAF6E9", color: "#49352F", fontSize: "12px" }}
                />
                <Bar
                  dataKey="Baseline"
                  fill="#C9BDAF"
                  name={language === "gu" ? "પ્રારંભિક આધાર" : "Initial Baseline"}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Latest"
                  fill="#2E7D5E"
                  name={language === "gu" ? "ઉપચાર પછીનો સ્કોર" : "Post-Intervention Score"}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Detailed Concept Growth Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                {language === "gu"
                  ? "સંકલ્પના-સ્તર પ્રભુત્વ ખાતાવહી"
                  : "Concept-Level Mastery Ledger"}
              </CardTitle>
              <CardDescription>
                {language === "gu"
                  ? "મૂળ સ્કોર, પુનઃમૂલ્યાંકન અને ગણતરી કરેલ ટકાવારી-ગુણ ડેલ્ટાની વિગતવાર નોંધણી"
                  : "Detailed audit trail of baseline score, reassessment, and calculated percentage-point delta"}
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6E9] border-b border-[#49352F]/10 text-[#7A6862] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">{language === "gu" ? "વિદ્યાર્થી" : "Student"}</th>
                  <th className="p-3">{language === "gu" ? "વિષય અને સંકલ્પના" : "Subject & Concept"}</th>
                  <th className="p-3">{language === "gu" ? "મૂલ્યાંકનો" : "Evaluations"}</th>
                  <th className="p-3">{language === "gu" ? "પ્રારંભિક સ્કોર" : "Initial Score"}</th>
                  <th className="p-3">{language === "gu" ? "તાજેતરનો સ્કોર" : "Latest Score"}</th>
                  <th className="p-3">{language === "gu" ? "ફેરફાર (ગુણ)" : "Change (pp)"}</th>
                  <th className="p-3">{language === "gu" ? "પ્રભુત્વ સ્થિતિ" : "Mastery Status"}</th>
                  <th className="p-3">{language === "gu" ? "પ્રોફાઇલ" : "Profile Link"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/10">
                {filteredItems.map((item: any, i: number) => {
                  const isMastered = item.latestPercentage >= 80;

                  return (
                    <tr key={i} className="hover:bg-[#FAF6E9]/50">
                      <td className="p-3">
                        <div className="font-bold text-[#49352F]">{item.studentName}</div>
                        <div className="text-[10px] text-[#7A6862]">{formatClass(`Class ${item.grade}-A`)}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-[#49352F]">{item.conceptName}</div>
                        <span className="text-[10px] text-[#7A6862] font-mono">
                          {formatSubject(item.subjectCode)}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#49352F]">
                        {item.attemptsCount} {language === "gu" ? "કસોટી(ઓ)" : "test(s)"}
                      </td>
                      <td className="p-3 font-medium text-[#7A6862]">
                        {item.hasSufficientEvidence ? `${item.initialPercentage}%` : "—"}
                      </td>
                      <td className="p-3 font-bold text-[#49352F]">{item.latestPercentage}%</td>
                      <td className="p-3">
                        {item.hasSufficientEvidence ? (
                          <span
                            className={`font-bold ${
                              item.deltaPercentagePoints > 0
                                ? "text-[#2E7D5E]"
                                : item.deltaPercentagePoints < 0
                                ? "text-rose-600"
                                : "text-[#7A6862]"
                            }`}
                          >
                            {item.deltaPercentagePoints > 0 ? `+${item.deltaPercentagePoints}` : item.deltaPercentagePoints} pp
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#7A6862] italic">
                            {language === "gu" ? "એક જ અવલોકન" : "Single Observation"}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
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
                          {isMastered
                            ? language === "gu" ? "સિદ્ધ" : "Mastered"
                            : item.latestPercentage >= 60
                            ? language === "gu" ? "પ્રગતિ હેઠળ" : "Developing"
                            : language === "gu" ? "સહાય જરૂરી" : "Needs Support"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/students/${item.studentId}`}
                          className="font-bold text-[#B26A1B] hover:text-[#49352F] inline-flex items-center gap-1"
                        >
                          <span>{language === "gu" ? "જુઓ" : "View"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
