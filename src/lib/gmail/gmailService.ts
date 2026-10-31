/**
 * StudySaathi AI - Official Gmail API Client & Integration
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements real Google OAuth 2.0 integration for Gmail API:
 * - Scopes: https://www.googleapis.com/auth/gmail.send, openid, email
 * - Auto-refreshes expired access tokens using stored refresh_tokens
 * - Dispatches RFC 2822 base64url-encoded emails via Gmail REST API
 * - Securely stores credentials on the backend; never exposes tokens to frontend
 * - Fallback to system email service (Resend / SMTP) when Gmail is not connected
 */

import { db } from "@/lib/db/database";
import { sendCustomEmail } from "@/lib/auth/emailService";
import type { GmailConnection, ParentCommunication } from "@/lib/types";

// Minimum required scopes
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

export interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  fromName?: string;
}

export interface SendEmailResult {
  success: boolean;
  channel: "gmail" | "email" | "portal";
  messageId?: string;
  senderEmail?: string;
  error?: string;
}

// In-memory test mailbox for unit/integration testing
export const sentGmailTestDeliveries: Array<{
  to: string;
  subject: string;
  htmlBody: string;
  channel: string;
  dispatchedAt: string;
}> = [];

/**
 * Generates the official Google OAuth 2.0 authorization URL for Gmail permissions.
 */
export function getGmailAuthorizationUrl(origin: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const redirectUri = `${origin}/api/auth/gmail/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES,
    state,
    access_type: "offline",
    prompt: "consent", // Force consent to ensure receiving refresh_token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges the authorization code received from Google for Gmail access & refresh tokens.
 */
export async function exchangeGmailCode(
  code: string,
  origin: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number; scope: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = `${origin}/api/auth/gmail/callback`;

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gmail token exchange failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    scope: data.scope || GMAIL_SCOPES,
  };
}

/**
 * Fetches verified email address of the connected Gmail account.
 */
export async function getGmailUserEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch connected Gmail profile (${response.status})`);
  }

  const data = await response.json();
  return data.email;
}

/**
 * Automatically refreshes access token if expired or about to expire.
 */
export async function getValidGmailAccessToken(connection: GmailConnection): Promise<string> {
  const now = Date.now();
  // If token is valid for more than 60 seconds, return it
  if (now < connection.expiresAt - 60000) {
    return connection.accessToken;
  }

  if (!connection.refreshToken) {
    throw new Error("Gmail authorization expired and no refresh token is stored. Please reconnect Gmail.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: connection.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    // Mark connection as expired/revoked
    db.updateGmailConnectionStatus("expired");
    throw new Error(`Gmail token refresh failed (${response.status}). Authorization may have been revoked.`);
  }

  const data = await response.json();
  const updatedConnection: GmailConnection = {
    ...connection,
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    status: "connected",
  };

  db.saveGmailConnection(updatedConnection);
  return updatedConnection.accessToken;
}

/**
 * Formats a valid RFC 2822 email and converts it to base64url format for Gmail API.
 */
export function formatBase64UrlEmail(
  fromEmail: string,
  fromName: string,
  toEmail: string,
  toName: string | undefined,
  subject: string,
  htmlContent: string
): string {
  // UTF-8 subject encoding
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const fromHeader = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
  const toHeader = toName ? `"${toName}" <${toEmail}>` : toEmail;

  const rfc2822Lines = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlContent,
  ];

  const fullMessage = rfc2822Lines.join("\r\n");
  return Buffer.from(fullMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Dispatches an email using the connected Gmail account, or falls back to system email.
 */
export async function sendParentEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const connection = db.getGmailConnection();

  // Record for test suites
  if (process.env.NODE_ENV === "test") {
    sentGmailTestDeliveries.push({
      to: payload.to,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      channel: connection && connection.status === "connected" ? "gmail" : "email",
      dispatchedAt: new Date().toISOString(),
    });

    return {
      success: true,
      channel: connection && connection.status === "connected" ? "gmail" : "email",
      messageId: `test-msg-${Date.now()}`,
      senderEmail: connection?.email || "StudySaathi AI <onboarding@resend.dev>",
    };
  }

  // Path A: Connected School Gmail
  if (connection && connection.status === "connected") {
    try {
      const accessToken = await getValidGmailAccessToken(connection);
      const rawEmail = formatBase64UrlEmail(
        connection.email,
        payload.fromName || "StudySaathi AI - Model Primary School",
        payload.to,
        payload.toName,
        payload.subject,
        payload.htmlBody
      );

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawEmail }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Gmail API send failed (${res.status}):`, errorText);

        if (res.status === 401 || res.status === 403) {
          db.updateGmailConnectionStatus("revoked");
        }
        throw new Error(`Gmail API error (${res.status}): ${errorText}`);
      }

      const resData = await res.json();
      return {
        success: true,
        channel: "gmail",
        messageId: resData.id,
        senderEmail: connection.email,
      };
    } catch (gmailErr: any) {
      console.warn("Gmail API delivery encountered error, attempting system fallback:", gmailErr.message);
      // Fall through to system email fallback below
    }
  }

  // Path B: Fallback to System Transactional Email (Resend / SMTP / SendGrid)
  try {
    const systemResult = await sendCustomEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.htmlBody,
      fromName: payload.fromName,
    });

    if (systemResult.success) {
      return {
        success: true,
        channel: "email",
        messageId: systemResult.messageId,
        senderEmail: "StudySaathi System Gateway",
      };
    } else {
      return {
        success: false,
        channel: "portal",
        error: "Failed to deliver email through system gateway.",
      };
    }
  } catch (sysErr: any) {
    return {
      success: false,
      channel: "portal",
      error: sysErr.message || "Failed to dispatch email.",
    };
  }
}

/**
 * Checks if Gmail is currently connected and active.
 */
export function getGmailStatus(): {
  isConnected: boolean;
  email: string | null;
  connectedAt: string | null;
  status: "connected" | "expired" | "revoked" | "disconnected";
} {
  const connection = db.getGmailConnection();
  if (!connection || connection.status !== "connected") {
    return {
      isConnected: false,
      email: connection?.email || null,
      connectedAt: connection?.connectedAt || null,
      status: connection?.status || "disconnected",
    };
  }

  return {
    isConnected: true,
    email: connection.email,
    connectedAt: connection.connectedAt,
    status: connection.status,
  };
}

/**
 * Disconnects the school Gmail account.
 */
export function disconnectGmail(): boolean {
  return db.disconnectGmail();
}
