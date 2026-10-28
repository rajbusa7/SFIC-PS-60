import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { GET as getFeedbackHandler, POST as postFeedbackHandler } from "../src/app/api/feedback/route";
import { GET as getResultsHandler } from "../src/app/api/assessments/results/route";
import { PUT as putPlanHandler } from "../src/app/api/remedial-plans/route";
import { POST as postStudentHandler, GET as getStudentsHandler } from "../src/app/api/students/route";
import { GET as getStudentByIdHandler, PUT as putStudentHandler, DELETE as deleteStudentHandler } from "../src/app/api/students/[id]/route";
import { db } from "../src/lib/db/database";

function createMockRequest(url: string, method: string, body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Dynamic Database-Driven System Verification Suite", () => {
  after(() => {
    db.resetToDemoData();
  });

  it("1. POST /api/feedback validates email and persists real feedback in database", async () => {
    // Rejects invalid email
    const badReq = createMockRequest("http://localhost:3000/api/feedback", "POST", {
      email: "not-an-email",
    });
    const badRes = await postFeedbackHandler(badReq);
    assert.equal(badRes.status, 400);

    // Accepts valid email
    const goodReq = createMockRequest("http://localhost:3000/api/feedback", "POST", {
      email: "teacher.gandhinagar@gujarat.edu.in",
      message: "The 5-step concrete manipulatives have shown immediate results in Class 4.",
    });
    const goodRes = await postFeedbackHandler(goodReq);
    assert.equal(goodRes.status, 200);
    const data = await goodRes.json();
    assert.equal(data.success, true);
    assert.ok(data.data.id);
    assert.equal(data.data.email, "teacher.gandhinagar@gujarat.edu.in");

    // Confirms persistence in database via GET
    const getRes = await getFeedbackHandler();
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(getData.data.some((f: any) => f.email === "teacher.gandhinagar@gujarat.edu.in"));
  });

  it("2. GET /api/assessments/results retrieves real database results with student filtering", async () => {
    const req = createMockRequest("http://localhost:3000/api/assessments/results?studentId=std-aarav", "GET");
    const res = await getResultsHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.results));
    assert.ok(data.results.length > 0);
    assert.ok(data.results.every((r: any) => r.studentId === "std-aarav"));
  });

  it("3. PUT /api/remedial-plans persists completedSteps array and updates plan status", async () => {
    const plans = db.getRemedialPlans();
    assert.ok(plans.length > 0);
    const targetPlan = plans[0];

    // Toggle steps 1, 2, 3
    const updateReq = createMockRequest("http://localhost:3000/api/remedial-plans", "PUT", {
      id: targetPlan.id,
      completedSteps: [1, 2, 3],
      status: "In Progress",
    });
    const updateRes = await putPlanHandler(updateReq);
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.deepEqual(updateData.plan.completedSteps, [1, 2, 3]);

    // Verify persistence in database
    const fetched = db.getRemedialPlanById(targetPlan.id);
    assert.ok(fetched);
    assert.deepEqual(fetched?.completedSteps, [1, 2, 3]);
  });

  it("4. Full Student CRUD flow (Create, Read, Update, Delete) persists to database", async () => {
    const testCode = `MPS-TEST-${Date.now().toString().slice(-4)}`;

    // Create
    const createReq = createMockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: testCode,
      displayName: "Ananya Trivedi",
      classroomId: "cls-4a",
      grade: 4,
      section: "A",
      notes: "Transferred from Ahmedabad primary school.",
    });
    const createRes = await postStudentHandler(createReq);
    assert.ok(createRes.status === 200 || createRes.status === 201, `Expected 200 or 201, got ${createRes.status}`);
    const createData = await createRes.json();
    assert.equal(createData.success, true);
    const newId = createData.student.id;
    assert.ok(newId);

    // Read
    const getReq = createMockRequest(`http://localhost:3000/api/students/${newId}`, "GET");
    const getRes = await getStudentByIdHandler(getReq, { params: Promise.resolve({ id: newId }) });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.student.displayName, "Ananya Trivedi");

    // Update
    const putReq = createMockRequest(`http://localhost:3000/api/students/${newId}`, "PUT", {
      notes: "Updated enrollment verified by principal.",
    });
    const putRes = await putStudentHandler(putReq, { params: Promise.resolve({ id: newId }) });
    assert.equal(putRes.status, 200);
    const putData = await putRes.json();
    assert.equal(putData.student.notes, "Updated enrollment verified by principal.");

    // Delete
    const delReq = createMockRequest(`http://localhost:3000/api/students/${newId}`, "DELETE");
    const delRes = await deleteStudentHandler(delReq, { params: Promise.resolve({ id: newId }) });
    assert.equal(delRes.status, 200);
    const delData = await delRes.json();
    assert.equal(delData.success, true);

    // Confirm removal
    const verifyReq = createMockRequest(`http://localhost:3000/api/students/${newId}`, "GET");
    const verifyRes = await getStudentByIdHandler(verifyReq, { params: Promise.resolve({ id: newId }) });
    assert.equal(verifyRes.status, 404);
  });
});
