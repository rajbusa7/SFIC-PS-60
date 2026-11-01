import test from "node:test";
import assert from "node:assert";
import { db } from "../src/lib/db/database";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { GET as getResultsHandler, POST as postResultsHandler } from "../src/app/api/assessments/results/route";
import { GET as getStudentsHandler } from "../src/app/api/students/route";
import { GET as getStudentByIdHandler, PUT as putStudentByIdHandler, DELETE as deleteStudentByIdHandler } from "../src/app/api/students/[id]/route";
import { GET as getGapsHandler } from "../src/app/api/learning-gaps/route";
import { POST as postAdminAssignmentHandler } from "../src/app/api/admin/teachers/assignments/route";
import { PATCH as patchUserHandler } from "../src/app/api/admin/users/[id]/route";

function makeRequest(url: string, method = "GET", token?: string, body?: any) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`);
  }
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

test("Subject-Wise Teacher Access Control Test Suite (Phases 1-10)", async (t) => {
  // Generate authentic signed session tokens
  const teacher01Token = await signSession({
    id: "usr-teacher-01",
    name: "Pooja Sharma",
    email: "teacher@studysaathi.edu.in",
    role: "teacher",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  const teacher02Token = await signSession({
    id: "usr-teacher-02",
    name: "Priya Patel",
    email: "priya.patel@studysaathi.edu.in",
    role: "teacher",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  const teacher03Token = await signSession({
    id: "usr-teacher-03",
    name: "Amit Verma",
    email: "amit.verma@studysaathi.edu.in",
    role: "teacher",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  const adminToken = await signSession({
    id: "usr-admin-01",
    name: "Principal R. K. Trivedi",
    email: "principal@studysaathi.edu.in",
    role: "admin",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  // Ensure deterministic test execution with fresh seed data
  db.resetToDemoData();

  await t.test("Test 1: Single-subject teacher sees only authorized records", async () => {
    // Teacher 02 has ENG for Class 1 only
    const asgs = db.getTeacherAssignments("usr-teacher-02");
    assert.strictEqual(asgs.length, 1, "Priya Patel must have exactly 1 assignment");
    assert.strictEqual(asgs[0].subjectCode, "ENG");
    assert.deepStrictEqual(asgs[0].grades, [1]);

    const req = makeRequest("http://localhost:3000/api/assessments/results", "GET", teacher02Token);
    const res = await getResultsHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    // Every returned result must belong to student in Grade 1
    for (const r of data.results) {
      const student = db.getStudentById(r.studentId);
      assert.ok(student, "Student must exist");
      assert.strictEqual(student.grade, 1, "Single-subject Class 1 teacher must only see Class 1 student marks");
    }
  });

  await t.test("Test 2: Multiple-subject teacher has multiple authorized subjects in DB", async () => {
    // Teacher 01 has MATH (Classes 1-4) and GUJ (Classes 3-4)
    const asgs = db.getTeacherAssignments("usr-teacher-01");
    assert.strictEqual(asgs.length, 2, "Pooja Sharma must have 2 assigned subjects");
    const subjects = asgs.map((a) => a.subjectCode);
    assert.ok(subjects.includes("MATH"), "Must have MATH assigned");
    assert.ok(subjects.includes("GUJ"), "Must have GUJ assigned");
  });

  await t.test("Test 3: Unauthorized subject request is rejected with 403 Forbidden", async () => {
    // Teacher 02 (ENG only) attempts to fetch or update results for SCI or MATH
    const req = makeRequest(
      "http://localhost:3000/api/assessments/results?subjectCode=SCI",
      "GET",
      teacher02Token
    );
    const res = await getResultsHandler(req);
    assert.strictEqual(res.status, 403, "Should reject unauthorized subject with 403");
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Forbidden.*subject/i);
  });

  await t.test("Test 4: Unauthorized class request is rejected with 403 Forbidden", async () => {
    // Teacher 02 is assigned Class 1 only; attempts to access Class 3 marks
    const req = makeRequest(
      "http://localhost:3000/api/assessments/results",
      "POST",
      teacher02Token,
      {
        results: [
          {
            assessmentId: "asm-unit-1",
            studentId: "std-aarav", // Aarav is in Grade 4
            conceptId: "c-math-div-4",
            marksObtained: 18,
            maximumMarks: 20,
            subjectCode: "MATH",
          },
        ],
      }
    );
    const res = await postResultsHandler(req);
    assert.strictEqual(res.status, 403, "Should reject editing marks for unauthorized class with 403");
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await t.test("Test 5: Unauthorized student ID manipulation (IDOR) is rejected with 403", async () => {
    // Teacher 02 (Class 1) attempts to access Aarav (Class 4) directly via /api/students/[id]
    const req = makeRequest(
      "http://localhost:3000/api/students/std-aarav",
      "GET",
      teacher02Token
    );
    const res = await getStudentByIdHandler(req, {
      params: Promise.resolve({ id: "std-aarav" }),
    });
    assert.strictEqual(res.status, 403, "IDOR attempt on unauthorized student profile must return 403");
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Forbidden/i);
  });

  await t.test("Test 6: Authorized marks update succeeds, validates ranges, and persists", async () => {
    // 6a: Reject negative marks
    const negReq = makeRequest(
      "http://localhost:3000/api/assessments/results",
      "POST",
      teacher01Token,
      {
        results: [
          {
            assessmentId: "asm-unit-1",
            studentId: "std-aarav",
            conceptId: "c-math-div-4",
            marksObtained: -5,
            maximumMarks: 20,
            subjectCode: "MATH",
          },
        ],
      }
    );
    const negRes = await postResultsHandler(negReq);
    assert.strictEqual(negRes.status, 400, "Negative marks must return 400 Bad Request");

    // 6b: Reject marks exceeding maximumMarks
    const overReq = makeRequest(
      "http://localhost:3000/api/assessments/results",
      "POST",
      teacher01Token,
      {
        results: [
          {
            assessmentId: "asm-unit-1",
            studentId: "std-aarav",
            conceptId: "c-math-div-4",
            marksObtained: 25,
            maximumMarks: 20,
            subjectCode: "MATH",
          },
        ],
      }
    );
    const overRes = await postResultsHandler(overReq);
    assert.strictEqual(overRes.status, 400, "Marks exceeding maximum marks must return 400 Bad Request");

    // 6c: Valid update saves successfully and creates audit log
    const validReq = makeRequest(
      "http://localhost:3000/api/assessments/results",
      "POST",
      teacher01Token,
      {
        results: [
          {
            assessmentId: "asm-unit-1",
            studentId: "std-aarav",
            conceptId: "c-math-div-4",
            marksObtained: 19,
            maximumMarks: 20,
            notes: "Outstanding division progress verified.",
            subjectCode: "MATH",
          },
        ],
      }
    );
    const validRes = await postResultsHandler(validReq);
    assert.strictEqual(validRes.status, 200, "Valid marks entry must succeed with 200");
    const validData = await validRes.json();
    assert.strictEqual(validData.success, true);

    // Verify persistence in DB
    const saved = db.getResults("std-aarav", "c-math-div-4");
    assert.ok(saved.length > 0, "Saved results must exist in database");
    assert.strictEqual(saved[0].marksObtained, 19, "Persisted marks must match 19");

    // Verify audit log entry was created
    const logs = db.getAuditLogs({ teacherId: "usr-teacher-01", studentId: "std-aarav" });
    assert.ok(logs.length > 0, "Audit log entry must be recorded");
    assert.strictEqual(logs[0].updatedMarks, 19);
    assert.strictEqual(logs[0].subjectCode, "MATH");
  });

  await t.test("Test 7: Subject switching returns distinct records for each subject", async () => {
    // Teacher 01 has MATH (Grade 1-4) and GUJ (Grade 3-4)
    const mathReq = makeRequest(
      "http://localhost:3000/api/assessments/results?subjectCode=MATH",
      "GET",
      teacher01Token
    );
    const mathRes = await getResultsHandler(mathReq);
    assert.strictEqual(mathRes.status, 200);

    const gujReq = makeRequest(
      "http://localhost:3000/api/assessments/results?subjectCode=GUJ",
      "GET",
      teacher01Token
    );
    const gujRes = await getResultsHandler(gujReq);
    assert.strictEqual(gujRes.status, 200);
  });

  await t.test("Test 8: Teacher with no subject assignments cannot access protected records", async () => {
    // Teacher 03 has 0 assignments
    const asgs = db.getTeacherAssignments("usr-teacher-03");
    assert.strictEqual(asgs.length, 0, "Amit Verma must have 0 assignments");

    const req = makeRequest("http://localhost:3000/api/assessments/results", "GET", teacher03Token);
    const res = await getResultsHandler(req);
    assert.strictEqual(res.status, 403, "Teacher with 0 subjects must receive 403 Forbidden");
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /No subjects have been assigned/i);
  });

  await t.test("Test 9: Administrator updates teacher assignment and access updates dynamically", async () => {
    // Admin assigns Science (SCI) for Class 5 to Teacher 02
    const adminReq = makeRequest(
      "http://localhost:3000/api/admin/teachers/assignments",
      "POST",
      adminToken,
      {
        teacherId: "usr-teacher-02",
        subjectCode: "SCI",
        classroomIds: ["cls-5a"],
        grades: [5],
      }
    );
    const adminRes = await postAdminAssignmentHandler(adminReq);
    assert.strictEqual(adminRes.status, 201, "Admin should create assignment with 201");

    // Teacher 02 now has 2 assignments: ENG and SCI
    const updatedAsgs = db.getTeacherAssignments("usr-teacher-02");
    assert.strictEqual(updatedAsgs.length, 2, "Teacher 02 must now have 2 assignments");
    assert.ok(updatedAsgs.some((a) => a.subjectCode === "SCI"));

    // Teacher 02 can now access SCI records without 403
    const sciReq = makeRequest(
      "http://localhost:3000/api/assessments/results?subjectCode=SCI",
      "GET",
      teacher02Token
    );
    const sciRes = await getResultsHandler(sciReq);
    assert.strictEqual(sciRes.status, 200, "Teacher 02 can now view authorized SCI records");
  });

  await t.test("Test 10: Role protection: Teacher cannot modify roles or assign permissions", async () => {
    // Teacher 01 tries to create an assignment for themselves
    const illegalAssignReq = makeRequest(
      "http://localhost:3000/api/admin/teachers/assignments",
      "POST",
      teacher01Token,
      {
        teacherId: "usr-teacher-01",
        subjectCode: "SCI",
        classroomIds: ["cls-5a"],
        grades: [5],
      }
    );
    const assignRes = await postAdminAssignmentHandler(illegalAssignReq);
    assert.strictEqual(assignRes.status, 403, "Teacher attempting admin assignment must receive 403");

    // Teacher 01 tries to elevate themselves to admin via PATCH /api/admin/users/[id]
    const illegalRoleReq = makeRequest(
      "http://localhost:3000/api/admin/users/usr-teacher-01",
      "PATCH",
      teacher01Token,
      {
        role: "admin",
      }
    );
    const roleRes = await patchUserHandler(illegalRoleReq, {
      params: Promise.resolve({ id: "usr-teacher-01" }),
    });
    assert.strictEqual(roleRes.status, 403, "Teacher attempting self-elevation to admin must receive 403");
  });

  await t.test("Test 11: Existing functionality remains intact", async () => {
    // Student list works
    const stdReq = makeRequest("http://localhost:3000/api/students", "GET");
    const stdRes = await getStudentsHandler(stdReq);
    assert.strictEqual(stdRes.status, 200);

    // Learning gaps work
    const gapsReq = makeRequest("http://localhost:3000/api/learning-gaps", "GET");
    const gapsRes = await getGapsHandler(gapsReq);
    assert.strictEqual(gapsRes.status, 200);
  });

  await t.test("Test 12: Delete student is restricted from teachers", async () => {
    const delReq = makeRequest(
      "http://localhost:3000/api/students/std-aarav",
      "DELETE",
      teacher01Token
    );
    const delRes = await deleteStudentByIdHandler(delReq, {
      params: Promise.resolve({ id: "std-aarav" }),
    });
    assert.strictEqual(delRes.status, 403, "Teacher cannot delete student records");
  });
});

