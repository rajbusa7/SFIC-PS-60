export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface AiRequestOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
}

export interface AiResponse<T = any> {
  success: boolean;
  content: string;
  data?: T;
  isAiGenerated: boolean;
  provider: "gemini" | "openai" | "offline_fallback";
  modelUsed: string;
  note?: string;
  error?: string;
}

export interface TutorResponseData {
  topic: string;
  simpleExplanation: string;
  classroomExample: string;
  stepByStepActivity: {
    stepNumber: number;
    title: string;
    instruction: string;
    durationMinutes: number;
  }[];
  practiceQuestions: {
    questionNumber: number;
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  }[];
  teacherPedagogyTip: string;
  language: "en" | "gu";
}

export interface GapAnalysisResponseData {
  studentId?: string;
  studentName?: string;
  conceptName?: string;
  deterministicMetrics: {
    marksObtained: number;
    maximumMarks: number;
    calculatedPercentage: number;
    masteryStatus: string;
    priority: string;
  };
  aiPedagogicalDiagnosis: {
    evidenceSummary: string;
    underlyingMisconception: string;
    recommendedRemedialActivities: string[];
    suggestedReassessmentMethod: string;
    ethicalSafetyDisclosure: string;
  };
}
