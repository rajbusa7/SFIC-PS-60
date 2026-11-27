"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ALL_LANGUAGES,
  searchLanguages,
  type LanguageConfig,
} from "@/lib/i18n/registry";
import type { SupportedLanguage, SupportedScript } from "../../../packages/shared/src/types/notice";
import { Languages, ChevronDown, Search, Check, X } from "lucide-react";

export function LanguageSelector({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "glass";
}) {
  const { language, script, languageMeta, scriptMeta, isLoadingLocale, setLanguage, setScript } =
    useLanguage();
  const isGlass = variant === "glass";

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = useMemo(() => {
    return searchLanguages(searchQuery);
  }, [searchQuery]);

  const closeMenu = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelectLanguage = (lang: LanguageConfig, selectedScript?: SupportedScript) => {
    setLanguage(lang.code as SupportedLanguage, selectedScript);
    closeMenu();
  };

  const triggerClasses = isGlass
    ? `inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/70 backdrop-blur-md px-2.5 text-xs font-semibold text-white hover:bg-slate-800/80 transition-all cursor-pointer shadow-inner ${className}`
    : `inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] px-2.5 text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] transition-all cursor-pointer shadow-2xs ${className}`;

  const panelClasses = isGlass
    ? "absolute end-0 top-full mt-2 w-[310px] sm:w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-white/15 bg-[#1E1916]/95 backdrop-blur-xl text-[#F4F1E1] shadow-2xl z-50 overflow-hidden animate-grow-top-right origin-top-right"
    : "absolute end-0 top-full mt-2 w-[310px] sm:w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] shadow-xl z-50 overflow-hidden animate-grow-top-right origin-top-right";

  const statusLabelFor = (lang: LanguageConfig) => {
    if (lang.supportStage === "verified") {
      return {
        text: "Full",
        cls: "bg-[#2E7D5E]/15 text-[#2E7D5E] border-[#2E7D5E]/25",
      };
    }
    if (lang.supportStage === "partial") {
      return {
        text: "Partial",
        cls: "bg-[#B26A1B]/15 text-[#B26A1B] border-[#B26A1B]/25",
      };
    }
    return {
      text: "Beta",
      cls: isGlass
        ? "bg-white/10 text-slate-300 border-white/15"
        : "bg-[#F4F1E1] dark:bg-[#1E1916] text-[#7A6862] dark:text-[#C2B3AC] border-[#49352F]/15",
    };
  };

  return (
    <div ref={containerRef} data-tour="language-toggle" className="relative inline-block">
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Select website language (current: ${languageMeta.name} - ${languageMeta.nativeName})`}
        className={triggerClasses}
      >
        <Languages className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="truncate max-w-[92px] sm:max-w-[120px]">
          {languageMeta.nativeName}
        </span>
        {languageMeta.scriptVariants.length > 1 && (
          <span className="hidden md:inline-block px-1 py-0.5 text-[10px] rounded bg-[#F2CAB3]/50 dark:bg-[#F2CAB3]/20 font-bold">
            {scriptMeta.script}
          </span>
        )}
        <span className="text-[10px] font-bold uppercase opacity-65 hidden sm:inline">
          ({language.toUpperCase()})
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Language and script selection"
          className={panelClasses}
        >
          {/* Search bar */}
          <div className="p-2.5 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute start-3 text-[#7A6862] dark:text-[#C2B3AC] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 22+ Indian languages..."
                aria-label="Search languages"
                className="w-full ps-8 pe-8 py-1.5 text-xs rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-[#FAF6E9] dark:bg-[#1B1614] text-[#49352F] dark:text-[#F4F1E1] placeholder:text-[#9E8E87] focus:outline-none focus:border-[#B26A1B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear language search"
                  className="absolute end-2.5 text-[#7A6862] hover:text-[#49352F] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#7A6862] dark:text-[#C2B3AC] px-1">
              <span>{ALL_LANGUAGES.length} supported locales (8th Schedule + EN)</span>
              {isLoadingLocale && <span>Loading...</span>}
            </div>
          </div>

          {/* Language list */}
          <div
            role="listbox"
            aria-label="Available languages"
            className="max-h-[300px] overflow-y-auto p-1.5 space-y-1"
          >
            {filteredLanguages.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#7A6862] dark:text-[#C2B3AC]">
                No matching language found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = language === lang.code;
                const badge = statusLabelFor(lang);
                return (
                  <div
                    key={lang.code}
                    className={`rounded-xl border transition-colors ${
                      isSelected
                        ? "bg-[#F2CAB3]/35 dark:bg-[#F2CAB3]/15 border-[#B26A1B]/40"
                        : "border-transparent hover:bg-[#FAF6E9] dark:hover:bg-[#1B1614]"
                    }`}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectLanguage(lang)}
                      className="w-full px-2.5 py-2 flex items-center justify-between gap-2 text-start cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{lang.nativeName}</span>
                          <span className="text-[11px] opacity-75 truncate">{lang.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] opacity-65 mt-0.5">
                          <span className="uppercase font-semibold">{lang.code}</span>
                          <span>&bull;</span>
                          <span>{lang.region}</span>
                          {lang.dir === "rtl" && (
                            <>
                              <span>&bull;</span>
                              <span className="font-semibold">RTL</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${badge.cls}`}>
                          {badge.text}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#B26A1B]" />}
                      </div>
                    </button>

                    {/* Script variant switcher for multi-script languages */}
                    {lang.scriptVariants.length > 1 && (
                      <div className="px-2.5 pb-2 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] opacity-60 me-1">Script:</span>
                        {lang.scriptVariants.map((sv) => {
                          const isActiveScript = isSelected && script === sv.script;
                          return (
                            <button
                              key={sv.script}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setScript(sv.script);
                                  closeMenu();
                                } else {
                                  handleSelectLanguage(lang, sv.script);
                                }
                              }}
                              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border transition-colors cursor-pointer ${
                                isActiveScript
                                  ? "bg-[#49352F] text-[#FAF6E9] border-[#49352F] dark:bg-[#F2CAB3] dark:text-[#49352F]"
                                  : "bg-white/80 dark:bg-[#26201C] border-[#49352F]/15 dark:border-[#F2CAB3]/20 hover:border-[#B26A1B]"
                              }`}
                            >
                              {sv.label} ({sv.nativeLabel})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
