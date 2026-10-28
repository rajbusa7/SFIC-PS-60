"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { Tilt3DCard } from "@/components/3d/Tilt3DCard";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  BookOpen,
  Calendar,
  ExternalLink,
} from "lucide-react";

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<"attention" | "bridge" | "subjects">("bridge");
  const [stats, setStats] = useState({
    totalStudents: 15,
    needsSupport: 4,
    activePlans: 3,
    reassessedGain: "+50 pp",
  });

  React.useEffect(() => {
    async function loadStats() {
      try {
        const [repRes, progRes] = await Promise.all([
          fetch("/api/v1/reports/overview"),
          fetch("/api/progress"),
        ]);
        const [repData, progData] = await Promise.all([repRes.json(), progRes.json()]);
        if (repData.success && repData.report) {
          const r = repData.report;
          const aaravItem = progData.progressItems?.find(
            (i: any) => i.studentId === "std-aarav" && i.deltaPercentagePoints
          );
          setStats({
            totalStudents: r.totalStudents,
            needsSupport: r.masteryDistribution?.needsSupport ?? 4,
            activePlans: r.remedialPlansUnderIntervention ?? 3,
            reassessedGain: aaravItem ? `+${aaravItem.deltaPercentagePoints} pp` : "+50 pp",
          });
        }
      } catch (e) {
        console.error("Dashboard preview stat fetch error", e);
      }
    }
    loadStats();
  }, []);

  return (
    <Tilt3DCard glowColor="rgba(242, 202, 179, 0.35)" className="w-full">
      <div className="w-full rounded-3xl border border-[#49352F]/15 bg-[#FAF6E9] backdrop-blur-2xl shadow-xl overflow-hidden transition-all text-[#49352F]">
        {/* Top Browser / Window Chrome Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#49352F]/10 bg-[#F4F1E1]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#C54738]/80 shadow-xs" />
            <div className="w-3 h-3 rounded-full bg-[#B26A1B]/80 shadow-xs" />
            <div className="w-3 h-3 rounded-full bg-[#2E7D5E]/80 shadow-xs" />
            <span className="ml-2 text-xs font-mono font-semibold text-[#7A6862] hidden sm:inline">
              studysaathi.edu.in/dashboard
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant="saffron" size="sm" pulse>
              Live Primary Demo Cohort
            </Badge>
            <Link href="/dashboard">
              <Button
                variant="saffron"
                size="sm"
                className="rounded-full text-xs py-1.5 px-3 h-auto"
              >
                <span>Open Full App</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Real KPI Stat Tiles Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatTile
              label="Total Enrolled"
              value={stats.totalStudents}
              icon={Users}
              variant="indigo"
              description="Classes 3, 4 & 5"
              sparklineData={[12, 13, 14, 15, stats.totalStudents]}
            />
            <StatTile
              label="Need Support"
              value={stats.needsSupport}
              icon={AlertTriangle}
              variant="coral"
              description="Score < 60% threshold"
              sparklineData={[7, 6, 5, 4, stats.needsSupport]}
            />
            <StatTile
              label="Active Plans"
              value={stats.activePlans}
              icon={Layers}
              variant="saffron"
              description="5-step manipulatives"
              sparklineData={[1, 2, 3, 3, stats.activePlans]}
            />
            <StatTile
              label="Reassessed Gain"
              value={stats.reassessedGain}
              icon={TrendingUp}
              variant="mint"
              description="Aarav: 35% -> 85%"
              sparklineData={[35, 45, 60, 75, 85]}
            />
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#49352F]/10 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("bridge")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bridge"
                  ? "bg-[#F2CAB3] text-[#49352F] shadow-xs font-black border border-[#49352F]/15"
                  : "text-[#7A6862] hover:text-[#49352F] hover:bg-white"
              }`}
            >
              The Bridge Story (Aarav Patel)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attention")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "attention"
                  ? "bg-[#F2CAB3] text-[#49352F] shadow-xs font-black border border-[#49352F]/15"
                  : "text-[#7A6862] hover:text-[#49352F] hover:bg-white"
              }`}
            >
              Immediate Attention (4 Students)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subjects")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "subjects"
                  ? "bg-[#F2CAB3] text-[#49352F] shadow-xs font-black border border-[#49352F]/15"
                  : "text-[#7A6862] hover:text-[#49352F] hover:bg-white"
              }`}
            >
              Subject Mastery Heatmap
            </button>
          </div>

          {/* Tab 1: The Aarav Patel Bridge Story */}
          {activeTab === "bridge" && (
            <div className="p-5 rounded-2xl bg-white border border-[#49352F]/12 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#49352F]">Aarav Patel • Class 4A</h3>
                    <Badge variant="mint" size="sm">
                      Mastery Achieved (+50 pp)
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7A6862] mt-0.5">
                    Competency: Mathematics — Division Basics (Equal Sharing)
                  </p>
                </div>

                <Link
                  href="/students/std-aarav"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#49352F] hover:text-[#B26A1B]"
                >
                  <span>View Student Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Animated Bridge Progress Bar Component */}
              <BridgeProgress
                score={85}
                previousScore={35}
                studentName="Aarav Patel"
                height="lg"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                  <span className="text-[10px] uppercase font-bold text-[#C54738] block">
                    Before Remediation
                  </span>
                  <span className="text-lg font-black text-[#49352F]">35%</span>
                  <p className="text-[11px] text-[#7A6862] mt-0.5">
                    Confused equal sharing with remainders
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                  <span className="text-[10px] uppercase font-bold text-[#B26A1B] block">
                    Remedial Intervention
                  </span>
                  <span className="text-lg font-black text-[#49352F]">5 Steps</span>
                  <p className="text-[11px] text-[#7A6862] mt-0.5">
                    Physical counting beads & number line worksheets
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10">
                  <span className="text-[10px] uppercase font-bold text-[#2E7D5E] block">
                    After Reassessment
                  </span>
                  <span className="text-lg font-black text-[#49352F]">85%</span>
                  <p className="text-[11px] text-[#7A6862] mt-0.5">
                    Independent mastery of remainder division
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Immediate Attention */}
          {activeTab === "attention" && (
            <div className="space-y-2.5">
              {[
                {
                  name: "Pooja Sharma",
                  class: "Class 3B",
                  subject: "Gujarati",
                  concept: "Vowel Blends",
                  score: 42,
                  reason: "Fails consonant-vowel combinations in dictation",
                },
                {
                  name: "Karan Mehta",
                  class: "Class 5A",
                  subject: "Mathematics",
                  concept: "Fractions Addition",
                  score: 48,
                  reason: "Adds denominators directly without finding common base",
                },
                {
                  name: "Diya Joshi",
                  class: "Class 4B",
                  subject: "Gujarati",
                  concept: "Reading Fluency",
                  score: 52,
                  reason: "Struggles with compound sentences",
                },
                {
                  name: "Dev Solanki",
                  class: "Class 3A",
                  subject: "Mathematics",
                  concept: "Place Value 100s",
                  score: 55,
                  reason: "Reverses tens and units place in 3-digit subtraction",
                },
              ].map((student, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#49352F]/12 hover:border-[#F2CAB3] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#C54738] border border-rose-200 flex items-center justify-center font-bold text-xs shrink-0">
                      {student.score}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#49352F]">{student.name}</span>
                        <span className="text-[10px] text-[#7A6862]">{student.class}</span>
                        <Badge variant="coral" size="sm">
                          {student.subject}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#7A6862] mt-0.5">{student.reason}</p>
                    </div>
                  </div>

                  <Link href="/remedial-plans">
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8 text-[#49352F] border-[#49352F]/20 hover:bg-[#FAF6E9]">
                      Remediate &rarr;
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Subject Mastery */}
          {activeTab === "subjects" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#49352F]/12">
                <h4 className="text-xs font-bold text-[#49352F] mb-2">Mathematics Proficiency</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-[#7A6862] mb-1">
                      <span>Multiplication (Class 3)</span>
                      <span className="font-bold text-[#2E7D5E]">84%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF6E9] overflow-hidden">
                      <div className="h-full bg-[#2E7D5E] w-[84%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#7A6862] mb-1">
                      <span>Division Basics (Class 4)</span>
                      <span className="font-bold text-[#B26A1B]">68%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF6E9] overflow-hidden">
                      <div className="h-full bg-[#B26A1B] w-[68%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#7A6862] mb-1">
                      <span>Fractions (Class 5)</span>
                      <span className="font-bold text-[#C54738]">54%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF6E9] overflow-hidden">
                      <div className="h-full bg-[#C54738] w-[54%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#49352F]/12">
                <h4 className="text-xs font-bold text-[#49352F] mb-2">Gujarati Language Proficiency</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-[#7A6862] mb-1">
                      <span>Letter Recognition (Class 3)</span>
                      <span className="font-bold text-[#2E7D5E]">92%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF6E9] overflow-hidden">
                      <div className="h-full bg-[#2E7D5E] w-[92%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#7A6862] mb-1">
                      <span>Vowel Blends (Class 3)</span>
                      <span className="font-bold text-[#B26A1B]">71%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF6E9] overflow-hidden">
                      <div className="h-full bg-[#B26A1B] w-[71%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#7A6862] mb-1">
                      <span>Reading Comprehension (Class 4)</span>
                      <span className="font-bold text-[#B26A1B]">62%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF6E9] overflow-hidden">
                      <div className="h-full bg-[#B26A1B] w-[62%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Tilt3DCard>
  );
}
