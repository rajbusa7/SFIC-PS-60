/**
 * StudySaathi AI - Cryptographic Session & Cookie Security Module
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements Edge-compatible HMAC-SHA256 session token signing and verification
 * using the Web Cryptography API (crypto.subtle), safe for Next.js Middleware and Route Handlers.
 */

import type { UserRole } from "@shared/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
  googleId?: string;
  avatarUrl?: string;
  provider?: "google" | "local";
  iat?: number;
  exp?: number;
}

export const SESSION_COOKIE_NAME = "studysaathi_session";
export const OAUTH_STATE_COOKIE_NAME = "studysaathi_oauth_state";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
export const OAUTH_STATE_MAX_AGE = 10 * 60; // 10 minutes

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "studysaathi_pedagogical_secure_session_secret_gujarat_2026";

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  return bufferToBase64Url(utf8Bytes);
}

function base64UrlToString(str: string): string {
  const bytes = base64UrlToBuffer(str);
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
 * Signs a session user object into a cryptographically verified token.
 * Token format: <base64url(payload)>.<base64url(hmac-sha256 signature)>
 */
export async function signSession(
  user: Omit<SessionUser, "iat" | "exp">,
  customMaxAgeSeconds = SESSION_MAX_AGE
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionUser = {
    ...user,
    iat: now,
    exp: now + customMaxAgeSeconds,
  };

  const payloadStr = JSON.stringify(payload);
  const encodedPayload = stringToBase64Url(payloadStr);

  const key = await getHmacKey(AUTH_SECRET);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  const encodedSignature = bufferToBase64Url(signatureBuffer);
  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Verifies and parses a signed session token.
 * Returns null if the signature is invalid, modified, or expired.
 */
export async function verifySession(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSignature] = parts;

  try {
    const key = await getHmacKey(AUTH_SECRET);
    const signatureBytes = base64UrlToBuffer(encodedSignature);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlToString(encodedPayload);
    const payload = JSON.parse(payloadJson) as SessionUser;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookie option generator with secure HTTP-only defaults.
 */
export function getSessionCookieOptions(maxAgeSeconds = SESSION_MAX_AGE) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Cookie options to clear a session.
 */
export function getClearCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

/**
 * Extracts session token safely from either the Request headers (cookie or Authorization)
 * or via Next.js cookies(), without crashing if cookies() is called outside request scope.
 */
export async function extractSessionToken(request?: Request): Promise<string | null> {
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token) return token;
    }
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + SESSION_COOKIE_NAME + '=([^;]+)'));
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}
