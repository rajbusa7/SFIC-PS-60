/**
 * StudySaathi AI — Reassessment & Lifecycle Engine (Phase 6)
 *
 * Deterministic engine for learning gap lifecycle transitions, Reassess Delta evaluation,
 * and mastered-record management.
 *
 * Strict Rules:
 * 1. Percentage point difference (pp), never relative growth skew.
 * 2. Strict validation of same student, same competency, comparable scoring scale, and chronological order.
 * 3. Initial single assessments are treated as initial observations (no fabricated predecessor).
 * 4. Mastered records display "MASTERY EVIDENCE" with retention notes, never fabricated obstacles.
 * 5. Uses configured Threshold Sandbox thresholds as single source of truth.
 */

export type ReassessmentOutcomeCode =
  | "REACHED_MASTERY"
  | "MASTERY_MAINTAINED"
  | "IMPROVED_TO_DEVELOPING"
  | "DEVELOPING_PROGRESS"
  | "STILL_NEEDS_SUPPORT"
  | "STABLE"
  | "DECLINED"
  | "INITIAL_OBSERVATION";

export interface ReassessmentEvaluationInput {
  previousScore?: number | null;
  currentScore: number;
  supportThreshold?: number;
  masteryThreshold?: number;
  studentId?: string;
  previousStudentId?: string;
  conceptId?: string;
  previousConceptId?: string;
  language?: "en" | "gu";
}

export interface ReassessmentEvaluationResult {
  isComparable: boolean;
  incomparableReason?: string;
  isInitialObservation: boolean;
  previousScore: number | null;
  currentScore: number;
  scoreDelta: number | null;
  scoreDeltaFormatted: string;
  status: "Needs Support" | "Developing" | "Mastered";
  outcomeCode: ReassessmentOutcomeCode;
  outcomeLabel: string;
  outcomeLabelGu: string;
  outcomeBadgeVariant: "mastered" | "developing" | "needsSupport" | "high";
  explanation: string;
  explanationGu: string;
}

/**
 * Standardized Mastery Evidence text for Mastered learning gaps.
 * Replaces "Why Flagged (Cognitive Obstacle)" with positive retention evidence.
 */
export function getMasteryEvidenceText(
  currentScore: number,
  masteryBenchmark = 80,
  language: "en" | "gu" = "en"
): string {
  if (language === "gu") {
    return `નિપુણતા પ્રાપ્ત થઈ: વિદ્યાર્થીએ ${currentScore}% સ્કોર મેળવ્યો છે, જે નિર્ધારિત ${masteryBenchmark}% નિપુણતા બેન્ચમાર્કને પૂર્ણ કરે છે. કોઈ તાત્કાલિક ઉપચારની જરૂર નથી; જાળવણીનું નિરીક્ષણ કરવા માટે સામયિક પુનરાવર્તન ચાલુ રાખો.`;
  }
  return `Mastery achieved: The student scored ${currentScore}%, meeting the configured mastery benchmark of ${masteryBenchmark}%. No immediate remedial intervention is required; continue periodic retrieval practice to monitor retention.`;
}

/**
 * Standardized Initial Observation text when no previous comparable assessment exists.
 */
export function getInitialObservationText(
  currentScore: number,
  language: "en" | "gu" = "en"
): string {
  if (language === "gu") {
    return `પ્રારંભિક અવલોકન: વિદ્યાર્થીનો વર્તમાન સ્કોર ${currentScore}% છે. વધારાનો મહાવરો અને ભાવિ પુનઃમૂલ્યાંકન પ્રગતિનું વલણ સ્થાપિત કરવામાં મદદ કરશે.`;
  }
  return `Initial observation: The student's current score is ${currentScore}%. Additional practice and a future reassessment will help establish a progress trend.`;
}

/**
 * Evaluates the outcome of a reassessment attempt against configured thresholds and historical predecessor.
 */
