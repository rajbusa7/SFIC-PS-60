"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  HelpCircle,
  FileText,
  Volume2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { AudioRecorder } from "../audio/AudioRecorder";
import { AudioPlayer } from "../audio/AudioPlayer";
import type { SupportedLanguage } from "@/lib/types";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  citedNotices?: Array<{
    id: string;
    title: string;
    category?: string;
    date?: string;
  }>;
  confidence?: "high" | "medium" | "low";
  provider?: string;
  modelUsed?: string;
}

interface NoticeAssistantChatProps {
  parentId?: string;
  studentId?: string;
  studentName?: string;
  studentGrade?: number;
  className?: string;
  onNoticeSelect?: (noticeId: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "When is the next Parent-Teacher Meeting (PTM)?",
  "What is the homework deadline for Grade 5 Science?",
  "What are the requirements for Annual Sports Day?",
  "What documents are required for mid-term exams?",
  "When will the school reopen after Diwali break?",
];

export function NoticeAssistantChat({
  parentId = "par-001",
  studentId = "std-01",
  studentName = "Aarav Patel",
  studentGrade = 5,
  className = "",
  onNoticeSelect,
}: NoticeAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: `Namaste! I am the StudySaathi AI School Notice Assistant. I can answer questions about school announcements, exam dates, schedules, and fee reminders for ${studentName} (Grade ${studentGrade}). Every answer is strictly grounded in official school records.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/notice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          parentId,
          studentId,
          userRole: "parent",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to retrieve answer.");
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citedNotices: data.citedNotices,
        confidence: data.confidence,
        provider: data.provider,
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Assistant query error:", err);
      setError(err.message || "Could not answer question at this time.");
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "I could not find an official school notice regarding this topic. Please contact the class teacher directly.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        confidence: "low",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (transcribedText: string) => {
    setInput(transcribedText);
    handleSend(transcribedText);
  };

  return (
    <div className={`bg-white border border-[#49352F]/15 rounded-2xl p-5 shadow-sm flex flex-col h-[600px] ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#49352F]/10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2E7D5E]" />
            <h3 className="text-base font-bold text-[#49352F]">
              AI School Notice Assistant
            </h3>
          </div>
          <p className="text-xs text-[#49352F]/70">
            Factual Q&amp;A answering parent queries strictly from official notices (Data isolated for {studentName}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#49352F]/70">Voice/Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
            className="px-2 py-1 text-xs rounded-lg bg-[#FAF6E9] border border-[#49352F]/15 text-[#49352F] font-semibold"
          >
            <option value="en">English</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#49352F]/5">
        <span className="text-[11px] font-bold text-[#49352F]/60 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-[#2E7D5E]" />
          Suggested:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="shrink-0 text-[11px] font-medium bg-[#FAF6E9] hover:bg-[#F2CAB3]/40 text-[#49352F] px-2.5 py-1 rounded-full border border-[#49352F]/10 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                m.sender === "user"
                  ? "bg-[#49352F] text-white rounded-br-none"
                  : "bg-[#FAF6E9] text-[#49352F] border border-[#49352F]/15 rounded-bl-none"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="font-bold text-[11px] opacity-80">
                  {m.sender === "user" ? "You" : "StudySaathi AI Assistant"}
                </span>
                <span className="text-[10px] opacity-60">{m.timestamp}</span>
              </div>

              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Cited Notices Reference */}
              {m.citedNotices && m.citedNotices.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#49352F]/10">
                  <span className="text-[10px] font-bold text-[#49352F]/70 block mb-1 uppercase tracking-wider">
                    Official Notice Sources:
                  </span>
                  <div className="space-y-1.5">
                    {m.citedNotices.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onNoticeSelect && onNoticeSelect(n.id)}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/80 border border-[#49352F]/10 text-xs text-[#49352F] hover:bg-white cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0" />
                          <span className="font-semibold truncate max-w-[240px]">{n.title}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-[#49352F]/50" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Confidence & Speech Controls */}
              {m.sender === "ai" && m.id !== "msg-welcome" && (
                <div className="mt-3 pt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    {m.confidence && (
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        m.confidence === "high"
                          ? "bg-emerald-100 text-emerald-800"
                          : m.confidence === "medium"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {m.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    )}
                    {m.provider && (
                      <span className="text-[10px] text-[#49352F]/60">
                        {m.provider}
                      </span>
                    )}
                  </div>

                  <AudioPlayer
                    text={m.text}
                    language={selectedLanguage}
                    buttonLabel="Listen"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-[#FAF6E9] border border-[#49352F]/15 rounded-2xl rounded-bl-none p-4 max-w-[70%]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#49352F]">
                <Loader2 className="w-4 h-4 animate-spin text-[#2E7D5E]" />
                <span>Searching school notices &amp; generating factual answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box with AudioRecorder */}
      <div className="pt-3 border-t border-[#49352F]/10">
        <div className="flex items-center gap-2">
          <AudioRecorder
            language={selectedLanguage}
            onTranscript={handleVoiceInput}
            buttonLabel="Speak"
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about school notices, dates, exams, or homework..."
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#FAF6E9]/60 border border-[#49352F]/20 text-[#49352F] focus:outline-none focus:ring-2 focus:ring-[#F2CAB3]"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-[#49352F] text-white hover:bg-[#49352F]/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
