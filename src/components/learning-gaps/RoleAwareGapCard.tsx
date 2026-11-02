"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BridgeProgress } from "@/components/ui/BridgeProgress";
import { useLanguage } from "@/context/LanguageContext";
import {
  BrainCircuit,
  Sparkles,
  Home,
  User,
  GraduationCap,
  Layers,
  Send,
  RotateCcw,
  TrendingUp,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ClipboardList,
  Smile,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getRoleAwareGapInterpretation,
  generateParentHomeActivity,
} from "@/lib/engine/roleAwareGapEngine";
import type { AudienceRole, LearningGap } from "@shared/types";

interface RoleAwareGapCardProps {
  gap: LearningGap & {
    dynamicStatus?: string;
    dynamicPriority?: string;
    dynamicSeverityScore?: number;
    dynamicDiagnosis?: string;
    dynamicGapType?: string;
    dynamicTriggerRule?: string;
    dynamicRootConcept?: { name: string };
    dynamicPrescription?: any;
    assessmentHistory?: any[];
  };
  activeRole: AudienceRole;
  onSendHomePractice?: (gap: any) => void;
  onGeneratePlan?: (gapId: string) => void;
  onToggleTimeline?: (gapId: string) => void;
  onToggleMap?: (gapId: string) => void;
  onReassess?: (gap: any) => void;
  isTimelineExpanded?: boolean;
  isMapExpanded?: boolean;
  isGeneratingPlan?: boolean;
}

