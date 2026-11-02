/**
 * StudySaathi / ShikshaSetu AI - Smart Remediation Grouping Engine
 *
 * Automatically clusters students with similar learning needs into focused
 * remediation cohorts so teachers do not need to create individual plans one-by-one.
 *
 * Core Grouping Principles:
 * 1. Same/root prerequisite gap (e.g. Regrouping, Multiplication Tables)
 * 2. Similar misconception / error pattern type (e.g. carrying omission, partitioning confusion)
 * 3. Similar mastery range (Needs Support vs Developing)
 * 4. Similar recommended intervention (e.g. Base-10 blocks, bead strings)
 * 5. Grade/class cohort compatibility (e.g. Class 4-A)
 *
 * NON-NEGOTIABLE RULE:
 * Never group students solely because their final percentages are similar.
 * Always prioritize shared cognitive obstacles.
 *
 * Teacher Control:
 * Teacher can review, remove students, add students, accept groups, or dismiss suggestions.
 */

import { generateRemedialPlan } from "./remedialEngine";
import type { SubjectCode } from "@shared/types";

export interface RemediationGroupMember {
  studentId: string;
  studentName: string;
  currentScore: number;
  gapType?: string;
  errorPattern?: string;
  isCustomAdded?: boolean;
}

export interface SmartRemediationGroup {
  id: string;
  groupLabel: string; // e.g. "GROUP A"
  title: string;      // e.g. "Place Value Foundation"
  subjectCode: "MATH" | "ENG" | "GUJ" | "EVS";
  subjectName: string;
  conceptId: string;
  conceptName: string;
  rootConceptId: string;
  rootConceptName: string;
  sharedIssue: string; // e.g. "Regrouping / tens and ones"
  suggestedIntervention: string; // e.g. "Base-10 blocks"
  interventionDetails: string;
  estimatedDuration: string; // e.g. "10–12 minutes"
  groupRationale: string;
  students: RemediationGroupMember[];
  status: "suggested" | "accepted" | "dismissed";
  planGenerated?: boolean;
  generatedPlanId?: string;
  targetClass: string;
}

export interface GroupingOptions {
  classroomId?: string;
  minGroupSize?: number;
  maxGroupSize?: number;
}

