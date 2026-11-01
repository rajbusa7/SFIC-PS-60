import type { GapPriority, ScoreTrend } from "../types";

export interface SeverityInput {
  conceptId?: string;
  conceptName?: string;
  currentScore: number;
  previousScore?: number;
  scoreDelta?: number;
  trend: ScoreTrend;
  attemptCount: number;
  evidenceCount: number;
  supportThreshold?: number; // default: 60
  masteryThreshold?: number; // default: 80
  prerequisitesMastered?: boolean;
  hasRepeatedErrors?: boolean;
  recencyDays?: number;
  misconceptionDescription?: string;
}

export interface SeverityFactorBreakdown {
  masteryDeficitScore: number;
  prerequisiteDependencyScore: number;
  repeatedMisconceptionScore: number;
  trendScore: number;
  failedAttemptsScore: number;
  evidenceStrengthScore: number;
  recencyScore: number;
}

export interface SeverityEvaluationResult {
  severityScore: number; // 0 - 100
  severityLevel: GapPriority; // "Low" | "Medium" | "High" | "Critical"
  severityReasons: string[];
  breakdown: SeverityFactorBreakdown;
}

/**
 * Maps normalized severity score (0–100) to standard priority level:
 * 0–24: Low
 * 25–49: Medium
 * 50–74: High
 * 75–100: Critical
 */
