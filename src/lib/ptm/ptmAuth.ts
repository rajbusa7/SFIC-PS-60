/**
 * StudySaathi AI - PTM Meeting Security & Token Verification Engine
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 */

import { extractSessionToken, verifySession, type SessionUser } from "../auth/session";
import { db } from "../db/database";
import type { PtmMeeting, PtmParticipantRole } from "../types";

export interface PtmTokenPayload {
  meetingId: string;
  meetingCode: string;
  userId: string;
  userName: string;
  role: PtmParticipantRole;
  canAdmit: boolean;
  canShareScreen: boolean;
  exp: number; // Unix timestamp
  iat: number;
}

const PTM_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "studysaathi_ptm_secure_video_token_secret_gujarat_2026";

function stringToBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToString(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Generates human-friendly 6-digit meeting codes (e.g., ptm-482-901)
 */
export function generateMeetingCode(): string {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(100 + Math.random() * 900);
  return `ptm-${p1}-${p2}`;
}

/**
 * Cryptographically signs a meeting token with HMAC-SHA256
 */
export async function signPtmToken(
  payload: Omit<PtmTokenPayload, "iat" | "exp">,
  expiresInSeconds = 4 * 60 * 60 // 4 hours
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: PtmTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const payloadStr = JSON.stringify(fullPayload);
  const encodedPayload = stringToBase64Url(payloadStr);

  const key = await getHmacKey(PTM_SECRET);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  let binarySig = "";
  const sigBytes = new Uint8Array(signatureBuffer);
  for (let i = 0; i < sigBytes.length; i++) {
    binarySig += String.fromCharCode(sigBytes[i]);
  }
  const encodedSig = btoa(binarySig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${encodedPayload}.${encodedSig}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 meeting token
 */
export async function verifyPtmToken(token: string): Promise<PtmTokenPayload | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSig] = parts;
  try {
    const key = await getHmacKey(PTM_SECRET);

    let base64Sig = encodedSig.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Sig.length % 4) base64Sig += "=";
    const binarySig = atob(base64Sig);
    const sigBuffer = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBuffer[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return null;

    const payloadStr = base64UrlToString(encodedPayload);
    const payload: PtmTokenPayload = JSON.parse(payloadStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}

export interface MeetingAccessResult {
  allowed: boolean;
  meeting?: PtmMeeting;
  user?: {
    id: string;
    name: string;
    role: PtmParticipantRole;
    email?: string;
  };
  error?: string;
  status: number;
}

/**
 * Validates meeting access for a request by checking session cookies or signed token.
 */
export async function validateMeetingAccess(
  request: Request,
  meetingIdOrCode: string
): Promise<MeetingAccessResult> {
  const meeting = await db.getPtmMeetingByIdAsync(meetingIdOrCode);
  if (!meeting) {
    return {
      allowed: false,
      status: 404,
      error: "Meeting not found. Please verify your meeting code or invitation link.",
    };
  }

  // 1. Check URL query token if provided
  const url = new URL(request.url);
  const directToken = url.searchParams.get("token") || request.headers.get("x-ptm-token");
  if (directToken) {
    const tokenPayload = await verifyPtmToken(directToken);
    if (tokenPayload && tokenPayload.meetingId === meeting.id) {
      return {
        allowed: true,
        status: 200,
        meeting,
        user: {
          id: tokenPayload.userId,
          name: tokenPayload.userName,
          role: tokenPayload.role,
        },
      };
    }
  }

  // 2. Check session user
  const sessionToken = await extractSessionToken(request);
  const session = await verifySession(sessionToken);

  if (!session) {
    return {
      allowed: false,
      status: 401,
      meeting,
      error: "Authentication required to access this meeting. Please sign in or use your invitation link.",
    };
  }

  // Admin access
  if (session.role === "admin") {
    return {
      allowed: true,
      status: 200,
      meeting,
      user: {
        id: session.id,
        name: session.name,
        role: "admin",
        email: session.email,
      },
    };
  }

  // Teacher access
  if (session.role === "teacher") {
    if (meeting.teacherId === session.id || session.role === "teacher") {
      return {
        allowed: true,
        status: 200,
        meeting,
        user: {
          id: session.id,
          name: session.name,
          role: "teacher",
          email: session.email,
        },
      };
    }
  }

  // Parent access
  if (session.role === "parent") {
    const parentProfile = await db.getParentByUserIdAsync(session.id);
    const parentId = parentProfile?.id;

    // Check if this meeting is for this parent or linked to their child
    const isDirectParent = parentId && meeting.parentId === parentId;
    const isStudentParent = parentProfile?.studentIds?.includes(meeting.studentId);

    if (isDirectParent || isStudentParent) {
      return {
        allowed: true,
        status: 200,
        meeting,
        user: {
          id: parentId || session.id,
          name: parentProfile?.name || session.name,
          role: "parent",
          email: parentProfile?.email || session.email,
        },
      };
    }
  }

  return {
    allowed: false,
    status: 403,
    meeting,
    error: "Forbidden: You are not authorized to join this meeting room.",
  };
}
