"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { SupportedLanguage, SupportedScript } from "../../packages/shared/src/types/notice";
import {
  type Language,
  formatSubjectName,
  formatStatusLabel,
  formatClassName,
} from "@/lib/i18n/translations";
import {
  getLanguageMeta,
  isValidLanguageCode,
  resolveEffectiveScript,
  type LanguageConfig,
  type ScriptVariant,
} from "@/lib/i18n/registry";
import {
  englishDictionary,
  loadLocaleDictionary,
  getCachedDictionary,
  createDeepTranslationProxy,
  resolveTranslationPath,
  type DictionaryShape,
} from "@/lib/i18n/loader";
import {
  formatNumber as fmtNumber,
  formatPercent as fmtPercent,
  formatCurrency as fmtCurrency,
  formatDate as fmtDate,
  formatTime as fmtTime,
  formatDateTime as fmtDateTime,
} from "@/lib/i18n/formatters";

interface LanguageContextType {
  language: Language;
  script: SupportedScript;
  scriptMeta: ScriptVariant;
  dir: "ltr" | "rtl";
  languageMeta: LanguageConfig;
  isLoadingLocale: boolean;
  setLanguage: (lang: Language, script?: SupportedScript) => void;
  setScript: (script: SupportedScript) => void;
  t: DictionaryShape;
  tr: (
    path: string,
    vars?: Record<string, string | number | boolean | null | undefined>,
    fallback?: string
  ) => string;
  formatNumber: (val: number, options?: Intl.NumberFormatOptions & { nativeDigits?: boolean }) => string;
  formatPercent: (val: number, fractionDigits?: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (input: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (input: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (input: Date | string | number) => string;
  formatSubject: (codeOrName: string) => string;
  formatStatus: (status: string) => string;
  formatPriority: (priority: string) => string;
  formatClass: (
    cls: Parameters<typeof formatClassName>[0],
    section?: Parameters<typeof formatClassName>[2]
  ) => string;
}

const defaultMeta = getLanguageMeta("en");
const defaultScriptMeta = resolveEffectiveScript("en", "Latn");

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  script: "Latn",
  scriptMeta: defaultScriptMeta,
  dir: "ltr",
  languageMeta: defaultMeta,
  isLoadingLocale: false,
  setLanguage: () => {},
  setScript: () => {},
  t: englishDictionary,
  tr: (p, _vars, fb) => fb || p,
  formatNumber: (v, o) => fmtNumber(v, "en", "Latn", o),
  formatPercent: (v, d) => fmtPercent(v, "en", "Latn", d),
  formatCurrency: (a, c) => fmtCurrency(a, "en", "Latn", c),
  formatDate: (d, o) => fmtDate(d, "en", "Latn", o),
  formatTime: (d, o) => fmtTime(d, "en", "Latn", o),
  formatDateTime: (d) => fmtDateTime(d, "en", "Latn"),
  formatSubject: (s) => s,
  formatStatus: (s) => s,
  formatPriority: (p) => p,
  formatClass: (c, sec) => formatClassName(c, "en", sec),
});

function ensureScriptFontLoaded(scriptVariant: ScriptVariant) {
  if (typeof document === "undefined") return;
  if (!scriptVariant.googleFontFamily || scriptVariant.script === "Gujr" || scriptVariant.script === "Latn") {
    return;
  }
  const existing = document.head.querySelector(`link[data-i18n-script="${scriptVariant.script}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${scriptVariant.googleFontFamily}&display=swap`;
  link.setAttribute("data-i18n-script", scriptVariant.script);
  document.head.appendChild(link);
}

function syncDocumentAttributes(lang: Language, scriptMeta: ScriptVariant) {
  if (typeof document === "undefined") return;
  const meta = getLanguageMeta(lang);
  document.documentElement.lang = meta.bcp47 || lang;
  document.documentElement.dir = scriptMeta.dir;
  document.documentElement.setAttribute("data-script", scriptMeta.script);
  document.documentElement.style.setProperty("--font-active", scriptMeta.fontStack);
  ensureScriptFontLoaded(scriptMeta);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [script, setScriptState] = useState<SupportedScript>("Latn");
  const [loadedDict, setLoadedDict] = useState<Record<string, unknown>>(englishDictionary);
  const [isLoadingLocale, setIsLoadingLocale] = useState<boolean>(false);
  const manualOverrideRef = useRef<boolean>(false);

  const activateLocale = useCallback(
    async (
      nextLang: Language,
      nextScript?: SupportedScript | null,
      options?: { persistLocal?: boolean; persistRemote?: boolean }
    ) => {
      const validLang: SupportedLanguage = isValidLanguageCode(nextLang) ? nextLang : "en";
      const effScript = resolveEffectiveScript(validLang, nextScript);

      setLanguageState(validLang);
      setScriptState(effScript.script);
      syncDocumentAttributes(validLang, effScript);

      if (options?.persistLocal !== false && typeof window !== "undefined") {
        try {
          localStorage.setItem("studysaathi_lang", validLang);
          localStorage.setItem("shikshasetu_lang", validLang);
          localStorage.setItem("studysaathi_script", effScript.script);
        } catch {
          // ignore storage failures in restricted sandboxes
        }
      }

      if (validLang === "en") {
        setLoadedDict(englishDictionary);
        setIsLoadingLocale(false);
      } else {
        const cached = getCachedDictionary(validLang);
        if (cached) {
          setLoadedDict(cached);
          setIsLoadingLocale(false);
        } else {
          setIsLoadingLocale(true);
          const dict = await loadLocaleDictionary(validLang);
          setLoadedDict(dict);
          setIsLoadingLocale(false);
        }
      }

      if (options?.persistRemote && typeof window !== "undefined") {
        fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferredLanguage: validLang,
            preferredScript: effScript.script,
          }),
        }).catch(() => {
          // Unauthenticated or offline sessions stay persisted via localStorage
        });
      }
    },
    []
  );

  // Hydrate initial preference from localStorage
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const savedLang =
          localStorage.getItem("studysaathi_lang") || localStorage.getItem("shikshasetu_lang");
        const savedScript = localStorage.getItem("studysaathi_script") as SupportedScript | null;
        if (savedLang && isValidLanguageCode(savedLang)) {
          void activateLocale(savedLang, savedScript, { persistLocal: false, persistRemote: false });
        } else {
          syncDocumentAttributes("en", defaultScriptMeta);
        }
      } catch {
        // localStorage may fail in restricted sandbox
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activateLocale]);

  // Hydrate authenticated user's persisted DB preference when signed in
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleAuthSync = (event: Event) => {
      const detail = (event as CustomEvent<{
        preferredLanguage?: string;
        preferredScript?: SupportedScript;
        forceSync?: boolean;
      }>)?.detail;
      if (!detail?.preferredLanguage || !isValidLanguageCode(detail.preferredLanguage)) return;
      if (manualOverrideRef.current && !detail.forceSync) return;

      void activateLocale(detail.preferredLanguage, detail.preferredScript, {
        persistLocal: true,
        persistRemote: false,
      });
    };

    window.addEventListener("studysaathi:user-preferences", handleAuthSync);
    return () => {
      window.removeEventListener("studysaathi:user-preferences", handleAuthSync);
    };
  }, [activateLocale]);

  const setLanguage = useCallback(
    (lang: Language, requestedScript?: SupportedScript) => {
      manualOverrideRef.current = true;
      void activateLocale(lang, requestedScript, {
        persistLocal: true,
        persistRemote: true,
      });
    },
    [activateLocale]
  );

  const setScript = useCallback(
    (nextScript: SupportedScript) => {
      manualOverrideRef.current = true;
      void activateLocale(language, nextScript, {
        persistLocal: true,
        persistRemote: true,
      });
    },
    [activateLocale, language]
  );

  const languageMeta = useMemo(() => getLanguageMeta(language), [language]);
  const scriptMeta = useMemo(() => resolveEffectiveScript(language, script), [language, script]);
  const dir = scriptMeta.dir;

  const t = useMemo(() => {
    if (language === "en") return englishDictionary;
    return createDeepTranslationProxy(loadedDict, englishDictionary, language);
  }, [language, loadedDict]);

  const tr = useCallback(
    (
      pathStr: string,
      vars?: Record<string, string | number | boolean | null | undefined>,
      fallback?: string
    ) => resolveTranslationPath(loadedDict, language, pathStr, vars, fallback),
    [loadedDict, language]
  );

  const formatNumber = useCallback(
    (val: number, options?: Intl.NumberFormatOptions & { nativeDigits?: boolean }) =>
      fmtNumber(val, language, script, options),
    [language, script]
  );

  const formatPercent = useCallback(
    (val: number, fractionDigits = 0) => fmtPercent(val, language, script, fractionDigits),
    [language, script]
  );

  const formatCurrency = useCallback(
    (amount: number, currency = "INR") => fmtCurrency(amount, language, script, currency),
    [language, script]
  );

  const formatDate = useCallback(
    (input: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      fmtDate(input, language, script, options),
    [language, script]
  );

  const formatTime = useCallback(
    (input: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      fmtTime(input, language, script, options),
    [language, script]
  );

  const formatDateTime = useCallback(
    (input: Date | string | number) => fmtDateTime(input, language, script),
    [language, script]
  );

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
    (
      cls: Parameters<typeof formatClassName>[0],
      section?: Parameters<typeof formatClassName>[2]
    ) => formatClassName(cls, language, section),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        script,
        scriptMeta,
        dir,
        languageMeta,
        isLoadingLocale,
        setLanguage,
        setScript,
        t,
        tr,
        formatNumber,
        formatPercent,
        formatCurrency,
        formatDate,
        formatTime,
        formatDateTime,
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
