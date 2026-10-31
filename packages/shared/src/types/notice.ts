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
  | "reminder"
  | "urgent_alert";

export type NoticeUrgency = "normal" | "important" | "urgent";

export type NoticeStatus = "draft" | "simplified" | "translated" | "approved" | "sent";

export interface SchoolNotice {
  id: string;
  schoolId?: string;
  title: string;
  originalContent: string;
  originalLanguage: SupportedLanguage;
  simplifiedContent?: string;
  readingLevel?: ReadingLevel;
  category: NoticeCategory;
  targetAudience: "all" | "class" | "individual";
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
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  attachments?: Array<{ name: string; url: string; size?: string; mimeType?: string }>;
  sentViaGmail?: boolean;
  gmailMessageId?: string;
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
  channel: "app" | "sms" | "whatsapp" | "gmail" | "email";
  status: "queued" | "sent" | "delivered" | "read" | "acknowledged" | "failed";
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  parentFeedback?: string;
  emailMessageId?: string;
  errorReason?: string;
}

export interface GmailConnection {
  id: string;
  schoolId: string;
  email: string;
  connectedByUserId: string;
  connectedByUserName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in ms
  scope: string;
  connectedAt: string;
  status: "connected" | "expired" | "revoked";
}

export type CommunicationType =
  | "notice"
  | "attendance"
  | "academic"
  | "learning_gap"
  | "remedial_plan"
  | "homework"
  | "general";

export interface ParentCommunication {
  id: string;
  type: CommunicationType;
  title: string;
  subject: string;
  content: string;
  htmlContent?: string;
  senderId: string;
  senderName: string;
  senderRole: "teacher" | "admin";
  studentId?: string;
  studentName?: string;
  studentGrade?: number;
  studentSection?: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  channel: "gmail" | "email" | "portal";
  deliveryStatus: "sent" | "delivered" | "failed" | "in_portal_only";
  emailMessageId?: string;
  errorReason?: string;
  sentAt: string;
  metadata?: Record<string, any>;
}

export interface StudentAttendanceSummary {
  studentId: string;
  attendanceRate: number; // e.g. 94.5%
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
