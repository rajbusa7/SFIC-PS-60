"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  MessageSquare,
  Users,
  Bell,
  Pin,
  Check,
  CheckCheck,
  Filter,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Conversation, ConversationType } from "@/lib/types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConv: (conv: Conversation) => void;
  onOpenNewModal: () => void;
  unreadTotal: number;
  currentUserId?: string;
}

export function ConversationListComponent({
  conversations,
  selectedConvId,
  onSelectConv,
  onOpenNewModal,
  unreadTotal,
  currentUserId,
}: ConversationListProps) {
  const { language } = useLanguage();
  const [filterType, setFilterType] = useState<"all" | ConversationType>("all");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.titleGujarati && c.titleGujarati.toLowerCase().includes(q)) ||
      (c.lastMessageText && c.lastMessageText.toLowerCase().includes(q))
    );
  });

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getConvIcon = (type: ConversationType) => {
    switch (type) {
      case "announcement":
        return <Bell className="w-4 h-4 text-[#D97706]" />;
      case "class_group":
        return <Users className="w-4 h-4 text-[#2E7D5E]" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[#49352F] dark:text-[#F4F1E1]" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] dark:bg-[#201A17] border-r border-[#49352F]/15 dark:border-[#F4F1E1]/10">
      {/* Top Header */}
      <div className="p-3.5 border-b border-[#49352F]/10 dark:border-[#F4F1E1]/10 bg-[#F4F1E1] dark:bg-[#261E1A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#2E7D5E] text-white flex items-center justify-center font-bold shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#49352F] dark:text-[#F4F1E1] leading-tight">
              {language === "gu" ? "સેતુ કનેક્ટ" : "ClassConnect"}
            </h2>
            <p className="text-[11px] text-[#49352F]/60 dark:text-[#F4F1E1]/60">
              {language === "gu" ? "વાલી-શિક્ષક સંવાદ" : "Parent-Teacher Chat"}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewModal}
          title={language === "gu" ? "નવો વાર્તાલાપ" : "New Chat"}
          className="p-2 rounded-xl bg-[#2E7D5E] hover:bg-[#24634B] text-white shadow-sm transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{language === "gu" ? "નવું" : "New"}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#49352F]/10 dark:border-[#F4F1E1]/10 bg-white/40 dark:bg-black/10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#49352F]/40 dark:text-[#F4F1E1]/40" />
          <input
            type="text"
            placeholder={language === "gu" ? "ચેટ શોધો..." : "Search chats or messages..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#49352F]/15 dark:border-[#F4F1E1]/15 bg-white dark:bg-[#261E1A] text-[#49352F] dark:text-[#F4F1E1] focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]/30"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-2 border-b border-[#49352F]/10 dark:border-[#F4F1E1]/10 overflow-x-auto text-[11px] font-semibold bg-white/20 dark:bg-black/5 no-scrollbar">
        <button
          onClick={() => setFilterType("all")}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
            filterType === "all"
              ? "bg-[#2E7D5E] text-white shadow-xs"
              : "text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10"
          }`}
        >
          {language === "gu" ? "બધા" : "All"}
        </button>
        <button
          onClick={() => setFilterType("direct")}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
            filterType === "direct"
              ? "bg-[#2E7D5E] text-white shadow-xs"
              : "text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10"
          }`}
        >
          {language === "gu" ? "૧-થી-૧ ચેટ" : "Direct"}
        </button>
        <button
          onClick={() => setFilterType("class_group")}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
            filterType === "class_group"
              ? "bg-[#2E7D5E] text-white shadow-xs"
              : "text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10"
          }`}
        >
          {language === "gu" ? "વર્ગ જૂથો" : "Class Groups"}
        </button>
        <button
          onClick={() => setFilterType("announcement")}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
            filterType === "announcement"
              ? "bg-[#2E7D5E] text-white shadow-xs"
              : "text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10"
          }`}
        >
          {language === "gu" ? "સૂચનાઓ" : "Notices"}
        </button>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#49352F]/5 dark:divide-[#F4F1E1]/5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-[#49352F]/50 dark:text-[#F4F1E1]/50 text-xs">
            {language === "gu" ? "કોઈ વાર્તાલાપ મળ્યો નથી." : "No conversations found."}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = selectedConvId === conv.id;
            const title =
              language === "gu" && conv.titleGujarati ? conv.titleGujarati : conv.title;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConv(conv)}
                className={`p-3 flex items-start gap-3 cursor-pointer transition relative ${
                  isSelected
                    ? "bg-[#EAE4D2] dark:bg-[#2C231F] border-l-4 border-[#2E7D5E]"
                    : "hover:bg-white/60 dark:hover:bg-white/5"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#F2CAB3] dark:bg-[#3D2E28] border border-[#49352F]/15 flex items-center justify-center font-bold text-sm text-[#49352F] dark:text-[#F4F1E1]">
                    {conv.type === "announcement" ? (
                      <Bell className="w-5 h-5 text-[#D97706]" />
                    ) : conv.type === "class_group" ? (
                      <Users className="w-5 h-5 text-[#2E7D5E]" />
                    ) : (
                      conv.title.charAt(0)
                    )}
                  </div>
                  {conv.type === "class_group" && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2E7D5E] border-2 border-white dark:border-[#201A17] flex items-center justify-center text-[9px] text-white">
                      G
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="font-bold text-xs text-[#49352F] dark:text-[#F4F1E1] truncate flex items-center gap-1.5">
                      {conv.isPinned && <Pin className="w-3 h-3 text-[#D97706] rotate-45 flex-shrink-0" />}
                      <span className="truncate">{title}</span>
                    </h3>
                    <span className="text-[10px] text-[#49352F]/50 dark:text-[#F4F1E1]/50 flex-shrink-0 font-medium">
                      {formatTimestamp(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[#49352F]/70 dark:text-[#F4F1E1]/70 truncate">
                      {conv.lastMessageSenderName && (
                        <span className="font-semibold text-[#49352F] dark:text-[#F4F1E1]">
                          {conv.lastMessageSenderName}:{" "}
                        </span>
                      )}
                      {conv.lastMessageText || (language === "gu" ? "વાર્તાલાપ શરૂ કરો" : "Tap to chat")}
                    </p>

                    {/* Unread Pill */}
                    {(() => {
                      const unread = conv.unreadCounts
                        ? currentUserId
                          ? conv.unreadCounts[currentUserId] || 0
                          : Math.max(0, ...Object.values(conv.unreadCounts))
                        : 0;
                      return unread > 0 ? (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#2E7D5E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-xs">
                          {unread}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const ConversationList = React.memo(ConversationListComponent);
