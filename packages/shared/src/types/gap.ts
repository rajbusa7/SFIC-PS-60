import type { SubjectCode } from "./assessment";

export type MasteryStatus = "Needs Support" | "Developing" | "Mastered";
export type GapPriority = "Critical" | "High" | "Medium" | "Low";
export type GapLifecycleStatus = "Active Gap" | "Monitoring/Developing" | "Closed Gap";
export type ScoreTrend = "Improving" | "Stable" | "Declining" | "Insufficient Data";
export type GapDiagnosisType =
  | "Conceptual Gap"
  | "Procedural Error"
  | "Careless Slip"
  | "Language / Comprehension Barrier"
  | "Prerequisite Gap"
  | "Insufficient Evidence";
export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface QuestionEvidenceItem {
  questionNumber?: number;
  questionText: string;
  topic?: string;
  studentResponse: string;
  correctResponse: string;
  detectedError: string;
  relatedConcept?: string;
}

export type GapStatus =
  | "Active Gap"
  | "Monitoring/Developing"
  | "Closed Gap"
  | "Active"
  | "Under Intervention"
  | "Resolved"
  | "Overridden";

export interface LearningGap {
  id: string;
  studentId: string;
  studentName?: string;
  conceptId: string;
  conceptName?: string;
  subjectCode?: SubjectCode;
  subjectName?: string;
  grade?: number;
  section?: string;
  priority: GapPriority;
  masteryStatus: MasteryStatus;
  lifecycleStatus?: GapLifecycleStatus;
  reason: string;
  suggestedAction?: string;
  status: GapStatus;

  // Scoring & Trajectory metrics
  latestPercentage: number;
  currentScore?: number;
  previousPercentage?: number;
  previousScore?: number;
  deltaPercentagePoints?: number;
  scoreDelta?: number;
  trend?: ScoreTrend;
  trendText?: string;

  // Multi-dimensional indicators & Severity Engine
  attemptsCount: number;
  attemptCount?: number;
  evidenceCount?: number;
  recencyDays?: number;
  prerequisitesMastered?: boolean;
  hasRepeatedErrors?: boolean;
  severityScore?: number;
  severityLevel?: GapPriority;
  severityReasons?: string[];

  // Learning Gap Diagnosis Engine
  gapType?: GapDiagnosisType;
  gapTypeReason?: string;
  confidence?: number;
  confidenceScore?: number;
  confidenceLevel?: ConfidenceLevel;
  diagnosis?: string;
  diagnosisTitle?: string;
  assessmentsAnalyzed?: number;
  questionsAnalyzed?: number;
  errorPatternDetected?: string;
  triggerRule?: string;
  supportingEvidence?: string[];
  questionEvidence?: QuestionEvidenceItem[];
  lowConfidenceDisclaimer?: string;

  updatedAt: string;
  remedialPlanId?: string;
}
