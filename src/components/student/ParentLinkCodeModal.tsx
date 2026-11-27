"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  KeyRound,
  X,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Trash2,
  ShieldCheck,
} from "lucide-react";

interface ParentLinkCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function ParentLinkCodeModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: ParentLinkCodeModalProps) {
  const [linkingCodes, setLinkingCodes] = useState<any[]>([]);
  const [connectedParents, setConnectedParents] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    if (!studentId) return;
    setLoadingCodes(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/link-code`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load verification codes.");
      }
      setLinkingCodes(data.linkingCodes || []);
      setConnectedParents(data.connectedParents || []);
    } catch (err: any) {
      setError(err.message || "Failed to load verification codes.");
    } finally {
      setLoadingCodes(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!isOpen) return;
    setStatusMessage(null);
    fetchCodes();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, fetchCodes, onClose]);

  if (!isOpen) return null;

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/students/${studentId}/link-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.linkingCode) {
        throw new Error(data.error || "Failed to generate verification code.");
      }
      setLinkingCodes((prev) => [data.linkingCode, ...prev]);
      setStatusMessage(`Generated code ${data.linkingCode.code} (valid for ${expiresInDays} days).`);
    } catch (err: any) {
      setError(err.message || "Failed to generate verification code.");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRevokeCode = async (codeId: string) => {
    setRevokingId(codeId);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/link-code?codeId=${encodeURIComponent(codeId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to revoke verification code.");
      }
      setLinkingCodes((prev) =>
        prev.map((c) => (c.id === codeId ? { ...c, status: "revoked" } : c))
      );
    } catch (err: any) {
      setError(err.message || "Failed to revoke verification code.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyCode = async (codeItem: any) => {
    try {
      await navigator.clipboard.writeText(codeItem.code);
      setCopiedCodeId(codeItem.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-link-code-title"
        className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#49352F]/15 p-5 sm:p-6 shadow-2xl space-y-4 text-[#49352F]"
      >
        <div className="flex items-center justify-between border-b border-[#49352F]/10 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <KeyRound className="w-5 h-5 text-[#B26A1B] shrink-0" />
            <h3 id="teacher-link-code-title" className="font-heading text-base font-black text-[#49352F] truncate">
              Parent Linking Code &bull; {studentName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close parent linking code dialog"
            className="text-[#7A6862] hover:text-[#49352F] p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#7A6862] leading-relaxed">
          Generate a secure single-use verification code for <strong>{studentName}</strong>&apos;s parent. When entered on the Parent Dashboard, it securely links this student to the parent&apos;s account.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF6E9] border border-[#49352F]/15">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#7A6862] block">
              Generate New Single-Use Code
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="link-code-validity" className="text-xs font-semibold text-[#49352F]">
                Valid for:
              </label>
              <select
                id="link-code-validity"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="rounded-lg border border-[#49352F]/20 bg-white px-2 py-1 text-xs font-bold text-[#49352F]"
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>
          <Button
            size="sm"
            disabled={generatingCode}
            onClick={handleGenerateCode}
            className="rounded-xl text-xs font-bold bg-[#B26A1B] text-white hover:bg-[#8F4E10] shrink-0"
          >
            {generatingCode ? "Generating..." : "+ Generate Code"}
          </Button>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {statusMessage && (
          <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {/* Existing Codes */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#49352F]">Active &amp; Recent Linking Codes:</span>
          {loadingCodes ? (
            <div className="p-4 text-center text-xs text-[#7A6862] flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-[#B26A1B]" />
              <span>Loading verification codes...</span>
            </div>
          ) : linkingCodes.length === 0 ? (
            <p className="text-xs text-[#7A6862] p-3 text-center rounded-xl bg-slate-50 border border-[#49352F]/10">
              No linking codes generated yet. Click &quot;+ Generate Code&quot; above.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {linkingCodes.map((codeItem: any) => {
                const isActive = codeItem.status === "active" && new Date(codeItem.expiresAt).getTime() > Date.now();
                const displayStatus =
                  codeItem.status === "used"
                    ? "Redeemed"
                    : codeItem.status === "revoked"
                    ? "Revoked"
                    : codeItem.status === "expired" || !isActive
                    ? "Expired"
                    : "Active (Ready)";
                const badgeVariant =
                  codeItem.status === "used"
                    ? "default"
                    : displayStatus === "Active (Ready)"
                    ? "mastered"
                    : "needsSupport";

                return (
                  <div
                    key={codeItem.id}
                    className="p-3 rounded-xl border border-[#49352F]/12 bg-white flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-black text-sm text-[#B26A1B] tracking-wider block">
                        {codeItem.code}
                      </span>
                      <span className="text-[10px] text-[#7A6862]">
                        Expires: {new Date(codeItem.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={badgeVariant} size="sm">
                        {displayStatus}
                      </Badge>
                      {isActive && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(codeItem)}
                            title="Copy verification code"
                            aria-label={`Copy code ${codeItem.code}`}
                            className="p-1.5 rounded-lg border border-[#49352F]/15 hover:bg-[#FAF6E9] text-[#49352F] cursor-pointer"
                          >
                            {copiedCodeId === codeItem.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={revokingId === codeItem.id}
                            onClick={() => handleRevokeCode(codeItem.id)}
                            title="Revoke unused code"
                            aria-label={`Revoke code ${codeItem.code}`}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Connected Parents */}
        {connectedParents.length > 0 && (
          <div className="pt-2 border-t border-[#49352F]/10 space-y-1.5">
            <span className="text-xs font-bold text-[#49352F]">Currently Linked Parents:</span>
            <div className="space-y-1">
              {connectedParents.map((parent: any) => (
                <div key={parent.id} className="text-xs text-[#7A6862] flex items-center justify-between gap-2">
                  <span className="font-medium text-[#49352F]">
                    {parent.name} ({parent.relationship || "Guardian"})
                  </span>
                  <span className="truncate">{parent.phone || parent.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
