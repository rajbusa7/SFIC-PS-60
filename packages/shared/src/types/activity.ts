import type { SubjectCode } from "./assessment";

export type ActivityType =
  | "mcq"
  | "true_false"
  | "fill_in_the_blank"
  | "matching"
  | "numerical"
  | "word_problem"
  | "sorting"
  | "flashcard"
  | "reading_comprehension";

export interface ActivityQuestion {
  id: string;
  questionText: string;
  questionTextGujarati?: string;
  type: ActivityType;
  options?: string[]; // for mcq
  optionsGujarati?: string[]; // Gujarati options for bilingual display
  correctAnswer: string | number | boolean;
  explanation: string;
  explanationGujarati?: string;
  hint?: string;
  hintGujarati?: string;
  marks?: number;
  imageUrl?: string;
}

export interface LearningActivity {
  id: string;
  conceptId: string;
  conceptName?: string;
  conceptNameGujarati?: string;
  subjectCode: SubjectCode;
  grade: number;
  chapter?: string;
  chapterGujarati?: string;
  topic?: string;
  topicGujarati?: string;
  learningObjective?: string;
  learningObjectiveGujarati?: string;
  title: string;
  titleGujarati?: string;
  activityType: ActivityType;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMinutes: number;
  questions: ActivityQuestion[];
  createdAt: string;
  // For recommended next activity
  recommendedNextActivityId?: string;
  // XP points for completing this activity
  xpReward?: number;
  // Tags for filtering
  tags?: string[];
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
  incorrectQuestions: string[];
  completedAt: string;
}
