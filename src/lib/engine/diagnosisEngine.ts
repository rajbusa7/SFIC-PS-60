/**
 * StudySaathi AI - Explainable Pedagogical Cognitive Diagnosis Engine
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Upgrades the "Why Flagged (Cognitive Obstacle)" diagnosis from simple threshold
 * checks to evidence-based pedagogical root-cause explanations.
 *
 * Supported Diagnosis Categories:
 * - "Conceptual Gap" (verified concept-level misunderstanding)
 * - "Procedural Error" (verified algorithmic/step execution difficulty)
 * - "Possible Careless Error" (isolated slip despite high baseline/history)
 * - "Prerequisite Weakness" (unmastered foundational skill)
 * - "Developing / Not Yet Mastered" (partial mastery, progress, or decline)
 * - "Insufficient Evidence" (score below threshold but insufficient data to isolate obstacle)
 * - "Mastered" (benchmark met, no remediation required)
 */

import type { Language } from "../i18n/translations";

export type DiagnosisCategory =
  | "Conceptual Gap"
  | "Procedural Error"
  | "Possible Careless Error"
  | "Prerequisite Weakness"
  | "Developing / Not Yet Mastered"
  | "Insufficient Evidence"
  | "Mastered";

export interface PrerequisiteEvidence {
  conceptId?: string;
  conceptName: string;
  score?: number;
  isMastered?: boolean;
}

export interface ErrorPatternEvidence {
  hasConceptualEvidence?: boolean;
  conceptualDetails?: string;
  hasProceduralEvidence?: boolean;
  proceduralDetails?: string;
  hasCarelessEvidence?: boolean;
  carelessDetails?: string;
  questionLevelDataAvailable?: boolean;
}

export interface CognitiveDiagnosisInput {
  conceptId?: string;
  conceptName?: string;
  studentName?: string;
  latestPercentage?: number | null;
  previousPercentage?: number | null;
  deltaPercentagePoints?: number | null;
  attemptsCount?: number;
  supportThreshold?: number; // default: 60%
  masteryBenchmark?: number; // default: 80%
  prerequisiteInfo?: PrerequisiteEvidence;
  errorEvidence?: ErrorPatternEvidence;
  notes?: string;
  language?: Language;
  /** Explicit flag indicating whether question-level data is available */
  hasQuestionLevelData?: boolean;
  /** Explicit flag indicating whether historical assessment data is comparable */
  isComparableHistory?: boolean;
}

export interface CognitiveDiagnosisResult {
  diagnosisType: DiagnosisCategory;
  status: "Needs Support" | "Developing" | "Mastered";
  explanation: string;
  evidence: string;
  recommendedAction: string;
  confidence?: "High" | "Medium" | "Low";
  isMastered: boolean;
  requiresRemediation: boolean;
}

/**
 * Validates and safely parses a percentage score.
 * Returns null if the value is null, undefined, NaN, or out of the 0-100 range.
 */
export function sanitizeScore(score: unknown): number | null {
  if (score === null || score === undefined || score === "") {
    return null;
  }
  const num = typeof score === "number" ? score : Number(score);
  if (isNaN(num) || !isFinite(num) || num < 0 || num > 100) {
    return null;
  }
  return Math.round(num * 10) / 10;
}

/**
 * Centralized, deterministic diagnosis function.
 * Evaluates available assessment metrics, historical scores, prerequisite data,
 * and error evidence to generate student-specific pedagogical explanations.
 */
