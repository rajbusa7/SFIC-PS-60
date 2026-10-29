/**
 * Core mathematical and trend calculations for ShikshaSetu AI.
 * Follows exact specifications:
 * - Safe numeric handling (no NaN/infinite values)
 * - True percentage points delta: (Latest % - Previous %)
 * - Differentiates percentage-point change from relative % increase
 */

export interface ScoreValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateAssessmentMarks(
  marksObtained: number,
  maximumMarks: number
): ScoreValidationResult {
  if (typeof marksObtained !== "number" || isNaN(marksObtained)) {
    return { isValid: false, error: "Marks obtained must be a valid number" };
  }
  if (typeof maximumMarks !== "number" || isNaN(maximumMarks)) {
    return { isValid: false, error: "Maximum marks must be a valid number" };
  }
  if (maximumMarks <= 0) {
    return { isValid: false, error: "Maximum marks must be greater than zero" };
  }
  if (marksObtained < 0) {
    return { isValid: false, error: "Marks obtained cannot be negative" };
  }
  if (marksObtained > maximumMarks) {
    return {
      isValid: false,
      error: `Marks obtained (${marksObtained}) cannot exceed maximum marks (${maximumMarks})`,
    };
  }
  return { isValid: true };
}

export function calculatePercentage(
  marksObtained: number,
  maximumMarks: number
): number {
  if (!maximumMarks || maximumMarks <= 0 || marksObtained < 0) {
    return 0;
  }
  const pct = (marksObtained / maximumMarks) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 100) / 100));
}

/**
 * Calculates percentage-point difference:
 * Latest % - Initial % = Change in percentage points (pp).
 * E.g. Initial 35%, Latest 75% -> +40 pp.
 */
export function calculatePercentagePointDelta(
  latestPercentage: number,
  previousPercentage: number
): number {
  const delta = latestPercentage - previousPercentage;
  return Math.round(delta * 10) / 10;
}

export type TrendDirection = "improving" | "declining" | "stable" | "insufficient_data";

export function determineTrend(scoresChronological: number[]): {
  trend: TrendDirection;
  deltaPercentagePoints: number | null;
  message: string;
} {
  if (!scoresChronological || scoresChronological.length < 2) {
    return {
      trend: "insufficient_data",
      deltaPercentagePoints: null,
      message: "At least two assessments are required to calculate historical improvement.",
    };
  }

  const firstScore = scoresChronological[0];
  const lastScore = scoresChronological[scoresChronological.length - 1];
  const delta = calculatePercentagePointDelta(lastScore, firstScore);

  if (delta >= 5) {
    return {
      trend: "improving",
      deltaPercentagePoints: delta,
      message: `Progressing well: +${delta} percentage points since baseline.`,
    };
  } else if (delta <= -5) {
    return {
      trend: "declining",
      deltaPercentagePoints: delta,
      message: `Performance declined by ${Math.abs(delta)} percentage points; requires teacher attention.`,
    };
  } else {
    return {
      trend: "stable",
      deltaPercentagePoints: delta,
      message: `Performance has remained stable (${delta >= 0 ? "+" : ""}${delta} pp).`,
    };
  }
}

export function calculateAverage(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / numbers.length) * 10) / 10;
}
