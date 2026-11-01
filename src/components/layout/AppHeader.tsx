"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useFilter } from "@/context/FilterContext";
import { useTutorial } from "@/context/TutorialContext";
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
  Users,
  Settings,
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
  const { user, role, assignments, selectedSubject, setSelectedSubject, logout } = useAuth();
  const { t, language } = useLanguage();
  const { openTutorial } = useTutorial();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [urgentGaps, setUrgentGaps] = useState<any[]>([]);

  const userInitials = React.useMemo(() => {
    if (user?.name && user.name.trim()) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (role === "admin") return "A";
    if (role === "parent") return "P";
    return "T";
  }, [user?.name, role]);

  const roleBadgeText = React.useMemo(() => {
    if (role === "admin") return t.app?.adminRole || "School Administrator";
    if (role === "parent") return t.app?.parentRole || "Parent / Guardian";
    if (role === "teacher") {
      if (assignments && assignments.length > 0) {
        const isClassTeacher = assignments.some((a) => a.isClassTeacher);
        if (isClassTeacher) return "Class Teacher";
      }
      return t.app?.teacherRole || "Subject Teacher";
    }
    return "Staff Member";
  }, [role, assignments, t.app]);

  // Viewport-safe coordinates for floating menus
  const [roleMenuCoords, setRoleMenuCoords] = useState<{
    top: number;
    right: number;
    maxWidth: number;
  } | null>(null);

  const [notificationsCoords, setNotificationsCoords] = useState<{
    top: number;
    right: number;
    maxWidth: number;
  } | null>(null);

  // Position calculation for Role / Account Menu to guarantee viewport safety
  useEffect(() => {
    if (!showRoleMenu) return;
    const updatePosition = () => {
      if (!roleMenuRef.current) return;
      const rect = roleMenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const margin = 12; // Minimum distance from screen edge
      const maxW = Math.min(340, viewportWidth - margin * 2);
      const rightDistance = Math.max(margin, viewportWidth - rect.right);

      setRoleMenuCoords({
        top: rect.bottom + 8,
        right: rightDistance,
        maxWidth: maxW,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showRoleMenu]);

  // Position calculation for Notifications Dropdown
  useEffect(() => {
    if (!notificationsOpen) return;
    const updatePosition = () => {
      if (!notificationsRef.current) return;
      const rect = notificationsRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const margin = 12;
      const maxW = Math.min(340, viewportWidth - margin * 2);
      const rightDistance = Math.max(margin, viewportWidth - rect.right);

      setNotificationsCoords({
        top: rect.bottom + 8,
        right: rightDistance,
        maxWidth: maxW,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [notificationsOpen]);

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

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search & Escape to close menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setShowRoleMenu(false);
        setNotificationsOpen(false);
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        roleMenuRef.current &&
        !roleMenuRef.current.contains(target) &&
        !document.getElementById("account-dropdown")?.contains(target)
      ) {
        setShowRoleMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target) &&
        !document.getElementById("notifications-dropdown")?.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch learning gap alerts
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 bg-[#F4F1E1]/90 dark:bg-[#1B1614]/90 px-2 sm:px-4 lg:px-6 backdrop-blur-md print:hidden transition-colors relative text-[#49352F] dark:text-[#F4F1E1]">
      {/* Mobile Full-Width Search Overlay */}
      {isMobileSearchOpen && (
        <div className="sm:hidden absolute inset-0 z-50 bg-[#FAF6E9] dark:bg-[#1B1614] px-3 flex items-center gap-2 border-b border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A6862] dark:text-[#FAF6E9]/60" />
            <input
              autoFocus
              type="text"
              placeholder={language === "gu" ? "વિદ્યાર્થીઓ, ત્રુટિઓ શોધો..." : "Search students, gaps..."}
              value={ctxSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full h-10 rounded-xl border border-[#49352F]/20 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] py-2 pl-10 pr-8 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] dark:placeholder-[#FAF6E9]/50 outline-hidden focus:border-[#F2CAB3]"
            />
            {ctxSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7A6862] dark:text-[#FAF6E9]/70 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#F2DCB5]/40 dark:hover:bg-[#26201C] cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* 1. Left section: School info & Class selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0 pl-11 lg:pl-0">
        <div className="hidden lg:flex items-center gap-1.5 text-[#49352F] dark:text-[#F4F1E1] shrink-0">
          <Building className="h-4 w-4 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0" />
          <span
            className="font-semibold text-xs xl:text-sm tracking-tight text-[#49352F] dark:text-[#F4F1E1] truncate max-w-[100px] xl:max-w-[130px] 2xl:max-w-none"
            title={`${t.app.demoSchoolName} (GUJ-GNR-042)`}
          >
            {t.app.demoSchoolName}
          </span>
          <span className="hidden 2xl:inline-block text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/60 font-normal shrink-0">
            (GUJ-GNR-042)
          </span>
        </div>

        {/* Current Class Selector */}
        <div className="flex h-9 items-center gap-1 bg-white dark:bg-[#26201C] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 rounded-xl px-2 shadow-xs shrink-0 max-w-[95px] sm:max-w-[130px] xl:max-w-none">
          <GraduationCap className="h-3.5 w-3.5 text-[#7A6862] dark:text-[#FAF6E9]/70 shrink-0" />
          <select
            value={currentClass}
            aria-label={t.header?.searchAriaLabel || "Filter by class"}
            onChange={(e) => handleClassChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] outline-hidden cursor-pointer max-w-[65px] sm:max-w-[95px] xl:max-w-none truncate"
          >
            <option value="all">{t.header?.allClasses || t.dashboard.allClasses}</option>
            <option value="cls-1a">{t.header?.class1A || "Class 1 - Section A"}</option>
            <option value="cls-2a">{t.header?.class2A || "Class 2 - Section A"}</option>
            <option value="cls-3a">{t.header?.class3A || "Class 3 - Section A"}</option>
            <option value="cls-4a">{t.header?.class4A || "Class 4 - Section A"}</option>
            <option value="cls-5a">{t.header?.class5A || "Class 5 - Section A"}</option>
          </select>
        </div>
      </div>

      {/* 2. Center Search - Prominent, Responsive and Accessible */}
      <div className="hidden xl:flex items-center flex-1 min-w-0 max-w-[180px] 2xl:max-w-md mx-2">
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7A6862] dark:text-[#FAF6E9]/60 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t.header?.searchPlaceholder || "Search students, gaps..."}
            value={ctxSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full h-9 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] py-1.5 pl-8 pr-12 text-xs text-[#49352F] dark:text-[#F4F1E1] placeholder-[#7A6862] dark:placeholder-[#FAF6E9]/50 focus:bg-white dark:focus:bg-[#26201C] focus:border-[#F2CAB3] focus:ring-2 focus:ring-[#F2CAB3]/30 outline-hidden transition-all shadow-xs"
          />
          {ctxSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden md:inline-flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-[#FAF6E9] dark:bg-[#1B1614] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-[10px] font-mono font-semibold text-[#7A6862] dark:text-[#FAF6E9]/70 pointer-events-none">
              {t.header?.ctrlK || "Ctrl K"}
            </span>
          )}
        </div>
      </div>

      {/* 3. Right section: Controls, Language, Theme Toggle, Notifications, User Role */}
      <div className="flex items-center gap-1 sm:gap-1.5 2xl:gap-2 shrink-0 ml-auto min-w-0">
        {/* Mobile / Tablet Search Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          className="xl:hidden h-9 w-9 p-0 flex items-center justify-center rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] cursor-pointer shrink-0 shadow-xs"
          aria-label="Open Search"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* AI Workspace Quick Launch */}
        <Link
          href="/ai"
          aria-label={t.header?.aiHub || "AI Hub Workspace"}
          className="hidden sm:inline-flex h-9 items-center gap-1.5 bg-[#F2CAB3] dark:bg-[#F2CAB3]/25 hover:bg-white dark:hover:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/15 dark:border-[#F2CAB3]/30 px-2 sm:px-2.5 rounded-xl text-xs font-bold shadow-xs transition-all whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">{t.header?.aiHub || "AI Hub"}</span>
        </Link>

        {/* Replay Tour Button (Only on 2xl, left sidebar provides it permanently on desktop) */}
        <button
          type="button"
          onClick={() => {
            router.push("/dashboard?tour=full");
          }}
          className="hidden 2xl:inline-flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] hover:bg-[#F2CAB3] dark:hover:bg-[#F2CAB3]/20 text-[#49352F] dark:text-[#F4F1E1] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
          aria-label={t.tutorial?.replayTour || "Start Page Guided Tour"}
          title={t.tutorial?.replayTour || "Start Page Guided Tour"}
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">{t.tutorial?.replayTour || "Replay Tour"}</span>
        </button>

        {/* Tutorial & Help Center Link (Only on 2xl, left sidebar provides it permanently on desktop) */}
        <Link
          href="/tutorial"
          aria-label={t.tutorial?.pageTitle || "Help & Tutorial Center"}
          className="hidden 2xl:inline-flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] hover:bg-[#F2CAB3] dark:hover:bg-[#F2CAB3]/20 text-[#49352F] dark:text-[#F4F1E1] text-xs font-bold transition-all shadow-xs whitespace-nowrap shrink-0"
          title={t.tutorial?.pageTitle || "Help & Tutorial Center"}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">{t.nav?.tutorial || "Tutorial & Help"}</span>
        </Link>

        {/* Language Selector */}
        <div className="shrink-0">
          <LanguageSelector />
        </div>

        {/* Dark/Light Theme Toggle */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>

        {/* Notifications Icon with active indicator */}
        <div ref={notificationsRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative h-9 w-9 p-0 flex items-center justify-center rounded-xl text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] transition-colors cursor-pointer shadow-xs shrink-0"
            title="Learning Gap Notifications"
            aria-label="Learning Gap Notifications"
          >
            <Bell className="w-4 h-4" />
            {urgentGaps.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C54738] ring-2 ring-white dark:ring-[#26201C] animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div
              id="notifications-dropdown"
              style={{
                position: "fixed",
                top: notificationsCoords ? `${notificationsCoords.top}px` : "4.25rem",
                right: notificationsCoords ? `${notificationsCoords.right}px` : "1rem",
                maxWidth: notificationsCoords ? `${notificationsCoords.maxWidth}px` : "calc(100vw - 24px)",
                width: "min(340px, calc(100vw - 24px))",
                boxSizing: "border-box",
                zIndex: 9999,
              }}
              className="rounded-2xl bg-white dark:bg-[#26201C] p-3 shadow-2xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 animate-in fade-in-50 zoom-in-95 duration-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                <span className="font-semibold text-xs text-[#49352F] dark:text-[#F4F1E1]">
                  {t.header?.gapAlerts || "Learning Gap Alerts"}
                </span>
                <span className="text-[10px] bg-[#C54738]/15 text-[#C54738] border border-[#C54738]/20 px-1.5 py-0.5 rounded-full font-bold">
                  {urgentGaps.length} {t.header?.urgentGaps || "Urgent"}
                </span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                {urgentGaps.length === 0 ? (
                  <p className="text-[#7A6862] dark:text-[#FAF6E9]/70 text-center py-2 text-xs">
                    {t.header?.noUrgentGaps || "No active high priority gaps detected!"}
                  </p>
                ) : (
                  urgentGaps.slice(0, 3).map((gap) => (
                    <Link
                      key={gap.id}
                      href={`/students/${gap.studentId}`}
                      onClick={() => setNotificationsOpen(false)}
                      className="block p-2 rounded-xl bg-[#FAF6E9] dark:bg-[#1E1916] hover:bg-[#F2DCB5]/40 dark:hover:bg-[#2E2520] border border-[#49352F]/10 dark:border-[#F2CAB3]/15 transition-colors"
                    >
                      <p className="font-semibold text-[#49352F] dark:text-[#F4F1E1]">
                        {gap.studentName} ({language === "gu" ? `ધોરણ ${gap.grade}-અ` : `Class ${gap.grade}-A`})
                      </p>
                      <p className="text-[#7A6862] dark:text-[#FAF6E9]/70 text-[11px] mt-0.5">
                        {language === "gu"
                          ? `${gap.conceptName} માં સહાયની જરૂર (${gap.latestPercentage}%).`
                          : `Needs Support in ${gap.conceptName} (${gap.latestPercentage}%).`}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Visual Divider Separating Controls from Account Center */}
        <div className="h-5 w-px bg-[#49352F]/15 dark:bg-[#F2CAB3]/20 mx-0.5 sm:mx-1 shrink-0" aria-hidden="true" />

        {/* User Profile (Account Center) */}
        <div ref={roleMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            aria-expanded={showRoleMenu}
            aria-haspopup="true"
            aria-label="User Profile and Account Menu"
            className="flex h-9 items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name || "User Avatar"}
                className="w-6 h-6 rounded-full object-cover border border-[#49352F]/15 dark:border-[#F2CAB3]/30 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#F2CAB3] dark:bg-[#F2CAB3]/30 border border-[#49352F]/15 dark:border-[#F2CAB3]/30 text-[#49352F] dark:text-[#F4F1E1] flex items-center justify-center text-xs font-bold shrink-0">
                {userInitials}
              </div>
            )}
            <div className="text-left hidden md:block shrink-0">
              <div className="text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1] leading-tight truncate max-w-[90px] xl:max-w-[130px] 2xl:max-w-none">
                {user?.name || "Authenticated User"}
              </div>
              <div className="text-[10px] text-[#B26A1B] dark:text-[#F2CAB3] font-medium capitalize truncate max-w-[90px] xl:max-w-[130px] 2xl:max-w-none">
                {roleBadgeText}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#7A6862] dark:text-[#FAF6E9]/70 shrink-0" />
          </button>

          {showRoleMenu && (
            <div
              id="account-dropdown"
              style={{
                position: "fixed",
                top: roleMenuCoords ? `${roleMenuCoords.top}px` : "4.25rem",
                right: roleMenuCoords ? `${roleMenuCoords.right}px` : "1rem",
                maxWidth: roleMenuCoords ? `${roleMenuCoords.maxWidth}px` : "calc(100vw - 24px)",
                width: "min(340px, calc(100vw - 24px))",
                boxSizing: "border-box",
                zIndex: 9999,
              }}
              className="rounded-2xl bg-white dark:bg-[#26201C] p-2.5 shadow-2xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 animate-in fade-in-50 zoom-in-95 duration-100"
            >
              {/* Authenticated user profile summary */}
              <div className="px-3 py-2.5 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 mb-2 flex items-center gap-3">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User Avatar"}
                    className="w-10 h-10 rounded-full object-cover border border-[#49352F]/15 dark:border-[#F2CAB3]/30 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#F2CAB3] dark:bg-[#F2CAB3]/30 border border-[#49352F]/15 dark:border-[#F2CAB3]/30 text-[#49352F] dark:text-[#F4F1E1] flex items-center justify-center text-sm font-bold shrink-0">
                    {userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] truncate">
                    {user?.name || "Authenticated User"}
                  </p>
                  <p className="text-[11px] text-[#B26A1B] dark:text-[#F2CAB3] font-semibold truncate">
                    {roleBadgeText}
                  </p>
                  {user?.email && (
                    <p className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/70 truncate mt-0.5">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Role-specific account information */}
              {role === "teacher" && (
                <div className="px-1 py-1 mb-1.5">
                  <div className="flex items-center justify-between mb-1.5 px-2">
                    <p className="text-[10px] font-bold text-[#7A6862] dark:text-[#FAF6E9]/60 uppercase tracking-wider">
                      Assigned Subjects & Classes
                    </p>
                    <span className="text-[10px] font-semibold text-[#2E7D5E] bg-[#2E7D5E]/10 px-1.5 py-0.5 rounded-full">
                      {assignments.length} {assignments.length === 1 ? "Subject" : "Subjects"}
                    </span>
                  </div>

                  {assignments && assignments.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                      {assignments.map((assignment) => {
                        const isSelected = selectedSubject === assignment.subjectCode;
                        return (
                          <button
                            key={assignment.id || assignment.subjectCode}
                            type="button"
                            onClick={() => {
                              setSelectedSubject(assignment.subjectCode);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer text-xs ${
                              isSelected
                                ? "bg-[#F2CAB3]/40 dark:bg-[#F2CAB3]/25 border border-[#B26A1B]/40 text-[#49352F] dark:text-[#F4F1E1]"
                                : "bg-[#FAF6E9]/50 dark:bg-[#1E1916]/50 hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/10 dark:border-[#F2CAB3]/15"
                            }`}
                            title={isSelected ? "Currently active subject" : `Switch active subject to ${assignment.subjectName}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs flex items-center gap-1.5">
                                <span className="truncate">{assignment.subjectName}</span>
                                {assignment.isClassTeacher && (
                                  <span className="text-[9px] font-medium bg-[#B26A1B]/15 text-[#B26A1B] dark:text-[#F2CAB3] px-1 rounded shrink-0">
                                    Class Teacher
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/70 mt-0.5 truncate">
                                Classes: {assignment.classes?.join(", ") || "None"}
                              </div>
                            </div>
                            {isSelected ? (
                              <span className="shrink-0 text-[10px] font-bold text-[#B26A1B] dark:text-[#F2CAB3] bg-[#B26A1B]/15 dark:bg-[#F2CAB3]/20 px-1.5 py-0.5 rounded-md ml-1.5">
                                Active
                              </span>
                            ) : (
                              <span className="shrink-0 text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 hover:text-[#49352F] dark:hover:text-[#F4F1E1] ml-1.5">
                                Select
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#FAF6E9]/50 dark:bg-[#1E1916]/50 border border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/70">
                      No subjects assigned yet. Contact School Administrator to configure your subject access.
                    </div>
                  )}
                </div>
              )}

              {role === "admin" && (
                <div className="px-1 py-1 mb-1.5">
                  <p className="text-[10px] font-bold text-[#7A6862] dark:text-[#FAF6E9]/60 uppercase tracking-wider px-2 mb-1.5">
                    Administrative Scope
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#FAF6E9]/50 dark:bg-[#1E1916]/50 border border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1]">
                          School Administrator
                        </div>
                        <div className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/70 mt-0.5">
                          Full teacher assignment & audit log control
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowRoleMenu(false)}
                      className="mt-2 block w-full text-center text-[11px] font-semibold text-[#B26A1B] dark:text-[#F2CAB3] bg-[#B26A1B]/10 hover:bg-[#B26A1B]/20 py-1.5 rounded-lg transition-colors"
                    >
                      Manage Teacher Assignments
                    </Link>
                  </div>
                </div>
              )}

              {role === "parent" && (
                <div className="px-1 py-1 mb-1.5">
                  <p className="text-[10px] font-bold text-[#7A6862] dark:text-[#FAF6E9]/60 uppercase tracking-wider px-2 mb-1.5">
                    Family Portal Scope
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#FAF6E9]/50 dark:bg-[#1E1916]/50 border border-[#49352F]/10 dark:border-[#F2CAB3]/15">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#2E7D5E] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1]">
                          Parent / Guardian Access
                        </div>
                        <div className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/70 mt-0.5">
                          Child progress, report cards & notices
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/notices"
                      onClick={() => setShowRoleMenu(false)}
                      className="mt-2 block w-full text-center text-[11px] font-semibold text-[#2E7D5E] bg-[#2E7D5E]/10 hover:bg-[#2E7D5E]/20 py-1.5 rounded-lg transition-colors"
                    >
                      View Parent Bridge & Notices
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation & Help Links */}
              <div className="border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 pt-1 space-y-0.5">
                <Link
                  href="/settings"
                  onClick={() => setShowRoleMenu(false)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#7A6862] dark:text-[#FAF6E9]/70 shrink-0" />
                  <span>Profile & Preferences</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    openTutorial();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] rounded-xl transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#7A6862] dark:text-[#FAF6E9]/70 shrink-0" />
                  <span>Help & Feature Guide</span>
                </button>
              </div>

              {/* Sign Out */}
              <div className="border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 mt-1 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setShowRoleMenu(false);
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#C54738] hover:bg-[#C54738]/10 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#C54738] shrink-0" />
                  <span>{t.header?.signOut || t.nav?.logout || "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
