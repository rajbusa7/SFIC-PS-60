import type { SubjectCode } from "./assessment";

export type MasteryStatus = "Needs Support" | "Developing" | "Mastered";
export type GapPriority = "High" | "Medium" | "Low";
export type GapStatus = "Active" | "Under Intervention" | "Resolved" | "Overridden";

export interface LearningGap {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  classroomId?: string;
  conceptId: string;
  conceptName?: string;
  conceptNameGujarati?: string;
  subjectCode?: SubjectCode;
  subjectName?: string;
  grade?: number;
  section?: string;
  priority: GapPriority;
  masteryStatus: MasteryStatus;
  reason: string;
  suggestedAction?: string;
  status: GapStatus;
  attemptsCount: number;
  latestPercentage: number;
  previousPercentage?: number;
  deltaPercentagePoints?: number;
  updatedAt: string;
  remedialPlanId?: string;
  marksObtained?: number;
  maximumMarks?: number;
  assessmentDate?: string;
  thresholdsUsed?: {
    developing: number;
    mastery: number;
  };
}
