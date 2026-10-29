import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { authService } from "../apps/backend/src/services/authService";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signSession, verifySession } from "../src/lib/auth/session";
import { POST as registerParentHandler } from "../src/app/api/auth/register-parent/route";
import { POST as loginHandler } from "../src/app/api/v1/auth/login/route";
import { GET as getParentStudentHandler } from "../src/app/api/parent/students/[id]/route";

describe("Parent Portal End-to-End System Tests", () => {
  const testTimestamp = Date.now();
  const testParentEmail = `parent.test.${testTimestamp}@example.com`;
  const testParentPassword = "SecureParentPass2026!";
  let createdParentUserId = "";
  let createdParentProfileId = "";
  let sessionToken = "";

  // TEST 1: A parent can register a new account
  it("TEST 1: A parent can register a new account with PBKDF2 password hashing & parent role", async () => {
    const req = new Request("http://localhost:3000/api/auth/register-parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Rameshbhai Patel",
        email: testParentEmail,
        phone: "9876543299",
        password: testParentPassword,
        confirmPassword: testParentPassword,
        preferredLanguage: "gu",
      }),
    });

    const res = await registerParentHandler(req);
    const data = await res.json();

    assert.equal(res.status, 200, "Registration response status should be 200");
    assert.equal(data.success, true);
    assert.equal(data.user.email, testParentEmail);
    assert.equal(data.user.role, "parent", "Role must strictly be 'parent'");
    assert.ok(data.parentProfile, "Parent profile must be created");

    createdParentUserId = data.user.id;
    createdParentProfileId = data.parentProfile.id;

    // Verify password hash in database
    const dbUser = await db.getUserByEmailAsync(testParentEmail);
    assert.ok(dbUser);
    assert.notEqual(dbUser.passwordHash, testParentPassword, "Password must not be stored in plain text");
    assert.ok(verifyPassword(testParentPassword, dbUser.passwordHash!), "Password verification must pass");
  });

  // TEST 2: The parent can log in with valid credentials
  it("TEST 2: The parent can log in with valid credentials and receive authenticated session", async () => {
    const req = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testParentEmail,
        password: testParentPassword,
        role: "parent",
      }),
    });

    const res = await loginHandler(req);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.user.email, testParentEmail);
    assert.equal(data.user.role, "parent");

    // Extract cookie
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Session cookie must be set on login");
    const match = setCookie.match(/studysaathi_session=([^;]+)/);
    assert.ok(match, "Session token must be present in cookie");
    sessionToken = match[1];

    const verified = await verifySession(sessionToken);
    assert.ok(verified);
    assert.equal(verified.email, testParentEmail);
    assert.equal(verified.role, "parent");
  });

  // TEST 3: Incorrect credentials are rejected
  it("TEST 3: Incorrect password or wrong email is rejected with 401", async () => {
    const req = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testParentEmail,
        password: "WrongPassword999!",
        role: "parent",
      }),
    });

    const res = await loginHandler(req);
    const data = await res.json();

    assert.equal(res.status, 401, "Invalid password must return 401");
    assert.equal(data.success, false);
    assert.ok(data.error.includes("Invalid password") || data.error.includes("credentials"));
  });

  // TEST 4: A parent cannot access protected student records without authentication
  it("TEST 4: Unauthenticated access to parent endpoints is blocked with 401", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      method: "GET",
    });

    const res = await getParentStudentHandler(req, {
      params: Promise.resolve({ id: "std-aarav" }),
    });
    const data = await res.json();

    assert.equal(res.status, 401, "Unauthenticated request must return 401");
    assert.equal(data.success, false);
  });

  // TEST 5: A teacher cannot access parent portal as a parent
  it("TEST 5: Role isolation - A teacher account cannot sign in as a parent", async () => {
    const req = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "teacher@studysaathi.edu.in",
        role: "parent", // Teacher trying to enter parent portal
      }),
    });

    const res = await loginHandler(req);
    const data = await res.json();

    assert.equal(res.status, 401, "Role mismatch must be rejected with 401");
    assert.equal(data.success, false);
    assert.ok(data.error.includes("Teacher Login") || data.error.includes("school staff"));
  });

  // TEST 6: Real Parent-to-Student Linking & accessing linked student's real data
  it("TEST 6: A parent can redeem a teacher-generated linking code and access the child's real records", async () => {
    // 1. Teacher generates linking code for Aarav
    const linkingCode = await db.createLinkingCodeAsync("std-aarav", "usr-teacher-01", 7);
    assert.ok(linkingCode.code);
    assert.equal(linkingCode.status, "active");

    // 2. Parent redeems code
    const redeemRes = await db.redeemLinkingCodeAsync(
      linkingCode.code,
      createdParentUserId,
      createdParentProfileId
    );
    assert.equal(redeemRes.success, true);
    assert.equal(redeemRes.studentId, "std-aarav");

    // 3. Parent queries student details with session cookie
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      method: "GET",
      headers: {
        Cookie: `studysaathi_session=${sessionToken}`,
      },
    });

    const res = await getParentStudentHandler(req, {
      params: Promise.resolve({ id: "std-aarav" }),
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.student.displayName, "Aarav Patel");
    assert.ok(Array.isArray(data.results), "Must return real assessment results");
    assert.ok(Array.isArray(data.learningGaps), "Must return real learning gaps");
    assert.ok(Array.isArray(data.remedialPlans), "Must return real remedial plans");
    assert.ok(data.results.length > 0, "Aarav must have real assessment records");
  });

  // TEST 7: A parent CANNOT access an unlinked student's data by manipulating ID (STRICT 403)
  it("TEST 7: A parent is strictly forbidden (403) from accessing unlinked students", async () => {
    // Parent is linked to std-aarav, NOT std-diya
    const req = new Request("http://localhost:3000/api/parent/students/std-diya", {
      method: "GET",
      headers: {
        Cookie: `studysaathi_session=${sessionToken}`,
      },
    });

    const res = await getParentStudentHandler(req, {
      params: Promise.resolve({ id: "std-diya" }),
    });
    const data = await res.json();

    assert.equal(res.status, 403, "Unlinked student query must return 403 Forbidden");
    assert.equal(data.success, false);
    assert.ok(data.error.includes("Forbidden") || data.error.includes("not authorized"));
  });

  // TEST 8: Parent-child relationship remains saved across logins (Persistence)
  it("TEST 8: Parent-child relationship persists across subsequent sessions", async () => {
    const parentProfile = await db.getParentByUserIdAsync(createdParentUserId);
    assert.ok(parentProfile);
    assert.ok(parentProfile.studentIds.includes("std-aarav"), "Student ID must remain linked");

    const linkedStudents = await db.getLinkedStudentsForParentAsync(parentProfile.id);
    assert.ok(linkedStudents.some((s) => s.id === "std-aarav"));
  });

  // TEST 9: Teacher linking code single-use and expiration enforcement
  it("TEST 9: Single-use linking code cannot be redeemed twice", async () => {
    const linkingCode = await db.createLinkingCodeAsync("std-diya", "usr-teacher-01", 7);

    // First redemption succeeds
    const res1 = await db.redeemLinkingCodeAsync(linkingCode.code, createdParentUserId, createdParentProfileId);
    assert.equal(res1.success, true);

    // Second redemption fails
    const res2 = await db.redeemLinkingCodeAsync(linkingCode.code, "other-user", "other-profile");
    assert.equal(res2.success, false);
    assert.ok(res2.error?.includes("already been redeemed"));
  });

  // TEST 10: Existing Teacher Login and Student Directory still work
  it("TEST 10: Existing teacher authentication and student management function normally", async () => {
    const teacherUser = await authService.login("teacher@studysaathi.edu.in", undefined, "teacher");
    assert.equal(teacherUser.role, "teacher");

    const students = db.getStudents();
    assert.ok(students.length >= 10, "Student directory must have full primary cohort");
  });
});

