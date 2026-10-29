"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { BrandLogo } from "../shared/BrandLogo";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  ClipboardList,
  Gamepad2,
  TrendingUp,
  FileText,
  Settings,
  RotateCcw,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Languages,
  Bell,
} from "lucide-react";
import { triggerPageTour } from "@/components/tutorial/SpotlightTour";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    {
      href: "/ai",
      label: t.nav.aiWorkspace || "AI Workspace",
      icon: Sparkles,
      badge: t.sidebar?.badge5in1 || "AI 5-in-1",
      badgeColor: "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 font-bold",
    },
    {
      href: "/notices",
      label: language === "gu" ? "શાળા સૂચનાઓ" : "School Notices",
      icon: Bell,
      badge: t.sidebar?.badgeMultilingual || "Multilingual",
      badgeColor: "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20 font-bold",
    },
    {
      href: "/parent/dashboard",
      label: language === "gu" ? "વાલી સેતુ" : "Parent Bridge",
      icon: Users,
      badge: language === "gu" ? "પોર્ટલ" : "Portal",
      badgeColor: "bg-[#F2CAB3] text-[#49352F] border border-[#49352F]/15 font-bold",
    },
    { href: "/students", label: t.nav.students, icon: Users },
    { href: "/assessments", label: t.nav.assessments, icon: FileSpreadsheet },
    {
      href: "/learning-gaps",
      label: t.nav.learningGaps,
      icon: AlertTriangle,
      badge: t.sidebar?.badgeActive || "Active",
      badgeColor: "bg-[#F2DCB5] text-[#49352F] border border-[#49352F]/15 font-semibold",
    },
    { href: "/remedial-plans", label: t.nav.remedialPlans, icon: ClipboardList },
    { href: "/activities", label: t.nav.activities, icon: Gamepad2 },
    { href: "/progress", label: t.nav.progress, icon: TrendingUp },
    { href: "/reports", label: t.nav.reports, icon: FileText },
    {
      href: "/tutorial",
      label: t.nav.tutorial || "Tutorial & Help",
      icon: BookOpen,
      badge: t.sidebar?.badge5Min || "5 Min",
      badgeColor: "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20 font-semibold",
    },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ];

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset-demo", { method: "POST" });
      if (res.ok) {
        setShowResetConfirm(false);
        router.refresh();
        window.location.reload();
      }
    } catch (e) {
      console.error("Reset failed", e);
    } finally {
      setIsResetting(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-3 left-3 z-50 p-2 rounded-xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-[#49352F] dark:text-[#F4F1E1] shadow-sm lg:hidden cursor-pointer print:hidden"
        aria-label="Toggle Navigation"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#49352F]/30 backdrop-blur-xs lg:hidden print:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#49352F]/10 dark:border-[#F2CAB3]/15 bg-[#FAF6E9] dark:bg-[#1E1916] text-[#49352F] dark:text-[#F4F1E1] shadow-[2px_0_14px_rgba(73,53,47,0.04)] dark:shadow-[2px_0_14px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center px-5 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15">
          <Link href="/dashboard" onClick={() => setIsMobileOpen(false)}>
            <BrandLogo />
          </Link>
        </div>

        {/* Teacher Tutorial & How-To Card */}
        <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-br from-[#F2DCB5]/80 via-[#FAF6E9] to-[#F2CAB3]/80 dark:from-[#26201C] dark:via-[#1E1916] dark:to-[#26201C] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-xs">
          <div className="flex items-center justify-between text-[#49352F] dark:text-[#F4F1E1] font-bold text-xs">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
              <span>{t.sidebar?.teacherTutorial || "Teacher Tutorial"}</span>
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20 text-[10px] font-mono font-bold">
              {t.sidebar?.guideBadge || "Guide"}
            </span>
          </div>
          <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/70 mt-1 leading-snug">
            {t.sidebar?.tutorialDesc || "Learn how to spot gaps, create 5-step plans & reassess."}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <Link
              href="/tutorial"
              onClick={() => setIsMobileOpen(false)}
              className="flex-1 py-1.5 text-center bg-[#F2CAB3] dark:bg-[#F2CAB3]/20 hover:bg-white dark:hover:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 rounded-xl text-[11px] font-bold transition-all shadow-xs"
            >
              {t.sidebar?.openTutorial || "Open Tutorial →"}
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                if (typeof window !== "undefined") {
                  localStorage.removeItem("shikshasetu_tour_completed_dashboard");
                }
                triggerPageTour("dashboard");
              }}
              className="px-2 py-1.5 rounded-xl border border-[#49352F]/20 dark:border-[#F2CAB3]/20 hover:bg-white dark:hover:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] text-[11px] font-semibold cursor-pointer transition-colors"
              title={t.sidebar?.startTour || "Start Guided Tour"}
              aria-label={t.sidebar?.startTour || "Start Guided Tour"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Guided Demo Shortcut Card */}
        <div className="mx-3 mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-white to-[#FAF6E9] dark:from-[#26201C] dark:to-[#1E1916] border border-[#49352F]/12 dark:border-[#F2CAB3]/20 shadow-xs">
          <div className="flex items-center gap-1.5 text-[#49352F] dark:text-[#F4F1E1] font-semibold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />
            <span>{t.sidebar?.hackathonDemo || "Hackathon Guided Demo"}</span>
          </div>
          <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/70 mt-1 leading-snug">
            {t.sidebar?.demoDesc || "Evaluate Aarav's division gap remediation in 2 minutes."}
          </p>
          <Link
            href="/students/std-aarav"
            onClick={() => setIsMobileOpen(false)}
            className="mt-2 block w-full py-1 text-center bg-white dark:bg-[#26201C] hover:bg-[#F2CAB3] dark:hover:bg-[#F2CAB3]/20 text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 rounded-lg text-[11px] font-semibold transition-all shadow-xs"
          >
            {t.sidebar?.launchDemoCase || "Launch Demo Case →"}
          </Link>
        </div>

        {/* Navigation links */}
        <nav data-tour="sidebar-nav" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all group cursor-pointer ${
                  active
                    ? "bg-[#F2CAB3] dark:bg-[#F2CAB3]/25 text-[#49352F] dark:text-[#F4F1E1] font-bold shadow-[0_2px_8px_rgba(73,53,47,0.08)] border border-[#49352F]/15 dark:border-[#F2CAB3]/30"
                    : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1] hover:bg-[#F2DCB5]/40 dark:hover:bg-[#26201C]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active
                        ? "text-[#49352F] dark:text-[#F4F1E1]"
                        : "text-[#7A6862] dark:text-[#FAF6E9]/70 group-hover:text-[#49352F] dark:group-hover:text-[#F4F1E1]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      active
                        ? "bg-white/80 dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/15 dark:border-[#F2CAB3]/20"
                        : item.badgeColor || "bg-white dark:bg-[#26201C] text-[#49352F] dark:text-[#F4F1E1] border border-[#49352F]/12 dark:border-[#F2CAB3]/20"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Utility: Demo Data Reset */}
        <div className="p-3 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 bg-[#FAF6E9]/80 dark:bg-[#1E1916]/80">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#C54738] hover:bg-[#C54738]/10 rounded-xl border border-[#49352F]/10 dark:border-[#F2CAB3]/15 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.actions.resetDemo}</span>
          </button>
        </div>
      </aside>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#49352F]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#26201C] p-5 shadow-2xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 text-[#49352F] dark:text-[#F4F1E1]">
            <h3 className="text-base font-bold text-[#49352F] dark:text-[#F4F1E1]">
              {t.sidebar?.resetConfirmTitle || "Reset Demo Data?"}
            </h3>
            <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/70 mt-2">
              {t.sidebar?.resetConfirmDesc || "This will restore the 15 demonstration students, initial assessment scores, learning gaps, and remedial plans to their original state."}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-[#7A6862] dark:text-[#FAF6E9]/70 hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] rounded-xl transition-colors cursor-pointer"
              >
                {t.actions.cancel}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDemo}
                className="px-4 py-1.5 text-xs font-semibold bg-[#C54738] hover:bg-[#A8382B] text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (t.sidebar?.resetting || "Resetting...") : (t.sidebar?.confirmReset || "Confirm Reset")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