export function generateCognitiveDiagnosis(
  input: CognitiveDiagnosisInput
): CognitiveDiagnosisResult {
  const lang: Language = input.language || "en";
  const conceptName = input.conceptName || (lang === "gu" ? "લક્ષિત સંકલ્પના" : "Target Concept");
  const supportThreshold = sanitizeScore(input.supportThreshold) ?? 60;
  const masteryBenchmark = sanitizeScore(input.masteryBenchmark) ?? 80;

  // 1. Validate latest score
  const latest = sanitizeScore(input.latestPercentage);
  if (latest === null) {
    return {
      diagnosisType: "Insufficient Evidence",
      status: "Needs Support",
      explanation:
        lang === "gu"
          ? "અમાન્ય અથવા ખૂટતો મૂલ્યાંકન સ્કોર. શીખવાની સ્થિતિ અથવા જ્ઞાનાત્મક અવરોધ નક્કી કરવા માટે પૂરતો ડેટા ઉપલબ્ધ નથી. કૃપા કરીને નવું મૂલ્યાંકન દાખલ કરો."
          : "Invalid or missing score data. Assessment data is insufficient to establish learning status or identify cognitive obstacles. Administer a valid assessment.",
      evidence: lang === "gu" ? "સ્કોર ઉપલબ્ધ નથી અથવા અમાન્ય છે." : "Score data is missing or invalid.",
      recommendedAction:
        lang === "gu"
          ? "ચોક્કસ આધારરેખા સ્થાપિત કરવા માટે પ્રમાણિત નિદાન મૂલ્યાંકન લો."
          : "Schedule a standardized diagnostic assessment to establish a valid baseline.",
      confidence: "Low",
      isMastered: false,
      requiresRemediation: true,
    };
  }

  // 2. Validate historical score (only use if comparable)
  const isComparable = input.isComparableHistory !== false;
  const prev = isComparable ? sanitizeScore(input.previousPercentage) : null;
  const hasHistory = prev !== null && (input.attemptsCount === undefined || input.attemptsCount > 1);

  // 3. Determine learning status based on thresholds
  let status: "Needs Support" | "Developing" | "Mastered";
  if (latest >= masteryBenchmark) {
    status = "Mastered";
  } else if (latest >= supportThreshold) {
    status = "Developing";
  } else {
    status = "Needs Support";
  }

  // 4. Scenario: Mastered (>= 80%)
  if (status === "Mastered") {
    const delta = prev !== null ? Math.round((latest - prev) * 10) / 10 : null;
    let explanation: string;
    let evidence: string;

    if (delta !== null && delta > 0) {
      explanation =
        lang === "gu"
          ? `નિપુણ: સંકલ્પના સફળતાપૂર્વક નિપુણ થઈ (${latest}%), અગાઉના સત્રથી +${delta}% પોઈન્ટનો સુધારો દર્શાવે છે. કોઈ તાત્કાલિક ઉપચારની જરૂર નથી; ભાવિ મૂલ્યાંકનો દ્વારા જાળવણીનું નિરીક્ષણ કરો.`
          : `Mastered: Concept successfully mastered (${latest}%), showing an improvement of +${delta} percentage points from previous session. No immediate remediation is required; monitor retention through future assessments.`;
      evidence =
        lang === "gu"
          ? `સ્કોર ${prev}% થી વધીને ${latest}% થયો (+${delta}% પોઈન્ટ), બેન્ચમાર્ક (${masteryBenchmark}%) કરતાં વધારે.`
          : `Score improved from ${prev}% to ${latest}% (+${delta} pp), exceeding benchmark of ${masteryBenchmark}%.`;
    } else {
      explanation =
        lang === "gu"
          ? `નિપુણ: વિદ્યાર્થીએ વર્તમાન નિપુણતા બેન્ચમાર્ક (${masteryBenchmark}%) પ્રાપ્ત કર્યો છે. કોઈ તાત્કાલિક ઉપચારની જરૂર નથી; ભાવિ મૂલ્યાંકનો દ્વારા જાળવણીનું નિરીક્ષણ કરો.`
          : `Mastered: The student has reached the current mastery benchmark. No immediate remediation is required; monitor retention through future assessments.`;
      evidence =
        lang === "gu"
          ? `વર્તમાન સ્કોર ${latest}% નિપુણતા બેન્ચમાર્ક (≥ ${masteryBenchmark}%) ની બરાબર અથવા વધારે છે.`
          : `Current score of ${latest}% meets or exceeds the mastery benchmark of ${masteryBenchmark}%.`;
    }

    return {
      diagnosisType: "Mastered",
      status: "Mastered",
      explanation,
      evidence,
      recommendedAction:
        lang === "gu"
          ? "નિયમિત પુનરાવર્તન જાળવો; આગામી ધોરણ સ્તરની સંકલ્પનાઓ માટે તૈયાર."
          : "Maintain periodic review; student is ready for advanced application or next curriculum topic.",
      confidence: "High",
      isMastered: true,
      requiresRemediation: false,
    };
  }

  // 5. Check verified error patterns (Conceptual vs Procedural vs Careless vs Prerequisite)
  const errEv = input.errorEvidence;

  // A. Conceptual Gap - Requires verified concept-level evidence (not score alone)
  if (errEv?.hasConceptualEvidence) {
    const details = errEv.conceptualDetails || (lang === "gu" ? "મૂળભૂત સંકલ્પનાત્મક ગૂંચવણ" : "conceptual confusion");
    return {
      diagnosisType: "Conceptual Gap",
      status,
      explanation:
        lang === "gu"
          ? `સૈદ્ધાંતિક ખામી: ઉપલબ્ધ મૂલ્યાંકન પુરાવા ${conceptName} માં મૂળભૂત સંકલ્પનાને સમજવામાં મુશ્કેલી દર્શાવે છે (${details}). મુખ્ય માનસિક મોડેલને ફરીથી બનાવવા માટે મૂર્ત સાધનો અને વિઝ્યુઅલ મોડેલની ભલામણ કરવામાં આવે છે.`
          : `Conceptual Gap: Available assessment evidence indicates difficulty understanding the underlying concept of ${conceptName} (${details}). Concrete manipulatives and visual models are recommended to rebuild the core mental model.`,
      evidence:
        lang === "gu"
          ? `ચકાસાયેલ સંકલ્પનાત્મક ભૂલો અને ${latest}% સ્કોર દર્શાવે છે કે સંકલ્પના સ્પષ્ટ નથી.`
          : `Verified conceptual error patterns and ${latest}% score indicate core understanding is not yet formed.`,
      recommendedAction:
        lang === "gu"
          ? `મૂળ સંકલ્પનાત્મક ગેરસમજ દૂર કરવા માટે મૂર્ત સાધનો (મણકા, ચિત્રો) સાથે પ્રવૃત્તિ-આધારિત શિક્ષણ આપો.`
          : `Deploy multi-sensory instruction and concrete manipulatives (beads, diagrams) to rebuild the conceptual model.`,
      confidence: "High",
      isMastered: false,
      requiresRemediation: true,
    };
  }

  // B. Procedural Error - Requires verified working-process / calculation step evidence
  if (errEv?.hasProceduralEvidence) {
    const details = errEv.proceduralDetails || (lang === "gu" ? "પગલાં અમલીકરણમાં ભૂલ" : "step execution difficulty");
    return {
      diagnosisType: "Procedural Error",
      status,
      explanation:
        lang === "gu"
          ? `કાર્યપદ્ધતિ ભૂલ: વિદ્યાર્થી મુખ્ય સંકલ્પના સમજે છે, પરંતુ ${conceptName} માટેની પ્રક્રિયાત્મક ગણતરી અને પગલાંના અમલમાં મુશ્કેલી અનુભવે છે (${details}). પગલાંવાર ઉકેલાયેલા ઉદાહરણો અને માળખાગત મહાવરાની ભલામણ કરવામાં આવે છે.`
          : `Procedural Error: The student demonstrates understanding of the core concept, but struggles to apply the correct procedure and multi-step execution for ${conceptName} (${details}). Structured worked examples and step-by-step scaffolding are recommended.`,
      evidence:
        lang === "gu"
          ? `પ્રક્રિયાત્મક ભૂલોની નોંધાયેલ વિગતો દર્શાવે છે કે સંકલ્પના સાચી હોવા છતાં પગલાંમાં ભૂલ થાય છે.`
          : `Verified procedural error patterns indicate correct concept recognition but calculation/sequence breakdown.`,
      recommendedAction:
        lang === "gu"
          ? `પગલાંવાર ઉકેલાયેલા ઉદાહરણો પૂરા પાડો અને પ્રક્રિયાત્મક ચોકસાઈ વધારવા માટે માળખાગત પ્રેક્ટિસ કરાવો.`
          : `Provide step-by-step worked examples and scaffolding focused on the sequence of operational steps.`,
      confidence: "High",
      isMastered: false,
      requiresRemediation: true,
    };
  }

  // C. Prerequisite Weakness - Requires verified prerequisite assessment evidence
  if (
    input.prerequisiteInfo &&
    input.prerequisiteInfo.isMastered === false &&
    input.prerequisiteInfo.conceptName
  ) {
    const prereqName = input.prerequisiteInfo.conceptName;
    const prereqScore = input.prerequisiteInfo.score !== undefined ? `${input.prerequisiteInfo.score}%` : (lang === "gu" ? "અપૂર્ણ" : "unsecured");
    return {
      diagnosisType: "Prerequisite Weakness",
      status,
      explanation:
        lang === "gu"
          ? `પૂર્વશરત નબળાઈ: ${conceptName} માં પ્રગતિ પાયાની સંકલ્પના ${prereqName} (${prereqScore}) માં નબળાઈને કારણે અટકી છે. વર્તમાન વિષય પર આગળ વધતાં પહેલાં પૂર્વજરૂરી કૌશલ્ય મજબૂત કરવું જરૂરી છે.`
          : `Prerequisite Weakness: Performance in ${conceptName} is impeded by foundational gaps in ${prereqName} (${prereqScore}). Reinforcing this prerequisite skill is recommended before progressing further.`,
      evidence:
        lang === "gu"
          ? `પૂર્વશરત સંકલ્પના ${prereqName} હજી સુધી નિપુણ થઈ નથી (${prereqScore}).`
          : `Foundational prerequisite ${prereqName} is not yet secure (${prereqScore}).`,
      recommendedAction:
        lang === "gu"
          ? `${conceptName} પર આગળ વધતાં પહેલાં પાયાની સંકલ્પના ${prereqName} નો ૨-સત્ર પુનરાવર્તન મહાવરો કરાવો.`
          : `Reinforce foundational prerequisite skill (${prereqName}) through targeted review sessions before re-attempting ${conceptName}.`,
      confidence: "High",
      isMastered: false,
      requiresRemediation: true,
    };
  }

  // D. Possible Careless Error - Isolated slip with verified evidence
  if (errEv?.hasCarelessEvidence) {
    const prevScoreStr = prev !== null ? `${prev}%` : (lang === "gu" ? "ઉચ્ચ" : "high");
    return {
      diagnosisType: "Possible Careless Error",
      status,
      explanation:
        lang === "gu"
          ? `સંભવિત અજાણતાં થયેલી ભૂલ: વિદ્યાર્થીએ અગાઉ ${conceptName} માં સારી નિપુણતા (${prevScoreStr}) દર્શાવી છે. આ એકલ ભૂલ સંકલ્પનાત્મક ખામીને બદલે ઉતાવળ અથવા ગણતરીની નાની ભૂલ હોઈ શકે છે.`
          : `Possible Careless Error: The student has previously demonstrated solid understanding of ${conceptName} (${prevScoreStr}), suggesting this isolated slip may be due to a calculation or transcription oversight rather than a conceptual deficiency.`,
      evidence:
        lang === "gu"
          ? `ચકાસાયેલ પુરાવા દર્શાવે છે કે સંકલ્પના સ્પષ્ટ છે પરંતુ અજાણતાં ભૂલ થઈ છે.`
          : `Verified evidence indicates overall understanding is intact with an isolated minor oversight.`,
      recommendedAction:
        lang === "gu"
          ? `વિદ્યાર્થીને પોતાની ભૂલ જાતે તપાસવા કહો અને પુષ્ટિ કરવા માટે ટૂંકી ૨-પ્રશ્નોની ચકાસણી આપો.`
          : `Have the student self-review the assessment using guided error analysis to confirm understanding.`,
      confidence: "Medium",
      isMastered: false,
      requiresRemediation: false,
    };
  }

  // 6. Historical Trend Analysis (if comparable history exists)
  if (hasHistory && prev !== null) {
    const delta = Math.round((latest - prev) * 10) / 10;
    const isRepeatedLow = prev < supportThreshold && latest < supportThreshold;
    const deltaFormatted = delta > 0 ? `+${delta} pp` : `${delta} pp`;

    // A. Persistent low performance (both previous and current are below support threshold)
    if (isRepeatedLow) {
      return {
        diagnosisType: "Developing / Not Yet Mastered",
        status: "Needs Support",
        explanation:
          lang === "gu"
            ? `સહાયની જરૂર: મૂલ્યાંકન પ્રદર્શન (${latest}%) નિર્ધારિત સપોર્ટ થ્રેશોલ્ડ (${supportThreshold}%) થી નીચે છે, અને પાછલા પરિણામ (${prev}%) માં પણ સતત મુશ્કેલી જોવા મળી હતી. સંકલ્પનાના મૂળભૂત પાયા પર માર્ગદર્શિત મહાવરો જરૂરી છે.`
            : `Needs Support: Assessment performance (${latest}%) is below the configured support threshold (${supportThreshold}%), and the previous result (${prev}%) also showed persistent difficulty. Structured guided practice on core fundamentals is recommended.`,
        evidence:
          lang === "gu"
            ? `સતત મૂલ્યાંકનો (${prev}%, ${latest}%) સહાય થ્રેશોલ્ડ (< ${supportThreshold}%) થી નીચે રહે છે.`
            : `Persistent low scores (${prev}%, ${latest}%) below the support threshold of ${supportThreshold}%.`,
        recommendedAction:
          lang === "gu"
            ? `મૂળભૂત બાબતો પર ધ્યાન કેન્દ્રિત કરીને નાના જૂથમાં પ્રવૃત્તિ આધારિત માર્ગદર્શન આપો.`
            : `Assign focused small-group remedial practice on ${conceptName} fundamentals using concrete manipulatives.`,
        confidence: "High",
        isMastered: false,
        requiresRemediation: true,
      };
    }

    // B. Improving trend (e.g. 55% -> 70%) beyond tolerance
    if (delta > 2) {
      const statusWord = status === "Developing"
        ? (lang === "gu" ? "પ્રગતિશીલ અને સુધરતું" : "Developing and improving")
        : (lang === "gu" ? "સહાયની જરૂર અને સુધરતું" : "Needs Support (improving)");

      const subjectNameText = input.studentName ? input.studentName : (lang === "gu" ? "સ્કોર" : "Score");

      return {
        diagnosisType: "Developing / Not Yet Mastered",
        status,
        explanation:
          lang === "gu"
            ? `${statusWord}: ${input.studentName ? `${input.studentName}નો સ્કોર` : "સ્કોર"} ${prev}% થી વધીને ${latest}% થયો છે (${deltaFormatted}), જે પ્રગતિ દર્શાવે છે, પરંતુ હજુ ${masteryBenchmark}% બેન્ચમાર્ક સુધી પહોંચ્યો નથી. ધ્યાન કેન્દ્રિત મહાવરો ચાલુ રાખો અને ફરીથી મૂલ્યાંકન કરો.`
            : `${statusWord}: ${subjectNameText} increased from ${prev}% to ${latest}% (${deltaFormatted}), showing progress, but mastery has not yet reached the ${masteryBenchmark}% benchmark. Continue focused practice and reassess.`,
        evidence:
          lang === "gu"
            ? `સરખામણીત્મક મૂલ્યાંકનોમાં ${prev}% થી ${latest}% સુધીનો હકારાત્મક સુધારો (${deltaFormatted}).`
            : `Positive score trajectory from ${prev}% to ${latest}% (${deltaFormatted}) across comparable assessments.`,
        recommendedAction:
          lang === "gu"
            ? `પ્રગતિ જાળવવા માટે માળખાગત પ્રેક્ટિસ ચાલુ રાખો અને આગામી અઠવાડિયે પુનઃમૂલ્યાંકન કરો.`
            : `Continue focused practice and reassess to verify progress toward the ${masteryBenchmark}% benchmark.`,
        confidence: "High",
        isMastered: false,
        requiresRemediation: true,
      };
    }

    // C. Declining trend (e.g. 85% -> 65%) beyond tolerance
    if (delta < -2) {
      const subjectNameText = input.studentName ? `${input.studentName}'s score` : "The student's score";
      return {
        diagnosisType: "Developing / Not Yet Mastered",
        status,
        explanation:
          lang === "gu"
            ? `ઘટતું પ્રદર્શન: ${input.studentName ? `${input.studentName}નો સ્કોર` : "વિદ્યાર્થીનો સ્કોર"} ${prev}% થી ઘટીને ${latest}% થયો છે (${deltaFormatted}). તાજેતરની શિક્ષણ મુશ્કેલીઓની સમીક્ષા કરો અને લક્ષિત સહાય પૂરી પાડો.`
            : `Declining performance: ${subjectNameText} decreased from ${prev}% to ${latest}% (${deltaFormatted}). Review recent learning difficulties and missed problems to provide targeted support.`,
        evidence:
          lang === "gu"
            ? `સરખામણીત્મક મૂલ્યાંકનોમાં ${prev}% થી ${latest}% નો ઘટાડો નોંધાયો છે (${deltaFormatted}).`
            : `Performance declined by ${Math.abs(delta)} percentage points (from ${prev}% to ${latest}%).`,
        recommendedAction:
          lang === "gu"
            ? `તાજેતરની ભૂલોની તપાસ કરો અને વિષય વધુ નબળો પડે તે પહેલાં લક્ષિત સમીક્ષા કરો.`
            : `Investigate recently missed questions and conduct targeted review before concepts slip further.`,
        confidence: "High",
        isMastered: false,
        requiresRemediation: true,
      };
    }

    // D. Stable performance within tolerance (e.g. 75% -> 75% or 70% -> 71%)
    if (status === "Developing") {
      return {
        diagnosisType: "Developing / Not Yet Mastered",
        status: "Developing",
        explanation:
          lang === "gu"
            ? `પ્રગતિશીલ: પ્રદર્શન ${latest}% પર સ્થિર રહ્યું છે. વિદ્યાર્થી ${masteryBenchmark}% નિપુણતા બેન્ચમાર્કની નજીક છે પરંતુ હજુ સુધી ત્યાં પહોંચ્યો નથી.`
            : `Developing: Performance has remained stable at ${latest}%. The student is approaching the ${masteryBenchmark}% mastery benchmark but has not yet reached it.`,
        evidence:
          lang === "gu"
            ? `મૂલ્યાંકન સ્કોર ${latest}% પર સ્થિર છે (${deltaFormatted}).`
            : `Assessment score is stable at ${latest}% (${deltaFormatted}).`,
        recommendedAction:
          lang === "gu"
            ? `નિપુણતા સીમાચિહ્ન સુધી પહોંચવા માટે લક્ષિત પ્રેક્ટિસ આપો અને ફરીથી મૂલ્યાંકન કરો.`
            : `Provide focused practice followed by reassessment to achieve consistent mastery.`,
        confidence: "High",
        isMastered: false,
        requiresRemediation: true,
      };
    }
  }

  // 7. Check for explicitly flagged Insufficient Evidence
  // When assessment data has no question-level breakdown, no history, and no prerequisite data
  if (input.hasQuestionLevelData === false && !hasHistory && !input.prerequisiteInfo) {
    if (status === "Needs Support") {
      return {
        diagnosisType: "Insufficient Evidence",
        status: "Needs Support",
        explanation:
          lang === "gu"
            ? `સહાયની જરૂર: વર્તમાન સ્કોર (${latest}%) દર્શાવે છે કે શીખવાનો ઉદ્દેશ્ય હજુ સુરક્ષિત નથી. ચોક્કસ જ્ઞાનાત્મક અવરોધને ઓળખવા માટે ઉપલબ્ધ મૂલ્યાંકન ડેટા અપૂરતો છે. ટૂંકા નિદાન મૂલ્યાંકનની ભલામણ કરવામાં આવે છે.`
            : `Needs Support: The current score indicates that the learning objective is not yet secure. Available assessment data is insufficient to identify the specific cognitive obstacle. A short diagnostic assessment is recommended.`,
        evidence:
          lang === "gu"
            ? `માત્ર સિંગલ સ્કોર (${latest}%) ઉપલબ્ધ છે; પ્રશ્ન-સ્તરીય કે ઐતિહાસિક વિગતો નથી.`
            : `Single score of ${latest}% available; question-level error breakdown and historical data are absent.`,
        recommendedAction:
          lang === "gu"
            ? `ચોક્કસ જ્ઞાનાત્મક અવરોધ નક્કી કરવા માટે ૫-પ્રશ્નોનું ટૂંકું નિદાન મૂલ્યાંકન લો.`
            : `Administer a short diagnostic assessment with varied problem types to isolate the cognitive obstacle.`,
        confidence: "Low",
        isMastered: false,
        requiresRemediation: true,
      };
    }
  }

  // 8. Developing standard single-score scenario
  if (status === "Developing") {
    return {
      diagnosisType: "Developing / Not Yet Mastered",
      status: "Developing",
      explanation:
        lang === "gu"
          ? `પ્રગતિશીલ: વિદ્યાર્થીએ મૂળભૂત કૌશલ્યનું પ્રદર્શન કર્યું છે (${latest}%), પરંતુ હજુ સુધી સાતત્યપૂર્ણ નિપુણતા દર્શાવી નથી. ધ્યાન કેન્દ્રિત પ્રેક્ટિસ અને ત્યારબાદ પુનઃમૂલ્યાંકનની ભલામણ કરવામાં આવે છે.`
          : `Developing: The student has demonstrated the core skill and grasped core basics (${latest}%), but has not yet shown consistent mastery. Focused practice followed by reassessment is recommended.`,
      evidence:
        lang === "gu"
          ? `સ્કોર (${latest}%) વિકાસશીલ સીમાચિહ્ન (≥ ${supportThreshold}%) પર છે પરંતુ નિપુણતા (< ${masteryBenchmark}%) થી નીચે છે.`
          : `Current score (${latest}%) demonstrates partial mastery above support threshold (≥ ${supportThreshold}%) but below mastery benchmark (< ${masteryBenchmark}%).`,
      recommendedAction:
        lang === "gu"
          ? `સંકલ્પનાત્મક સાતત્ય વધારવા માટે વિવિધ સમસ્યા સેટ સાથે માર્ગદર્શિત પ્રેક્ટિસ કરાવો.`
          : `Provide guided practice with varied problem sets followed by reassessment to confirm consistent mastery.`,
      confidence: "Medium",
      isMastered: false,
      requiresRemediation: true,
    };
  }

  // 9. Needs Support standard single-score scenario
  return {
    diagnosisType: "Developing / Not Yet Mastered",
    status: "Needs Support",
    explanation:
      lang === "gu"
        ? `સહાયની જરૂર: વિદ્યાર્થીની વર્તમાન ${latest}% નિપુણતા દર્શાવે છે કે મુખ્ય કૌશલ્ય હજુ સુરક્ષિત નથી. આગળ વધતાં પહેલાં વધારાની માર્ગદર્શિત પ્રેક્ટિસની ભલામણ કરવામાં આવે છે.`
        : `Needs Support: The student's current ${latest}% mastery indicates that the core skill is not yet secure. Additional guided practice is recommended before progressing.`,
    evidence:
      lang === "gu"
        ? `વર્તમાન સ્કોર (${latest}%) સપોર્ટ થ્રેશોલ્ડ (< ${supportThreshold}%) થી નીચે છે.`
        : `Current score of ${latest}% is below the support threshold of ${supportThreshold}%.`,
    recommendedAction:
      lang === "gu"
        ? `મૂળભૂત બાબતો પર ધ્યાન કેન્દ્રિત કરીને માળખાગત ઉપચારાત્મક કાર્યપત્રકો આપો.`
        : `Assign structured guided practice focused on core fundamentals before introducing new material.`,
    confidence: "Medium",
    isMastered: false,
    requiresRemediation: true,
  };
}

