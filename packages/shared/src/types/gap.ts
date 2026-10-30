import type { SubjectCode } from "./assessment";

export type MasteryStatus = "Needs Support" | "Developing" | "Mastered";
export type GapPriority = "High" | "Medium" | "Low";
export type GapStatus = "Active" | "Under Intervention" | "Resolved" | "Overridden";

export type DiagnosisCategory =
  | "Conceptual Gap"
  | "Procedural Error"
  | "Possible Careless Error"
  | "Prerequisite Weakness"
  | "Developing / Not Yet Mastered"
  | "Insufficient Evidence"
  | "Mastered";

export interface LearningGap {
  id: string;
  studentId: string;
  studentName?: string;
  conceptId: string;
  conceptName?: string;
  subjectCode?: SubjectCode;
  grade?: number;
  section?: string;
  subjectName?: string;
  priority: GapPriority;
  masteryStatus: MasteryStatus;
  reason: string;
  suggestedAction?: string;
  diagnosisType?: DiagnosisCategory;
  status: GapStatus;
  attemptsCount: number;
  latestPercentage: number;
  previousPercentage?: number;
  deltaPercentagePoints?: number;
  trend?: "Improving" | "Stable" | "Declining";
  trendLabel?: string;
  updatedAt: string;
  remedialPlanId?: string;
  remedialPlanStatus?: string;
  reassessmentDue?: boolean;
}
