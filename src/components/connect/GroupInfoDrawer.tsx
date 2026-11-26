"use client";

import React, { useState, useEffect } from "react";
import { X, Users, Shield, Pin, UserMinus, Plus, Trash2, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Conversation, ConversationParticipant } from "@/lib/types";

interface GroupInfoDrawerProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  currentUserId: string;
  onUpdateGroup: (updates: any) => Promise<void>;
  onDeleteGroup: (convId: string) => Promise<void>;
}

export function GroupInfoDrawer({
  conversation,
  isOpen,
  onClose,
  currentUserRole,
  currentUserId,
  onUpdateGroup,
  onDeleteGroup,
}: GroupInfoDrawerProps) {
  const { language } = useLanguage();
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const isConvAdmin =
    conversation.adminIds?.includes(currentUserId) || currentUserRole === "admin";

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/connect/conversations/${conversation.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setParticipants(d.participants || []);
        }
      })
      .catch((e) => console.error("Error loading group info:", e))
      .finally(() => setLoading(false));
  }, [isOpen, conversation.id]);

  useEffect(() => {
    if (!showAddMember) return;
    fetch("/api/connect/contacts")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // Filter out users already in conversation
          const existingIds = conversation.participantIds || [];
          setAvailableContacts((d.contacts || []).filter((c: any) => !existingIds.includes(c.userId)));
        }
      })
      .catch((e) => console.error(e));
  }, [showAddMember, conversation.participantIds]);

  if (!isOpen) return null;

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(language === "gu" ? "શું તમે આ સભ્યને જૂથમાંથી દૂર કરવા માંગો છો?" : "Remove this member from group?")) {
      return;
    }
    setActionLoading(true);
    try {
      await onUpdateGroup({ removeParticipants: [userId] });
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setActionLoading(true);
    try {
      await onUpdateGroup({ addParticipants: [userId] });
      setShowAddMember(false);
      // Reload
      const res = await fetch(`/api/connect/conversations/${conversation.id}`);
      const data = await res.json();
      if (data.success) setParticipants(data.participants || []);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(language === "gu" ? "શું તમે આ વાતચીતને કાયમ માટે કાઢી નાખવા માંગો છો?" : "Permanently delete this conversation and its messages?")) {
      return;
    }
    await onDeleteGroup(conversation.id);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#FAF8F2] dark:bg-[#201A17] border-l border-[#49352F]/20 dark:border-[#F4F1E1]/15 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#49352F]/10 dark:border-[#F4F1E1]/10 bg-[#F4F1E1] dark:bg-[#261E1A]">
        <h3 className="font-bold text-[#49352F] dark:text-[#F4F1E1] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#2E7D5E]" />
          {conversation.type === "direct"
            ? language === "gu" ? "સંપર્ક વિગત" : "Contact Info"
            : language === "gu" ? "જૂથ માહિતી" : "Group Info"}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#49352F]/60 hover:bg-[#49352F]/10 dark:hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="text-center p-4 bg-white dark:bg-[#261E1A] rounded-2xl border border-[#49352F]/10 dark:border-[#F4F1E1]/10 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#2E7D5E] text-white mx-auto flex items-center justify-center font-bold text-2xl shadow-md mb-3">
            {conversation.title.charAt(0)}
          </div>
          <h2 className="text-base font-bold text-[#49352F] dark:text-[#F4F1E1]">
            {language === "gu" && conversation.titleGujarati ? conversation.titleGujarati : conversation.title}
          </h2>
          <p className="text-xs text-[#49352F]/60 dark:text-[#F4F1E1]/60 mt-1">
            {conversation.description || (language === "gu" ? "શિક્ષાસેતુ કનેક્ટ અધિકૃત જૂથ" : "Official StudySaathi Connect Channel")}
          </p>
          {conversation.classroomId && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2E7D5E]/10 text-[#2E7D5E]">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{conversation.classroomId.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Members List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#49352F]/70 dark:text-[#F4F1E1]/70">
              {language === "gu" ? "સભ્યો" : "Participants"} ({participants.length})
            </h4>
            {isConvAdmin && conversation.type === "class_group" && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="text-xs font-bold text-[#2E7D5E] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === "gu" ? "સભ્ય ઉમેરો" : "Add Member"}
              </button>
            )}
          </div>

          {/* Add member inline picker */}
          {showAddMember && (
            <div className="mb-3 p-3 rounded-xl border border-[#2E7D5E]/30 bg-[#2E7D5E]/5 space-y-2">
              <span className="text-xs font-semibold text-[#49352F] dark:text-[#F4F1E1]">
                {language === "gu" ? "ઉમેરવા માટે પસંદ કરો:" : "Select to Add:"}
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableContacts.map((c) => (
                  <div
                    key={c.userId}
                    onClick={() => handleAddMember(c.userId)}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-[#261E1A] text-xs cursor-pointer hover:bg-[#2E7D5E]/15 transition"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-gray-500">{c.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#2E7D5E]" />
              <span>{language === "gu" ? "લોડ થઈ રહ્યું છે..." : "Loading members..."}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => {
                const isAdmin = conversation.adminIds?.includes(p.userId);
                return (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#261E1A] border border-[#49352F]/10 dark:border-[#F4F1E1]/10 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#F2CAB3] dark:bg-[#49352F] text-[#49352F] dark:text-[#F4F1E1] font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#49352F] dark:text-[#F4F1E1] truncate">
                          {p.name} {p.userId === currentUserId && "(You)"}
                        </div>
                        <div className="text-[10px] text-[#49352F]/60 dark:text-[#F4F1E1]/60 truncate">
                          {p.childName ? `Parent of ${p.childName}` : p.role.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#2E7D5E]/15 text-[#2E7D5E]">
                          Admin
                        </span>
                      )}
                      {isConvAdmin && p.userId !== currentUserId && (
                        <button
                          onClick={() => handleRemoveMember(p.userId)}
                          title="Remove member"
                          disabled={actionLoading}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete conversation action for admins */}
        {isConvAdmin && (
          <div className="pt-4 border-t border-[#49352F]/10 dark:border-[#F4F1E1]/10">
            <button
              onClick={handleDelete}
              className="w-full py-2 px-3 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4" />
              {language === "gu" ? "વાર્તાલાપ કાઢી નાખો" : "Delete Conversation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
