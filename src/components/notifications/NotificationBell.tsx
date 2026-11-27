"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import type { PtmNotification } from "@/lib/types";

export function NotificationBell({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { user, role } = useAuth();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<PtmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isParentPath = pathname?.startsWith("/parent") || role === "parent";
  const allNotificationsHref = isParentPath ? "/parent/notifications" : "/notifications";

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getNotifications({ limit: 8 });
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s light poll
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })));
      setUnreadCount(0);
    } catch {}
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("reminder")) {
      return <Clock className="w-3.5 h-3.5 text-[#B26A1B] dark:text-[#F2CAB3]" />;
    }
    if (type.includes("cancel") || type.includes("update")) {
      return <AlertCircle className="w-3.5 h-3.5 text-[#C54738] dark:text-[#FA8C7C]" />;
    }
    return <Calendar className="w-3.5 h-3.5 text-[#2E7D5E] dark:text-[#4EE2A7]" />;
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return language === "gu" ? "હમણાં જ" : "Just now";
      if (mins < 60) return `${mins}${language === "gu" ? "મિ પહેલાં" : "m ago"}`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}${language === "gu" ? "કલાક પહેલાં" : "h ago"}`;
      const days = Math.floor(hours / 24);
      return `${days}${language === "gu" ? "દિવસ પહેલાં" : "d ago"}`;
    } catch {
      return "";
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications();
        }}
        className="relative h-9 w-9 p-0 flex items-center justify-center rounded-xl text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#FAF6E9] dark:hover:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] transition-colors cursor-pointer shadow-xs shrink-0"
        title={language === "gu" ? "સૂચનાઓ" : "Notifications"}
        aria-label={language === "gu" ? "સૂચનાઓ" : "Notifications"}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#C54738] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#26201C] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#26201C] p-3 shadow-2xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
          style={{ maxWidth: "calc(100vw - 24px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-xs text-[#49352F] dark:text-[#F4F1E1]">
                {language === "gu" ? "સૂચનાઓ અને રીમાઇન્ડર" : "Notifications & Reminders"}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#B26A1B]/15 text-[#B26A1B] dark:text-[#F2CAB3] text-[10px] font-bold">
                  {unreadCount} {language === "gu" ? "નવી" : "new"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#B26A1B] dark:text-[#F2CAB3] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>{language === "gu" ? "બધી વાંચેલી ચિહ્નિત કરો" : "Mark all read"}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="mt-2 space-y-1.5 max-h-80 overflow-y-auto pr-0.5 text-xs">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-[#7A6862] dark:text-[#FAF6E9]/70 space-y-1">
                <Bell className="w-6 h-6 mx-auto opacity-30" />
                <p className="text-xs">
                  {language === "gu" ? "કોઈ નવી સૂચના નથી" : "No notifications yet."}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                const title = n.metadata?.title || (n.type.includes("ptm") ? "PTM Meeting" : "Notification");
                const targetLink = n.link || allNotificationsHref;

                return (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isUnread
                        ? "bg-[#FFF9F2] dark:bg-[#2A221C] border-[#B26A1B]/30"
                        : "bg-[#FAF6E9]/50 dark:bg-[#1E1916]/50 border-transparent hover:border-[#49352F]/10"
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-[#26201C] border border-[#49352F]/10 shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs text-[#49352F] dark:text-[#F4F1E1] truncate">
                          {title}
                        </p>
                        <span className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60 shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/80 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        <Link
                          href={targetLink}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B26A1B] dark:text-[#F2CAB3] hover:underline"
                        >
                          <span>{language === "gu" ? "વિગતો જુઓ →" : "View Details →"}</span>
                        </Link>

                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkRead(n.id, e)}
                            className="p-1 rounded-md text-[#7A6862] hover:text-[#2E7D5E] hover:bg-white dark:hover:bg-[#26201C] transition-colors cursor-pointer"
                            title={language === "gu" ? "વાંચેલું ચિહ્નિત કરો" : "Mark as read"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 mt-2 border-t border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-center">
            <Link
              href={allNotificationsHref}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#49352F] dark:text-[#F4F1E1] hover:text-[#B26A1B] dark:hover:text-[#F2CAB3] transition-colors"
            >
              <span>{language === "gu" ? "બધી સૂચનાઓ જુઓ" : "View All Notifications"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
