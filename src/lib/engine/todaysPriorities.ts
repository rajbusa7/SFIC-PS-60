/**
 * StudySaathi AI — Today's Priorities Engine (Phase 5)
 *
 * Deterministic calculation engine categorizing student learning gaps into 4 actionable daily priorities:
 * 1. Need Immediate Support (Active, unresolved gaps with Needs Support status)
 * 2. Developing (Active, unresolved gaps with Developing status)
 * 3. Ready to Reassess (Gaps with verified completed interventions or explicit reassessment-due flags)
 * 4. Recently Mastered (Gaps transitioned to Mastered or Resolved within the previous 7 days)
 *
 * Implements strict student-level deduplication: counts unique students per category,
 * preventing double-counting when a student has multiple gaps.
 */

export interface PriorityGapRecord {
  id: string;
  studentId: string;
  studentName?: string;
  conceptId?: string;
  conceptName?: string;
  latestPercentage?: number;
  dynamicStatus?: string;
  masteryStatus?: string;
  status?: string;
  priority?: string;
  updatedAt?: string;
  remedialPlanId?: string;
  remedialPlanStatus?: string;
  reassessmentDue?: boolean;
  gapReopened?: boolean;
  trend?: string;
}

export interface TodaysPrioritiesResult {
  immediateSupportCount: number;
  developingCount: number;
  readyToReassessCount: number;
  recentlyMasteredCount: number;
  reopenedGapsCount: number;
  immediateSupportStudentIds: string[];
  developingStudentIds: string[];
  readyToReassessStudentIds: string[];
  recentlyMasteredStudentIds: string[];
  reopenedStudentIds: string[];
  immediateSupportGapIds: string[];
  developingGapIds: string[];
  readyToReassessGapIds: string[];
  recentlyMasteredGapIds: string[];
  reopenedGapIds: string[];
  totalActionableStudents: number;
}

/**
 * Checks if a given ISO timestamp falls within the last `maxDays` (default: 7 days)
 */
export function isWithinRecentDays(dateStr?: string, maxDays = 7, referenceTime = Date.now()): boolean {
  if (!dateStr) return false;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return false;
  const diffMs = referenceTime - time;
  const maxMs = maxDays * 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= maxMs;
}

/**
 * Safely resolves the priority status category of a gap record,
 * returning null for malformed, unassigned, or invalid records.
 */
export function resolveGapCategoryStatus(
  gap: PriorityGapRecord,
  supportThreshold = 60,
  masteryThreshold = 80
): "Needs Support" | "Developing" | "Mastered" | null {
  if (!gap) return null;

  const raw = (gap.dynamicStatus || gap.masteryStatus || gap.status || "").toString().toLowerCase().trim();

  // Explicit status matches
  if (raw.includes("master") || raw === "resolved" || raw.includes("નિપુણ")) {
    return "Mastered";
  }
  if (
    raw.includes("develop") ||
    raw === "under intervention" ||
    raw === "in progress" ||
    raw.includes("વિકાસશીલ")
  ) {
    return "Developing";
  }
  if (
    raw.includes("support") ||
    raw === "active" ||
    raw.includes("સહાય") ||
    raw.includes("need")
  ) {
    return "Needs Support";
  }

  // If status is ambiguous or empty, check valid numerical score
  if (typeof gap.latestPercentage === "number" && !isNaN(gap.latestPercentage)) {
    if (gap.latestPercentage >= masteryThreshold) return "Mastered";
    if (gap.latestPercentage < supportThreshold) return "Needs Support";
    return "Developing";
  }

  // Truly invalid or unclassified
  return null;
}

/**
 * Calculates Today's Priorities metrics dynamically from actual application data.
 */
