/**
 * StudySaathi AI — Intervention Effectiveness Engine (Phase 6)
 *
 * Tracks, aggregates, and benchmarks pedagogical intervention outcomes across classrooms:
 * - Records pre- and post-intervention assessment scores.
 * - Calculates true percentage-point growth.
 * - Formulates evidence-based feedback loops for pedagogical prescriptions without causal claims.
 *
 * STRICT GUIDELINES:
 * - NEVER state: "This intervention causes +17% improvement."
 * - ALWAYS state: "Average observed improvement after this intervention: +17 percentage points."
 * - If fewer than 2 records exist: explicitly return "Insufficient historical evidence".
 * - Never fabricate effectiveness values.
 */

import type {
  InterventionRecord,
  InterventionEffectivenessSummary,
} from "../../../packages/shared/src/types/gap";

/**
 * Calculates intervention effectiveness metrics from authentic recorded interventions
 */
export function calculateInterventionEffectiveness(
  records: InterventionRecord[],
  filter?: {
    conceptId?: string;
    conceptName?: string;
    subjectCode?: string;
    interventionType?: string;
  }
): InterventionEffectivenessSummary[] {
  let filtered = records || [];

  if (filter?.conceptId) {
    filtered = filtered.filter((r) => r.conceptId === filter.conceptId);
  }
  if (filter?.subjectCode) {
    filtered = filtered.filter((r) => r.subjectCode === filter.subjectCode);
  }
  if (filter?.interventionType) {
    filtered = filtered.filter(
      (r) => r.interventionType.toLowerCase() === filter.interventionType?.toLowerCase()
    );
  }

  // Group by interventionType
  const grouped = new Map<string, InterventionRecord[]>();
  for (const record of filtered) {
    const key = record.interventionType || "General Manipulatives";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(record);
  }

  const summaries: InterventionEffectivenessSummary[] = [];

  grouped.forEach((groupRecords, type) => {
    const count = groupRecords.length;
    const deltas = groupRecords.map((r) => r.scoreDelta);
    const sumDelta = deltas.reduce((a, b) => a + b, 0);
    const avgDelta = count > 0 ? Math.round((sumDelta / count) * 10) / 10 : 0;

    const masteryCount = groupRecords.filter(
      (r) => r.outcome === "Mastered" || r.postInterventionScore >= 80
    ).length;
    const masteryRate = count > 0 ? Math.round((masteryCount / count) * 100) : 0;

    const totalDuration = groupRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    const avgDuration = count > 0 ? Math.round(totalDuration / count) : 0;

    const associatedConcepts = Array.from(
      new Set(groupRecords.map((r) => r.conceptName).filter(Boolean))
    );

    const hasSufficientEvidence = count >= 2;
    const evidenceConfidence =
      count >= 10 ? "High" : count >= 2 ? "Moderate" : "Insufficient";

    // Strictly non-causal wording formulation
    const recommendedWording = hasSufficientEvidence
      ? `Average observed improvement after this intervention: +${avgDelta} percentage points across ${count} recorded observations (${masteryRate}% mastery rate).`
      : "Insufficient historical evidence";

    const sampleObservationText = hasSufficientEvidence
      ? `${type} has previously been associated with stronger improvement for similar gaps in this dataset (Average observed improvement after this intervention: +${avgDelta} percentage points across ${count} observations).`
      : "Insufficient historical evidence to determine empirical effectiveness.";

    summaries.push({
      interventionType: type,
      timesUsed: count,
      averageObservedImprovement: avgDelta,
      masteryCount,
      masteryRate,
      masteryAchievementRate: masteryRate,
      averageDurationMinutes: avgDuration,
      associatedConcepts,
      sampleObservationText,
      evidenceConfidence,
      hasSufficientEvidence,
      recommendedWording,
      nonCausalStatement: recommendedWording,
    });
  });

  // Sort descending by timesUsed then by averageObservedImprovement
  return summaries.sort((a, b) => {
    if (b.timesUsed !== a.timesUsed) return b.timesUsed - a.timesUsed;
    return b.averageObservedImprovement - a.averageObservedImprovement;
  });
}

/**
 * Recommendation feedback loop: derives historical insight for a specific prescription
 */
export function getInterventionFeedbackForPrescription(
  interventionType: string,
  conceptName: string,
  records: InterventionRecord[]
): {
  hasHistoricalEvidence: boolean;
  feedbackText: string;
  averageObservedImprovement?: number;
  timesUsed?: number;
} {
  const matchingRecords = records.filter(
    (r) =>
      r.interventionType.toLowerCase() === interventionType.toLowerCase() ||
      interventionType.toLowerCase().includes(r.interventionType.toLowerCase()) ||
      r.interventionType.toLowerCase().includes(interventionType.toLowerCase())
  );

  if (matchingRecords.length < 2) {
    return {
      hasHistoricalEvidence: false,
      timesUsed: matchingRecords.length,
      feedbackText: "Insufficient historical evidence to determine empirical effectiveness.",
    };
  }

  const timesUsed = matchingRecords.length;
  const totalDelta = matchingRecords.reduce((acc, r) => acc + r.scoreDelta, 0);
  const avgDelta = Math.round((totalDelta / timesUsed) * 10) / 10;

  return {
    hasHistoricalEvidence: true,
    timesUsed,
    averageObservedImprovement: avgDelta,
    feedbackText: `${interventionType} activities have previously been associated with stronger improvement for similar ${conceptName} gaps in this dataset (Average observed improvement after this intervention: +${avgDelta} percentage points across ${timesUsed} recorded sessions).`,
  };
}
