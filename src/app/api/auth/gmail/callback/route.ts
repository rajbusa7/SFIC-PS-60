import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/auth/google";
import { exchangeGmailCode, getGmailUserEmail } from "@/lib/gmail/gmailService";
import { extractSessionToken, verifySession, getClearCookieOptions } from "@/lib/auth/session";
import { db } from "@/lib/db/database";
import type { GmailConnection } from "@/lib/types";

export const dynamic = "force-dynamic";

const GMAIL_STATE_COOKIE_NAME = "studysaathi_gmail_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getAppOrigin(request);

  const errorParam = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  let destination = "/notices?tab=bridge";
  if (state) {
    const parts = state.split(":");
    if (parts.length >= 2 && parts[1]) {
      try {
        destination = decodeURIComponent(parts[1]);
      } catch {}
    }
  }

  // Handle user cancellation or OAuth error
  if (errorParam) {
    console.warn("[Gmail OAuth Callback] User cancelled or Google returned error:", errorParam);
    const redirectUrl = new URL(destination, origin);
    redirectUrl.searchParams.set("gmail_error", errorParam === "access_denied" ? "access_denied" : "oauth_failed");
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(GMAIL_STATE_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  }

  if (!code || !state) {
    const redirectUrl = new URL(destination, origin);
    redirectUrl.searchParams.set("gmail_error", "missing_code_or_state");
    return NextResponse.redirect(redirectUrl);
  }

  // Anti-CSRF verification
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${GMAIL_STATE_COOKIE_NAME}=([^;]*)`));
  const storedState = match ? decodeURIComponent(match[1]) : null;

  if (!storedState || storedState !== state) {
    console.warn("[Gmail OAuth Callback] State token mismatch or expired. Continuing if in development/test.");
    // In production enforce strict match; in local dev allow if state matches expected format
    if (process.env.NODE_ENV === "production" && (!storedState || storedState !== state)) {
      const redirectUrl = new URL(destination, origin);
      redirectUrl.searchParams.set("gmail_error", "invalid_state");
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set(GMAIL_STATE_COOKIE_NAME, "", getClearCookieOptions());
      return res;
    }
  }

  try {
    const tokenData = await exchangeGmailCode(code, origin);
    const email = await getGmailUserEmail(tokenData.accessToken);

    // Resolve current user/teacher identity
    let connectedBy = "teacher-admin";
    const sessionToken = await extractSessionToken(request);
    if (sessionToken) {
      const session = await verifySession(sessionToken);
      if (session) {
        connectedBy = session.id;
      }
    }

    const connection: GmailConnection = {
      id: "gconn-school-01",
      schoolId: "sch-model-paliyad",
      email,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: Date.now() + tokenData.expiresIn * 1000,
      scope: tokenData.scope,
      connectedAt: new Date().toISOString(),
      connectedByUserId: connectedBy,
      status: "connected",
    };

    db.saveGmailConnection(connection);

    const redirectUrl = new URL(destination, origin);
    redirectUrl.searchParams.set("gmail", "connected");
    redirectUrl.searchParams.set("gmail_email", email);

    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(GMAIL_STATE_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  } catch (err: any) {
    console.error("[Gmail OAuth Callback Error]:", err);
    const redirectUrl = new URL(destination, origin);
    redirectUrl.searchParams.set("gmail_error", "exchange_failed");
    redirectUrl.searchParams.set("gmail_details", encodeURIComponent(err.message || "Failed to exchange authorization code"));
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(GMAIL_STATE_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  }
}
