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

  return (
    <Tilt3DCard glowColor="rgba(255, 138, 61, 0.25)" className="w-full">
      <div className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden transition-all text-slate-100">
        {/* Top Browser / Window Chrome Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_#FF5C6C]" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_#FF8A3D]" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_#3DDBA9]" />
            <span className="ml-2 text-xs font-mono font-semibold text-slate-400 hidden sm:inline">
              shikshasetu.edu.in/dashboard
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
              value={15}
              icon={Users}
              variant="indigo"
              description="Classes 3, 4 & 5"
              sparklineData={[12, 13, 14, 15, 15]}
            />
            <StatTile
              label="Need Support"
              value={4}
              icon={AlertTriangle}
              variant="coral"
              description="Score < 60% threshold"
              sparklineData={[7, 6, 5, 4, 4]}
            />
            <StatTile
              label="Active Plans"
              value={3}
              icon={Layers}
              variant="saffron"
              description="5-step manipulatives"
              sparklineData={[1, 2, 3, 3, 3]}
            />
            <StatTile
              label="Reassessed Gain"
              value="+50 pp"
              icon={TrendingUp}
              variant="mint"
              description="Aarav: 35% -> 85%"
              sparklineData={[35, 45, 60, 75, 85]}
            />
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("bridge")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bridge"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              The Bridge Story (Aarav Patel)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attention")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "attention"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Immediate Attention (4 Students)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subjects")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "subjects"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Subject Mastery Heatmap
            </button>
          </div>

          {/* Tab 1: The Aarav Patel Bridge Story */}
          {activeTab === "bridge" && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Aarav Patel • Class 4A</h3>
                    <Badge variant="mint" size="sm">
                      Mastery Achieved (+50 pp)
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Competency: Mathematics — Division Basics (Equal Sharing)
                  </p>
                </div>

                <Link
                  href="/students/aarav-patel"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
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
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">
                    Before Remediation
                  </span>
                  <span className="text-lg font-black text-white">35%</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Confused equal sharing with remainders
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    Remedial Intervention
                  </span>
                  <span className="text-lg font-black text-white">5 Steps</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Physical counting beads & number line worksheets
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    After Reassessment
                  </span>
                  <span className="text-lg font-black text-white">85%</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
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
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {student.score}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{student.name}</span>
                        <span className="text-[10px] text-slate-400">{student.class}</span>
                        <Badge variant="coral" size="sm">
                          {student.subject}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{student.reason}</p>
                    </div>
                  </div>

                  <Link href="/remedial-plans">
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
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
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold text-white mb-2">Mathematics Proficiency</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Multiplication (Class 3)</span>
                      <span className="font-bold text-emerald-400">84%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-400 w-[84%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Division Basics (Class 4)</span>
                      <span className="font-bold text-amber-400">68%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-400 w-[68%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Fractions (Class 5)</span>
                      <span className="font-bold text-rose-400">54%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500 w-[54%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold text-white mb-2">Gujarati Language Proficiency</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Letter Recognition (Class 3)</span>
                      <span className="font-bold text-emerald-400">92%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-400 w-[92%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Vowel Blends (Class 3)</span>
                      <span className="font-bold text-amber-400">71%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-amber-400 w-[71%]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Reading Comprehension (Class 4)</span>
                      <span className="font-bold text-amber-400">62%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-amber-400 w-[62%]" />
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
