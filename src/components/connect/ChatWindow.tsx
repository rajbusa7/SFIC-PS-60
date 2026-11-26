"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileText,
  Check,
  CheckCheck,
  MoreVertical,
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
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onOpenGroupInfo,
  onBackMobile,
  onReportMessage,
}: ChatWindowProps) {
  const { language } = useLanguage();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<ChatMessageAttachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Send
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      await onSendMessage({
        text: inputText.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              senderName: replyingTo.senderName,
              text: replyingTo.text.substring(0, 80),
            }
          : undefined,
      });

      setInputText("");
      setAttachments([]);
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
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
      alert(language === "gu" ? "ફાઇલ ૧૦MB કરતા નાની હોવી જોઈએ." : "File must be under 10MB.");
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
  const handleTranslateMessage = async (msg: ChatMessage) => {
    if (translatedMessages[msg.id]) {
      // Toggle off
      const copy = { ...translatedMessages };
      delete copy[msg.id];
      setTranslatedMessages(copy);
      return;
    }

    setTranslatingId(msg.id);
    try {
      const targetLang = language === "gu" ? "gu" : "en";
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
  };

  const quickEmojis = ["🙏", "👍", "❤️", "👏", "🎉", "📚", "✅", "👌", "😊", "💐"];

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
                {language === "gu" && conversation.titleGujarati
                  ? conversation.titleGujarati
                  : conversation.title}
              </h3>
              <p className="text-[11px] text-[#49352F]/60 dark:text-[#F4F1E1]/60 truncate">
                {conversation.type === "direct"
                  ? language === "gu" ? "ઓનલાઇન • ખાનગી સલાહ" : "Online • Direct Consultation"
                  : conversation.type === "announcement"
                  ? language === "gu" ? "સત્તાવાર સૂચના પ્રસારણ" : "Official Broadcast"
                  : `${conversation.participantIds?.length || 4} ${
                      language === "gu" ? "સભ્યો" : "participants"
                    }`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenGroupInfo}
            title={language === "gu" ? "માહિતી જુઓ" : "View Info"}
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
            {language === "gu"
              ? "આ એક પિન કરેલી સત્તાવાર સૂચના ચેનલ છે."
              : "Pinned Official Notice Channel."}
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[radial-gradient(#49352F_0.75px,transparent_0.75px)] dark:bg-[radial-gradient(#F4F1E1_0.75px,transparent_0.75px)] [background-size:16px_16px] [background-color:#EFEAE2] dark:[background-color:#161210]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#49352F]/60 dark:text-[#F4F1E1]/60">
            <div className="w-12 h-12 rounded-full bg-[#F4F1E1] dark:bg-[#261E1A] flex items-center justify-center mb-3 text-[#2E7D5E]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm mb-1">
              {language === "gu" ? "હજુ સુધી કોઈ સંદેશા નથી" : "No messages yet"}
            </h4>
            <p className="text-xs max-w-xs">
              {language === "gu"
                ? "શિક્ષક અથવા વાલી સાથે સુરક્ષિત વાતચીત શરૂ કરવા માટે નીચે સંદેશ લખો."
                : "Type a message below to start a secure conversation between teacher and parent."}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutgoing = msg.senderId === currentUserId;
            const hasTranslation = Boolean(translatedMessages[msg.id]);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"} group`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs relative transition ${
                    isOutgoing
                      ? "bg-[#D9FDD3] dark:bg-[#203623] text-[#111B21] dark:text-[#E9EDEF] rounded-tr-xs"
                      : "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] rounded-tl-xs border border-[#49352F]/10 dark:border-white/5"
                  }`}
                >
                  {/* Sender Name in Group Chat */}
                  {!isOutgoing && conversation.type !== "direct" && (
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
                      <div className="text-gray-600 dark:text-gray-300 truncate">
                        {msg.replyTo.text}
                      </div>
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
                  <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>

                  {/* Translated Text if toggled */}
                  {hasTranslation && (
                    <div className="mt-2 pt-2 border-t border-[#2E7D5E]/20 text-xs text-[#1F513F] dark:text-[#86EFAC] bg-[#2E7D5E]/5 p-2 rounded-lg">
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{language === "gu" ? "ગુજરાતી અનુવાદ:" : "Translation:"}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{translatedMessages[msg.id]}</p>
                    </div>
                  )}

                  {/* Timestamp & Read Receipt */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781] dark:text-[#8696A0]">
                    <span>{formatTime(msg.createdAt)}</span>
                    {isOutgoing && (
                      <span title={msg.status}>
                        {msg.status === "read" ? (
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
                    onClick={() => setReplyingTo(msg)}
                    title={language === "gu" ? "જવાબ આપો" : "Reply"}
                    className="p-1 rounded text-gray-500 hover:text-[#2E7D5E] hover:bg-black/5"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleTranslateMessage(msg)}
                    disabled={translatingId === msg.id}
                    title={
                      hasTranslation
                        ? language === "gu" ? "મૂળ જુઓ" : "Show Original"
                        : language === "gu" ? "ગુજરાતીમાં અનુવાદ" : "Translate"
                    }
                    className="p-1 rounded text-gray-500 hover:text-[#2E7D5E] hover:bg-black/5"
                  >
                    {translatingId === msg.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {!isOutgoing && onReportMessage && (
                    <button
                      onClick={() => {
                        const reason = prompt(
                          language === "gu"
                            ? "સંદેશ રિપોર્ટ કરવાનું કારણ દાખલ કરો:"
                            : "Reason for reporting message:"
                        );
                        if (reason) onReportMessage(msg.id, reason);
                      }}
                      title={language === "gu" ? "રિપોર્ટ કરો" : "Report"}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-black/5"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
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

      {/* Quick Emoji Bar (Collapsible) */}
      {showEmojiPicker && (
        <div className="p-2 bg-[#FAF8F2] dark:bg-[#201A17] border-t border-[#49352F]/15 flex items-center gap-2 overflow-x-auto text-lg z-10">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setInputText((prev) => prev + emoji)}
              className="p-1.5 hover:bg-black/5 rounded-lg active:scale-125 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Message Input Area */}
      {isParentRepliesDisabled ? (
        <div className="p-4 bg-[#F4F1E1] dark:bg-[#261E1A] border-t border-[#49352F]/15 text-center text-xs font-semibold text-[#49352F]/70 dark:text-[#F4F1E1]/70">
          {language === "gu"
            ? "આ સત્તાવાર શાળા સૂચના ચેનલમાં વાલીઓનો પ્રત્યુત્તર નિષ્ક્રિય કરેલ છે."
            : "Replies from parents are disabled in this official school announcement channel."}
        </div>
      ) : (
        <div className="p-2.5 sm:p-3 bg-[#F4F1E1] dark:bg-[#261E1A] border-t border-[#49352F]/15 dark:border-[#F4F1E1]/10 flex items-center gap-2 z-10">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emojis"
            className="p-2 rounded-xl text-[#49352F]/70 dark:text-[#F4F1E1]/70 hover:bg-[#49352F]/10 dark:hover:bg-white/10 transition"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach File or Worksheet"
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
            placeholder={
              language === "gu"
                ? "સંદેશ લખો... (Shift+Enter નવી લાઇન માટે)"
                : "Type a message... (Shift+Enter for newline)"
            }
            className="flex-1 py-2 px-3.5 text-xs sm:text-sm rounded-xl border border-[#49352F]/15 dark:border-[#F4F1E1]/15 bg-white dark:bg-[#1B1614] text-[#49352F] dark:text-[#F4F1E1] resize-none focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]/30 max-h-24 overflow-y-auto"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={sending || (!inputText.trim() && attachments.length === 0)}
            className="w-10 h-10 rounded-xl bg-[#2E7D5E] hover:bg-[#24634B] text-white flex items-center justify-center shadow-xs transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
