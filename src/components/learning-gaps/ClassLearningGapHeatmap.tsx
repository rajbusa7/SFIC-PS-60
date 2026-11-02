"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type {
  ClassHeatmapData,
  ClassHeatmapFilter,
  CompetencyHeatmapRow,
} from "@/lib/engine/classHeatmapEngine";
import {
  Grid,
  Filter,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  Info,
} from "lucide-react";

interface ClassLearningGapHeatmapProps {
  heatmapData: ClassHeatmapData;
  activeFilter: ClassHeatmapFilter | null;
  onSelectFilter: (filter: ClassHeatmapFilter | null) => void;
  selectedClass?: string;
  onSelectClass?: (classId: string) => void;
}

export function ClassLearningGapHeatmap({
  heatmapData,
  activeFilter,
  onSelectFilter,
  selectedClass = "cls-4a",
  onSelectClass,
}: ClassLearningGapHeatmapProps) {
  const { competencies, className, totalClassStudents } = heatmapData;

  const handleCellClick = (
    competencyId: string,
    competencyName: string,
    status: "Needs Support" | "Developing" | "Mastered"
  ) => {
    // If the same filter is clicked, toggle it off (clear filter)
    if (
      activeFilter &&
      activeFilter.competencyName === competencyName &&
      activeFilter.status === status
    ) {
      onSelectFilter(null);
    } else {
      onSelectFilter({ competencyId, competencyName, status });
    }
  };

  const isCellActive = (
    competencyName: string,
    status: "Needs Support" | "Developing" | "Mastered"
  ) => {
    return (
      activeFilter?.competencyName === competencyName &&
      activeFilter?.status === status
    );
  };

  return (
    <Card
      variant="glass"
      className="p-4 sm:p-5 border-[#49352F]/15 bg-gradient-to-r from-[#FAF6E9] via-white to-[#FAF6E9] shadow-[0_4px_20px_rgba(73,53,47,0.05)] space-y-3.5 text-[#49352F]"
    >
      {/* Heatmap Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#49352F]/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#B26A1B]/15 text-[#B26A1B] flex items-center justify-center shrink-0">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm sm:text-base font-bold text-[#49352F]">
                Class Learning Gap Heatmap
              </h3>
              <Badge variant="saffron" size="sm">
                Interactive Matrix
              </Badge>
            </div>
            <p className="text-[11px] text-[#7A6862]">
              Cohort distribution of competencies. Click any cell to isolate and view those specific students below.
            </p>
          </div>
        </div>

        {/* Class Selector Dropdown & Student Count Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF6E9] border border-[#49352F]/15 text-xs text-[#49352F]">
            <Users className="w-3.5 h-3.5 text-[#B26A1B]" />
            <span className="font-semibold">{className}</span>
            <span className="text-[10px] text-[#7A6862]">({totalClassStudents} Students)</span>
          </div>

          {activeFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectFilter(null)}
              className="rounded-full text-xs font-bold text-[#C54738] border-[#C54738]/30 hover:bg-[#FBECE9] bg-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              <span>Clear Filter</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Notification Bar */}
      {activeFilter && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#FFFBEB] via-[#FBECE9] to-[#FAF6E9] border border-[#B26A1B]/30 flex items-center justify-between gap-2 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#B26A1B] shrink-0" />
            <span className="text-[#49352F]">
              Active Heatmap Filter:{" "}
              <strong className="text-[#49352F]">{activeFilter.competencyName}</strong>
              {" • "}
              <span
                className={`font-bold ${
                  activeFilter.status === "Needs Support"
                    ? "text-[#C54738]"
                    : activeFilter.status === "Developing"
                    ? "text-[#B26A1B]"
                    : "text-[#2E7D5E]"
                }`}
              >
                {activeFilter.status}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectFilter(null)}
            className="text-[11px] font-bold text-[#7A6862] hover:text-[#C54738] flex items-center gap-1 underline underline-offset-2 cursor-pointer"
          >
            <span>Show All Learning Gaps</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Interactive Competency Heatmap Rows */}
      <div className="space-y-2 pt-0.5">
        {competencies.map((comp) => {
          const supportPct = Math.round((comp.needsSupportCount / comp.totalStudents) * 100);
          const devPct = Math.round((comp.developingCount / comp.totalStudents) * 100);
          const mastPct = Math.round((comp.masteredCount / comp.totalStudents) * 100);

          const isSupportActive = isCellActive(comp.competencyName, "Needs Support");
          const isDevActive = isCellActive(comp.competencyName, "Developing");
          const isMastActive = isCellActive(comp.competencyName, "Mastered");

          return (
            <div
              key={comp.competencyId}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                isSupportActive || isDevActive || isMastActive
                  ? "bg-[#FAF6E9]/90 border-[#B26A1B]/40 shadow-xs"
                  : "bg-white/95 border-[#49352F]/10 hover:border-[#49352F]/20"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                {/* Left: Competency Title, Subject Badge, Mini Proportion Bar */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-bold text-sm text-[#49352F]">
                      {comp.competencyName}
                    </span>
                    <Badge
                      variant={
                        comp.subjectCode === "MATH"
                          ? "default"
                          : comp.subjectCode === "ENG"
                          ? "saffron"
                          : "mint"
                      }
                      size="sm"
                    >
                      {comp.subjectName}
                    </Badge>
                  </div>

                  {/* Compact Visual Distribution Bar */}
                  <div className="flex items-center gap-2 text-[10px] text-[#7A6862]">
                    <div className="w-32 sm:w-44 h-1.5 rounded-full overflow-hidden flex bg-[#FAF6E9] border border-[#49352F]/10">
                      <div
                        style={{ width: `${supportPct}%` }}
                        className="bg-[#C54738] h-full"
                        title={`Needs Support: ${comp.needsSupportCount} (${supportPct}%)`}
                      />
                      <div
                        style={{ width: `${devPct}%` }}
                        className="bg-[#B26A1B] h-full"
                        title={`Developing: ${comp.developingCount} (${devPct}%)`}
                      />
                      <div
                        style={{ width: `${mastPct}%` }}
                        className="bg-[#2E7D5E] h-full"
                        title={`Mastered: ${comp.masteredCount} (${mastPct}%)`}
                      />
                    </div>
                    <span>{comp.totalStudents} assessed</span>
                  </div>
                </div>

                {/* Right: 3 Interactive Clickable Cells */}
                <div className="grid grid-cols-3 gap-2 shrink-0">
                  {/* Cell 1: Needs Support */}
                  <button
                    type="button"
                    onClick={() =>
                      handleCellClick(comp.competencyId, comp.competencyName, "Needs Support")
                    }
                    className={`px-3 py-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSupportActive
                        ? "bg-[#C54738] text-white border-2 border-[#991B1B] shadow-md ring-2 ring-[#C54738]/25 scale-[1.02]"
                        : "bg-[#FBECE9] text-[#C54738] border border-[#C54738]/25 hover:bg-[#F2CAB3]/60 hover:border-[#C54738]/50"
                    }`}
                    title={`Click to show ${comp.needsSupportCount} students needing support in ${comp.competencyName}`}
                  >
                    <span className="font-heading font-extrabold text-sm sm:text-base leading-none">
                      {comp.needsSupportCount}
                    </span>
                    <span
                      className={`text-[9.5px] uppercase font-bold tracking-tight mt-0.5 ${
                        isSupportActive ? "text-white" : "text-[#A93327]"
                      }`}
                    >
                      Needs Support
                    </span>
                  </button>

                  {/* Cell 2: Developing */}
                  <button
                    type="button"
                    onClick={() =>
                      handleCellClick(comp.competencyId, comp.competencyName, "Developing")
                    }
                    className={`px-3 py-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isDevActive
                        ? "bg-[#B26A1B] text-white border-2 border-[#8D4E10] shadow-md ring-2 ring-[#B26A1B]/25 scale-[1.02]"
                        : "bg-[#FFFBEB] text-[#B26A1B] border border-[#B26A1B]/25 hover:bg-[#F2CAB3]/60 hover:border-[#B26A1B]/50"
                    }`}
                    title={`Click to show ${comp.developingCount} students developing in ${comp.competencyName}`}
                  >
                    <span className="font-heading font-extrabold text-sm sm:text-base leading-none">
                      {comp.developingCount}
                    </span>
                    <span
                      className={`text-[9.5px] uppercase font-bold tracking-tight mt-0.5 ${
                        isDevActive ? "text-white" : "text-[#8D4E10]"
                      }`}
                    >
                      Developing
                    </span>
                  </button>

                  {/* Cell 3: Mastered */}
                  <button
                    type="button"
                    onClick={() =>
                      handleCellClick(comp.competencyId, comp.competencyName, "Mastered")
                    }
                    className={`px-3 py-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isMastActive
                        ? "bg-[#2E7D5E] text-white border-2 border-[#1B503B] shadow-md ring-2 ring-[#2E7D5E]/25 scale-[1.02]"
                        : "bg-[#EAF4EE] text-[#2E7D5E] border border-[#2E7D5E]/25 hover:bg-[#2E7D5E]/15 hover:border-[#2E7D5E]/50"
                    }`}
                    title={`Click to show ${comp.masteredCount} students who mastered ${comp.competencyName}`}
                  >
                    <span className="font-heading font-extrabold text-sm sm:text-base leading-none">
                      {comp.masteredCount}
                    </span>
                    <span
                      className={`text-[9.5px] uppercase font-bold tracking-tight mt-0.5 ${
                        isMastActive ? "text-white" : "text-[#215A43]"
                      }`}
                    >
                      Mastered
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
