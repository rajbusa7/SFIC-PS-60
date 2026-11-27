import { db } from "../../../../src/lib/db/database";
import type {
  Meeting,
  MeetingInvite,
  MeetingStatus,
  PtmNotification,
  InviteRsvpStatus,
  ParentMeetingInviteItem,
  ParentProfile,
  Student,
  Classroom,
} from "../../../../packages/shared/src/types";

export class PtmRepository {
  async findMeetings(filters?: {
    teacherId?: string;
    status?: MeetingStatus;
    classId?: string;
  }): Promise<Meeting[]> {
    return db.getMeetingsAsync(filters);
  }

  async findMeetingById(id: string): Promise<Meeting | null> {
    return db.getMeetingByIdAsync(id);
  }

  async findInvitesForMeeting(meetingId: string): Promise<MeetingInvite[]> {
    return db.getInvitesForMeetingAsync(meetingId);
  }

  async findInvitesForParent(parentIds: string[]): Promise<ParentMeetingInviteItem[]> {
    return db.getInvitesForParentAsync(parentIds);
  }

  async createMeeting(
    meeting: Meeting,
    invites: MeetingInvite[],
    notifications: PtmNotification[]
  ): Promise<Meeting> {
    return db.createMeetingAsync(meeting, invites, notifications);
  }

  async updateMeeting(
    id: string,
    updates: Partial<Meeting>,
    notifications: PtmNotification[] = []
  ): Promise<Meeting | null> {
    return db.updateMeetingAsync(id, updates, notifications);
  }

  async respondToInvite(
    meetingId: string,
    parentIds: string[],
    payload: {
      rsvpStatus: InviteRsvpStatus;
      slotTime?: string;
      rescheduleNote?: string;
      studentId?: string;
    },
    notification?: PtmNotification
  ): Promise<MeetingInvite | null> {
    return db.respondToMeetingInviteAsync(meetingId, parentIds, payload, notification);
  }

  async getNotificationsForUser(userId: string): Promise<PtmNotification[]> {
    return db.getNotificationsForUserAsync(userId);
  }

  async getParentByUserId(userId: string): Promise<ParentProfile | null> {
    return db.getParentByUserIdAsync(userId);
  }

  async getParentById(id: string): Promise<ParentProfile | null> {
    return db.getParentByIdAsync(id);
  }

  async getAllParents(): Promise<ParentProfile[]> {
    return db.getParents();
  }

  async getStudents(filters?: { classroomId?: string }): Promise<Student[]> {
    return db.getStudentsAsync(filters);
  }

  async getClassrooms(): Promise<Classroom[]> {
    return db.getClassrooms();
  }
}

export const ptmRepository = new PtmRepository();
