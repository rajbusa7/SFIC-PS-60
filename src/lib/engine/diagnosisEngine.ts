import type { ScoreTrend, GapDiagnosisType, ConfidenceLevel, QuestionEvidenceItem } from "../types";

export type { GapDiagnosisType, ConfidenceLevel, QuestionEvidenceItem };

export interface DiagnosisInput {
  conceptId?: string;
  conceptName?: string;
  subjectCode?: string;
  subjectName?: string;
  currentScore: number;
  previousScore?: number;
  scoreDelta?: number;
  trend?: ScoreTrend;
  attemptCount: number;
  evidenceCount: number;
  assessmentsCount?: number;
  questionsCount?: number;
  supportThreshold?: number; // default: 60
  masteryThreshold?: number; // default: 80
  prerequisitesMastered?: boolean;
  hasRepeatedErrors?: boolean;
  repeatedMisconceptions?: string[];
  errorPattern?: string;
  recencyDays?: number;
  questionEvidence?: QuestionEvidenceItem[];
}

export interface DiagnosisResult {
  diagnosis: string;
  diagnosisTitle: string;
  gapType: GapDiagnosisType;
  confidence: number;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  assessmentsAnalyzed: number;
  questionsAnalyzed: number;
  errorPatternDetected: string;
  triggerRule: string;
  gapTypeReason: string;
  supportingEvidence: string[];
  questionEvidence: QuestionEvidenceItem[];
  hasQuestionLevelEvidence: boolean;
  lowConfidenceDisclaimer?: string;
  recommendedDiagnosticAction?: string;
}

/**
 * Maps numeric confidence score to standard 3-tier level.
 * High: >= 0.85
 * Medium: 0.70 - 0.84
 * Low: < 0.70
 */
export function mapConfidenceToLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.70) return "Medium";
  return "Low";
}

/**
 * Deterministic Learning Gap Diagnosis Engine
 *
 * Classifies detected learning gaps into one of six pedagogical categories:
 * 1. Conceptual Gap
 * 2. Procedural Error
 * 3. Careless Slip
 * 4. Language / Comprehension Barrier
 * 5. Prerequisite Gap
 * 6. Insufficient Evidence
 *
 * Returns explainable diagnosis with:
 * - Diagnosis title
 * - Gap type
 * - Confidence score (0.00 - 1.00) & Level (High | Medium | Low)
 * - Assessments analyzed count
 * - Relevant questions analyzed count
 * - Error pattern detected
 * - Trigger rule / threshold explanation
 * - Supporting evidence list
 * - Question-level evidence items (or clear unavailable notice)
 */