/**
 * Returns localized display badge info for a diagnosis category.
 */
export function getDiagnosisBadgeStyle(type?: DiagnosisCategory): {
  label: string;
  labelGu: string;
  badgeVariant: "coral" | "amber" | "mint" | "neutral" | "saffron";
  borderClass: string;
  bgClass: string;
  textClass: string;
} {
  switch (type) {
    case "Conceptual Gap":
      return {
        label: "Conceptual Gap",
        labelGu: "સૈદ્ધાંતિક ખામી",
        badgeVariant: "coral",
        borderClass: "border-[#C54738]/30",
        bgClass: "bg-[#C54738]/10",
        textClass: "text-[#C54738]",
      };
    case "Procedural Error":
      return {
        label: "Procedural Error",
        labelGu: "કાર્યપદ્ધતિ ભૂલ",
        badgeVariant: "amber",
        borderClass: "border-[#B26A1B]/30",
        bgClass: "bg-[#B26A1B]/10",
        textClass: "text-[#B26A1B]",
      };
    case "Possible Careless Error":
      return {
        label: "Possible Careless Error",
        labelGu: "સંભવિત અજાણતાં થયેલી ભૂલ",
        badgeVariant: "neutral",
        borderClass: "border-[#7A6862]/30",
        bgClass: "bg-[#7A6862]/10",
        textClass: "text-[#7A6862]",
      };
    case "Prerequisite Weakness":
      return {
        label: "Prerequisite Weakness",
        labelGu: "પૂર્વશરત નબળાઈ",
        badgeVariant: "coral",
        borderClass: "border-[#C54738]/30",
        bgClass: "bg-[#C54738]/10",
        textClass: "text-[#C54738]",
      };
    case "Mastered":
      return {
        label: "Mastered",
        labelGu: "નિપુણ",
        badgeVariant: "mint",
        borderClass: "border-[#2E7D5E]/30",
        bgClass: "bg-[#2E7D5E]/10",
        textClass: "text-[#2E7D5E]",
      };
    case "Insufficient Evidence":
      return {
        label: "Insufficient Evidence",
        labelGu: "અપૂરતા પુરાવા",
        badgeVariant: "neutral",
        borderClass: "border-[#7A6862]/30",
        bgClass: "bg-[#7A6862]/10",
        textClass: "text-[#7A6862]",
      };
    case "Developing / Not Yet Mastered":
    default:
      return {
        label: "Developing / Not Yet Mastered",
        labelGu: "પ્રગતિશીલ / હજુ સુધી નિપુણ નથી",
        badgeVariant: "amber",
        borderClass: "border-[#B26A1B]/30",
        bgClass: "bg-[#B26A1B]/10",
        textClass: "text-[#B26A1B]",
      };
  }
}
