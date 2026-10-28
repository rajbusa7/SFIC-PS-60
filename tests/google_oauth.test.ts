import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  signSession,
  verifySession,
  getSessionCookieOptions,
  getClearCookieOptions,
  SESSION_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "../src/lib/auth/session";
import {
  getGoogleAuthorizationUrl,
  isGoogleAuthConfigured,
  getAppOrigin,
} from "../src/lib/auth/google";
import { db } from "../src/lib/db/database";
import { GET as getConfigHandler } from "../src/app/api/auth/config/route";
import { GET as getMeHandler } from "../src/app/api/auth/me/route";
import { POST as logoutHandler } from "../src/app/api/auth/logout/route";
import { GET as callbackHandler } from "../src/app/api/auth/callback/google/route";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { NextRequest } from "next/server";
import { proxy as middleware } from "../src/proxy";

describe("StudySaathi AI - Google OAuth & Teacher Authentication Suite", () => {
  const testUser = {
    id: "usr-test-oauth-01",
    name: "Dr. Ananya Joshi",
    email: "ananya.joshi@example.com",
    role: "teacher" as const,
    schoolId: "sch-gn-01",
    googleId: "google-sub-987654321",
    avatarUrl: "https://lh3.googleusercontent.com/a/test-avatar",
    provider: "google" as const,
  };

  it("1. Cryptographic Session: signs, serializes, and verifies HMAC-SHA256 session tokens", async () => {
    const token = await signSession(testUser);
    assert.ok(token, "Session token must be generated");
    assert.equal(token.split(".").length, 2, "Token must be <payload>.<signature>");

    const verified = await verifySession(token);
    assert.ok(verified, "Token must verify successfully");
    assert.equal(verified?.email, testUser.email);
    assert.equal(verified?.name, testUser.name);
    assert.equal(verified?.role, "teacher");
    assert.equal(verified?.googleId, testUser.googleId);
    assert.ok(verified?.exp && verified.exp > Math.floor(Date.now() / 1000));
  });

  it("2. Tamper Resistance: rejects modified payload and forged signatures", async () => {
    const token = await signSession(testUser);
    const [payload, signature] = token.split(".");

    // Tamper with payload (elevate role to admin)
    const rawPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    rawPayload.role = "admin";
    const forgedPayload = Buffer.from(JSON.stringify(rawPayload)).toString("base64url");
    const tamperedToken = `${forgedPayload}.${signature}`;

    const result = await verifySession(tamperedToken);
    assert.equal(result, null, "Tampered token must be rejected");

    // Tamper with signature
    const corruptSigToken = `${payload}.${signature.slice(0, -4)}abcd`;
    const corruptResult = await verifySession(corruptSigToken);
    assert.equal(corruptResult, null, "Corrupt signature must be rejected");

    // Malformed input
    assert.equal(await verifySession(""), null);
    assert.equal(await verifySession("invalid.format.extra"), null);
  });

  it("3. Expiration Check: rejects expired session tokens", async () => {
    // Generate token that expired 10 seconds ago (-10s max age)
    const expiredToken = await signSession(testUser, -10);
    const verified = await verifySession(expiredToken);
    assert.equal(verified, null, "Expired token must be rejected");
  });

  it("4. Cookie Security: enforces HttpOnly, SameSite=Lax, and proper expiration", () => {
    const options = getSessionCookieOptions();
    assert.equal(options.httpOnly, true, "Session cookie must be HttpOnly");
    assert.equal(options.sameSite, "lax", "Session cookie must be SameSite=Lax");
    assert.equal(options.path, "/", "Session cookie must be root path");
    assert.equal(options.maxAge, 7 * 24 * 60 * 60, "Session cookie must last 7 days");

    const clearOpts = getClearCookieOptions();
    assert.equal(clearOpts.maxAge, 0, "Clear cookie must have maxAge 0");
    assert.ok(clearOpts.expires.getTime() <= 0, "Clear cookie expires in past");
  });

  it("5. Google Auth URL: constructs standard Google OAuth 2.0 authorization URL", () => {
    const origin = "https://shikshasetu-ai-iota.vercel.app";
    const state = "test-csrf-token-12345:/dashboard:login";
    const url = getGoogleAuthorizationUrl(origin, state);

    assert.ok(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
    const parsed = new URL(url);
    assert.equal(
      parsed.searchParams.get("redirect_uri"),
      "https://shikshasetu-ai-iota.vercel.app/api/auth/callback/google"
    );
    assert.equal(parsed.searchParams.get("response_type"), "code");
    assert.equal(parsed.searchParams.get("scope"), "openid email profile");
    assert.equal(parsed.searchParams.get("state"), state);
    assert.equal(parsed.searchParams.get("prompt"), "select_account");
  });

  it("6. Database User Upsert: creates user with default Teacher role and Gandhinagar school", async () => {
    const uniqueEmail = `teacher.${Date.now()}@studysaathi.edu.in`;
    const created = await db.createUserAsync({
      name: "Bhavik Dave",
      email: uniqueEmail,
      googleId: `google-sub-${Date.now()}`,
      avatarUrl: "https://lh3.googleusercontent.com/test",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "google",
    });

    assert.ok(created.id, "User ID must be assigned");
    assert.equal(created.email, uniqueEmail);
    assert.equal(created.role, "teacher", "New Google OAuth user must default to teacher role");
    assert.equal(created.schoolId, "sch-gn-01", "Must associate with baseline school");
    assert.equal(created.provider, "google");

    // Fetch user back from database
    const fetched = await db.getUserByEmailAsync(uniqueEmail);
    assert.ok(fetched);
    assert.equal(fetched?.id, created.id);
  });

  it("7. API Route GET /api/auth/config: returns Google configuration status", async () => {
    const res = await getConfigHandler();
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(typeof json.googleConfigured, "boolean");
  });

  it("8. API Route GET /api/auth/me: verifies session from HTTP cookie", async () => {
    // A. Unauthenticated request
    const unauthReq = new Request("http://localhost:3000/api/auth/me");
    const unauthRes = await getMeHandler(unauthReq);
    const unauthJson = await unauthRes.json();
    assert.equal(unauthJson.authenticated, false);
    assert.equal(unauthJson.user, null);

    // B. Authenticated request with signed cookie
    const token = await signSession(testUser);
    const authReq = new Request("http://localhost:3000/api/auth/me", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    const authRes = await getMeHandler(authReq);
    const authJson = await authRes.json();
    assert.equal(authJson.authenticated, true);
    assert.equal(authJson.user.email, testUser.email);
  });

  it("9. API Route POST /api/auth/logout: clears session and state cookies", async () => {
    const res = await logoutHandler();
    assert.equal(res.status, 200);
    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes(SESSION_COOKIE_NAME));
    assert.ok(setCookie.includes("Max-Age=0"));
  });

  it("10. Anti-CSRF Protection: Callback rejects invalid or mismatched state", async () => {
    // Calling callback without matching state cookie
    const req = new Request(
      "http://localhost:3000/api/auth/callback/google?code=fake_code&state=forged_state"
    );
    const res = await callbackHandler(req);
    // Should redirect to /login?error=invalid_state
    const location = res.headers.get("location") || "";
    assert.ok(location.includes("/login"));
    assert.ok(location.includes("error=invalid_state"));
  });

  it("11. Teacher Registration API: creates teacher and prevents duplicate registration", async () => {
    const regEmail = `teacher.reg.${Date.now()}@studysaathi.edu.in`;
    const regReq = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Meera Trivedi",
        email: regEmail,
        password: "SecurePassword2026!",
        schoolId: "sch-gn-01",
      }),
    });

    const regRes = await registerHandler(regReq);
    assert.equal(regRes.status, 200);
    const regJson = await regRes.json();
    assert.equal(regJson.success, true);
    assert.equal(regJson.user.email, regEmail);
    assert.equal(regJson.user.role, "teacher");

    // Attempting to register again with same email must fail with 409
    const dupReq = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Meera Trivedi Duplicate",
        email: regEmail,
        password: "AnotherPassword123!",
      }),
    });
    const dupRes = await registerHandler(dupReq);
    assert.equal(dupRes.status, 409);
    const dupJson = await dupRes.json();
    assert.equal(dupJson.success, false);
    assert.ok(dupJson.existing);
  });

  it("12. Middleware Protection: blocks unauthenticated requests to protected routes", async () => {
    // Unauthenticated access to /dashboard
    const unauthReq = new NextRequest("http://localhost:3000/dashboard");
    const redirectRes = await middleware(unauthReq);
    const loc = redirectRes.headers.get("location") || "";
    assert.ok(loc.includes("/login?redirect="), "Must redirect unauthenticated user to /login");
    assert.ok(loc.includes("%2Fdashboard"));

    // Authenticated access with valid session cookie
    const token = await signSession(testUser);
    const authReq = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    const allowRes = await middleware(authReq);
    assert.equal(allowRes.headers.get("location"), null, "Must allow authenticated user without redirect");

    // Unauthenticated access to public root "/" is allowed
    const publicReq = new NextRequest("http://localhost:3000/");
    const publicRes = await middleware(publicReq);
    assert.equal(publicRes.headers.get("location"), null, "Public landing page must not redirect");
  });
});