export function diagnoseLearningGap(input: DiagnosisInput): DiagnosisResult {
  const {
    conceptId = "",
    conceptName = "",
    subjectCode = "",
    subjectName = "",
    currentScore,
    previousScore,
    scoreDelta,
    trend = "Insufficient Data",
    attemptCount,
    evidenceCount,
    assessmentsCount,
    questionsCount,
    supportThreshold = 60,
    masteryThreshold = 80,
    prerequisitesMastered = true,
    hasRepeatedErrors = false,
    repeatedMisconceptions = [],
    errorPattern = "",
    questionEvidence = [],
  } = input;

  const conceptLower = (conceptName + " " + conceptId).trim().toLowerCase();
  const subjectLower = (subjectName + " " + subjectCode).trim().toLowerCase();
  const patternLower = (
    errorPattern +
    " " +
    repeatedMisconceptions.join(" ")
  ).trim().toLowerCase();

  const assessmentsAnalyzed = Math.max(1, assessmentsCount || evidenceCount || attemptCount || 1);
  const questionsAnalyzed = questionsCount && questionsCount > 0 ? questionsCount : assessmentsAnalyzed * 5;

  // Determine trigger rule explanation
  let triggerRule: string;
  if (currentScore < supportThreshold) {
    if (attemptCount >= 2) {
      const trajectoryText = previousScore !== undefined ? ` (${previousScore}% → ${currentScore}%)` : "";
      triggerRule = `Score (${currentScore}%) fell below ${supportThreshold}% developing support threshold across ${attemptCount} consecutive assessments${trajectoryText}.`;
    } else {
      triggerRule = `Score (${currentScore}%) fell below ${supportThreshold}% developing support threshold on initial assessment.`;
    }
  } else if (trend === "Declining" && previousScore !== undefined && previousScore >= masteryThreshold) {
    triggerRule = `Performance slipped from verified mastery (${previousScore}% → ${currentScore}%, ${scoreDelta ?? 0} pp drop), triggering regression safeguarding.`;
  } else if (currentScore >= supportThreshold && currentScore < masteryThreshold) {
    triggerRule = `Score (${currentScore}%) is within developing range (below ${masteryThreshold}% mastery benchmark).`;
  } else {
    triggerRule = `Score (${currentScore}%) meets or exceeds ${masteryThreshold}% mastery benchmark.`;
  }

  // --------------------------------------------------------------------------
  // Rule 1: Prerequisite Gap
  // If foundational prerequisite competencies are unmastered, the roadblock
  // is structurally rooted in missing prior building blocks.
  // --------------------------------------------------------------------------
  if (prerequisitesMastered === false) {
    const confidenceScore = 0.92;
    const confidenceLevel = mapConfidenceToLevel(confidenceScore);
    const evidence: string[] = [
      "Foundational prerequisite competencies flagged as unmastered in learning sequence",
      `Current performance (${currentScore}%) is impeded by gaps in preceding curricular standards`,
      "Higher-order problem attempts stall during initial problem setup phase",
    ];
    if (patternLower.length > 0) {
      evidence.push(`Observed difficulty pattern: ${patternLower}`);
    }

    const errorPatternDetected =
      errorPattern ||
      "Unmastered foundational prerequisite competencies stalling multi-step problem execution";

    return {
      diagnosis: `Prerequisite Gap in ${conceptName || "Foundational Skills"}`,
      diagnosisTitle: `Prerequisite Gap in ${conceptName || "Foundational Skills"}`,
      gapType: "Prerequisite Gap",
      confidence: confidenceScore,
      confidenceScore,
      confidenceLevel,
      assessmentsAnalyzed,
      questionsAnalyzed,
      errorPatternDetected,
      triggerRule,
      gapTypeReason: `Student has not yet mastered prerequisite foundational concepts required for ${conceptName || "this topic"}. Advancing to higher-level application without mastering earlier building blocks causes compounding confusion.`,
      supportingEvidence: evidence,
      questionEvidence,
      hasQuestionLevelEvidence: questionEvidence.length > 0,
      recommendedDiagnosticAction: `Conduct an immediate prerequisite skill check on preceding Grade foundational competencies before re-attempting ${conceptName || "this concept"}.`,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 2: Insufficient Evidence
  // A single incorrect answer or isolated single assessment must NEVER be
  // classified automatically as a conceptual gap.
  // If longitudinal evidence is sparse (<= 1 attempt/evidence) without established
  // repeated error patterns or severe prerequisite failure, flag as Insufficient Evidence.
  // --------------------------------------------------------------------------
  const isSparseEvidence =
    (attemptCount <= 1 && evidenceCount <= 1) ||
    attemptCount === 0 ||
    evidenceCount === 0;

  if (isSparseEvidence && !hasRepeatedErrors && patternLower.length === 0) {
    const confidenceScore = 0.62;
    const confidenceLevel = mapConfidenceToLevel(confidenceScore); // "Low"
    const evidence: string[] = [
      `Single assessment observation recorded (${evidenceCount || attemptCount || 1} observation)`,
      "No longitudinal trajectory or repeated error patterns established yet",
      `Score (${currentScore}%) represents an isolated data point that requires verification`,
    ];

    const errorPatternDetected =
      "Single observation baseline; error pattern not yet statistically established across multiple attempts";

    return {
      diagnosis: "Insufficient Evidence — Run Diagnostic Check",
      diagnosisTitle: "Insufficient Evidence — Run Diagnostic Check",
      gapType: "Insufficient Evidence",
      confidence: confidenceScore,
      confidenceScore,
      confidenceLevel,
      assessmentsAnalyzed,
      questionsAnalyzed,
      errorPatternDetected,
      triggerRule,
      gapTypeReason: `Only a single assessment observation is available (${currentScore}%). A single test score is insufficient to distinguish a genuine conceptual gap from a momentary slip; recommend a short 3-5 item diagnostic exit ticket before prescribing full remediation.`,
      supportingEvidence: evidence,
      questionEvidence,
      hasQuestionLevelEvidence: questionEvidence.length > 0,
      lowConfidenceDisclaimer: "Insufficient evidence — run a short diagnostic check.",
      recommendedDiagnosticAction: `Conduct a short 3-5 item diagnostic exit ticket with concrete physical manipulatives to verify whether this represents a persistent misunderstanding.`,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 3: Careless Slip
  // Student previously demonstrated mastery (>= masteryThreshold or high score),
  // but suffered an isolated score dip without persistent misconception patterns.
  // --------------------------------------------------------------------------
  const previouslyMastered =
    previousScore !== undefined && previousScore >= masteryThreshold;
  const isIsolatedDip =
    previouslyMastered &&
    currentScore >= supportThreshold &&
    !hasRepeatedErrors &&
    !patternLower.includes("misconception");

  if (isIsolatedDip) {
    const confidenceScore = 0.86;
    const confidenceLevel = mapConfidenceToLevel(confidenceScore);
    const evidence: string[] = [
      `Prior assessment demonstrated verified mastery (${previousScore}% >= ${masteryThreshold}%)`,
      `Current score (${currentScore}%) reflects an isolated performance dip`,
      "No systemic conceptual misconception or repeated error patterns detected",
    ];
    if (scoreDelta !== undefined && scoreDelta < 0) {
      evidence.push(`Recent score delta: ${scoreDelta} percentage points`);
    }

    const errorPatternDetected =
      "Isolated computation or attentional slip without systemic recurring misconception";

    return {
      diagnosis: `Careless Slip in ${conceptName || "Demonstrated Skill"}`,
      diagnosisTitle: `Careless Slip in ${conceptName || "Demonstrated Skill"}`,
      gapType: "Careless Slip",
      confidence: confidenceScore,
      confidenceScore,
      confidenceLevel,
      assessmentsAnalyzed,
      questionsAnalyzed,
      errorPatternDetected,
      triggerRule,
      gapTypeReason: `Student previously demonstrated mastery (${previousScore}%), but experienced an isolated drop to ${currentScore}%. Absence of repeated misconception patterns indicates a careless computational slip or temporary lapse in focus rather than conceptual breakdown.`,
      supportingEvidence: evidence,
      questionEvidence,
      hasQuestionLevelEvidence: questionEvidence.length > 0,
      recommendedDiagnosticAction: `Review missed questions with the student in a quick 2-minute 1-on-1 check to confirm attentional oversight and reinforce careful checking habits.`,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 4: Language / Comprehension Barrier
  // Linguistic decoding, reading comprehension, grammar syntax, or word problem
  // comprehension is the primary obstacle.
  // --------------------------------------------------------------------------
  const isLanguageSubject =
    subjectLower.includes("eng") ||
    subjectLower.includes("guj") ||
    subjectLower.includes("language") ||
    subjectLower.includes("english") ||
    subjectLower.includes("gujarati");

  const isLanguageTopic =
    conceptLower.includes("comprehension") ||
    conceptLower.includes("reading") ||
    conceptLower.includes("passage") ||
    conceptLower.includes("verb") ||
    conceptLower.includes("grammar") ||
    conceptLower.includes("vocabulary") ||
    conceptLower.includes("sentence") ||
    conceptLower.includes("matra") ||
    conceptLower.includes("conjunct") ||
    conceptLower.includes("word problem") ||
    patternLower.includes("comprehension") ||
    patternLower.includes("decoding") ||
    patternLower.includes("vocabulary") ||
    patternLower.includes("syntax") ||
    patternLower.includes("subject-verb") ||
    patternLower.includes("grammar");

  if (isLanguageSubject || isLanguageTopic) {
    const isSubjectVerbAgreement =
      conceptLower.includes("verb") || patternLower.includes("verb");
    const isReadingComprehension =
      conceptLower.includes("comprehension") ||
      conceptLower.includes("passage") ||
      conceptLower.includes("reading");

    let specificReason: string;
    let specificEvidence: string[];
    let errorPatternDetected: string;

    if (isSubjectVerbAgreement) {
      specificReason = `Student understands the meaning of action verbs but exhibits linguistic confusion in subject-number agreement (singular vs plural grammatical rules).`;
      specificEvidence = [
        "Inconsistent application of singular vs. plural verb inflection rules",
        "Verb action identification is accurate while syntactic agreement fails",
        `Assessment performance (${currentScore}%) reflects syntactic decoding friction`,
      ];
      errorPatternDetected = "Confusion between singular and plural verbs in third-person agreement";
    } else if (isReadingComprehension) {
      specificReason = `Student decodes individual words accurately but struggles with contextual comprehension, inferential meaning, and connecting sentence clauses in short passages.`;
      specificEvidence = [
        "Oral phonetic word reading is fluent while passage question retrieval is impeded",
        "Difficulty identifying main ideas and inferential cause-effect relationships",
        `Performance (${currentScore}%) indicates language comprehension barrier rather than cognitive delay`,
      ];
      errorPatternDetected = "Contextual reading comprehension and multi-sentence clause inferencing barrier";
    } else {
      specificReason = `Primary obstacle stems from linguistic decoding or grammatical syntax in ${conceptName || "language tasks"} rather than mathematical or cognitive reasoning.`;
      specificEvidence = [
        "Linguistic structure and question phrasing impede task execution",
        "Performance improves markedly when question prompts are read aloud or translated into conversational Gujarati/Hindi",
        `Score (${currentScore}%) reflects language comprehension friction`,
      ];
      errorPatternDetected = errorPattern || "Linguistic decoding and syntax barrier in question comprehension";
    }

    if (patternLower.length > 0 && !specificEvidence.some((e) => e.includes(patternLower))) {
      specificEvidence.push(`Error pattern: ${errorPattern || repeatedMisconceptions[0]}`);
    }

    const confidenceScore = 0.89;
    const confidenceLevel = mapConfidenceToLevel(confidenceScore);

    return {
      diagnosis: `Language / Comprehension Barrier in ${conceptName || "Language Syntax"}`,
      diagnosisTitle: `Language / Comprehension Barrier in ${conceptName || "Language Syntax"}`,
      gapType: "Language / Comprehension Barrier",
      confidence: confidenceScore,
      confidenceScore,
      confidenceLevel,
      assessmentsAnalyzed,
      questionsAnalyzed,
      errorPatternDetected,
      triggerRule,
      gapTypeReason: specificReason,
      supportingEvidence: specificEvidence,
      questionEvidence,
      hasQuestionLevelEvidence: questionEvidence.length > 0,
      recommendedDiagnosticAction: `Use bilingual scaffolding (Gujarati/Hindi oral prompts) and graphic organizers with sentence frames to bridge linguistic comprehension.`,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 5: Procedural Error
  // Student grasps the conceptual foundation but makes errors in multi-step execution,
  // column alignment, carrying, borrowing, or algorithmic mechanics.
  // --------------------------------------------------------------------------
  const isProceduralTopic =
    conceptLower.includes("addition") ||
    conceptLower.includes("subtraction") ||
    conceptLower.includes("multiplication") ||
    conceptLower.includes("place value") ||
    conceptLower.includes("regroup") ||
    conceptLower.includes("carry") ||
    conceptLower.includes("borrow") ||
    conceptLower.includes("column") ||
    conceptLower.includes("algorithm") ||
    patternLower.includes("regroup") ||
    patternLower.includes("carry") ||
    patternLower.includes("borrow") ||
    patternLower.includes("alignment") ||
    patternLower.includes("procedural") ||
    patternLower.includes("step");

  if (isProceduralTopic && (currentScore >= 40 || patternLower.includes("regroup") || patternLower.includes("carry"))) {
    const isRegrouping =
      conceptLower.includes("regroup") ||
      conceptLower.includes("place value") ||
      patternLower.includes("regroup") ||
      patternLower.includes("carry");

    const reasonText = isRegrouping
      ? "Student correctly identifies place values but repeatedly fails during column regrouping and carry-over execution."
      : `Student grasps the core conceptual principles of ${conceptName || "the operation"} but repeatedly stumbles during multi-step procedural execution.`;

    const evidence: string[] = isRegrouping
      ? [
          "Student correctly identifies place values but repeatedly fails during regrouping",
          "Single-digit arithmetic operations are accurate while multi-digit carrying sequence breaks down",
          "Errors cluster in column alignment and carrying over into adjacent place-value columns",
        ]
      : [
          `Underlying conceptual meaning of ${conceptName || "the operation"} is understood`,
          "Execution breakdown occurs during multi-step algorithmic sequencing",
          `Demonstrated partial competence (${currentScore}%) with errors localized to procedural steps`,
        ];

    if (patternLower.length > 0 && !evidence.some((e) => e.includes(patternLower))) {
      evidence.push(`Observed execution pattern: ${errorPattern || repeatedMisconceptions[0]}`);
    }

    const errorPatternDetected = isRegrouping
      ? "Carrying from units to tens/hundreds column omitted during column regrouping"
      : (errorPattern || "Algorithmic sequencing and multi-step computational execution breakdown");

    const confidenceScore = 0.89;
    const confidenceLevel = mapConfidenceToLevel(confidenceScore);

    return {
      diagnosis: `Procedural Error in ${conceptName || "Execution Steps"}`,
      diagnosisTitle: `Procedural Error in ${conceptName || "Execution Steps"}`,
      gapType: "Procedural Error",
      confidence: confidenceScore,
      confidenceScore,
      confidenceLevel,
      assessmentsAnalyzed,
      questionsAnalyzed,
      errorPatternDetected,
      triggerRule,
      gapTypeReason: reasonText,
      supportingEvidence: evidence,
      questionEvidence,
      hasQuestionLevelEvidence: questionEvidence.length > 0,
      recommendedDiagnosticAction: `Provide step-by-step color-coded column grids and base-10 block manipulatives to scaffold regrouping mechanics.`,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 6: Conceptual Gap
  // Student exhibits persistent low performance across >= 2 attempts or has
  // repeated errors, and the underlying mental model is not understood.
  // --------------------------------------------------------------------------
  const attemptsDescription =
    attemptCount >= 2
      ? `across ${attemptCount} consecutive assessment attempts (latest ${currentScore}%)`
      : `(latest score: ${currentScore}%)`;

  let conceptualExplanation: string;
  let conceptualEvidence: string[];
  let errorPatternDetected: string;

  if (conceptLower.includes("div")) {
    conceptualExplanation = `Student demonstrates persistent difficulty understanding division as equal sharing, fair grouping, and inverse multiplication ${attemptsDescription}.`;
    conceptualEvidence = [
      `Persistent difficulty representing division as equal sharing ${attemptsDescription}`,
      "Prerequisite multiplication facts mastered, isolating roadblock to the equal sharing mental model",
      "Confuses division divisor with subtraction difference or remainder",
    ];
    errorPatternDetected = "Repeatedly subtracts divisor instead of equal partitioning; confuses division divisor with subtraction difference";
  } else if (conceptLower.includes("fraction")) {
    conceptualExplanation = `Student struggles to perceive fractions as equal parts of a whole or set, frequently treating numerators and denominators as independent whole numbers.`;
    conceptualEvidence = [
      "Fails to recognize equal partitioning requirement in fractional parts",
      "Treats numerator and denominator as separate whole numbers rather than a single ratio",
      `Score (${currentScore}%) reflects foundational confusion in fractional representation`,
    ];
    errorPatternDetected = "Treats numerator and denominator as independent integers rather than proportional ratio";
  } else {
    conceptualExplanation = `Student demonstrates foundational difficulty understanding the core mental model and relational meaning of ${conceptName || "this concept"} ${attemptsDescription}.`;
    conceptualEvidence = [
      `Persistent performance deficit below ${supportThreshold}% threshold ${attemptsDescription}`,
      "Prerequisites are mastered, confirming roadblock is specific to this concept's core mental model",
      "Unable to translate word or visual scenarios into correct mathematical operations",
    ];
    errorPatternDetected = errorPattern || "Foundational mental model breakdown in translating word/visual problems to operations";
  }

  if (hasRepeatedErrors) {
    conceptualEvidence.push("Repeated misconception patterns verified across multiple assessment submissions");
  }

  const confidenceScore = attemptCount >= 2 ? 0.94 : 0.85;
  const confidenceLevel = mapConfidenceToLevel(confidenceScore);

  return {
    diagnosis: `Conceptual Gap in ${conceptName || "Core Concept"}`,
    diagnosisTitle: `Conceptual Gap in ${conceptName || "Core Concept"}`,
    gapType: "Conceptual Gap",
    confidence: confidenceScore,
    confidenceScore,
    confidenceLevel,
    assessmentsAnalyzed,
    questionsAnalyzed,
    errorPatternDetected,
    triggerRule,
    gapTypeReason: conceptualExplanation,
    supportingEvidence: conceptualEvidence,
    questionEvidence,
    hasQuestionLevelEvidence: questionEvidence.length > 0,
    recommendedDiagnosticAction: `Deploy 5-step concrete remedial plan starting with tactile zero-cost manipulatives (counting seeds/beads) to build intuitive mental models before abstract symbols.`,
  };
}
