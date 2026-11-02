"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import {
  TrendingUp,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type {
  InterventionEffectivenessSummary,
  InterventionRecord,
} from "@shared/types";

interface InterventionEffectivenessSectionProps {
  summaries: InterventionEffectivenessSummary[];
  records?: InterventionRecord[];
}

export function InterventionEffectivenessSection({
  summaries,
  records = [],
}: InterventionEffectivenessSectionProps) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  if (!summaries || summaries.length === 0) {
    return null;
  }

  const activeRecords = selectedType
    ? records.filter((r) => r.interventionType === selectedType)
    : records.slice(0, 8);

  return (
    <Card
      variant="glass"
      className="p-5 border-[#49352F]/15 bg-gradient-to-r from-[#FAF6E9] via-white to-[#F2DCB5]/40 text-[#49352F] space-y-4 shadow-sm"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#49352F]/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2E7D5E]" />
            <h3 className="font-heading font-extrabold text-base text-[#49352F]">
              {language === "gu"
                ? "ઉપચારાત્મક પદ્ધતિઓની અસરકારકતા ટ્રેકિંગ"
                : "Intervention Effectiveness & Empirical Insights"}
            </h3>
            <Badge variant="mint" size="sm">
              Continuous Feedback Loop
            </Badge>
          </div>
          <p className="text-xs text-[#7A6862] mt-0.5">
            Empirical tracking across classrooms • Reports average observed improvement (strictly non-causal)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-[#B26A1B] hover:text-[#8D4E10] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>{isExpanded ? "Hide Details" : "View Observations & Records"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Grid of Intervention Effectiveness Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {summaries.map((summary) => {
          const isSelected = selectedType === summary.interventionType;
          return (
            <div
              key={summary.interventionType}
              onClick={() =>
                setSelectedType(isSelected ? null : summary.interventionType)
              }
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                isSelected
                  ? "bg-white border-[#B26A1B] shadow-md ring-1 ring-[#B26A1B]/30"
                  : "bg-white/90 border-[#49352F]/12 hover:border-[#49352F]/30 hover:bg-white shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-heading font-extrabold text-xs text-[#49352F] truncate">
                  {summary.interventionType}
                </span>
                <Badge
                  variant={
                    summary.evidenceConfidence === "High"
                      ? "mint"
                      : summary.evidenceConfidence === "Moderate"
                      ? "amber"
                      : "coral"
                  }
                  size="sm"
                >
                  {summary.evidenceConfidence}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[10px] text-[#7A6862] block font-semibold">
                    Avg. Observed Gain
                  </span>
                  {summary.hasSufficientEvidence ? (
                    <span className="text-lg font-black text-[#2E7D5E]">
                      +{summary.averageObservedImprovement} pp
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#C54738]">
                      Insufficient Evidence
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#7A6862] block font-semibold">
                    Used In Class
                  </span>
                  <span className="text-xs font-bold text-[#49352F]">
                    {summary.timesUsed} {summary.timesUsed === 1 ? "session" : "sessions"}
                  </span>
                </div>
              </div>

              <p className="text-[10.5px] text-[#7A6862] leading-tight pt-1 border-t border-[#49352F]/8 line-clamp-2">
                {summary.recommendedWording}
              </p>
            </div>
          );
        })}
      </div>

      {/* Expandable Session Log Table */}
      {isExpanded && (
        <div className="pt-2 border-t border-[#49352F]/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#49352F]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#B26A1B]" />
              <span>
                {selectedType
                  ? `Recent Classroom Sessions for "${selectedType}"`
                  : "Recent Intervention Reassessment Logs"}
              </span>
            </span>
            {selectedType && (
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="text-xs text-[#C54738] hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#49352F]/12 bg-white">
            <table className="w-full text-[11px] text-[#49352F] text-left">
              <thead className="bg-[#FAF6E9] border-b border-[#49352F]/10 text-[10px] uppercase font-bold text-[#7A6862]">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Intervention Type</th>
                  <th className="p-2">Student</th>
                  <th className="p-2">Concept</th>
                  <th className="p-2">Pre-Score</th>
                  <th className="p-2">Post-Score</th>
                  <th className="p-2">Observed Delta</th>
                  <th className="p-2">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/8">
                {activeRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF6E9]/40 transition-colors">
                    <td className="p-2 text-[#7A6862] whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="p-2 font-bold text-[#49352F]">{r.interventionType}</td>
                    <td className="p-2 font-medium">{r.studentName}</td>
                    <td className="p-2 text-[#7A6862]">{r.conceptName}</td>
                    <td className="p-2 font-mono">{r.preInterventionScore}%</td>
                    <td className="p-2 font-mono font-bold">{r.postInterventionScore}%</td>
                    <td className="p-2 font-mono font-bold text-[#2E7D5E]">
                      +{r.scoreDelta} pp
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          r.outcome === "Mastered"
                            ? "mint"
                            : r.outcome === "Developing"
                            ? "amber"
                            : "coral"
                        }
                        size="sm"
                      >
                        {r.outcome}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
