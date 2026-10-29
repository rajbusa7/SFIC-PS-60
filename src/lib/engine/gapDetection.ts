import {
  calculatePercentage,
  calculatePercentagePointDelta,
  determineTrend,
  calculateAverage,
} from "./calculations";
import type { MasteryStatus, GapPriority } from "../types";

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
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): GapDetectionResult {
  if (!historySortedByDateAsc || historySortedByDateAsc.length === 0) {
    return {
      conceptId,
      conceptName,
      masteryStatus: "Needs Support",
      priority: "Medium",
      reason: "No recorded assessments exist yet for this concept.",
      suggestedAction: "Conduct an initial diagnostic assessment.",
      latestPercentage: 0,
      averagePercentage: 0,
      attemptsCount: 0,
      requiresRemediation: true,
      isSingleObservation: false,
    };
  }

  // Calculate percentages chronologically
  const percentages = historySortedByDateAsc.map((h) => {
    return calculatePercentage(h.marksObtained, h.maximumMarks);
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

  // Determine mastery status based on configured operational thresholds
  let masteryStatus: MasteryStatus;
  if (latestPercentage >= thresholds.mastery) {
    masteryStatus = "Mastered";
  } else if (latestPercentage >= thresholds.developing) {
    masteryStatus = "Developing";
  } else {
    masteryStatus = "Needs Support";
  }

  // Determine priority & supportive explanation
  let priority: GapPriority;
  let reason: string;
  let suggestedAction: string;

  if (masteryStatus === "Needs Support") {
    // Check if repeated difficulty
    const isRepeatedLow =
      attemptsCount >= 2 &&
      previousPercentage !== undefined &&
      previousPercentage < thresholds.developing;

    if (latestPercentage < 40 || isRepeatedLow) {
      priority = "High";
      reason = isRepeatedLow
        ? `Assessment performance (${latestPercentage}%) is below the configured support threshold (${thresholds.developing}%), and the previous result (${previousPercentage}%) also showed persistent difficulty.`
        : `Assessment score (${latestPercentage}%) indicates substantial conceptual confusion requiring immediate foundational intervention.`;
      suggestedAction = `Assign focused 1-on-1 or small group remedial practice on ${conceptName} fundamentals, using visual manipulatives or physical objects.`;
    } else {
      priority = "Medium";
      reason = `Score (${latestPercentage}%) is below the operational mastery threshold (${thresholds.developing}%).`;
      suggestedAction = `Assign structured remedial practice worksheets on ${conceptName} and review progress after 2 practice sessions.`;
    }
  } else if (masteryStatus === "Developing") {
    const trend = determineTrend(percentages);
    if (trend.trend === "declining") {
      priority = "High";
      reason = `Student achieved ${latestPercentage}% (Developing), but performance has declined by ${Math.abs(
        deltaPercentagePoints || 0
      )} percentage points compared to earlier attempts.`;
      suggestedAction = `Review recently missed questions in ${conceptName} to prevent concepts from slipping further.`;
    } else {
      priority = "Medium";
      reason = `Student has grasped core basics (${latestPercentage}%), but has not yet met the mastery threshold of ${thresholds.mastery}%.`;
      suggestedAction = `Provide guided practice with slightly varied problem sets to reinforce conceptual consistency.`;
    }
  } else {
    // Mastered (>= 80%)
    priority = "Low";
    if (isSingleObservation) {
      reason = `Student achieved ${latestPercentage}% on the single recorded assessment. Note: This is an initial single observation.`;
      suggestedAction = `Confirm mastery through regular classroom review or periodic reassessment.`;
    } else if (deltaPercentagePoints !== undefined && deltaPercentagePoints > 0) {
      reason = `Concept successfully mastered (${latestPercentage}%), showing an improvement of +${deltaPercentagePoints} percentage points from previous session.`;
      suggestedAction = `Ready for advanced application exercises or the next curriculum topic.`;
    } else {
      reason = `Consistently demonstrated mastery (${latestPercentage}%) above the ${thresholds.mastery}% threshold.`;
      suggestedAction = `Maintain periodic revision; ready for next grade-level concept.`;
    }
  }

  const requiresRemediation = masteryStatus !== "Mastered" || priority === "High";

  return {
    conceptId,
    conceptName,
    masteryStatus,
    priority,
    reason,
    suggestedAction,
    latestPercentage,
    previousPercentage,
    deltaPercentagePoints,
    averagePercentage,
    attemptsCount,
    requiresRemediation,
    isSingleObservation,
  };
}
