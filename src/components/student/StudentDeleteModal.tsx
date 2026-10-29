"use client";

import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { AlertTriangle, Archive, Trash2, AlertCircle, ShieldAlert } from "lucide-react";
import type { Student } from "@/lib/types";

interface StudentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess: (message: string) => void;
}

export function StudentDeleteModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: StudentDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  const handleArchive = async (archiveStatus: "transferred" | "graduated" = "transferred") => {
    setIsArchiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentStatus: archiveStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(`Student ${student.displayName} marked as ${archiveStatus}.`);
        onClose();
      } else {
        setError(data.error || "Failed to update enrollment status");
      }
    } catch {
      setError("Network error updating student status");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(`Student ${student.displayName} (${student.studentCode}) was permanently removed.`);
        onClose();
      } else {
        setError(data.error || "Failed to delete student");
      }
    } catch {
      setError("Network error deleting student record");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Student Record Management"
      description="Choose between archiving (recommended) or permanent record removal."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Student Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {student.displayName}
            </h4>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {student.studentCode} • Class {student.grade}-{student.section}
            </p>
          </div>
          <Badge
            variant={
              student.enrollmentStatus === "active"
                ? "mastered"
                : student.enrollmentStatus === "graduated"
                ? "completed"
                : "outline"
            }
            size="sm"
          >
            {student.enrollmentStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Option 1: Archive (Non-destructive) */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Archive className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-amber-400">
                Option A: Archive / Mark Transferred (Recommended)
              </h5>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Retains all previous assessment results, 3D competency skill trees, and 5-step remedial plans for school compliance while marking the student as transferred or graduated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={isArchiving || isDeleting || student.enrollmentStatus === "transferred"}
              onClick={() => handleArchive("transferred")}
              className="text-xs rounded-lg border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              <span>{isArchiving ? "Updating..." : "Mark Transferred"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isArchiving || isDeleting || student.enrollmentStatus === "graduated"}
              onClick={() => handleArchive("graduated")}
              className="text-xs rounded-lg border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <span>Mark Graduated</span>
            </Button>
          </div>
        </div>

        {/* Option 2: Permanent Deletion (Destructive with Confirmation) */}
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-rose-400">
                Option B: Permanent Deletion (Destructive Action)
              </h5>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Permanently deletes the student record from persistent storage. In accordance with database foreign key rules, all associated formative assessment results, gap analyses, and remedial interventions will be removed.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isDeleting || isArchiving}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting || isArchiving}
            onClick={handleDelete}
            className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-rose-600 rounded-xl transition-all shadow-md shadow-rose-900/30"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>{isDeleting ? "Deleting Permanently..." : "Confirm Permanent Deletion"}</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
