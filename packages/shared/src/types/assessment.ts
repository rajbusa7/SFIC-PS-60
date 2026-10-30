export type SubjectCode = "MATH" | "ENG" | "GUJ" | "EVS" | "SCI" | "SST" | "HIN";

export interface Subject {
  id: string;
  name: string;
  nameGujarati?: string;
  code: SubjectCode;
  languageCode: "en" | "gu";
}

export interface Concept {
  id: string;
  subjectId: string;
  subjectCode: SubjectCode;
  grade: number;
  name: string;
  nameGujarati?: string;
  description: string;
  prerequisites?: string[];
}

export interface Assessment {
  id: string;
  classroomId: string;
  subjectId: string;
  subjectCode: SubjectCode;
  title: string;
  assessmentDate: string;
  status: "draft" | "published";
  maxMarks: number;
  conceptIds: string[];
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  studentId: string;
  conceptId: string;
  marksObtained: number;
  maximumMarks: number;
  percentage: number;
  questionCount?: number;
  correctCount?: number;
  notes?: string;
  recordedAt: string;
}
