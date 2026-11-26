"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import {
  AlertCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  X,
} from "lucide-react";
import { TodaysPrioritiesResult } from "@/lib/engine/todaysPriorities";

export type PriorityQueueCategory =
  | "immediate"
  | "developing"
  | "reassess"
  | "mastered"
  | "reopened";

interface TodaysPrioritiesSectionProps {
  priorities: TodaysPrioritiesResult;
  activeCategory: PriorityQueueCategory | null;
  onSelectCategory: (category: PriorityQueueCategory | null) => void;
}

export function TodaysPrioritiesSection({
  priorities,
  activeCategory,
  onSelectCategory,
}: TodaysPrioritiesSectionProps) {
  const { t, tr } = useLanguage();
  const pr = t.priorities;

  const handleTileClick = (category: PriorityQueueCategory) => {
    if (activeCategory === category) {
      onSelectCategory(null);
    } else {
      onSelectCategory(category);
    }
  };

  const categories = [
    {
      id: "immediate" as PriorityQueueCategory,
      label: pr.immediateLabel,
      count: priorities.immediateSupportCount,
      icon: AlertCircle,
      iconColor: "text-[#C54738]",
      badgeVariant: "coral" as const,
      borderActive: "border-[#C54738] bg-[#FBECE9] ring-2 ring-[#C54738]/20",
      borderInactive: "border-[#C54738]/25 bg-white hover:bg-[#FBECE9]/50",
      accentDot: "bg-[#C54738]",
      description: pr.immediateDesc,
    },
    {
      id: "developing" as PriorityQueueCategory,
      label: pr.developingLabel,
      count: priorities.developingCount,
      icon: Clock,
      iconColor: "text-[#B26A1B]",
      badgeVariant: "amber" as const,
      borderActive: "border-[#B26A1B] bg-[#FAF6E9] ring-2 ring-[#B26A1B]/20",
      borderInactive: "border-[#B26A1B]/25 bg-white hover:bg-[#FAF6E9]/50",
      accentDot: "bg-[#B26A1B]",
      description: pr.developingDesc,
    },
    {
      id: "reassess" as PriorityQueueCategory,
      label: pr.reassessLabel,
      count: priorities.readyToReassessCount,
      icon: RotateCcw,
      iconColor: "text-[#2E7D5E]",
      badgeVariant: "mint" as const,
      borderActive: "border-[#2E7D5E] bg-[#EAF4EE] ring-2 ring-[#2E7D5E]/20",
      borderInactive: "border-[#2E7D5E]/25 bg-white hover:bg-[#EAF4EE]/50",
      accentDot: "bg-[#2E7D5E]",
      description: pr.reassessDesc,
    },
    {
      id: "mastered" as PriorityQueueCategory,
      label: pr.masteredLabel,
      count: priorities.recentlyMasteredCount,
      icon: CheckCircle2,
      iconColor: "text-[#2E7D5E]",
      badgeVariant: "mint" as const,
      borderActive: "border-[#2E7D5E] bg-[#EAF4EE] ring-2 ring-[#2E7D5E]/20",
      borderInactive: "border-[#49352F]/15 bg-white hover:bg-[#EAF4EE]/40",
      accentDot: "bg-[#2E7D5E]",
      description: pr.masteredDesc,
    },
  ];

  // Optional 5th tile: Reopened Gaps (if > 0)
  if (priorities.reopenedGapsCount > 0) {
    categories.push({
      id: "reopened" as PriorityQueueCategory,
      label: pr.reopenedLabel,
      count: priorities.reopenedGapsCount,
      icon: AlertTriangle,
      iconColor: "text-[#C54738]",
      badgeVariant: "coral" as const,
      borderActive: "border-[#C54738] bg-[#FBECE9] ring-2 ring-[#C54738]/20",
      borderInactive: "border-[#C54738]/30 bg-white hover:bg-[#FBECE9]/50",
      accentDot: "bg-[#C54738]",
      description: pr.reopenedDesc,
    });
  }

  return (
    <Card
      variant="glass"
      className="p-4 border-[#49352F]/15 bg-white text-[#49352F] shadow-xs space-y-3"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#49352F]/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#B26A1B]" />
          <h2 className="font-heading text-sm font-black tracking-tight text-[#49352F] uppercase">
            {pr.title}
          </h2>
          <Badge variant="saffron" size="sm">
            {tr("priorities.actionableCount", { count: priorities.totalActionableStudents })}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#7A6862] hidden sm:inline">
            {pr.subtitle}
          </span>
          {activeCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF6E9] border border-[#B26A1B]/30 text-[#8D4E10] hover:bg-[#F2CAB3]/40 cursor-pointer transition-colors"
            >
              <span>{pr.clearFilterBtn}</span>
              <X className="w-3 h-3 text-[#C54738]" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Interactive Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleTileClick(cat.id)}
              aria-pressed={isActive}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                isActive ? cat.borderActive : cat.borderInactive
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#49352F]">
                  <span className={`w-2 h-2 rounded-full ${cat.accentDot}`} />
                  <Icon className={`w-3.5 h-3.5 ${cat.iconColor} shrink-0`} />
                  <span className="truncate">{cat.label}</span>
                </span>
                {isActive && (
                  <span className="text-[10px] text-[#C54738] font-bold">✓</span>
                )}
              </div>

              <div className="mt-1.5 flex items-baseline justify-between gap-1">
                <span className="font-heading font-black text-xl text-[#49352F]">
                  {cat.count}
                </span>
                <span className="text-[10px] text-[#7A6862] truncate">
                  {cat.count === 1 ? pr.studentSingular : pr.studentPlural}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
