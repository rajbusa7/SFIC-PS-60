"use client";

import React, { useState } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Eye,
  FileText,
  TrendingUp,
  BrainCircuit,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ParentCommunication } from "@/lib/types";

interface ParentCommunicationHistoryListProps {
  communications: ParentCommunication[];
  title?: string;
  isParentView?: boolean;
}

export function ParentCommunicationHistoryList({
  communications = [],
  title = "Official Gmail & School Communications",
  isParentView = false,
}: ParentCommunicationHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "attendance":
        return <Badge variant="developing" size="sm">Attendance Alert</Badge>;
      case "academic":
        return <Badge variant="mastered" size="sm">Academic Report</Badge>;
      case "learning_gap":
        return <Badge variant="needsSupport" size="sm">Learning Gap</Badge>;
      case "remedial_plan":
        return <Badge variant="developing" size="sm">5-Step Plan</Badge>;
      case "notice":
        return <Badge variant="outline" size="sm">School Notice</Badge>;
      default:
        return <Badge variant="default" size="sm">Update</Badge>;
    }
  };

  const getChannelBadge = (channel: string, status: string) => {
    if (channel === "gmail") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <Mail className="w-3 h-3 text-emerald-700" />
          <span>Delivered via Gmail</span>
        </span>
      );
    }
    if (channel === "email") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
          <Mail className="w-3 h-3 text-blue-700" />
          <span>Email Gateway</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-300">
        <span>Portal Notification</span>
      </span>
    );
  };

  if (!communications || communications.length === 0) {
    return (
      <div className="p-8 text-center bg-[#FAF6E9]/40 dark:bg-[#1E1916] rounded-3xl border border-dashed border-[#49352F]/15">
        <Mail className="w-8 h-8 text-[#B26A1B] mx-auto mb-2 opacity-50" />
        <p className="text-xs font-bold text-[#49352F] dark:text-[#F4F1E1]">No communications dispatched yet</p>
        <p className="text-[11px] text-[#7A6862] dark:text-[#FAF6E9]/60 mt-1">
          {isParentView
            ? "Official announcements and student reports sent by the teacher will appear here and in your Gmail inbox."
            : "Use 'Send Report via Gmail' to dispatch attendance alerts, academic reports, or remedial plans directly to parents."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-extrabold text-[#49352F] dark:text-[#F4F1E1] flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#B26A1B]" />
          <span>{title}</span>
          <span className="text-[11px] font-normal text-[#7A6862]">({communications.length} Dispatched)</span>
        </h3>
      </div>

      <div className="space-y-2.5">
        {communications.map((comm) => {
          const isExpanded = expandedId === comm.id;
          const sentDate = new Date(comm.sentAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={comm.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#1E1916] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-xs transition-all space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getTypeBadge(comm.type)}
                  <span className="text-xs font-extrabold text-[#49352F] dark:text-[#F4F1E1]">
                    {comm.subject || comm.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getChannelBadge(comm.channel, comm.deliveryStatus)}
                  <span className="text-[11px] text-[#7A6862] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{sentDate}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-[#7A6862] dark:text-[#FAF6E9]/75 pt-1">
                <span>
                  <strong>Recipient:</strong> {comm.parentName} ({comm.parentEmail})
                </span>
                <button
                  type="button"
                  onClick={() => toggleExpand(comm.id)}
                  className="font-bold text-[#B26A1B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isExpanded ? "Collapse Content" : "View Full Email"}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Collapsible HTML / Content View */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#49352F]/10 space-y-2">
                  <div className="p-3 rounded-xl bg-[#FAF6E9]/60 dark:bg-[#26201C] border border-[#49352F]/10 text-xs">
                    <p className="font-semibold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                      Summary Message:
                    </p>
                    <p className="text-[#49352F]/90 dark:text-[#FAF6E9]/90 whitespace-pre-wrap leading-relaxed">
                      {comm.content}
                    </p>
                  </div>

                  {comm.htmlContent && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1A1412] border border-[#49352F]/15 overflow-hidden">
                      <span className="text-[10px] font-bold text-[#7A6862] uppercase tracking-wider block mb-2">
                        Rendered Responsive Email Body:
                      </span>
                      <div
                        className="prose prose-sm max-w-none text-xs"
                        dangerouslySetInnerHTML={{ __html: comm.htmlContent }}
                      />
                    </div>
                  )}

                  {comm.emailMessageId && (
                    <div className="text-[10px] font-mono text-[#7A6862] flex items-center gap-1">
                      <span>Message ID:</span>
                      <span className="bg-[#FAF6E9] dark:bg-[#26201C] px-1.5 py-0.5 rounded border border-[#49352F]/10">
                        {comm.emailMessageId}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