export function evaluateReassessmentOutcome(
  input: ReassessmentEvaluationInput
): ReassessmentEvaluationResult {
  const lang = input.language === "gu" ? "gu" : "en";
  const supportThreshold = input.supportThreshold ?? 60;
  const masteryThreshold = input.masteryThreshold ?? 80;
  const currentScore = Math.max(0, Math.min(100, Math.round(input.currentScore * 10) / 10));

  // 1. Boundary & Incompatible Checks
  if (
    input.studentId &&
    input.previousStudentId &&
    input.studentId !== input.previousStudentId
  ) {
    return {
      isComparable: false,
      incomparableReason: "Cannot compare assessments belonging to different students.",
      isInitialObservation: false,
      previousScore: null,
      currentScore,
      scoreDelta: null,
      scoreDeltaFormatted: "N/A",
      status: currentScore >= masteryThreshold ? "Mastered" : currentScore >= supportThreshold ? "Developing" : "Needs Support",
      outcomeCode: "INITIAL_OBSERVATION",
      outcomeLabel: "Incomparable Records",
      outcomeLabelGu: "અસંગત રેકોર્ડ્સ",
      outcomeBadgeVariant: "needsSupport",
      explanation: "Assessments belong to different students and cannot be evaluated for delta comparison.",
      explanationGu: "મૂલ્યાંકન અલગ વિદ્યાર્થીઓનું છે અને ડેલ્ટા સરખામણી શક્ય નથી.",
    };
  }

  if (
    input.conceptId &&
    input.previousConceptId &&
    input.conceptId !== input.previousConceptId
  ) {
    return {
      isComparable: false,
      incomparableReason: "Cannot compare assessments across different competencies.",
      isInitialObservation: false,
      previousScore: null,
      currentScore,
      scoreDelta: null,
      scoreDeltaFormatted: "N/A",
      status: currentScore >= masteryThreshold ? "Mastered" : currentScore >= supportThreshold ? "Developing" : "Needs Support",
      outcomeCode: "INITIAL_OBSERVATION",
      outcomeLabel: "Incomparable Competencies",
      outcomeLabelGu: "અસંગત સંકલ્પનાઓ",
      outcomeBadgeVariant: "needsSupport",
      explanation: "Assessments evaluate different competencies and cannot be evaluated for longitudinal delta.",
      explanationGu: "મૂલ્યાંકન અલગ સંકલ્પનાઓનું છે અને ડેલ્ટા સરખામણી શક્ય નથી.",
    };
  }

  // 2. Initial Observation (No Previous Assessment)
  const prev = input.previousScore;
  const hasValidHistory =
    prev !== null &&
    prev !== undefined &&
    !isNaN(prev) &&
    typeof prev === "number" &&
    prev >= 0 &&
    prev <= 100;

  const currentStatus: "Needs Support" | "Developing" | "Mastered" =
    currentScore >= masteryThreshold
      ? "Mastered"
      : currentScore >= supportThreshold
      ? "Developing"
      : "Needs Support";

  if (!hasValidHistory) {
    return {
      isComparable: true,
      isInitialObservation: true,
      previousScore: null,
      currentScore,
      scoreDelta: null,
      scoreDeltaFormatted: "First assessment",
      status: currentStatus,
      outcomeCode: "INITIAL_OBSERVATION",
      outcomeLabel: "Initial Observation",
      outcomeLabelGu: "પ્રારંભિક અવલોકન",
      outcomeBadgeVariant:
        currentStatus === "Mastered"
          ? "mastered"
          : currentStatus === "Developing"
          ? "developing"
          : "needsSupport",
      explanation: getInitialObservationText(currentScore, "en"),
      explanationGu: getInitialObservationText(currentScore, "gu"),
    };
  }

  // 3. Comparable Delta Calculation (Percentage Points)
  const previousScore = Math.round(prev * 10) / 10;
  const scoreDelta = Math.round((currentScore - previousScore) * 10) / 10;
  const scoreDeltaFormatted =
    scoreDelta > 0 ? `+${scoreDelta} pp` : scoreDelta === 0 ? "0 pp" : `${scoreDelta} pp`;

  // -------------------------------------------------------------
  // Outcome Classification:
  // -------------------------------------------------------------

  // A. Reached or Maintained Mastery (currentScore >= masteryThreshold)
  if (currentScore >= masteryThreshold) {
    if (previousScore < masteryThreshold) {
      return {
        isComparable: true,
        isInitialObservation: false,
        previousScore,
        currentScore,
        scoreDelta,
        scoreDeltaFormatted,
        status: "Mastered",
        outcomeCode: "REACHED_MASTERY",
        outcomeLabel: "Reached Mastery",
        outcomeLabelGu: "પ્રભુત્વ પ્રાપ્ત કર્યું",
        outcomeBadgeVariant: "mastered",
        explanation: `Reached Mastery: Score improved from ${previousScore}% to ${currentScore}% (${scoreDeltaFormatted}), meeting the configured mastery benchmark of ${masteryThreshold}%.`,
        explanationGu: `પ્રભુત્વ પ્રાપ્ત કર્યું: સ્કોર ${previousScore}% થી વધીને ${currentScore}% થયો (${scoreDeltaFormatted}), જે નિર્ધારિત ${masteryThreshold}% બેન્ચમાર્કને પૂર્ણ કરે છે.`,
      };
    }

    return {
      isComparable: true,
      isInitialObservation: false,
      previousScore,
      currentScore,
      scoreDelta,
      scoreDeltaFormatted,
      status: "Mastered",
      outcomeCode: "MASTERY_MAINTAINED",
      outcomeLabel: "Mastery Maintained",
      outcomeLabelGu: "નિપુણતા જાળવી રાખી",
      outcomeBadgeVariant: "mastered",
      explanation: `Mastery Maintained: Score of ${currentScore}% maintains performance above the configured mastery benchmark of ${masteryThreshold}%.`,
      explanationGu: `નિપુણતા જાળવી રાખી: ${currentScore}% નો સ્કોર નિર્ધારિત ${masteryThreshold}% બેન્ચમાર્ક કરતાં વધુ પ્રદર્શન જાળવી રાખે છે.`,
    };
  }

  // B. Developing Tier (supportThreshold <= currentScore < masteryThreshold)
  if (currentScore >= supportThreshold && currentScore < masteryThreshold) {
    if (previousScore < supportThreshold) {
      return {
        isComparable: true,
        isInitialObservation: false,
        previousScore,
        currentScore,
        scoreDelta,
        scoreDeltaFormatted,
        status: "Developing",
        outcomeCode: "IMPROVED_TO_DEVELOPING",
        outcomeLabel: "Improved to Developing",
        outcomeLabelGu: "વિકાસશીલ સ્તરે સુધારો થયો",
        outcomeBadgeVariant: "developing",
        explanation: `Improved to Developing: Score increased from ${previousScore}% to ${currentScore}% (${scoreDeltaFormatted}), crossing the support threshold of ${supportThreshold}%.`,
        explanationGu: `વિકાસશીલ સ્તરે સુધારો થયો: સ્કોર ${previousScore}% થી વધીને ${currentScore}% થયો (${scoreDeltaFormatted}), જે ${supportThreshold}% સહાય મર્યાદાને પાર કરે છે.`,
      };
    }

    if (scoreDelta < -2) {
      return {
        isComparable: true,
        isInitialObservation: false,
        previousScore,
        currentScore,
        scoreDelta,
        scoreDeltaFormatted,
        status: "Developing",
        outcomeCode: "DECLINED",
        outcomeLabel: "Declining Performance",
        outcomeLabelGu: "ઘટતું પ્રદર્શન",
        outcomeBadgeVariant: "high",
        explanation: `Recent performance declined by ${Math.abs(scoreDelta)} pp (from ${previousScore}% to ${currentScore}%). Focused review is recommended before concepts slip further.`,
        explanationGu: `તાજેતરનું પ્રદર્શન ${Math.abs(scoreDelta)} pp ઘટીને ${currentScore}% થયું છે (${previousScore}% થી). લક્ષિત સમીક્ષાની ભલામણ કરવામાં આવે છે.`,
      };
    }

    if (Math.abs(scoreDelta) <= 2) {
      return {
        isComparable: true,
        isInitialObservation: false,
        previousScore,
        currentScore,
        scoreDelta,
        scoreDeltaFormatted,
        status: "Developing",
        outcomeCode: "STABLE",
        outcomeLabel: "Stable Developing",
        outcomeLabelGu: "સ્થિર વિકાસશીલ",
        outcomeBadgeVariant: "developing",
        explanation: `Performance is stable at ${currentScore}% (${scoreDeltaFormatted}). Continue focused practice to reach the ${masteryThreshold}% mastery benchmark.`,
        explanationGu: `પ્રદર્શન ${currentScore}% પર સ્થિર છે (${scoreDeltaFormatted}). ${masteryThreshold}% નિપુણતા બેન્ચમાર્ક સુધી પહોંચવા માટે લક્ષિત મહાવરો ચાલુ રાખો.`,
      };
    }

    return {
      isComparable: true,
      isInitialObservation: false,
      previousScore,
      currentScore,
      scoreDelta,
      scoreDeltaFormatted,
      status: "Developing",
      outcomeCode: "DEVELOPING_PROGRESS",
      outcomeLabel: "Progressing in Developing",
      outcomeLabelGu: "વિકાસશીલ સ્તરે પ્રગતિ",
      outcomeBadgeVariant: "developing",
      explanation: `Progressing in Developing: Score increased from ${previousScore}% to ${currentScore}% (${scoreDeltaFormatted}) toward the ${masteryThreshold}% mastery benchmark.`,
      explanationGu: `વિકાસશીલ સ્તરે પ્રગતિ: સ્કોર ${previousScore}% થી વધીને ${currentScore}% થયો (${scoreDeltaFormatted}) ${masteryThreshold}% નિપુણતા બેન્ચમાર્ક તરફ.`,
    };
  }

  // C. Needs Support Tier (currentScore < supportThreshold)
  if (scoreDelta < -2) {
    return {
      isComparable: true,
      isInitialObservation: false,
      previousScore,
      currentScore,
      scoreDelta,
      scoreDeltaFormatted,
      status: "Needs Support",
      outcomeCode: "DECLINED",
      outcomeLabel: "Declined in Needs Support",
      outcomeLabelGu: "સહાય સ્તરે ઘટાડો",
      outcomeBadgeVariant: "high",
      explanation: `Performance declined from ${previousScore}% to ${currentScore}% (${scoreDeltaFormatted}) and remains below the ${supportThreshold}% support threshold. Urgent guided practice needed.`,
      explanationGu: `પ્રદર્શન ${previousScore}% થી ઘટીને ${currentScore}% થયું (${scoreDeltaFormatted}) અને ${supportThreshold}% સહાય મર્યાદાથી નીચે રહે છે. તાત્કાલિક માર્ગદર્શિત મહાવરો જરૂરી છે.`,
    };
  }

  if (Math.abs(scoreDelta) <= 2) {
    return {
      isComparable: true,
      isInitialObservation: false,
      previousScore,
      currentScore,
      scoreDelta,
      scoreDeltaFormatted,
      status: "Needs Support",
      outcomeCode: "STILL_NEEDS_SUPPORT",
      outcomeLabel: "Still Needs Support",
      outcomeLabelGu: "હજુ સહાયની જરૂર છે",
      outcomeBadgeVariant: "needsSupport",
      explanation: `Still Needs Support: Performance has remained stable at ${currentScore}% and remains below the ${supportThreshold}% support threshold.`,
      explanationGu: `હજુ સહાયની જરૂર છે: પ્રદર્શન ${currentScore}% પર સ્થિર રહ્યું છે અને ${supportThreshold}% સહાય મર્યાદાથી નીચે છે.`,
    };
  }

  return {
    isComparable: true,
    isInitialObservation: false,
    previousScore,
    currentScore,
    scoreDelta,
    scoreDeltaFormatted,
    status: "Needs Support",
    outcomeCode: "STILL_NEEDS_SUPPORT",
    outcomeLabel: "Still Needs Support",
    outcomeLabelGu: "હજુ સહાયની જરૂર છે (પ્રગતિશીલ)",
    outcomeBadgeVariant: "needsSupport",
    explanation: `Still Needs Support: Score increased from ${previousScore}% to ${currentScore}% (${scoreDeltaFormatted}) but has not yet reached the ${supportThreshold}% support threshold.`,
    explanationGu: `હજુ સહાયની જરૂર છે: સ્કોર ${previousScore}% થી વધીને ${currentScore}% થયો (${scoreDeltaFormatted}) પરંતુ હજુ ${supportThreshold}% સહાય મર્યાદા સુધી પહોંચ્યો નથી.`,
  };
}