export function RoleAwareGapCard({
  gap,
  activeRole,
  onSendHomePractice,
  onGeneratePlan,
  onToggleTimeline,
  onToggleMap,
  onReassess,
  isTimelineExpanded = false,
  isMapExpanded = false,
  isGeneratingPlan = false,
}: RoleAwareGapCardProps) {
  const { language } = useLanguage();
  const langKey = language === "gu" ? "gu" : "en";
  const interpretation = getRoleAwareGapInterpretation(gap, activeRole, langKey);

  const currentScore = gap.currentScore ?? gap.latestPercentage ?? 0;
  const previousScore = gap.previousScore ?? gap.previousPercentage;
  const isMastered = gap.dynamicStatus === "Mastered" || currentScore >= 80;

  // ---------------------------------------------------------------------------
  // 1. STUDENT VIEW: Supportive, Growth-Oriented, Age-Appropriate
  // ---------------------------------------------------------------------------
  if (activeRole === "student") {
    return (
      <Card
        variant="glass"
        className={`p-6 border-[#49352F]/12 bg-white text-[#49352F] space-y-4 transition-all shadow-xs ${
          isMastered
            ? "border-l-4 border-l-[#2E7D5E]"
            : "border-l-4 border-l-[#B26A1B]"
        }`}
      >
        {/* Student Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl">🌟</span>
              <h3 className="font-heading text-lg font-bold text-[#49352F]">
                {gap.conceptName}
              </h3>
              <Badge variant={interpretation.badgeVariant as BadgeVariant} size="sm">
                {interpretation.badgeLabel}
              </Badge>
            </div>
            <p className="text-xs text-[#2E7D5E] font-semibold">
              {interpretation.headline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/activities">
              <Button variant="saffron" size="sm" className="rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>{interpretation.nextActivityPrompt || "Play Fun Practice Activity"}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Growth Progress Bar */}
        <BridgeProgress
          score={currentScore}
          previousScore={previousScore}
          thresholdDeveloping={60}
          thresholdMastery={80}
          studentName={gap.studentName || "You"}
          height="md"
        />

        {/* Growth-Oriented Encouragement Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          {/* Card 1: Encouraging Milestone Note */}
          <div className="p-4 rounded-2xl bg-[#EAF4EE]/70 border border-[#2E7D5E]/20 space-y-2">
            <span className="font-heading font-extrabold text-xs text-[#2E7D5E] flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-[#2E7D5E]" />
              <span>Your Learning Progress</span>
            </span>
            <p className="text-xs text-[#49352F] leading-relaxed font-medium">
              {interpretation.studentEncouragement}
            </p>
            <p className="text-[11px] text-[#215A43] font-semibold pt-1 border-t border-[#2E7D5E]/15">
              🎉 {interpretation.progressNarrative}
            </p>
          </div>

          {/* Card 2: What You Can Do Next */}
          <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2">
            <span className="font-heading font-extrabold text-xs text-[#B26A1B] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B26A1B]" />
              <span>Skills You Are Building</span>
            </span>
            <ul className="space-y-1 text-xs text-[#49352F]">
              {interpretation.skillsMastered?.map((sk, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0" />
                  <span>{sk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. PARENT VIEW: Simple non-technical language, Home Activity, Strengths
  // ---------------------------------------------------------------------------
  if (activeRole === "parent") {
    const act = interpretation.homeActivity;

    return (
      <Card
        variant="glass"
        className={`p-6 border-[#49352F]/12 bg-white text-[#49352F] space-y-4 transition-all shadow-xs ${
          isMastered
            ? "border-l-4 border-l-[#2E7D5E]"
            : "border-l-4 border-l-[#B26A1B]"
        }`}
      >
        {/* Parent Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#49352F]/10 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-[#49352F]">
                {gap.conceptName}
              </h3>
              <Badge variant={interpretation.badgeVariant as BadgeVariant} size="sm">
                {interpretation.badgeLabel}
              </Badge>
            </div>
            <p className="text-xs text-[#7A6862] mt-0.5 font-medium">
              Child: <strong className="text-[#49352F]">{gap.studentName}</strong> • {interpretation.headline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onSendHomePractice && (
              <Button
                variant="saffron"
                size="sm"
                onClick={() => onSendHomePractice(gap)}
                className="rounded-full text-xs font-bold"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Send Home Practice</span>
              </Button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <BridgeProgress
          score={currentScore}
          previousScore={previousScore}
          thresholdDeveloping={60}
          thresholdMastery={80}
          studentName={gap.studentName || "Your Child"}
          height="md"
        />

        {/* 3 Non-Technical Sections for Parents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          {/* Section 1: What child is doing well & Progress */}
          <div className="p-4 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2">
            <span className="font-heading font-extrabold text-xs text-[#2E7D5E] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D5E]" />
              <span>What {gap.studentName || "your child"} is doing well</span>
            </span>
            <p className="text-xs text-[#49352F] leading-relaxed">
              {interpretation.strengthsSummary}
            </p>
            <div className="pt-2 border-t border-[#49352F]/10 text-[11px] text-[#7A6862]">
              <strong>Classroom Progress:</strong> {interpretation.progressNarrative}
            </div>
            <div className="text-[11px] text-[#B26A1B] font-semibold">
              ℹ️ {interpretation.teacherRecommendation}
            </div>
          </div>

          {/* Section 2: One Simple Home Activity (5–10 min using household materials) */}
          {act && (
            <div className="p-4 rounded-2xl bg-white border border-[#B26A1B]/25 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-1.5">
                <span className="font-heading font-extrabold text-xs text-[#B26A1B] flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-[#B26A1B]" />
                  <span>One 5-Minute Home Activity</span>
                </span>
                <Badge variant="mint" size="sm">
                  <Clock className="w-3 h-3 mr-1" />
                  {act.durationMinutes} mins
                </Badge>
              </div>

              <div>
                <h4 className="font-bold text-xs text-[#49352F]">{act.title}</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {act.commonHouseholdMaterials.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="px-1.5 py-0.5 rounded bg-[#FAF6E9] border border-[#49352F]/10 text-[10px] text-[#7A6862]"
                    >
                      🛠️ {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-[#49352F] leading-snug">
                  <strong>What to do:</strong> {act.whatParentDoes}
                </p>
                <p className="italic text-[#8D4E10] text-[11px] pt-1">
                  🗣️ {act.conversationalPrompt}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. TEACHER VIEW: Professional Diagnosis & Full Explainability
  // (Delegates to standard full card view rendered in learning-gaps/page.tsx)
  // ---------------------------------------------------------------------------
  return null;
}
