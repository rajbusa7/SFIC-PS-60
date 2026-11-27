import crypto from "crypto";

export interface SignedMeetingJoinPayload {
  meetingId: string;
  inviteId: string;
  parentId: string;
  studentId?: string;
  role: "parent" | "teacher";
  exp: number; // Unix timestamp in seconds
  iat: number;
}

function getMeetingSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.CRON_SECRET ||
    "studysaathi_ptm_secure_join_secret_2026"
  );
}

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(data: string): string {
  let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Signs an expiring join token for a PTM meeting invite.
 * Default expiration: 24 hours after meeting start, or specified hours.
 */
export function signMeetingJoinToken(
  params: Omit<SignedMeetingJoinPayload, "iat" | "exp"> & {
    expiresInSeconds?: number;
    meetingStartTime?: string;
  }
): string {
  const secret = getMeetingSecret();
  const now = Math.floor(Date.now() / 1000);

  let exp: number;
  if (params.expiresInSeconds) {
    exp = now + params.expiresInSeconds;
  } else if (params.meetingStartTime) {
    const startSec = Math.floor(new Date(params.meetingStartTime).getTime() / 1000);
    // Allow joining up to 24 hours after meeting scheduled start time
    exp = Math.max(startSec + 24 * 3600, now + 3600);
  } else {
    exp = now + 48 * 3600; // default 48h
  }

  const payload: SignedMeetingJoinPayload = {
    meetingId: params.meetingId,
    inviteId: params.inviteId,
    parentId: params.parentId,
    studentId: params.studentId,
    role: params.role,
    exp,
    iat: now,
  };

  const payloadStr = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadStr);

  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Verifies a signed meeting join token.
 */
export function verifyMeetingJoinToken(token: string): {
  valid: boolean;
  payload?: SignedMeetingJoinPayload;
  error?: string;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, error: "Malformed join token" };
  }

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return { valid: false, error: "Invalid token parts" };
  }

  const secret = getMeetingSecret();
  const expectedSignature = base64UrlEncode(
    crypto.createHmac("sha256", secret).update(encodedPayload).digest()
  );

  const sigBuf = Buffer.from(encodedSignature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: "Invalid token signature" };
  }

  try {
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload: SignedMeetingJoinPayload = JSON.parse(payloadStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, payload, error: "Join link has expired" };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: "Failed to parse token payload" };
  }
}

/**
 * Builds the full join URL with the signed token.
 */
export function buildMeetingJoinUrl(baseUrl: string, token: string): string {
  const cleanBase = (baseUrl || "").replace(/\/+$/, "");
  return `${cleanBase}/meetings/join?token=${encodeURIComponent(token)}`;
}
