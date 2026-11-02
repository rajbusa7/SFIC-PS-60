/**
 * StudySaathi / ShikshaSetu AI - Concept Dependency & Prerequisite Root-Cause Engine
 *
 * Distinguishes between:
 * 1. The affected concept where the student exhibited low performance.
 * 2. The underlying prerequisite concept (root cause) causing the failure.
 *
 * Core Concept Progression Models:
 * - Ones & Tens -> Place Value -> Regrouping -> 3-Digit Addition
 * - Skip Counting -> Multiplication Tables -> Multiplication -> Division
 *
 * Core Principles:
 * - Strict evidence threshold: Never fabricate a root cause when evidence is insufficient.
 * - Confidence scoring for root-cause identification (High, Medium, Low).
 * - Deterministic, explainable learning path generation for pedagogical intervention.
 */

import type {
  ConceptDependencyNode,
  PrerequisiteAnalysisResult,
  LearningPathStep,
  ConfidenceLevel,
  QuestionEvidenceItem,
} from "../types";

export type { ConceptDependencyNode, PrerequisiteAnalysisResult, LearningPathStep };

/**
 * Standardized Concept Dependency Graph
 */
export const CONCEPT_DEPENDENCY_GRAPH: Record<string, ConceptDependencyNode> = {
  // ─── Mathematics: Place Value & Multi-Digit Addition Chain ───
  "c-math-ones-tens": {
    id: "c-math-ones-tens",
    name: "Ones & Tens",
    nameGujarati: "એકમ અને દશક",
    subjectCode: "MATH",
    grade: 1,
    prerequisites: [],
    description: "Foundational grouping of units into tens and singles.",
  },
  "c-math-pv-2": {
    id: "c-math-pv-2",
    name: "Place Value",
    nameGujarati: "સ્થાનકિંમત",
    subjectCode: "MATH",
    grade: 2,
    prerequisites: ["c-math-ones-tens"],
    description: "Understanding value of digits based on position (Hundreds, Tens, Ones).",
  },
  "c-math-regroup": {
    id: "c-math-regroup",
    name: "Regrouping",
    nameGujarati: "વદ્દી વાળા સરવાળા (પુનઃજૂથબંધી)",
    subjectCode: "MATH",
    grade: 2,
    prerequisites: ["c-math-pv-2"],
    description: "Executing base-10 carrying when sum exceeds 9 in a column.",
  },
  "c-place-01": {
    id: "c-place-01",
    name: "3-Digit Addition",
    nameGujarati: "૩-અંકનો સરવાળો",
    subjectCode: "MATH",
    grade: 3,
    prerequisites: ["c-math-regroup", "c-math-pv-2"],
    description: "Column addition of 3-digit numbers requiring multi-step regrouping.",
  },

  // ─── Mathematics: Multiplication & Division Chain ───
  "c-math-skip-count": {
    id: "c-math-skip-count",
    name: "Skip Counting",
    nameGujarati: "સંખ્યા કુદકા (સ્કીપ કાઉન્ટિંગ)",
    subjectCode: "MATH",
    grade: 2,
    prerequisites: ["c-math-ones-tens"],
    description: "Counting by 2s, 5s, 10s as concrete foundation for repeated addition.",
  },
  "c-mult-01": {
    id: "c-mult-01",
    name: "Multiplication Tables",
    nameGujarati: "ગુણાકારના ઘડિયા",
    subjectCode: "MATH",
    grade: 3,
    prerequisites: ["c-math-skip-count"],
    description: "Automated retrieval of multiplication facts (tables 2 to 9).",
  },
  "c-mult-02": {
    id: "c-mult-02",
    name: "Multiplication",
    nameGujarati: "ગુણાકાર",
    subjectCode: "MATH",
    grade: 3,
    prerequisites: ["c-mult-01"],
    description: "Multiplication algorithm with 2-digit and 3-digit operands.",
  },
  "c-div-01": {
    id: "c-div-01",
    name: "Division",
    nameGujarati: "ભાગાકાર",
    subjectCode: "MATH",
    grade: 4,
    prerequisites: ["c-mult-01", "c-mult-02"],
    description: "Division as inverse multiplication, equal sharing, and quotient grouping.",
  },
  "c-frac-01": {
    id: "c-frac-01",
    name: "Fractions Introduction",
    nameGujarati: "અપૂર્ણાંક પરિચય",
    subjectCode: "MATH",
    grade: 4,
    prerequisites: ["c-div-01"],
    description: "Representing unit fractions of wholes and sets based on equal division.",
  },

  // ─── English / Language Progression Chain ───
  "c-eng-alpha-1": {
    id: "c-eng-alpha-1",
    name: "Phonics & Letter Sounds",
    nameGujarati: "મૂળાક્ષર અને ઉચ્ચારણ",
    subjectCode: "ENG",
    grade: 1,
    prerequisites: [],
    description: "Grapheme-phoneme correspondence and initial sounds.",
  },
  "c-eng-blend-01": {
    id: "c-eng-blend-01",
    name: "Phonetic Blends",
    nameGujarati: "ફોનેટિક સંયુક્ત અવાજ (ch, sh, th)",
    subjectCode: "ENG",
    grade: 2,
    prerequisites: ["c-eng-alpha-1"],
    description: "Consonant blends and digraphs (ch, sh, th, wh).",
  },
  "c-eng-word-2": {
    id: "c-eng-word-2",
    name: "Word Formation & CVC Words",
    nameGujarati: "શબ્દ નિર્માણ",
    subjectCode: "ENG",
    grade: 2,
    prerequisites: ["c-eng-blend-01"],
    description: "Building 3-4 letter words and blending into basic sentences.",
  },
  "c-eng-nouns-01": {
    id: "c-eng-nouns-01",
    name: "Singular & Plural Nouns",
    nameGujarati: "એકવચન અને બહુવચન",
    subjectCode: "ENG",
    grade: 3,
    prerequisites: ["c-eng-word-2"],
    description: "Differentiating singular vs plural subjects and pronouns.",
  },
  "c-eng-verb-01": {
    id: "c-eng-verb-01",
    name: "Subject-Verb Agreement",
    nameGujarati: "કર્તા અને ક્રિયાપદ સુમેળ",
    subjectCode: "ENG",
    grade: 4,
    prerequisites: ["c-eng-nouns-01"],
    description: "Matching third-person singular/plural subjects with correct auxiliary and main verbs.",
  },
  "c-eng-comp-01": {
    id: "c-eng-comp-01",
    name: "Short Passage Reading Comprehension",
    nameGujarati: "ટૂંકા ફકરાનું વાંચન અને અર્થગ્રહણ",
    subjectCode: "ENG",
    grade: 4,
    prerequisites: ["c-eng-verb-01", "c-eng-word-2"],
    description: "Extracting factual details and inferring main idea from structured passages.",
  },

  // ─── Gujarati Progression Chain ───
  "c-guj-varnamala-01": {
    id: "c-guj-varnamala-01",
    name: "ગુજરાતી મૂળાક્ષરો (Varnamala)",
    nameGujarati: "ગુજરાતી મૂળાક્ષરો (સ્વર-વ્યંજન)",
    subjectCode: "GUJ",
    grade: 1,
    prerequisites: [],
    description: "ઓળખ અને લેખન: ક થી જ્ઞ અને અ થી અઃ.",
  },
  "c-guj-matra-01": {
    id: "c-guj-matra-01",
    name: "કાનો-માત્રા અને સ્વર ચિહ્નો (Gujarati Matras)",
    nameGujarati: "કાનો-માત્રા અને સ્વર ચિહ્નો",
    subjectCode: "GUJ",
    grade: 2,
    prerequisites: ["c-guj-varnamala-01"],
    description: "હ્રસ્વ-દીર્ઘ ચિહ્નોની સાચી ઓળખ અને શબ્દ વાચન.",
  },
  "c-guj-conj-01": {
    id: "c-guj-conj-01",
    name: "જોડાક્ષર શબ્દોનું વાંચન-લેખન (Gujarati Conjuncts)",
    nameGujarati: "જોડાક્ષર શબ્દોનું વાંચન-લેખન",
    subjectCode: "GUJ",
    grade: 3,
    prerequisites: ["c-guj-matra-01"],
    description: "જોડાયેલા અક્ષરોનું શુદ્ધ ઉચ્ચારણ અને લેખન.",
  },

  // ─── EVS / Science Progression Chain ───
  "c-evs-plant-01": {
    id: "c-evs-plant-01",
    name: "Parts of Plants & Functions",
    nameGujarati: "વનસ્પતિના ભાગો અને તેના કાર્યો",
    subjectCode: "EVS",
    grade: 3,
    prerequisites: [],
    description: "Roots, stems, leaves, flowers and basic life functions.",
  },
  "c-evs-water-01": {
    id: "c-evs-water-01",
    name: "Water Cycle & Conservation",
    nameGujarati: "જળચક્ર અને જળસંચય",
    subjectCode: "EVS",
    grade: 4,
    prerequisites: ["c-evs-plant-01"],
    description: "Evaporation, condensation, precipitation, and groundwater conservation.",
  },
};

