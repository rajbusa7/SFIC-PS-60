"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { LearningGap, AssessmentHistoryItem } from "@shared/types";

interface ProgressTimelineProps {
  gap: LearningGap & {
    dynamicStatus?: string;
    gapReopened?: boolean;
    previousMasteryScore?: number;
    masteryDate?: string;
  };
  studentName?: string;
}

export function ProgressTimeline({ gap, studentName }: ProgressTimelineProps) {
  const { language } = useLanguage();

  const history: AssessmentHistoryItem[] = gap.assessmentHistory || [];
  const isSingleAssessment = history.length <= 1;

  const currentScore = gap.currentScore ?? gap.latestPercentage ?? 0;
  const previousScore = gap.previousScore ?? gap.previousPercentage;
  const totalImprovement = gap.totalImprovement ?? (
    history.length >= 2 ? Math.round((currentScore - history[0].score) * 10) / 10 : 0
  );
  const latestDelta = gap.latestScoreDelta ?? gap.scoreDelta ?? gap.deltaPercentagePoints;
  const trend = gap.trend || (isSingleAssessment ? "Insufficient Data" : "Stable");

  // Trend icon & style
  const getTrendIcon = () => {
    if (trend === "Improving") {
      return <TrendingUp className="w-3.5 h-3.5 text-[#2E7D5E]" />;
    }
    if (trend === "Declining") {
      return <TrendingDown className="w-3.5 h-3.5 text-[#C54738]" />;
    }
    return <Minus className="w-3.5 h-3.5 text-[#7A6862]" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recorded date";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-3.5 rounded-xl bg-white border border-[#49352F]/12 space-y-3 text-xs text-[#49352F]">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#49352F]/10 pb-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#B26A1B]" />
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#49352F]">
            {language === "gu"
              ? "સમયાનુસાર પ્રગતિ સમયરેખા (લોન્ગિટ્યુડીનલ ટ્રેકિંગ)"
              : "Longitudinal Progress & Assessment Timeline"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {gap.gapReopened && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBECE9] border border-[#C54738]/30 text-[#A93327]">
              <AlertTriangle className="w-3 h-3 text-[#C54738]" />
              <span>GAP REOPENED</span>
            </span>
          )}

          <Badge
            variant={
              trend === "Improving"
                ? "mint"
                : trend === "Declining"
                ? "coral"
                : "default"
            }
            size="sm"
          >
            <span className="flex items-center gap-1">
              {getTrendIcon()}
              <span>{gap.trendText || trend}</span>
            </span>
          </Badge>
        </div>
      </div>

      {/* Reopened Gap Alert Banner */}
      {gap.gapReopened && (
        <div className="p-2.5 rounded-xl bg-[#FBECE9] border border-[#C54738]/25 text-[#A93327] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-[#C54738] shrink-0" />
            <span>
              {language === "gu"
                ? "ગેપ પુનઃ ખુલેલ: અગાઉ નિપુણતા પ્રાપ્ત કરેલી હતી"
                : "Gap Reopened: Competency Previously Mastered"}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#49352F]">
            {language === "gu"
              ? `વિદ્યાર્થીએ અગાઉ ${gap.previousMasteryScore || 85}% સ્કોર સાથે નિપુણતા પ્રાપ્ત કરી હતી, પરંતુ તાજેતરના મૂલ્યાંકનોમાં સ્કોર ઘટીને ${currentScore}% થયો છે. સંકલ્પનાત્મક સ્પષ્ટતા પુનઃસ્થાપિત કરવા ઉપચારાત્મક મહાવરો ફરી શરૂ કરવામાં આવ્યો છે.`
              : `This student previously demonstrated verified mastery (${gap.previousMasteryScore || 85}%${gap.masteryDate ? ` on ${formatDate(gap.masteryDate)}` : ""}), but performance has fallen to ${currentScore}% across consecutive assessments. Targeted intervention is re-activated.`}
          </p>
        </div>
      )}

      {/* Case A: Single Initial Observation */}
      {isSingleAssessment ? (
        <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#49352F] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#B26A1B]" />
              <span>
                {language === "gu" ? "પ્રારંભિક મૂલ્યાંકન (પ્રથમ નોંધાયેલ અવલોકન)" : "Initial Assessment (First Recorded Observation)"}
              </span>
            </span>
            <span className="font-mono font-bold text-xs text-[#49352F]">
              {currentScore}%
            </span>
          </div>

          <p className="text-[11px] text-[#7A6862] leading-relaxed">
            {language === "gu"
              ? `આ સંકલ્પના માટે ફક્ત ૧ મૂલ્યાંકન રેકોર્ડ (${formatDate(history[0]?.date || gap.updatedAt)}) ઉપલબ્ધ છે. એક જ ડેટા પોઈન્ટ પરથી કોઈ પ્રગતિ કે વલણનું અનુમાન લગાવી શકાતું નથી. પુનઃમૂલ્યાંકન નોંધ્યા પછી સમયરેખા અને વૃદ્ધિ ડેલ્ટા સક્રિય થશે.`
              : `This competency has 1 recorded observation (${formatDate(history[0]?.date || gap.updatedAt)}). Longitudinal trend tracking requires a second observation; use Reassess Delta after classroom intervention to establish a growth trajectory.`}
          </p>
        </div>
      ) : (
        /* Case B: Multi-Step Longitudinal History */
        <div className="space-y-3">
          {/* Milestone Chain Ribbon */}
          <div className="p-3 rounded-xl bg-[#FAF6E9] border border-[#49352F]/10 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6862] block">
              {language === "gu" ? "મૂલ્યાંકન પ્રગતિ ક્રમ:" : "Assessment Progression Pathway:"}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {history.map((step, idx) => {
                const isMastered = step.score >= 80;
                const isDeveloping = step.score >= 60 && step.score < 80;
                const isNeedsSupport = step.score < 60;
                const isLatest = idx === history.length - 1;

                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isLatest
                          ? "ring-2 ring-[#B26A1B]/30 bg-white shadow-xs"
                          : "bg-white/70"
                      } ${
                        isMastered
                          ? "border-[#2E7D5E]/30"
                          : isDeveloping
                          ? "border-[#B26A1B]/30"
                          : "border-[#C54738]/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] text-[#7A6862]">
                        <span className="font-semibold">{formatDate(step.date)}</span>
                        {step.scoreDelta !== undefined && (
                          <span
                            className={`font-mono font-bold ${
                              step.scoreDelta > 0
                                ? "text-[#2E7D5E]"
                                : step.scoreDelta < 0
                                ? "text-[#C54738]"
                                : "text-[#7A6862]"
                            }`}
                          >
                            {step.scoreDelta > 0 ? `+${step.scoreDelta} pp` : `${step.scoreDelta} pp`}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-baseline justify-center gap-1">
                        <span
                          className={`font-heading font-black text-sm ${
                            isMastered
                              ? "text-[#2E7D5E]"
                              : isDeveloping
                              ? "text-[#8D4E10]"
                              : "text-[#C54738]"
                          }`}
                        >
                          {step.score}%
                        </span>
                      </div>

                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                          isMastered
                            ? "bg-[#2E7D5E]/10 text-[#2E7D5E]"
                            : isDeveloping
                            ? "bg-[#B26A1B]/10 text-[#8D4E10]"
                            : "bg-[#C54738]/10 text-[#A93327]"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {idx < history.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-[#B26A1B]/60 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metric KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-white border border-[#49352F]/10">
              <span className="text-[10px] text-[#7A6862] block font-semibold">
                {language === "gu" ? "પ્રારંભિક સ્કોર" : "Initial Score"}
              </span>
              <span className="font-heading font-bold text-[#49352F]">
                {history[0]?.score ?? currentScore}%
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-[#49352F]/10">
              <span className="text-[10px] text-[#7A6862] block font-semibold">
                {language === "gu" ? "વર્તમાન સ્કોર" : "Current Score"}
              </span>
              <span className="font-heading font-bold text-[#49352F]">
                {currentScore}%
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-[#49352F]/10">
              <span className="text-[10px] text-[#7A6862] block font-semibold">
                {language === "gu" ? "કુલ સુધારો" : "Total Delta"}
              </span>
              <span
                className={`font-heading font-bold ${
                  totalImprovement > 0
                    ? "text-[#2E7D5E]"
                    : totalImprovement < 0
                    ? "text-[#C54738]"
                    : "text-[#7A6862]"
                }`}
              >
                {totalImprovement > 0 ? `+${totalImprovement} pp` : `${totalImprovement} pp`}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-[#49352F]/10">
              <span className="text-[10px] text-[#7A6862] block font-semibold">
                {language === "gu" ? "મૂલ્યાંકનો" : "Assessments"}
              </span>
              <span className="font-heading font-bold text-[#49352F]">
                {history.length} recorded
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-[#49352F]/10 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#7A6862] block font-semibold">
                {language === "gu" ? "હસ્તક્ષેપો" : "Interventions"}
              </span>
              <span className="font-heading font-bold text-[#49352F]">
                {gap.numberOfInterventions || (gap.remedialPlanId ? 1 : 0)} completed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
