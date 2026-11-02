import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { GET as getAssignmentsRoute, POST as postAssignmentsRoute } from "../src/app/api/admin/teachers/assignments/route";
import { DELETE as deleteAssignmentRoute } from "../src/app/api/admin/teachers/assignments/[id]/route";
import { GET as getUsersRoute } from "../src/app/api/admin/users/route";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";

async function createAdminCookieHeader(): Promise<string> {
  const token = await signSession({
    id: "usr-admin-01",
    name: "Principal R. K. Trivedi",
    email: "principal@studysaathi.edu.in",
    role: "admin",
    schoolId: "sch-gn-01",
    provider: "local",
  });
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
}

async function createTeacherCookieHeader(): Promise<string> {
  const token = await signSession({
    id: "usr-teacher-raj",
    name: "Raj",
    email: "rajbusa63@gmail.com",
    role: "teacher",
    schoolId: "sch-gn-01",
    provider: "local",
  });
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
}

test("Teacher Subject & Class Assignment Management Test Suite", async (t) => {
  const adminCookie = await createAdminCookieHeader();
  const teacherCookie = await createTeacherCookieHeader();

  await t.test("1. Verify teacher list contains Raj and other registered teachers", async () => {
    const req = new Request("http://localhost:3000/api/admin/users", {
      headers: { cookie: adminCookie },
    });
    const res = await getUsersRoute(req);
    assert.equal(res.status, 200, "Admin users endpoint must return 200");
    const data = await res.json();
    assert.equal(data.success, true);
    
    const teachers = data.users.filter((u: any) => u.role === "teacher");
    assert.ok(teachers.length >= 3, "Must have at least 3 teachers");
    
    const raj = teachers.find((u: any) => u.email === "rajbusa63@gmail.com");
    assert.ok(raj, "Raj (rajbusa63@gmail.com) must be present in teacher list");
    assert.equal(raj.name, "Raj");
    assert.equal(raj.role, "teacher");

    const pooja = teachers.find((u: any) => u.name === "Pooja Sharma");
    assert.ok(pooja, "Pooja Sharma must be present");
  });

  await t.test("2. Successfully assign subject (Mathematics) and classes (1-3) to Raj by ID without 'Teacher not found'", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "usr-teacher-raj",
        subjectCode: "MATH",
        classroomIds: ["cls-1a", "cls-2a", "cls-3a"],
        grades: [1, 2, 3],
      }),
    });

    const res = await postAssignmentsRoute(req);
    const data = await res.json();
    assert.ok([200, 201].includes(res.status), `Assignment by ID must succeed, got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.assignment.teacherId, "usr-teacher-raj");
    assert.equal(data.assignment.subjectCode, "MATH");
    assert.deepEqual(data.assignment.grades, [1, 2, 3]);
  });

  await t.test("3. Successfully assign subject to Raj by Email identifier (resolves 'Teacher not found' when identifier is email)", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "rajbusa63@gmail.com",
        subjectCode: "ENG",
        classroomIds: ["cls-1a", "cls-2a"],
        grades: [1, 2],
      }),
    });

    const res = await postAssignmentsRoute(req);
    const data = await res.json();
    assert.ok([200, 201].includes(res.status), `Assignment by email must succeed, got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.assignment.teacherId, "usr-teacher-raj");
    assert.equal(data.assignment.subjectCode, "ENG");
    assert.deepEqual(data.assignment.grades, [1, 2]);
  });

  await t.test("4. Duplicate assignment prevention: Updating an existing assignment modifies classes in-place", async () => {
    // Current assignments count for Raj
    const initialAsgs = db.getTeacherAssignments("usr-teacher-raj");
    const mathCountBefore = initialAsgs.filter((a) => a.subjectCode === "MATH").length;
    assert.equal(mathCountBefore, 1, "Should have 1 MATH assignment initially");

    // Assign MATH again to Raj, but with classes 1 to 5
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "usr-teacher-raj",
        subjectCode: "MATH",
        grades: [1, 2, 3, 4, 5],
      }),
    });

    const res = await postAssignmentsRoute(req);
    const data = await res.json();
    assert.ok([200, 201].includes(res.status));
    assert.equal(data.success, true);
    assert.deepEqual(data.assignment.grades, [1, 2, 3, 4, 5]);

    // Verify no duplicate row was created
    const refreshedAsgs = db.getTeacherAssignments("usr-teacher-raj");
    const mathCountAfter = refreshedAsgs.filter((a) => a.subjectCode === "MATH").length;
    assert.equal(mathCountAfter, 1, "Must update existing MATH assignment in-place, not create duplicate");
  });

  await t.test("5. Assignments list returns enriched teacher name and email for all rows", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      headers: { cookie: adminCookie },
    });
    const res = await getAssignmentsRoute(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.assignments.length >= 2, "Must return assignments");

    const rajMathAsg = data.assignments.find(
      (a: any) => a.teacherId === "usr-teacher-raj" && a.subjectCode === "MATH"
    );
    assert.ok(rajMathAsg, "Raj's MATH assignment must be in the list");
    assert.equal(rajMathAsg.teacherName, "Raj");
    assert.equal(rajMathAsg.teacherEmail, "rajbusa63@gmail.com");
    assert.ok(Array.isArray(rajMathAsg.classes));
    assert.equal(rajMathAsg.classes.length, 5);

    // Verify usr-teacher-02 is enriched with name and email
    const asg02 = data.assignments.find((a: any) => a.teacherId === "usr-teacher-02");
    if (asg02) {
      assert.equal(asg02.teacherName, "Priya Patel", "usr-teacher-02 must be enriched with Priya Patel");
      assert.equal(asg02.teacherEmail, "priya.patel@studysaathi.edu.in");
    }
  });

  await t.test("6. Assignment deletion removes only assignment and keeps teacher account safe", async () => {
    const engAsg = db.getTeacherAssignments("usr-teacher-raj").find((a) => a.subjectCode === "ENG");
    assert.ok(engAsg, "Raj should have ENG assignment");

    const req = new Request(`http://localhost:3000/api/admin/teachers/assignments/${engAsg.id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });

    const res = await deleteAssignmentRoute(req, { params: Promise.resolve({ id: engAsg.id }) });
    assert.equal(res.status, 200, "DELETE route must return 200");
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify ENG assignment is gone
    const asgsAfter = db.getTeacherAssignments("usr-teacher-raj");
    assert.equal(asgsAfter.some((a) => a.subjectCode === "ENG"), false, "ENG assignment must be deleted");

    // CRITICAL: Verify teacher account still exists!
    const teacherUser = db.getUserById("usr-teacher-raj");
    assert.ok(teacherUser, "Teacher account must remain intact in database after deleting assignment");
    assert.equal(teacherUser.name, "Raj");
    assert.equal(teacherUser.role, "teacher");
  });

  await t.test("7. Truly non-existent teacher identifier returns 404 with 'Teacher not found.'", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "nonexistent-teacher-9999",
        subjectCode: "MATH",
        grades: [1],
      }),
    });

    const res = await postAssignmentsRoute(req);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error, "Teacher not found.");
  });

  await t.test("8. Role-Based Access Control: Unauthorized requests are rejected", async () => {
    // Unauthenticated request
    const unauthReq = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: "usr-teacher-raj",
        subjectCode: "MATH",
        grades: [1],
      }),
    });
    const unauthRes = await postAssignmentsRoute(unauthReq);
    assert.equal(unauthRes.status, 401, "Unauthenticated request must return 401");

    // Teacher attempting administrative assignment
    const teacherReq = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: teacherCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "usr-teacher-raj",
        subjectCode: "MATH",
        grades: [1],
      }),
    });
    const teacherRes = await postAssignmentsRoute(teacherReq);
    assert.equal(teacherRes.status, 403, "Teacher accessing admin assignment endpoint must return 403");
  });
});
