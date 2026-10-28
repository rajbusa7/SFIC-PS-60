import { NextResponse } from "next/server";
import {
  getAppOrigin,
  getGoogleAuthorizationUrl,
  isGoogleAuthConfigured,
} from "@/lib/auth/google";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE,
} from "@/lib/auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectPath = url.searchParams.get("redirect") || "/dashboard";
  const mode = url.searchParams.get("mode") || "login"; // "login" | "register"
  const origin = getAppOrigin(request);

  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Google OAuth is not configured on this server.",
        instructions: {
          step1: "Create an OAuth 2.0 Client ID in Google Cloud Console",
          step2: "Add Authorized JavaScript origins: " + origin,
          step3: "Add Authorized redirect URI: " + origin + "/api/auth/callback/google",
          step4: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
        },
      },
      { status: 503 }
    );
  }

  // Generate cryptographic anti-CSRF state containing destination and mode
  // Format: <random32hex>:<encodedDestination>:<mode>
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const state = `${randomHex}:${encodeURIComponent(redirectPath)}:${mode}`;

  const authUrl = getGoogleAuthorizationUrl(origin, state);

  // If request wants json (e.g. from fetch), return JSON. If direct navigation, redirect.
  const acceptHeader = request.headers.get("accept") || "";
  const isNav = acceptHeader.includes("text/html");

  const response = isNav
    ? NextResponse.redirect(authUrl)
    : NextResponse.json({ success: true, url: authUrl });

  // Store state in secure HTTP-only cookie for anti-CSRF validation in callback
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE,
  });

  return response;
}
