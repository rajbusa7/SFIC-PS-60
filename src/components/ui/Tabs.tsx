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
      <div
        role="tablist"
        className={cn(
          "inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md",
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
                "relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                    isActive
                      ? "bg-slate-950/20 text-slate-950"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  return (
    <div
      role="tablist"
      className={cn("flex items-center gap-6 border-b border-slate-800", className)}
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
              "relative pb-3 pt-1 inline-flex items-center gap-2 text-xs font-bold transition-all cursor-pointer",
              isActive
                ? "text-amber-400 border-b-2 border-amber-500 font-extrabold"
                : "text-slate-400 hover:text-white"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
