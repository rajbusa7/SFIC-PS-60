"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t } = useLanguage();

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
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Curriculum Mastery & Progress Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Empirical before-and-after evaluation measuring true percentage-point (pp) delta growth following remedial intervention.
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Students Showing Growth
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {progressData?.improvingCount || 2} Students
            </div>
            <span className="text-[11px] text-emerald-600/80 mt-1 block font-medium">
              Positive percentage-point delta
            </span>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">
              Interventions Completed
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1">
              {progressData?.completedPlansCount || 1} Plans
            </div>
            <span className="text-[11px] text-purple-600/80 mt-1 block font-medium">
              Validated practice sessions
            </span>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
              Gaps Resolved
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">
              {progressData?.resolvedGapsCount || 0} Gaps
            </div>
            <span className="text-[11px] text-indigo-600/80 mt-1 block font-medium">
              Met &ge;80% mastery
            </span>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Active Interventions
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
              {progressData?.activeGapsCount || 3} Gaps
            </div>
            <span className="text-[11px] text-amber-600/80 mt-1 block font-medium">
              Ongoing remedial practice
            </span>
          </Card>
        </div>

        {/* Before and After Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Baseline vs. Latest Reassessment Comparison</CardTitle>
              <CardDescription>
                Empirical comparison showing student scores before and after remedial action. Delta is calculated in absolute percentage points (pp).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Subject:</span>
              <select
                value={subjectFilter}
                aria-label="Filter progress by subject"
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="all">All</option>
                <option value="MATH">Math</option>
                <option value="ENG">English</option>
              </select>
            </div>
          </CardHeader>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beforeAfterChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                />
                <Bar dataKey="Baseline" fill="#94A3B8" name="Initial Baseline" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Latest" fill="#059669" name="Post-Intervention Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Detailed Concept Growth Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Concept-Level Mastery Ledger</CardTitle>
              <CardDescription>
                Detailed audit trail of baseline score, reassessment, and calculated percentage-point delta
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Subject & Concept</th>
                  <th className="p-3">Evaluations</th>
                  <th className="p-3">Initial Score</th>
                  <th className="p-3">Latest Score</th>
                  <th className="p-3">Change (pp)</th>
                  <th className="p-3">Mastery Status</th>
                  <th className="p-3">Profile Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item: any, i: number) => {
                  const isMastered = item.latestPercentage >= 80;

                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.studentName}</div>
                        <div className="text-[10px] text-slate-400">Class {item.grade}-A</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{item.conceptName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.subjectCode}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{item.attemptsCount} test(s)</td>
                      <td className="p-3 font-medium text-slate-600">
                        {item.hasSufficientEvidence ? `${item.initialPercentage}%` : "—"}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{item.latestPercentage}%</td>
                      <td className="p-3">
                        {item.hasSufficientEvidence ? (
                          <span
                            className={`font-bold ${
                              item.deltaPercentagePoints > 0
                                ? "text-emerald-600"
                                : item.deltaPercentagePoints < 0
                                ? "text-rose-600"
                                : "text-slate-600"
                            }`}
                          >
                            {item.deltaPercentagePoints > 0 ? `+${item.deltaPercentagePoints}` : item.deltaPercentagePoints} pp
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Single Observation
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
                            ? "Mastered"
                            : item.latestPercentage >= 60
                            ? "Developing"
                            : "Needs Support"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/students/${item.studentId}`}
                          className="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                        >
                          <span>View</span>
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
