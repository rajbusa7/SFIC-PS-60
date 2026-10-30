"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  translations,
  type Language,
  formatSubjectName,
  formatStatusLabel,
  formatClassName,
} from "@/lib/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  formatSubject: (codeOrName: string) => string;
  formatStatus: (status: string) => string;
  formatPriority: (priority: string) => string;
  formatClass: (cls: any, section?: any) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
  formatSubject: (s) => s,
  formatStatus: (s) => s,
  formatPriority: (p) => p,
  formatClass: (c, sec) => formatClassName(c, "en", sec),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("studysaathi_lang") || localStorage.getItem("shikshasetu_lang")) as Language;
      if (saved === "en" || saved === "gu") {
        setLanguageState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // localStorage may fail in restricted sandbox
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("studysaathi_lang", lang);
        localStorage.setItem("shikshasetu_lang", lang);
        document.documentElement.lang = lang;
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  // Merge with English fallback
  const t = useMemo(() => {
    const active = translations[language] || translations.en;
    if (language === "en") return translations.en;

    // Deep proxy/merge to guarantee English fallback if a key is missing
    return new Proxy(active, {
      get(target: any, prop: string) {
        if (prop in target) {
          const val = target[prop];
          if (typeof val === "object" && val !== null) {
            const fallbackVal = (translations.en as any)[prop] || {};
            return { ...fallbackVal, ...val };
          }
          return val;
        }
        return (translations.en as any)[prop];
      },
    }) as typeof translations.en;
  }, [language]);

  const formatSubject = useCallback(
    (codeOrName: string) => formatSubjectName(codeOrName, language),
    [language]
  );

  const formatStatus = useCallback(
    (status: string) => formatStatusLabel(status, language),
    [language]
  );

  const formatPriority = useCallback(
    (priority: string) => formatStatusLabel(priority, language),
    [language]
  );

  const formatClass = useCallback(
    (cls: any, section?: any) => formatClassName(cls, language, section),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatSubject,
        formatStatus,
        formatPriority,
        formatClass,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
