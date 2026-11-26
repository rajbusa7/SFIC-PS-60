import type { SupportedLanguage, SupportedScript } from "../../../packages/shared/src/types/notice";
import { getLanguageMeta, resolveEffectiveScript } from "./registry";

export type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

/**
 * Interpolates `{key}` and `{{key}}` placeholders cleanly without leaving empty braces for missing keys.
 */
export function interpolateTemplate(
  template: string,
  vars?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!template || !vars) return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}|\{\s*([a-zA-Z0-9_.-]+)\s*\}/g, (match, doubleKey, singleKey) => {
    const key = doubleKey || singleKey;
    if (key in vars && vars[key] !== undefined && vars[key] !== null) {
      return String(vars[key]);
    }
    return match;
  });
}

function resolveIntlLocale(
  lang: SupportedLanguage,
  script?: SupportedScript | null,
  includeNumberingSystem = true
): string {
  const meta = getLanguageMeta(lang);
  const effScript = resolveEffectiveScript(lang, script);
  if (!includeNumberingSystem || !effScript.numberingSystem) {
    return meta.bcp47;
  }
  return `${meta.bcp47}-u-nu-${effScript.numberingSystem}`;
}

export function formatNumber(
  value: number,
  lang: SupportedLanguage = "en",
  script?: SupportedScript | null,
  options?: Intl.NumberFormatOptions & { nativeDigits?: boolean }
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const { nativeDigits = true, ...intlOptions } = options || {};
  const meta = getLanguageMeta(lang);
  const locale = resolveIntlLocale(lang, script, nativeDigits);
  try {
    return new Intl.NumberFormat(locale, intlOptions).format(value);
  } catch {
    return new Intl.NumberFormat(meta.bcp47, intlOptions).format(value);
  }
}

export function formatPercent(
  value: number,
  lang: SupportedLanguage = "en",
  script?: SupportedScript | null,
  fractionDigits = 0
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return formatNumber(value / 100, lang, script, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatCurrency(
  amount: number,
  lang: SupportedLanguage = "en",
  script?: SupportedScript | null,
  currency = "INR"
): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  return formatNumber(amount, lang, script, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  });
}

export function formatDate(
  input: Date | string | number,
  lang: SupportedLanguage = "en",
  script?: SupportedScript | null,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input || "");
  const meta = getLanguageMeta(lang);
  const locale = resolveIntlLocale(lang, script, true);
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(meta.bcp47, options).format(date);
  }
}

export function formatTime(
  input: Date | string | number,
  lang: SupportedLanguage = "en",
  script?: SupportedScript | null,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input || "");
  const meta = getLanguageMeta(lang);
  const locale = resolveIntlLocale(lang, script, true);
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(meta.bcp47, options).format(date);
  }
}

export function formatDateTime(
  input: Date | string | number,
  lang: SupportedLanguage = "en",
  script?: SupportedScript | null
): string {
  return formatDate(input, lang, script, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function selectPluralForm(
  count: number,
  forms: PluralForms,
  lang: SupportedLanguage = "en",
  script?: SupportedScript | null,
  vars?: Record<string, string | number | boolean>
): string {
  const meta = getLanguageMeta(lang);
  if (count === 0 && forms.zero) {
    return interpolateTemplate(forms.zero, {
      ...vars,
      count: formatNumber(count, lang, script),
      rawCount: count,
    });
  }

  let category: Intl.LDMLPluralRule = count === 1 ? "one" : "other";
  try {
    const pr = new Intl.PluralRules(meta.bcp47);
    category = pr.select(count);
  } catch {
    // Fallback to simple singular/plural rule
  }

  const template = forms[category] || forms.other;
  return interpolateTemplate(template, {
    ...vars,
    count: formatNumber(count, lang, script),
    rawCount: count,
    s: count === 1 ? "" : "s",
  });
}
