import {
  calculatePercentagePointDelta,
  calculateAverage,
} from "./calculations";
import {
  calculateGapSeverity,
  mapSeverityScoreToLevel,
  type SeverityEvaluationResult,
  type SeverityFactorBreakdown,
} from "./severityEngine";
import {
  diagnoseLearningGap,
  type GapDiagnosisType,
  type DiagnosisResult,
  type ConfidenceLevel,
  type QuestionEvidenceItem,
} from "./diagnosisEngine";
import {
  analyzeRootCause,
  type LearningPathStep,
} from "./prerequisiteEngine";
import type {
  MasteryStatus,
  GapPriority,
  GapLifecycleStatus,
  ScoreTrend,
} from "../types";

export type {
  ScoreTrend,
  SeverityEvaluationResult,
  SeverityFactorBreakdown,
  GapDiagnosisType,
  DiagnosisResult,
  ConfidenceLevel,
  QuestionEvidenceItem,
};
export { calculateGapSeverity, mapSeverityScoreToLevel, diagnoseLearningGap };

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

export interface GapDetectionOptions {
  prerequisitesMastered?: boolean;
  hasRepeatedErrors?: boolean;
  referenceDate?: string | Date;
  remedialPlanId?: string;
}

export interface ScoreTrajectoryCalculation {
  trend: ScoreTrend;
  scoreDelta?: number;
  totalDelta?: number;
  trendText: string;
}

export interface GapDetectionResult {
  conceptId: string;
  conceptName: string;
  masteryStatus: MasteryStatus;
  gapStatus?: MasteryStatus;
  priority: GapPriority;
  lifecycleStatus?: GapLifecycleStatus;
  reason: string;
  suggestedAction: string;

  // Primary Trajectory & Scoring metrics (reusable logic)
  currentScore?: number;
  latestPercentage: number;
  previousScore?: number;
  previousPercentage?: number;
  scoreDelta?: number;
  deltaPercentagePoints?: number;
  totalDelta?: number;
  trend?: ScoreTrend;
  trendText?: string;
  trendLabel?: string;
  diagnosisType?: any;
  attemptCount?: number;
  attemptsCount: number;
  evidenceCount?: number;
  supportThreshold?: number;
  masteryThreshold?: number;
  averagePercentage: number;

  // Contextual dimensions & Severity Engine
  recencyDays?: number;
  prerequisitesMastered?: boolean;
  hasRepeatedErrors?: boolean;
  requiresRemediation: boolean;
  isSingleObservation: boolean;
  severityScore?: number;
  severityLevel?: GapPriority;
  severityReasons?: string[];
  severityBreakdown?: SeverityFactorBreakdown;

  // Learning Gap Diagnosis Engine
  diagnosis?: string;
  diagnosisTitle?: string;
  gapType?: GapDiagnosisType;
  gapTypeReason?: string;
  confidence?: number;
  confidenceScore?: number;
  confidenceLevel?: ConfidenceLevel;
  assessmentsAnalyzed?: number;
  questionsAnalyzed?: number;
  errorPatternDetected?: string;
  triggerRule?: string;
  supportingEvidence?: string[];
  questionEvidence?: QuestionEvidenceItem[];
  hasQuestionLevelEvidence?: boolean;
  lowConfidenceDisclaimer?: string;
  recommendedDiagnosticAction?: string;

  // Prerequisite & Root-Cause Analysis Engine
  isRootGapIdentified?: boolean;
  rootConcept?: { id: string; name: string; nameGujarati?: string };
  affectedConcept?: { id: string; name: string; nameGujarati?: string };
  prerequisiteConcepts?: string[];
  dependentConcepts?: string[];
  recommendedLearningOrder?: string[];
  learningPath?: LearningPathStep[];
  rootCauseConfidence?: number;
  rootCauseConfidenceLevel?: ConfidenceLevel;
  rootCauseExplanation?: string;
  insufficientEvidenceWarning?: string;

  // Longitudinal Progress & Gap Reopening
  gapReopened?: boolean;
  previousMasteryScore?: number;
  masteryDate?: string;
  assessmentHistory?: any[];
  totalImprovement?: number;
  latestScoreDelta?: number;
  numberOfAssessments?: number;
  numberOfInterventions?: number;
  timeToMastery?: string;
}

