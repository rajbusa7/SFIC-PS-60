import type { SubjectCode } from "./assessment";

export interface WorksheetQuestion {
  questionNumber: number;
  question: string;
  marks: number;
  type?: string;
  options?: string[];
  answerKey: string;
  stepExplanation?: string;
}

export interface WorksheetData {
  id?: string;
  title: string;
  subject: string;
  subjectCode?: SubjectCode;
  grade: number;
  concept: string;
  conceptId?: string;
  remedialPlanId?: string;
  studentName?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  instructions: string;
  totalMarks: number;
  questions: WorksheetQuestion[];
  teacherGuidelines?: string;
  createdAt?: string;
  updatedAt?: string;
}
