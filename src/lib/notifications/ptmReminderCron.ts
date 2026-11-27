import { database } from "../db/database";
import { signMeetingJoinToken, buildMeetingJoinUrl } from "../auth/signedMeetingToken";
import { buildBilingualPtmMessage } from "./ptmMessageTemplates";
import { notificationDispatcher } from "./notificationChannels";
import type { Meeting, MeetingInvite, ParentProfile, ReminderType } from "../types";

export interface CronRunOptions {
  forceNow?: Date;
  baseUrl?: string;
  dryRun?: boolean;
}

export interface ReminderJobResult {
  success: boolean;
  timestamp: string;
  processedMeetings: number;
  remindersDispatched: {
    "24h": number;
    "1h": number;
    start: number;
  };
  details: Array<{
    meetingId: string;
    meetingTitle: string;
    reminderType: ReminderType;
    parentId: string;
    parentName?: string;
    channelResults: any[];
  }>;
  skippedAlreadySent: number;
}

/**
 * Executes the idempotent PTM reminder job.
 * Inspects all scheduled meetings, identifies due windows (24h, 1h, start time),
 * and dispatches multi-channel notifications only once per (userId, meetingId, type).
 */
export async function runPtmReminderJob(options?: CronRunOptions): Promise<ReminderJobResult> {
  const now = options?.forceNow ? new Date(options.forceNow) : new Date();
  const nowMs = now.getTime();
  const baseUrl = options?.baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const scheduledMeetings: Meeting[] = await database.getMeetingsAsync({ status: "scheduled" });
  const allParents: ParentProfile[] = await database.getAllParentsAsync();

  const dispatchedCount = { "24h": 0, "1h": 0, start: 0 };
  const details: ReminderJobResult["details"] = [];
  let skippedAlreadySent = 0;

  for (const meeting of scheduledMeetings) {
    const startMs = new Date(meeting.startTime).getTime();
    if (isNaN(startMs)) continue;

    const diffMs = startMs - nowMs;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMins = diffMs / (1000 * 60);

    // Identify which reminders are due right now
    const dueReminders: ReminderType[] = [];

    // 1. 24h Reminder window: between 1 hour and 24 hours before start
    if (diffHours <= 24 && diffHours > 1) {
      dueReminders.push("24h");
    }

    // 2. 1h Reminder window: between 0 and 60 minutes before start
    if (diffMins <= 60 && diffMins > 0) {
      dueReminders.push("1h");
    }

    // 3. Start time Reminder window: at start time up to 15 minutes after start
    if (diffMins <= 0 && diffMins >= -15) {
      dueReminders.push("start");
    }

    if (dueReminders.length === 0) continue;

    const meetingInvites = await database.getInvitesForMeetingAsync(meeting.id);

    for (const invite of meetingInvites) {
      const parent = allParents.find((p) => p.id === invite.parentId);
      const parentUserId = parent?.userId || invite.parentId;
      const lang = (parent?.preferredLanguage as "en" | "gu") || "gu";

      for (const rType of dueReminders) {
        const notificationType = `ptm_reminder_${rType}` as const;

        // IDEMPOTENCY CHECK: Ensure reminder has not been sent previously
        const existing = await database.findNotificationAsync(parentUserId, meeting.id, notificationType);
        if (existing) {
          skippedAlreadySent++;
          continue;
        }

        if (options?.dryRun) {
          dispatchedCount[rType]++;
          continue;
        }

        // Generate signed join token & expiring URL
        const joinToken = signMeetingJoinToken({
          meetingId: meeting.id,
          inviteId: invite.id,
          parentId: invite.parentId,
          studentId: invite.studentId,
          role: "parent",
          meetingStartTime: meeting.startTime,
        });
        const joinUrl = buildMeetingJoinUrl(baseUrl, joinToken);

        // Build localized text for parent's language
        const msg = buildBilingualPtmMessage(
          notificationType,
          {
            meetingTitle: meeting.title,
            teacherName: meeting.teacherName || "Teacher",
            startTime: meeting.startTime,
            durationMin: meeting.durationMin,
            studentName: invite.studentName,
            joinUrl,
          },
          lang
        );

        // Dispatch through prioritized channels (In-app, Web Push, Email)
        const dispatchRes = await notificationDispatcher.dispatch({
          userId: parentUserId,
          userEmail: parent?.email,
          userPhone: parent?.phone,
          preferredLanguage: lang,
          meetingId: meeting.id,
          inviteId: invite.id,
          title: msg.title,
          message: msg.body,
          type: notificationType,
          scheduledFor: meeting.startTime,
          joinToken,
          joinUrl,
        });

        dispatchedCount[rType]++;
        details.push({
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          reminderType: rType,
          parentId: invite.parentId,
          parentName: parent?.name,
          channelResults: dispatchRes.results,
        });
      }
    }
  }

  return {
    success: true,
    timestamp: now.toISOString(),
    processedMeetings: scheduledMeetings.length,
    remindersDispatched: dispatchedCount,
    details,
    skippedAlreadySent,
  };
}
