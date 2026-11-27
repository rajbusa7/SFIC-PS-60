"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/services/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { subscribeToPushNotifications, getPushPermissionStatus } from "@/lib/pwa/pushSubscription";
import type { PtmNotification } from "@/lib/types";

export default function NotificationsPage() {
  const { language } = useLanguage();
  const { user, role } = useAuth();

  const [notifications, setNotifications] = useState<PtmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "ptm">("all");
  const [pushStatus, setPushStatus] = useState<string>("default");
  const [pushLoading, setPushLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getNotifications({ limit: 50 });
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
    setPushStatus(getPushPermissionStatus());
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
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

  const handleEnablePush = async () => {
    setPushLoading(true);
    const result = await subscribeToPushNotifications();
    setPushStatus(result.status);
    setPushLoading(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.readAt;
    if (filter === "ptm") return n.type.includes("ptm");
    return true;
  });

  const getNotificationIcon = (type: string) => {
    if (type.includes("reminder")) {
      return <Clock className="w-4 h-4 text-[#B26A1B] dark:text-[#F2CAB3]" />;
    }
    if (type.includes("cancel") || type.includes("update")) {
      return <AlertCircle className="w-4 h-4 text-[#C54738] dark:text-[#FA8C7C]" />;
    }
    return <Calendar className="w-4 h-4 text-[#2E7D5E] dark:text-[#4EE2A7]" />;
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#F4F1E1] dark:bg-[#15110E] text-[#49352F] dark:text-[#F4F1E1] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="p-4 sm:px-8 max-w-7xl w-full mx-auto flex items-center justify-between border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15">
        <div className="flex items-center gap-3">
          <Link
            href={role === "parent" ? "/parent/dashboard" : "/dashboard"}
            className="p-2 rounded-xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] hover:bg-[#FAF6E9] transition-all"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <BrandLogo size={32} />
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector variant="default" />
          <ThemeToggle variant="button" />
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2CAB3] border border-[#49352F]/15 flex items-center justify-center text-[#49352F] shadow-xs">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight">
                {language === "gu" ? "સૂચનાઓ અને રીમાઇન્ડર" : "Notifications & Reminders"}
              </h1>
              <p className="text-xs sm:text-sm text-[#7A6862] dark:text-[#FAF6E9]/70">
                {language === "gu"
                  ? "પીટીએમ આમંત્રણો, ૨૪-કલાક અને ૧-કલાક રીમાઇન્ડરની તાજી વિગતો"
                  : "PTM meeting invites, 24h & 1h reminders, and status updates."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              >
                {language === "gu" ? "બધી વાંચેલી ચિહ્નિત કરો" : "Mark all as read"}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={loadNotifications}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            >
              {language === "gu" ? "તાજું કરો" : "Refresh"}
            </Button>
          </div>
        </div>

        {/* PWA Web Push Banner */}
        {pushStatus !== "granted" && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F2DCB5]/60 to-[#F2CAB3]/40 border border-[#B26A1B]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-[#26201C] text-[#B26A1B] shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#49352F] dark:text-[#F4F1E1]">
                  {language === "gu" ? "મોબાઇલ પુશ સૂચનાઓ સક્ષમ કરો" : "Enable Web Push Notifications"}
                </p>
                <p className="text-[#7A6862] dark:text-[#FAF6E9]/80 text-[11px]">
                  {language === "gu"
                    ? "તમારી આગામી PTM મીટિંગ શરૂ થવાના ૨૪ કલાક અને ૧ કલાક પહેલાં સીધા ફોન પર ચેતવણી મેળવો."
                    : "Receive instant native push alerts 24h and 1h before your meetings start."}
                </p>
              </div>
            </div>

            <Button
              variant="saffron"
              size="sm"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="rounded-full text-xs font-bold shrink-0"
            >
              <span>{pushLoading ? "Enabling..." : language === "gu" ? "પુશ ચાલુ કરો" : "Enable Web Push"}</span>
            </Button>
          </div>
        )}

        {/* Tabs Filter */}
        <div className="flex items-center gap-2 border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 pb-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                : "text-[#7A6862] hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
            }`}
          >
            {language === "gu" ? "બધી" : "All"} ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === "unread"
                ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                : "text-[#7A6862] hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
            }`}
          >
            <span>{language === "gu" ? "ન વાંચેલી" : "Unread"}</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#B26A1B] text-white text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter("ptm")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === "ptm"
                ? "bg-[#261B16] text-[#FAF6E9] shadow-xs"
                : "text-[#7A6862] hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
            }`}
          >
            {language === "gu" ? "વાલી-શિક્ષક મિલન (PTM)" : "PTM Reminders"}
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center text-[#7A6862] dark:text-[#FAF6E9]/70 space-y-2 rounded-3xl">
              <Bell className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-semibold">
                {language === "gu" ? "કોઈ સૂચનાઓ મળી નથી" : "No notifications found"}
              </p>
              <p className="text-xs">
                {language === "gu"
                  ? "જ્યારે પણ નવી મીટિંગ સુનિશ્ચિત થશે અથવા રીમાઇન્ડર આવશે, ત્યારે તે અહીં દેખાશે."
                  : "Upcoming meeting reminders and changes will appear here."}
              </p>
            </Card>
          ) : (
            filteredNotifications.map((n) => {
              const isUnread = !n.readAt;
              const title = n.metadata?.title || (n.type.includes("ptm") ? "PTM Meeting" : "Notification");
              const targetLink = n.link || "/parent/meetings";

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isUnread
                      ? "bg-white dark:bg-[#1E1916] border-[#B26A1B]/40 shadow-xs ring-1 ring-[#B26A1B]/20"
                      : "bg-[#FAF6E9]/60 dark:bg-[#201A16]/60 border-[#49352F]/10 dark:border-[#F2CAB3]/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/10 shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-[#49352F] dark:text-[#F4F1E1]">
                          {title}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#B26A1B] animate-pulse" />
                        )}
                        <span className="text-[10px] text-[#7A6862] dark:text-[#FAF6E9]/60">
                          {new Date(n.createdAt).toLocaleDateString(language === "gu" ? "gu-IN" : "en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/80 leading-relaxed max-w-2xl">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {targetLink && (
                      <Link href={targetLink}>
                        <Button variant="saffron" size="sm" className="rounded-xl text-xs font-bold">
                          <span>{language === "gu" ? "જોડાઓ / વિગત" : "View / Join"}</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="p-2 rounded-xl border border-[#49352F]/15 hover:bg-[#FAF6E9] dark:hover:bg-[#26201C] text-[#7A6862] hover:text-[#2E7D5E] transition-colors cursor-pointer"
                        title={language === "gu" ? "વાંચેલું ચિહ્નિત કરો" : "Mark as read"}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#7A6862] dark:text-[#FAF6E9]/60 border-t border-[#49352F]/10">
        © 2026 StudySaathi AI • Multichannel PTM Reminders & Notifications
      </footer>
    </div>
  );
}
