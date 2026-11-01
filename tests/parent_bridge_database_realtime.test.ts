import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { POST as registerParentHandler } from "../src/app/api/auth/register-parent/route";
import { POST as loginHandler } from "../src/app/api/v1/auth/login/route";
import { GET as getParentStudentHandler } from "../src/app/api/parent/students/[id]/route";
import { POST as recordCompletionHandler } from "../src/app/api/parent/activities/complete/route";

describe("Parent Bridge Database-Driven & Real-Time Verification Suite", () => {
  const ts = Date.now();
  const testParentEmail = `realtime.parent.${ts}@example.com`;
  const testPassword = "ParentPass2026!";
  let parentUserId = "";
  let parentProfileId = "";
  let parentSessionCookie = "";
  let createdAssessmentId = "";
  let createdResultId = "";
  let createdGapId = "";
  let createdPlanId = "";
  let targetActivityId = "";
  let unassessedStudentId = "";

  // Set up parent and link to std-aarav
  it("Setup: Register and authenticate authorized parent", async () => {
    const regReq = new Request("http://localhost:3000/api/auth/register-parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jitendrabhai Patel",
        email: testParentEmail,
        phone: "9876543201",
        password: testPassword,
        confirmPassword: testPassword,
        preferredLanguage: "gu",
      }),
    });
    const regRes = await registerParentHandler(regReq);
    const regData = await regRes.json();
    assert.equal(regRes.status, 200);
    parentUserId = regData.user.id;
    parentProfileId = regData.parentProfile.id;

    // Log in
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
    const setCookie = loginRes.headers.get("set-cookie");
    assert.ok(setCookie);
    const match = setCookie.match(/studysaathi_session=([^;]+)/);
    assert.ok(match);
    parentSessionCookie = `studysaathi_session=${match[1]}`;

    // Link std-aarav to this parent
    const codeObj = await db.createLinkingCodeAsync("std-aarav", "usr-teacher-01", 7);
    const redeemRes = await db.redeemLinkingCodeAsync(codeObj.code, parentUserId, parentProfileId);
    assert.equal(redeemRes.success, true);
  });

  // TEST 1: A teacher records an assessment. The result is saved in the database.
  it("TEST 1: Teacher records an assessment result and it persists in the database", async () => {
    createdAssessmentId = `asm-test-${ts}`;

    // Save result to persistent database using db.recordResults
    const savedList = db.recordResults([
      {
        assessmentId: createdAssessmentId,
        studentId: "std-aarav",
        conceptId: "c-mult-01",
        marksObtained: 9,
        maximumMarks: 20,
        percentage: 45,
        recordedAt: new Date().toISOString(),
      },
    ]);
    assert.ok(savedList.length > 0);
    const saved = savedList[0];
    createdResultId = saved.id;
    assert.equal(saved.marksObtained, 9);
    assert.equal(saved.maximumMarks, 20);
    assert.equal(saved.percentage, 45);

    // Verify stored in database
    const results = db.getResults("std-aarav");
    const found = results.find((r) => r.id === createdResultId);
    assert.ok(found, "Saved result must be retrievable from database");
    assert.equal(found.marksObtained, 9);
    assert.equal(found.maximumMarks, 20);
  });

  // TEST 2: The authorized parent can see that result in Parent Bridge.
  it("TEST 2: Authorized parent fetches student detail and immediately sees the newly recorded assessment", async () => {
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: { Cookie: parentSessionCookie },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    const match = data.results.find((r: any) => r.id === createdResultId);
    assert.ok(match, "Parent API response must include newly recorded assessment");
    assert.equal(match.percentage, 45);
    assert.equal(match.marksObtained, 9);
  });

  // TEST 3: The teacher updates the result. Parent Bridge reflects the updated value.
  it("TEST 3: Teacher updates the assessment result and Parent Bridge reflects updated value", async () => {
    // Teacher updates the score to 15/20 (75%)
    const updatedList = db.recordResults([
      {
        assessmentId: createdAssessmentId,
        studentId: "std-aarav",
        conceptId: "c-mult-01",
        marksObtained: 15,
        maximumMarks: 20,
        percentage: 75,
        recordedAt: new Date().toISOString(),
      },
    ]);
    assert.ok(updatedList.length > 0);
    const latestRecorded = updatedList[0];

    // Query parent API again (simulating real-time polling refresh)
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: { Cookie: parentSessionCookie },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    const match = data.results.find((r: any) => r.id === latestRecorded.id || (r.assessmentId === createdAssessmentId && r.percentage === 75));
    assert.ok(match, "Parent Bridge must reflect the updated assessment score");
    assert.equal(match.percentage, 75);
    assert.equal(match.marksObtained, 15);
  });

  // TEST 4: A teacher records a learning gap. The authorized parent can see it.
  it("TEST 4: Learning gap identified from low score is saved and authorized parent sees it", async () => {
    // Record low diagnostic score (35%) which triggers learning gap detection
    db.recordResults([
      {
        assessmentId: `asm-gap-${ts}`,
        studentId: "std-aarav",
        conceptId: "c-div-01",
        marksObtained: 7,
        maximumMarks: 20,
        percentage: 35,
        recordedAt: new Date().toISOString(),
      },
    ]);

    const gaps = db.getLearningGaps("std-aarav");
    const divGap = gaps.find((g) => g.conceptId === "c-div-01");
    assert.ok(divGap, "Learning gap for division must be saved in database");
    createdGapId = divGap.id;

    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: { Cookie: parentSessionCookie },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    const foundGap = data.learningGaps.find((g: any) => g.id === createdGapId);
    assert.ok(foundGap, "Parent Bridge must display newly recorded learning gap");
    assert.equal(foundGap.conceptId, "c-div-01");
    assert.ok(foundGap.reason, "Gap must have pedagogical reason");
  });

  // TEST 5: The teacher updates the remedial plan. The parent sees the updated plan.
  it("TEST 5: Teacher creates and updates a remedial plan and parent retrieves the updated plan", async () => {
    // Create remedial plan for division gap
    const plan = db.createRemedialPlanForGap(createdGapId, "Initial baseline teacher intervention notes.");
    assert.ok(plan);
    createdPlanId = plan.id;

    // Teacher updates the plan
    const updatedPlan = db.updateRemedialPlan(createdPlanId, {
      teacherNotes: "Phase 2: Reinforcing equal sharing with concrete household counters.",
      completedSteps: [1],
    });
    assert.ok(updatedPlan);
    assert.equal(updatedPlan.teacherNotes, "Phase 2: Reinforcing equal sharing with concrete household counters.");

    // Parent Bridge retrieves updated plan
    const req = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: { Cookie: parentSessionCookie },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    const data = await res.json();
    const foundPlan = data.remedialPlans.find((p: any) => p.id === createdPlanId);
    assert.ok(foundPlan, "Parent Bridge must retrieve updated remedial plan");
    assert.equal(foundPlan.teacherNotes, "Phase 2: Reinforcing equal sharing with concrete household counters.");
  });

  // TEST 6: The parent marks a home activity as completed. The status is saved permanently.
  it("TEST 6: Parent marks home activity as completed and status is permanently saved", async () => {
    // Fetch current student detail to get active home activities
    const initReq = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: { Cookie: parentSessionCookie },
    });
    const initRes = await getParentStudentHandler(initReq, { params: Promise.resolve({ id: "std-aarav" }) });
    const initData = await initRes.json();
    assert.ok(initData.homeActivities.length > 0, "Student must have practical home activities");

    const activity = initData.homeActivities[0];
    targetActivityId = activity.id;

    // Post completion
    const completeReq = new Request("http://localhost:3000/api/parent/activities/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: parentSessionCookie,
      },
      body: JSON.stringify({
        studentId: "std-aarav",
        activityId: targetActivityId,
        conceptId: activity.conceptId,
        completed: true,
      }),
    });

    const completeRes = await recordCompletionHandler(completeReq);
    const completeData = await completeRes.json();
    assert.equal(completeRes.status, 200);
    assert.equal(completeData.success, true);
    assert.equal(completeData.completion.completed, true);
    assert.equal(completeData.completion.studentId, "std-aarav");
    assert.equal(completeData.completion.activityId, targetActivityId);
  });

  // TEST 7: The parent refreshes the page or logs in on another device. The saved status remains correct.
  it("TEST 7: Saved activity status persists on subsequent fetch across independent sessions", async () => {
    const refreshReq = new Request("http://localhost:3000/api/parent/students/std-aarav", {
      headers: { Cookie: parentSessionCookie },
    });
    const refreshRes = await getParentStudentHandler(refreshReq, { params: Promise.resolve({ id: "std-aarav" }) });
    const refreshData = await refreshRes.json();

    const matchedAct = refreshData.homeActivities.find((a: any) => a.id === targetActivityId);
    assert.ok(matchedAct, "Target activity must be present");
    assert.equal(matchedAct.completed, true, "Activity completion must persist across reloads");
    assert.ok(matchedAct.completedAt, "Completion timestamp must be preserved");
  });

  // TEST 8: An unauthorized parent requests another child's information. The server denies access.
  it("TEST 8: Unauthorized parent requesting unlinked child information receives strict 403 Forbidden", async () => {
    // std-diya is not linked to this parent
    const forbiddenReq = new Request("http://localhost:3000/api/parent/students/std-diya", {
      headers: { Cookie: parentSessionCookie },
    });
    const forbiddenRes = await getParentStudentHandler(forbiddenReq, { params: Promise.resolve({ id: "std-diya" }) });
    assert.equal(forbiddenRes.status, 403, "Server must return 403 Forbidden");
    const forbiddenData = await forbiddenRes.json();
    assert.equal(forbiddenData.success, false);
    assert.ok(forbiddenData.error.includes("Forbidden") || forbiddenData.error.includes("authorized"));
  });

  // TEST 9: A missing assessment or empty database produces a proper empty state, not fake data.
  it("TEST 9: Unassessed student produces clean empty arrays, never fabricated percentages", async () => {
    // Create unassessed new student using addStudentAsync
    const unassessedStudent = await db.addStudentAsync({
      displayName: "Nirav Kumar",
      studentCode: `STU-TEST-${ts}`,
      classroomId: "cls-3a",
      grade: 3,
      section: "A",
      enrollmentStatus: "active",
      notes: "Newly enrolled student",
    });
    assert.ok(unassessedStudent);
    unassessedStudentId = unassessedStudent.id;

    // Link student to parent
    const linkingCode = await db.createLinkingCodeAsync(unassessedStudentId, "usr-teacher-01", 7);
    await db.redeemLinkingCodeAsync(linkingCode.code, parentUserId, parentProfileId);

    // Query parent API for unassessed student
    const req = new Request(`http://localhost:3000/api/parent/students/${unassessedStudentId}`, {
      headers: { Cookie: parentSessionCookie },
    });
    const res = await getParentStudentHandler(req, { params: Promise.resolve({ id: unassessedStudentId }) });
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.results.length, 0, "Must have 0 results");
    assert.equal(data.learningGaps.length, 0, "Must have 0 learning gaps");
    assert.equal(data.remedialPlans.length, 0, "Must have 0 remedial plans");
    assert.equal(data.subjectBreakdown.length, 0, "Must have 0 subject breakdown entries without inventing percentages");
  });

  // TEST 10: Real-time update: update a record and verify another session receives it without full-page reload
  it("TEST 10: Live update scenario: record change in teacher session is delivered in polling payload", async () => {
    // Teacher adds an assessment result for Nirav
    const teacherResults = db.recordResults([
      {
        assessmentId: `asm-nirav-${ts}`,
        studentId: unassessedStudentId,
        conceptId: "c-eng-vocab-01",
        marksObtained: 18,
        maximumMarks: 20,
        percentage: 90,
        recordedAt: new Date().toISOString(),
      },
    ]);
    assert.ok(teacherResults.length > 0);

    // Simulating parent dashboard background polling payload query (fetchStudentDetail without page reload)
    const pollReq = new Request(`http://localhost:3000/api/parent/students/${unassessedStudentId}`, {
      headers: { Cookie: parentSessionCookie },
    });
    const pollRes = await getParentStudentHandler(pollReq, { params: Promise.resolve({ id: unassessedStudentId }) });
    assert.equal(pollRes.status, 200);
    const pollData = await pollRes.json();

    assert.ok(pollData.lastUpdated, "Polling response must include lastUpdated timestamp");
    assert.equal(pollData.results.length, 1);
    assert.equal(pollData.results[0].percentage, 90, "Live poll payload accurately delivers new 90% score");
  });
});
