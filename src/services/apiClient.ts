/**
 * StudySaathi AI - Centralized Frontend API Client
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
  Meeting,
  MeetingWithInvites,
  MeetingStatus,
  ParentMeetingInviteItem,
  InviteRsvpStatus,
  MeetingInvite,
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
      const savedUser = localStorage.getItem("studysaathi_user") || localStorage.getItem("shikshasetu_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role) {
          authHeaders["X-User-Role"] = u.role;
          authHeaders["Authorization"] = `Bearer demo-${u.role}-token`;
        }
        if (u.id) {
          authHeaders["X-User-Id"] = u.id;
        }
        if (u.email) {
          authHeaders["X-User-Email"] = u.email;
        }
      }
    } catch {}
  }

  const config: RequestInit = {
    cache: "no-store",
    credentials: "include",
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

  // Parent-Teacher Meetings (PTM Step 1)
  async getPtmTargets() {
    return request<{
      success: boolean;
      classrooms: Array<{ id: string; grade: number; section: string; academicYear: string }>;
      students: Array<{
        id: string;
        displayName: string;
        studentCode: string;
        classroomId: string;
        grade: number;
        section: string;
        linkedParents: Array<{ id: string; userId: string; name: string; phone?: string; parentCode?: string }>;
      }>;
      parents: Array<{ id: string; userId: string; name: string; phone?: string; parentCode?: string; studentIds: string[] }>;
    }>("/meetings/targets");
  },

  async getTeacherMeetings(filters?: { status?: MeetingStatus; classId?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.classId) params.append("classId", filters.classId);
    const q = params.toString() ? `?${params.toString()}` : "";
    return request<{ success: boolean; count: number; meetings: MeetingWithInvites[] }>(`/meetings${q}`);
  },

  async createMeeting(payload: {
    title: string;
    agenda: string;
    type: "one_to_one" | "group";
    startTime: string;
    durationMin: number;
    classId?: string;
    studentIds?: string[];
    parentId?: string;
    offeredSlots?: string[];
    targetMode?: "class" | "students" | "parent";
  }) {
    return request<{ success: boolean; meeting: MeetingWithInvites }>("/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateMeeting(
    id: string,
    updates: {
      title?: string;
      agenda?: string;
      startTime?: string;
      durationMin?: number;
      status?: MeetingStatus;
      offeredSlots?: string[];
    }
  ) {
    return request<{ success: boolean; meeting: MeetingWithInvites }>(`/meetings/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async cancelMeeting(id: string) {
    return request<{ success: boolean; meeting: MeetingWithInvites }>(`/meetings/${id}/cancel`, {
      method: "POST",
    });
  },

  async getMyMeetings() {
    return request<{ success: boolean; count: number; invites: ParentMeetingInviteItem[] }>("/meetings/my");
  },

  async respondToMeetingInvite(
    meetingId: string,
    payload: {
      rsvpStatus: InviteRsvpStatus;
      slotTime?: string;
      rescheduleNote?: string;
      studentId?: string;
    }
  ) {
    return request<{ success: boolean; invite: MeetingInvite }>(`/meetings/${meetingId}/rsvp`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append("unreadOnly", "true");
    if (options?.limit) params.append("limit", String(options.limit));
    const q = params.toString() ? `?${params.toString()}` : "";
    return request<{ success: boolean; count: number; unreadCount: number; notifications: any[] }>(
      `/notifications${q}`
    );
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean; updated: boolean; unreadCount: number }>(
      `/notifications/${id}/read`,
      { method: "POST" }
    );
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean; updatedCount: number; unreadCount: number }>(
      "/notifications/read-all",
      { method: "POST" }
    );
  },

  async subscribePush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return request<{ success: boolean; message: string }>("/notifications/push-subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  },

  async verifyJoinToken(token: string) {
    return request<{
      success: boolean;
      valid: boolean;
      meeting: any;
      parent: any;
      student: any;
      redirectUrl: string;
      payload: any;
    }>("/meetings/join-verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async triggerCronReminders(secret?: string, forceNow?: string) {
    const params = new URLSearchParams();
    if (forceNow) params.append("forceNow", forceNow);
    const q = params.toString() ? `?${params.toString()}` : "";
    const headers: Record<string, string> = {};
    if (secret) headers["Authorization"] = `Bearer ${secret}`;
    return request<any>(`/cron/ptm-reminders${q}`, {
      headers,
    });
  },

  // Video calls & attendance (PTM Step 3)
  async getMeetingToken(
    meetingId: string,
    options?: { audioOnly?: boolean; participantName?: string }
  ) {
    return request<{
      success: boolean;
      token: string;
      serverUrl: string;
      roomId: string;
      meetingId: string;
      meetingTitle: string;
      meetingStatus: any;
      isModerator: boolean;
      participantIdentity: string;
      participantName: string;
      simulated: boolean;
      audioOnly?: boolean;
      error?: string;
    }>(`/meetings/${meetingId}/token`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  },

  async startMeeting(meetingId: string) {
    return request<{
      success: boolean;
      meeting: any;
      message: string;
    }>(`/meetings/${meetingId}/start`, {
      method: "POST",
    });
  },

  async endMeeting(meetingId: string) {
    return request<{
      success: boolean;
      meeting: any;
      message: string;
    }>(`/meetings/${meetingId}/end`, {
      method: "POST",
    });
  },

  async recordMeetingAttendance(
    meetingId: string,
    action: "join" | "leave",
    parentId?: string
  ) {
    return request<{
      success: boolean;
      action: string;
      record: any;
    }>(`/meetings/${meetingId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ action, parentId }),
    });
  },

  async getMeetingAttendance(meetingId: string) {
    return request<{
      success: boolean;
      count: number;
      attendance: any[];
    }>(`/meetings/${meetingId}/attendance`);
  },

  // Notes & Action items (PTM Step 4)
  async getMeetingNotes(meetingId: string, studentId?: string) {
    const q = studentId ? `?studentId=${studentId}` : "";
    return request<{
      success: boolean;
      count: number;
      notes: any[];
    }>(`/meetings/${meetingId}/notes${q}`);
  },

  async saveMeetingNote(
    meetingId: string,
    payload: {
      studentId?: string | null;
      notes: string;
      actionItems?: any[];
    }
  ) {
    return request<{
      success: boolean;
      note: any;
    }>(`/meetings/${meetingId}/notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getWorksheetsList(params?: { grade?: number; subjectCode?: string; studentId?: string }) {
    const q = new URLSearchParams();
    if (params?.grade) q.append("grade", params.grade.toString());
    if (params?.subjectCode) q.append("subjectCode", params.subjectCode);
    if (params?.studentId) q.append("studentId", params.studentId);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request<{
      success: boolean;
      worksheets: any[];
    }>(`/worksheets${qs}`);
  },

  async getStudentReport(studentId: string) {
    return request<{
      success: boolean;
      report: any;
    }>(`/reports?type=student&studentId=${studentId}`);
  },
};
