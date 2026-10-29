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
  channel: "app" | "sms" | "whatsapp";
  status: "queued" | "sent" | "delivered" | "read" | "acknowledged";
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  parentFeedback?: string;
}
