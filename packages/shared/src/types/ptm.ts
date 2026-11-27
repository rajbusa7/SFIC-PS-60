/**
 * StudySaathi AI - Parent-Teacher Meetings (PTM) Shared Types
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 */

export type PtmMeetingStatus =
  | "scheduled"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type PtmParticipantRole = "teacher" | "parent" | "student" | "admin";

export type PtmDurationMinutes = 15 | 30 | 45 | 60;

export interface PtmMeeting {
  id: string;
  meetingCode: string; // e.g. "ptm-482-901"
  title: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  durationMinutes: PtmDurationMinutes;
  status: PtmMeetingStatus;
  agenda?: string;
  teacherNotes?: string;
  joinTokenHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PtmMeetingNote {
  id: string;
  meetingId: string;
  studentId: string;
  teacherId: string;
  discussionSummary: string;
  learningConcerns: string;
  studentStrengths: string;
  agreedActions: string;
  followUpDate?: string;
  sharedWithParent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PtmChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderRole: PtmParticipantRole;
  message: string;
  createdAt: string;
}

export interface PtmWaitingParticipant {
  id: string;
  meetingId: string;
  participantId: string;
  participantName: string;
  participantRole: PtmParticipantRole;
  status: "waiting" | "admitted" | "rejected";
  joinedAt: string;
  reviewedAt?: string;
}

export interface PtmMeetingStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface PtmSignalPayload {
  meetingId: string;
  senderId: string;
  targetId?: string;
  type: "offer" | "answer" | "ice-candidate" | "join" | "leave" | "status" | "admit" | "reject";
  data?: any;
  createdAt?: string;
}

// Extended PTM Multi-Participant & Calendar Types
export type MeetingType = "one_to_one" | "group";
export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";
export type InviteRsvpStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "reschedule_requested";

export type MeetingTargetMode = "class" | "students" | "parent";

export interface Meeting {
  id: string;
  teacherId: string;
  teacherName?: string;
  classId?: string | null;
  title: string;
  agenda: string;
  type: MeetingType;
  startTime: string;
  durationMin: number;
  status: MeetingStatus;
  roomId: string;
  offeredSlots?: string[];
  targetMode?: MeetingTargetMode;
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingInvite {
  id: string;
  meetingId: string;
  studentId: string;
  studentName?: string;
  studentGrade?: number;
  studentSection?: string;
  parentId: string;
  parentName?: string;
  parentPhone?: string;
  rsvpStatus: InviteRsvpStatus;
  joinToken: string;
  slotTime?: string | null;
  rescheduleNote?: string | null;
  respondedAt?: string | null;
  createdAt: string;
}

export interface MeetingActionItem {
  id: string;
  description: string;
  worksheetId?: string | null;
  worksheetTitle?: string | null;
  completed?: boolean;
}

export interface MeetingNote {
  id: string;
  meetingId: string;
  studentId?: string | null;
  studentName?: string | null;
  notes: string;
  actionItems: (string | MeetingActionItem)[];
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingAttendance {
  id: string;
  meetingId: string;
  parentId: string;
  joinedAt?: string | null;
  leftAt?: string | null;
}

export interface PtmNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  meetingId?: string | null;
  inviteId?: string | null;
  link?: string | null;
  scheduledFor?: string | null;
  sentAt?: string | null;
  channel: string;
  readAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WebPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
}

export type ReminderType = "24h" | "1h" | "start";

export interface MeetingWithInvites extends Meeting {
  invites: MeetingInvite[];
}

export interface ParentMeetingInviteItem {
  invite: MeetingInvite;
  meeting: Meeting;
  student: {
    id: string;
    displayName: string;
    grade: number;
    section: string;
    classroomId: string;
  };
}
