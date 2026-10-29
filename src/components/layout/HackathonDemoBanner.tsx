"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, CheckCircle2, Play } from "lucide-react";

export function HackathonDemoBanner() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-bold shadow-md">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
                SFIC Gujarat Hackathon 2026
              </span>
              <span className="bg-indigo-700/80 text-[10px] text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                Live Interactive Demo
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
              Smart Tracking & Remedial Action: The 2-Minute Judge Walkthrough
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Link
            href="/students/std-aarav"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition-all hover:scale-102 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Aarav&apos;s Case</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Toggle details"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable walkthrough guide */}
      {isOpen && (
        <div className="border-t border-indigo-700/60 bg-indigo-950/70 p-4 sm:p-6 text-xs text-indigo-100">
          <p className="font-semibold text-amber-300 mb-3">
            Recommended Step-by-Step Flow for Evaluators:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center">1</span>
                <span>Initial Diagnostic</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Aarav (Class 4-A) scored 35% on Division Basics across 2 consecutive evaluations.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center">2</span>
                <span>Gap Detection</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Engine flags &quot;Needs Support — High Priority&quot; with explainable pedagogical reasoning.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center">3</span>
                <span>Targeted Remediation</span>
              </div>
              <p className="text-[11px] text-slate-300">
                5-step plan with physical counters, equal sharing mats, and teacher instructions.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center">4</span>
                <span>Practice Activity</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Interactive student practice quiz with instant feedback and auto-scored attempt.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-[10px] flex items-center justify-center">5</span>
                <span>Reassessment & Gain</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Record new score (85%): engine logs +50 percentage-point gain and resolves gap!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