/**
 * Normalizes concept identifier or fuzzy name to lookup key in graph
 */
export function resolveConceptNode(conceptIdOrName: string): ConceptDependencyNode | undefined {
  if (!conceptIdOrName) return undefined;
  const raw = conceptIdOrName.trim().toLowerCase();

  // 1. Direct ID match
  if (CONCEPT_DEPENDENCY_GRAPH[conceptIdOrName]) {
    return CONCEPT_DEPENDENCY_GRAPH[conceptIdOrName];
  }

  // 2. Fuzzy match by name or key terms
  for (const node of Object.values(CONCEPT_DEPENDENCY_GRAPH)) {
    if (node.id.toLowerCase() === raw) return node;
    const nodeName = node.name.toLowerCase();
    if (nodeName === raw || raw.includes(nodeName) || nodeName.includes(raw)) {
      return node;
    }
  }

  // 3. Keyword heuristic aliases
  if (raw.includes("addition") || raw.includes("place value") || raw.includes("regroup")) {
    return CONCEPT_DEPENDENCY_GRAPH["c-place-01"];
  }
  if (raw.includes("division") || raw.includes("sharing")) {
    return CONCEPT_DEPENDENCY_GRAPH["c-div-01"];
  }
  if (raw.includes("table") || raw.includes("multiplication")) {
    return CONCEPT_DEPENDENCY_GRAPH["c-mult-01"];
  }
  if (raw.includes("comprehension") || raw.includes("passage")) {
    return CONCEPT_DEPENDENCY_GRAPH["c-eng-comp-01"];
  }
  if (raw.includes("verb") || raw.includes("agreement")) {
    return CONCEPT_DEPENDENCY_GRAPH["c-eng-verb-01"];
  }
  if (raw.includes("matra")) {
    return CONCEPT_DEPENDENCY_GRAPH["c-guj-matra-01"];
  }
  if (raw.includes("water")) {
    return CONCEPT_DEPENDENCY_GRAPH["c-evs-water-01"];
  }

  return undefined;
}

