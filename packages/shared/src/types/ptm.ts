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