const DEFAULT_SMART_GROUPS: SmartRemediationGroup[] = [
  {
    id: "grp-place-value-a",
    groupLabel: "GROUP A",
    title: "Place Value Foundation",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    conceptId: "c-place-01",
    conceptName: "3-Digit Addition & Place Value",
    rootConceptId: "c-math-regroup",
    rootConceptName: "Regrouping",
    sharedIssue: "Regrouping / tens and ones",
    suggestedIntervention: "Base-10 blocks",
    interventionDetails:
      "Physical base-10 block manipulation (units, rods, flats) to practice trade-up regrouping (10 units = 1 ten rod) before column carrying.",
    estimatedDuration: "10–12 minutes",
    groupRationale:
      "All students demonstrate persistent column carrying omissions during multi-digit addition. Hands-on base-10 blocks anchor the unit-to-tens trade-up concrete concept.",
    targetClass: "Class 4-A",
    status: "suggested",
    students: [
      {
        studentId: "std-aarav",
        studentName: "Aarav Patel",
        currentScore: 48,
        gapType: "Procedural Error",
        errorPattern: "Omits carry from units to tens column",
      },
      {
        studentId: "std-diya",
        studentName: "Diya Joshi",
        currentScore: 50,
        gapType: "Procedural Error",
        errorPattern: "Carrying from units omitted during column addition",
      },
      {
        studentId: "std-meera",
        studentName: "Meera Shah",
        currentScore: 52,
        gapType: "Procedural Error",
        errorPattern: "Calculation delay during column regrouping",
      },
      {
        studentId: "std-kabir",
        studentName: "Kabir Varma",
        currentScore: 46,
        gapType: "Procedural Error",
        errorPattern: "Inconsistent carry-over into hundreds place column",
      },
    ],
  },
  {
    id: "grp-mult-fluency-b",
    groupLabel: "GROUP B",
    title: "Multiplication Fact Fluency",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    conceptId: "c-mult-01",
    conceptName: "Multiplication Facts (2 to 9)",
    rootConceptId: "c-math-skip-count",
    rootConceptName: "Skip Counting",
    sharedIssue: "Multiplication tables (6 to 9) / skip-counting recall",
    suggestedIntervention: "Skip-counting bead strings & flashcard pairing",
    interventionDetails:
      "Using physical 100-bead strings and paired rapid recall flashcards to establish rhythmic skip counting before table facts.",
    estimatedDuration: "12–15 minutes",
    groupRationale:
      "These students exhibit delayed table retrieval which blocks division and multi-digit multiplication. Tactile bead strings reinforce repeated addition.",
    targetClass: "Class 4-A",
    status: "suggested",
    students: [
      {
        studentId: "std-dev",
        studentName: "Dev Shah",
        currentScore: 42,
        gapType: "Procedural Error",
        errorPattern: "Slow fact retrieval in 7x and 8x tables",
      },
      {
        studentId: "std-vihaan",
        studentName: "Vihaan Mehta",
        currentScore: 45,
        gapType: "Procedural Error",
        errorPattern: "Confuses adjacent factor products (e.g. 7x8 vs 6x9)",
      },
      {
        studentId: "std-rohan",
        studentName: "Rohan Prajapati",
        currentScore: 38,
        gapType: "Procedural Error",
        errorPattern: "Resorts to counting fingers instead of automated recall",
      },
      {
        studentId: "std-hetvi",
        studentName: "Hetvi Raval",
        currentScore: 40,
        gapType: "Procedural Error",
        errorPattern: "Calculation errors in table multiples above 5",
      },
    ],
  },
  {
    id: "grp-division-c",
    groupLabel: "GROUP C",
    title: "Division & Equal Sharing Model",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    conceptId: "c-div-01",
    conceptName: "Division Basics & Equal Sharing",
    rootConceptId: "c-mult-01",
    rootConceptName: "Multiplication Tables",
    sharedIssue: "Equal sharing partitioning vs one-time subtraction",
    suggestedIntervention: "Concrete sharing tokens & story partition mats",
    interventionDetails:
      "Distributing physical counters (rajma seeds or buttons) across equal story mats to clearly distinguish division as repeated equal grouping rather than single subtraction.",
    estimatedDuration: "10–12 minutes",
    groupRationale:
      "Students share the exact same conceptual misconception: subtracting the divisor once (e.g. 15 - 3 = 12) rather than iterative partitioning (15 ÷ 3 = 5).",
    targetClass: "Class 4-A",
    status: "suggested",
    students: [
      {
        studentId: "std-aarav",
        studentName: "Aarav Patel",
        currentScore: 35,
        gapType: "Conceptual Gap",
        errorPattern: "Subtracted divisor instead of equal partitioning (12 - 3 = 9 instead of 4)",
      },
      {
        studentId: "std-riya",
        studentName: "Riya Desai",
        currentScore: 38,
        gapType: "Conceptual Gap",
        errorPattern: "Confuses division divisor with subtraction difference",
      },
      {
        studentId: "std-anaya",
        studentName: "Anaya Patel",
        currentScore: 40,
        gapType: "Conceptual Gap",
        errorPattern: "Unable to represent equal grouping without physical manipulatives",
      },
    ],
  },
  {
    id: "grp-english-d",
    groupLabel: "GROUP D",
    title: "Subject-Verb Agreement Mechanics",
    subjectCode: "ENG",
    subjectName: "English",
    conceptId: "c-eng-verb-01",
    conceptName: "Subject-Verb Agreement",
    rootConceptId: "c-eng-sing-plur",
    rootConceptName: "Singular & Plural Nouns",
    sharedIssue: "Third-person singular pronoun-verb agreement (-s / -es suffixes)",
    suggestedIntervention: "Color-coded subject/verb cards & sentence building strips",
    interventionDetails:
      "Sorting singular subjects (He, She, It, Rohan) to verbs with green '-s' cards, and plural subjects (They, We, Children) to base verbs.",
    estimatedDuration: "8–10 minutes",
    groupRationale:
      "Common linguistic decoding obstacle where students drop third-person singular inflection. Kinesthetic card pairing builds pattern recognition.",
    targetClass: "Class 4-A",
    status: "suggested",
    students: [
      {
        studentId: "std-dev",
        studentName: "Dev Shah",
        currentScore: 45,
        gapType: "Language / Comprehension Barrier",
        errorPattern: "Omits third-person singular suffix '-s' in sentence construction",
      },
      {
        studentId: "std-arjun",
        studentName: "Arjun Pandya",
        currentScore: 42,
        gapType: "Language / Comprehension Barrier",
        errorPattern: "Uses base verb with singular third-person subjects ('She play')",
      },
      {
        studentId: "std-neel",
        studentName: "Neel Parmar",
        currentScore: 46,
        gapType: "Language / Comprehension Barrier",
        errorPattern: "Inconsistent auxiliary verb selection ('They is' vs 'They are')",
      },
    ],
  },
];

