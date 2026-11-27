import crypto from "crypto";
import { database } from "../db/database";
import type { PtmNotification, WebPushSubscription } from "../types";

export type NotificationChannel = "in_app" | "web_push" | "email" | "sms";

export interface NotificationDispatchInput {
  userId: string;
  userEmail?: string;
  userPhone?: string;
  preferredLanguage: "en" | "gu";
  meetingId: string;
  inviteId?: string;
  title: string;
  message: string;
  type:
    | "ptm_invite"
    | "ptm_update"
    | "ptm_reschedule"
    | "ptm_cancel"
    | "ptm_reminder_24h"
    | "ptm_reminder_1h"
    | "ptm_reminder_start";
  scheduledFor?: string;
  joinToken?: string;
  joinUrl?: string;
  metadata?: Record<string, any>;
}

export interface ChannelSendResult {
  channel: NotificationChannel;
  success: boolean;
  id?: string;
  details?: any;
  error?: string;
}

export interface INotificationChannelProvider {
  channel: NotificationChannel;
  send(input: NotificationDispatchInput): Promise<ChannelSendResult>;
}

/**
 * 1. In-App Notification Provider (Priority 1: Always saved to DB/Store)
 */
export class InAppChannelProvider implements INotificationChannelProvider {
  channel: NotificationChannel = "in_app";

