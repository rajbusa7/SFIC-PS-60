import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db/database";
import { verifyPassword } from "../src/lib/auth/password";
import { verifySession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { POST as registerTeacherHandler } from "../src/app/api/auth/register/route";
import { POST as registerParentHandler } from "../src/app/api/auth/register-parent/route";
import { POST as loginHandler } from "../src/app/api/auth/login/route";
import { GET as meHandler } from "../src/app/api/auth/me/route";
import { POST as logoutHandler } from "../src/app/api/auth/logout/route";
import { proxy as middlewareHandler } from "../src/proxy";
import { NextRequest } from "next/server";

describe("StudySaathi AI - Registration Redirect & Dashboard Protection Flow", () => {
  const storePath = path.resolve(process.cwd(), "data/shikshasetu_store.json");
  let storeBackup = "";

  const timestamp = Date.now();
  const teacherEmail = `newteacher.${timestamp}@gujarat-schools.edu.in`;
  const teacherPassword = "TeacherPassword2026!";
  const teacherName = "Jigneshbhai Dave";

  const parentEmail = `newparent.${timestamp}@example.com`;
  const parentPassword = "ParentPassword2026!";
  const parentName = "Bhavnaben Dave";

  let createdTeacherId = "";
  let createdParentId = "";
  let teacherSessionCookie = "";
  let parentSessionCookie = "";

  before(() => {
    if (fs.existsSync(storePath)) {
      storeBackup = fs.readFileSync(storePath, "utf-8");
    }
  });

  after(() => {
    if (storeBackup && fs.existsSync(storePath)) {
      fs.writeFileSync(storePath, storeBackup, "utf-8");
    }
  });

  describe("Teacher Registration Flow", () => {
    it("Step 1 & 2: Submitting teacher registration creates account WITHOUT automatic session cookie", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacherName,
          email: teacherEmail,
          password: teacherPassword,
          schoolId: "sch-gn-01",
        }),
      });

      const res = await registerTeacherHandler(req);
      assert.equal(res.status, 200, "Registration must succeed with HTTP 200");

      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.user?.id, "User ID must be generated");
      assert.equal(data.user.email, teacherEmail.toLowerCase());
      assert.equal(data.user.name, teacherName);
      assert.equal(data.user.role, "teacher");
      assert.equal(data.user.passwordHash, undefined, "Password hash must not be exposed");
      assert.match(data.message, /Account created successfully/i);

      createdTeacherId = data.user.id;

      // CRITICAL CHECK: Registration must NOT set session cookie!
      const setCookie = res.headers.get("set-cookie");
      assert.equal(
        setCookie,
        null,
        "Registration response must NOT set a session cookie (user must log in manually)"
      );

      // Verify user exists in persistent database with PBKDF2 hash
      const dbUser = await db.getUserByEmailAsync(teacherEmail);
      assert.ok(dbUser, "User must exist in database");
      assert.equal(dbUser.id, createdTeacherId);
      assert.equal(dbUser.status, "active");
      assert.ok(verifyPassword(teacherPassword, dbUser.passwordHash!), "Stored hash must verify raw password");
    });

    it("Step 3: Unauthenticated newly registered user is blocked from dashboard by route guard", async () => {
      // 1. Check API endpoint /api/auth/me without cookies
      const meReq = new Request("http://localhost:3000/api/auth/me");
      const meRes = await meHandler(meReq);
      assert.equal(meRes.status, 200);
      const meData = await meRes.json();
      assert.equal(meData.authenticated, false, "Must report authenticated: false");

      // 2. Check middleware route protection on /dashboard
      const dashboardReq = new NextRequest("http://localhost:3000/dashboard");
      const middlewareRes = await middlewareHandler(dashboardReq);
      assert.ok(middlewareRes, "Middleware must intercept unauthenticated dashboard access");
      assert.equal(middlewareRes.status, 307, "Must redirect unauthenticated user");

      const location = middlewareRes.headers.get("location");
      assert.ok(location?.includes("/login"), "Unauthenticated user must be redirected to /login");
    });

    it("Step 4: User manually enters credentials on login page to obtain session", async () => {
      // 4a. Incorrect password rejected
      const badReq = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: teacherEmail,
          password: "WrongPassword999!",
          role: "teacher",
        }),
      });
      const badRes = await loginHandler(badReq);
      assert.equal(badRes.status, 401, "Invalid password must return 401");

      // 4b. Valid credentials accepted
      const validReq = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: teacherEmail,
          password: teacherPassword,
          role: "teacher",
        }),
      });
      const validRes = await loginHandler(validReq);
      assert.equal(validRes.status, 200, "Valid login must return 200");

      const loginData = await validRes.json();
      assert.equal(loginData.success, true);
      assert.equal(loginData.user.id, createdTeacherId);

      // Verify Set-Cookie header is issued on LOGIN
      const setCookie = validRes.headers.get("set-cookie");
      assert.ok(setCookie, "Login response must set session cookie");
      assert.ok(setCookie.includes(SESSION_COOKIE_NAME), "Session cookie name must match");

      const match = setCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      assert.ok(match, "Session token must be present in cookie");
      teacherSessionCookie = match[1];

      // Verify session token payload
      const sessionPayload = await verifySession(teacherSessionCookie);
      assert.ok(sessionPayload, "Session token must be cryptographically valid");
      assert.equal(sessionPayload.id, createdTeacherId);
      assert.equal(sessionPayload.role, "teacher");
    });

    it("Step 5: Authenticated teacher can access dashboard and profile", async () => {
      // 1. Check API endpoint /api/auth/me with session cookie
      const meReq = new Request("http://localhost:3000/api/auth/me", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${teacherSessionCookie}` },
      });
      const meRes = await meHandler(meReq);
      assert.equal(meRes.status, 200);
      const meData = await meRes.json();
      assert.equal(meData.authenticated, true);
      assert.equal(meData.user.id, createdTeacherId);
      assert.equal(meData.user.email, teacherEmail.toLowerCase());

      // 2. Check middleware allows authenticated user into /dashboard
      const dashboardReq = new NextRequest("http://localhost:3000/dashboard", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${teacherSessionCookie}` },
      });
      const middlewareRes = await middlewareHandler(dashboardReq);
      // When middleware allows through without redirect, it returns a 200 or next() response
      assert.ok(
        middlewareRes.status === 200 || !middlewareRes.headers.get("location")?.includes("/login"),
        "Authenticated teacher must be granted access to /dashboard"
      );
    });
  });

  describe("Parent Registration Flow", () => {
    it("Step 1 & 2: Submitting parent registration creates account WITHOUT automatic session cookie", async () => {
      const req = new Request("http://localhost:3000/api/auth/register-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName,
          email: parentEmail,
          password: parentPassword,
          confirmPassword: parentPassword,
          preferredLanguage: "gu",
        }),
      });

      const res = await registerParentHandler(req);
      assert.equal(res.status, 200, "Parent registration must succeed with HTTP 200");

      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.user?.id);
      assert.equal(data.user.role, "parent");
      assert.ok(data.parentProfile?.id);
      assert.match(data.message, /Account created successfully/i);

      createdParentId = data.user.id;

      // CRITICAL CHECK: Registration must NOT set session cookie!
      const setCookie = res.headers.get("set-cookie");
      assert.equal(
        setCookie,
        null,
        "Parent registration must NOT set session cookie (user must log in manually)"
      );
    });

    it("Step 3: Unauthenticated newly registered parent is blocked from parent dashboard", async () => {
      const dashboardReq = new NextRequest("http://localhost:3000/parent/dashboard");
      const middlewareRes = await middlewareHandler(dashboardReq);
      assert.ok(middlewareRes);
      assert.equal(middlewareRes.status, 307);

      const location = middlewareRes.headers.get("location");
      assert.ok(location?.includes("/parent/login"), "Unauthenticated parent must be redirected to /parent/login");
    });

    it("Step 4 & 5: Parent logs in with credentials and accesses parent dashboard", async () => {
      const loginReq = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parentEmail,
          password: parentPassword,
          role: "parent",
        }),
      });
      const loginRes = await loginHandler(loginReq);
      assert.equal(loginRes.status, 200);

      const loginData = await loginRes.json();
      assert.equal(loginData.success, true);
      assert.equal(loginData.user.id, createdParentId);
      assert.equal(loginData.user.role, "parent");

      const setCookie = loginRes.headers.get("set-cookie");
      assert.ok(setCookie);
      const match = setCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      assert.ok(match);
      parentSessionCookie = match[1];

      // Middleware allows parent into /parent/dashboard
      const dashboardReq = new NextRequest("http://localhost:3000/parent/dashboard", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${parentSessionCookie}` },
      });
      const middlewareRes = await middlewareHandler(dashboardReq);
      assert.ok(
        middlewareRes.status === 200 || !middlewareRes.headers.get("location")?.includes("/parent/login"),
        "Authenticated parent must be granted access to /parent/dashboard"
      );
    });
  });

  describe("Validation & Security Controls", () => {
    it("Prevents duplicate email registration", async () => {
      const dupReq = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate User",
          email: teacherEmail,
          password: "SomePassword123",
        }),
      });
      const dupRes = await registerTeacherHandler(dupReq);
      assert.equal(dupRes.status, 409, "Duplicate email must return 409 Conflict");
    });

    it("Rejects invalid registration parameters", async () => {
      // Missing name
      const noNameRes = await registerTeacherHandler(
        new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "", email: "valid@test.edu.in", password: "Pass123456" }),
        })
      );
      assert.equal(noNameRes.status, 400);

      // Invalid email
      const badEmailRes = await registerTeacherHandler(
        new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Valid Name", email: "notanemail", password: "Pass123456" }),
        })
      );
      assert.equal(badEmailRes.status, 400);

      // Short password
      const shortPassRes = await registerTeacherHandler(
        new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Valid Name", email: "valid@test.edu.in", password: "123" }),
        })
      );
      assert.equal(shortPassRes.status, 400);
    });
  });
});
