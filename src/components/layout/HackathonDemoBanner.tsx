"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, Play } from "lucide-react";

export function HackathonDemoBanner() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 rounded-2xl border border-[#49352F]/15 dark:border-[#F2CAB3]/25 bg-gradient-to-r from-[#F2DCB5]/90 via-[#FAF6E9] to-[#F2CAB3]/80 dark:from-[#2A231E] dark:via-[#221C18] dark:to-[#2E2520] text-[#49352F] dark:text-[#F4F1E1] shadow-[0_8px_24px_rgba(73,53,47,0.06)] overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2CAB3] dark:bg-[#F2CAB3]/25 border border-[#49352F]/15 dark:border-[#F2CAB3]/30 text-[#49352F] dark:text-[#F4F1E1] font-bold shadow-xs">
            <Sparkles className="w-5 h-5 text-[#B26A1B] dark:text-[#F2CAB3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#B26A1B] dark:text-[#F2CAB3]">
                SFIC Gujarat Hackathon 2026
              </span>
              <span className="bg-white/80 dark:bg-[#1E1916] border border-[#49352F]/12 dark:border-[#F2CAB3]/25 text-[10px] text-[#49352F] dark:text-[#F4F1E1] px-2 py-0.5 rounded-full font-medium">
                Live Interactive Demo
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#49352F] dark:text-[#F4F1E1] mt-0.5">
              Smart Tracking & Remedial Action: The 2-Minute Judge Walkthrough
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Link
            href="/students?tour=aarav"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#49352F] dark:bg-[#F2CAB3] hover:bg-[#2C1F1B] dark:hover:bg-[#EFBDA4] px-3.5 py-2 text-xs font-bold text-white dark:text-[#35231C] shadow-xs transition-all hover:scale-102 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Aarav&apos;s Case</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-white/70 dark:bg-[#26201C] hover:bg-white dark:hover:bg-[#352B24] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/15 dark:border-[#F2CAB3]/25 transition-colors cursor-pointer"
            aria-label="Toggle details"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable walkthrough guide */}
      {isOpen && (
        <div className="border-t border-[#49352F]/10 dark:border-[#F2CAB3]/20 bg-white/60 dark:bg-[#1E1916]/80 p-4 sm:p-6 text-xs text-[#49352F] dark:text-[#F4F1E1]">
          <p className="font-semibold text-[#B26A1B] dark:text-[#F2CAB3] mb-3">
            Recommended Step-by-Step Flow for Evaluators:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                step: 1,
                title: "Initial Diagnostic",
                desc: "Aarav (Class 4-A) scored 35% on Division Basics across 2 consecutive evaluations.",
              },
              {
                step: 2,
                title: "Gap Detection",
                desc: "Engine flags \"Needs Support — High Priority\" with explainable pedagogical reasoning.",
              },
              {
                step: 3,
                title: "Targeted Remediation",
                desc: "5-step plan with physical counters, equal sharing mats, and teacher instructions.",
              },
              {
                step: 4,
                title: "Practice Activity",
                desc: "Interactive student practice quiz with instant feedback and auto-scored attempt.",
              },
              {
                step: 5,
                title: "Reassessment & Gain",
                desc: "Record new score (85%): engine logs +50 percentage-point gain and resolves gap!",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-3 rounded-xl bg-white dark:bg-[#26201C] border border-[#49352F]/10 dark:border-[#F2CAB3]/20 shadow-xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                  <span
                    className={`w-4 h-4 rounded-full ${
                      item.step === 5
                        ? "bg-[#2E7D5E] text-white"
                        : "bg-[#F2CAB3] dark:bg-[#F2CAB3]/30 text-[#49352F] dark:text-[#F4F1E1]"
                    } text-[10px] flex items-center justify-center font-bold`}
                  >
                    {item.step}
                  </span>
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/75 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
