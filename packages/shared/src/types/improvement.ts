import { SubjectCode } from "./assessment";

export type ImprovementStatus =
  | "Improvement observed"
  | "No measurable change"
  | "Performance declined"
  | "Insufficient evidence"
  | "Awaiting post-test";

export type ComparabilityStatus =
  | "comparable"
  | "limited_comparability"
  | "not_comparable";

export interface AssessmentEvidenceSnapshot {
  assessmentId: string;
  resultId: string;
  score: number;
  maxMarks: number;
  percentage: number;
  assessmentDate: string;
  recordedAt: string;
  questionCount?: number;
  correctCount?: number;
}

export interface RemedialInterventionSnapshot {
  remedialPlanId: string;
  targetCompetencyId: string;
  totalActivitiesCount: number;
  completedActivitiesCount: number;
  completedStepNumbers: number[];
  interventionStartDate?: string;
  interventionCompletionDate?: string;
  planStatus: string;
}

export interface ImprovementCalculationResult {
  deltaPercentagePoints: number | null;
  relativeImprovementPercentage: number | null;
  status: ImprovementStatus;
  comparabilityStatus: ComparabilityStatus;
  comparabilityNotes: string;
  causalAttributionDisclaimer: string;
  explanation: string;
}

export interface LearningImprovementRecord {
  id: string;
  studentId: string;
  studentName?: string;
  classroomId?: string;
  grade?: number;
  conceptId: string;
  conceptName?: string;
  subjectCode: SubjectCode;
  
  // Baseline (Pre-test)
  preTest: AssessmentEvidenceSnapshot;
  
  // Remedial Intervention (Optional/Linked)
  remedialIntervention?: RemedialInterventionSnapshot;
  
  // Follow-up (Post-test)
  postTest?: AssessmentEvidenceSnapshot;
  
  // Calculated Metrics
  deltaPercentagePoints: number | null;
  relativeImprovementPercentage: number | null;
  status: ImprovementStatus;
  comparabilityStatus: ComparabilityStatus;
  comparabilityNotes: string;
  causalAttributionDisclaimer: string;
  
  calculatedAt: string;
  updatedAt: string;
}

export interface AssessmentComparisonRequest {
  studentId: string;
  conceptId: string;
  preTestAssessmentId?: string;
  postTestAssessmentId?: string;
}

export interface RecordFollowUpAssessmentRequest {
  studentId: string;
  conceptId: string;
  assessmentId: string;
  marksObtained: number;
  maximumMarks: number;
  notes?: string;
  assessmentDate?: string;
  remedialPlanId?: string;
}

export interface ClassImprovementSummary {
  classroomId?: string;
  totalStudentsEvaluated: number;
  improvingCount: number;
  stableCount: number;
  decliningCount: number;
  awaitingPostTestCount: number;
  insufficientEvidenceCount: number;
  averagePercentagePointsGrowth: number;
  improvements: LearningImprovementRecord[];
}
