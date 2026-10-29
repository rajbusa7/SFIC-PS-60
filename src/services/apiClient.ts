/**
 * ShikshaSetu AI - Centralized Frontend API Client
 * SFIC Gujarat Hackathon 2026 Problem Statement PS-60
 *
 * Configurable via NEXT_PUBLIC_API_URL:
 * - In Vercel / same-origin deployment: defaults to "/api/v1"
 * - In standalone backend deployment: points to "http://localhost:5000/api/v1" or production URL
 * - Automatic JSON parsing, error handling, and authorization header attachment
 */

import type {
  Student,
  Assessment,
  AssessmentResult,
  LearningGap,
  RemedialPlan,
  WorksheetData,
  TutorResponseData,
  OverviewReport,
  School,
  SchoolSettings,
  LearningActivity,
  ActivityAttempt,
  User,
  UserRole,
} from "@shared/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

class ApiClientError extends Error {
  status?: number;
  data?: any;
  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Read saved user role if available to pass to backend
  let authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    try {
      const savedUser = localStorage.getItem("shikshasetu_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role) {
          authHeaders["X-User-Role"] = u.role;
          authHeaders["Authorization"] = `Bearer demo-${u.role}-token`;
        }
      }
    } catch {}
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {}
    throw new ApiClientError(errorMsg, res.status);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  // System Health
  async healthCheck() {
    return request<any>("/health");
  },

  // Auth
  async login(email: string, role: UserRole = "teacher") {
    return request<{ success: boolean; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  async logout() {
    return request<{ success: boolean }>("/auth/logout", { method: "POST" });
  },

  async getCurrentUser() {
    return request<{ success: boolean; user: User }>("/auth/me");
  },

  // Students
  async getStudents(filters?: { classroomId?: string; grade?: number; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.classroomId) params.append("classroomId", filters.classroomId);
    if (filters?.grade) params.append("grade", String(filters.grade));
    if (filters?.search) params.append("search", filters.search);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return request<{ success: boolean; count: number; students: Student[] }>(`/students${queryStr}`);
  },

  async getStudentById(id: string) {
    return request<{ success: boolean; student: Student }>(`/students/${id}`);
  },

  async createStudent(student: Omit<Student, "id" | "createdAt">) {
    return request<{ success: boolean; student: Student }>("/students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  },

  async updateStudent(id: string, updates: Partial<Student>) {
    return request<{ success: boolean; student: Student }>(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteStudent(id: string) {
    return request<{ success: boolean; message: string }>(`/students/${id}`, {
      method: "DELETE",
    });
  },

  async getStudentLearningGaps(studentId: string) {
    return request<{ success: boolean; count: number; learningGaps: LearningGap[] }>(
      `/students/${studentId}/learning-gaps`
    );
  },

  async getStudentRemedialPlans(studentId: string) {
    return request<{ success: boolean; count: number; remedialPlans: RemedialPlan[] }>(
      `/students/${studentId}/remedial-plans`
    );
  },

  // Assessments
  async getAssessments(classroomId?: string, subjectId?: string) {
    const params = new URLSearchParams();
    if (classroomId) params.append("classroomId", classroomId);
    if (subjectId) params.append("subjectId", subjectId);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return request<{ success: boolean; count: number; assessments: Assessment[] }>(`/assessments${queryStr}`);
  },

  async createAssessment(
    assessmentData: Omit<Assessment, "id" | "createdAt">,
    initialResults?: Omit<AssessmentResult, "id" | "assessmentId">[]
  ) {
    return request<{ success: boolean; assessment: Assessment }>("/assessments", {
      method: "POST",
      body: JSON.stringify({ ...assessmentData, initialResults }),
    });
  },

  async recordResults(results: Omit<AssessmentResult, "id">[]) {
    return request<{ success: boolean; results: AssessmentResult[] }>("/assessments/results", {
      method: "POST",
      body: JSON.stringify({ results }),
    });
  },

  // Learning Gaps
  async getLearningGaps(filters?: { studentId?: string; priority?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append("studentId", filters.studentId);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.status) params.append("status", filters.status);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return request<{ success: boolean; count: number; learningGaps: LearningGap[] }>(`/learning-gaps${queryStr}`);
  },

  async analyzeLearningGap(input: {
    studentId?: string;
    studentName?: string;
    studentClass?: number;
    subject?: string;
    conceptName?: string;
    marksObtained: number;
    maximumMarks: number;
    teacherObservations?: string;
    language?: "en" | "gu";
  }) {
    return request<{
      success: boolean;
      analysis: any;
      isAiGenerated: boolean;
      provider: string;
      modelUsed: string;
      note?: string;
    }>("/learning-gaps/analyze", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Remedial Plans
  async getRemedialPlans(studentId?: string, status?: string) {
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (status) params.append("status", status);
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return request<{ success: boolean; count: number; remedialPlans: RemedialPlan[] }>(`/remedial-plans${queryStr}`);
  },

  async generateRemedialPlan(input: {
    studentId?: string;
    studentName?: string;
    conceptId?: string;
    conceptName?: string;
    subjectCode?: string;
    latestPercentage?: number;
    gapReason?: string;
    language?: "en" | "gu";
  }) {
    return request<{
      success: boolean;
      plan: RemedialPlan;
      isAiGenerated: boolean;
      provider: string;
      modelUsed: string;
      note?: string;
    }>("/remedial-plans/generate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateRemedialPlan(id: string, updates: Partial<RemedialPlan>) {
    return request<{ success: boolean; remedialPlan: RemedialPlan }>(`/remedial-plans`, {
      method: "POST",
      body: JSON.stringify({ plan: { id, ...updates } }),
    });
  },

  // Worksheets
  async generateWorksheet(input: {
    grade?: number;
    subject?: string;
    concept?: string;
    difficulty?: string;
    questionCount?: number;
    language?: "en" | "gu";
    questionType?: string;
    studentName?: string;
  }) {
    return request<{
      success: boolean;
      worksheet: WorksheetData;
      isAiGenerated: boolean;
      provider: string;
      modelUsed: string;
      note?: string;
    }>("/worksheets/generate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // AI Tutor & Chat
  async askAiTutor(query: string, grade = 4, subject = "Mathematics", language = "en") {
    return request<{
      success: boolean;
      tutorResponse: TutorResponseData;
      isAiGenerated: boolean;
      provider: string;
      modelUsed: string;
      note?: string;
    }>("/ai/tutor", {
      method: "POST",
      body: JSON.stringify({ query, grade, subject, language }),
    });
  },

  async askAiChat(message: string, history: any[] = [], language = "en", userRole = "teacher") {
    return request<{
      success: boolean;
      message: string;
      isAiGenerated: boolean;
      provider: string;
      modelUsed: string;
      note?: string;
    }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history, language, userRole }),
    });
  },

  // Reports
  async getReportsOverview(grade?: number) {
    const q = grade ? `?grade=${grade}` : "";
    return request<{ success: boolean; report: OverviewReport }>(`/reports/overview${q}`);
  },

  // Activities & Attempts
  async getActivities(conceptId?: string) {
    const q = conceptId ? `?conceptId=${conceptId}` : "";
    return request<{ success: boolean; count: number; activities: LearningActivity[] }>(`/activities${q}`);
  },

  async recordActivityAttempt(data: {
    studentId: string;
    activityId: string;
    score: number;
    maximumScore: number;
    answers?: Record<string, any>;
    incorrectQuestions?: string[];
  }) {
    return request<{ success: boolean; attempt: ActivityAttempt }>("/activities/attempt", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Settings & Demo Reset
  async getSettings() {
    return request<{ success: boolean; school: School; settings: SchoolSettings }>("/settings");
  },

  async updateSettings(updates: Partial<SchoolSettings>) {
    return request<{ success: boolean; settings: SchoolSettings }>("/settings", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async resetDemoData() {
    return request<{ success: boolean; message: string }>("/reset-demo", { method: "POST" });
  },
};
