"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useTutorial } from "@/context/TutorialContext";
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
  MessageSquare,
} from "lucide-react";
import { triggerPageTour } from "@/components/tutorial/SpotlightTour";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { openTutorial } = useTutorial();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  React.useEffect(() => {
    const fetchUnread = () => {
      fetch("/api/connect/conversations?badgeOnly=1")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && typeof d.unreadTotal === "number") {
            setUnreadChatCount(d.unreadTotal);
          }
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 12000);
    return () => clearInterval(interval);
  }, []);

  const primaryNavItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/students", label: t.nav.students, icon: Users },
    { href: "/assessments", label: t.nav.assessments, icon: FileSpreadsheet },
    { href: "/learning-gaps", label: t.nav.learningGaps, icon: AlertTriangle },
    {
      href: "/connect",
      label: t.nav.connectChat,
      icon: MessageSquare,
      badge: unreadChatCount > 0 ? `${unreadChatCount}` : undefined,
      badgeColor: "bg-[#2E7D5E] text-white font-bold",
    },
  ];

  const utilityNavItems = [
    { href: "/activities", label: t.nav.activities, icon: Gamepad2 },
    { href: "/reports", label: t.nav.reports, icon: FileText },
    { href: "/settings", label: t.nav.settings, icon: Settings },
    { href: "/tutorial", label: t.nav.tutorial || "Tutorial & Help", icon: BookOpen },
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
          aria-hidden="true"
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

        {/* Navigation links */}
        <nav data-tour="sidebar-nav" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {primaryNavItems.map((item) => {
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

          {/* Grouped Secondary / Utilities Section */}
          <div className="pt-4 pb-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#7A6862]/80 dark:text-[#FAF6E9]/50">
              {(t.sidebar as any)?.toolsUtilities || "Tools & Reports"}
            </div>
          </div>

          {utilityNavItems.map((item) => {
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
