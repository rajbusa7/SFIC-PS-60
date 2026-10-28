import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { POST as postStudentHandler, GET as getStudentsHandler } from "../src/app/api/students/route";
import { GET as getStudentByIdHandler, PUT as putStudentHandler, DELETE as deleteStudentHandler } from "../src/app/api/students/[id]/route";
import { db } from "../src/lib/db/database";
import { isPostgresConfigured, getPostgresConnectionString } from "../src/lib/db/postgres";

function mockRequest(url: string, method = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Add Student Comprehensive End-to-End Workflow & Educational Verification Suite", () => {
  const testUniqueCode = `MPS-TEST-${Date.now().toString().slice(-5)}`;
  const testDisplayName = "Priyanshi Solanki (Fictional Test)";
  let createdStudentId = "";
  let baselineStudentCount = 0;

  before(async () => {
    baselineStudentCount = (await db.getStudentsAsync()).length;
    console.log(`[Test Suite] Initial database student count: ${baselineStudentCount}`);
  });

  after(async () => {
    // Clean up only the fictional test student created during this verification
    if (createdStudentId) {
      await db.deleteStudentAsync(createdStudentId);
      console.log(`[Test Suite] Cleaned up test student record ${createdStudentId}.`);
    }
    const finalCount = (await db.getStudentsAsync()).length;
    assert.equal(finalCount, baselineStudentCount, "Real student records must remain intact after cleanup.");
  });

  it("1. Database Configuration & School Association Check", () => {
    const school = db.getSchool();
    assert.ok(school, "School record must exist in database");
    assert.equal(school.name, "Model Primary School, Gandhinagar");
    assert.equal(school.code, "GUJ-GNR-042");

    const postgresActive = isPostgresConfigured();
    console.log(`[Test Engine] Storage Engine: ${postgresActive ? "PostgreSQL (Cloud Active)" : "Persistent JSON Store (data/shikshasetu_store.json)"}`);
  });

  it("2. Form Validation: Rejects missing student name with HTTP 400", async () => {
    const badReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: testUniqueCode,
      displayName: "", // missing
      grade: 3,
      section: "A",
    });
    const res = await postStudentHandler(badReq);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.toLowerCase().includes("name"));
  });

  it("3. Form Validation: Rejects missing student roll code with HTTP 400", async () => {
    const badReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: "", // missing
      displayName: testDisplayName,
      grade: 3,
      section: "A",
    });
    const res = await postStudentHandler(badReq);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.toLowerCase().includes("code") || data.error.toLowerCase().includes("roll"));
  });

  it("4. Form Validation: Rejects invalid grade level (e.g. Grade 9 in Primary School) with HTTP 400", async () => {
    const badReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: testUniqueCode,
      displayName: testDisplayName,
      grade: 9, // Primary school is strictly 1 to 5
      section: "A",
    });
    const res = await postStudentHandler(badReq);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.toLowerCase().includes("grade"));
  });

  it("5. CREATE & SAVE: Successfully adds a valid student and returns HTTP 201 Created", async () => {
    const createReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: testUniqueCode,
      displayName: testDisplayName,
      grade: 3,
      section: "B",
      notes: "Transferred from Mehsana Primary School. Enjoys mathematics and Gujarati storytelling.",
    });

    const res = await postStudentHandler(createReq);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.student?.id, "Database must generate unique student ID");
    assert.equal(data.student.displayName, testDisplayName);
    assert.equal(data.student.studentCode, testUniqueCode);
    assert.equal(data.student.grade, 3);
    assert.equal(data.student.section, "B");
    assert.equal(data.student.classroomId, "cls-3b");
    assert.equal(data.student.enrollmentStatus, "active");

    createdStudentId = data.student.id;
  });

  it("6. DUPLICATE CHECK: Rejects duplicate roll code within school with HTTP 409 Conflict", async () => {
    const duplicateReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: testUniqueCode, // exact duplicate code
      displayName: "Another Student",
      grade: 3,
      section: "A",
    });

    const res = await postStudentHandler(duplicateReq);
    assert.equal(res.status, 409, "Must return HTTP 409 Conflict for duplicate student enrollment roll code");
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes(testUniqueCode));
  });

  it("7. PERSISTENCE CHECK: Re-reading directly from database confirms permanent storage", async () => {
    const fetched = await db.getStudentByIdAsync(createdStudentId);
    assert.ok(fetched, "Student must exist in database");
    assert.equal(fetched.displayName, testDisplayName);
    assert.equal(fetched.studentCode, testUniqueCode);
    assert.equal(fetched.classroomId, "cls-3b");
    assert.equal(fetched.grade, 3);
    assert.equal(fetched.section, "B");
  });

  it("8. READ PROFILE: GET /api/students/:id returns saved student with zero fabricated scores", async () => {
    const profileReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`, "GET");
    const res = await getStudentByIdHandler(profileReq, { params: Promise.resolve({ id: createdStudentId }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Profile details
    assert.equal(data.student.id, createdStudentId);
    assert.equal(data.student.displayName, testDisplayName);
    assert.equal(data.student.grade, 3);
    assert.equal(data.student.section, "B");
    assert.equal(data.student.classroomId, "cls-3b");

    // Educational Rules Verification: Adding student alone must NEVER fabricate scores or gaps!
    assert.equal(data.results.length, 0, "New student must have 0 fabricated assessment scores");
    assert.equal(data.gaps.length, 0, "New student must have 0 fabricated learning gaps");
    assert.equal(data.remedialPlans.length, 0, "New student must have 0 fabricated remedial plans");
    assert.equal(data.attempts.length, 0, "New student must have 0 fabricated activity attempts");
  });

  it("9. SEARCH & FILTER: New student appears in roster search and Class 3 filter", async () => {
    // Search by roll code
    const searchReq = mockRequest(`http://localhost:3000/api/students?search=${testUniqueCode}`, "GET");
    const searchRes = await getStudentsHandler(searchReq);
    const searchData = await searchRes.json();
    assert.equal(searchRes.status, 200);
    assert.ok(searchData.students.some((s: any) => s.id === createdStudentId));

    // Filter by Class 3
    const classReq = mockRequest("http://localhost:3000/api/students?grade=3", "GET");
    const classRes = await getStudentsHandler(classReq);
    const classData = await classRes.json();
    assert.equal(classRes.status, 200);
    assert.ok(classData.students.some((s: any) => s.id === createdStudentId));

    // Confirm student does NOT appear in Class 4 filter
    const otherClassReq = mockRequest("http://localhost:3000/api/students?grade=4", "GET");
    const otherClassRes = await getStudentsHandler(otherClassReq);
    const otherClassData = await otherClassRes.json();
    assert.ok(!otherClassData.students.some((s: any) => s.id === createdStudentId));
  });

  it("10. UPDATE: Editing student details persists and synchronizes classroomId", async () => {
    const editReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`, "PUT", {
      displayName: "Priyanshi Solanki (Updated)",
      section: "C",
      notes: "Transferred to Section C upon request.",
    });

    const res = await putStudentHandler(editReq, { params: Promise.resolve({ id: createdStudentId }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.displayName, "Priyanshi Solanki (Updated)");
    assert.equal(data.student.section, "C");
    assert.equal(data.student.classroomId, "cls-3c", "ClassroomId must auto-synchronize to cls-3c");

    // Verify in database
    const inDb = await db.getStudentByIdAsync(createdStudentId);
    assert.equal(inDb?.displayName, "Priyanshi Solanki (Updated)");
    assert.equal(inDb?.classroomId, "cls-3c");
  });

  it("11. DELETE: Removes test student cleanly without affecting existing students", async () => {
    const deleteReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`, "DELETE");
    const res = await deleteStudentHandler(deleteReq, { params: Promise.resolve({ id: createdStudentId }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify 404 on subsequent get
    const checkReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`, "GET");
    const checkRes = await getStudentByIdHandler(checkReq, { params: Promise.resolve({ id: createdStudentId }) });
    assert.equal(checkRes.status, 404);

    // Reset createdStudentId so after() doesn't need to double-delete
    createdStudentId = "";
  });
});

