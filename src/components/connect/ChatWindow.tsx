"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileText,
  Check,
  CheckCheck,
  Reply,
  Globe,
  Flag,
  Users,
  Pin,
  Download,
  ArrowLeft,
  Loader2,
  Clock,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Conversation, ChatMessage, ChatMessageAttachment } from "@/lib/types";

interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessage[];
  currentUserId: string;
  currentUserRole: string;
  onSendMessage: (payload: {
    text: string;
    attachments?: ChatMessageAttachment[];
    replyTo?: { id: string; senderName: string; text: string };
  }) => Promise<void>;
  onOpenGroupInfo: () => void;
  onBackMobile: () => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  onRetryMessage?: (msg: ChatMessage) => void;
  hasMore?: boolean;
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
}

// Memoized single message bubble for performance
interface MessageBubbleProps {
  msg: ChatMessage;
  isOutgoing: boolean;
  conversationType: string;
  currentUserId: string;
  hasTranslation: boolean;
  translatedText?: string;
  isTranslating: boolean;
  onReply: (msg: ChatMessage) => void;
  onTranslate: (msg: ChatMessage) => void;
  onReport?: (msgId: string, reason: string) => void;
  onRetry?: (msg: ChatMessage) => void;
}

const MessageBubble = React.memo(function MessageBubble({
  msg,
  isOutgoing,
  conversationType,
  hasTranslation,
  translatedText,
  isTranslating,
  onReply,
  onTranslate,
  onReport,
  onRetry,
}: MessageBubbleProps) {
  const { t, formatTime: fmtTime } = useLanguage();
  const cn = t.connect;
  const formatMsgTime = (isoString: string) => {
    try {
      return fmtTime(isoString, { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"} group`}>
      {/* Bubble Container */}
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs relative transition ${
          isOutgoing
            ? "bg-[#D9FDD3] dark:bg-[#203623] text-[#111B21] dark:text-[#E9EDEF] rounded-tr-xs"
            : "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] rounded-tl-xs border border-[#49352F]/10 dark:border-white/5"
        }`}
      >
        {/* Sender Name in Group Chat */}
        {!isOutgoing && conversationType !== "direct" && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-bold text-[11px] text-[#1F513F] dark:text-[#25D366]">
              {msg.senderName}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 uppercase tracking-wider font-semibold">
              {msg.senderRole}
            </span>
          </div>
        )}

        {/* Quoted Reply Preview */}
        {msg.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-white/10 border-l-4 border-[#2E7D5E] text-[11px]">
            <div className="font-bold text-[#2E7D5E]">{msg.replyTo.senderName}</div>
            <div className="text-gray-600 dark:text-gray-300 truncate">{msg.replyTo.text}</div>
          </div>
        )}

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {msg.attachments.map((att) => {
              const isImage = att.mimeType.startsWith("image/");
              return (
                <div key={att.id} className="rounded-lg overflow-hidden border border-black/10">
                  {isImage ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-56 w-full object-cover cursor-pointer hover:opacity-95"
                      onClick={() => window.open(att.url, "_blank")}
                    />
                  ) : (
                    <a
                      href={att.url}
                      download={att.name}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 transition"
                    >
                      <FileText className="w-5 h-5 text-[#2E7D5E] flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-semibold truncate">{att.name}</div>
                        <div className="text-[10px] text-gray-500">
                          {(att.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-gray-500" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Message Body */}
        {msg.text && (
          <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
            {msg.text}
          </p>
        )}

        {/* Translated Text if toggled */}
        {hasTranslation && translatedText && (
          <div className="mt-2 pt-2 border-t border-[#2E7D5E]/20 text-xs text-[#1F513F] dark:text-[#86EFAC] bg-[#2E7D5E]/5 p-2 rounded-lg">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{cn.translationLabel}</span>
            </div>
            <p className="whitespace-pre-wrap">{translatedText}</p>
          </div>
        )}

        {/* Timestamp & Read Receipt */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781] dark:text-[#8696A0]">
          <span>{formatMsgTime(msg.createdAt)}</span>
          {isOutgoing && (
            <span title={msg.status}>
              {msg.status === "sending" ? (
                <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
              ) : msg.status === "failed" ? (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  <button
                    onClick={() => onRetry?.(msg)}
                    className="hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>{cn.retryBtn}</span>
                  </button>
                </div>
              ) : msg.status === "read" ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
              ) : msg.status === "delivered" ? (
                <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <Check className="w-3.5 h-3.5 text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Floating Quick Action Buttons on hover */}
      <div className="flex items-center gap-1.5 mt-0.5 opacity-0 group-hover:opacity-100 transition px-1">
        <button
          onClick={() => onReply(msg)}
          title={cn.replyTooltip}
          className="p-1 rounded text-gray-500 hover:text-[#2E7D5E] hover:bg-black/5"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {msg.text && (
          <button
            onClick={() => onTranslate(msg)}
            disabled={isTranslating}
            title={hasTranslation ? cn.showOriginalTooltip : cn.translateTooltip}
            className="p-1 rounded text-gray-500 hover:text-[#2E7D5E] hover:bg-black/5"
          >
            {isTranslating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {!isOutgoing && onReport && (
          <button
            onClick={() => {
              const reason = prompt(cn.reportPrompt);
              if (reason) onReport(msg.id, reason);
            }}
            title={cn.reportTooltip}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-black/5"
          >
            <Flag className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onOpenGroupInfo,
  onBackMobile,
  onReportMessage,
  onRetryMessage,
  hasMore = false,
  onLoadOlder,
  loadingOlder = false,
}: ChatWindowProps) {
  const { t, tr, language } = useLanguage();
  const cn = t.connect;
  const showGuTitle = language === "gu";
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<ChatMessageAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);

  // Scroll detection to avoid jumping when user reads older messages
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
    }
  }, []);

  // Jump to bottom when switching conversation
  useEffect(() => {
    scrollToBottom(true);
  }, [conversation.id, scrollToBottom]);

  // Track message count changes to auto-scroll if user is at bottom or just sent
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      const isMine = lastMsg?.senderId === currentUserId;
      scrollToBottom(isMine);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, currentUserId, scrollToBottom]);

  // Handle Send: Optimistic & Non-blocking
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && attachments.length === 0) return;

    const currentAttachments = attachments;
    const currentReply = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: replyingTo.text.substring(0, 80),
        }
      : undefined;

    // Immediately clear input fields so user can type the next message without lag
    setInputText("");
    setAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    // Dispatch send in background
    onSendMessage({
      text: textToSend,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      replyTo: currentReply,
    }).catch((err) => {
      console.error("Failed to send message:", err);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle Attachment Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError(cn.fileTooLarge);
      setTimeout(() => setAttachmentError(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setAttachments((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}`,
          name: file.name,
          url,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle In-line Translation
  const handleTranslateMessage = useCallback(async (msg: ChatMessage) => {
    if (translatedMessages[msg.id]) {
      setTranslatedMessages((prev) => {
        const copy = { ...prev };
        delete copy[msg.id];
        return copy;
      });
      return;
    }

    setTranslatingId(msg.id);
    try {
      const targetLang = language;
      const res = await fetch("/api/connect/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.text, targetLanguage: targetLang }),
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        setTranslatedMessages((prev) => ({
          ...prev,
          [msg.id]: data.translatedText,
        }));
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setTranslatingId(null);
    }
  }, [language, translatedMessages]);

  const quickPhrases = [
    cn.quickPhrase1,
    cn.quickPhrase2,
    cn.quickPhrase3,
    cn.quickPhrase4,
    cn.quickPhrase5,
  ];

  const isParentRepliesDisabled =
    conversation.type === "announcement" &&
    !conversation.allowParentReplies &&
    currentUserRole === "parent";

  return (
    <div className="flex flex-col h-full bg-[#EFEAE2] dark:bg-[#181311] relative">
      {/* Top Header */}
      <div className="p-3 bg-[#F4F1E1] dark:bg-[#261E1A] border-b border-[#49352F]/15 dark:border-[#F4F1E1]/10 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={onBackMobile}
            className="md:hidden p-1.5 rounded-lg text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#49352F]/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={onOpenGroupInfo}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-[#2E7D5E] text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
              {conversation.type === "announcement" ? (
                <Pin className="w-5 h-5" />
              ) : conversation.type === "class_group" ? (
                <Users className="w-5 h-5" />
              ) : (
                conversation.title.charAt(0)
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-[#49352F] dark:text-[#F4F1E1] truncate">
                {showGuTitle && conversation.titleGujarati
                  ? conversation.titleGujarati
                  : conversation.title}
              </h3>
              <p className="text-[11px] text-[#49352F]/60 dark:text-[#F4F1E1]/60 truncate">
                {conversation.type === "direct"
                  ? cn.onlineDirect
                  : conversation.type === "announcement"
                  ? cn.officialBroadcast
                  : tr("connect.participantsCount", { count: conversation.participantIds?.length || 4 })}
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenGroupInfo}
            title={cn.viewInfoTooltip}
            className="p-2 rounded-xl text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10 dark:hover:bg-white/10 transition"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Notice Banner */}
      {conversation.isPinned && (
        <div className="bg-[#FFF8E7] dark:bg-[#332A1E] border-b border-[#D97706]/20 px-4 py-2 flex items-center gap-2 text-xs text-[#92400E] dark:text-[#FDE68A]">
          <Pin className="w-3.5 h-3.5 flex-shrink-0 text-[#D97706]" />
          <span className="font-semibold">
            {cn.pinnedChannelNotice}
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[radial-gradient(#49352F_0.75px,transparent_0.75px)] dark:bg-[radial-gradient(#F4F1E1_0.75px,transparent_0.75px)] [background-size:16px_16px] [background-color:#EFEAE2] dark:[background-color:#161210]"
      >
        {/* Load Older Messages Trigger */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadOlder}
              disabled={loadingOlder}
              className="px-3 py-1 bg-white/80 dark:bg-[#201A17]/80 hover:bg-white dark:hover:bg-[#261E1A] text-[11px] font-semibold text-[#49352F] dark:text-[#F4F1E1] rounded-full border border-[#49352F]/15 shadow-2xs transition flex items-center gap-1.5"
            >
              {loadingOlder ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#2E7D5E]" />
                  <span>{cn.loadingOlder}</span>
                </>
              ) : (
                <span>{cn.loadOlderBtn}</span>
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#49352F]/60 dark:text-[#F4F1E1]/60">
            <div className="w-12 h-12 rounded-full bg-[#F4F1E1] dark:bg-[#261E1A] flex items-center justify-center mb-3 text-[#2E7D5E]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm mb-1">
              {cn.noMessagesTitle}
            </h4>
            <p className="text-xs max-w-xs">
              {cn.noMessagesSubtitle}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOutgoing={msg.senderId === currentUserId}
              conversationType={conversation.type}
              currentUserId={currentUserId}
              hasTranslation={Boolean(translatedMessages[msg.id])}
              translatedText={translatedMessages[msg.id]}
              isTranslating={translatingId === msg.id}
              onReply={setReplyingTo}
              onTranslate={handleTranslateMessage}
              onReport={onReportMessage}
              onRetry={onRetryMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className="p-2.5 bg-[#FAF8F2] dark:bg-[#201A17] border-t border-[#49352F]/15 flex items-center justify-between text-xs z-10 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-4 h-4 text-[#2E7D5E] flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-[#2E7D5E]">{replyingTo.senderName}: </span>
              <span className="text-gray-600 dark:text-gray-300 truncate">
                {replyingTo.text.substring(0, 70)}...
              </span>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full text-gray-400 hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Previews Banner */}
      {attachments.length > 0 && (
        <div className="p-2 bg-[#FAF8F2] dark:bg-[#201A17] border-t border-[#49352F]/15 flex items-center gap-2 overflow-x-auto z-10">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#261E1A] border border-[#2E7D5E]/30 text-xs shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#2E7D5E]" />
              <span className="truncate max-w-[120px]">{att.name}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Phrase Bar (Collapsible) */}
      {showEmojiPicker && (
        <div className="p-2 bg-[#FAF8F2] dark:bg-[#201A17] border-t border-[#49352F]/15 flex items-center gap-2 overflow-x-auto text-xs z-10">
          {quickPhrases.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText((prev) => (prev ? `${prev} ${phrase}` : phrase))}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#261E1A] border border-[#49352F]/15 text-[#49352F] dark:text-[#F4F1E1] hover:bg-[#F2CAB3]/40 whitespace-nowrap transition font-medium"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Error Notice */}
      {attachmentError && (
        <div className="p-2.5 px-4 bg-rose-500/10 border-t border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{attachmentError}</span>
          <button
            type="button"
            onClick={() => setAttachmentError(null)}
            className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Bottom Message Input Area */}
      {isParentRepliesDisabled ? (
        <div className="p-4 bg-[#F4F1E1] dark:bg-[#261E1A] border-t border-[#49352F]/15 text-center text-xs font-semibold text-[#49352F]/70 dark:text-[#F4F1E1]/70">
          {cn.repliesDisabled}
        </div>
      ) : (
        <div className="p-2.5 sm:p-3 bg-[#F4F1E1] dark:bg-[#261E1A] border-t border-[#49352F]/15 dark:border-[#F4F1E1]/10 flex items-center gap-2 z-10">
          {/* Quick Phrases Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title={cn.quickRepliesTooltip}
            className="p-2 rounded-xl text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10 dark:hover:bg-white/10 transition"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={cn.attachTooltip}
            className="p-2 rounded-xl text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10 dark:hover:bg-white/10 transition"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Textarea Input */}
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={cn.messagePlaceholder}
            className="flex-1 py-2 px-3.5 text-xs sm:text-sm rounded-xl border border-[#49352F]/15 dark:border-[#F4F1E1]/15 bg-white dark:bg-[#1B1614] text-[#49352F] dark:text-[#F4F1E1] resize-none focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]/30 max-h-24 overflow-y-auto"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() && attachments.length === 0}
            className="w-10 h-10 rounded-xl bg-[#2E7D5E] hover:bg-[#24634B] text-white flex items-center justify-center shadow-xs transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