export function mapSeverityScoreToLevel(score: number): GapPriority {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

/**
 * Learning Gap Severity Engine
 * Calculates a normalized, deterministic severity score from 0–100
 * using 7 explainable weighted factors:
 *
 * 1. Mastery Deficit (0–35 pts)
 * 2. Prerequisite Dependency (0–20 pts)
 * 3. Repeated Misconception Frequency (0–15 pts)
 * 4. Negative/Positive Score Trend (0–15 pts)
 * 5. Failed Attempts (0–10 pts)
 * 6. Evidence Strength (0–5 pts)
 * 7. Assessment Recency (0–5 pts)
 */
export function calculateGapSeverity(input: SeverityInput): SeverityEvaluationResult {
  const supportThreshold = input.supportThreshold ?? 60;
  const masteryThreshold = input.masteryThreshold ?? 80;
  const currentScore = input.currentScore ?? 0;
  const reasons: string[] = [];

  // ==========================================================================
  // FACTOR 1: Mastery Deficit (0 to 30 points)
  // ==========================================================================
  let masteryDeficitScore = 0;
  if (currentScore >= masteryThreshold) {
    masteryDeficitScore = 0;
  } else if (currentScore >= supportThreshold) {
    // In developing range: 12 to 22 points
    const deficitRatio = (masteryThreshold - currentScore) / (masteryThreshold - supportThreshold);
    masteryDeficitScore = Math.round(deficitRatio * 10 + 12);
    reasons.push(`Score (${currentScore}%) is in developing range toward ${masteryThreshold}% mastery benchmark`);
  } else {
    // Below support threshold: 14 to 30 points
    if (currentScore < 30) {
      masteryDeficitScore = 30;
      reasons.push(`Severe mastery deficit (${currentScore}% vs ${supportThreshold}% support benchmark)`);
    } else if (currentScore < 50) {
      const deficitRatio = (50 - currentScore) / 50;
      masteryDeficitScore = Math.round(deficitRatio * 5 + 24);
      reasons.push(`Score (${currentScore}%) indicates substantial conceptual confusion below 50%`);
    } else {
      const deficitRatio = (supportThreshold - currentScore) / supportThreshold;
      masteryDeficitScore = Math.min(22, Math.round(deficitRatio * 10 + 14));
      reasons.push(`Score (${currentScore}%) is below operational support threshold of ${supportThreshold}%`);
    }
  }

  // ==========================================================================
  // FACTOR 2: Prerequisite Dependency (0 to 20 points)
  // ==========================================================================
  let prerequisiteDependencyScore = 0;
  if (input.prerequisitesMastered === false) {
    prerequisiteDependencyScore = 20;
    reasons.push("Foundational prerequisite concept is unmastered, causing compounding learning gap");
  } else {
    prerequisiteDependencyScore = 0;
  }

  // ==========================================================================
  // FACTOR 3: Repeated Misconception Frequency (0 to 15 points)
  // ==========================================================================
  let repeatedMisconceptionScore = 0;
  if (input.hasRepeatedErrors) {
    repeatedMisconceptionScore = 12;
    reasons.push("Persistent conceptual errors recurring across multiple assessment attempts");
  } else if (input.attemptCount >= 2 && currentScore < supportThreshold) {
    repeatedMisconceptionScore = 8;
    reasons.push("Recurring difficulty detected across consecutive classroom evaluations");
  } else {
    repeatedMisconceptionScore = 0;
  }

  // ==========================================================================
  // FACTOR 4: Negative/Positive Score Trend (0 to 15 points)
  // ==========================================================================
  let trendScore = 0;
  if (input.trend === "Declining") {
    const delta = Math.abs(input.scoreDelta ?? 0);
    if (delta >= 15 || (input.previousScore !== undefined && input.previousScore >= masteryThreshold)) {
      trendScore = 12;
      reasons.push(`Steep downward trajectory (-${delta} pp regression from prior performance)`);
    } else {
      trendScore = 8;
      reasons.push(`Declining trajectory (-${delta} pp drop); performance is slipping`);
    }
  } else if (input.trend === "Stable") {
    if (currentScore < supportThreshold) {
      trendScore = 5;
      reasons.push("No measurable progress observed; performance has stagnated below benchmark");
    } else {
      trendScore = 2;
    }
  } else if (input.trend === "Improving") {
    // Positive momentum provides negative severity penalty (-5 to -8 pts)
    const gain = Math.abs(input.scoreDelta ?? 0);
    trendScore = Math.max(-8, -Math.round(gain * 0.2));
  } else {
    // Insufficient Data
    trendScore = 3;
  }

  // ==========================================================================
  // FACTOR 5: Failed Attempts / Struggle Volume (0 to 10 points)
  // ==========================================================================
  let failedAttemptsScore = 0;
  if (currentScore < supportThreshold) {
    if (input.attemptCount >= 3) {
      failedAttemptsScore = 10;
      reasons.push(`Student is struggling persistently across ${input.attemptCount} recorded attempts`);
    } else if (input.attemptCount === 2) {
      failedAttemptsScore = 5;
    } else {
      failedAttemptsScore = 2;
    }
  } else if (currentScore < masteryThreshold) {
    failedAttemptsScore = 2;
  } else {
    failedAttemptsScore = 0;
  }

  // ==========================================================================
  // FACTOR 6: Evidence Strength (0 to 5 points)
  // ==========================================================================
  let evidenceStrengthScore = 0;
  if (input.evidenceCount >= 2) {
    evidenceStrengthScore = 4;
  } else {
    evidenceStrengthScore = 2;
  }

  // ==========================================================================
  // FACTOR 7: Assessment Recency (0 to 5 points)
  // ==========================================================================
  let recencyScore = 0;
  if (input.recencyDays !== undefined) {
    if (input.recencyDays <= 14) {
      recencyScore = 4;
    } else if (input.recencyDays <= 45) {
      recencyScore = 2;
    } else {
      recencyScore = 1;
    }
  } else {
    recencyScore = 3;
  }

  // ==========================================================================
  // TOTAL NORMALIZED CALCULATION (0 - 100)
  // ==========================================================================
  const rawTotal =
    masteryDeficitScore +
    prerequisiteDependencyScore +
    repeatedMisconceptionScore +
    trendScore +
    failedAttemptsScore +
    evidenceStrengthScore +
    recencyScore;

  // If concept is already mastered (>= 80%) with stable/improving trend, cap severity at 15 (Low)
  let severityScore: number;
  if (currentScore >= masteryThreshold && input.trend !== "Declining") {
    severityScore = Math.min(15, Math.max(0, Math.round(rawTotal * 0.2)));
    if (reasons.length === 0) {
      reasons.push("Concept is at or above mastery benchmark; routine monitoring only");
    }
  } else {
    severityScore = Math.max(0, Math.min(100, Math.round(rawTotal)));
  }

  const severityLevel = mapSeverityScoreToLevel(severityScore);

  // If no specific reasons were triggered, provide contextual summary
  if (reasons.length === 0) {
    if (severityLevel === "Low") {
      reasons.push("Concept performance is stable near or above expected grade benchmark");
    } else {
      reasons.push(`Score of ${currentScore}% warrants instructional follow-up`);
    }
  }

  return {
    severityScore,
    severityLevel,
    severityReasons: reasons.slice(0, 3), // Return top 3 most impactful reasons
    breakdown: {
      masteryDeficitScore,
      prerequisiteDependencyScore,
      repeatedMisconceptionScore,
      trendScore,
      failedAttemptsScore,
      evidenceStrengthScore,
      recencyScore,
    },
  };
}
