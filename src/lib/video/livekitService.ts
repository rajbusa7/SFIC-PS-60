import crypto from "crypto";
import { database } from "../db/database";
import type { Meeting, MeetingInvite, MeetingStatus, UserRole } from "../types";

export interface VideoActorContext {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface JoinMeetingValidationResult {
  allowed: boolean;
  meeting?: Meeting;
  invite?: MeetingInvite;
  isModerator: boolean;
  participantIdentity: string;
  participantName: string;
  roomId: string;
  status: MeetingStatus;
  inWaitingRoom?: boolean;
  allowedJoinWindow: boolean;
  error?: string;
  statusCode?: number;
}

export interface LiveKitTokenResponse {
  success: boolean;
  token: string;
  serverUrl: string;
  roomId: string;
  meetingId: string;
  meetingTitle: string;
  meetingStatus: MeetingStatus;
  isModerator: boolean;
  participantIdentity: string;
  participantName: string;
  simulated: boolean;
  audioOnly?: boolean;
  error?: string;
}

export class LiveKitService {
  /**
   * Checks if a user is authorized to enter the meeting and if it's within the allowed window.
   * Teachers get moderator access. Parents only get access if invited and within join window.
   */
  async validateUserCanJoin(
    actor: VideoActorContext,
    meetingId: string
  ): Promise<JoinMeetingValidationResult> {
    const meeting = await database.getMeetingByIdAsync(meetingId);
    if (!meeting) {
      return {
        allowed: false,
        isModerator: false,
        participantIdentity: actor.id,
        participantName: actor.name,
        roomId: "",
        status: "cancelled",
        allowedJoinWindow: false,
        error: `Meeting '${meetingId}' not found.`,
        statusCode: 404,
      };
    }

    if (meeting.status === "cancelled") {
      return {
        allowed: false,
        meeting,
        isModerator: false,
        participantIdentity: actor.id,
        participantName: actor.name,
        roomId: meeting.roomId,
        status: meeting.status,
        allowedJoinWindow: false,
        error: "This meeting has been cancelled.",
        statusCode: 400,
      };
    }

    if (meeting.status === "ended") {
      return {
        allowed: false,
        meeting,
        isModerator: false,
        participantIdentity: actor.id,
        participantName: actor.name,
        roomId: meeting.roomId,
        status: meeting.status,
        allowedJoinWindow: false,
        error: "This meeting has already ended.",
        statusCode: 400,
      };
    }

    const now = Date.now();
    const scheduledStartMs = new Date(meeting.startTime).getTime();
    const diffMins = (scheduledStartMs - now) / 60000;

    // 1. TEACHER / ADMIN ACCESS
    if (actor.role === "teacher" || actor.role === "admin") {
      if (actor.role === "teacher" && meeting.teacherId !== actor.id) {
        return {
          allowed: false,
          meeting,
          isModerator: false,
          participantIdentity: actor.id,
          participantName: actor.name,
          roomId: meeting.roomId,
          status: meeting.status,
          allowedJoinWindow: false,
          error: "Forbidden: You are not the assigned teacher for this meeting.",
          statusCode: 403,
        };
      }

      return {
        allowed: true,
        meeting,
        isModerator: true,
        participantIdentity: `teacher-${actor.id}`,
        participantName: actor.name || "Teacher",
        roomId: meeting.roomId,
        status: meeting.status,
        allowedJoinWindow: true,
      };
    }

    // 2. PARENT ACCESS
    if (actor.role === "parent") {
      const invites = await database.getInvitesForMeetingAsync(meetingId);
      const parentProfile =
        (await database.getParentByUserIdAsync(actor.id)) ||
        (await database.getParentByIdAsync(actor.id));
      const validParentIds = [actor.id, parentProfile?.id].filter(Boolean) as string[];

      const invite = invites.find((inv) => validParentIds.includes(inv.parentId));
      if (!invite) {
        return {
          allowed: false,
          meeting,
          isModerator: false,
          participantIdentity: actor.id,
          participantName: actor.name,
          roomId: meeting.roomId,
          status: meeting.status,
          allowedJoinWindow: false,
          error: "Forbidden: You have not been invited to this Parent-Teacher Meeting.",
          statusCode: 403,
        };
      }

      // Check allowed join window for parent:
      // Allowed if meeting is currently 'live' OR within 15 minutes before scheduled start time
      const isWithinWindow = meeting.status === "live" || diffMins <= 15;
      const inWaitingRoom = meeting.status === "scheduled";

      if (!isWithinWindow) {
        return {
          allowed: false,
          meeting,
          invite,
          isModerator: false,
          participantIdentity: `parent-${invite.parentId}`,
          participantName: actor.name || parentProfile?.name || "Parent",
          roomId: meeting.roomId,
          status: meeting.status,
          allowedJoinWindow: false,
          error: `Meeting is not open yet. Allowed join window begins 15 minutes before scheduled start time.`,
          statusCode: 403,
        };
      }

      return {
        allowed: true,
        meeting,
        invite,
        isModerator: false,
        participantIdentity: `parent-${invite.parentId}`,
        participantName: actor.name || parentProfile?.name || "Parent",
        roomId: meeting.roomId,
        status: meeting.status,
        inWaitingRoom,
        allowedJoinWindow: true,
      };
    }

    return {
      allowed: false,
      isModerator: false,
      participantIdentity: actor.id,
      participantName: actor.name,
      roomId: "",
      status: "cancelled",
      allowedJoinWindow: false,
      error: "Unauthorized user role.",
      statusCode: 401,
    };
  }