export function calculateTodaysPriorities(
  gaps: PriorityGapRecord[] = [],
  referenceTime = Date.now(),
  supportThreshold = 60,
  masteryThreshold = 80
): TodaysPrioritiesResult {
  const immediateSupportStudents = new Set<string>();
  const developingStudents = new Set<string>();
  const readyToReassessStudents = new Set<string>();
  const recentlyMasteredStudents = new Set<string>();
  const reopenedStudents = new Set<string>();

  const immediateSupportGapIds: string[] = [];
  const developingGapIds: string[] = [];
  const readyToReassessGapIds: string[] = [];
  const recentlyMasteredGapIds: string[] = [];
  const reopenedGapIds: string[] = [];

  for (const gap of gaps) {
    if (!gap || !gap.studentId) continue;

    const studentId = String(gap.studentId).trim();
    if (!studentId) continue;

    const isReopened = gap.gapReopened === true || gap.status === "Gap Reopened";
    if (isReopened) {
      reopenedStudents.add(studentId);
      if (gap.id) reopenedGapIds.push(gap.id);
    }

    const effectiveStatus = resolveGapCategoryStatus(gap, supportThreshold, masteryThreshold);
    if (!effectiveStatus) continue;

    const isResolved =
      !isReopened &&
      (effectiveStatus === "Mastered" ||
        gap.status === "Resolved" ||
        gap.dynamicStatus === "Mastered" ||
        gap.masteryStatus === "Mastered");

    // -------------------------------------------------------------
    // 1. Need Immediate Support
    // Active, unresolved records with Needs Support status (or Reopened Gaps)
    // -------------------------------------------------------------
    if ((effectiveStatus === "Needs Support" || isReopened) && !isResolved) {
      immediateSupportStudents.add(studentId);
      if (gap.id) immediateSupportGapIds.push(gap.id);
    }

    // -------------------------------------------------------------
    // 2. Developing
    // Active, unresolved records with Developing status
    // -------------------------------------------------------------
    if (effectiveStatus === "Developing" && !isResolved && !isReopened) {
      developingStudents.add(studentId);
      if (gap.id) developingGapIds.push(gap.id);
    }

    // -------------------------------------------------------------
    // 3. Ready to Reassess
    // Verified completed remedial plans or explicit reassessment-due flags
    // (Never assume simply because a plan was generated)
    // -------------------------------------------------------------
    const hasCompletedIntervention =
      gap.remedialPlanStatus === "Completed" ||
      gap.reassessmentDue === true;

    if (hasCompletedIntervention && !isResolved) {
      readyToReassessStudents.add(studentId);
      if (gap.id) readyToReassessGapIds.push(gap.id);
    }

    // -------------------------------------------------------------
    // 4. Recently Mastered / Resolved
    // Must genuinely be Mastered/Resolved within the previous 7 days
    // -------------------------------------------------------------
    if (isResolved && isWithinRecentDays(gap.updatedAt, 7, referenceTime)) {
      recentlyMasteredStudents.add(studentId);
      if (gap.id) recentlyMasteredGapIds.push(gap.id);
    }
  }

  // Calculate unique student count needing attention today
  const allActionableStudents = new Set<string>([
    ...immediateSupportStudents,
    ...developingStudents,
    ...readyToReassessStudents,
    ...reopenedStudents,
  ]);

  return {
    immediateSupportCount: immediateSupportStudents.size,
    developingCount: developingStudents.size,
    readyToReassessCount: readyToReassessStudents.size,
    recentlyMasteredCount: recentlyMasteredStudents.size,
    reopenedGapsCount: reopenedStudents.size,
    immediateSupportStudentIds: Array.from(immediateSupportStudents),
    developingStudentIds: Array.from(developingStudents),
    readyToReassessStudentIds: Array.from(readyToReassessStudents),
    recentlyMasteredStudentIds: Array.from(recentlyMasteredStudents),
    reopenedStudentIds: Array.from(reopenedStudents),
    immediateSupportGapIds,
    developingGapIds,
    readyToReassessGapIds,
    recentlyMasteredGapIds,
    reopenedGapIds,
    totalActionableStudents: allActionableStudents.size,
  };
}
