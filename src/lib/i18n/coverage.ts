import fs from "fs";
import path from "path";
import type { SupportedLanguage, TranslationQualityStatus } from "../../../packages/shared/src/types/notice";
import { ALL_LANGUAGES, I18N_NAMESPACES, type I18nNamespace } from "./registry";
import { getMissingKeyLog } from "./loader";

export interface ModuleCoverageStats {
  namespace: I18nNamespace;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  emptyKeys: string[];
  extraKeys: string[];
  duplicateValuesCount: number;
  completionPercent: number;
  qualityCounts: Record<TranslationQualityStatus, number>;
}

export interface LanguageCoverageReport {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  isScheduledIndianLanguage: boolean;
  totalKeys: number;
  translatedKeys: number;
  missingKeysCount: number;
  emptyKeysCount: number;
  extraKeysCount: number;
  completionPercent: number;
  reviewedPercent: number;
  approvedPercent: number;
  qualityBreakdown: Record<TranslationQualityStatus, number>;
  modules: ModuleCoverageStats[];
  missingKeysSample: string[];
  extraKeysSample: string[];
}

export interface GlobalCoverageSummary {
  generatedAt: string;
  canonicalLanguage: "en";
  totalCanonicalKeys: number;
  namespaces: readonly I18nNamespace[];
  languages: LanguageCoverageReport[];
  runtimeMissingKeysCount: number;
  runtimeMissingKeysSample: Array<{ lang: SupportedLanguage; key: string; count: number; lastSeenAt: string }>;
}

function flattenStringLeaves(obj: Record<string, unknown>, prefix = "", out: Map<string, string> = new Map()): Map<string, string> {
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj)) {
    if (k === "_meta") continue;
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out.set(keyPath, v);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenStringLeaves(v as Record<string, unknown>, keyPath, out);
    }
  }
  return out;
}

