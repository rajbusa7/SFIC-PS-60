import type { SupportedLanguage } from "../../../packages/shared/src/types/notice";
import { I18N_NAMESPACES, isValidLanguageCode } from "./registry";
import { interpolateTemplate, selectPluralForm, type PluralForms } from "./formatters";

// Synchronous English canonical namespaces guarantee zero-flicker non-empty fallback
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enStudents from "./locales/en/students.json";
import enAssessments from "./locales/en/assessments.json";
import enLearningGaps from "./locales/en/learning-gaps.json";
import enRemedialPlans from "./locales/en/remedial-plans.json";
import enActivities from "./locales/en/activities.json";
import enProgress from "./locales/en/progress.json";
import enReports from "./locales/en/reports.json";
import enParentBridge from "./locales/en/parent-bridge.json";
import enSettings from "./locales/en/settings.json";
import enTutorial from "./locales/en/tutorial.json";

export type TranslationRecord = Record<string, unknown>;

function mergeNamespaceObjects(chunks: TranslationRecord[]): TranslationRecord {
  const merged: TranslationRecord = {};
  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== "object") continue;
    for (const [k, v] of Object.entries(chunk)) {
      if (k === "_meta") continue;
      merged[k] = v;
    }
  }
  return merged;
}

export const englishDictionary = mergeNamespaceObjects([
  enCommon,
  enDashboard,
  enStudents,
  enAssessments,
  enLearningGaps,
  enRemedialPlans,
  enActivities,
  enProgress,
  enReports,
  enParentBridge,
  enSettings,
  enTutorial,
]) as typeof enCommon &
  typeof enDashboard &
  typeof enStudents &
  typeof enAssessments &
  typeof enLearningGaps &
  typeof enRemedialPlans &
  typeof enActivities &
  typeof enProgress &
  typeof enReports &
  typeof enParentBridge &
  typeof enSettings &
  typeof enTutorial;

export type DictionaryShape = typeof englishDictionary;

const localeCache = new Map<SupportedLanguage, TranslationRecord>();
localeCache.set("en", englishDictionary);

const inFlightLoads = new Map<SupportedLanguage, Promise<TranslationRecord>>();
const missingKeyLog = new Map<string, { lang: SupportedLanguage; key: string; count: number; lastSeenAt: string }>();

export function reportMissingTranslationKey(lang: SupportedLanguage, keyPath: string): void {
  if (lang === "en") return;
  const cacheId = `${lang}:${keyPath}`;
  const existing = missingKeyLog.get(cacheId);
  missingKeyLog.set(cacheId, {
    lang,
    key: keyPath,
    count: (existing?.count || 0) + 1,
    lastSeenAt: new Date().toISOString(),
  });
}

export function getMissingKeyLog(): Array<{ lang: SupportedLanguage; key: string; count: number; lastSeenAt: string }> {
  return Array.from(missingKeyLog.values());
}

export function clearMissingKeyLog(): void {
  missingKeyLog.clear();
}

export function getCachedDictionary(lang: SupportedLanguage): TranslationRecord | null {
  return localeCache.get(lang) || null;
}

async function tryImportNamespace(lang: string, ns: string): Promise<TranslationRecord | null> {
  try {
    const mod = await import(`./locales/${lang}/${ns}.json`);
    return (mod?.default || mod || null) as TranslationRecord | null;
  } catch {
    return null;
  }
}

/**
 * Dynamically loads all modular namespace JSON files for a language with caching and fallback safety.
 * Never triggers a full page reload and never returns empty strings for missing keys.
 */
export async function loadLocaleDictionary(lang: SupportedLanguage): Promise<TranslationRecord> {
  if (!isValidLanguageCode(lang) || lang === "en") {
    return englishDictionary;
  }

  const cached = localeCache.get(lang);
  if (cached) return cached;

  const existingLoad = inFlightLoads.get(lang);
  if (existingLoad) return existingLoad;

  const loadPromise = (async () => {
    const chunks = await Promise.all(
      I18N_NAMESPACES.map((ns) => tryImportNamespace(lang, ns))
    );
    const nonNull = chunks.filter((c): c is TranslationRecord => c !== null);
    const merged = nonNull.length > 0 ? mergeNamespaceObjects(nonNull) : {};
    localeCache.set(lang, merged);
    inFlightLoads.delete(lang);
    return merged;
  })();

  inFlightLoads.set(lang, loadPromise);
  return loadPromise;
}

