"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConversationList } from "@/components/connect/ConversationList";
import { ChatWindow } from "@/components/connect/ChatWindow";
import { GroupInfoDrawer } from "@/components/connect/GroupInfoDrawer";
import { NewChatModal } from "@/components/connect/NewChatModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { MessageSquare, ShieldCheck, Loader2, Bell, CheckCircle2, AlertCircle, X } from "lucide-react";
import type { Conversation, ChatMessage, ChatMessageAttachment } from "@/lib/types";

const NoticesView = dynamic(
  () => import("@/components/notices/NoticesView").then((m) => m.NoticesView),
  {
    ssr: false,
    loading: () => (
      <div className="p-12 text-center text-xs text-[#7A6862] bg-[#FAF6E9] rounded-2xl border border-[#49352F]/15">
        Loading Announcements & Notices...
      </div>
    ),
  }
);

function ConnectChatContent() {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const cn = t.connect;
  const searchParams = useSearchParams();

  const [activeSubTab, setActiveSubTab] = useState<"messages" | "announcements">(
    searchParams.get("tab") === "announcements" ? "announcements" : "messages"
  );
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "announcements") setActiveSubTab("announcements");
    else if (tabParam === "messages") setActiveSubTab("messages");
  }, [searchParams]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const currentUserId = user?.id || (role === "parent" ? "par-001" : role === "admin" ? "usr-admin-01" : "usr-teacher-01");
  const currentUserRole = role || user?.role || "teacher";

  // Stable refs to prevent interval recreation and stale closures
  const selectedConvRef = useRef<Conversation | null>(null);
  selectedConvRef.current = selectedConv;

  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // 1. Fetch conversations with lightweight JSON diff check
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/connect/conversations");
      const data = await res.json();
      if (data.success) {
        const freshConvs = data.conversations || [];
        setConversations(freshConvs);
        setUnreadTotal(data.unreadTotal || 0);

        // Keep selected conversation metadata updated
        if (selectedConvRef.current) {
          const fresh = freshConvs.find((c: Conversation) => c.id === selectedConvRef.current?.id);
          if (fresh) setSelectedConv(fresh);
        }
      }
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Conversations polling (every 10s when tab is active)
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchConversations();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // 2. Initial load for selected conversation messages (limit 40)
  const loadInitialMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/connect/messages?conversationId=${convId}&limit=40`);
      const data = await res.json();
      if (data.success && selectedConvRef.current?.id === convId) {
        setMessages(data.messages || []);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (e) {
      console.error("Failed to load initial messages:", e);
    }
  }, []);

  // When selected conversation changes
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      setHasMore(false);
      return;
    }
    loadInitialMessages(selectedConv.id);
  }, [selectedConv?.id, loadInitialMessages]);

  // 3. Incremental polling: query only messages strictly after the newest message
  const pollNewMessages = useCallback(async () => {
    const convId = selectedConvRef.current?.id;
    if (!convId) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    const currentList = messagesRef.current;
    // Find the latest non-temporary timestamp
    let latestTimestamp: string | undefined;
    for (let i = currentList.length - 1; i >= 0; i--) {
      if (!currentList[i].id.startsWith("temp-")) {
        latestTimestamp = currentList[i].createdAt;
        break;
      }
    }

    if (!latestTimestamp) {
      return;
    }

    try {
      const url = `/api/connect/messages?conversationId=${convId}&since=${encodeURIComponent(latestTimestamp)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        if (selectedConvRef.current?.id !== convId) return;

        setMessages((prev) => {
          const newMsgs: ChatMessage[] = [];
          for (const incoming of data.messages) {
            // Deduplicate: check if ID exists or if it matches an optimistic pending message
            const exists = prev.some((m) => m.id === incoming.id);
            if (!exists) {
              newMsgs.push(incoming);
            }
          }
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
      }
    } catch (e) {
      console.error("Incremental poll error:", e);
    }
  }, []);

  // Poll for new messages every 3.5 seconds
  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(pollNewMessages, 3500);
    return () => clearInterval(interval);
  }, [selectedConv?.id, pollNewMessages]);

  // 4. Pagination: Load Older Messages
  const handleLoadOlder = useCallback(async () => {
    if (loadingOlder || !selectedConv || messages.length === 0) return;
    const oldestTimestamp = messages[0]?.createdAt;
    if (!oldestTimestamp) return;

    setLoadingOlder(true);
    try {
      const url = `/api/connect/messages?conversationId=${selectedConv.id}&before=${encodeURIComponent(oldestTimestamp)}&limit=40`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (e) {
      console.error("Failed to load older messages:", e);
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, selectedConv, messages]);

  // Auto-select first conversation on initial desktop load if none selected
  useEffect(() => {
    if (!selectedConv && conversations.length > 0 && typeof window !== "undefined" && window.innerWidth >= 768) {
      setSelectedConv(conversations[0]);
    }
  }, [conversations, selectedConv]);

  // 5. Send Message: Optimistic UI with immediate append
  const handleSendMessage = useCallback(async (payload: {
    text: string;
    attachments?: ChatMessageAttachment[];
    replyTo?: { id: string; senderName: string; text: string };
  }) => {
    if (!selectedConvRef.current) return;
    const convId = selectedConvRef.current.id;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: convId,
      senderId: currentUserId,
      senderName: user?.name || (currentUserRole === "parent" ? "Parent" : "Teacher"),
      senderRole: currentUserRole,
      text: payload.text,
      attachments: payload.attachments,
      replyTo: payload.replyTo,
      status: "sending",
      readBy: [{ userId: currentUserId, readAt: now }],
      createdAt: now,
    };

    // Immediate append to messages
    setMessages((prev) => [...prev, optimisticMsg]);

    // Optimistically update conversation snippet in list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessageText: payload.text || (payload.attachments?.length ? "[Attachment]" : ""),
              lastMessageAt: now,
              lastMessageSenderName: user?.name || "You",
            }
          : c
      )
    );

    // Send to backend in background
    try {
      const res = await fetch("/api/connect/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          text: payload.text,
          attachments: payload.attachments,
          replyTo: payload.replyTo,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        // Reconcile: replace temp message with server message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, status: "sent" } : m))
        );
      } else {
        // Mark optimistic message as failed
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
        );
        if (data.error) setFeedbackNotice({ type: "error", message: data.error });
      }
    } catch (e) {
      console.error("Send message error:", e);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  }, [currentUserId, currentUserRole, user?.name]);

  // Retry sending a failed message
  const handleRetryMessage = useCallback(async (failedMsg: ChatMessage) => {
    if (!selectedConvRef.current) return;
    const convId = selectedConvRef.current.id;

    // Reset status to sending
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, status: "sending" } : m))
    );

    try {
      const res = await fetch("/api/connect/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          text: failedMsg.text,
          attachments: failedMsg.attachments,
          replyTo: failedMsg.replyTo,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...data.message, status: "sent" } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...m, status: "failed" } : m))
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, status: "failed" } : m))
      );
    }
  }, []);

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
        setFeedbackNotice({ type: "success", message: cn.reportSuccess });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Connect Sub-navigation: Direct Messages vs Broadcast Announcements */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#201A17] border border-[#49352F]/15 dark:border-[#F2CAB3]/20 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab("messages")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "messages"
                  ? "bg-[#F2CAB3] text-[#49352F] shadow-xs font-black border border-[#49352F]/15"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{(cn as any).messagesTab || "Messages"}</span>
              {unreadTotal > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#2E7D5E] text-white text-[10px] font-bold">
                  {unreadTotal}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("announcements")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "announcements"
                  ? "bg-[#F2CAB3] text-[#49352F] shadow-xs font-black border border-[#49352F]/15"
                  : "text-[#7A6862] dark:text-[#FAF6E9]/70 hover:text-[#49352F] dark:hover:text-[#F4F1E1]"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t.nav?.parentBridgeNotices || "Announcements & Notices"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackNotice && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 shadow-xs ${
              feedbackNotice.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-900"
                : "bg-rose-500/10 border-rose-500/25 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackNotice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeSubTab === "announcements" ? (
          <NoticesView embedded />
        ) : (
          <div className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-11rem)] min-h-[500px] w-full rounded-2xl border border-[#49352F]/15 dark:border-[#F4F1E1]/15 overflow-hidden shadow-lg bg-white dark:bg-[#1B1614] flex relative">
            {/* Left Panel: Conversation List */}
            <div
              className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
                selectedConv ? "hidden md:flex flex-col" : "flex flex-col"
              }`}
            >
              {loadingConvs ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500 bg-[#FAF8F2] dark:bg-[#201A17]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2E7D5E] mb-2" />
                  <span className="text-xs">{cn.loadingChats}</span>
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  selectedConvId={selectedConv?.id || null}
                  onSelectConv={(conv) => setSelectedConv(conv)}
                  onOpenNewModal={() => setIsNewModalOpen(true)}
                  unreadTotal={unreadTotal}
                  currentUserId={currentUserId}
                />
              )}
            </div>

            {/* Right Panel: Chat Window */}
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
                  onRetryMessage={handleRetryMessage}
                  hasMore={hasMore}
                  onLoadOlder={handleLoadOlder}
                  loadingOlder={loadingOlder}
                />
              ) : (
                /* Empty state when no chat selected on desktop */
                <div className="text-center p-8 max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-[#2E7D5E]/15 text-[#2E7D5E] flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[#49352F] dark:text-[#F4F1E1] mb-1">
                    {cn.emptyTitle}
                  </h3>
                  <p className="text-xs text-[#49352F]/70 dark:text-[#F4F1E1]/70 leading-relaxed mb-4">
                    {cn.emptySubtitle}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#261E1A] border border-[#49352F]/10 text-[11px] font-semibold text-[#2E7D5E]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{cn.emptyBadge}</span>
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
        )}
      </div>
    </AppLayout>
  );
}

export default function ConnectChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#7A6862]">Loading Connect Hub...</div>}>
      <ConnectChatContent />
    </Suspense>
  );
}
