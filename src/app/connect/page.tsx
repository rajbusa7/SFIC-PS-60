"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConversationList } from "@/components/connect/ConversationList";
import { ChatWindow } from "@/components/connect/ChatWindow";
import { GroupInfoDrawer } from "@/components/connect/GroupInfoDrawer";
import { NewChatModal } from "@/components/connect/NewChatModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { MessageSquare, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import type { Conversation, ChatMessage, ChatMessageAttachment } from "@/lib/types";

export default function ConnectChatPage() {
  const { user, role } = useAuth();
  const { language } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const currentUserId = user?.id || (role === "parent" ? "par-001" : role === "admin" ? "usr-admin-01" : "usr-teacher-01");
  const currentUserRole = role || user?.role || "teacher";

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/connect/conversations");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        setUnreadTotal(data.unreadTotal || 0);

        // Keep selected conversation updated if present
        if (selectedConv) {
          const fresh = (data.conversations || []).find((c: Conversation) => c.id === selectedConv.id);
          if (fresh) setSelectedConv(fresh);
        }
      }
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
    } finally {
      setLoadingConvs(false);
    }
  }, [selectedConv]);

  // Initial load + interval polling for conversations list
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId: string, isSilent = false) => {
    if (!isSilent) setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/connect/messages?conversationId=${convId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      if (!isSilent) setLoadingMsgs(false);
    }
  }, []);

  // Poll messages every 4 seconds when conversation is active
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }

    fetchMessages(selectedConv.id, false);
    const msgInterval = setInterval(() => {
      fetchMessages(selectedConv.id, true);
    }, 4000);

    return () => clearInterval(msgInterval);
  }, [selectedConv, fetchMessages]);

  // Auto-select first conversation on initial desktop load if none selected
  useEffect(() => {
    if (!selectedConv && conversations.length > 0 && typeof window !== "undefined" && window.innerWidth >= 768) {
      setSelectedConv(conversations[0]);
    }
  }, [conversations, selectedConv]);

  // Send Message
  const handleSendMessage = async (payload: {
    text: string;
    attachments?: ChatMessageAttachment[];
    replyTo?: { id: string; senderName: string; text: string };
  }) => {
    if (!selectedConv) return;

    try {
      const res = await fetch("/api/connect/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          text: payload.text,
          attachments: payload.attachments,
          replyTo: payload.replyTo,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        // Optimistic append
        setMessages((prev) => [...prev, data.message]);

        // Refresh conversation list to reflect last message
        fetchConversations();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error("Send message error:", e);
    }
  };

  // Direct Contact Select from Modal
  const handleSelectContact = async (contact: any) => {
    try {
      const res = await fetch("/api/connect/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          title: contact.name,
          participantIds: [currentUserId, contact.userId],
        }),
      });

      const data = await res.json();
      if (data.success && data.conversation) {
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === data.conversation.id);
          return exists ? prev : [data.conversation, ...prev];
        });
        setSelectedConv(data.conversation);
      }
    } catch (e) {
      console.error("Direct chat initiation error:", e);
    }
  };

  // Create Group from Modal
  const handleCreateGroup = async (groupData: {
    title: string;
    description: string;
    classroomId?: string;
    grade?: number;
    section?: string;
    participantIds: string[];
    allowParentReplies: boolean;
  }) => {
    try {
      const res = await fetch("/api/connect/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "class_group",
          ...groupData,
        }),
      });

      const data = await res.json();
      if (data.success && data.conversation) {
        setConversations((prev) => [data.conversation, ...prev]);
        setSelectedConv(data.conversation);
      }
    } catch (e) {
      console.error("Group creation error:", e);
    }
  };

  // Update Group
  const handleUpdateGroup = async (updates: any) => {
    if (!selectedConv) return;
    try {
      const res = await fetch(`/api/connect/conversations/${selectedConv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setSelectedConv(data.conversation);
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (convId: string) => {
    try {
      const res = await fetch(`/api/connect/conversations/${convId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSelectedConv(null);
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Report message
  const handleReportMessage = async (messageId: string, reason: string) => {
    try {
      const res = await fetch("/api/connect/messages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          language === "gu"
            ? "સંદેશ શાળા વહીવટકર્તાને સફળતાપૂર્વક રિપોર્ટ કરવામાં આવ્યો છે."
            : "Message successfully reported for administrative review."
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-7.5rem)] min-h-[500px] w-full rounded-2xl border border-[#49352F]/15 dark:border-[#F4F1E1]/15 overflow-hidden shadow-lg bg-white dark:bg-[#1B1614] flex relative">
        {/* Left Panel: Conversation List (Visible on desktop or when no conversation selected on mobile) */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
            selectedConv ? "hidden md:flex flex-col" : "flex flex-col"
          }`}
        >
          {loadingConvs ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500 bg-[#FAF8F2] dark:bg-[#201A17]">
              <Loader2 className="w-6 h-6 animate-spin text-[#2E7D5E] mb-2" />
              <span className="text-xs">{language === "gu" ? "વાર્તાલાપ લોડ થઈ રહ્યા છે..." : "Loading chats..."}</span>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConvId={selectedConv?.id || null}
              onSelectConv={(conv) => setSelectedConv(conv)}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              unreadTotal={unreadTotal}
            />
          )}
        </div>

        {/* Right Panel: Chat Window (Visible on desktop or when conversation selected on mobile) */}
        <div
          className={`flex-1 h-full min-w-0 ${
            selectedConv ? "flex flex-col" : "hidden md:flex flex-col items-center justify-center bg-[#EFEAE2] dark:bg-[#161210]"
          }`}
        >
          {selectedConv ? (
            <ChatWindow
              conversation={selectedConv}
              messages={messages}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onSendMessage={handleSendMessage}
              onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
              onBackMobile={() => setSelectedConv(null)}
              onReportMessage={handleReportMessage}
            />
          ) : (
            /* Empty state when no chat selected on desktop */
            <div className="text-center p-8 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] flex items-center justify-center mx-auto mb-4 shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                {language === "gu" ? "સેતુ કનેક્ટ — સુરક્ષિત સંવાદ" : "StudySaathi Connect"}
              </h3>
              <p className="text-xs text-[#49352F]/70 dark:text-[#F4F1E1]/70 leading-relaxed mb-4">
                {language === "gu"
                  ? "શિક્ષકો, આચાર્ય અને વાલીઓ વચ્ચે સીધો, સુરક્ષિત અને ઝડપી સંવાદ. શરૂ કરવા માટે ડાબી બાજુથી ચેટ પસંદ કરો."
                  : "Direct, secure, and WhatsApp-style parent-teacher communication. Select a conversation from the left to begin."}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#261E1A] border border-[#49352F]/10 text-[11px] font-semibold text-[#2E7D5E]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === "gu" ? "એન્ડ-ટુ-એન્ડ સુરક્ષિત શાળા સંવાદ" : "Role-Protected School Communication"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Group Info Drawer */}
        {selectedConv && (
          <GroupInfoDrawer
            conversation={selectedConv}
            isOpen={isGroupInfoOpen}
            onClose={() => setIsGroupInfoOpen(false)}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {/* New Chat / Create Group Modal */}
        <NewChatModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          currentUserRole={currentUserRole}
          onSelectContact={handleSelectContact}
          onCreateGroup={handleCreateGroup}
        />
      </div>
    </AppLayout>
  );
}
