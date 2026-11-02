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
export type DiagnosisCategory = GapDiagnosisType | string;
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

export interface ConceptDependencyNode {
  id: string;
  name: string;
  nameGujarati?: string;
  subjectCode?: SubjectCode;
  prerequisites: string[];
  grade?: number;
  description?: string;
}

export interface LearningPathStep {
  stepNumber: number;
  conceptId: string;
  conceptName: string;
  isRoot: boolean;
  isTarget: boolean;
  status: "Mastered" | "Root Gap" | "In Progress" | "Target Gap";
  note?: string;
}

export interface PrerequisiteAnalysisResult {
  isRootGapIdentified: boolean;
  rootConcept?: {
    id: string;
    name: string;
    nameGujarati?: string;
  };
  affectedConcept: {
    id: string;
    name: string;
    nameGujarati?: string;
  };
  prerequisiteConcepts: string[];
  dependentConcepts: string[];
  recommendedLearningOrder: string[];
  learningPath: LearningPathStep[];
  rootCauseConfidence: number;
  rootCauseConfidenceLevel: ConfidenceLevel;
  rootCauseExplanation: string;
  insufficientEvidenceWarning?: string;
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

  // Prerequisite & Root-Cause Analysis Engine
  isRootGapIdentified?: boolean;
  rootConcept?: { id: string; name: string; nameGujarati?: string };
  affectedConcept?: { id: string; name: string; nameGujarati?: string };
  prerequisiteConcepts?: string[];
  dependentConcepts?: string[];
  recommendedLearningOrder?: string[];
  learningPath?: LearningPathStep[];
  rootCauseConfidence?: number;
  rootCauseConfidenceLevel?: ConfidenceLevel;
  rootCauseExplanation?: string;
  insufficientEvidenceWarning?: string;

  // Longitudinal Progress & Reassessment History
  gapReopened?: boolean;
  previousMasteryScore?: number;
  masteryDate?: string;
  assessmentHistory?: AssessmentHistoryItem[];
  totalImprovement?: number;
  latestScoreDelta?: number;
  numberOfAssessments?: number;
  numberOfInterventions?: number;
  timeToMastery?: string;
  reassessmentDue?: boolean;
  remedialPlanStatus?: string;

  updatedAt: string;
  remedialPlanId?: string;
  // Backwards compatibility legacy aliases
  diagnosisType?: any;
  trendLabel?: string;
}

export interface AssessmentHistoryItem {
  id?: string;
  assessmentId?: string;
  date?: string;
  score: number;
  marks?: string;
  assessment?: string;
  intervention?: string;
  status: MasteryStatus | string;
  scoreDelta?: number;
  notes?: string;
}

export type MapNodeRole =
  | "ROOT GAP"
  | "CURRENT GAP"
  | "AFFECTED CONCEPT"
  | "FOUNDATIONAL PREREQUISITE";

export interface LearningGapMapNode {
  id: string;
  name: string;
  nameGujarati?: string;
  role: MapNodeRole;
  status: MasteryStatus;
  statusScore?: number;
  grade?: number;
  orderIndex: number;
  note?: string;
  isRoot: boolean;
  isCurrent: boolean;
  isAffected: boolean;
  prerequisites: string[];
}

export interface LearningGapMapData {
  nodes: LearningGapMapNode[];
  rootGap?: LearningGapMapNode;
  currentGap: LearningGapMapNode;
  affectedConcepts: LearningGapMapNode[];
  recommendedLearningOrder: string[];
  totalNodes: number;
  subjectCode?: string;
}

// =========================================================================
// PHASE 6: ROLE-AWARE INTERPRETATION & PARENT BRIDGE
// =========================================================================

export type AudienceRole = "teacher" | "student" | "parent";

export interface ParentHomeActivity {
  id?: string;
  conceptId?: string;
  conceptName: string;
  title: string;
  titleGu?: string;
  titleHi?: string;
  durationMinutes: number; // 5-10 min
  commonHouseholdMaterials: string[];
  whatParentDoes: string;
  whatParentDoesGu?: string;
  whatParentDoesHi?: string;
  whatChildPractices: string;
  whatChildPracticesGu?: string;
  whatChildPracticesHi?: string;
  conversationalPrompt: string;
  conversationalPromptGu?: string;
  conversationalPromptHi?: string;
  language?: "en" | "gu" | "hi";
  status: "Suggested" | "Sent" | "Completed";
  sentAt?: string;
  completedAt?: string;
  teacherNotes?: string;
}

export interface RoleAwareGapInterpretation {
  role: AudienceRole;
  language: "en" | "gu" | "hi";
  // Headline & Badging
  badgeLabel: string;
  badgeVariant: "mint" | "saffron" | "coral" | "default" | "mastered" | "developing" | "needsSupport";
  headline: string;
  subheadline?: string;
  // Student & Parent: What the child is doing well (Strengths)
  strengthsSummary?: string;
  // What the child is currently practising (Focus)
  currentFocus: string;
  growthFocus?: string;
  currentGoal?: string;
  // Progress & Improvement
  progressNarrative: string;
  observedGrowth?: string;
  // Parent: One Simple Home Activity (5-10 min)
  homeActivity?: ParentHomeActivity;
  parentHomeActivity?: ParentHomeActivity;
  // Teacher / Parent recommendation
  teacherRecommendation: string;
  reassessmentUpdate?: string;
  // Student-facing supportive encouragement & positive milestones
  studentEncouragement?: string;
  nextActivityPrompt?: string;
  nextLearningStep?: string;
  skillsMastered?: string[];
  milestones?: string[];
  // Teacher professional deep-dive (retained for full professional transparency)
  professionalDiagnosis?: {
    severityScore?: number;
    severityLevel?: string;
    gapType?: string;
    triggerRule?: string;
    rootConceptName?: string;
    prerequisiteCount?: number;
    evidenceCount?: number;
    confidenceLevel?: string;
  };
}

// =========================================================================
// PHASE 6: INTERVENTION EFFECTIVENESS TRACKING
// =========================================================================

export interface InterventionRecord {
  id: string;
  interventionType: string;
  conceptId: string;
  conceptName: string;
  subjectCode: string;
  gapType?: string;
  studentId: string;
  studentName: string;
  groupId?: string;
  preInterventionScore: number;
  postInterventionScore: number;
  scoreDelta: number; // post - pre
  date: string;
  durationMinutes: number;
  teacherFeedback?: string;
  outcome: "Mastered" | "Developing" | "Needs Further Support";
}

export interface InterventionEffectivenessSummary {
  interventionType: string;
  timesUsed: number;
  averageObservedImprovement: number; // in percentage points
  masteryCount: number;
  masteryRate: number; // 0 - 100 percentage
  masteryAchievementRate?: number;
  averageDurationMinutes?: number;
  associatedConcepts: string[];
  sampleObservationText: string;
  evidenceConfidence: "High" | "Moderate" | "Insufficient";
  hasSufficientEvidence: boolean; // >= 2 observations
  recommendedWording: string;
  nonCausalStatement?: string;
}
