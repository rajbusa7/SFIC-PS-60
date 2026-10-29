import type { SubjectCode } from "./assessment";

export type PlanStatus = "Suggested" | "Approved" | "In Progress" | "Completed" | "Needs Review";

export interface ReassessmentQuestion {
  questionNumber: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
  skillTarget?: string;
}

export interface ReassessmentResult {
  recordedAt: string;
  marksObtained: number;
  maximumMarks: number;
  percentage: number;
  baselinePercentage: number;
  deltaPercentagePoints: number; // e.g., +45 percentage points
  isMastered: boolean;
  studentAnswers?: Record<number, string>;
  masteredSkills?: string[];
  needsSupportSkills?: string[];
  retentionCheckDate?: string;
  followUpPlanId?: string;
  teacherFeedback?: string;
}

export interface RemedialStep {
  stepNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  activityType?: string;
  learningObjective?: string;
  teacherInstructions?: string;
  studentInstructions?: string;
  requiredMaterials?: string[];
  questionsOrExercises?: string[];
  expectedResult?: string;
  completed?: boolean;
}

export interface RemedialPlan {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: number | string;
  studentSection?: string;
  conceptId: string;
  conceptName?: string;
  subjectCode?: SubjectCode;
  learningObjective: string;
  recommendationReason: string;
  status: PlanStatus;
  estimatedMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  requiredMaterials: string[];
  steps: RemedialStep[];
  practiceQuestionsSummary?: string;
  reassessmentCriteria: string;
  teacherInstructions: string;
  teacherNotes?: string;
  completedSteps?: number[];
  createdAt: string;
  reviewDate?: string;
  // Upgraded Pedagogical & Reassessment Attributes
  baselineScore?: number;
  baselineEvidence?: string;
  knownMisconceptions?: string;
  likelyMisconception?: string;
  errorAnalysis?: string;
  gapEvidence?: string;
  isConfirmed?: boolean;
  conceptualErrors?: string[];
  confirmedOrInferred?: "confirmed" | "inferred";
  expectedSkill?: string;
  masteryBenchmark?: number; // e.g. 80
  reassessmentQuestions?: ReassessmentQuestion[];
  reassessmentResult?: ReassessmentResult;
  parentPlanId?: string;
  followUpPlanId?: string;
  worksheet?: any;
  startDate?: string;
  targetDate?: string;
  teacherObservations?: string;
  followUpRecommendations?: string;
  isFollowUp?: boolean;
  updatedAt?: string;
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

