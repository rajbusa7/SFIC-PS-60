"use client";

import React, { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertCircle, Unlink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GmailStatus {
  isConnected: boolean;
  email: string | null;
  connectedAt: string | null;
  status: "connected" | "expired" | "revoked" | "disconnected";
}

interface GmailStatusBadgeProps {
  onStatusChange?: (status: GmailStatus) => void;
  className?: string;
}

export function GmailStatusBadge({ onStatusChange, className = "" }: GmailStatusBadgeProps) {
  const [status, setStatus] = useState<GmailStatus>({
    isConnected: false,
    email: null,
    connectedAt: null,
    status: "disconnected",
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/gmail/status");
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setStatus(data.data);
        onStatusChange?.(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch Gmail connection status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for connection feedback
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("gmail") === "connected") {
        fetchStatus();
      }
    }
  }, []);

  const handleConnect = () => {
    window.location.href = `/api/auth/gmail/connect?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect the school Gmail account? Notices will fall back to system email delivery.")) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch("/api/auth/gmail/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      }
    } catch (e) {
      console.error("Failed to disconnect Gmail:", e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF6E9] dark:bg-[#26201C] border border-[#49352F]/15 text-xs text-[#7A6862] ${className}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B26A1B]" />
        <span>Checking Gmail Status...</span>
      </div>
    );
  }

  if (status.isConnected && status.email) {
    return (
      <div className={`inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 ${className}`}>
        <div className="flex items-center gap-1.5 font-bold">
          <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Gmail Active:</span>
          <span className="font-mono text-[11px] underline decoration-emerald-400">{status.email}</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={actionLoading}
          title="Disconnect school Gmail"
          className="ml-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Unlink className="w-3 h-3" />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 ${className}`}>
      <div className="flex items-center gap-1.5 font-medium">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Gmail Not Connected (Using System Gateway)</span>
      </div>
      <button
        onClick={handleConnect}
        disabled={actionLoading}
        className="ml-1 px-2.5 py-1 rounded-lg bg-[#49352F] hover:bg-[#3D2C27] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
      >
        <Mail className="w-3 h-3 text-[#F2CAB3]" />
        <span>Connect School Gmail</span>
      </button>
    </div>
  );
}

