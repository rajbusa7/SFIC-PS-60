"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Languages } from "lucide-react";

export function LanguageSelector({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "glass";
}) {
  const { language, setLanguage } = useLanguage();
  const isGlass = variant === "glass";

  const containerClasses = isGlass
    ? `inline-flex h-9 items-center rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-0.5 shadow-inner ${className}`
    : `inline-flex h-9 items-center rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] p-0.5 shadow-2xs ${className}`;

  const labelClasses = isGlass
    ? "hidden 2xl:flex items-center px-1.5 py-1 text-xs font-medium text-slate-400"
    : "hidden 2xl:flex items-center px-1.5 py-1 text-xs font-medium text-[#7A6862] dark:text-[#FAF6E9]/60";

  const iconClasses = isGlass
    ? "w-3.5 h-3.5 mr-1 text-slate-400 shrink-0"
    : "w-3.5 h-3.5 mr-1 text-[#7A6862] dark:text-[#FAF6E9]/60 shrink-0";

  const activeBtnClasses = isGlass
    ? "bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(255,138,61,0.4)]"
    : "bg-[#F2CAB3] dark:bg-[#F2CAB3]/30 text-[#49352F] dark:text-[#F4F1E1] font-bold shadow-xs";

  const inactiveBtnClasses = isGlass
    ? "text-slate-300 hover:text-white hover:bg-white/10"
    : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916]";

  return (
    <div
      data-tour="language-toggle"
      className={containerClasses}
    >
      <div className={labelClasses}>
        <Languages className={iconClasses} />
        <span>Lang:</span>
      </div>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-label="Switch language to English"
        className={`px-2 lg:px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
          language === "en" ? activeBtnClasses : inactiveBtnClasses
        }`}
      >
        <span className="hidden sm:inline">English</span>
        <span className="sm:hidden">EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage("gu")}
        aria-label="Switch language to Gujarati"
        className={`px-2 lg:px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
          language === "gu" ? activeBtnClasses : inactiveBtnClasses
        }`}
      >
        <span className="hidden sm:inline">ગુજરાતી</span>
        <span className="sm:hidden">GU</span>
      </button>
    </div>
  );
}
