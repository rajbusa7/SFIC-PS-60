"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { HelpCircle, ExternalLink, X } from "lucide-react";

export type HelpTermKey =
  | "masteryThreshold"
  | "gapDetection"
  | "delta"
  | "remedialPlan";

interface ContextualHelpProps {
  termKey?: HelpTermKey;
  customTitle?: string;
  customDesc?: string;
  tutorialTab?: string;
  className?: string;
}

const TERM_META: Record<
  HelpTermKey,
  {
    titleField: "masteryThresholdTitle" | "gapDetectionTitle" | "deltaTitle" | "remedialPlanTitle";
    descField: "masteryThresholdDesc" | "gapDetectionDesc" | "deltaDesc" | "remedialPlanDesc";
    tab: string;
  }
> = {
  masteryThreshold: {
    titleField: "masteryThresholdTitle",
    descField: "masteryThresholdDesc",
    tab: "faq",
  },
  gapDetection: {
    titleField: "gapDetectionTitle",
    descField: "gapDetectionDesc",
    tab: "workflow",
  },
  delta: {
    titleField: "deltaTitle",
    descField: "deltaDesc",
    tab: "glossary",
  },
  remedialPlan: {
    titleField: "remedialPlanTitle",
    descField: "remedialPlanDesc",
    tab: "lessons",
  },
};

export function ContextualHelp({
  termKey,
  customTitle,
  customDesc,
  tutorialTab,
  className = "",
}: ContextualHelpProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const config = termKey ? TERM_META[termKey] : null;

  const title =
    customTitle ||
    (config ? t.help[config.titleField] : t.help.quickHelpTitle);

  const desc =
    customDesc ||
    (config ? t.help[config.descField] : t.help.quickHelpDesc);

  const tab = tutorialTab || (config ? config.tab : "faq");

  return (
    <span className={`relative inline-flex items-center align-middle ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
        aria-label={`Learn more about ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 rounded-2xl bg-[#14123D]/95 border border-[#FF8A3D]/40 p-3 shadow-2xl backdrop-blur-xl z-50 text-white space-y-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <span>{title}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-sm"
              aria-label="Close popover"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-snug font-normal">
            {desc}
          </p>

          <div className="pt-1 flex items-center justify-end">
            <Link
              href={`/tutorial?tab=${tab}`}
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-[#3DDBA9] hover:underline flex items-center gap-0.5"
            >
              <span>{t.help.learnMore}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}