/**
 * Returns all direct and indirect prerequisites in topological order (earliest foundation first)
 */
export function getAllPrerequisites(conceptIdOrName: string): ConceptDependencyNode[] {
  const targetNode = resolveConceptNode(conceptIdOrName);
  if (!targetNode) return [];

  const visited = new Set<string>();
  const order: ConceptDependencyNode[] = [];

  function dfs(nodeId: string) {
    const node = CONCEPT_DEPENDENCY_GRAPH[nodeId];
    if (!node) return;
    for (const prereqId of node.prerequisites) {
      if (!visited.has(prereqId)) {
        visited.add(prereqId);
        dfs(prereqId);
        const prereqNode = CONCEPT_DEPENDENCY_GRAPH[prereqId];
        if (prereqNode && !order.some((n) => n.id === prereqNode.id)) {
          order.push(prereqNode);
        }
      }
    }
  }

  dfs(targetNode.id);
  return order;
}

/**
 * Returns all downstream dependent concepts that build on this concept
 */
export function getAllDependents(conceptIdOrName: string): ConceptDependencyNode[] {
  const targetNode = resolveConceptNode(conceptIdOrName);
  if (!targetNode) return [];

  const dependents: ConceptDependencyNode[] = [];
  for (const node of Object.values(CONCEPT_DEPENDENCY_GRAPH)) {
    if (node.id === targetNode.id) continue;
    const prereqs = getAllPrerequisites(node.id);
    if (prereqs.some((p) => p.id === targetNode.id)) {
      dependents.push(node);
    }
  }
  return dependents;
}

