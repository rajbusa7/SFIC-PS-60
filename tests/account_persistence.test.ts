import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signSession, verifySession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { POST as loginHandler } from "../src/app/api/v1/auth/login/route";
import { GET as meHandler } from "../src/app/api/auth/me/route";
import { POST as logoutHandler } from "../src/app/api/auth/logout/route";
import { GET as adminUsersGetHandler, POST as adminUsersPostHandler } from "../src/app/api/admin/users/route";
import { PATCH as adminUserPatchHandler, DELETE as adminUserDeleteHandler } from "../src/app/api/admin/users/[id]/route";

describe("StudySaathi AI - Permanent Account Registration & Persistence Suite", () => {
  const testTimestamp = Date.now();
  const testEmail = `teacher.test.${testTimestamp}@mehsana-model.edu.in`;
  const testPassword = "SecureTeacherPass2026!";
  const testName = "Dharmesh S. Mehta";
  const testSchoolId = "sch-gn-01";

  let createdUserId = "";
  let teacherSessionCookie = "";
  let adminSessionCookie = "";

  before(async () => {
    // Generate an admin session cookie for testing RBAC
    const adminUser = await db.getUserByEmailAsync("principal@studysaathi.edu.in");
    assert.ok(adminUser, "Admin user must exist in seed/database");
    const adminToken = await signSession({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: "admin",
      schoolId: adminUser.schoolId,
      provider: "local",
    });
    adminSessionCookie = `${SESSION_COOKIE_NAME}=${adminToken}`;
  });

  after(async () => {
    // Clean up test teacher account
    if (createdUserId) {
      await db.deleteUserAsync(createdUserId);
    }
  });

  it("1. Password Security: hashes and verifies with PBKDF2-SHA256 and salt", () => {
    const rawPass = "TeacherSecret123!";
    const hash = hashPassword(rawPass);
    assert.ok(hash.includes(":"), "Hash must contain salt delimiter");
    assert.notEqual(hash, rawPass, "Hash must never equal raw password");
    assert.equal(verifyPassword(rawPass, hash), true, "Correct password must verify");
    assert.equal(verifyPassword("WrongPassword!", hash), false, "Wrong password must be rejected");
  });

  it("2. Register New Account: validates, hashes password, and stores in persistent database", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        schoolId: testSchoolId,
      }),
    });

    const res = await registerHandler(req);
    assert.ok([200, 201].includes(res.status), "Registration must respond with 200 OK or 201 Created");

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.user.id, "Registered user must receive a unique stable ID");
    assert.equal(data.user.email, testEmail.toLowerCase());
    assert.equal(data.user.name, testName);
    assert.equal(data.user.role, "teacher");
    assert.equal(data.user.schoolId, testSchoolId);
    assert.equal(data.user.passwordHash, undefined, "Password hash must NOT be leaked in response");

    createdUserId = data.user.id;

    // Check Set-Cookie header
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Session cookie must be set on registration");
    assert.ok(setCookie.includes(SESSION_COOKIE_NAME), "Session cookie name must match");

    const match = setCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    assert.ok(match, "Token must be extracted from cookie");
    teacherSessionCookie = `${SESSION_COOKIE_NAME}=${match[1]}`;

    // Verify user directly in persistent database
    const dbRecord = await db.getUserByEmailAsync(testEmail);
    assert.ok(dbRecord, "User record must exist in persistent database");
    assert.equal(dbRecord.id, createdUserId);
    assert.equal(dbRecord.status, "active");
    assert.ok(dbRecord.passwordHash, "Database must store hashed password");
    assert.notEqual(dbRecord.passwordHash, testPassword, "Stored password must not be plaintext");
    assert.equal(verifyPassword(testPassword, dbRecord.passwordHash), true, "Stored hash must match password");
  });

  it("3. Authenticated Profile Retrieval (/api/auth/me): retrieves saved record from database", async () => {
    const req = new Request("http://localhost:3000/api/auth/me", {
      headers: { Cookie: teacherSessionCookie },
    });

    const res = await meHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.authenticated, true);
    assert.equal(data.user.id, createdUserId);
    assert.equal(data.user.email, testEmail.toLowerCase());
    assert.equal(data.user.name, testName);
    assert.equal(data.user.role, "teacher");
    assert.equal(data.user.passwordHash, undefined, "Password hash must not be exposed");
  });

  it("4. Logout (/api/auth/logout): invalidates session cookie", async () => {
    const res = await logoutHandler();
    assert.equal(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie?.includes("Max-Age=0") || setCookie?.includes("Expires="), "Cookie must be cleared");
  });

  it("5. Log In Again (/api/v1/auth/login): verifies credentials and retrieves same user ID from database", async () => {
    // 5a. Bad password rejected
    const badReq = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "IncorrectPassword123" }),
    });
    const badRes = await loginHandler(badReq);
    assert.equal(badRes.status, 401, "Bad password must be rejected with 401 Unauthorized");

    // 5b. Correct password succeeds and retrieves identical user
    const goodReq = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const goodRes = await loginHandler(goodReq);
    assert.equal(goodRes.status, 200, "Valid login must return 200 OK");
    const data = await goodRes.json();
    assert.equal(data.success, true);
    assert.equal(data.user.id, createdUserId, "Logged in user ID must match registered ID exactly");
    assert.equal(data.user.email, testEmail.toLowerCase());
    assert.equal(data.user.role, "teacher");
    assert.equal(data.user.schoolId, testSchoolId);
  });

  it("6. Duplicate Registration Protection: rejects already registered email with 409 Conflict", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Attempt",
        email: testEmail,
        password: "AnotherPassword123",
      }),
    });

    const res = await registerHandler(req);
    assert.equal(res.status, 409, "Duplicate registration must return 409 Conflict");
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes("already exists"));
  });

  it("7. RBAC on Admin User List (/api/admin/users): blocks unauthorized and teacher access", async () => {
    // 7a. Unauthenticated request -> 401
    const unauthReq = new Request("http://localhost:3000/api/admin/users");
    const unauthRes = await adminUsersGetHandler(unauthReq);
    assert.equal(unauthRes.status, 401, "Unauthenticated request must return 401");

    // 7b. Teacher request -> 403 Forbidden
    const teacherReq = new Request("http://localhost:3000/api/admin/users", {
      headers: { Cookie: teacherSessionCookie },
    });
    const teacherRes = await adminUsersGetHandler(teacherReq);
    assert.equal(teacherRes.status, 403, "Teacher accessing admin user list must return 403 Forbidden");

    // 7c. Admin request -> 200 OK with full user list
    const adminReq = new Request("http://localhost:3000/api/admin/users", {
      headers: { Cookie: adminSessionCookie },
    });
    const adminRes = await adminUsersGetHandler(adminReq);
    assert.equal(adminRes.status, 200, "Admin request must succeed with 200 OK");
    const data = await adminRes.json();
    assert.equal(data.success, true);
    assert.ok(data.users.length >= 2, "Must return users from database");

    // Ensure our registered teacher is in the admin user list
    const foundTeacher = data.users.find((u: any) => u.id === createdUserId);
    assert.ok(foundTeacher, "Registered teacher must appear in admin user list");
    assert.equal(foundTeacher.passwordHash, undefined, "No password hash must ever be exposed");
  });

  it("8. Account Modification & Deletion: admin can update and delete user", async () => {
    // 8a. Update school
    const patchReq = new Request(`http://localhost:3000/api/admin/users/${createdUserId}`, {
      method: "PATCH",
      headers: {
        Cookie: adminSessionCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Dharmesh S. Mehta (Updated)" }),
    });
    const patchContext = { params: Promise.resolve({ id: createdUserId }) };
    const patchRes = await adminUserPatchHandler(patchReq, patchContext);
    assert.equal(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.equal(patchData.user.name, "Dharmesh S. Mehta (Updated)");

    // 8b. Verify update in database
    const updatedRecord = await db.getUserByIdAsync(createdUserId);
    assert.equal(updatedRecord?.name, "Dharmesh S. Mehta (Updated)");

    // 8c. Delete user
    const delReq = new Request(`http://localhost:3000/api/admin/users/${createdUserId}`, {
      method: "DELETE",
      headers: { Cookie: adminSessionCookie },
    });
    const delContext = { params: Promise.resolve({ id: createdUserId }) };
    const delRes = await adminUserDeleteHandler(delReq, delContext);
    assert.equal(delRes.status, 200);

    // 8d. Verify deleted in database
    const deletedRecord = await db.getUserByIdAsync(createdUserId);
    assert.equal(deletedRecord, null, "User must no longer exist after deletion");
    createdUserId = ""; // cleared so after hook won't double delete
  });
});