  async send(input: NotificationDispatchInput): Promise<ChannelSendResult> {
    const id = `ntf-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const notification: PtmNotification = {
      id,
      userId: input.userId,
      type: input.type,
      message: input.message,
      meetingId: input.meetingId,
      inviteId: input.inviteId,
      link: input.joinUrl || `/parent/meetings?meetingId=${input.meetingId}`,
      scheduledFor: input.scheduledFor || null,
      sentAt: new Date().toISOString(),
      channel: "in_app",
      readAt: null,
      metadata: {
        title: input.title,
        preferredLanguage: input.preferredLanguage,
        joinToken: input.joinToken,
        ...input.metadata,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      await database.createNotificationAsync(notification);
      return { channel: "in_app", success: true, id };
    } catch (err: any) {
      console.error("[InAppChannelProvider] Failed to save notification:", err);
      return { channel: "in_app", success: false, error: err.message };
    }
  }
}

/**
 * 2. Web Push Provider (Priority 2: PWA Service Worker via VAPID)
 */
export class WebPushChannelProvider implements INotificationChannelProvider {
  channel: NotificationChannel = "web_push";

  async send(input: NotificationDispatchInput): Promise<ChannelSendResult> {
    try {
      const subs = await database.getPushSubscriptionsForUserAsync(input.userId);
      if (!subs || subs.length === 0) {
        return {
          channel: "web_push",
          success: true,
          details: { skipped: true, reason: "No active push subscription for user" },
        };
      }

      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@studysaathi.edu.in";

      const payloadString = JSON.stringify({
        title: input.title,
        body: input.message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: {
          url: input.joinUrl || `/parent/meetings?meetingId=${input.meetingId}`,
          meetingId: input.meetingId,
          type: input.type,
        },
      });

      // If live VAPID keys are provided, attempt real web-push delivery
      if (vapidPublic && vapidPrivate) {
        try {
          // Dynamic import of web-push if available
          const webpush = await import("web-push" as any).catch(() => null);
          if (webpush && webpush.setVapidDetails) {
            webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
            for (const sub of subs) {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: sub.keys,
                },
                payloadString
              );
            }
            return {
              channel: "web_push",
              success: true,
              details: { deliveredToCount: subs.length, mode: "vapid_live" },
            };
          }
        } catch (wpErr: any) {
          console.warn("[WebPushChannelProvider] Live web-push send error, logging simulated delivery:", wpErr.message);
        }
      }

      // Offline / Test Fallback: simulated push delivery
      return {
        channel: "web_push",
        success: true,
        details: {
          simulated: true,
          subscribersCount: subs.length,
          payload: JSON.parse(payloadString),
          mode: "simulated_local",
        },
      };
    } catch (err: any) {
      console.error("[WebPushChannelProvider] Failed:", err);
      return { channel: "web_push", success: false, error: err.message };
    }
  }
}

/**
 * 3. Email Provider (Priority 3: If parent email exists)
 */
export class EmailChannelProvider implements INotificationChannelProvider {
  channel: NotificationChannel = "email";

  async send(input: NotificationDispatchInput): Promise<ChannelSendResult> {
    if (!input.userEmail) {
      return {
        channel: "email",
        success: true,
        details: { skipped: true, reason: "No email address registered for parent" },
      };
    }

    try {
      const smtpHost = process.env.SMTP_HOST;
      const resendKey = process.env.RESEND_API_KEY;

      if (resendKey) {
        // Live Resend integration if API key is present
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || "StudySaathi AI <notifications@studysaathi.edu.in>",
              to: [input.userEmail],
              subject: input.title,
              text: `${input.message}\n\nJoin Link: ${input.joinUrl || "https://studysaathi.edu.in"}`,
            }),
          });
          const resData = await res.json();
          return { channel: "email", success: true, details: { provider: "resend", resData } };
        } catch (rErr: any) {
          console.warn("[EmailChannelProvider] Resend error, falling back:", rErr.message);
        }
      }

      // Offline / zero-setup fallback: simulated email delivery logged cleanly
      console.log(`[Email Dispatch Simulation] To: ${input.userEmail} | Subject: ${input.title}`);
      return {
        channel: "email",
        success: true,
        details: {
          simulated: true,
          to: input.userEmail,
          subject: input.title,
          body: input.message,
        },
      };
    } catch (err: any) {
      console.error("[EmailChannelProvider] Error:", err);
      return { channel: "email", success: false, error: err.message };
    }
  }
}

/**
 * 4. SMS Provider Interface (Plug-and-play for Twilio / MSG91)
 */
export class SmsChannelProvider implements INotificationChannelProvider {
  channel: NotificationChannel = "sms";

  async send(input: NotificationDispatchInput): Promise<ChannelSendResult> {
    if (!input.userPhone) {
      return {
        channel: "sms",
        success: true,
        details: { skipped: true, reason: "No phone number available" },
      };
    }

    // Plug-and-play: mock SMS logger or gateway
    console.log(`[SMS Notification Mock] To: ${input.userPhone} | Text: ${input.message.slice(0, 140)}...`);
    return {
      channel: "sms",
      success: true,
      details: { simulated: true, to: input.userPhone },
    };
  }
}

/**
 * Unified Multi-Channel Notification Dispatcher
 * Dispatches according to prioritized channels:
 * 1. In-App Notification (always recorded)
 * 2. Web Push (if push subscription exists)
 * 3. Email (if parent email exists)
 */
export class NotificationDispatcher {
  private providers: INotificationChannelProvider[];

  constructor(customProviders?: INotificationChannelProvider[]) {
    this.providers = customProviders || [
      new InAppChannelProvider(),
      new WebPushChannelProvider(),
      new EmailChannelProvider(),
      new SmsChannelProvider(),
    ];
  }

  async dispatch(input: NotificationDispatchInput): Promise<{
    success: boolean;
    inAppId?: string;
    results: ChannelSendResult[];
  }> {
    const results: ChannelSendResult[] = [];
    let inAppId: string | undefined;

    for (const provider of this.providers) {
      // For SMS, only send if explicitly requested or configured
      if (provider.channel === "sms" && !process.env.ENABLE_SMS_NOTIFICATIONS) {
        continue;
      }

      try {
        const res = await provider.send(input);
        results.push(res);
        if (provider.channel === "in_app" && res.id) {
          inAppId = res.id;
        }
      } catch (err: any) {
        results.push({ channel: provider.channel, success: false, error: err.message });
      }
    }

    return {
      success: results.some((r) => r.success),
      inAppId,
      results,
    };
  }
}

export const notificationDispatcher = new NotificationDispatcher();
