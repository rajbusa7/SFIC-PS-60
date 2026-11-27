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
    return (await db.getPtmMeetingsAsync(filters as any)) as any;
  }

  async findMeetingById(id: string): Promise<Meeting | null> {
    return (await db.getPtmMeetingByIdAsync(id)) as any;
  }

  async findInvitesForMeeting(meetingId: string): Promise<MeetingInvite[]> {
    return [];
  }

  async findInvitesForParent(parentIds: string[]): Promise<ParentMeetingInviteItem[]> {
    return [];
  }

  async createMeeting(
    meeting: Meeting,
    invites: MeetingInvite[],
    notifications: PtmNotification[]
  ): Promise<Meeting> {
    return (await db.createPtmMeetingAsync(meeting as any)) as any;
  }

  async updateMeeting(
    id: string,
    updates: Partial<Meeting>,
    notifications: PtmNotification[] = []
  ): Promise<Meeting | null> {
    if (updates.status) {
      return (await db.updatePtmMeetingStatusAsync(id, updates.status as any)) as any;
    }
    return (await db.getPtmMeetingByIdAsync(id)) as any;
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
    return null;
  }

  async getNotificationsForUser(userId: string): Promise<PtmNotification[]> {
    return [];
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
