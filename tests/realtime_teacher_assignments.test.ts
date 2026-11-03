import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { db } from "../src/lib/db/database";
import { POST as loginRoute } from "../src/app/api/auth/login/route";
import { GET as getAuthMeRoute } from "../src/app/api/auth/me/route";
import { GET as getTeachersRoute } from "../src/app/api/admin/teachers/route";
import { GET as getAssignmentsRoute, POST as postAssignmentRoute } from "../src/app/api/admin/teachers/assignments/route";
import { DELETE as deleteAssignmentRoute } from "../src/app/api/admin/teachers/assignments/[id]/route";
import { GET as getAssignmentsStreamRoute } from "../src/app/api/admin/teachers/assignments/stream/route";
import { GET as getLearningGapsRoute } from "../src/app/api/learning-gaps/route";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { onAssignmentChange, type AssignmentChangeEvent } from "../src/lib/realtime/assignmentBroadcaster";

test("Real-Time Teacher Subject & Class Assignment System - Comprehensive Test Suite", async (t) => {
  // 0. Setup demo state & admin credentials
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

  const teacherRajToken = await signSession({
    id: "usr-teacher-raj",
    name: "Raj",
    email: "rajbusa63@gmail.com",
    role: "teacher",
    schoolId: "sch-gn-01",
    provider: "local",
  });
  const teacherRajCookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(teacherRajToken)}`;

  await t.test("1. Registered teachers load from database via GET /api/admin/teachers", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers", {
      headers: { cookie: adminCookie },
    });
    const res = await getTeachersRoute(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.teachers));
    assert.ok(data.teachers.length > 0);
    const raj = data.teachers.find((t: any) => t.email.toLowerCase() === "rajbusa63@gmail.com");
    assert.ok(raj, "Teacher Raj must be present in teachers list");
    assert.equal(raj.name, "Raj");
  });

  await t.test("2. Assign subject and classes to teacher by ID (MATH: Classes 1, 2, 3)", async () => {
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
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.assignment.subjectCode, "MATH");
    assert.deepEqual(data.assignment.grades, [1, 2, 3]);
  });

  await t.test("3. Assign subject and classes to teacher by Email (GUJ: Classes 4, 5)", async () => {
    // Resolving by email directly in teacherId field
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "rajbusa63@gmail.com",
        teacherEmail: "rajbusa63@gmail.com",
        subjectCode: "GUJ",
        grades: [4, 5],
      }),
    });

    const res = await postAssignmentRoute(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.assignment.subjectCode, "GUJ");
    assert.deepEqual(data.assignment.grades, [4, 5]);
  });

  await t.test("4. Teacher Not Found error is resolved for mixed-case email or ID", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "RajBusa63@gmail.com",
        teacherEmail: "RAJBUSA63@GMAIL.COM",
        subjectCode: "ENG",
        grades: [1],
      }),
    });

    const res = await postAssignmentRoute(req);
    assert.equal(res.status, 201, "Omnidirectional case-insensitive lookup must succeed");
    const data = await res.json();
    assert.equal(data.success, true);
  });

  await t.test("5. Truly nonexistent user still returns Teacher not found 404", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
      method: "POST",
      headers: {
        cookie: adminCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teacherId: "nonexistent-user-id-99999",
        teacherEmail: "doesnotexist@nowhere.edu.in",
        subjectCode: "MATH",
        grades: [1],
      }),
    });

    const res = await postAssignmentRoute(req);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error, "Teacher not found.");
  });

  await t.test("6. Duplicate assignment handled via update (ON CONFLICT updates grades)", async () => {
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

    const res = await postAssignmentRoute(req);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.deepEqual(data.assignment.grades, [1, 2, 3, 4, 5]);

    // Verify assignments count did not duplicate
    const assignmentsReq = new Request("http://localhost:3000/api/admin/teachers/assignments?teacherId=usr-teacher-raj", {
      headers: { cookie: adminCookie },
    });
    const aRes = await getAssignmentsRoute(assignmentsReq);
    const aData = await aRes.json();
    const mathAssignments = aData.assignments.filter((a: any) => a.subjectCode === "MATH");
    assert.equal(mathAssignments.length, 1, "There must be exactly 1 MATH assignment for teacher Raj");
  });

  await t.test("7. Real-time stream broadcast triggers on assignment change", async () => {
    let capturedEvent: AssignmentChangeEvent | null = null;
    const unsubscribe = onAssignmentChange((event) => {
      capturedEvent = event;
    });

    try {
      const req = new Request("http://localhost:3000/api/admin/teachers/assignments", {
        method: "POST",
        headers: {
          cookie: adminCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: "usr-teacher-raj",
          subjectCode: "EVS",
          grades: [3],
        }),
      });

      const res = await postAssignmentRoute(req);
      assert.equal(res.status, 201);
      assert.ok(capturedEvent, "Broadcast event must be captured");
      assert.equal((capturedEvent as any).type, "ASSIGNMENT_SAVED");
      assert.equal((capturedEvent as any).subjectCode, "EVS");
    } finally {
      unsubscribe();
    }
  });

  await t.test("8. SSE stream route connects with 200 text/event-stream", async () => {
    const req = new Request("http://localhost:3000/api/admin/teachers/assignments/stream", {
      headers: { cookie: teacherRajCookie },
    });
    const res = await getAssignmentsStreamRoute(req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Content-Type"), "text/event-stream; charset=utf-8");
  });

  await t.test("9. Teacher account sees newly assigned subjects via GET /api/auth/me without re-login", async () => {
    const req = new Request("http://localhost:3000/api/auth/me", {
      headers: { cookie: teacherRajCookie },
    });
    const res = await getAuthMeRoute(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.authenticated, true);
    assert.ok(Array.isArray(data.assignments));
    const codes = data.assignments.map((a: any) => a.subjectCode);
    assert.ok(codes.includes("MATH"), "MATH must be present in teacher account");
    assert.ok(codes.includes("GUJ"), "GUJ must be present in teacher account");
    assert.ok(codes.includes("EVS"), "EVS must be present in teacher account");
  });

  await t.test("10. Server-side RBAC allows authorized subject queries", async () => {
    const req = new Request("http://localhost:3000/api/learning-gaps?subject=MATH&grade=1", {
      headers: { cookie: teacherRajCookie },
    });
    const res = await getLearningGapsRoute(req);
    assert.equal(res.status, 200, "Teacher Raj is authorized for MATH Class 1");
  });

  await t.test("11. Server-side RBAC rejects unauthorized subject queries (403)", async () => {
    // SCI is not assigned to teacher Raj
    const req = new Request("http://localhost:3000/api/learning-gaps?subject=SCI&grade=1", {
      headers: { cookie: teacherRajCookie },
    });
    const res = await getLearningGapsRoute(req);
    assert.equal(res.status, 403, "Unassigned subject access must be rejected with 403 Forbidden");
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes("not authorized to view learning gaps for subject 'SCI'") || data.error.includes("SCI"));
  });

  await t.test("12. Revoked subject assignment rejects subsequent requests immediately", async () => {
    // 1. Find EVS assignment
    const asgsReq = new Request("http://localhost:3000/api/admin/teachers/assignments?teacherId=usr-teacher-raj", {
      headers: { cookie: adminCookie },
    });
    const aRes = await getAssignmentsRoute(asgsReq);
    const aData = await aRes.json();
    const evsAsg = aData.assignments.find((a: any) => a.subjectCode === "EVS");
    assert.ok(evsAsg, "EVS assignment must exist before deletion");

    // 2. Admin deletes EVS assignment
    const delReq = new Request(`http://localhost:3000/api/admin/teachers/assignments/${evsAsg.id}`, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });
    const delRes = await deleteAssignmentRoute(delReq, { params: Promise.resolve({ id: evsAsg.id }) });
    assert.equal(delRes.status, 200);

    // 3. Immediately test teacher access to EVS
    const checkReq = new Request("http://localhost:3000/api/learning-gaps?subject=EVS&grade=3", {
      headers: { cookie: teacherRajCookie },
    });
    const checkRes = await getLearningGapsRoute(checkReq);
    assert.equal(checkRes.status, 403, "Revoked subject must immediately return 403 Forbidden");
  });

  await t.test("13. Zero emojis verification across all modified files", () => {
    const filesToCheck = [
      "src/lib/db/postgres.ts",
      "src/lib/db/database.ts",
      "src/lib/auth/authorization.ts",
      "src/lib/realtime/assignmentBroadcaster.ts",
      "src/app/api/admin/teachers/assignments/route.ts",
      "src/app/api/admin/teachers/assignments/[id]/route.ts",
      "src/app/api/admin/teachers/assignments/stream/route.ts",
      "src/app/api/admin/teachers/route.ts",
      "src/app/api/auth/me/route.ts",
      "src/app/api/auth/login/route.ts",
      "src/components/admin/TeacherManagementSection.tsx",
      "src/context/AuthContext.tsx",
      "src/app/dashboard/page.tsx",
    ];

    // Unicode emoji ranges regex
    const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const match = emojiRegex.exec(content);
        assert.equal(
          match,
          null,
          `File ${filePath} contains an emoji (${match?.[0]}). Zero emojis constraint violated.`
        );
      }
    }
  });
});
