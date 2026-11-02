/**
 * StudySaathi / ShikshaSetu AI - Class Learning Gap Heatmap Engine
 *
 * Provides classroom-level competency aggregation across:
 * - Needs Support
 * - Developing
 * - Mastered
 *
 * Supports interactive bidirectional filtering between the Heatmap matrix
 * and the individual student Learning Gap card list.
 */

import { analyzeRootCause } from "./prerequisiteEngine";
import { diagnoseLearningGap } from "./diagnosisEngine";
import type { MasteryStatus } from "@shared/types";

export interface CompetencyHeatmapRow {
  competencyId: string;
  competencyName: string;
  subjectCode: "MATH" | "ENG" | "GUJ" | "EVS";
  subjectName: string;
  needsSupportCount: number;
  developingCount: number;
  masteredCount: number;
  totalStudents: number;
  grade: number;
  studentsByStatus: {
    "Needs Support": any[];
    "Developing": any[];
    "Mastered": any[];
  };
}

export interface ClassHeatmapFilter {
  competencyId?: string;
  competencyName?: string;
  status?: "Needs Support" | "Developing" | "Mastered";
}

export interface ClassHeatmapData {
  classroomId: string;
  className: string;
  totalClassStudents: number;
  competencies: CompetencyHeatmapRow[];
}

// 40-Student Classroom Cohort for Class 4-A (Standard Primary School Section)
const CLASS_4A_ROSTER = [
  { id: "std-aarav", name: "Aarav Patel", roll: 1 },
  { id: "std-meera", name: "Meera Shah", roll: 2 },
  { id: "std-riya", name: "Riya Desai", roll: 3 },
  { id: "std-dev", name: "Dev Shah", roll: 4 },
  { id: "std-anaya", name: "Anaya Patel", roll: 5 },
  { id: "std-vihaan", name: "Vihaan Mehta", roll: 6 },
  { id: "std-diya", name: "Diya Joshi", roll: 7 },
  { id: "std-kabir", name: "Kabir Varma", roll: 8 },
  { id: "std-sanvi", name: "Sanvi Parekh", roll: 9 },
  { id: "std-ishaan", name: "Ishaan Solanki", roll: 10 },
  { id: "std-anvi", name: "Anvi Bhatt", roll: 11 },
  { id: "std-yash", name: "Yash Trivedi", roll: 12 },
  { id: "std-tanvi", name: "Tanvi Dave", roll: 13 },
  { id: "std-rohan", name: "Rohan Prajapati", roll: 14 },
  { id: "std-kavya", name: "Kavya Rathod", roll: 15 },
  { id: "std-hetvi", name: "Hetvi Raval", roll: 16 },
  { id: "std-neel", name: "Neel Parmar", roll: 17 },
  { id: "std-arjun", name: "Arjun Pandya", roll: 18 },
  { id: "std-krisha", name: "Krisha Modi", roll: 19 },
  { id: "std-jay", name: "Jay Patel", roll: 20 },
  { id: "std-priya", name: "Priya Solanki", roll: 21 },
  { id: "std-harsh", name: "Harsh Chavda", roll: 22 },
  { id: "std-bhavin", name: "Bhavin Zala", roll: 23 },
  { id: "std-pooja-v", name: "Pooja Vaghela", roll: 24 },
  { id: "std-sneha", name: "Sneha Barot", roll: 25 },
  { id: "std-chirag", name: "Chirag Parmar", roll: 26 },
  { id: "std-dhaval", name: "Dhaval Chauhan", roll: 27 },
  { id: "std-khushi", name: "Khushi Soni", roll: 28 },
  { id: "std-manish", name: "Manish Gohel", roll: 29 },
  { id: "std-nidhi", name: "Nidhi Shah", roll: 30 },
  { id: "std-om", name: "Om Vora", roll: 31 },
  { id: "std-parth", name: "Parth Makwana", roll: 32 },
  { id: "std-riddhi", name: "Riddhi Thakor", roll: 33 },
  { id: "std-sahil", name: "Sahil Koli", roll: 34 },
  { id: "std-tanisha", name: "Tanisha Rana", roll: 35 },
  { id: "std-urvashi", name: "Urvashi Dabhi", roll: 36 },
  { id: "std-varun", name: "Varun Jadav", roll: 37 },
  { id: "std-zenil", name: "Zenil Vankar", roll: 38 },
  { id: "std-aditi", name: "Aditi Bharwad", roll: 39 },
  { id: "std-brijesh", name: "Brijesh Rabari", roll: 40 },
];