  /**
   * Generates a signed LiveKit Access Token or simulated token for testing.
   */
  async generateToken(
    actor: VideoActorContext,
    meetingId: string,
    options?: { audioOnly?: boolean; participantName?: string }
  ): Promise<LiveKitTokenResponse> {
    const validation = await this.validateUserCanJoin(actor, meetingId);
    if (!validation.allowed || !validation.meeting) {
      throw new Error(validation.error || "Cannot issue token: access denied.");
    }

    const meeting = validation.meeting;
    const participantName = options?.participantName || validation.participantName;
    const participantIdentity = validation.participantIdentity;
    const isModerator = validation.isModerator;
    const audioOnly = Boolean(options?.audioOnly);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    // If live credentials are provided, use official livekit-server-sdk
    if (apiKey && apiSecret && livekitUrl) {
      try {
        const { AccessToken } = await import("livekit-server-sdk");
        const at = new AccessToken(apiKey, apiSecret, {
          identity: participantIdentity,
          name: participantName,
          metadata: JSON.stringify({
            role: actor.role,
            audioOnly,
            meetingId,
          }),
        });

        at.addGrant({
          room: meeting.roomId,
          roomJoin: true,
          canPublish: !audioOnly,
          canPublishData: true,
          canSubscribe: true,
          roomAdmin: isModerator,
          roomRecord: false, // "Do not record the call"
        });

        const token = await at.toJwt();
        return {
          success: true,
          token,
          serverUrl: livekitUrl,
          roomId: meeting.roomId,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingStatus: meeting.status,
          isModerator,
          participantIdentity,
          participantName,
          simulated: false,
          audioOnly,
        };
      } catch (err: any) {
        console.warn("[LiveKitService] Real SDK error, using fallback simulated token:", err.message);
      }
    }

    // Zero-setup simulated token fallback (cryptographically signed)
    const secret = process.env.SESSION_SECRET || "studysaathi_ptm_video_token_secret_2026";
    const payload = {
      identity: participantIdentity,
      name: participantName,
      roomId: meeting.roomId,
      meetingId: meeting.id,
      isModerator,
      audioOnly,
      exp: Math.floor(Date.now() / 1000) + 4 * 3600,
    };
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(b64Payload).digest("base64url");
    const token = `sim-${b64Payload}.${signature}`;

    return {
      success: true,
      token,
      serverUrl: livekitUrl || "wss://studysaathi-cloud.livekit.cloud",
      roomId: meeting.roomId,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingStatus: meeting.status,
      isModerator,
      participantIdentity,
      participantName,
      simulated: true,
      audioOnly,
    };
  }

  /**
   * Teacher marks meeting as LIVE (starts the call).
   */
  async startMeeting(actor: VideoActorContext, meetingId: string): Promise<Meeting> {
    const validation = await this.validateUserCanJoin(actor, meetingId);
    if (!validation.isModerator) {
      throw new Error("Forbidden: Only the teacher can start the meeting.");
    }
    const updated = await database.updateMeetingStatusAsync(meetingId, "live");
    if (!updated) throw new Error("Failed to start meeting.");
    return updated;
  }

  /**
   * Teacher ends the meeting for everyone.
   */
  async endMeeting(actor: VideoActorContext, meetingId: string): Promise<Meeting> {
    const validation = await this.validateUserCanJoin(actor, meetingId);
    if (!validation.isModerator) {
      throw new Error("Forbidden: Only the teacher can end the meeting for everyone.");
    }
    const updated = await database.updateMeetingStatusAsync(meetingId, "ended");
    if (!updated) throw new Error("Failed to end meeting.");
    return updated;
  }

  /**
   * Records attendance join.
   */
  async recordJoin(meetingId: string, parentId: string) {
    return database.recordMeetingAttendanceJoinAsync(meetingId, parentId);
  }

  /**
   * Records attendance leave.
   */
  async recordLeave(meetingId: string, parentId: string) {
    return database.recordMeetingAttendanceLeaveAsync(meetingId, parentId);
  }

  /**
   * Retrieves attendance records for a meeting.
   */
  async getAttendance(meetingId: string) {
    return database.getMeetingAttendanceAsync(meetingId);
  }
}

export const livekitService = new LiveKitService();
