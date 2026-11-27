"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline" | "glass";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  className = "",
}: TabsProps) {
  if (variant === "pill") {
    return (
      <div className="max-w-full overflow-x-auto no-scrollbar py-0.5">
        <div
          role="tablist"
          className={cn(
            "inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#FAF6E9] dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 backdrop-blur-md shrink-0",
            className
          )}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-[#F2CAB3] dark:bg-[#F2CAB3]/25 text-[#49352F] dark:text-[#F4F1E1] shadow-xs font-black border border-[#49352F]/15 dark:border-[#F2CAB3]/30"
                    : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1] hover:bg-white dark:hover:bg-[#26201C]"
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                      isActive
                        ? "bg-[#49352F]/10 dark:bg-[#F2CAB3]/20 text-[#49352F] dark:text-[#F4F1E1]"
                        : "bg-[#49352F]/5 dark:bg-[#F2CAB3]/10 text-[#7A6862] dark:text-[#FAF6E9]/70"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Underline variant
  return (
    <div className="max-w-full overflow-x-auto no-scrollbar">
      <div
        role="tablist"
        className={cn("inline-flex items-center gap-6 border-b border-[#49352F]/15 dark:border-[#F2CAB3]/20 shrink-0", className)}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative pb-3 pt-1 inline-flex items-center gap-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
                isActive
                  ? "text-[#49352F] dark:text-[#F4F1E1] border-b-2 border-[#B26A1B] dark:border-[#F2CAB3] font-extrabold"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#FAF6E9] dark:bg-[#1E1916] text-[#7A6862] dark:text-[#FAF6E9]/70 border border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
