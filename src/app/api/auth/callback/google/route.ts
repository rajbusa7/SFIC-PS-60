import { NextResponse } from "next/server";
import {
  getAppOrigin,
  exchangeGoogleCode,
  getGoogleUserInfo,
} from "@/lib/auth/google";
import {
  SESSION_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
  getClearCookieOptions,
} from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getAppOrigin(request);

  const errorParam = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Determine mode from cookie or state if available
  let mode = "login";
  if (state) {
    const parts = state.split(":");
    if (parts.length >= 3 && (parts[2] === "login" || parts[2] === "register")) {
      mode = parts[2];
    }
  }

  // 1. Handle user cancellation or OAuth errors from Google
  if (errorParam) {
    console.warn("[Google OAuth Callback] Returned error:", errorParam);
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("mode", mode);
    redirectUrl.searchParams.set(
      "error",
      errorParam === "access_denied" ? "google_cancelled" : "oauth_failed"
    );
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  }

  // 2. Validate presence of code and state
  if (!code || !state) {
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("mode", mode);
    redirectUrl.searchParams.set("error", "missing_code_or_state");
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Anti-CSRF verification against HTTP-only state cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${OAUTH_STATE_COOKIE_NAME}=([^;]*)`));
  const storedState = match ? decodeURIComponent(match[1]) : null;

  if (!storedState || storedState !== state) {
    console.error("[Google OAuth Callback] Anti-CSRF state mismatch or expired", {
      hasStored: Boolean(storedState),
      matches: storedState === state,
    });
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("mode", mode);
    redirectUrl.searchParams.set("error", "invalid_state");
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  }

  // 4. Extract intended post-login redirect path securely
  let destination = "/dashboard";
  const stateParts = state.split(":");
  if (stateParts.length >= 2) {
    try {
      const decodedDest = decodeURIComponent(stateParts[1]);
      if (decodedDest.startsWith("/") && !decodedDest.startsWith("//")) {
        destination = decodedDest;
      }
    } catch {}
  }
  if (stateParts.length >= 3) {
    mode = stateParts[2] || "login";
  }

  try {
    // 5. Exchange authorization code for tokens
    const tokens = await exchangeGoogleCode(code, origin);

    // 6. Fetch verified user identity from Google OpenID userinfo
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    if (!userInfo.email) {
      throw new Error("Google account did not provide an email address.");
    }

    if (!userInfo.email_verified) {
      console.warn("[Google OAuth] Email not verified:", userInfo.email);
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("mode", mode);
      redirectUrl.searchParams.set("error", "email_not_verified");
      return NextResponse.redirect(redirectUrl);
    }

    // 7. Check if user already exists in the database
    let existingUser = await db.getUserByGoogleIdAsync(userInfo.sub);
    if (!existingUser) {
      existingUser = await db.getUserByEmailAsync(userInfo.email);
    }

    // Case A: Mode is LOGIN
    if (mode === "login") {
      if (!existingUser) {
        // Teacher is not registered! Direct them to Create Account page
        const redirectUrl = new URL("/login", origin);
        redirectUrl.searchParams.set("mode", "register");
        redirectUrl.searchParams.set("unregistered", "true");
        redirectUrl.searchParams.set("email", userInfo.email);
        if (userInfo.name) redirectUrl.searchParams.set("name", userInfo.name);
        const res = NextResponse.redirect(redirectUrl);
        res.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
        return res;
      }

      // Existing teacher found: update googleId if not linked yet
      let user = existingUser;
      if (!user.googleId) {
        user = await db.upsertUserAsync({
          id: user.id,
          email: user.email,
          googleId: userInfo.sub,
          avatarUrl: userInfo.picture || user.avatarUrl,
        });
      }

      // Establish session
      const sessionToken = await signSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        googleId: user.googleId,
        avatarUrl: user.avatarUrl,
        provider: "google",
      });

      const targetUrl = new URL(destination, origin);
      const response = NextResponse.redirect(targetUrl);
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
      response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
      return response;
    }

    // Case B: Mode is REGISTER
    if (mode === "register") {
      if (existingUser) {
        // Account already exists: notify them and offer login
        const redirectUrl = new URL("/login", origin);
        redirectUrl.searchParams.set("mode", "login");
        redirectUrl.searchParams.set("existing", "true");
        redirectUrl.searchParams.set("email", userInfo.email);
        const res = NextResponse.redirect(redirectUrl);
        res.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
        return res;
      }

      // Create brand new verified teacher account
      const newUser = await db.createUserAsync({
        name: userInfo.name || userInfo.email.split("@")[0],
        email: userInfo.email,
        googleId: userInfo.sub,
        avatarUrl: userInfo.picture,
        role: "teacher",
        schoolId: "sch-gn-01",
        provider: "google",
      });

      // Establish session
      const sessionToken = await signSession({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        schoolId: newUser.schoolId,
        googleId: newUser.googleId,
        avatarUrl: newUser.avatarUrl,
        provider: "google",
      });

      const targetUrl = new URL(destination, origin);
      const response = NextResponse.redirect(targetUrl);
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
      response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
      return response;
    }

    // Default fallback
    return NextResponse.redirect(new URL("/login", origin));
  } catch (err: any) {
    console.error("[Google OAuth Callback Error]:", err);
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("mode", mode);
    redirectUrl.searchParams.set("error", "oauth_failed");
    redirectUrl.searchParams.set("message", encodeURIComponent(err.message || "Authentication failed"));
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  }
}