export interface RootCauseAnalysisInput {
  affectedConceptId: string;
  affectedConceptName?: string;
  studentScore: number;
  studentHistory?: Array<{
    conceptId: string;
    conceptName?: string;
    score: number;
    passed?: boolean;
  }>;
  errorPattern?: string;
  questionEvidence?: QuestionEvidenceItem[];
  prerequisitesMastered?: boolean;
  attemptCount?: number;
  evidenceCount?: number;
  supportThreshold?: number; // default: 60
  masteryThreshold?: number; // default: 80
}

/**
 * Evaluates whether a student has a root-cause prerequisite failure behind an observed gap
 */
export function analyzeRootCause(input: RootCauseAnalysisInput): PrerequisiteAnalysisResult {
  const supportThresh = input.supportThreshold ?? 60;
  const masteryThresh = input.masteryThreshold ?? 80;
  const targetNode =
    resolveConceptNode(input.affectedConceptId) ||
    resolveConceptNode(input.affectedConceptName || "") || {
      id: input.affectedConceptId,
      name: input.affectedConceptName || input.affectedConceptId,
      prerequisites: [],
      grade: 3,
    };

  const affectedConcept = {
    id: targetNode.id,
    name: targetNode.name,
    nameGujarati: targetNode.nameGujarati,
  };

  // Traverse full prerequisite chain
  const allPrereqNodes = getAllPrerequisites(targetNode.id);
  const prerequisiteConcepts = allPrereqNodes.map((n) => n.name);

  // Traverse downstream dependent concepts
  const allDependentNodes = getAllDependents(targetNode.id);
  const dependentConcepts = allDependentNodes.map((n) => n.name);

  // If concept has zero prerequisites in graph
  if (allPrereqNodes.length === 0) {
    return {
      isRootGapIdentified: false,
      affectedConcept,
      prerequisiteConcepts: [],
      dependentConcepts,
      recommendedLearningOrder: [targetNode.name],
      learningPath: [
        {
          stepNumber: 1,
          conceptId: targetNode.id,
          conceptName: targetNode.name,
          isRoot: false,
          isTarget: true,
          status: "Target Gap",
          note: "Foundational topic with no prerequisites.",
        },
      ],
      rootCauseConfidence: 0.9,
      rootCauseConfidenceLevel: "High",
      rootCauseExplanation: `No underlying prerequisites required. Difficulties on ${targetNode.name} represent direct conceptual unfamiliarity.`,
    };
  }

  // 1. Evidence evaluation across prerequisites
  const history = input.studentHistory || [];
  const errorPatternLower = (input.errorPattern || "").toLowerCase();
  const qEvidence = input.questionEvidence || [];
  const detectedErrorsText = qEvidence.map((q) => q.detectedError.toLowerCase()).join(" ");

  // Check unmastered prerequisites in student record
  let lowestUnmasteredPrereq: ConceptDependencyNode | undefined;
  let evidenceFound = false;
  let evidenceType: "history_deficit" | "error_pattern" | "explicit_flag" = "explicit_flag";

  // Check 1: Historical assessment evidence on prerequisites
  for (const prereq of allPrereqNodes) {
    const record = history.find(
      (h) =>
        h.conceptId === prereq.id ||
        (h.conceptName && h.conceptName.toLowerCase().includes(prereq.name.toLowerCase()))
    );
    if (record && record.score < supportThresh) {
      lowestUnmasteredPrereq = prereq;
      evidenceFound = true;
      evidenceType = "history_deficit";
      break;
    }
  }

  // Check 2: Error patterns matching prerequisite concepts
  if (!lowestUnmasteredPrereq) {
    for (const prereq of allPrereqNodes) {
      const pName = prereq.name.toLowerCase();
      // Heuristics for place value & regrouping
      if (
        (pName.includes("regroup") && (errorPatternLower.includes("regroup") || detectedErrorsText.includes("regroup"))) ||
        (pName.includes("place value") && (errorPatternLower.includes("place value") || detectedErrorsText.includes("column") || detectedErrorsText.includes("place value"))) ||
        (pName.includes("multiplication") && (errorPatternLower.includes("multiplication") || errorPatternLower.includes("times table") || detectedErrorsText.includes("multiplication"))) ||
        (pName.includes("skip count") && (errorPatternLower.includes("skip count") || detectedErrorsText.includes("skip"))) ||
        (pName.includes("nouns") && (errorPatternLower.includes("plural") || detectedErrorsText.includes("plural")))
      ) {
        lowestUnmasteredPrereq = prereq;
        evidenceFound = true;
        evidenceType = "error_pattern";
        break;
      }
    }
  }

  // Check 3: Explicit prerequisitesMastered === false flag from caller
  if (!lowestUnmasteredPrereq && input.prerequisitesMastered === false) {
    // Select the immediate prerequisite before the target concept
    lowestUnmasteredPrereq = allPrereqNodes[allPrereqNodes.length - 1];
    evidenceFound = true;
    evidenceType = "explicit_flag";
  }

  // 2. Scenario A: A genuine root cause was identified with evidence
  if (lowestUnmasteredPrereq && evidenceFound) {
    const rootConcept = {
      id: lowestUnmasteredPrereq.id,
      name: lowestUnmasteredPrereq.name,
      nameGujarati: lowestUnmasteredPrereq.nameGujarati,
    };

    // Build the ordered learning path starting from root prerequisite to affected concept
    const recommendedLearningOrder: string[] = [];
    const rootIndex = allPrereqNodes.findIndex((n) => n.id === lowestUnmasteredPrereq!.id);
    const activePrereqs = rootIndex !== -1 ? allPrereqNodes.slice(rootIndex) : [lowestUnmasteredPrereq];

    for (const p of activePrereqs) {
      recommendedLearningOrder.push(p.name);
    }
    recommendedLearningOrder.push(targetNode.name);

    // Build structured step-by-step learning path
    const learningPath: LearningPathStep[] = [];
    let step = 1;

    // Prerequisite concepts prior to root (assumed mastered)
    if (rootIndex > 0) {
      for (let i = 0; i < rootIndex; i++) {
        learningPath.push({
          stepNumber: step++,
          conceptId: allPrereqNodes[i].id,
          conceptName: allPrereqNodes[i].name,
          isRoot: false,
          isTarget: false,
          status: "Mastered",
          note: "Foundational baseline confirmed mastered.",
        });
      }
    }

    // Root gap step
    learningPath.push({
      stepNumber: step++,
      conceptId: lowestUnmasteredPrereq.id,
      conceptName: lowestUnmasteredPrereq.name,
      isRoot: true,
      isTarget: false,
      status: "Root Gap",
      note: "Root obstacle: Retraining here eliminates bottleneck.",
    });

    // Intermediate prerequisite steps leading up to target
    for (let i = rootIndex + 1; i < allPrereqNodes.length; i++) {
      learningPath.push({
        stepNumber: step++,
        conceptId: allPrereqNodes[i].id,
        conceptName: allPrereqNodes[i].name,
        isRoot: false,
        isTarget: false,
        status: "In Progress",
        note: "Dependent concept needing reinforcement.",
      });
    }

    // Final target concept step
    learningPath.push({
      stepNumber: step++,
      conceptId: targetNode.id,
      conceptName: targetNode.name,
      isRoot: false,
      isTarget: true,
      status: "Target Gap",
      note: "Target competency to verify after root remediation.",
    });

    const confidence =
      evidenceType === "history_deficit"
        ? 0.94
        : evidenceType === "error_pattern"
        ? 0.88
        : 0.82;
    const confidenceLevel: ConfidenceLevel = confidence >= 0.8 ? "High" : "Medium";

    return {
      isRootGapIdentified: true,
      rootConcept,
      affectedConcept,
      prerequisiteConcepts,
      dependentConcepts,
      recommendedLearningOrder,
      learningPath,
      rootCauseConfidence: confidence,
      rootCauseConfidenceLevel: confidenceLevel,
      rootCauseExplanation: `Student experiences difficulty on ${targetNode.name} primarily due to an unmastered prerequisite in ${lowestUnmasteredPrereq.name}. Remediating ${lowestUnmasteredPrereq.name} first provides the necessary conceptual anchor before re-attempting ${targetNode.name}.`,
    };
  }

  // 3. Scenario B: Prerequisites verified mastered (Direct concept roadblock)
  const allPrereqsVerified =
    history.length > 0 &&
    allPrereqNodes.every((p) => {
      const rec = history.find((h) => h.conceptId === p.id);
      return rec && rec.score >= masteryThresh;
    });

  if (allPrereqsVerified || input.prerequisitesMastered === true) {
    const recommendedLearningOrder = [...prerequisiteConcepts, targetNode.name];
    const learningPath: LearningPathStep[] = allPrereqNodes.map((p, idx) => ({
      stepNumber: idx + 1,
      conceptId: p.id,
      conceptName: p.name,
      isRoot: false,
      isTarget: false,
      status: "Mastered",
      note: "Prerequisite verified above mastery benchmark.",
    }));

    learningPath.push({
      stepNumber: learningPath.length + 1,
      conceptId: targetNode.id,
      conceptName: targetNode.name,
      isRoot: false,
      isTarget: true,
      status: "Target Gap",
      note: "Direct roadblock on target competency.",
    });

    return {
      isRootGapIdentified: false,
      affectedConcept,
      prerequisiteConcepts,
      dependentConcepts,
      recommendedLearningOrder,
      learningPath,
      rootCauseConfidence: 0.89,
      rootCauseConfidenceLevel: "High",
      rootCauseExplanation: `All foundational prerequisites (${prerequisiteConcepts.join(", ")}) are verified mastered. Roadblock is localized directly to ${targetNode.name}.`,
    };
  }

  // 4. Scenario C: Insufficient evidence — DO NOT FABRICATE A ROOT CAUSE
  return {
    isRootGapIdentified: false,
    affectedConcept,
    prerequisiteConcepts,
    dependentConcepts,
    recommendedLearningOrder: [targetNode.name],
    learningPath: [
      {
        stepNumber: 1,
        conceptId: targetNode.id,
        conceptName: targetNode.name,
        isRoot: false,
        isTarget: true,
        status: "Target Gap",
        note: "Diagnostic verification required across prerequisites.",
      },
    ],
    rootCauseConfidence: 0.35,
    rootCauseConfidenceLevel: "Low",
    rootCauseExplanation: `Prerequisites exist (${prerequisiteConcepts.join(", ")}), but student assessment history has no verified evaluations on them. Do not assume prerequisite failure without diagnostic testing.`,
    insufficientEvidenceWarning:
      "Insufficient evidence to isolate root cause — run a short 3-question prerequisite diagnostic before prescribing multi-step remediation.",
  };
}
