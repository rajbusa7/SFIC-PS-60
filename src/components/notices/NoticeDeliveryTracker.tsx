"use client";

import React, { useState } from "react";
import {
  Send,
  CheckCircle2,
  Eye,
  Clock,
  ShieldCheck,
  AlertCircle,
  Users,
  Smartphone,
  MessageSquare,
  Loader2,
  UserCheck,
} from "lucide-react";
import type { SchoolNotice, NoticeDelivery } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface NoticeDeliveryTrackerProps {
  notice: SchoolNotice;
  deliveries: NoticeDelivery[];
  onDeliveriesUpdated?: (newDeliveries: NoticeDelivery[]) => void;
  className?: string;
}

export function NoticeDeliveryTracker({
  notice,
  deliveries,
  onDeliveriesUpdated,
  className = "",
}: NoticeDeliveryTrackerProps) {
  const { t, tr, formatClass } = useLanguage();
  const no = t.notices;
  const [isSending, setIsSending] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const total = deliveries.length;
  const deliveredCount = deliveries.filter((d) => d.status === "delivered" || d.status === "read" || d.status === "acknowledged").length;
  const readCount = deliveries.filter((d) => d.status === "read" || d.status === "acknowledged").length;
  const ackCount = deliveries.filter((d) => d.status === "acknowledged").length;

  const handleDispatch = async () => {
    setIsSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/notices/${notice.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: notice.targetClassGrade,
          section: notice.targetSection,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || no.ndtErrDispatchFailed);
      }

      setConfirmModalOpen(false);
      setSuccessMsg(data.message || no.ndtSuccessDeliveredFallback);
      if (onDeliveriesUpdated) {
        onDeliveriesUpdated(data.data);
      }
    } catch (err: any) {
      console.error("Dispatch error:", err);
      setError(err.message || no.ndtErrDispatchFailed);
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateAcknowledge = async (deliveryId: string) => {
    setAcknowledgingId(deliveryId);
    try {
      const res = await fetch(`/api/notices/${notice.id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId,
          feedback: "Noted with thanks. Aarav will be prepared.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updated = deliveries.map((d) => (d.id === deliveryId ? data.data : d));
        if (onDeliveriesUpdated) onDeliveriesUpdated(updated);
      }
    } catch (e) {
      console.error("Acknowledge failed:", e);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (filterStatus === "all") return true;
    return d.status === filterStatus;
  });

  return (
    <div className={`bg-white border border-[#49352F]/15 rounded-2xl p-6 shadow-sm ${className}`}>
      {/* Top Header & Dispatch Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#49352F]/10">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2E7D5E]" />
            <h3 className="text-base font-bold text-[#49352F]">
              {no.ndtHeading}
            </h3>
          </div>
          <p className="text-xs text-[#49352F]/70">
            {no.ndtSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#49352F] hover:bg-[#49352F]/90 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{no.ndtDispatchBtn}</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        <div className="p-3.5 bg-[#FAF6E9] rounded-xl border border-[#49352F]/10">
          <div className="flex items-center justify-between text-xs font-semibold text-[#49352F]/70">
            <span>{no.ndtRecipientsLabel}</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-2xl font-black text-[#49352F]">{total}</div>
          <div className="text-[11px] text-[#49352F]/60 mt-0.5">{no.ndtTargetParentsHint}</div>
        </div>

        <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/60">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
            <span>{no.ndtDeliveredCard}</span>
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-black text-blue-900">{deliveredCount}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">
            {tr("notices.ndtDeliveryRate", { rate: total > 0 ? Math.round((deliveredCount / total) * 100) : 0 })}
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
            <span>{no.ndtReadOpenedCard}</span>
            <Eye className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-black text-amber-900">{readCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {tr("notices.ndtReadRate", { rate: total > 0 ? Math.round((readCount / total) * 100) : 0 })}
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>{no.ndtAcknowledgedCard}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-900">{ackCount}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">
            {tr("notices.ndtSignOffRate", { rate: total > 0 ? Math.round((ackCount / total) * 100) : 0 })}
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recipient Roster */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#49352F] uppercase tracking-wider">
            {tr("notices.ndtRosterHeading", { count: filteredDeliveries.length })}
          </span>

          <div className="inline-flex rounded-lg border border-[#49352F]/15 p-0.5 bg-[#FAF6E9] text-[11px]">
            {[
              { id: "all", label: no.ndtFilterAll },
              { id: "delivered", label: no.ndtFilterDelivered },
              { id: "read", label: no.ndtFilterRead },
              { id: "acknowledged", label: no.ndtFilterAcknowledged },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  filterStatus === st.id
                    ? "bg-[#49352F] text-white"
                    : "text-[#49352F]/70 hover:text-[#49352F]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-8 bg-[#FAF6E9]/50 rounded-xl border border-dashed border-[#49352F]/20">
            <Users className="w-8 h-8 text-[#49352F]/30 mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#49352F]">
              {tr("notices.ndtNoRecordsMatching", { status: filterStatus })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#49352F]/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6E9] text-[#49352F] font-bold border-b border-[#49352F]/10">
                <tr>
                  <th className="py-2.5 px-3">{no.ndtThParentName}</th>
                  <th className="py-2.5 px-3">{no.ndtThStudentGrade}</th>
                  <th className="py-2.5 px-3">{no.ndtThLanguage}</th>
                  <th className="py-2.5 px-3">{no.ndtThChannel}</th>
                  <th className="py-2.5 px-3">{no.ndtThStatus}</th>
                  <th className="py-2.5 px-3 text-right">{no.ndtThAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/5 bg-white">
                {filteredDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-[#FAF6E9]/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#49352F]">
                      {del.parentName}
                    </td>
                    <td className="py-2.5 px-3 text-[#49352F]/80">
                      {del.studentName} ({del.studentGrade ? formatClass(del.studentGrade, del.studentSection || "A") : no.ndtGeneralLabel})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF6E9] border border-[#49352F]/15 text-[#49352F]">
                        {del.language}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 capitalize text-[#49352F]/70">
                      {del.channel}
                    </td>
                    <td className="py-2.5 px-3">
                      {del.status === "acknowledged" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {no.ndtStatusAck}
                        </span>
                      )}
                      {del.status === "read" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Eye className="w-3 h-3 text-amber-600" />
                          {no.ndtStatusRead}
                        </span>
                      )}
                      {del.status === "delivered" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <Smartphone className="w-3 h-3 text-blue-600" />
                          {no.ndtStatusDelivered}
                        </span>
                      )}
                      {del.status === "sent" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {no.ndtStatusSent}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {del.status !== "acknowledged" && (
                        <button
                          type="button"
                          onClick={() => handleSimulateAcknowledge(del.id)}
                          disabled={acknowledgingId === del.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          title={no.ndtSimulateAckTitle}
                        >
                          {acknowledgingId === del.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{no.ndtSignAckBtn}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal to Prevent Duplicate Sends */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#49352F]/20">
            <h4 className="text-base font-bold text-[#49352F] flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-[#2E7D5E]" />
              {no.ndtConfirmModalTitle}
            </h4>
            <p className="text-xs text-[#49352F]/80 leading-relaxed mb-4">
              {tr("notices.ndtConfirmModalBody", { title: notice.title })}
            </p>

            <div className="p-3 bg-[#FAF6E9] rounded-xl border border-[#49352F]/10 text-xs text-[#49352F] space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="font-semibold">{no.ndtTargetAudienceRow}</span>
                <span>{notice.targetClassGrade ? formatClass(notice.targetClassGrade) : no.ndtAllSchoolGrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{no.ndtUrgencyLevelRow}</span>
                <span className="capitalize font-bold">{notice.urgency}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{no.ndtDeliveryChannelsRow}</span>
                <span>{no.ndtDeliveryChannelsValue}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#49352F] hover:bg-[#FAF6E9] cursor-pointer"
              >
                {no.ntpCancelBtn}
              </button>

              <button
                type="button"
                onClick={handleDispatch}
                disabled={isSending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#49352F] text-white hover:bg-[#49352F]/90 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{no.ndtDispatchingBtn}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{no.ndtConfirmSendBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
