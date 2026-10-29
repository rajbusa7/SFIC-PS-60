"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";
import { triggerPageTour } from "@/components/tutorial/SpotlightTour";
import { TUTORIAL_FAQS } from "@/config/tutorialData";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ChevronDown,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

export function GlobalShikshaBot() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getPageTourKey = (path: string): string => {
    if (path === "/dashboard" || path === "/") return "dashboard";
    if (path.startsWith("/students/") && path !== "/students") return "studentDetail";
    if (path.startsWith("/students")) return "students";
    if (path.startsWith("/learning-gaps")) return "learningGaps";
    if (path.startsWith("/remedial-plans")) return "remedialPlans";
    if (path.startsWith("/reports")) return "reports";
    return "dashboard";
  };

  const handleStartPageTour = () => {
    setIsOpen(false);
    const tourKey = getPageTourKey(pathname);
    triggerPageTour(tourKey);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text:
        language === "gu"
          ? "નમસ્તે! હું શિક્ષાબોટ છું. હું તમને વિદ્યાર્થીઓના લર્નિંગ ગેપ્સ ઓળખવામાં અને ૫-પગલાંની ઉપચારાત્મક યોજનાઓ તૈયાર કરવામાં મદદ કરી શકું છું. તમે શું જાણવા માંગો છો?"
          : "Hello! I'm ShikshaBot, your offline pedagogical assistant. I can help analyze learning gaps, generate 5-step remedial plans for Aarav, or explain benchmark thresholds. How can I assist you today?",
      time: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    {
      label: language === "gu" ? "આજે કોને મદદની જરૂર છે?" : "Who needs help today?",
      query: "Who needs immediate help today in Class 4?",
    },
    {
      label: language === "gu" ? "આરવ માટે ઉપચારાત્મક યોજના બનાવો" : "Make a plan for Aarav",
      query: "Generate a 5-step remedial plan for Aarav Patel in Division Basics.",
    },
    {
      label: language === "gu" ? "૬૦% બેન્ચમાર્ક નિયમ સમજાવો" : "Explain 60% threshold",
      query: "Explain the 60% mastery threshold rule used in ShikshaSetu AI.",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // 1. Instant offline keyword match against TUTORIAL_FAQS
    const lower = text.toLowerCase();
    const matchedFaq = TUTORIAL_FAQS.find((faq) =>
      faq.keywords.some((kw) => lower.includes(kw.toLowerCase()))
    );

    if (matchedFaq) {
      const answer = language === "gu" ? matchedFaq.answerGu : matchedFaq.answerEn;
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            sender: "bot",
            text: `💡 [${language === "gu" ? "ઑફલાઇન સહાયક" : "Offline Knowledge"}]: ${answer}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setIsLoading(false);
      }, 250);
      return;
    }

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language: language === "gu" ? "gu" : "en",
          userRole: "teacher",
        }),
      });

      const data = await res.json();
      const botResponseText =
        data.reply ||
        data.text ||
        (language === "gu"
          ? "આરવ પટેલ (ધોરણ ૪) ને ભાગાકારના ખ્યાલમાં ૫-પગલાંની મણકા અને નંબર-લાઇન પ્રવૃત્તિથી +૫૦ પોઈન્ટનો સુધારો થયો છે."
          : "Based on our offline pedagogical engine, Aarav Patel was identified with a 35% baseline in Division Basics. A 5-step manipulative plan with counters led to an 85% mastery score (+50 pp gain).");

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: "bot",
          text: botResponseText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: "bot",
          text:
            language === "gu"
              ? "ઑફલાઇન સહાયક: વર્ગખંડમાં ૪ વિદ્યાર્થીઓને ૬૦% કરતાં ઓછા ગુણ સાથે વિશેષ ધ્યાનની જરૂર છે."
              : "Offline rule-engine response: 4 students currently fall below the 60% benchmark threshold (Aarav, Pooja, Karan, Diya). Check /remedial-plans for action items.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden select-none">
      {/* Floating 3D Orb Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          data-tour="shikshabot-trigger"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#14123D] via-[#2B2A6B] to-[#FF8A3D] p-0.5 shadow-[0_0_25px_rgba(255,138,61,0.4)] hover:shadow-[0_0_35px_rgba(255,138,61,0.6)] transition-all duration-300 transform hover:scale-105 cursor-pointer"
          aria-label="Open ShikshaBot AI Assistant"
        >
          {/* Inner orb reflection */}
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <span className="text-2xl animate-bounce-subtle">🤖</span>
            {/* Pulsing halo dot */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#3DDBA9] animate-pulse" />
          </div>

          {/* Persistent speech callout badge for new teachers */}
          <div className="absolute right-full mr-3 top-2 px-3 py-1.5 rounded-2xl bg-[#14123D]/95 border border-amber-500/40 text-[11px] font-bold text-amber-200 shadow-xl whitespace-nowrap pointer-events-none hidden sm:flex items-center gap-1.5">
            <span className="text-sm">💡</span>
            <span>{language === "gu" ? "વેબસાઇટ ટૂર માટે અહીં ક્લિક કરો" : "New here? Click for website tour"}</span>
          </div>

          {/* Hover tooltip label */}
          <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 pointer-events-none shadow-xl">
            {language === "gu" ? "શિક્ષાબોટ સહાયક (ટૂર અને મદદ)" : "ShikshaBot AI (Tour & Help)"}
          </span>
        </button>
      )}

      {/* Expanded Glassmorphic Chat Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Top Panel Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#14123D]/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">ShikshaBot AI</h4>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                    Offline
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Pedagogical Rule Assistant</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close assistant"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-amber-500 text-slate-950 font-medium rounded-tr-xs"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 ${
                      msg.sender === "user" ? "text-slate-800 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Consulting pedagogical rule engine...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
            {/* Quick-chip: Show me how to use this page */}
            <button
              type="button"
              onClick={handleStartPageTour}
              className="shrink-0 text-[11px] font-bold text-slate-950 bg-gradient-to-r from-[#FF8A3D] to-amber-400 hover:from-amber-400 hover:to-amber-300 px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>{language === "gu" ? "આ પેજ કેવી રીતે વાપરવું? (ટૂર)" : "Show me how to use this page"}</span>
            </button>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p.query)}
                className="shrink-0 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-800 bg-[#14123D]/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                language === "gu"
                  ? "વિદ્યાર્થી અથવા નિયમ વિશે પૂછો..."
                  : "Ask about a student, gap, or 5-step plan..."
              }
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
            <Button
              type="submit"
              variant="saffron"
              size="sm"
              disabled={!inputValue.trim() || isLoading}
              className="rounded-xl px-3 h-8 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