/**
 * Deep recursive proxy guaranteeing:
 * 1. Missing or empty-string ("") keys fall back cleanly to canonical English.
 * 2. Missing-key detection captures missing paths dynamically during UI rendering.
 */
export function createDeepTranslationProxy<T extends TranslationRecord>(
  target: TranslationRecord,
  fallback: T,
  lang: SupportedLanguage,
  prefix = ""
): T {
  if (lang === "en") return fallback;

  return new Proxy(target || {}, {
    get(obj: TranslationRecord, prop: string | symbol) {
      if (typeof prop === "symbol") {
        return Reflect.get(obj, prop) ?? Reflect.get(fallback, prop);
      }

      const keyPath = prefix ? `${prefix}.${prop}` : prop;
      const targetVal = obj ? obj[prop] : undefined;
      const fallbackVal = fallback ? fallback[prop] : undefined;

      if (typeof targetVal === "string") {
        if (targetVal.trim().length > 0) {
          return targetVal;
        }
        // Empty strings never mask English fallback
        reportMissingTranslationKey(lang, keyPath);
        return fallbackVal ?? "";
      }

      if (targetVal !== undefined && targetVal !== null && typeof targetVal === "object" && !Array.isArray(targetVal)) {
        const fbObj: TranslationRecord =
          fallbackVal && typeof fallbackVal === "object" && !Array.isArray(fallbackVal)
            ? (fallbackVal as TranslationRecord)
            : {};
        return createDeepTranslationProxy(targetVal as TranslationRecord, fbObj, lang, keyPath);
      }

      if (targetVal !== undefined && targetVal !== null) {
        return targetVal;
      }

      if (fallbackVal !== undefined) {
        if (typeof fallbackVal === "object" && fallbackVal !== null && !Array.isArray(fallbackVal)) {
          reportMissingTranslationKey(lang, keyPath);
          return createDeepTranslationProxy({}, fallbackVal as TranslationRecord, lang, keyPath);
        }
        reportMissingTranslationKey(lang, keyPath);
        return fallbackVal;
      }

      return undefined;
    },
  }) as T;
}

function getByDottedPath(obj: TranslationRecord | undefined, pathStr: string): unknown {
  if (!obj || !pathStr) return undefined;
  const parts = pathStr.split(".");
  let curr: unknown = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined || typeof curr !== "object") return undefined;
    curr = (curr as TranslationRecord)[part];
  }
  return curr;
}

export function resolveTranslationPath(
  activeDict: TranslationRecord,
  lang: SupportedLanguage,
  keyPath: string,
  vars?: Record<string, string | number | boolean | null | undefined>,
  fallbackOverride?: string
): string {
  const activeVal = getByDottedPath(activeDict, keyPath);
  const enVal = getByDottedPath(englishDictionary, keyPath);

  let resolved: unknown = undefined;
  if (typeof activeVal === "string" && activeVal.trim().length > 0) {
    resolved = activeVal;
  } else if (activeVal && typeof activeVal === "object" && "other" in activeVal) {
    resolved = activeVal;
  } else {
    if (lang !== "en") {
      reportMissingTranslationKey(lang, keyPath);
    }
    resolved = enVal ?? fallbackOverride ?? keyPath;
  }

  if (resolved && typeof resolved === "object" && "other" in resolved) {
    const countVal = typeof vars?.count === "number" ? vars.count : Number(vars?.count ?? 0);
    return selectPluralForm(
      Number.isFinite(countVal) ? countVal : 0,
      resolved as PluralForms,
      lang,
      undefined,
      vars as Record<string, string | number | boolean>
    );
  }

  return interpolateTemplate(String(resolved), vars);
}
