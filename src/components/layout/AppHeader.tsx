"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useFilter } from "@/context/FilterContext";
import { LanguageSelector } from "../shared/LanguageSelector";
import { ThemeToggle } from "../shared/ThemeToggle";
import { triggerPageTour } from "@/components/tutorial/SpotlightTour";
import {
  Bell,
  Search,
  UserCheck,
  Building,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ShieldAlert,
  LogOut,
  RotateCcw,
  HelpCircle,
  X,
} from "lucide-react";

interface AppHeaderProps {
  currentClass?: string;
  onClassChange?: (cls: string) => void;
  onSearchChange?: (term: string) => void;
}

export function AppHeader({
  currentClass: propClass,
  onClassChange,
  onSearchChange,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, switchRole, logout } = useAuth();
  const { t, language } = useLanguage();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const getPageTourKey = (path: string): string => {
    if (path === "/dashboard" || path === "/") return "dashboard";
    if (path.startsWith("/students/") && path !== "/students") return "studentDetail";
    if (path.startsWith("/students")) return "students";
    if (path.startsWith("/learning-gaps")) return "learningGaps";
    if (path.startsWith("/remedial-plans")) return "remedialPlans";
    if (path.startsWith("/reports")) return "reports";
    return "dashboard";
  };
  const {
    selectedClass: ctxClass,
    setSelectedClass: setCtxClass,
    searchTerm: ctxSearch,
    setSearchTerm: setCtxSearch,
  } = useFilter();

  const currentClass = propClass !== undefined ? propClass : ctxClass;
  const handleClassChange = (val: string) => {
    setCtxClass(val);
    if (onClassChange) onClassChange(val);
  };

  const handleSearchChange = (val: string) => {
    setCtxSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const handleClearSearch = () => {
    handleSearchChange("");
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && ctxSearch.trim()) {
      if (!pathname.startsWith("/students")) {
        router.push("/students");
      }
    }
  };

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [urgentGaps, setUrgentGaps] = useState<any[]>([]);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch("/api/learning-gaps?priority=High&status=Active");
        const data = await res.json();
        if (data.success) {
          setUrgentGaps(data.gaps || []);
        }
      } catch {
        // quiet fallback
      }
    }
    loadAlerts();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur-sm print:hidden transition-colors relative">
      {/* Mobile Full-Width Search Overlay */}
      {isMobileSearchOpen && (
        <div className="sm:hidden absolute inset-0 z-50 bg-white dark:bg-slate-900 px-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 shadow-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder={language === "gu" ? "વિદ્યાર્થીઓ, ત્રુટિઓ શોધો..." : "Search students, gaps..."}
              value={ctxSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full h-10 rounded-xl border border-amber-500 bg-slate-50 dark:bg-slate-800 py-2 pl-10 pr-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-hidden"
            />
            {ctxSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Left section: School info & Class selector */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Building className="h-4 w-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
          <span className="font-semibold text-xs lg:text-sm tracking-tight text-slate-800 dark:text-slate-100">
            {t.app.demoSchoolName}
          </span>
          <span className="hidden xl:inline-block text-[11px] text-slate-400 dark:text-slate-500 font-normal">
            (GUJ-GNR-042)
          </span>
        </div>

        {/* Current Class Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
          <GraduationCap className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <select
            value={currentClass}
            aria-label="Filter by class"
            onChange={(e) => handleClassChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
          >
            <option value="all">{t.dashboard.allClasses}</option>
            <option value="cls-3a">Class 3 - Section A</option>
            <option value="cls-4a">Class 4 - Section A</option>
            <option value="cls-5a">Class 5 - Section A</option>
          </select>
        </div>
      </div>

      {/* Center Search - Prominent, Large, and Accessible */}
      <div className="hidden sm:flex items-center flex-1 max-w-sm md:max-w-md lg:max-w-xl mx-2 md:mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={
              language === "gu"
                ? "વિદ્યાર્થીઓ, લર્નિંગ ગેપ્સ અથવા વિષય શોધો..."
                : "Search students, learning gaps, concepts..."
            }
            value={ctxSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full h-10 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 py-2 pl-10 pr-16 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 outline-hidden transition-all shadow-xs"
          />
          {ctxSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden md:inline-flex items-center gap-0.5 absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">
              Ctrl K
            </span>
          )}
        </div>
      </div>

      {/* Right section: Demo tag, Language, Theme Toggle, Notifications, User Role */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          aria-label="Open Search"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* AI Workspace Quick Launch */}
        <Link
          href="/ai"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Hub</span>
        </Link>

        {/* Hackathon Demo Tag */}
        <div className="hidden xl:inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-semibold">
          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>SFIC Gujarat Hackathon Demo</span>
        </div>

        {/* Replay Tour Button */}
        <button
          type="button"
          onClick={() => {
            const pageKey = getPageTourKey(pathname);
            if (typeof window !== "undefined") {
              localStorage.removeItem(`shikshasetu_tour_completed_${pageKey}`);
            }
            triggerPageTour(pageKey);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-100/90 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 hover:bg-amber-200 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          title={t.tutorial?.replayTour || "Start Page Guided Tour"}
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">{t.tutorial?.replayTour || "Tour"}</span>
        </button>

        {/* Tutorial & Help Center Link */}
        <Link
          href="/tutorial"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 text-xs font-bold transition-all shadow-xs"
          title={t.tutorial?.pageTitle || "Help & Tutorial Center"}
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">{t.nav?.tutorial || "Tutorial"}</span>
        </Link>

        {/* Language Selector */}
        <LanguageSelector />

        {/* Dark/Light Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Icon with active indicator */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors cursor-pointer"
            title="Learning Gap Notifications"
          >
            <Bell className="w-4 h-4" />
            {urgentGaps.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-xl border border-slate-100 dark:border-slate-800 ring-1 ring-slate-900/10 dark:ring-slate-700/50 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">Learning Gap Alerts</span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-full font-bold">
                  {urgentGaps.length} Urgent
                </span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                {urgentGaps.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-2 text-xs">
                    No active high priority gaps detected!
                  </p>
                ) : (
                  urgentGaps.slice(0, 3).map((gap) => (
                    <Link
                      key={gap.id}
                      href={`/students/${gap.studentId}`}
                      onClick={() => setNotificationsOpen(false)}
                      className="block p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-100 dark:border-amber-900/50 transition-colors"
                    >
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {gap.studentName} (Class {gap.grade}-A)
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                        Needs Support in {gap.conceptName} ({gap.latestPercentage}%).
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
              {role === "admin" ? "A" : "T"}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.name || "Teacher"}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium capitalize">
                {role === "admin" ? t.app.adminRole : t.app.teacherRole}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xl border border-slate-100 dark:border-slate-800 ring-1 ring-slate-900/10 dark:ring-slate-700/50 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Switch Active Role
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Explore with different permissions</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  switchRole("teacher");
                  setShowRoleMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl text-left transition-colors cursor-pointer ${role === "teacher"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
              >
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Pooja Sharma</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Class Teacher (Class 4-A)</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRole("admin");
                  setShowRoleMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl text-left transition-colors mt-1 cursor-pointer ${role === "admin"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Principal R.K. Trivedi</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">School Administrator</div>
                </div>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowRoleMenu(false);
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>{t.nav?.logout || "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