/**
 * Calculates score trajectory and formats trend indicator.
 * Supports: "Improving" | "Stable" | "Declining" | "Insufficient Data"
 */
export function calculateScoreTrajectory(
  scoresChronological: number[]
): ScoreTrajectoryCalculation {
  if (!scoresChronological || scoresChronological.length < 2) {
    return {
      trend: "Insufficient Data",
      scoreDelta: undefined,
      totalDelta: undefined,
      trendText: "⋯ Insufficient Data",
    };
  }

  const firstScore = scoresChronological[0];
  const previousScore = scoresChronological[scoresChronological.length - 2];
  const currentScore = scoresChronological[scoresChronological.length - 1];

  const recentDelta = calculatePercentagePointDelta(currentScore, previousScore);
  const overallDelta = calculatePercentagePointDelta(currentScore, firstScore);

  let trend: ScoreTrend;
  if (recentDelta >= 5 || (overallDelta >= 7 && recentDelta >= 0)) {
    trend = "Improving";
  } else if (recentDelta <= -5 || (overallDelta <= -7 && recentDelta <= 0)) {
    trend = "Declining";
  } else {
    trend = "Stable";
  }

  const deltaForDisplay = recentDelta !== 0 ? recentDelta : overallDelta;
  let trendText: string;
  if (trend === "Improving") {
    trendText = `↑ +${Math.abs(deltaForDisplay)}% Improving`;
  } else if (trend === "Declining") {
    trendText = `↓ -${Math.abs(deltaForDisplay)}% Declining`;
  } else {
    trendText = "→ Stable";
  }

  return {
    trend,
    scoreDelta: recentDelta,
    totalDelta: overallDelta,
    trendText,
  };
}

export function formatTrendText(trend: ScoreTrend, scoreDelta?: number): string {
  if (trend === "Improving") {
    return scoreDelta !== undefined
      ? `↑ +${Math.abs(scoreDelta)}% Improving`
      : "↑ Improving";
  }
  if (trend === "Declining") {
    return scoreDelta !== undefined
      ? `↓ -${Math.abs(scoreDelta)}% Declining`
      : "↓ Declining";
  }
  if (trend === "Stable") {
    return "→ Stable";
  }
  return "⋯ Insufficient Data";
}

export function getGapLifecycle(
  masteryStatus: MasteryStatus,
  score: number,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): GapLifecycleStatus {
  if (score >= thresholds.mastery || masteryStatus === "Mastered") {
    return "Closed Gap";
  }
  if (score >= thresholds.developing || masteryStatus === "Developing") {
    return "Monitoring/Developing";
  }
  return "Active Gap";
}

/**
 * Multi-dimensional rule engine evaluating student assessment trajectory.
 * Incorporates:
 * - currentScore, previousScore, scoreDelta, trend
 * - attemptCount & evidenceCount
 * - supportThreshold & masteryThreshold
 * - repeated error patterns
 * - prerequisite mastery status
 * - recency of assessment
 *
 * Crucially differentiates trajectories with identical current percentages:
 * - Student A (55% → 65% → 75%) is classified as Improving/Developing.
 * - Student B (90% → 82% → 75%) is classified as Declining and needing attention.
 */
