"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import type { MeetingStatus, InviteRsvpStatus, MeetingType } from "@shared/types";

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const { t } = useLanguage();

  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF4EE] dark:bg-[#1A3326] text-[#2E7D5E] dark:text-[#3DDBA9] border border-[#2E7D5E]/30 dark:border-[#3DDBA9]/35 shadow-xs select-none">
        <span className="relative flex h-2 w-2 items-center justify-center" aria-hidden="true">
          <motion.span
            className="absolute inline-flex h-3 w-3 rounded-full bg-[#2E7D5E] dark:bg-[#3DDBA9] opacity-75"
            animate={{ scale: [1, 2, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2E7D5E] dark:bg-[#3DDBA9]" />
        </span>
        <span>{t.ptm.statusLive}</span>
      </span>
    );
  }

  if (status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF4E7] dark:bg-[#2B231D] text-[#8D4E10] dark:text-[#F2CAB3] border border-[#8D4E10]/25 dark:border-[#F2CAB3]/25 shadow-xs select-none">
        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[#8D4E10] dark:bg-[#F2CAB3]" aria-hidden="true" />
        <span>{t.ptm.statusScheduled}</span>
      </span>
    );
  }

  if (status === "ended") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FAF6E9] dark:bg-[#26201C] text-[#7A6862] dark:text-[#C2B3AC] border border-[#49352F]/12 dark:border-[#F2CAB3]/15 shadow-xs select-none">
        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[#7A6862] dark:text-[#C2B3AC]" aria-hidden="true" />
        <span>{t.ptm.statusEnded}</span>
      </span>
    );
  }

  // Cancelled
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FBECE9] dark:bg-[#38201D] text-[#A93327] dark:text-[#FA8C7C] border border-[#A93327]/25 dark:border-[#FA8C7C]/30 shadow-xs select-none">
      <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[#A93327] dark:bg-[#FA8C7C]" aria-hidden="true" />
      <span>{t.ptm.statusCancelled}</span>
    </span>
  );
}

export function RsvpStatusBadge({ status }: { status: InviteRsvpStatus }) {
  const { t } = useLanguage();
  const map: Record<InviteRsvpStatus, { label: string; variant: BadgeVariant; dot?: boolean }> = {
    pending: { label: t.ptm.rsvpPending, variant: "amber", dot: true },
    accepted: { label: t.ptm.rsvpAccepted, variant: "mint", dot: true },
    declined: { label: t.ptm.rsvpDeclined, variant: "coral" },
    reschedule_requested: { label: t.ptm.rsvpRescheduleRequested, variant: "indigo", dot: true },
  };
  const cfg = map[status] || map.pending;
  return (
    <Badge variant={cfg.variant} size="sm" dot={cfg.dot}>
      {cfg.label}
    </Badge>
  );
}

export function MeetingTypeBadge({ type }: { type: MeetingType }) {
  const { t } = useLanguage();
  return (
    <Badge variant={type === "one_to_one" ? "saffron" : "outline"} size="sm">
      {type === "one_to_one" ? t.ptm.typeOneToOne : t.ptm.typeGroup}
    </Badge>
  );
}

export function formatMeetingDateTime(iso: string, language: "en" | "gu"): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(language === "gu" ? "gu-IN" : "en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toLocalDateTimeInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
