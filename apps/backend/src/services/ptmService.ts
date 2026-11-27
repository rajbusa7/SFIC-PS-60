import crypto from "crypto";
import { ptmRepository } from "../repositories/ptmRepository";
import { db } from "../../../../src/lib/db/database";
import { signMeetingJoinToken, buildMeetingJoinUrl } from "../../../../src/lib/auth/signedMeetingToken";
import { buildBilingualPtmMessage } from "../../../../src/lib/notifications/ptmMessageTemplates";
import type {
  Meeting,
  MeetingInvite,
  MeetingStatus,
  MeetingWithInvites,
  PtmNotification,
  InviteRsvpStatus,
  ParentMeetingInviteItem,
  UserRole,
} from "../../../../packages/shared/src/types";

export interface ActorContext {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export class PtmAuthorizationError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "PtmAuthorizationError";
    this.status = status;
  }
}

export class PtmValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "PtmValidationError";
    this.status = status;
  }
}

export class PtmService {
  private buildRoomId(title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24);
    return `ptm-${slug || "session"}-${crypto.randomBytes(3).toString("hex")}`;
  }

  private buildJoinToken(): string {
    return `tok-${crypto.randomBytes(12).toString("hex")}`;
  }

  async getScheduleTargets(actor?: ActorContext) {
    const [allClassrooms, allStudents, parents] = await Promise.all([
      ptmRepository.getClassrooms(),
      ptmRepository.getStudents(),
      ptmRepository.getAllParents(),
    ]);

    let classrooms = allClassrooms;
    let students = allStudents;

    // Filter to the logged-in teacher's assigned classrooms if caller is a teacher
    if (actor && actor.role === "teacher") {
      const assignments = await db.getTeacherAssignmentsAsync(actor.id);
      const emailAssignments =
        assignments.length === 0 && actor.email
          ? await db.getTeacherAssignmentsAsync(actor.email)
          : [];
      const effectiveAssignments = assignments.length > 0 ? assignments : emailAssignments;

      if (effectiveAssignments.length > 0) {
        const assignedClassIds = new Set<string>();
        for (const a of effectiveAssignments as any[]) {
          if (Array.isArray(a.classroomIds)) {
            a.classroomIds.forEach((cid: string) => assignedClassIds.add(cid));
          } else if (a.classroomId) {
            assignedClassIds.add(a.classroomId);
          }
        }
        if (assignedClassIds.size > 0) {
          classrooms = allClassrooms.filter((c) => assignedClassIds.has(c.id));
          students = allStudents.filter((s) => assignedClassIds.has(s.classroomId));
        }
      }
    }

    return {
      classrooms,
      students: students.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        studentCode: s.studentCode,
        classroomId: s.classroomId,
        grade: s.grade,
        section: s.section,
        linkedParents: parents
          .filter((p) => p.studentIds.includes(s.id))
          .map((p) => ({
            id: p.id,
            userId: p.userId || p.id,
            name: p.name,
            phone: p.phone,
            parentCode: p.parentCode,
          })),
      })),
      parents: parents.map((p) => ({
        id: p.id,
        userId: p.userId || p.id,
        name: p.name,
        phone: p.phone,
        parentCode: p.parentCode,
        studentIds: p.studentIds,
      })),
    };
  }

  async listTeacherMeetings(
    actor: ActorContext,
    filters?: { status?: MeetingStatus; classId?: string }
  ): Promise<MeetingWithInvites[]> {
    if (actor.role !== "teacher" && actor.role !== "admin") {
      throw new PtmAuthorizationError("Only teachers and school administrators can view teacher meetings.", 403);
    }

    const meetings = await ptmRepository.findMeetings({
      teacherId: actor.role === "admin" ? undefined : actor.id,
      status: filters?.status,
      classId: filters?.classId,
    });

    const withInvites = await Promise.all(
      meetings.map(async (m) => ({
        ...m,
        invites: await ptmRepository.findInvitesForMeeting(m.id),
      }))
    );

    return withInvites;
  }

  async getMeetingDetails(actor: ActorContext, meetingId: string): Promise<MeetingWithInvites> {
    const meeting = await ptmRepository.findMeetingById(meetingId);
    if (!meeting) {
      throw new PtmValidationError(`Meeting '${meetingId}' not found.`, 404);
    }

    const invites = await ptmRepository.findInvitesForMeeting(meetingId);

    if (actor.role === "admin") {
      return { ...meeting, invites };
    }

    if (actor.role === "teacher") {
      if (meeting.teacherId !== actor.id) {
        throw new PtmAuthorizationError("Forbidden: You can only view your own meetings.", 403);
      }
      return { ...meeting, invites };
    }

    // Parent: only allowed if invited, and only return their own invites
    const parentIds = await this.resolveParentIdsForUser(actor.id);
    const ownInvites = invites.filter((inv) => parentIds.includes(inv.parentId));
    if (ownInvites.length === 0) {
      throw new PtmAuthorizationError("Forbidden: You are not invited to this meeting.", 403);
    }

    return { ...meeting, invites: ownInvites };
  }

  async createMeeting(
    actor: ActorContext,
    input: {
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
    }
  ): Promise<MeetingWithInvites> {
    if (actor.role !== "teacher" && actor.role !== "admin") {
      throw new PtmAuthorizationError("Only teachers and school administrators can schedule meetings.", 403);
    }

    const now = new Date().toISOString();
    const meetingId = `mtg-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const offeredSlots =
      input.type === "one_to_one"
        ? Array.from(new Set(input.offeredSlots && input.offeredSlots.length > 0 ? input.offeredSlots : [input.startTime]))
        : [];

    const allParents = await ptmRepository.getAllParents();
    const allStudents = await ptmRepository.getStudents();

    const targetPairs: Array<{ studentId: string; parentId: string; userId: string }> = [];
    const seenPair = new Set<string>();

    const addPair = (studentId: string, parentId: string, userId: string) => {
      const key = `${studentId}:${parentId}`;
      if (!seenPair.has(key)) {
        seenPair.add(key);
        targetPairs.push({ studentId, parentId, userId });
      }
    };

    if (input.parentId) {
      const parent = allParents.find((p) => p.id === input.parentId || p.userId === input.parentId);
      if (!parent) {
        throw new PtmValidationError(`Parent '${input.parentId}' not found.`, 404);
      }
      const allowedStudentIds =
        input.studentIds && input.studentIds.length > 0
          ? parent.studentIds.filter((sid) => input.studentIds!.includes(sid))
          : parent.studentIds;

      const effectiveStudentIds = allowedStudentIds.length > 0 ? allowedStudentIds : parent.studentIds;
      if (effectiveStudentIds.length === 0) {
        throw new PtmValidationError("Selected parent is not linked to any students.", 400);
      }
      for (const sid of effectiveStudentIds) {
        addPair(sid, parent.id, parent.userId || parent.id);
      }
    } else if (input.studentIds && input.studentIds.length > 0) {
      for (const sid of input.studentIds) {
        const linkedParents = allParents.filter((p) => p.studentIds.includes(sid));
        for (const p of linkedParents) {
          addPair(sid, p.id, p.userId || p.id);
        }
      }
    } else if (input.classId) {
      const classStudents = allStudents.filter((s) => s.classroomId === input.classId);
      for (const s of classStudents) {
        const linkedParents = allParents.filter((p) => p.studentIds.includes(s.id));
        for (const p of linkedParents) {
          addPair(s.id, p.id, p.userId || p.id);
        }
      }
    }

    if (targetPairs.length === 0) {
      throw new PtmValidationError(
        "No linked parents were found for the selected class or students. Link parents to students first.",
        400
      );
    }

    const resolvedClassId =
      input.classId ||
      allStudents.find((s) => s.id === targetPairs[0].studentId)?.classroomId ||
      null;

    const meeting: Meeting = {
      id: meetingId,
      teacherId: actor.id,
      teacherName: actor.name,
      classId: resolvedClassId,
      title: input.title.trim(),
      agenda: input.agenda?.trim() || "",
      type: input.type,
      startTime: new Date(input.startTime).toISOString(),
      durationMin: Number(input.durationMin),
      status: "scheduled",
      roomId: this.buildRoomId(input.title),
      offeredSlots,
      targetMode: input.targetMode || (input.parentId ? "parent" : input.studentIds?.length ? "students" : "class"),
      createdAt: now,
      updatedAt: now,
    };

    const defaultSlot = input.type === "group" ? meeting.startTime : offeredSlots.length === 1 ? offeredSlots[0] : null;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const invites: MeetingInvite[] = targetPairs.map((pair) => {
      const student = allStudents.find((s) => s.id === pair.studentId);
      const parent = allParents.find((p) => p.id === pair.parentId);
      const inviteId = `inv-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      const joinToken = signMeetingJoinToken({
        meetingId,
        inviteId,
        parentId: pair.parentId,
        studentId: pair.studentId,
        role: "parent",
        meetingStartTime: meeting.startTime,
      });

      return {
        id: inviteId,
        meetingId,
        studentId: pair.studentId,
        studentName: student?.displayName,
        studentGrade: student?.grade,
        studentSection: student?.section,
        parentId: pair.parentId,
        parentName: parent?.name,
        parentPhone: parent?.phone,
        rsvpStatus: "pending",
        joinToken,
        slotTime: defaultSlot,
        rescheduleNote: null,
        respondedAt: null,
        createdAt: now,
      };
    });

    const notifiedUsers = new Set<string>();
    const notifications: PtmNotification[] = [];
    for (const invite of invites) {
      const parent = allParents.find((p) => p.id === invite.parentId);
      const parentUserId = parent?.userId || invite.parentId;
      if (notifiedUsers.has(parentUserId)) continue;
      notifiedUsers.add(parentUserId);

      const lang = (parent?.preferredLanguage as "en" | "gu") || "gu";
      const joinUrl = buildMeetingJoinUrl(baseUrl, invite.joinToken);
      const msg = buildBilingualPtmMessage(
        "ptm_invite",
        {
          meetingTitle: meeting.title,
          teacherName: actor.name,
          startTime: meeting.startTime,
          durationMin: meeting.durationMin,
          studentName: invite.studentName,
          joinUrl,
        },
        lang
      );

      notifications.push({
        id: `ntf-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        userId: parentUserId,
        type: "ptm_invite",
        message: msg.body,
        meetingId,
        inviteId: invite.id,
        link: joinUrl,
        scheduledFor: meeting.startTime,
        sentAt: now,
        channel: "in_app",
        readAt: null,
        metadata: {
          title: msg.title,
          joinUrl,
          preferredLanguage: lang,
        },
        createdAt: now,
      });
    }

    await ptmRepository.createMeeting(meeting, invites, notifications);
    return { ...meeting, invites };
  }

  async updateOrRescheduleMeeting(
    actor: ActorContext,
    meetingId: string,
    updates: {
      title?: string;
      agenda?: string;
      startTime?: string;
      durationMin?: number;
      status?: MeetingStatus;
      offeredSlots?: string[];
    }
  ): Promise<MeetingWithInvites> {
    if (actor.role !== "teacher" && actor.role !== "admin") {
      throw new PtmAuthorizationError("Only teachers and administrators can edit meetings.", 403);
    }

    const existing = await ptmRepository.findMeetingById(meetingId);
    if (!existing) {
      throw new PtmValidationError(`Meeting '${meetingId}' not found.`, 404);
    }
    if (actor.role === "teacher" && existing.teacherId !== actor.id) {
      throw new PtmAuthorizationError("Forbidden: You can only edit or reschedule your own meetings.", 403);
    }

    const patch: Partial<Meeting> = {};
    let isChanged = false;
    if (updates.title !== undefined) {
      if (!updates.title.trim()) throw new PtmValidationError("Meeting title cannot be empty.");
      patch.title = updates.title.trim();
      isChanged = true;
    }
    if (updates.agenda !== undefined) {
      patch.agenda = updates.agenda.trim();
      isChanged = true;
    }
    if (updates.startTime !== undefined) {
      const parsed = new Date(updates.startTime);
      if (isNaN(parsed.getTime())) throw new PtmValidationError("Invalid startTime.");
      patch.startTime = parsed.toISOString();
      isChanged = true;
    }
    if (updates.durationMin !== undefined) {
      const dur = Number(updates.durationMin);
      if (isNaN(dur) || dur < 5 || dur > 240) {
        throw new PtmValidationError("durationMin must be between 5 and 240 minutes.");
      }
      patch.durationMin = dur;
      isChanged = true;
    }
    if (updates.status !== undefined) {
      if (!["scheduled", "live", "ended", "cancelled"].includes(updates.status)) {
        throw new PtmValidationError("Invalid meeting status.");
      }
      patch.status = updates.status;
      isChanged = true;
    }
    if (updates.offeredSlots !== undefined) {
      patch.offeredSlots = updates.offeredSlots
        .filter((s) => !isNaN(new Date(s).getTime()))
        .map((s) => new Date(s).toISOString());
      isChanged = true;
    }

    const invites = await ptmRepository.findInvitesForMeeting(meetingId);
    const notifications: PtmNotification[] = [];

    // Create immediate in-app notifications for all invited parents when meeting changes
    if (isChanged && invites.length > 0) {
      const allParents = await ptmRepository.getAllParents();
      const now = new Date().toISOString();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const seen = new Set<string>();

      const eventType =
        patch.status === "cancelled"
          ? "ptm_cancel"
          : patch.startTime
          ? "ptm_reschedule"
          : "ptm_update";

      for (const inv of invites) {
        const parent = allParents.find((p) => p.id === inv.parentId);
        const uid = parent?.userId || inv.parentId;
        if (seen.has(uid)) continue;
        seen.add(uid);

        const lang = (parent?.preferredLanguage as "en" | "gu") || "gu";
        const joinUrl = buildMeetingJoinUrl(baseUrl, inv.joinToken);
        const msg = buildBilingualPtmMessage(
          eventType,
          {
            meetingTitle: patch.title || existing.title,
            teacherName: actor.name,
            startTime: existing.startTime,
            durationMin: patch.durationMin || existing.durationMin,
            newStartTime: patch.startTime,
            studentName: inv.studentName,
            joinUrl,
          },
          lang
        );

        notifications.push({
          id: `ntf-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          userId: uid,
          type: eventType,
          message: msg.body,
          meetingId,
          inviteId: inv.id,
          link: joinUrl,
          scheduledFor: patch.startTime || existing.startTime,
          sentAt: now,
          channel: "in_app",
          readAt: null,
          metadata: {
            title: msg.title,
            joinUrl,
            preferredLanguage: lang,
          },
          createdAt: now,
        });
      }
    }

    const updated = await ptmRepository.updateMeeting(meetingId, patch, notifications);
    if (!updated) {
      throw new PtmValidationError(`Meeting '${meetingId}' not found.`, 404);
    }

    return { ...updated, invites };
  }

  async cancelMeeting(actor: ActorContext, meetingId: string): Promise<MeetingWithInvites> {
    return this.updateOrRescheduleMeeting(actor, meetingId, { status: "cancelled" });
  }

  async listParentMeetings(actor: ActorContext): Promise<ParentMeetingInviteItem[]> {
    if (actor.role !== "parent") {
      throw new PtmAuthorizationError("Forbidden: Only parents can access their personal PTM invites.", 403);
    }
    const parentIds = await this.resolveParentIdsForUser(actor.id);
    if (parentIds.length === 0) return [];
    return ptmRepository.findInvitesForParent(parentIds);
  }

  async respondToInvite(
    actor: ActorContext,
    meetingId: string,
    payload: {
      rsvpStatus: InviteRsvpStatus;
      slotTime?: string;
      rescheduleNote?: string;
      studentId?: string;
    }
  ): Promise<MeetingInvite> {
    if (actor.role !== "parent") {
      throw new PtmAuthorizationError("Forbidden: Only parents can respond to meeting invites.", 403);
    }

    const meeting = await ptmRepository.findMeetingById(meetingId);
    if (!meeting) {
      throw new PtmValidationError(`Meeting '${meetingId}' not found.`, 404);
    }
    if (meeting.status === "cancelled" || meeting.status === "ended") {
      throw new PtmValidationError(`Cannot RSVP to a meeting that is already ${meeting.status}.`, 400);
    }

    const parentIds = await this.resolveParentIdsForUser(actor.id);
    if (parentIds.length === 0) {
      throw new PtmAuthorizationError("Forbidden: Parent profile not found.", 403);
    }

    let resolvedSlot = payload.slotTime;
    if (payload.rsvpStatus === "accepted" && meeting.type === "one_to_one") {
      const slots = meeting.offeredSlots || [];
      if (slots.length > 0) {
        if (resolvedSlot) {
          const requestedMs = new Date(resolvedSlot).getTime();
          const matched = slots.find((s) => new Date(s).getTime() === requestedMs);
          if (!matched) {
            throw new PtmValidationError("Selected time slot is not among the offered meeting slots.", 400);
          }
          resolvedSlot = matched;
        } else if (slots.length === 1) {
          resolvedSlot = slots[0];
        } else {
          throw new PtmValidationError("Please select one of the offered time slots to accept this 1-to-1 meeting.", 400);
        }
      } else {
        resolvedSlot = resolvedSlot || meeting.startTime;
      }
    } else if (payload.rsvpStatus === "accepted" && meeting.type === "group") {
      resolvedSlot = resolvedSlot || meeting.startTime;
    }

    const now = new Date().toISOString();
    const notification: PtmNotification = {
      id: `ntf-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      userId: meeting.teacherId,
      type: `ptm_rsvp_${payload.rsvpStatus}`,
      message: `${actor.name} responded '${payload.rsvpStatus}' for '${meeting.title}'.`,
      scheduledFor: resolvedSlot || meeting.startTime,
      sentAt: now,
      channel: "in_app",
      readAt: null,
      createdAt: now,
    };

    const updatedInvite = await ptmRepository.respondToInvite(
      meetingId,
      parentIds,
      {
        rsvpStatus: payload.rsvpStatus,
        slotTime: resolvedSlot,
        rescheduleNote: payload.rescheduleNote,
        studentId: payload.studentId,
      },
      notification
    );

    if (!updatedInvite) {
      throw new PtmAuthorizationError("Forbidden: You do not have an invite for this meeting.", 403);
    }

    return updatedInvite;
  }

  private async resolveParentIdsForUser(userId: string): Promise<string[]> {
    const profile =
      (await ptmRepository.getParentByUserId(userId)) ||
      (await ptmRepository.getParentById(userId));
    const ids = new Set<string>([userId]);
    if (profile?.id) ids.add(profile.id);
    if (profile?.userId) ids.add(profile.userId);
    return Array.from(ids);
  }
}

export const ptmService = new PtmService();
