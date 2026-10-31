export type ReadingLevel = "very_simple" | "simple" | "standard";
export type SupportedLanguage = "en" | "gu" | "hi" | "mr" | "ta" | "te" | "bn" | "kn";

export interface ParentProfile {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  preferredLanguage: SupportedLanguage;
  studentIds: string[];
  relationship?: "mother" | "father" | "guardian";
}

export interface ParentLinkingCode {
  id: string;
  studentId: string;
  code: string;
  expiresAt: string;
  status: "active" | "used" | "expired";
  createdByUserId?: string;
  usedByUserId?: string;
  usedAt?: string;
  createdAt: string;
}

export interface ParentMessage {
  id: string;
  parentId: string;
  studentId: string;
  subject: string;
  message: string;
  status: "sent" | "read" | "replied";
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

export type NoticeCategory =
  | "announcement"
  | "ptm"
  | "exam"
  | "fees"
  | "fee"
  | "holiday"
  | "homework"
  | "emergency"
  | "event"
  | "urgent_alert"
  | "academic"
  | "administrative";

export type NoticeUrgency = "normal" | "important" | "urgent" | "low" | "medium" | "high";

export type NoticeStatus = "draft" | "simplified" | "translated" | "approved" | "sent";

export interface SchoolNotice {
  id: string;
  schoolId?: string;
  title: string;
  originalContent: string;
  originalLanguage?: SupportedLanguage;
  simplifiedContent?: string;
  readingLevel?: ReadingLevel;
  simplificationLevel?: "standard" | "simple" | "very_simple";
  simplificationNotes?: string;
  category: NoticeCategory;
  targetAudience?: "all" | "class" | "individual";
  targetClassGrade?: number;
  targetSection?: string;
  targetClassSection?: string;
  studentIds?: string[];
  authorId?: string;
  authorName?: string;
  senderTeacherId?: string;
  senderTeacherName?: string;
  status: NoticeStatus;
  urgency?: NoticeUrgency;
  requiresAcknowledgment?: boolean;
  acknowledgmentDeadline?: string;
  isApprovedByTeacher?: boolean;
  approvedAt?: string;
  publishedAt?: string;
  audioUrl?: string;
  createdAt: string;
  updatedAt?: string;
  sentAt?: string;
}

export interface NoticeTranslation {
  id: string;
  noticeId: string;
  language: SupportedLanguage;
  translatedTitle: string;
  translatedContent: string;
  audioUrl?: string;
  audioDurationMs?: number;
  isApproved?: boolean;
  isApprovedByTeacher?: boolean;
  isTeacherEdited?: boolean;
  provider?: string;
  providerUsed?: string;
  flaggedAsIncorrect?: boolean;
  flagReason?: string;
  flaggedIssue?: string;
  status?: "draft" | "review_needed" | "approved";
  reviewedBy?: string;
  updatedAt: string;
}

export interface NoticeDelivery {
  id: string;
  noticeId: string;
  parentId: string;
  parentName: string;
  studentId: string;
  studentName?: string;
  studentGrade?: number;
  studentSection?: string;
  language: SupportedLanguage;
  channel: "email" | "portal" | "app" | "sms" | "whatsapp";
  status: "pending" | "sending" | "sent" | "failed" | "acknowledged" | "queued" | "delivered" | "read";
  recipientEmail?: string;
  emailMessageId?: string;
  errorReason?: string;
  retryCount?: number;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  parentFeedback?: string;
}

export interface GmailConnection {
  id: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  /** Unix timestamp milliseconds (Date.now() + expires_in * 1000) */
  expiryDate?: number;
  status: "active" | "expired" | "revoked";
  connectedAt: string;
  lastUsedAt?: string;
}

export interface ParentCommunication {
  id: string;
  studentId: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  type: "notice" | "attendance_alert" | "academic_report" | "learning_gap" | "remedial_plan" | "home_activity";
  title: string;
  summary: string;
  channel: "email" | "portal" | "gmail";
  deliveryStatus: "pending" | "sending" | "sent" | "failed" | "acknowledged" | "in_portal_only";
  emailMessageId?: string;
  errorReason?: string;
  sentAt: string;
  acknowledgedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface StudentAttendanceSummary {
  studentId: string;
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  consecutiveAbsences?: number;
  teacherRemarks?: string;
  lastUpdated: string;
  recentAbsences: Array<{
    date: string;
    reason?: string;
    isExcused: boolean;
    notifiedParent: boolean;
  }>;
}

export interface ParentNotificationPreferences {
  parentId: string;
  emailNotices: boolean;
  emailAttendance: boolean;
  emailAcademic: boolean;
  emailLearningGaps: boolean;
  emailRemedialPlans: boolean;
  preferredLanguage: SupportedLanguage;
}
