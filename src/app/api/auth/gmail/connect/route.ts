import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/auth/google";
import { getGmailAuthorizationUrl } from "@/lib/gmail/gmailService";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GMAIL_STATE_COOKIE_NAME = "studysaathi_gmail_oauth_state";
const GMAIL_STATE_MAX_AGE = 10 * 60; // 10 minutes

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const redirectPath = url.searchParams.get("redirect") || "/notices?tab=bridge";
    const origin = getAppOrigin(request);

    // Optional RBAC check: verify teacher or admin if session exists
    const sessionToken = await extractSessionToken(request);
    if (sessionToken) {
      const session = await verifySession(sessionToken);
      if (session && session.role !== "teacher" && session.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Only teachers and administrators can connect school Gmail." },
          { status: 403 }
        );
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Google OAuth is not configured on this server.",
          instructions: {
            step1: "Create an OAuth 2.0 Client ID in Google Cloud Console with Gmail API enabled",
            step2: `Add Authorized redirect URI: ${origin}/api/auth/gmail/callback`,
            step3: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
          },
        },
        { status: 503 }
      );
    }

    // Generate anti-CSRF state
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    const state = `${randomHex}:${encodeURIComponent(redirectPath)}:gmail`;

    const authUrl = getGmailAuthorizationUrl(origin, state);

    const acceptHeader = request.headers.get("accept") || "";
    const isNav = acceptHeader.includes("text/html");

    const response = isNav
      ? NextResponse.redirect(authUrl)
      : NextResponse.json({ success: true, url: authUrl });

    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set(GMAIL_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: GMAIL_STATE_MAX_AGE,
    });

    return response;
  } catch (error: any) {
    console.error("[Gmail Connect API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate Gmail connection" },
      { status: 500 }
    );
  }
}
