"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useFilter } from "@/context/FilterContext";
import {
  Search,
  X,
  Loader2,
  Users,
  GraduationCap,
  Target,
  Bell,
  UserCheck,
  ChevronRight,
  Sparkles,
  Command,
} from "lucide-react";

export interface SearchResultItem {
  id: string;
  category: "students" | "teachers" | "classes" | "remedial" | "notices";
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  score?: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  count: number;
  results: SearchResultItem[];
  categories?: Record<string, number>;
  error?: string;
}

interface GlobalSearchProps {
  onSearchChange?: (term: string) => void;
  className?: string;
}

export function GlobalSearch({ onSearchChange, className = "" }: GlobalSearchProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const { searchTerm: ctxSearch, setSearchTerm: setCtxSearch } = useFilter();

  const [query, setQuery] = useState(ctxSearch || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Detect OS for shortcut display
  useEffect(() => {
    if (typeof window !== "undefined") {
      const platform = window.navigator?.platform?.toLowerCase() || "";
      const userAgent = window.navigator?.userAgent?.toLowerCase() || "";
      setIsMac(platform.includes("mac") || userAgent.includes("mac"));
    }
  }, []);

  // Sync external filter term
  useEffect(() => {
    if (ctxSearch !== undefined && ctxSearch !== query) {
      setQuery(ctxSearch);
    }
  }, [ctxSearch]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search fetch
  const fetchSearchResults = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=12`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Search service returned HTTP ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setErrorMessage(data.error || "Failed to retrieve results.");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setErrorMessage(err.message || "Search service unavailable.");
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setCtxSearch(val);
    if (onSearchChange) onSearchChange(val);
    setIsOpen(true);

    // Debounce 200ms
    const timer = setTimeout(() => {
      fetchSearchResults(val);
    }, 200);

    return () => clearTimeout(timer);
  };

  const handleClear = () => {
    setQuery("");
    setCtxSearch("");
    if (onSearchChange) onSearchChange("");
    setResults([]);
    setErrorMessage(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    router.push(item.href);
  };

  // Keyboard navigation within suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectResult(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      } else if (query.trim()) {
        router.push(`/students?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Quick suggestions for empty state
  const quickSuggestions = [
    {
      label: language === "gu" ? "ધોરણ ૪ - વર્ગ અ" : "Class 4 - Section A",
      category: language === "gu" ? "વર્ગ" : "classes",
      href: "/students?class=cls-4a",
    },
    {
      label: language === "gu" ? "આરવ પટેલ (ધોરણ ૪)" : "Aarav Patel (Class 4)",
      category: language === "gu" ? "વિદ્યાર્થી" : "students",
      href: "/students/std-aarav",
    },
    {
      label: language === "gu" ? "ભાગાકાર પાયાની ઉપચાર યોજના" : "Division Basics Remedial",
      category: language === "gu" ? "ઉપચાર યોજના" : "remedial",
      href: "/remedial-plans",
    },
    {
      label: language === "gu" ? "પૂજા શર્મા (વર્ગ શિક્ષક)" : "Pooja Sharma (Class Teacher)",
      category: language === "gu" ? "શિક્ષક" : "teachers",
      href: "/students?class=cls-4a",
    },
  ];

  const getCategoryIcon = (category: SearchResultItem["category"]) => {
    switch (category) {
      case "students":
        return <Users className="w-4 h-4 text-[#B26A1B]" />;
      case "classes":
        return <GraduationCap className="w-4 h-4 text-[#2E7D5E]" />;
      case "remedial":
        return <Target className="w-4 h-4 text-[#C54738]" />;
      case "notices":
        return <Bell className="w-4 h-4 text-[#B26A1B]" />;
      case "teachers":
        return <UserCheck className="w-4 h-4 text-[#1E3A8A]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#7A6862]" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative flex-1 max-w-[420px] min-w-[200px] sm:min-w-[260px] ${className}`}>
      {/* Search Input Bar */}
      <div
        className={`flex items-center w-full h-10 rounded-2xl bg-white border transition-all duration-150 shadow-xs ${
          isOpen
            ? "border-[#B26A1B] ring-3 ring-[#F2CAB3]/40 bg-white"
            : "border-[#49352F]/15 hover:border-[#49352F]/30"
        }`}
      >
        <div className="pl-3.5 pr-2 flex items-center justify-center text-[#7A6862] pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#B26A1B]" />
          ) : (
            <Search className="w-4 h-4 text-[#7A6862]" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          aria-label="Search students, classes, teachers, and remedial plans"
          aria-expanded={isOpen}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          role="combobox"
          placeholder={
            language === "gu"
              ? "વિદ્યાર્થીઓ, વર્ગો, શિક્ષકો શોધો..."
              : "Search students, classes, teachers..."
          }
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent text-xs sm:text-sm text-[#49352F] placeholder-[#7A6862] outline-hidden pr-2 font-normal"
        />

        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-2 rounded-full text-[#7A6862] hover:text-[#49352F] hover:bg-[#FAF6E9] transition-colors cursor-pointer"
            aria-label="Clear search query"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="hidden md:flex items-center mr-2.5 pointer-events-none">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FAF6E9] border border-[#49352F]/15 text-[10px] font-mono font-medium text-[#7A6862]">
              {isMac ? "⌘K" : "Ctrl K"}
            </span>
          </div>
        )}
      </div>

      {/* Dropdown Results Command Palette */}
      {isOpen && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#49352F]/15 shadow-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-[440px] flex flex-col"
        >
          {/* Results List */}
          <div className="overflow-y-auto flex-1 p-2 divide-y divide-[#49352F]/5 space-y-1">
            {errorMessage ? (
              <div className="p-4 text-center">
                <p className="text-xs text-[#C54738] font-medium">{errorMessage}</p>
                <p className="text-[11px] text-[#7A6862] mt-1">Please try modifying your query.</p>
              </div>
            ) : results.length > 0 ? (
              results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={`${item.category}-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#F2CAB3]/40 text-[#49352F]"
                        : "hover:bg-[#FAF6E9] text-[#49352F]"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-[#49352F]/10 shrink-0 shadow-2xs">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate text-[#49352F]">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#FAF6E9] border border-[#49352F]/15 text-[#7A6862] shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7A6862] truncate mt-0.5 font-normal">
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#7A6862] shrink-0 opacity-50" />
                  </button>
                );
              })
            ) : query.trim() ? (
              <div className="p-5 text-center">
                <div className="w-8 h-8 mx-auto rounded-full bg-[#FAF6E9] flex items-center justify-center text-[#7A6862] mb-2">
                  <Search className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-[#49352F]">No matching results found</p>
                <p className="text-[11px] text-[#7A6862] mt-1">
                  We couldn&apos;t find anything for &ldquo;<span className="font-semibold text-[#49352F]">{query}</span>&rdquo;.
                </p>
                <p className="text-[11px] text-[#7A6862] mt-0.5">
                  Try searching by student name (e.g. Aarav), class code, or concept.
                </p>
              </div>
            ) : (
              // Empty State with Quick Navigation Suggestions
              <div className="p-2">
                <div className="px-2 py-1 text-[11px] font-semibold text-[#7A6862] uppercase tracking-wider">
                  Quick Access
                </div>
                <div className="space-y-1 mt-1">
                  {quickSuggestions.map((s, idx) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push(s.href);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#49352F] hover:bg-[#FAF6E9] transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[#B26A1B]">✦</span>
                        <span className="font-medium">{s.label}</span>
                      </div>
                      <span className="text-[10px] text-[#7A6862] capitalize bg-[#FAF6E9] px-1.5 py-0.5 rounded border border-[#49352F]/10">
                        {s.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar with Keyboard Shortcuts */}
          <div className="px-3 py-2 bg-[#FAF6E9]/70 border-t border-[#49352F]/10 flex items-center justify-between text-[11px] text-[#7A6862]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-[#49352F]/15 text-[9px] font-mono font-bold">
                  ↑↓
                </kbd>
                <span>{language === "gu" ? "આગળ-પાછળ" : "Navigate"}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-[#49352F]/15 text-[9px] font-mono font-bold">
                  ↵
                </kbd>
                <span>{language === "gu" ? "ખોલો" : "Open"}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white border border-[#49352F]/15 text-[9px] font-mono font-bold">
                  Esc
                </kbd>
                <span>{language === "gu" ? "બંધ કરો" : "Dismiss"}</span>
              </span>
            </div>
            <span className="text-[10px] font-medium text-[#B26A1B]">
              {language === "gu" ? "StudySaathi ગ્લોબલ સર્ચ" : "StudySaathi Global Search"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
