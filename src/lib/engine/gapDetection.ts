import {
  calculatePercentagePointDelta,
  determineTrend,
  calculateAverage,
} from "./calculations";
import type { MasteryStatus, GapPriority } from "../types";
import {
  generateCognitiveDiagnosis,
  type DiagnosisCategory,
  type ErrorPatternEvidence,
  type PrerequisiteEvidence,
} from "./diagnosisEngine";
import {
  calculateAssessmentTrend,
  type AssessmentProgressTrend,
} from "./progressTrend";

export interface ThresholdConfig {
  mastery: number; // default: 80%
  developing: number; // default: 60%
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  mastery: 80,
  developing: 60,
};

export interface ConceptAssessmentInput {
  conceptId: string;
  conceptName: string;
  marksObtained: number;
  maximumMarks: number;
  recordedAt: string;
}

export interface GapDetectionResult {
  conceptId: string;
  conceptName: string;
  masteryStatus: MasteryStatus;
  priority: GapPriority;
  reason: string;
  suggestedAction: string;
  diagnosisType?: DiagnosisCategory;
  trend?: AssessmentProgressTrend | null;
  trendLabel?: string;
  latestPercentage: number;
  previousPercentage?: number;
  deltaPercentagePoints?: number;
  averagePercentage: number;
  attemptsCount: number;
  requiresRemediation: boolean;
  isSingleObservation: boolean;
}

/**
 * Evaluates student assessment history for a specific concept
 * and detects learning gaps with full explainability.
 */
export function detectLearningGap(
  conceptId: string,
  conceptName: string,
  historySortedByDateAsc: {
    marksObtained: number;
    maximumMarks: number;
    recordedAt: string;
  }[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
  options?: {
    prerequisiteInfo?: PrerequisiteEvidence;
    errorEvidence?: ErrorPatternEvidence;
    hasQuestionLevelData?: boolean;
    isComparableHistory?: boolean;
  }
): GapDetectionResult {
  if (!historySortedByDateAsc || historySortedByDateAsc.length === 0) {
    const fallbackDiag = generateCognitiveDiagnosis({
      conceptId,
      conceptName,
      latestPercentage: null,
      supportThreshold: thresholds.developing,
      masteryBenchmark: thresholds.mastery,
    });

    return {
      conceptId,
      conceptName,
      masteryStatus: "Needs Support",
      priority: "Medium",
      reason: "No recorded assessments exist yet for this concept. Conduct an initial diagnostic assessment.",
      suggestedAction: "Conduct an initial diagnostic assessment to establish student baseline.",
      diagnosisType: "Insufficient Evidence",
      latestPercentage: 0,
      averagePercentage: 0,
      attemptsCount: 0,
      requiresRemediation: true,
      isSingleObservation: false,
    };
  }

  // Calculate percentages chronologically
  const percentages = historySortedByDateAsc.map((h) => {
    if (h.maximumMarks <= 0) return 0;
    return Math.round(((h.marksObtained / h.maximumMarks) * 100) * 10) / 10;
  });

  const attemptsCount = percentages.length;
  const latestPercentage = percentages[percentages.length - 1];
  const previousPercentage =
    attemptsCount > 1 ? percentages[percentages.length - 2] : undefined;
  const deltaPercentagePoints =
    previousPercentage !== undefined
      ? calculatePercentagePointDelta(latestPercentage, previousPercentage)
      : undefined;
  const averagePercentage = calculateAverage(percentages);
  const isSingleObservation = attemptsCount === 1;

  // Execute pedagogical diagnosis engine
  const diagnosis = generateCognitiveDiagnosis({
    conceptId,
    conceptName,
    latestPercentage,
    previousPercentage,
    deltaPercentagePoints,
    attemptsCount,
    supportThreshold: thresholds.developing,
    masteryBenchmark: thresholds.mastery,
    prerequisiteInfo: options?.prerequisiteInfo,
    errorEvidence: options?.errorEvidence,
    hasQuestionLevelData: options?.hasQuestionLevelData,
    isComparableHistory: options?.isComparableHistory,
  });

  const masteryStatus: MasteryStatus = diagnosis.status;

  // Determine priority based on diagnosis & performance severity
  let priority: GapPriority;
  if (masteryStatus === "Mastered") {
    priority = "Low";
  } else if (masteryStatus === "Needs Support") {
    const isRepeatedLow =
      attemptsCount >= 2 &&
      previousPercentage !== undefined &&
      previousPercentage < thresholds.developing;
    if (latestPercentage < 40 || isRepeatedLow || diagnosis.diagnosisType === "Conceptual Gap" || diagnosis.diagnosisType === "Prerequisite Weakness") {
      priority = "High";
    } else {
      priority = "Medium";
    }
  } else {
    // Developing
    const trend = determineTrend(percentages);
    if (trend.trend === "declining") {
      priority = "High";
    } else {
      priority = "Medium";
    }
  }

  let reason = diagnosis.explanation;
  let suggestedAction = diagnosis.recommendedAction;

  // Ensure exact compatibility with historical single-observation text
  if (isSingleObservation && masteryStatus === "Mastered") {
    reason = `Student achieved ${latestPercentage}% on the single recorded assessment. Note: This is an initial single observation. Confirm mastery through regular classroom review.`;
    suggestedAction = `Confirm mastery through regular classroom review or periodic reassessment.`;
  }

  const requiresRemediation = masteryStatus !== "Mastered" || priority === "High";

  const trendResult = calculateAssessmentTrend({
    currentScore: latestPercentage,
    previousScore: previousPercentage,
  });

  return {
    conceptId,
    conceptName,
    masteryStatus,
    priority,
    reason,
    suggestedAction,
    diagnosisType: diagnosis.diagnosisType,
    trend: trendResult.trend,
    trendLabel: trendResult.trendLabel,
    latestPercentage,
    previousPercentage,
    deltaPercentagePoints,
    averagePercentage,
    attemptsCount,
    requiresRemediation,
    isSingleObservation,
  };
}