interface CompetencySpec {
  id: string;
  name: string;
  subjectCode: "MATH" | "ENG" | "GUJ" | "EVS";
  subjectName: string;
  needsSupportCount: number;
  developingCount: number;
  masteredCount: number;
  grade: number;
  rootConcept: { id: string; name: string };
  prerequisites: string[];
  recommendedOrder: string[];
  rootExplanation: string;
  errorPattern: string;
  gapType: string;
  sampleQuestion: {
    questionText: string;
    topic: string;
    studentResponse: string;
    correctResponse: string;
    detectedError: string;
  };
}

const CLASS_4A_COMPETENCY_SPECS: CompetencySpec[] = [
  {
    id: "c-math-pv-2",
    name: "Place Value",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    needsSupportCount: 8,
    developingCount: 12,
    masteredCount: 20,
    grade: 4,
    rootConcept: { id: "c-math-regroup", name: "Regrouping" },
    prerequisites: ["Ones & Tens", "Place Value", "Regrouping"],
    recommendedOrder: ["Place Value", "Regrouping", "3-Digit Addition"],
    rootExplanation: "Students struggle with base-10 column alignment and carrying over into hundreds place.",
    errorPattern: "Omits tens-to-hundreds carrying during multi-digit regrouping",
    gapType: "Procedural Error",
    sampleQuestion: {
      questionText: "Calculate: 385 + 247",
      topic: "Place Value & Regrouping",
      studentResponse: "522",
      correctResponse: "632",
      detectedError: "Dropped carrying into hundreds column (3 + 2 = 5 instead of 6)",
    },
  },
  {
    id: "c-mult-01",
    name: "Multiplication",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    needsSupportCount: 11,
    developingCount: 14,
    masteredCount: 15,
    grade: 4,
    rootConcept: { id: "c-math-skip-count", name: "Skip Counting" },
    prerequisites: ["Skip Counting", "Multiplication Tables"],
    recommendedOrder: ["Skip Counting", "Multiplication Tables", "Multiplication"],
    rootExplanation: "Fluency roadblock in multiplication tables (6, 7, 8, 9) slowing multi-digit multiplication.",
    errorPattern: "Multiplication fact retrieval failure during double-digit product calculation",
    gapType: "Procedural Error",
    sampleQuestion: {
      questionText: "Calculate: 7 x 8",
      topic: "Multiplication Facts",
      studentResponse: "54",
      correctResponse: "56",
      detectedError: "Confused 7 x 8 (56) with 9 x 6 (54)",
    },
  },
  {
    id: "c-div-01",
    name: "Division",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    needsSupportCount: 7,
    developingCount: 10,
    masteredCount: 23,
    grade: 4,
    rootConcept: { id: "c-mult-01", name: "Multiplication Tables" },
    prerequisites: ["Skip Counting", "Multiplication Tables", "Multiplication"],
    recommendedOrder: ["Multiplication Tables", "Multiplication", "Division"],
    rootExplanation: "Unable to connect division as inverse multiplication; confuses divisor with subtraction difference.",
    errorPattern: "Subtracts divisor once instead of iterative partitioning (e.g. 15 ÷ 3 treated as 15 - 3 = 12)",
    gapType: "Conceptual Gap",
    sampleQuestion: {
      questionText: "Share 15 pencils equally among 3 boxes. How many in each box?",
      topic: "Equal Sharing Division",
      studentResponse: "12 pencils",
      correctResponse: "5 pencils",
      detectedError: "Subtracted 3 from 15 instead of equal grouping (15 ÷ 3 = 5)",
    },
  },
  {
    id: "c-eng-verb-01",
    name: "Subject-Verb Agreement",
    subjectCode: "ENG",
    subjectName: "English",
    needsSupportCount: 6,
    developingCount: 13,
    masteredCount: 21,
    grade: 4,
    rootConcept: { id: "c-eng-sing-plur", name: "Singular & Plural Nouns" },
    prerequisites: ["Word Formation", "Singular & Plural Nouns"],
    recommendedOrder: ["Singular & Plural Nouns", "Subject-Verb Agreement"],
    rootExplanation: "Confusion matching third-person singular subjects with verb suffixes (-s/-es).",
    errorPattern: "Applies plural verb forms to singular third-person pronouns (e.g. 'He run fast')",
    gapType: "Language / Comprehension Barrier",
    sampleQuestion: {
      questionText: "Complete the sentence: The dog _____ in the garden.",
      topic: "Subject-Verb Agreement",
      studentResponse: "play",
      correctResponse: "plays",
      detectedError: "Omitted third-person singular suffix '-s'",
    },
  },
  {
    id: "c-eng-comp-01",
    name: "Reading Comprehension",
    subjectCode: "ENG",
    subjectName: "English",
    needsSupportCount: 9,
    developingCount: 15,
    masteredCount: 16,
    grade: 4,
    rootConcept: { id: "c-eng-vocab", name: "Basic Vocabulary" },
    prerequisites: ["Vocabulary", "Sentence Construction"],
    recommendedOrder: ["Basic Vocabulary", "Sentence Construction", "Reading Comprehension"],
    rootExplanation: "Vocabulary decoding obstacles prevent student from identifying explicit facts in English passages.",
    errorPattern: "Guesses answers based on word matching without semantic comprehension",
    gapType: "Language / Comprehension Barrier",
    sampleQuestion: {
      questionText: "According to the story, why was the bird singing?",
      topic: "Factual Retrieval",
      studentResponse: "Because it was night",
      correctResponse: "Because the sun was rising",
      detectedError: "Chose unrelated sentence fragment from passage",
    },
  },
  {
    id: "c-guj-matra-01",
    name: "Gujarati Matras & Varnamala",
    subjectCode: "GUJ",
    subjectName: "Gujarati",
    needsSupportCount: 5,
    developingCount: 11,
    masteredCount: 24,
    grade: 4,
    rootConcept: { id: "c-guj-varnamala-01", name: "ગુજરાતી મૂળાક્ષરો" },
    prerequisites: ["મૂળાક્ષરો", "સ્વર ચિહ્નો"],
    recommendedOrder: ["મૂળાક્ષરો", "કાનો અને માત્રા", "જોડાક્ષર શબ્દો"],
    rootExplanation: "હ્રસ્વ-દીર્ઘ ચિહ્નોની સાચી ઓળખ અને શબ્દ વાચનમાં અસમર્થતા.",
    errorPattern: "હ્રસ્વ 'િ' અને દીર્ઘ 'ી' વચ્ચે ભૂલ",
    gapType: "Procedural Error",
    sampleQuestion: {
      questionText: "સાચો શબ્દ શોધો: (દિન / દીન)",
      topic: "કાનો-માત્રા ઓળખ",
      studentResponse: "દીન (ગરીબ)",
      correctResponse: "દિન (દિવસ)",
      detectedError: "અર્થ અનુસાર હ્રસ્વ-દીર્ઘ ચિહ્ન ઓળખવામાં ભૂલ",
    },
  },
];

