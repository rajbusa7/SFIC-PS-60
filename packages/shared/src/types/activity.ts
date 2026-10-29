import type { SubjectCode } from "./assessment";

export type ActivityType =
  | "mcq"
  | "true_false"
  | "fill_in_the_blank"
  | "matching"
  | "numerical"
  | "word_problem";

export interface ActivityQuestion {
  id: string;
  questionText: string;
  questionTextGujarati?: string;
  type: ActivityType;
  options?: string[]; // for mcq
  correctAnswer: string | number | boolean;
  explanation?: string;
  hint?: string;
  imageUrl?: string;
}

export interface LearningActivity {
  id: string;
  conceptId: string;
  conceptName?: string;
  subjectCode: SubjectCode;
  grade: number;
  title: string;
  titleGujarati?: string;
  activityType: ActivityType;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMinutes: number;
  questions: ActivityQuestion[];
  learningObjective?: string;
  remedialPlanId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityAssignment {
  id: string;
  activityId: string;
  studentId: string;
  remedialPlanId?: string;
  status: "Assigned" | "In Progress" | "Completed";
  assignedAt: string;
  completedAt?: string;
  score?: number;
  maxScore?: number;
}

export interface ActivityAttempt {
  id: string;
  assignmentId?: string;
  studentId: string;
  activityId: string;
  score: number;
  maximumScore: number;
  percentage: number;
  answers: Record<string, string | number | boolean>;
  incorrectQuestions?: string[];
  completedAt: string;
}
