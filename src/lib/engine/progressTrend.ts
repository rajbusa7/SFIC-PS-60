/**
 * StudySaathi AI - Lightweight Assessment Progress Trend Engine
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements centralized assessment progress delta and trend classification:
 * - scoreDelta = currentScore - previousScore (in percentage points 'pp')
 * - Centralized stability tolerance: 2 percentage points
 * - scoreDelta > 2       => "Improving" (↑ +X pp Improving)
 * - -2 <= scoreDelta <= 2 => "Stable"    (→ Stable)
 * - scoreDelta < -2      => "Declining" (↓ -X pp Declining)
 * - Missing history      => "First assessment"
 *
 * Strictly adheres to pedagogical requirements:
 * - Differentiates percentage-point difference (pp) from percentage growth
 * - Safe numeric handling: never emits NaN, null, or undefined strings
 * - Does not fabricate previous scores or trends
 */

import { sanitizeScore } from "./diagnosisEngine";
import type { Language } from "../i18n/translations";

export type AssessmentProgressTrend = "Improving" | "Stable" | "Declining";

/**
 * Centralized stability tolerance in percentage points (pp).
 * Fluctuations within ±2 pp are classified as Stable rather than meaningful changes.
 */
export const STABILITY_TOLERANCE_PP = 2;

export interface ProgressTrendInput {
  currentScore?: number | null;
  previousScore?: number | null;
  tolerance?: number;
  language?: Language;
}

export interface ProgressTrendResult {
  hasPreviousAssessment: boolean;
  isValid: boolean;
  currentScore: number | null;
  previousScore: number | null;
  scoreDelta: number | null; // percentage points (pp)
  trend: AssessmentProgressTrend | null;
  trendLabel: string; // "Improving" | "Stable" | "Declining" | "First assessment"
  trendLabelGu: string;
  formattedDelta: string; // "+20 pp", "-20 pp", "0 pp", ""
  formattedBadge: string; // "↑ +20 pp Improving", "→ Stable", "↓ -20 pp Declining", "First assessment"
  formattedBadgeGu: string; // "↑ +20 pp સુધરતું", "→ સ્થિર", "↓ -20 pp ઘટતું", "પ્રથમ મૂલ્યાંકન"
  arrow: string; // "↑", "→", "↓", ""
  statusVariant: "mint" | "coral" | "neutral" | "amber";
  badgeBorderClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
}

/**
 * Calculates the percentage-point difference:
 * scoreDelta = currentScore - previousScore (rounded to 1 decimal place).
 */
export function calculateScoreDelta(
  currentScore: number,
  previousScore: number
): number {
  return Math.round((currentScore - previousScore) * 10) / 10;
}

/**
 * Formats a score delta into a clean percentage point string (e.g. "+20 pp", "-20 pp", "0 pp").
 */
export function formatScoreDelta(delta: number | null): string {
  if (delta === null || isNaN(delta) || !isFinite(delta)) {
    return "";
  }
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) {
    return `+${rounded} pp`;
  }
  return `${rounded} pp`;
}

/**
 * Centralized, deterministic assessment progress trend calculator.
 */
export function calculateAssessmentTrend(
  input: ProgressTrendInput
): ProgressTrendResult {
  const lang: Language = input.language || "en";
  const tolerance = typeof input.tolerance === "number" && !isNaN(input.tolerance)
    ? input.tolerance
    : STABILITY_TOLERANCE_PP;

  const current = sanitizeScore(input.currentScore);
  const previous = sanitizeScore(input.previousScore);

  // 1. Missing or invalid current score
  if (current === null) {
    return {
      hasPreviousAssessment: false,
      isValid: false,
      currentScore: null,
      previousScore: previous,
      scoreDelta: null,
      trend: null,
      trendLabel: lang === "gu" ? "અમાન્ય સ્કોર" : "Invalid score",
      trendLabelGu: "અમાન્ય સ્કોર",
      formattedDelta: "",
      formattedBadge: lang === "gu" ? "ડેટા ઉપલબ્ધ નથી" : "Data unavailable",
      formattedBadgeGu: "ડેટા ઉપલબ્ધ નથી",
      arrow: "",
      statusVariant: "neutral",
      badgeBorderClass: "border-[#49352F]/15",
      badgeBgClass: "bg-[#FAF6E9]",
      badgeTextClass: "text-[#7A6862]",
    };
  }

  // 2. First assessment (missing or invalid previous score)
  if (previous === null) {
    return {
      hasPreviousAssessment: false,
      isValid: true,
      currentScore: current,
      previousScore: null,
      scoreDelta: null,
      trend: null,
      trendLabel: "First assessment",
      trendLabelGu: "પ્રથમ મૂલ્યાંકન",
      formattedDelta: "",
      formattedBadge: lang === "gu" ? "પ્રથમ મૂલ્યાંકન" : "First assessment",
      formattedBadgeGu: "પ્રથમ મૂલ્યાંકન",
      arrow: "",
      statusVariant: "amber",
      badgeBorderClass: "border-[#B26A1B]/30",
      badgeBgClass: "bg-[#B26A1B]/10",
      badgeTextClass: "text-[#B26A1B]",
    };
  }

  // 3. Both current and previous scores are valid numbers
  const delta = calculateScoreDelta(current, previous);
  const formattedDelta = formatScoreDelta(delta);

  // Trend classification using 2 pp stability tolerance:
  // - delta > 2  => Improving
  // - delta < -2 => Declining
  // - otherwise  => Stable
  if (delta > tolerance) {
    return {
      hasPreviousAssessment: true,
      isValid: true,
      currentScore: current,
      previousScore: previous,
      scoreDelta: delta,
      trend: "Improving",
      trendLabel: "Improving",
      trendLabelGu: "સુધરતું",
      formattedDelta,
      formattedBadge: `↑ ${formattedDelta} Improving`,
      formattedBadgeGu: `↑ ${formattedDelta} સુધરતું`,
      arrow: "↑",
      statusVariant: "mint",
      badgeBorderClass: "border-[#2E7D5E]/30",
      badgeBgClass: "bg-[#2E7D5E]/10",
      badgeTextClass: "text-[#2E7D5E]",
    };
  }

  if (delta < -tolerance) {
    return {
      hasPreviousAssessment: true,
      isValid: true,
      currentScore: current,
      previousScore: previous,
      scoreDelta: delta,
      trend: "Declining",
      trendLabel: "Declining",
      trendLabelGu: "ઘટતું",
      formattedDelta,
      formattedBadge: `↓ ${formattedDelta} Declining`,
      formattedBadgeGu: `↓ ${formattedDelta} ઘટતું`,
      arrow: "↓",
      statusVariant: "coral",
      badgeBorderClass: "border-[#C54738]/30",
      badgeBgClass: "bg-[#C54738]/10",
      badgeTextClass: "text-[#C54738]",
    };
  }

  // Stable (|delta| <= tolerance)
  return {
    hasPreviousAssessment: true,
    isValid: true,
    currentScore: current,
    previousScore: previous,
    scoreDelta: delta,
    trend: "Stable",
    trendLabel: "Stable",
    trendLabelGu: "સ્થિર",
    formattedDelta,
    formattedBadge: lang === "gu" ? "→ સ્થિર" : "→ Stable",
    formattedBadgeGu: "→ સ્થિર",
    arrow: "→",
    statusVariant: "neutral",
    badgeBorderClass: "border-[#49352F]/20",
    badgeBgClass: "bg-[#FAF6E9]",
    badgeTextClass: "text-[#7A6862]",
  };
}

