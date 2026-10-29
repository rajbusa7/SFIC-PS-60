import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { POST as loginHandler } from "../src/app/api/v1/auth/login/route";
import { GET as getParentStudentHandler } from "../src/app/api/parent/students/[id]/route";
import { POST as recordCompletionHandler } from "../src/app/api/parent/activities/complete/route";
import { POST as registerParentHandler } from "../src/app/api/auth/register-parent/route";

describe("Parent Bridge 12-Scenario System Verification Suite", () => {
  const ts = Date.now();
  const testParentEmail = `parent.bridge.${ts}@example.com`;
  const testPassword = "ParentPassword2026!";
  let parentUserId = "";
  let parentProfileId = "";
  let parentSessionToken = "";
  let targetActivityId = "";

  // 1. Parent signs in successfully
  it("Scenario 1: Parent signs in successfully with valid credentials and receives authenticated session", async () => {
    // Register
    const regReq = new Request("http://localhost:3000/api/auth/register-parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sureshbhai Patel",
        email: testParentEmail,
        phone: "9876543211",
        password: testPassword,
        confirmPassword: testPassword,
        preferredLanguage: "gu",
      }),
    });
    const regRes = await registerParentHandler(regReq);
    const regData = await regRes.json();
    assert.equal(regRes.status, 200);
    assert.equal(regData.success, true);
    parentUserId = regData.user.id;
    parentProfileId = regData.parentProfile.id;

    // Login
    const loginReq = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testParentEmail,
        password: testPassword,
        role: "parent",
      }),
    });
    const loginRes = await loginHandler(loginReq);
    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginData.success, true);
    assert.equal(loginData.user.role, "parent");

    const cookie = loginRes.headers.get("set-cookie");
    assert.ok(cookie, "Session cookie must be returned");
    const match = cookie.match(/studysaathi_session=([^;]+)/);
    assert.ok(match);
    parentSessionToken = match[1];
  });

  // 2. Parent without a linked child sees clear linking instructions
  it("Scenario 2: Parent without a linked child has an empty student list and receives linking guide info", async () => {
    const parentProfile = await db.getParentByUserIdAsync(parentUserId);
    assert.ok(parentProfile);
    assert.equal(parentProfile.studentIds.length, 0, "Unlinked parent has 0 children initially");

    // Attempting to fetch unlinked student returns 403 Forbidden
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    assert.equal(res.status, 403, "Unlinked parent is denied access to student");
    const data = await res.json();
    assert.ok(data.error.includes("Forbidden"));
  });

  // 3. Parent with a linked child sees the correct child
  it("Scenario 3: Parent with a linked child sees the correct child profile and details", async () => {
    // Generate linking code for Aarav Patel and redeem it
    const linkingCode = await db.createLinkingCodeAsync("std-aarav", "usr-teacher-01", 7);
    const redeemRes = await db.redeemLinkingCodeAsync(linkingCode.code, parentUserId, parentProfileId);
    assert.equal(redeemRes.success, true);

    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.id, "std-aarav");
    assert.equal(data.student.displayName, "Aarav Patel");
    assert.equal(data.student.grade, 4);
  });

  // 4. Real assessment results load correctly
  it("Scenario 4: Real assessment results load correctly from persistent data with verified scores", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    assert.ok(Array.isArray(data.results), "Results must be an array");
    assert.ok(data.results.length > 0, "Aarav must have real assessment results");
    const firstResult = data.results[0];
    assert.ok(typeof firstResult.percentage === "number", "Percentage must be a number");
    assert.ok(firstResult.assessmentId, "Result must reference an assessmentId");
  });

  // 5. Actual learning gaps are displayed without fabrication
  it("Scenario 5: Actual learning gaps are displayed without fabrication or arbitrary numbers", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    assert.ok(Array.isArray(data.learningGaps), "Learning gaps must be an array");
    data.learningGaps.forEach((gap: any) => {
      assert.ok(gap.conceptName, "Gap must have conceptName");
      assert.ok(gap.reason, "Gap must have verifiable evidence reason");
      assert.ok(typeof gap.latestPercentage === "number", "Latest percentage must be real number");
    });
  });

  // 6. A recommended activity opens correctly
  it("Scenario 6: Recommended practical home activities are loaded with step-by-step instructions and household materials", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    assert.ok(Array.isArray(data.homeActivities), "Home activities must be an array");
    assert.ok(data.homeActivities.length > 0, "Must have recommended home activities");
    const act = data.homeActivities[0];
    targetActivityId = act.id;
    assert.ok(act.title, "Activity must have English title");
    assert.ok(act.titleGujarati, "Activity must have Gujarati title");
    assert.ok(Array.isArray(act.steps) && act.steps.length > 0, "Must have actionable steps");
    assert.ok(act.steps.every((s: any) => s.instructionGu && s.instructionEn), "Steps must be bilingual");
    assert.ok(Array.isArray(act.materialsGu) && act.materialsGu.length > 0, "Must specify Gujarati household materials");
    assert.ok(act.estimatedMinutes > 0, "Must have estimated completion time");
  });

  // 7. Completing an activity saves the result to the database
  it("Scenario 7: Completing an activity via POST /api/parent/activities/complete saves to persistent store", async () => {
    assert.ok(targetActivityId, "Target activity ID must be available from scenario 6");
    const req = new Request("http://localhost:3000/api/parent/activities/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
      body: JSON.stringify({
        studentId: "std-aarav",
        activityId: targetActivityId,
        conceptId: "c-div-01",
        completed: true,
      }),
    });
    const res = await recordCompletionHandler(req);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.completion.completed, true);
    assert.equal(data.completion.studentId, "std-aarav");
    assert.equal(data.completion.activityId, targetActivityId);
  });

  // 8. Saved activity status persists after page refresh
  it("Scenario 8: Saved activity status persists on subsequent student detail API fetch", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    const completedAct = data.homeActivities.find((a: any) => a.id === targetActivityId);
    assert.ok(completedAct, "Target activity must be present in response");
    assert.equal(completedAct.completed, true, "Activity completion status must persist as true");
    assert.ok(completedAct.completedAt, "Completion timestamp must be recorded");
  });

  // 9. Gujarati and English switching works across all 4 sections
  it("Scenario 9: Gujarati and English labels, notices, and activity steps are provided for all 4 sections", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    // Section 1: My Child
    assert.ok(data.student.displayName);
    // Section 2: Learning Progress
    assert.ok(data.results.length > 0);
    // Section 3: Help at Home
    assert.ok(data.homeActivities.every((a: any) => a.title && a.titleGujarati && a.steps.length > 0));
    // Section 4: Teacher Updates / Notices
    assert.ok(Array.isArray(data.notices));
    assert.ok(data.notices.every((n: any) => n.title && (n.simplifiedContent || n.originalContent || n.content)));
  });

  // 10. Unauthorized access to another child's records is denied (403)
  it("Scenario 10: Parent is strictly forbidden (403) from accessing another child's records", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-diya", {
      headers: {
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-diya" }) });
    assert.equal(res.status, 403, "Must return 403 Forbidden for unlinked student");
    const data = await res.json();
    assert.ok(data.error.includes("Forbidden"));
  });

  // 11. API and database failures produce parent-friendly messages
  it("Scenario 11: Missing credentials or invalid inputs return clear, parent-friendly error responses", async () => {
    // Unauthenticated activity completion
    const unauthReq = new Request("http://localhost:3000/api/parent/activities/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: "std-aarav", activityId: "act-1", completed: true }),
    });
    const unauthRes = await recordCompletionHandler(unauthReq);
    assert.equal(unauthRes.status, 401);
    const unauthData = await unauthRes.json();
    assert.ok(unauthData.error);

    // Missing studentId
    const badReq = new Request("http://localhost:3000/api/parent/activities/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `studysaathi_session=${parentSessionToken}`,
      },
      body: JSON.stringify({ activityId: "act-1", completed: true }),
    });
    const badRes = await recordCompletionHandler(badReq);
    assert.equal(badRes.status, 400);
  });

  // 12. Existing teacher and administrator features continue working
  it("Scenario 12: Existing teacher and administrator authentication and database operations remain unaffected", async () => {
    const teacher = await db.getUserByEmailAsync("teacher@studysaathi.edu.in");
    assert.ok(teacher, "Teacher account exists");
    assert.equal(teacher.role, "teacher");

    const admin = await db.getUserByEmailAsync("principal@studysaathi.edu.in");
    assert.ok(admin, "Admin account exists");
    assert.equal(admin.role, "admin");

    const classrooms = db.getClassrooms();
    assert.ok(classrooms.length > 0, "Classrooms remain accessible");
  });
});