/**
 * Generates deterministic student gap objects for a cohort given a competency spec.
 */
function createCohortGapsForCompetency(
  spec: CompetencySpec,
  existingGaps: any[] = []
): {
  needsSupportGaps: any[];
  developingGaps: any[];
  masteredGaps: any[];
} {
  const needsSupportGaps: any[] = [];
  const developingGaps: any[] = [];
  const masteredGaps: any[] = [];

  // Match any existing real gap from the store first
  const existingMatches = existingGaps.filter((g) => {
    const cName = (g.conceptName || "").toLowerCase();
    const cId = (g.conceptId || "").toLowerCase();
    const targetName = spec.name.toLowerCase();
    const targetId = spec.id.toLowerCase();
    return (
      cId === targetId ||
      cName === targetName ||
      cName.includes(targetName) ||
      targetName.includes(cName)
    );
  });

  let rosterIdx = 0;

  // 1. Needs Support Cohort
  for (let i = 0; i < spec.needsSupportCount; i++) {
    // Check if an existing student gap from the store can be used
    const existingMatch = existingMatches.find(
      (m) =>
        (m.masteryStatus === "Needs Support" || (m.latestPercentage ?? m.currentScore ?? 0) < 60) &&
        !needsSupportGaps.some((g) => g.studentId === m.studentId)
    );

    if (existingMatch) {
      needsSupportGaps.push({
        ...existingMatch,
        conceptId: spec.id,
        conceptName: spec.name,
        subjectCode: spec.subjectCode,
        subjectName: spec.subjectName,
        grade: spec.grade,
        section: "A",
        masteryStatus: "Needs Support",
        dynamicStatus: "Needs Support",
        priority: "High",
        dynamicPriority: "High",
      });
    } else {
      const student = CLASS_4A_ROSTER[rosterIdx % CLASS_4A_ROSTER.length];
      rosterIdx++;
      const score = 32 + (i * 3) % 25; // 32% - 55%
      const prevScore = score + 4;

      needsSupportGaps.push({
        id: `gap-${student.id}-${spec.id}`,
        studentId: student.id,
        studentName: student.name,
        conceptId: spec.id,
        conceptName: spec.name,
        subjectCode: spec.subjectCode,
        subjectName: spec.subjectName,
        grade: spec.grade,
        section: "A",
        priority: score < 40 ? "Critical" : "High",
        masteryStatus: "Needs Support",
        dynamicStatus: "Needs Support",
        dynamicLifecycle: "Active Gap",
        status: "Active",
        latestPercentage: score,
        currentScore: score,
        previousPercentage: prevScore,
        previousScore: prevScore,
        deltaPercentagePoints: -4,
        scoreDelta: -4,
        trend: "Declining",
        trendText: "↓ -4% Declining",
        trendLabel: "↓ -4% Declining",
        attemptsCount: 2,
        attemptCount: 2,
        evidenceCount: 2,
        severityScore: 70 - Math.floor(score / 3),
        severityLevel: score < 40 ? "Critical" : "High",
        reason: `${student.name} scored ${score}% in ${spec.name}, below the 60% developing benchmark. ${spec.rootExplanation}`,
        gapType: spec.gapType,
        dynamicGapType: spec.gapType,
        gapTypeReason: `${student.name} repeatedly exhibits: ${spec.errorPattern}.`,
        confidence: 0.91,
        confidenceScore: 0.91,
        confidenceLevel: "High",
        dynamicConfidenceLevel: "High",
        diagnosis: `${spec.gapType} in ${spec.name}`,
        diagnosisTitle: `${spec.gapType} in ${spec.name}`,
        assessmentsAnalyzed: 2,
        questionsAnalyzed: 8,
        errorPatternDetected: spec.errorPattern,
        triggerRule: `Score (${score}%) fell below 60% developing support threshold.`,
        supportingEvidence: [
          `Assessment score of ${score}% requires immediate small-group intervention`,
          `Persistent pattern: ${spec.errorPattern}`,
          `Prerequisite bottleneck isolated to ${spec.rootConcept.name}`,
        ],
        questionEvidence: [
          {
            questionNumber: 1,
            topic: spec.sampleQuestion.topic,
            questionText: spec.sampleQuestion.questionText,
            studentResponse: spec.sampleQuestion.studentResponse,
            correctResponse: spec.sampleQuestion.correctResponse,
            detectedError: spec.sampleQuestion.detectedError,
            relatedConcept: spec.name,
          },
        ],
        isRootGapIdentified: true,
        dynamicIsRootGapIdentified: true,
        rootConcept: spec.rootConcept,
        dynamicRootConcept: spec.rootConcept,
        affectedConcept: { id: spec.id, name: spec.name },
        dynamicAffectedConcept: { id: spec.id, name: spec.name },
        prerequisiteConcepts: spec.prerequisites,
        dynamicPrerequisiteConcepts: spec.prerequisites,
        recommendedLearningOrder: spec.recommendedOrder,
        dynamicRecommendedLearningOrder: spec.recommendedOrder,
        rootCauseConfidence: 0.92,
        rootCauseConfidenceLevel: "High",
        dynamicRootCauseConfidence: 0.92,
        dynamicRootCauseConfidenceLevel: "High",
        rootCauseExplanation: `${student.name}'s difficulty in ${spec.name} stems directly from unmastered ${spec.rootConcept.name}. Remediate ${spec.rootConcept.name} first with hands-on manipulatives.`,
        suggestedAction: `Assign focused 5-step concrete remedial practice starting with ${spec.rootConcept.name}.`,
      });
    }
  }

  // 2. Developing Cohort
  for (let i = 0; i < spec.developingCount; i++) {
    const existingMatch = existingMatches.find(
      (m) =>
        m.masteryStatus === "Developing" &&
        !developingGaps.some((g) => g.studentId === m.studentId)
    );

    if (existingMatch) {
      developingGaps.push({
        ...existingMatch,
        conceptId: spec.id,
        conceptName: spec.name,
        subjectCode: spec.subjectCode,
        subjectName: spec.subjectName,
        grade: spec.grade,
        section: "A",
        masteryStatus: "Developing",
        dynamicStatus: "Developing",
      });
    } else {
      const student = CLASS_4A_ROSTER[rosterIdx % CLASS_4A_ROSTER.length];
      rosterIdx++;
      const score = 62 + (i * 2) % 16; // 62% - 78%

      developingGaps.push({
        id: `gap-${student.id}-${spec.id}`,
        studentId: student.id,
        studentName: student.name,
        conceptId: spec.id,
        conceptName: spec.name,
        subjectCode: spec.subjectCode,
        subjectName: spec.subjectName,
        grade: spec.grade,
        section: "A",
        priority: "Medium",
        masteryStatus: "Developing",
        dynamicStatus: "Developing",
        dynamicLifecycle: "Monitoring/Developing",
        status: "Active",
        latestPercentage: score,
        currentScore: score,
        previousPercentage: score - 5,
        previousScore: score - 5,
        deltaPercentagePoints: 5,
        scoreDelta: 5,
        trend: "Improving",
        trendText: "↑ +5% Improving",
        trendLabel: "↑ +5% Improving",
        attemptsCount: 2,
        attemptCount: 2,
        evidenceCount: 2,
        severityScore: 35,
        severityLevel: "Medium",
        reason: `${student.name} is in the developing range (${score}%) toward 80% mastery in ${spec.name}.`,
        gapType: "Procedural Error",
        dynamicGapType: "Procedural Error",
        gapTypeReason: `${student.name} understands core concepts but exhibits minor procedural slips.`,
        confidence: 0.88,
        confidenceScore: 0.88,
        confidenceLevel: "High",
        dynamicConfidenceLevel: "High",
        diagnosis: `Developing Competence in ${spec.name}`,
        diagnosisTitle: `Developing Competence in ${spec.name}`,
        assessmentsAnalyzed: 2,
        questionsAnalyzed: 6,
        errorPatternDetected: "Occasional procedural slip in multi-step problem solving",
        triggerRule: `Score (${score}%) is within developing range (60% - 79%).`,
        supportingEvidence: [
          `Score of ${score}% demonstrates foundational grasp`,
          "Requires guided practice to reach 80% independent mastery benchmark",
        ],
        questionEvidence: [],
        isRootGapIdentified: false,
        dynamicIsRootGapIdentified: false,
        affectedConcept: { id: spec.id, name: spec.name },
        dynamicAffectedConcept: { id: spec.id, name: spec.name },
        prerequisiteConcepts: spec.prerequisites,
        dynamicPrerequisiteConcepts: spec.prerequisites,
        recommendedLearningOrder: spec.recommendedOrder,
        dynamicRecommendedLearningOrder: spec.recommendedOrder,
        rootCauseConfidence: 0.85,
        rootCauseConfidenceLevel: "High",
        dynamicRootCauseConfidence: 0.85,
        dynamicRootCauseConfidenceLevel: "High",
        rootCauseExplanation: `Student is actively developing ${spec.name}. Reinforce with targeted paired practice.`,
        suggestedAction: "Deploy guided practice sheets and short exit-ticket checks.",
      });
    }
  }

  // 3. Mastered Cohort
  for (let i = 0; i < spec.masteredCount; i++) {
    const student = CLASS_4A_ROSTER[rosterIdx % CLASS_4A_ROSTER.length];
    rosterIdx++;
    const score = 82 + (i * 2) % 18; // 82% - 98%

    masteredGaps.push({
      id: `gap-${student.id}-${spec.id}`,
      studentId: student.id,
      studentName: student.name,
      conceptId: spec.id,
      conceptName: spec.name,
      subjectCode: spec.subjectCode,
      subjectName: spec.subjectName,
      grade: spec.grade,
      section: "A",
      priority: "Low",
      masteryStatus: "Mastered",
      dynamicStatus: "Mastered",
      dynamicLifecycle: "Closed Gap",
      status: "Closed Gap",
      latestPercentage: score,
      currentScore: score,
      previousPercentage: score - 2,
      previousScore: score - 2,
      deltaPercentagePoints: 2,
      scoreDelta: 2,
      trend: "Stable",
      trendText: "✓ Mastered",
      trendLabel: "✓ Mastered",
      attemptsCount: 2,
      attemptCount: 2,
      evidenceCount: 2,
      severityScore: 10,
      severityLevel: "Low",
      reason: `${student.name} has achieved independent verified mastery (${score}%) in ${spec.name}.`,
      gapType: "Procedural Error",
      dynamicGapType: "Procedural Error",
      confidence: 0.95,
      confidenceScore: 0.95,
      confidenceLevel: "High",
      dynamicConfidenceLevel: "High",
      diagnosis: `Verified Mastery in ${spec.name}`,
      diagnosisTitle: `Verified Mastery in ${spec.name}`,
      triggerRule: `Score (${score}%) meets or exceeds the 80% mastery threshold.`,
      supportingEvidence: ["Independent accuracy verified across multiple assessments"],
      questionEvidence: [],
      isRootGapIdentified: false,
      dynamicIsRootGapIdentified: false,
      affectedConcept: { id: spec.id, name: spec.name },
      dynamicAffectedConcept: { id: spec.id, name: spec.name },
      prerequisiteConcepts: spec.prerequisites,
      dynamicPrerequisiteConcepts: spec.prerequisites,
      recommendedLearningOrder: spec.recommendedOrder,
      dynamicRecommendedLearningOrder: spec.recommendedOrder,
      rootCauseConfidence: 0.95,
      rootCauseConfidenceLevel: "High",
      dynamicRootCauseConfidence: 0.95,
      dynamicRootCauseConfidenceLevel: "High",
      rootCauseExplanation: `Competency verified mastered. Ready for enrichment challenges.`,
      suggestedAction: "Assign advanced peer-tutoring and creative application tasks.",
    });
  }

  return { needsSupportGaps, developingGaps, masteredGaps };
}

