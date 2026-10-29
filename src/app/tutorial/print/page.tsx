"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Globe, CheckCircle2, AlertTriangle, Sparkles, Layers, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function TutorialPrintPage() {
  const { language, setLanguage } = useLanguage();
  const [printLang, setPrintLang] = useState<"en" | "gu">(language === "gu" ? "gu" : "en");

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-6 px-4 sm:px-8 font-sans print:p-0 print:bg-white print:text-black">
      {/* Non-printed Top Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/tutorial"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Tutorial</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Language Toggle */}
          <div className="inline-flex rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setPrintLang("en")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                printLang === "en"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setPrintLang("gu")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                printLang === "gu"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ગુજરાતી
            </button>
          </div>

          {/* Trigger Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Quick-Start Sheet (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE A4 SHEET CONTAINER                                   */}
      {/* ============================================================== */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-300 p-8 sm:p-12 print:shadow-none print:border-none print:p-0 print:max-w-full">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-indigo-900">
                શિક્ષાસેતુ AI • ShikshaSetu AI
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-amber-100 text-amber-900 font-mono text-[10px] font-bold border border-amber-300">
                SFIC PS-60
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-800 mt-1">
              {printLang === "gu"
                ? "પ્રાથમિક શાળા શિક્ષક ઝડપી શરૂઆત માર્ગદર્શિકા (સંદર્ભ પત્રક)"
                : "Primary School Teacher Quick-Start Desk Reference Guide"}
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gujarat Primary Education • NIPUN Bharat Foundational Literacy &amp; Numeracy (FLN)
            </p>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-600 shrink-0">
            <div className="font-bold text-emerald-700">100% Offline PWA</div>
            <div>Zero Cloud / Zero API Fees</div>
            <div className="text-[10px] text-slate-400 mt-1">v1.0 • Formative Remediation</div>
          </div>
        </div>

        {/* 4-Step Bridge Workflow Grid */}
        <div className="mt-6">
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-900 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            {printLang === "gu" ? "૪-પગલાંનું સેતુ ચક્ર (The 4-Step Bridge Cycle)" : "The 4-Step Bridge Pedagogical Cycle"}
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                  {printLang === "gu" ? "પગલું ૧" : "STEP 1"}
                </span>
                <span className="text-[10px] font-mono text-slate-500">30 seconds</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {printLang === "gu" ? "મૂલ્યાંકન પરિણામ નોંધો" : "Record Assessment"}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {printLang === "gu"
                  ? "વિદ્યાર્થીના યુનિટ ટેસ્ટ કે ઓરલ ટેસ્ટના ગુણ સિસ્ટમમાં દાખલ કરો. માત્ર ૧ ક્લિકથી સંગ્રહ થાય છે."
                  : "Input periodic unit or oral assessment scores per concept. Fast, zero-lag offline local storage."}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px]">
                  {printLang === "gu" ? "પગલું ૨" : "STEP 2"}
                </span>
                <span className="text-[10px] font-mono text-rose-700 font-bold">&lt; 60% Threshold</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {printLang === "gu" ? "શિક્ષણ ત્રુટિ ઓળખો" : "Inspect Learning Gap"}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {printLang === "gu"
                  ? "૬૦% થી ઓછા ગુણ પર આપોઆપ ત્રુટિ ફ્લેગ થાય છે. પારદર્શક AI વિદ્યાર્થી અટકવાનું સ્પષ્ટ કારણ જણાવે છે."
                  : "Scores below 60% automatically flag as gaps with clear, deterministic root causes (e.g. remainder confusion)."}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                  {printLang === "gu" ? "પગલું ૩" : "STEP 3"}
                </span>
                <span className="text-[10px] font-mono text-amber-800 font-bold">Concrete &rarr; Abstract</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {printLang === "gu" ? "૫-પગલાંની ઉપચાર યોજના અમલી કરો" : "Deploy 5-Step Remedial Plan"}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {printLang === "gu"
                  ? "મણકા, કાંકરા કે દીવાસળી જેવા મૂર્ત સાધનોથી શરૂ કરી ચિત્રો અને પછી લેખિત ગણતરી કરાવો."
                  : "Execute structured 5 steps starting with physical manipulatives (counters, bowls) before visual diagrams."}
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 print:bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                  {printLang === "gu" ? "પગલું ૪" : "STEP 4"}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">&ge; 80% Mastery</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {printLang === "gu" ? "પુનઃટેસ્ટ અને +pp વૃદ્ધિ" : "Reassess & Verify Delta Gain"}
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                {printLang === "gu"
                  ? "ઉપચાર પછી નવો ટેસ્ટ લો. ૮૦%+ પર નિપુણતા સિદ્ધ થશે અને +પોઇન્ટ્સ સુધારાની ઉજવણી કરી શકાશે."
                  : "Administer formative re-test. Reaching 80%+ confirms mastery and records documented delta (+pp) growth."}
              </p>
            </div>
          </div>
        </div>

        {/* Real Classroom Evidence Box: Aarav Patel Case Study */}
        <div className="mt-5 p-4 rounded-xl border border-amber-300 bg-amber-50/60 print:bg-white print:border-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {printLang === "gu" ? "વર્ગખંડ સફળતા ઉદાહરણ: આરવ પટેલ (ધોરણ ૪-અ)" : "Real Classroom Case Study: Aarav Patel (Class 4-A)"}
            </span>
            <span className="text-xs font-extrabold text-emerald-700 font-mono">
              35% &rarr; 85% (+50 pp Gain)
            </span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {printLang === "gu"
              ? "આરવ ભાગાકારમાં શેષ સમજવામાં અટકતો હતો (૩૫%). શિક્ષકે ૫-પગલાંની યોજના હેઠળ ૧૪ મણકા ૩ વાટકીમાં વહેંચાવ્યા. ૩ દિવસની ૧૫ મિનિટની પ્રવૃત્તિ બાદ પુનઃટેસ્ટમાં આરવે ૮૫% મેળવી નિપુણતા સિદ્ધ કરી."
              : "Aarav struggled with remainders in division (baseline 35%). The teacher implemented the 5-step concrete plan using 14 beads and 3 bowls for 15 minutes daily. On Day 4 formative reassessment, Aarav scored 85%, closing the gap."}
          </p>
        </div>

        {/* Benchmark Standards & Rural Tips Split */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {/* Benchmarks */}
          <div className="p-3.5 rounded-xl border border-slate-300 space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-900">
              {printLang === "gu" ? "નિપુણ ભારત માનક ગુણ માપદંડ" : "NIPUN FLN Benchmark Standards"}
            </h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-900">
                <span className="font-bold">&lt; 60%</span>
                <span>{printLang === "gu" ? "સહાયની જરૂર (ત્રુટિ ફ્લેગ)" : "Needs Support (Gap Flagged)"}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-bold">60% – 79%</span>
                <span>{printLang === "gu" ? "વિકાસશીલ (પ્રગતિ ચાલુ)" : "Developing (In Progress)"}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="font-bold">&ge; 80%</span>
                <span>{printLang === "gu" ? "નિપુણ / પારંગત (સિદ્ધ)" : "Mastery Verified (Bridge Crossed)"}</span>
              </div>
            </div>
          </div>

          {/* Rural Classroom Low-Tech Tips */}
          <div className="p-3.5 rounded-xl border border-slate-300 space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-900">
              {printLang === "gu" ? "ગ્રામીણ શાળાઓ માટે સુવર્ણ સૂચનો" : "4 Low-Cost Rural Classroom Tips"}
            </h3>
            <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4 leading-tight">
              <li>
                <strong>{printLang === "gu" ? "મફત સ્થાનિક સાધનો:" : "Zero-Cost Tools:"}</strong>{" "}
                {printLang === "gu" ? "ખરીદેલ કિટને બદલે કાંકરા, બીજ અને દીવાસળી વાપરો." : "Use local pebbles, seeds, and matchsticks."}
              </li>
              <li>
                <strong>{printLang === "gu" ? "૧૫ મિનિટનો સમય:" : "15-Min Bursts:"}</strong>{" "}
                {printLang === "gu" ? "રોજ સવારે પ્રાર્થના પછી ૧૫ મિનિટ નાની ટુકડીમાં કામ કરાવો." : "Do 15-minute focused remedial practice daily."}
              </li>
              <li>
                <strong>{printLang === "gu" ? "સાથી અધ્યયન:" : "Peer Buddy:"}</strong>{" "}
                {printLang === "gu" ? "૮૦%+ મેળવનાર બાળકને સહાયક બનાવી જોડી બનાવો." : "Pair 80%+ mastery students as mentors."}
              </li>
              <li>
                <strong>{printLang === "gu" ? "૧૦૦% ઓફલાઇન:" : "Offline Ready:"}</strong>{" "}
                {printLang === "gu" ? "ઇન્ટરનેટ વિના પણ ડેટા સુરક્ષિત સચવાય છે." : "Works without school Wi-Fi or data connection."}
              </li>
            </ul>
          </div>
        </div>

        {/* School Record Signature Footer */}
        <div className="mt-8 pt-4 border-t-2 border-slate-900 flex items-end justify-between text-xs text-slate-700">
          <div>
            <div className="font-bold text-slate-900">
              {printLang === "gu" ? "શિક્ષકનું નામ / સહી:" : "Teacher Name & Signature:"} ___________________________
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {printLang === "gu" ? "શાળા: _______________________ વર્ગ: _______ તારીખ: ____________" : "School: _______________________ Class: _______ Date: ____________"}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 font-mono">
            <div>ShikshaSetu AI • Gujarat SFIC PS-60</div>
            <div>Printable Reference Sheet • Keep at Teacher Desk</div>
          </div>
        </div>
      </div>
    </div>
  );
}