export function evaluateStudentGapTrajectory(params: {
  conceptId: string;
  conceptName: string;
  historySortedByDateAsc: {
    marksObtained: number;
    maximumMarks: number;
    recordedAt?: string;
  }[];
  thresholds?: ThresholdConfig;
  options?: GapDetectionOptions;
}): GapDetectionResult {
  const { conceptId, conceptName, historySortedByDateAsc } = params;
  const thresholds = params.thresholds || DEFAULT_THRESHOLDS;
  const options = params.options || {};
  const supportThreshold = thresholds.developing;
  const masteryThreshold = thresholds.mastery;

  // Handle empty history
  if (!historySortedByDateAsc || historySortedByDateAsc.length === 0) {
    return {
      conceptId,
      conceptName,
      masteryStatus: "Needs Support",
      gapStatus: "Needs Support",
      priority: "Medium",
      lifecycleStatus: "Active Gap",
      reason: "No recorded assessments exist yet for this concept.",
      suggestedAction: "Conduct an initial diagnostic assessment.",
      currentScore: 0,
      latestPercentage: 0,
      previousScore: undefined,
      previousPercentage: undefined,
      scoreDelta: undefined,
      deltaPercentagePoints: undefined,
      totalDelta: undefined,
      trend: "Insufficient Data",
      trendText: "⋯ Insufficient Data",
      attemptCount: 0,
      attemptsCount: 0,
      evidenceCount: 0,
      supportThreshold,
      masteryThreshold,
      averagePercentage: 0,
      prerequisitesMastered: options.prerequisitesMastered ?? true,
      hasRepeatedErrors: false,
      requiresRemediation: true,
      isSingleObservation: false,
      gapType: "Insufficient Evidence",
      diagnosis: "Insufficient Evidence — Run Diagnostic Check",
      diagnosisTitle: "Insufficient Evidence — Run Diagnostic Check",
      gapTypeReason: "No recorded assessments exist yet for this concept; recommend a short diagnostic assessment.",
      confidence: 0.50,
      confidenceScore: 0.50,
      confidenceLevel: "Low",
      assessmentsAnalyzed: 0,
      questionsAnalyzed: 0,
      errorPatternDetected: "No recorded assessments exist yet for this concept",
      triggerRule: "No assessment records found; initial baseline diagnostic check required.",
      supportingEvidence: ["Zero recorded assessment history for this concept"],
      questionEvidence: [],
      hasQuestionLevelEvidence: false,
      lowConfidenceDisclaimer: "Insufficient evidence — run a short diagnostic check.",
      recommendedDiagnosticAction: "Conduct an initial diagnostic assessment.",
      isRootGapIdentified: false,
      rootConcept: undefined,
      affectedConcept: { id: conceptId, name: conceptName },
      prerequisiteConcepts: [],
      dependentConcepts: [],
      recommendedLearningOrder: [conceptName],
      learningPath: [],
      rootCauseConfidence: 0.35,
      rootCauseConfidenceLevel: "Low",
      insufficientEvidenceWarning: "Insufficient evidence — run a short prerequisite diagnostic check.",
    };
  }

  // Calculate percentages chronologically
  const percentages = historySortedByDateAsc.map((h) => {
    if (h.maximumMarks <= 0) return 0;
    return Math.round(((h.marksObtained / h.maximumMarks) * 100) * 10) / 10;
  });

  const attemptCount = percentages.length;
  const evidenceCount = historySortedByDateAsc.length;
  const currentScore = percentages[percentages.length - 1];
  const previousScore =
    attemptCount > 1 ? percentages[percentages.length - 2] : undefined;
  const isSingleObservation = attemptCount === 1;
  const averagePercentage = calculateAverage(percentages);

  // Trajectory calculation
  const trajectory = calculateScoreTrajectory(percentages);
  const { trend, scoreDelta, totalDelta, trendText } = trajectory;

  // Recency calculation
  let recencyDays: number | undefined;
  const latestRecord = historySortedByDateAsc[historySortedByDateAsc.length - 1];
  if (latestRecord?.recordedAt) {
    const recordTime = new Date(latestRecord.recordedAt).getTime();
    if (!isNaN(recordTime)) {
      const refTime = options.referenceDate
        ? new Date(options.referenceDate).getTime()
        : Date.now();
      recencyDays = Math.max(0, Math.floor((refTime - recordTime) / (1000 * 60 * 60 * 24)));
    }
  }

  // Detect repeated low performance / error patterns
  const lowAttempts = percentages.filter((p) => p < supportThreshold).length;
  const hasRepeatedErrors =
    options.hasRepeatedErrors ?? (attemptCount >= 2 && lowAttempts >= 2);
  const prerequisitesMastered = options.prerequisitesMastered ?? true;

  // Compute Learning Gap Severity (0–100) using 7 weighted factors
  const severity = calculateGapSeverity({
    conceptId,
    conceptName,
    currentScore,
    previousScore,
    scoreDelta,
    trend,
    attemptCount,
    evidenceCount,
    supportThreshold,
    masteryThreshold,
    prerequisitesMastered,
    hasRepeatedErrors,
    recencyDays,
  });

  // Classify learning gap type & cognitive diagnosis
  const diagnosis = diagnoseLearningGap({
    conceptId,
    conceptName,
    currentScore,
    previousScore,
    scoreDelta,
    trend,
    attemptCount,
    evidenceCount,
    supportThreshold,
    masteryThreshold,
    prerequisitesMastered,
    hasRepeatedErrors,
    recencyDays,
  });

  // Analyze prerequisite dependencies & root cause
  const rootCause = analyzeRootCause({
    affectedConceptId: conceptId,
    affectedConceptName: conceptName,
    studentScore: currentScore,
    prerequisitesMastered,
    errorPattern: diagnosis.errorPatternDetected,
    questionEvidence: diagnosis.questionEvidence,
    attemptCount,
    evidenceCount,
    supportThreshold,
    masteryThreshold,
  });

  // Multi-dimensional Trajectory Evaluation
  let masteryStatus: MasteryStatus;
  let priority: GapPriority;
  let lifecycleStatus: GapLifecycleStatus;
  let reason: string;
  let suggestedAction: string;
  let requiresRemediation: boolean;

  // Trajectory check: Did this student previously achieve or near mastery but is now declining?
  // (e.g. Student B: 90% → 82% → 75%)
  const hasDeclinedFromHigher =
    trend === "Declining" &&
    previousScore !== undefined &&
    (previousScore >= masteryThreshold || (totalDelta !== undefined && totalDelta <= -10));

  // Gap Reopening Evaluation (Section 5):
  // Check if student previously achieved mastery on an earlier assessment and has now meaningfully dropped
  // (e.g. 82% → 85% → 83% → 62%)
  let highestPriorMasteryRecord: typeof historySortedByDateAsc[0] | undefined;
  let highestPriorMasteryPct = -1;

  for (let i = 0; i < historySortedByDateAsc.length - 1; i++) {
    const h = historySortedByDateAsc[i];
    const p = h.maximumMarks > 0 ? (h.marksObtained / h.maximumMarks) * 100 : 0;
    if (p >= masteryThreshold && p > highestPriorMasteryPct) {
      highestPriorMasteryPct = p;
      highestPriorMasteryRecord = h;
    }
  }

  const wasPreviouslyMastered = highestPriorMasteryRecord !== undefined;
  const previousMasteryRecord = highestPriorMasteryRecord;
  const previousMasteryScore = previousMasteryRecord
    ? Math.round(((previousMasteryRecord.marksObtained / previousMasteryRecord.maximumMarks) * 100) * 10) / 10
    : undefined;
  const masteryDate = previousMasteryRecord?.recordedAt;

  // Strict rule: DO NOT reopen a mastered gap because of one isolated error when evidence is insufficient
  const isMeaningfulDecline =
    currentScore < masteryThreshold &&
    (currentScore < supportThreshold ||
      (previousScore !== undefined && previousScore - currentScore >= 8) ||
      hasRepeatedErrors ||
      (trend === "Declining" && attemptCount >= 2));

  const isInsufficientEvidence =
    diagnosis.gapType === "Insufficient Evidence" || attemptCount < 2;

  const isGapReopened = wasPreviouslyMastered && isMeaningfulDecline && !isInsufficientEvidence;

  if (isGapReopened) {
    // ------------------------------------------------------------------------
    // GAP REOPENED: Previously mastered competency has regressed with confirmed evidence
    // ------------------------------------------------------------------------
    masteryStatus = (currentScore < supportThreshold || hasDeclinedFromHigher) ? "Needs Support" : "Developing";
    priority = (currentScore < supportThreshold || hasDeclinedFromHigher) ? "High" : severity.severityLevel;
    lifecycleStatus = "Active Gap";
    requiresRemediation = true;
    const trajectoryPath = percentages.map((p) => `${p}%`).join(" → ");
    const regressionPp = scoreDelta !== undefined && scoreDelta < 0 ? scoreDelta : totalDelta;
    reason = `Performance reflects a declining trajectory (${trajectoryPath}, ${regressionPp} pp regression from prior performance); Gap Reopened: This competency was previously mastered (${previousMasteryScore}% on ${masteryDate ? new Date(masteryDate).toLocaleDateString("en-GB") : "prior assessment"}). Requires teacher attention before conceptual regression deepens.`;
    suggestedAction = `Diagnose and review recently missed questions in ${conceptName} to stop regression, address newly developed misconceptions, and restore confidence.`;
  } else if (currentScore >= masteryThreshold) {
    // ------------------------------------------------------------------------
    // CASE 1: Current Score >= Mastery Threshold (e.g. >= 80%)
    // ------------------------------------------------------------------------
    if (trend === "Declining") {
      // Student is still technically above 80%, but showing negative momentum (e.g. 98% -> 82%)
      masteryStatus = "Mastered";
      priority = "Medium";
      lifecycleStatus = "Monitoring/Developing";
      requiresRemediation = false;
      reason = `Mastery benchmark met (${currentScore}%), but recent downward trend (${trendText}) warrants teacher monitoring to safeguard retention.`;
      suggestedAction = `Review recently missed problem types in ${conceptName} to prevent further regression.`;
    } else {
      masteryStatus = "Mastered";
      priority = "Low";
      lifecycleStatus = "Closed Gap";
      requiresRemediation = false;
      if (isSingleObservation) {
        reason = `Student achieved ${currentScore}% on the single recorded assessment. Note: This is an initial single observation.`;
        suggestedAction = `Confirm mastery through regular classroom review or periodic reassessment.`;
      } else if (scoreDelta !== undefined && scoreDelta > 0) {
        reason = `Concept successfully mastered (${currentScore}%), showing an improvement of +${scoreDelta} percentage points from previous session.`;
        suggestedAction = `Ready for advanced application exercises or next curriculum topic.`;
      } else {
        reason = `Consistently demonstrated mastery (${currentScore}%) above the ${masteryThreshold}% threshold.`;
        suggestedAction = `Maintain periodic revision; ready for next grade-level concept.`;
      }
    }
  } else if (currentScore >= supportThreshold) {
    // ------------------------------------------------------------------------
    // CASE 2: Developing Range (supportThreshold <= currentScore < masteryThreshold, e.g. 60-79%)
    // ------------------------------------------------------------------------
    if (hasDeclinedFromHigher) {
      // STUDENT B SCENARIO (90% → 82% → 75%):
      // Score is 75%, but trajectory is declining from mastery -> Needs Attention / Support!
      masteryStatus = "Needs Support";
      priority = severity.severityLevel === "Critical" ? "Critical" : "High";
      lifecycleStatus = "Active Gap";
      requiresRemediation = true;
      const trajectoryPath = percentages.map((p) => `${p}%`).join(" → ");
      reason = `Performance reflects a declining trajectory (${trajectoryPath}, ${scoreDelta !== undefined && scoreDelta < 0 ? scoreDelta : totalDelta} pp regression from prior performance); requires teacher attention before conceptual regression deepens.`;
      suggestedAction = `Diagnose and review recently missed questions in ${conceptName} to stop regression and restore confidence.`;
    } else if (trend === "Improving") {
      // STUDENT A SCENARIO (55% → 65% → 75%):
      // Score is 75%, trajectory is upward -> Improving/Developing!
      masteryStatus = "Developing";
      priority = currentScore >= 75 ? "Low" : "Medium";
      lifecycleStatus = "Monitoring/Developing";
      requiresRemediation = false;
      const trajectoryPath = percentages.map((p) => `${p}%`).join(" → ");
      reason = `Student is progressing on an upward trajectory (${trajectoryPath}, +${scoreDelta ?? totalDelta} pp gain) and developing toward the ${masteryThreshold}% mastery benchmark.`;
      suggestedAction = `Continue guided practice and problem sets to reinforce conceptual consistency toward mastery.`;
    } else if (trend === "Declining") {
      // Minor decline within developing zone (e.g. 74% -> 66%)
      masteryStatus = "Developing";
      priority = "High";
      lifecycleStatus = "Active Gap";
      requiresRemediation = true;
      const drop = Math.abs(scoreDelta || 0);
      reason = `Student scored ${currentScore}% (Developing), but performance has slipped by ${drop} percentage points compared to earlier attempts.`;
      suggestedAction = `Review recently missed questions in ${conceptName} to prevent concepts from slipping below support threshold.`;
    } else {
      // Stable or single observation in developing
      masteryStatus = "Developing";
      priority = severity.severityLevel === "Low" ? "Low" : "Medium";
      lifecycleStatus = "Monitoring/Developing";
      requiresRemediation = true;
      if (isSingleObservation) {
        reason = `Student has grasped core basics (${currentScore}%), but has not yet met the mastery threshold of ${masteryThreshold}%.`;
      } else {
        reason = `Performance (${currentScore}%) has remained stable in the developing range (${trendText}); targeted practice needed to cross the ${masteryThreshold}% benchmark.`;
      }
      suggestedAction = `Provide guided practice with slightly varied problem sets to reinforce conceptual consistency.`;
    }
  } else {
    // ------------------------------------------------------------------------
    // CASE 3: Needs Support Range (currentScore < supportThreshold, e.g. < 60%)
    // ------------------------------------------------------------------------
    masteryStatus = "Needs Support";
    lifecycleStatus = "Active Gap";
    requiresRemediation = true;

    if (currentScore < 30) {
      priority = "Critical";
      reason = `Assessment performance (${currentScore}%) reflects severe foundational difficulty requiring immediate, intensive concrete intervention.`;
      suggestedAction = `Immediate 1-on-1 diagnostic with zero-cost tangible manipulatives (pebbles/counters) on ${conceptName} prerequisite basics.`;
    } else if (hasRepeatedErrors || (trend === "Declining" && previousScore !== undefined)) {
      priority = severity.severityLevel === "Critical" ? "Critical" : "High";
      const trajectoryPath = percentages.length > 1 ? ` (${percentages.map((p) => `${p}%`).join(" → ")})` : "";
      reason = `Assessment performance (${currentScore}%) is below the configured support threshold (${supportThreshold}%)${trajectoryPath}, showing persistent difficulty requiring structured remediation.`;
      suggestedAction = `Assign focused small-group remedial practice on ${conceptName} fundamentals, using visual manipulatives or physical objects.`;
    } else if (trend === "Improving") {
      // Improving from very low (e.g. 25% -> 48%)
      priority = "Medium";
      reason = `Score (${currentScore}%) remains below support threshold (${supportThreshold}%), but student is showing positive upward recovery (${trendText}).`;
      suggestedAction = `Continue structured remedial practice to build on recent improvement momentum.`;
    } else {
      priority = currentScore < 50 ? "High" : severity.severityLevel;
      reason = `Assessment score (${currentScore}%) indicates foundational conceptual confusion below the ${supportThreshold}% threshold.`;
      suggestedAction = `Assign structured remedial practice worksheets on ${conceptName} and review progress after 2 practice sessions.`;
    }
  }

  // --------------------------------------------------------------------------
  // Dimension Modifiers: Prerequisite Mastery & Recency
  // --------------------------------------------------------------------------
  if (!prerequisitesMastered) {
    reason += ` Foundational prerequisite concepts have not yet achieved mastery, which may be contributing to this roadblock.`;
    suggestedAction = `Address prerequisite concepts before advancing to multi-step ${conceptName} problems.`;
    if (priority === "Low") {
      priority = "Medium";
    }
  }

  if (recencyDays !== undefined && recencyDays > 45) {
    reason += ` (Evidence recorded ${recencyDays} days ago; a brief progress check is recommended).`;
  }

  // If insufficient evidence was detected, recommend short diagnostic exit ticket rather than full remediation
  if (diagnosis.gapType === "Insufficient Evidence" && currentScore < masteryThreshold) {
    suggestedAction =
      diagnosis.recommendedDiagnosticAction ||
      "Conduct a short 3-5 item diagnostic exit ticket with concrete physical manipulatives before prescribing full remediation.";
  }

  // Build Longitudinal Assessment History (Section 3 & 4)
  const assessmentHistory = historySortedByDateAsc.map((h, idx) => {
    const score = Math.round(((h.marksObtained / h.maximumMarks) * 100) * 10) / 10;
    const prevScore =
      idx > 0
        ? Math.round(((historySortedByDateAsc[idx - 1].marksObtained / historySortedByDateAsc[idx - 1].maximumMarks) * 100) * 10) / 10
        : undefined;
    const delta = prevScore !== undefined ? Math.round((score - prevScore) * 10) / 10 : undefined;
    const status: MasteryStatus =
      score >= masteryThreshold ? "Mastered" : score >= supportThreshold ? "Developing" : "Needs Support";
    const assessmentTitle =
      idx === 0
        ? "Initial Assessment"
        : idx === historySortedByDateAsc.length - 1
        ? "Latest Reassessment"
        : `Progress Check #${idx}`;

    return {
      date: h.recordedAt,
      score,
      marks: `${h.marksObtained}/${h.maximumMarks}`,
      assessment: assessmentTitle,
      intervention: idx > 0 ? "Targeted Remedial Practice" : undefined,
      status,
      scoreDelta: delta,
    };
  });

  const totalImprovement =
    attemptCount >= 2 ? Math.round((currentScore - percentages[0]) * 10) / 10 : 0;
  const latestScoreDelta = scoreDelta;
  const numberOfAssessments = attemptCount;
  const numberOfInterventions = options?.remedialPlanId ? 1 : attemptCount > 2 ? 1 : 0;
  const timeToMastery =
    currentScore >= masteryThreshold && historySortedByDateAsc[0]?.recordedAt && latestRecord?.recordedAt
      ? `${Math.max(1, Math.round((new Date(latestRecord.recordedAt).getTime() - new Date(historySortedByDateAsc[0].recordedAt).getTime()) / (1000 * 60 * 60 * 24)))} days`
      : undefined;

  return {
    conceptId,
    conceptName,
    masteryStatus,
    gapStatus: masteryStatus,
    priority,
    lifecycleStatus,
    reason,
    suggestedAction,
    currentScore,
    latestPercentage: currentScore,
    previousScore,
    previousPercentage: previousScore,
    scoreDelta,
    deltaPercentagePoints: scoreDelta,
    totalDelta,
    trend,
    trendText,
    attemptCount,
    attemptsCount: attemptCount,
    evidenceCount,
    supportThreshold,
    masteryThreshold,
    averagePercentage,
    recencyDays,
    prerequisitesMastered,
    hasRepeatedErrors,
    requiresRemediation,
    isSingleObservation,
    severityScore: severity.severityScore,
    severityLevel: priority,
    severityReasons: severity.severityReasons,
    severityBreakdown: severity.breakdown,
    diagnosis: diagnosis.diagnosis,
    diagnosisTitle: diagnosis.diagnosisTitle,
    gapType: diagnosis.gapType,
    gapTypeReason: diagnosis.gapTypeReason,
    confidence: diagnosis.confidence,
    confidenceScore: diagnosis.confidenceScore,
    confidenceLevel: diagnosis.confidenceLevel,
    assessmentsAnalyzed: diagnosis.assessmentsAnalyzed,
    questionsAnalyzed: diagnosis.questionsAnalyzed,
    errorPatternDetected: diagnosis.errorPatternDetected,
    triggerRule: diagnosis.triggerRule,
    supportingEvidence: diagnosis.supportingEvidence,
    questionEvidence: diagnosis.questionEvidence,
    hasQuestionLevelEvidence: diagnosis.hasQuestionLevelEvidence,
    lowConfidenceDisclaimer: diagnosis.lowConfidenceDisclaimer,
    recommendedDiagnosticAction: diagnosis.recommendedDiagnosticAction,
    isRootGapIdentified: rootCause.isRootGapIdentified,
    rootConcept: rootCause.rootConcept,
    affectedConcept: rootCause.affectedConcept,
    prerequisiteConcepts: rootCause.prerequisiteConcepts,
    dependentConcepts: rootCause.dependentConcepts,
    recommendedLearningOrder: rootCause.recommendedLearningOrder,
    learningPath: rootCause.learningPath,
    rootCauseConfidence: rootCause.rootCauseConfidence,
    rootCauseConfidenceLevel: rootCause.rootCauseConfidenceLevel,
    rootCauseExplanation: rootCause.rootCauseExplanation,
    insufficientEvidenceWarning: rootCause.insufficientEvidenceWarning,
    gapReopened: isGapReopened,
    previousMasteryScore,
    masteryDate,
    assessmentHistory,
    totalImprovement,
    latestScoreDelta,
    numberOfAssessments,
    numberOfInterventions,
    timeToMastery,
  };
}

/**
 * Evaluates student assessment history for a specific concept
 * and detects learning gaps with full explainability.
 * Wraps evaluateStudentGapTrajectory for backwards compatibility.
 */
export function detectLearningGap(
  conceptId: string,
  conceptName: string,
  historySortedByDateAsc: {
    marksObtained: number;
    maximumMarks: number;
    recordedAt?: string;
  }[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
  options?: GapDetectionOptions
): GapDetectionResult {
  return evaluateStudentGapTrajectory({
    conceptId,
    conceptName,
    historySortedByDateAsc,
    thresholds,
    options,
  });
}