/**
 * Returns class heatmap data summarizing competencies across Class 4-A.
 */
export function getClassLearningGapHeatmap(
  existingGaps: any[] = [],
  classroomId: string = "cls-4a"
): ClassHeatmapData {
  const competencies: CompetencyHeatmapRow[] = CLASS_4A_COMPETENCY_SPECS.map((spec) => {
    const { needsSupportGaps, developingGaps, masteredGaps } = createCohortGapsForCompetency(
      spec,
      existingGaps
    );

    return {
      competencyId: spec.id,
      competencyName: spec.name,
      subjectCode: spec.subjectCode,
      subjectName: spec.subjectName,
      needsSupportCount: needsSupportGaps.length,
      developingCount: developingGaps.length,
      masteredCount: masteredGaps.length,
      totalStudents: needsSupportGaps.length + developingGaps.length + masteredGaps.length,
      grade: spec.grade,
      studentsByStatus: {
        "Needs Support": needsSupportGaps,
        Developing: developingGaps,
        Mastered: masteredGaps,
      },
    };
  });

  return {
    classroomId,
    className: "Class 4-A (Primary Section)",
    totalClassStudents: 40,
    competencies,
  };
}

/**
 * Filters the learning gap list based on the active heatmap filter.
 * If no filter is active, returns the fallback/default gaps.
 */
export function filterGapsByHeatmap(
  filter: ClassHeatmapFilter | null | undefined,
  heatmapData: ClassHeatmapData,
  defaultGaps: any[]
): any[] {
  if (!filter || !filter.competencyName || !filter.status) {
    return defaultGaps;
  }

  const targetName = filter.competencyName.trim().toLowerCase();
  const targetId = filter.competencyId?.trim().toLowerCase();

  const matchedComp = heatmapData.competencies.find((c) => {
    const cName = c.competencyName.toLowerCase();
    const cId = c.competencyId.toLowerCase();
    return (
      (targetId && cId === targetId) ||
      cName === targetName ||
      cName.includes(targetName) ||
      targetName.includes(cName)
    );
  });

  if (!matchedComp) {
    return defaultGaps;
  }

  const filteredStudents = matchedComp.studentsByStatus[filter.status] || [];
  return filteredStudents;
}
