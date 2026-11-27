"use client";

import React from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/shared/LanguageSelector";

export default function TutorialPrintPage() {
  const { t, tr } = useLanguage();
  const ps = t.tutorial.printSheet;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1E1] text-[#49352F] py-6 px-4 sm:px-8 font-sans print:p-0 print:bg-white print:text-black">
      {/* Non-printed Top Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/tutorial"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#49352F]/15 text-xs font-bold text-[#49352F] hover:bg-[#FAF6E9] shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{ps.backToTutorial}</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#7A6862] hover:text-[#49352F]"
          >
            {ps.dashboardLink}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector variant="default" />

          {/* Trigger Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#B26A1B]" />
            <span>{ps.printQuickStartBtn}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE A4 SHEET CONTAINER                                   */}
      {/* ============================================================== */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-[#49352F]/15 p-8 sm:p-12 print:shadow-none print:border-none print:p-0 print:max-w-full">
        {/* Document Header */}
        <div className="border-b-2 border-[#49352F]/30 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-[#49352F] font-heading">
                StudySaathi AI
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-[#FAF6E9] text-[#B26A1B] font-mono text-[10px] font-bold border border-[#B26A1B]/20">
                SFIC PS-60
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-[#49352F] mt-1 font-heading">
              {ps.sheetTitle}
            </h1>
            <p className="text-[11px] text-[#7A6862] mt-0.5">
              {ps.sheetOrgLine}
            </p>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-600 shrink-0">
            <div className="font-bold text-emerald-700">{ps.offlinePwaBadge}</div>
            <div>{ps.zeroCloudFees}</div>
            <div className="text-[10px] text-slate-400 mt-1">{ps.versionTag}</div>
          </div>
        </div>

        {/* 4-Step Bridge Workflow Grid */}
        <div className="mt-6">
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-900 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            {ps.cycleHeading}
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                  {tr("tutorial.printSheet.stepLabel", { step: 1 })}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{ps.step1Duration}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {ps.step1Title}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ps.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px]">
                  {tr("tutorial.printSheet.stepLabel", { step: 2 })}
                </span>
                <span className="text-[10px] font-mono text-rose-700 font-bold">{ps.step2Threshold}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {ps.step2Title}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ps.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                  {tr("tutorial.printSheet.stepLabel", { step: 3 })}
                </span>
                <span className="text-[10px] font-mono text-amber-800 font-bold">{ps.step3Tag}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {ps.step3Title}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ps.step3Desc}
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                  {tr("tutorial.printSheet.stepLabel", { step: 4 })}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">{ps.step4Threshold}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {ps.step4Title}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ps.step4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Real Classroom Evidence Box: Aarav Patel Case Study */}
        <div className="mt-5 p-4 rounded-xl border border-amber-300 bg-amber-50/60 print:bg-white print:border-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {ps.caseStudyHeading}
            </span>
            <span className="text-xs font-extrabold text-emerald-700 font-mono">
              {ps.caseStudyGain}
            </span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {ps.caseStudyBody}
          </p>
        </div>

        {/* Benchmark Standards & Rural Tips Split */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {/* Benchmarks */}
          <div className="p-3.5 rounded-xl border border-slate-300 space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-900">
              {ps.standardsHeading}
            </h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-900">
                <span className="font-bold">&lt; 60%</span>
                <span>{ps.stdSupport}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-bold">60% - 79%</span>
                <span>{ps.stdDeveloping}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="font-bold">&ge; 80%</span>
                <span>{ps.stdMastery}</span>
              </div>
            </div>
          </div>

          {/* Rural Classroom Low-Tech Tips */}
          <div className="p-3.5 rounded-xl border border-slate-300 space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-900">
              {ps.ruralTipsHeading}
            </h3>
            <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4 leading-tight">
              <li>
                <strong>{ps.tip1Title}</strong> {ps.tip1Body}
              </li>
              <li>
                <strong>{ps.tip2Title}</strong> {ps.tip2Body}
              </li>
              <li>
                <strong>{ps.tip3Title}</strong> {ps.tip3Body}
              </li>
              <li>
                <strong>{ps.tip4Title}</strong> {ps.tip4Body}
              </li>
            </ul>
          </div>
        </div>

        {/* School Record Signature Footer */}
        <div className="mt-8 pt-4 border-t-2 border-slate-900 flex items-end justify-between text-xs text-slate-700">
          <div>
            <div className="font-bold text-slate-900">
              {ps.signaturePrompt} ___________________________
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {ps.schoolClassDateLine}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 font-mono">
            <div>{ps.footerProjectTag}</div>
            <div>{ps.footerKeepNote}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
