import type { SubjectCode } from "./assessment";

export type PlanStatus = "Suggested" | "Approved" | "In Progress" | "Completed" | "Needs Review";

export interface RemedialStep {
  stepNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  activityType?: string;
  learningObjective?: string;
  materials?: string[];
  checkUnderstanding?: string;
  completed?: boolean;
}

export interface RemedialPlan {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  classroomId?: string;
  grade?: number;
  conceptId: string;
  conceptName?: string;
  subjectCode?: SubjectCode;
  subjectName?: string;
  learningGapId?: string;
  triggeringAssessmentId?: string;
  baselineScore?: number;
  learningObjective: string;
  recommendationReason: string;
  status: PlanStatus;
  estimatedMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  requiredMaterials: string[];
  steps: RemedialStep[];
  completedStepsCount?: number;
  progressPercentage?: number;
  practiceQuestionsSummary?: string;
  reassessmentCriteria: string;
  teacherInstructions: string;
  teacherNotes?: string;
  createdAt: string;
  updatedAt?: string;
  reviewDate?: string;
}

export interface InterventionEvent {
  id: string;
  studentId: string;
  conceptId: string;
  remedialPlanId?: string;
  eventType: "plan_created" | "plan_approved" | "activity_completed" | "reassessment_conducted" | "teacher_note";
  notes: string;
  createdAt: string;
}