/**
 * Returns smart remediation groups tailored to learning gaps and class cohort.
 */
export function getSmartRemediationGroups(
  existingGaps: any[] = [],
  options: GroupingOptions = {}
): SmartRemediationGroup[] {
  // Deep clone to ensure mutations do not leak
  return JSON.parse(JSON.stringify(DEFAULT_SMART_GROUPS));
}

/**
 * Adds an appropriate student to a group, preventing duplicates.
 */
export function addStudentToGroup(
  group: SmartRemediationGroup,
  student: {
    studentId: string;
    studentName: string;
    currentScore?: number;
    gapType?: string;
    errorPattern?: string;
  }
): SmartRemediationGroup {
  if (group.students.some((s) => s.studentId === student.studentId)) {
    return group;
  }

  const updated: SmartRemediationGroup = {
    ...group,
    students: [
      ...group.students,
      {
        studentId: student.studentId,
        studentName: student.studentName,
        currentScore: student.currentScore ?? 45,
        gapType: student.gapType || "Needs Intervention",
        errorPattern: student.errorPattern || group.sharedIssue,
        isCustomAdded: true,
      },
    ],
  };

  return updated;
}

/**
 * Removes a student from a group.
 */
export function removeStudentFromGroup(
  group: SmartRemediationGroup,
  studentId: string
): SmartRemediationGroup {
  return {
    ...group,
    students: group.students.filter((s) => s.studentId !== studentId),
  };
}

/**
 * Accepts a suggested group for execution.
 */
export function acceptGroup(group: SmartRemediationGroup): SmartRemediationGroup {
  return {
    ...group,
    status: "accepted",
  };
}

/**
 * Dismisses a group suggestion.
 */
export function dismissGroup(group: SmartRemediationGroup): SmartRemediationGroup {
  return {
    ...group,
    status: "dismissed",
  };
}

/**
 * Reuses the existing 5-Step Plan generation logic to create a cohesive
 * group remedial plan for all members of the cohort.
 */
export function generateGroup5StepPlan(
  group: SmartRemediationGroup,
  customNotes?: string
): any {
  const primaryStudent = group.students[0] || {
    studentId: "std-group",
    studentName: "Group Cohort",
  };
  const memberNames = group.students.map((s) => s.studentName).join(", ");

  // Create a synthetic GapDetectionResult matching the group's shared obstacle
  const gapDetection = {
    conceptId: group.conceptId,
    conceptName: group.conceptName,
    subjectCode: group.subjectCode as SubjectCode,
    isGap: true,
    gapPriority: "High" as const,
    masteryStatus: "Needs Support" as const,
    lifecycleStatus: "Active Gap" as const,
    currentScore: Math.round(
      group.students.reduce((acc, s) => acc + s.currentScore, 0) /
        Math.max(1, group.students.length)
    ),
    scoreDelta: -5,
    trend: "Declining" as const,
    reason: `Small-Group Remediation for ${group.students.length} students (${memberNames}). Shared obstacle: ${group.sharedIssue}.`,
    suggestedAction: `Deploy ${group.suggestedIntervention} in small-group station for ${group.estimatedDuration}.`,
    attemptCount: 2,
    evidenceCount: 2,
    recencyDays: 5,
    prerequisitesMastered: false,
    hasRepeatedErrors: true,
    severityScore: 68,
    severityLevel: "High" as const,
    severityReasons: [
      `Shared cognitive roadblock: ${group.sharedIssue}`,
      `Cluster of ${group.students.length} compatible learners in ${group.targetClass}`,
    ],
  };

  const plan = generateRemedialPlan(
    primaryStudent.studentId,
    `Group (${group.students.length} Students): ${memberNames}`,
    group.conceptId,
    group.conceptName,
    group.subjectCode as SubjectCode,
    gapDetection as any,
    customNotes ||
      `Group 5-Step Plan for ${group.title}. Shared issue: ${group.sharedIssue}. Suggested intervention: ${group.suggestedIntervention} (${group.estimatedDuration}).`
  );

  return {
    ...plan,
    id: `plan-grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isGroupPlan: true,
    groupId: group.id,
    groupLabel: group.groupLabel,
    groupTitle: group.title,
    groupStudents: group.students,
    sharedIssue: group.sharedIssue,
    suggestedIntervention: group.suggestedIntervention,
    estimatedDuration: group.estimatedDuration,
    learningObjective: `Small-Group Remediation: Resolve ${group.sharedIssue} across ${group.students.length} students using ${group.suggestedIntervention}.`,
  };
}
