"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { StudentSkillTree3D, SkillNode } from "@/components/3d/StudentSkillTree3D";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { ReassessmentModal } from "@/components/assessment/ReassessmentModal";
import { AssessmentModal } from "@/components/assessment/AssessmentModal";
import { ResultEditModal } from "@/components/assessment/ResultEditModal";
import { ActivityPlayerModal } from "@/components/activities/ActivityPlayerModal";
import { StudentFormModal } from "@/components/student/StudentFormModal";
import { StudentDeleteModal } from "@/components/student/StudentDeleteModal";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { ContextualHelp } from "@/components/shared/ContextualHelp";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  PlusCircle,
  Gamepad2,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Award,
  Edit,
  Trash2,
  Play,
  RotateCcw,
  Layers,
  BrainCircuit,
  Eye,
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

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [remedialPlans, setRemedialPlans] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tab: default to 3D Skill Tree for immediate WOW factor!
  const [activeTab, setActiveTab] = useState<"skilltree" | "gaps" | "mastery" | "history" | "plans">("skilltree");

  // Modals
  const [showReassessModal, setShowReassessModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConceptForReassessment, setSelectedConceptForReassessment] = useState<any>(null);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [resStd, resAct] = await Promise.all([
        fetch(`/api/students/${id}`),
        fetch("/api/activities"),
      ]);

      const [dataStd, dataAct] = await Promise.all([resStd.json(), resAct.json()]);

      if (dataStd.success) {
        setStudent(dataStd.student);
        setResults(dataStd.results || []);
        setGaps(dataStd.gaps || []);
        setRemedialPlans(dataStd.remedialPlans || []);
        setAttempts(dataStd.attempts || []);
      }
      if (dataAct.success) {
        setActivities(dataAct.activities || []);
      }
    } catch (e) {
      console.error("Failed to fetch student details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shikshasetu_step_student_opened"));
    }
  }, [id]);

  if (loading && !student) {
    return (
      <AppLayout>
        <div className="py-20 text-center space-y-3">
          <Sparkles className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-400">
            Loading student competency bridge &amp; 3D skill tree...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!student) {
    return (
      <AppLayout>
        <div className="py-16 text-center space-y-3">
          <p className="text-base font-bold text-white">Student not found</p>
          <Link href="/students" className="text-xs font-semibold text-amber-400 hover:underline">
            &larr; Back to Student Directory
          </Link>
        </div>
      </AppLayout>
    );
  }

  const activeGaps = gaps.filter((g) => g.status === "Active" || g.status === "Under Intervention");
  const resolvedGaps = gaps.filter((g) => g.status === "Resolved");
  const divisionGap = gaps.find((g) => g.conceptId === "c-div-01") || gaps[0];
  const divisionActivity = activities.find((a) => a.conceptId === "c-div-01") || activities[0];

  // Calculate overall student average
  const totalScore = results.reduce((acc, curr) => acc + curr.percentage, 0);
  const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

  // Chart data for concept mastery
  const conceptScoresData = gaps.map((g) => ({
    name: g.conceptName ? g.conceptName.split(" ")[0] : "Concept",
    latest: g.latestPercentage || 0,
    previous: g.previousPercentage || g.latestPercentage || 0,
  }));

  const openReassessment = (conceptId: string, conceptName: string, prevPct: number) => {
    setSelectedConceptForReassessment({ conceptId, conceptName, prevPct });
    setShowReassessModal(true);
  };

  // Build Skill Nodes for 3D Tree
  const skillNodes: SkillNode[] = [
    {
      id: "node-place-val",
      name: "Place Value 100s",
      subject: "Math",
      score: 85,
      status: "mastered",
      position: [-1.8, -0.6, 0],
      connectedTo: ["node-add-sub"],
    },
    {
      id: "node-add-sub",
      name: "Multi-digit Addition",
      subject: "Math",
      score: 90,
      status: "mastered",
      position: [-1.2, 0.4, 0.4],
      connectedTo: ["node-multiplication"],
    },
    {
      id: "node-multiplication",
      name: "Multiplication Tables",
      subject: "Math",
      score: 82,
      status: "mastered",
      position: [-0.3, 0.8, -0.2],
      connectedTo: ["node-division"],
    },
    {
      id: "node-division",
      name: divisionGap ? divisionGap.conceptName : "Division Basics",
      subject: "Math",
      score: divisionGap ? divisionGap.latestPercentage : 35,
      status: (divisionGap && divisionGap.latestPercentage >= 80) ? "mastered" : "gap",
      reason: divisionGap ? divisionGap.reason : "Fails equal sharing with remainders without visual aid.",
      baselineScore: divisionGap?.previousPercentage || 35,
      position: [0.7, 0.2, 0.3],
      connectedTo: ["node-fractions"],
    },
    {
      id: "node-fractions",
      name: "Fractions Addition",
      subject: "Math",
      score: 65,
      status: "developing",
      position: [1.6, -0.4, -0.3],
      connectedTo: ["node-decimals"],
    },
    {
      id: "node-decimals",
      name: "Decimals (Term 2)",
      subject: "Math",
      score: 0,
      status: "locked",
      position: [2.3, 0.5, 0.2],
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Students</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="rounded-full text-xs border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              <span>Archive / Delete</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="rounded-full text-xs"
            >
              <Edit className="w-3 h-3 mr-1" />
              <span>Edit Profile</span>
            </Button>
          </div>
        </div>

        {/* Profile Card Header */}
        <Card variant="glass" className="p-6 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-slate-950 flex items-center justify-center font-heading font-black text-2xl shadow-lg shadow-amber-500/20 shrink-0">
              {student.displayName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {student.displayName}
                </h1>
                <Badge variant="outline" size="sm">
                  Class {student.grade}-{student.section}
                </Badge>
                {student.enrollmentStatus && student.enrollmentStatus !== "active" && (
                  <Badge variant="outline" size="sm" className="text-amber-400 border-amber-500/40">
                    {student.enrollmentStatus.toUpperCase()}
                  </Badge>
                )}
                {student.id === "std-aarav" && (
                  <Badge variant="saffron" size="sm" pulse>
                    SFIC Gujarat Key Demo
                  </Badge>
                )}
              </div>
              <p className="font-mono text-xs text-slate-400">Roll: {student.studentCode} • Enrolled 2026</p>
              {student.notes && (
                <p className="text-xs text-slate-300 max-w-xl italic mt-1">
                  &quot;{student.notes}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Quick Intervention Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssessmentModal(true)}
              className="rounded-full text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/40 font-bold"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Record Assessment</span>
            </Button>

            {divisionActivity && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivityModal(true)}
                className="rounded-full text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
              >
                <Play className="w-3.5 h-3.5 fill-current mr-1" />
                <span>Practice Activity</span>
              </Button>
            )}

            <div data-tour="student-reassess-form">
              <Button
                variant="saffron"
                size="sm"
                onClick={() =>
                  openReassessment(
                    divisionGap?.conceptId || "c-div-01",
                    divisionGap?.conceptName || "Division Basics",
                    divisionGap?.previousPercentage || 35
                  )
                }
                className="rounded-full text-xs font-black shadow-md shadow-amber-500/30"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Record Reassessment</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* 4 Summary Stat Tiles */}
        <div data-tour="student-scores" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile
            label="Average Performance"
            value={avgScore}
            suffix="%"
            icon={TrendingUp}
            variant="indigo"
            description={`Across ${results.length} assessments`}
            sparklineData={[50, 58, 65, 74, avgScore]}
          />

          <StatTile
            label="Active Learning Gaps"
            value={activeGaps.length}
            icon={AlertTriangle}
            variant={activeGaps.length > 0 ? "coral" : "mint"}
            description={activeGaps.length === 0 ? "All concepts mastered!" : "Requires 5-step intervention"}
          />

          <StatTile
            label="Active Remedial Plans"
            value={remedialPlans.length}
            icon={Layers}
            variant="saffron"
            description="5-step manipulatives"
          />

          <StatTile
            label="Activities Completed"
            value={attempts.length}
            icon={Gamepad2}
            variant="mint"
            description="Interactive practice sessions"
          />
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("skilltree")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "skilltree"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            3D Skill Tree (Interactive)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gaps")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "gaps"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Learning Gaps &amp; The Bridge ({gaps.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mastery")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "mastery"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Mastery Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "history"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Assessment History ({results.length})
          </button>
        </div>

        {/* Tab 1: 3D SKILL TREE (Signature Feature) */}
        {activeTab === "skilltree" && (
          <div className="space-y-4">
            <StudentSkillTree3D
              studentName={student.displayName}
              skills={skillNodes}
              onGeneratePlan={() => {
                window.location.href = "/remedial-plans";
              }}
            />
          </div>
        )}

        {/* Tab 2: Learning Gaps & The Bridge */}
        {activeTab === "gaps" && (
          <div className="space-y-4">
            {gaps.length === 0 ? (
              <Card variant="glass" className="p-8 text-center text-slate-400">
                No learning gaps recorded for this student.
              </Card>
            ) : (
              gaps.map((gap) => (
                <Card
                  key={gap.id}
                  variant="glass"
                  className="p-5 border-slate-800 space-y-4 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-white">
                          {gap.conceptName}
                        </h3>
                        <Badge
                          variant={
                            gap.priority === "High"
                              ? "high"
                              : gap.priority === "Medium"
                              ? "medium"
                              : "low"
                          }
                          size="sm"
                          dot
                        >
                          {gap.priority} Priority
                        </Badge>
                        <Badge
                          variant={gap.status === "Resolved" ? "completed" : "inProgress"}
                          size="sm"
                        >
                          {gap.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-400 font-medium">
                        Subject: {gap.subjectName || "Mathematics"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="saffron"
                        size="sm"
                        onClick={() =>
                          openReassessment(
                            gap.conceptId,
                            gap.conceptName,
                            gap.previousPercentage || gap.latestPercentage
                          )
                        }
                        className="rounded-full text-xs font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>Reassess Delta</span>
                      </Button>

                      <Link
                        href="/remedial-plans"
                        data-tour="student-remedial-btn"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(new CustomEvent("shikshasetu_step_plan_generated"));
                          }
                        }}
                      >
                        <Button variant="outline" size="sm" className="rounded-full text-xs">
                          <span>5-Step Plan &rarr;</span>
                        </Button>
                      </Link>
                      <ContextualHelp termKey="remedialPlan" />
                    </div>
                  </div>

                  {/* Bridge Progress Visual */}
                  <BridgeProgress
                    score={gap.latestPercentage}
                    previousScore={gap.previousPercentage}
                    studentName={student.displayName}
                    height="md"
                  />

                  {/* Explainable AI Diagnosis */}
                  {gap.reason && (
                    <div data-tour="student-gap-reason" className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                          Algorithmic Explanation:
                        </span>
                        <ContextualHelp termKey="gapDetection" />
                      </div>
                      <p className="text-slate-300 leading-relaxed">{gap.reason}</p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Mastery Analytics */}
        {activeTab === "mastery" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass" className="p-5">
              <h3 className="font-heading text-base font-bold text-white mb-2">
                Concept Scores Comparison
              </h3>
              <p className="text-xs text-slate-400 mb-4">Baseline vs Reassessment %</p>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conceptScoresData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="latest" fill="#3DDBA9" name="Latest Score %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" fill="#FF8A3D" name="Baseline %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card variant="glass" className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-white mb-2">
                  Pedagogical Mastery Verdict
                </h3>
                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Mastery Benchmark</span>
                    <span className="text-lg font-black text-emerald-400">80% Threshold</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Student demonstrates independent problem-solving without prompt assistance.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block font-semibold">Developing Benchmark</span>
                    <span className="text-lg font-black text-amber-400">60% Threshold</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Basic conceptual familiarity; requires occasional manipulative or visual aid.
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/reports">
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs mt-4">
                  Generate Printable Report Card &rarr;
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Tab 4: Assessment History */}
        {activeTab === "history" && (
          <Card variant="glass" className="p-5 border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-bold text-white">
                  Formative Assessment History
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive log of evaluations, subjects, tested competencies, marks, and mastery statuses.
                </p>
              </div>

              <Button
                variant="saffron"
                size="sm"
                onClick={() => setShowAssessmentModal(true)}
                className="rounded-full text-xs font-bold shadow-md shadow-amber-500/20 self-start sm:self-center"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>Record Assessment</span>
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800 p-8">
                <ClipboardList className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No Assessment Records Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Formative assessment marks recorded for this student will appear here along with diagnostic percentages and gap updates.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssessmentModal(true)}
                  className="rounded-full text-xs text-amber-300 border-amber-500/40"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Record First Assessment</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Subject</th>
                      <th className="p-3 font-semibold">Competency / Concept</th>
                      <th className="p-3 font-semibold">Assessment Title</th>
                      <th className="p-3 font-semibold">Marks</th>
                      <th className="p-3 font-semibold">Percentage</th>
                      <th className="p-3 font-semibold">Mastery Status</th>
                      <th className="p-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {results.map((res) => {
                      const isMastered = res.percentage >= 80;
                      const isDeveloping = res.percentage >= 60 && res.percentage < 80;
                      const isGap = res.percentage < 60;
                      return (
                        <tr key={res.id} className="hover:bg-slate-900/40">
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            {new Date(res.recordedAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" size="sm">
                              {res.subjectCode || "MATH"}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold text-amber-300">
                            {res.conceptName || res.conceptId}
                          </td>
                          <td className="p-3 font-medium text-slate-200">
                            {res.assessmentTitle || "Formative Evaluation"}
                          </td>
                          <td className="p-3 font-semibold text-slate-300 whitespace-nowrap">
                            {res.marksObtained} / {res.maximumMarks}
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-black ${
                                isMastered
                                  ? "text-emerald-400"
                                  : isGap
                                  ? "text-rose-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {res.percentage}%
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                isMastered
                                  ? "mastered"
                                  : isDeveloping
                                  ? "developing"
                                  : "needsSupport"
                              }
                              size="sm"
                              dot
                            >
                              {isMastered ? "Mastered" : isDeveloping ? "Developing" : "Needs Support"}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingResult(res)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit Score</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modals */}
      {showAssessmentModal && (
        <AssessmentModal
          isOpen={showAssessmentModal}
          studentId={student.id}
          studentName={student.displayName}
          onClose={() => setShowAssessmentModal(false)}
          onSuccess={() => {
            fetchStudentData();
            showToast({
              type: "success",
              title: "Assessment Recorded",
              message: "Assessment score recorded and learning gaps updated successfully.",
            });
          }}
        />
      )}

      {editingResult && (
        <ResultEditModal
          isOpen={!!editingResult}
          result={editingResult}
          studentName={student.displayName}
          onClose={() => setEditingResult(null)}
          onSuccess={() => {
            fetchStudentData();
            showToast({
              type: "success",
              title: "Score Updated",
              message: "Assessment score updated and learning gaps recalculated.",
            });
          }}
        />
      )}

      {showReassessModal && (
        <ReassessmentModal
          isOpen={showReassessModal}
          onClose={() => setShowReassessModal(false)}
          studentId={student.id}
          studentName={student.displayName}
          conceptId={selectedConceptForReassessment?.conceptId || "c-div-01"}
          conceptName={selectedConceptForReassessment?.conceptName || "Division Basics"}
          previousPercentage={selectedConceptForReassessment?.prevPct || 35}
          onSuccess={() => {
            fetchStudentData();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("shikshasetu_step_reassessed"));
            }
          }}
        />
      )}

      {showActivityModal && (
        <ActivityPlayerModal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          activity={divisionActivity}
          studentId={student.id}
          studentName={student.displayName}
          onCompleted={() => fetchStudentData()}
        />
      )}

      {showEditModal && (
        <StudentFormModal
          isOpen={showEditModal}
          student={student}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchStudentData();
            showToast({
              type: "success",
              title: "Record Updated",
              message: `Student details updated successfully.`,
            });
          }}
        />
      )}

      {showDeleteModal && (
        <StudentDeleteModal
          isOpen={showDeleteModal}
          student={student}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={(msg) => {
            showToast({
              type: "info",
              title: "Roster Updated",
              message: msg,
            });
            router.push("/students");
          }}
        />
      )}

      {/* Guided Tour */}
      <SpotlightTour page="studentDetail" />
    </AppLayout>
  );
}
