import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { POST as loginRoute } from "../src/app/api/auth/login/route";
import { GET as getAuthMeRoute } from "../src/app/api/auth/me/route";
import { POST as postAssignmentRoute } from "../src/app/api/admin/teachers/assignments/route";
import { GET as getLearningGapsRoute } from "../src/app/api/learning-gaps/route";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";

test("Complete Assigned Subjects Flow: Admin Assignment -> Persistence -> Teacher Login -> Dashboard", async (t) => {
  // 1. Establish clean test state
  db.resetToDemoData();

  const adminToken = await signSession({
    id: "usr-admin-01",
    name: "Principal R. K. Trivedi",
    email: "principal@studysaathi.edu.in",
    role: "admin",
    schoolId: "sch-gn-01",
    provider: "local",
  });
  const adminCookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(adminToken)}`;

  await t.test("1. School Administrator assigns Mathematics (Classes 1, 2, 3) to teacher Raj", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "usr-teacher-raj",
        teacherEmail: "rajbusa63@gmail.com",
        teacherName: "Raj",
        subjectCode: "MATH",
        grades: [1, 2, 3],
        classroomIds: ["cls-1a", "cls-2a", "cls-3a"],
      }),
    });

    const res = await postAssignmentRoute(req);
    assert.equal(res.status, 201, "Assignment must succeed with 201 Created");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.assignment.subjectCode, "MATH");
    assert.deepEqual(data.assignment.grades, [1, 2, 3]);
    assert.equal(data.assignment.teacherEmail, "rajbusa63@gmail.com");
  });

  await t.test("2. Teacher Raj logs in: returns assigned Mathematics subject with formatted classes", async () => {
    const loginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "rajbusa63@gmail.com",
        password: "teacher123",
        role: "teacher",
      }),
    });

    const loginRes = await loginRoute(loginReq);
    assert.equal(loginRes.status, 200, "Teacher login must succeed");
    const loginData = await loginRes.json();
    assert.equal(loginData.success, true);
    assert.equal(loginData.user.email, "rajbusa63@gmail.com");
    assert.ok(Array.isArray(loginData.assignments), "Assignments must be an array");
    assert.ok(loginData.assignments.length >= 1, "Must contain at least 1 assigned subject");

    const mathAsg = loginData.assignments.find((a: any) => a.subjectCode === "MATH");
    assert.ok(mathAsg, "Mathematics assignment must be present in login response");
    assert.deepEqual(mathAsg.grades, [1, 2, 3]);
    assert.ok(mathAsg.subjectName.includes("Mathematics"));
  });

  await t.test("3. Teacher Raj session refresh (/api/auth/me): preserves assigned subject", async () => {
    const rajToken = await signSession({
      id: "usr-teacher-raj",
      name: "Raj",
      email: "rajbusa63@gmail.com",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    const meReq = new Request("http://localhost:3000/api/auth/me", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(rajToken)}` },
    });

    const meRes = await getAuthMeRoute(meReq);
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.authenticated, true);
    assert.equal(meData.user.email, "rajbusa63@gmail.com");
    assert.ok(Array.isArray(meData.assignments));
    assert.ok(meData.assignments.length >= 1);
    assert.equal(meData.assignments[0].subjectCode, "MATH");
  });

  await t.test("4. Teacher Raj accesses learning gaps API: authorized for assigned subject MATH", async () => {
    const rajToken = await signSession({
      id: "usr-teacher-raj",
      name: "Raj",
      email: "rajbusa63@gmail.com",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    const gapsReq = new Request("http://localhost:3000/api/learning-gaps?subjectCode=MATH", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(rajToken)}` },
    });

    const gapsRes = await getLearningGapsRoute(gapsReq);
    assert.equal(gapsRes.status, 200, "Must be authorized for assigned subject");
    const gapsData = await gapsRes.json();
    assert.equal(gapsData.success, true);
    assert.ok(Array.isArray(gapsData.gaps));
  });

  await t.test("5. Multi-subject assignment: Admin assigns English; Teacher receives both MATH and ENG", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "usr-teacher-raj",
        subjectCode: "ENG",
        grades: [1, 2],
        classroomIds: ["cls-1a", "cls-2a"],
      }),
    });

    const res = await postAssignmentRoute(req);
    assert.equal(res.status, 201);

    const rajAsgs = db.getTeacherAssignments("usr-teacher-raj");
    assert.equal(rajAsgs.length, 2, "Teacher must now have both MATH and ENG assignments");
    const codes = rajAsgs.map((a) => a.subjectCode).sort();
    assert.deepEqual(codes, ["ENG", "MATH"]);
  });

  await t.test("6. Access isolation: Pooja Sharma sees only her own assigned subjects, not Raj's", async () => {
    const poojaToken = await signSession({
      id: "usr-teacher-01",
      name: "Pooja Sharma",
      email: "teacher@studysaathi.edu.in",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    const meReq = new Request("http://localhost:3000/api/auth/me", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(poojaToken)}` },
    });

    const meRes = await getAuthMeRoute(meReq);
    const meData = await meRes.json();
    assert.equal(meData.user.email, "teacher@studysaathi.edu.in");
    
    // Pooja has MATH and GUJ, but her teacherId must be usr-teacher-01
    for (const a of meData.assignments) {
      assert.equal(a.teacherId, "usr-teacher-01");
      assert.notEqual(a.teacherEmail, "rajbusa63@gmail.com");
    }
  });

  await t.test("7. Unassigned teacher account: returns empty assignments array safely", async () => {
    const unassignedToken = await signSession({
      id: "usr-new-teacher",
      name: "New Teacher",
      email: "new.teacher@studysaathi.edu.in",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    const meReq = new Request("http://localhost:3000/api/auth/me", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(unassignedToken)}` },
    });

    const meRes = await getAuthMeRoute(meReq);
    const meData = await meRes.json();
    assert.equal(meData.authenticated, true);
    assert.deepEqual(meData.assignments, [], "Unassigned teacher must have empty assignments array");
  });
});
