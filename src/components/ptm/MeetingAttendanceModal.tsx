"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  Calendar,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { apiClient } from "@/services/apiClient";
import type { MeetingWithInvites, MeetingAttendance } from "@shared/types";

interface MeetingAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingWithInvites | null;
}

export function MeetingAttendanceModal({
  isOpen,
  onClose,
  meeting,
}: MeetingAttendanceModalProps) {
  const { t, language } = useLanguage();
  const vt = t.video;

  const [attendance, setAttendance] = useState<MeetingAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !meeting) return;

    let mounted = true;
    async function fetchAttendance() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.getMeetingAttendance(meeting!.id);
        if (mounted && res.success) {
          setAttendance(res.attendance || []);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load attendance records");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAttendance();

    return () => {
      mounted = false;
    };
  }, [isOpen, meeting]);

  // Map parent names from invites
  const parentNameMap = new Map<string, string>();
  if (meeting?.invites) {
    for (const inv of meeting.invites) {
      if (inv.parentId && inv.parentName) {
        parentNameMap.set(inv.parentId, inv.parentName);
      }
    }
  }

  const formatDuration = (joinedAt?: string | null, leftAt?: string | null) => {
    if (!joinedAt) return "-";
    const start = new Date(joinedAt).getTime();
    const end = leftAt ? new Date(leftAt).getTime() : Date.now();
    const diffMin = Math.round((end - start) / 60000);
    return `${diffMin} min`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${vt.attendanceTab} • ${meeting?.title || ""}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-[#49352F] dark:text-[#F4F1E1]">
        {error && (
          <div className="p-3 rounded-xl bg-[#FBECE9] border border-[#A93327]/25 text-[#A93327] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-[#7A6862] dark:text-[#FAF6E9]/70">
            Loading attendance records...
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FAF6E9] dark:bg-[#1E1916] border border-dashed border-[#49352F]/20 text-center space-y-2">
            <UserCheck className="w-8 h-8 text-[#B26A1B] mx-auto opacity-70" />
            <h4 className="text-sm font-bold">{vt.noAttendanceRecords}</h4>
            <p className="text-xs text-[#7A6862] dark:text-[#FAF6E9]/70">
              When parents or teachers join the call room, entrance and departure times are recorded automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#49352F]/15 dark:border-[#F2CAB3]/20">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6E9] dark:bg-[#1E1916] border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-[#7A6862] dark:text-[#FAF6E9]/70 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Participant</th>
                  <th className="p-3">{vt.joinedAtLabel}</th>
                  <th className="p-3">{vt.leftAtLabel}</th>
                  <th className="p-3">{vt.durationLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352F]/10 dark:divide-[#F2CAB3]/15">
                {attendance.map((rec) => {
                  const pName = parentNameMap.get(rec.parentId) || rec.parentId;
                  const isCurrent = !rec.leftAt;
                  return (
                    <tr key={rec.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{pName}</span>
                          {isCurrent && (
                            <Badge variant="mint" size="sm">
                              {vt.inMeetingNow}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-[#7A6862] dark:text-[#FAF6E9]/75">
                        {rec.joinedAt
                          ? new Date(rec.joinedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="p-3 text-[#7A6862] dark:text-[#FAF6E9]/75">
                        {rec.leftAt
                          ? new Date(rec.leftAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : isCurrent
                          ? "Active"
                          : "-"}
                      </td>
                      <td className="p-3 font-bold text-[#B26A1B]">
                        {formatDuration(rec.joinedAt, rec.leftAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {vt.closeBtn}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