function findLocalesRoot(): string {
  const candidates = [
    path.join(process.cwd(), "src", "lib", "i18n", "locales"),
    path.resolve(__dirname, "locales"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

function readNamespaceFile(root: string, lang: string, ns: I18nNamespace): Record<string, unknown> | null {
  const filePath = path.join(root, lang, `${ns}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function generateTranslationCoverageReport(): GlobalCoverageSummary {
  const root = findLocalesRoot();
  const canonicalByNs = new Map<I18nNamespace, Map<string, string>>();
  let totalCanonicalKeys = 0;

  for (const ns of I18N_NAMESPACES) {
    const enJson = readNamespaceFile(root, "en", ns) || {};
    const leaves = flattenStringLeaves(enJson);
    canonicalByNs.set(ns, leaves);
    totalCanonicalKeys += leaves.size;
  }

  const reports: LanguageCoverageReport[] = ALL_LANGUAGES.map((langMeta) => {
    const metaJson = (() => {
      const p = path.join(root, langMeta.code, "_meta.json");
      if (!fs.existsSync(p)) return null;
      try {
        return JSON.parse(fs.readFileSync(p, "utf8"));
      } catch {
        return null;
      }
    })();

    let translatedKeysTotal = 0;
    let missingKeysTotal = 0;
    let emptyKeysTotal = 0;
    let extraKeysTotal = 0;
    const allMissingSample: string[] = [];
    const allExtraSample: string[] = [];

    const overallQuality: Record<TranslationQualityStatus, number> = {
      Approved: 0,
      Reviewed: 0,
      "Machine Draft": 0,
      "Needs Revision": 0,
    };

    const modules: ModuleCoverageStats[] = I18N_NAMESPACES.map((ns) => {
      const enLeaves = canonicalByNs.get(ns) || new Map<string, string>();
      const targetJson = langMeta.code === "en"
        ? readNamespaceFile(root, "en", ns)
        : readNamespaceFile(root, langMeta.code, ns);
      const targetLeaves = targetJson ? flattenStringLeaves(targetJson) : new Map<string, string>();

      const missingKeys: string[] = [];
      const emptyKeys: string[] = [];
      const extraKeys: string[] = [];
      const seenValues = new Map<string, number>();

      const nsQuality: Record<TranslationQualityStatus, number> = {
        Approved: 0,
        Reviewed: 0,
        "Machine Draft": 0,
        "Needs Revision": 0,
      };

      const nsMeta =
        targetJson?._meta && typeof targetJson._meta === "object"
          ? (targetJson._meta as {
              quality?: TranslationQualityStatus;
              keyStatuses?: Record<string, TranslationQualityStatus>;
            })
          : undefined;

      const nsQualityLabel: TranslationQualityStatus =
        nsMeta?.quality ||
        (metaJson?.modules?.[ns]?.quality as TranslationQualityStatus) ||
        (metaJson?.quality as TranslationQualityStatus) ||
        langMeta.defaultQualityStatus;

      let nsTranslated = 0;
      for (const [k] of enLeaves.entries()) {
        if (!targetLeaves.has(k)) {
          missingKeys.push(`${ns}.${k}`);
        } else {
          const val = targetLeaves.get(k) || "";
          if (val.trim().length === 0) {
            emptyKeys.push(`${ns}.${k}`);
          } else {
            nsTranslated++;
            seenValues.set(val, (seenValues.get(val) || 0) + 1);
            const itemQuality: TranslationQualityStatus =
              nsMeta?.keyStatuses?.[k] || nsQualityLabel;
            nsQuality[itemQuality] = (nsQuality[itemQuality] || 0) + 1;
            overallQuality[itemQuality] = (overallQuality[itemQuality] || 0) + 1;
          }
        }
      }

      for (const k of targetLeaves.keys()) {
        if (!enLeaves.has(k)) {
          extraKeys.push(`${ns}.${k}`);
        }
      }

      const duplicateValuesCount = Array.from(seenValues.values()).filter((c) => c > 3).length;
      translatedKeysTotal += nsTranslated;
      missingKeysTotal += missingKeys.length;
      emptyKeysTotal += emptyKeys.length;
      extraKeysTotal += extraKeys.length;

      for (const mk of missingKeys) {
        if (allMissingSample.length < 30) allMissingSample.push(mk);
      }
      for (const ek of extraKeys) {
        if (allExtraSample.length < 30) allExtraSample.push(ek);
      }

      const completionPercent = enLeaves.size > 0
        ? Math.round((nsTranslated / enLeaves.size) * 1000) / 10
        : 100;

      return {
        namespace: ns,
        totalKeys: enLeaves.size,
        translatedKeys: nsTranslated,
        missingKeys,
        emptyKeys,
        extraKeys,
        duplicateValuesCount,
        completionPercent,
        qualityCounts: nsQuality,
      };
    });

    const completionPercent = totalCanonicalKeys > 0
      ? Math.round((translatedKeysTotal / totalCanonicalKeys) * 1000) / 10
      : 0;
    const reviewedCount = overallQuality.Approved + overallQuality.Reviewed;
    const reviewedPercent = totalCanonicalKeys > 0
      ? Math.round((reviewedCount / totalCanonicalKeys) * 1000) / 10
      : 0;
    const approvedPercent = totalCanonicalKeys > 0
      ? Math.round((overallQuality.Approved / totalCanonicalKeys) * 1000) / 10
      : 0;

    return {
      code: langMeta.code,
      name: langMeta.name,
      nativeName: langMeta.nativeName,
      dir: langMeta.dir,
      isScheduledIndianLanguage: langMeta.isScheduledIndianLanguage,
      totalKeys: totalCanonicalKeys,
      translatedKeys: translatedKeysTotal,
      missingKeysCount: missingKeysTotal,
      emptyKeysCount: emptyKeysTotal,
      extraKeysCount: extraKeysTotal,
      completionPercent,
      reviewedPercent,
      approvedPercent,
      qualityBreakdown: overallQuality,
      modules,
      missingKeysSample: allMissingSample,
      extraKeysSample: allExtraSample,
    };
  });

  const runtimeMissing = getMissingKeyLog();

  return {
    generatedAt: new Date().toISOString(),
    canonicalLanguage: "en",
    totalCanonicalKeys,
    namespaces: I18N_NAMESPACES,
    languages: reports,
    runtimeMissingKeysCount: runtimeMissing.length,
    runtimeMissingKeysSample: runtimeMissing.slice(0, 50),
  };
}
