import test from "node:test";
import assert from "node:assert";
import { db } from "../src/lib/db/database";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { GET as getTeachersHandler, POST as postTeachersHandler } from "../src/app/api/admin/teachers/route";
import { GET as getTeacherByIdHandler, PATCH as patchTeacherByIdHandler, PUT as putTeacherByIdHandler, DELETE as deleteTeacherByIdHandler } from "../src/app/api/admin/teachers/[id]/route";
import { GET as getAssignmentsHandler, POST as postAssignmentsHandler } from "../src/app/api/admin/teachers/assignments/route";
import { DELETE as deleteAssignmentByIdHandler } from "../src/app/api/admin/teachers/assignments/[id]/route";
import { GET as getResultsHandler, POST as postResultsHandler } from "../src/app/api/assessments/results/route";

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

test("Teacher Management and Subject Assignment System Test Suite", async (t) => {
  // Session tokens
  const adminToken = await signSession({
    id: "usr-admin-01",
    name: "Principal R. K. Trivedi",
    email: "principal@studysaathi.edu.in",
    role: "admin",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  const teacherToken = await signSession({
    id: "usr-teacher-01",
    name: "Pooja Sharma",
    email: "teacher@studysaathi.edu.in",
    role: "teacher",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  let createdTeacherId = "";
  const uniqueEmail = `test.kavita.${Date.now()}@studysaathi.edu.in`;

  await t.test("1. Access Control: Unauthorized callers receive 401 or 403 on Admin Teacher APIs", async () => {
    // Unauthenticated GET
    const unauthReq = makeRequest("http://localhost:3000/api/admin/teachers", "GET");
    const unauthRes = await getTeachersHandler(unauthReq);
    assert.strictEqual(unauthRes.status, 401, "Unauthenticated GET should return 401");

    // Teacher attempting GET
    const teacherReq = makeRequest("http://localhost:3000/api/admin/teachers", "GET", teacherToken);
    const teacherRes = await getTeachersHandler(teacherReq);
    assert.strictEqual(teacherRes.status, 403, "Non-admin teacher GET should return 403 Forbidden");

    // Teacher attempting POST
    const teacherPostReq = makeRequest("http://localhost:3000/api/admin/teachers", "POST", teacherToken, {
      name: "Intruder Teacher",
      email: "intruder@school.edu",
    });
    const teacherPostRes = await postTeachersHandler(teacherPostReq);
    assert.strictEqual(teacherPostRes.status, 403, "Non-admin teacher POST should return 403 Forbidden");
  });

  await t.test("2. Admin creates a new teacher with initial subject & class assignments", async () => {
    const createReq = makeRequest("http://localhost:3000/api/admin/teachers", "POST", adminToken, {
      name: "Kavita Dave",
      email: uniqueEmail,
      password: "SecurePassword123!",
      teacherType: "subject",
      status: "active",
      initialAssignments: [
        {
          subjectCode: "GUJ",
          grades: [1, 2, 3],
        },
      ],
    });

    const createRes = await postTeachersHandler(createReq);
    assert.strictEqual(createRes.status, 201, "Teacher creation should return 201 Created");
    const createData = await createRes.json();
    assert.strictEqual(createData.success, true);
    assert.ok(createData.teacher, "Created teacher object should exist");
    assert.strictEqual(createData.teacher.name, "Kavita Dave");
    assert.strictEqual(createData.teacher.email, uniqueEmail);
    assert.strictEqual(createData.teacher.teacherType, "subject");
    assert.strictEqual(createData.teacher.status, "active");
    assert.ok(createData.teacher.id, "Teacher ID must be defined");
    assert.strictEqual(createData.teacher.password, undefined, "Password must not be returned in API response");
    assert.strictEqual(createData.teacher.passwordHash, undefined, "Password hash must not be returned in API response");

    createdTeacherId = createData.teacher.id;

    // Verify initial assignment was created
    assert.ok(Array.isArray(createData.teacher.assignments));
    assert.strictEqual(createData.teacher.assignments.length, 1);
    assert.strictEqual(createData.teacher.assignments[0].subjectCode, "GUJ");
    assert.deepStrictEqual(createData.teacher.assignments[0].grades, [1, 2, 3]);
  });

  await t.test("3. Validation: Prevent duplicate teacher email registration", async () => {
    const dupReq = makeRequest("http://localhost:3000/api/admin/teachers", "POST", adminToken, {
      name: "Duplicate Kavita",
      email: uniqueEmail,
      password: "AnotherPassword123!",
    });

    const dupRes = await postTeachersHandler(dupReq);
    assert.strictEqual(dupRes.status, 409, "Duplicate email should return 409 Conflict");
    const dupData = await dupRes.json();
    assert.strictEqual(dupData.success, false);
    assert.ok(dupData.error.toLowerCase().includes("already registered"));
  });

  await t.test("4. Teacher Directory: GET /api/admin/teachers lists teachers with assignments", async () => {
    const listReq = makeRequest("http://localhost:3000/api/admin/teachers", "GET", adminToken);
    const listRes = await getTeachersHandler(listReq);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.strictEqual(listData.success, true);
    assert.ok(Array.isArray(listData.teachers));

    const foundTeacher = listData.teachers.find((t: any) => t.id === createdTeacherId);
    assert.ok(foundTeacher, "Created teacher must appear in directory");
    assert.strictEqual(foundTeacher.name, "Kavita Dave");
    assert.strictEqual(foundTeacher.password, undefined, "Passwords must be stripped from directory");
    assert.strictEqual(foundTeacher.passwordHash, undefined, "Hashes must be stripped from directory");
    assert.ok(Array.isArray(foundTeacher.assignments));
    assert.ok(foundTeacher.assignments.some((a: any) => a.subjectCode === "GUJ"));
  });

  await t.test("5. Fix 'Teacher not found' error: Assign subject using ID and using Email", async () => {
    // 5a. Assign subject "MATH" to teacher using teacher ID
    const assignByIdReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "POST", adminToken, {
      teacherId: createdTeacherId,
      subjectCode: "MATH",
      grades: [4, 5],
      classroomIds: ["cls-4a", "cls-5a"],
    });

    const assignByIdRes = await postAssignmentsHandler(assignByIdReq);
    assert.ok([200, 201].includes(assignByIdRes.status), "Assignment by ID should succeed");
    const assignByIdData = await assignByIdRes.json();
    assert.strictEqual(assignByIdData.success, true);
    assert.strictEqual(assignByIdData.assignment.teacherId, createdTeacherId);
    assert.strictEqual(assignByIdData.assignment.subjectCode, "MATH");
    assert.strictEqual(assignByIdData.assignment.teacherName, "Kavita Dave");

    // 5b. Assign or update using teacher Email (resolves "Teacher not found" when identifier is email)
    const assignByEmailReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "POST", adminToken, {
      teacherId: uniqueEmail, // Passing email instead of ID
      subjectCode: "ENG",
      grades: [2, 3],
      classroomIds: ["cls-2a", "cls-3a"],
    });

    const assignByEmailRes = await postAssignmentsHandler(assignByEmailReq);
    assert.ok([200, 201].includes(assignByEmailRes.status), "Assignment by Email identifier must succeed without 'Teacher not found'");
    const assignByEmailData = await assignByEmailRes.json();
    assert.strictEqual(assignByEmailData.success, true);
    assert.strictEqual(assignByEmailData.assignment.teacherId, createdTeacherId, "Email must map to canonical teacher ID");
    assert.strictEqual(assignByEmailData.assignment.subjectCode, "ENG");
  });

  await t.test("6. Duplicate Assignment Prevention: Updating existing subject assignment updates in-place", async () => {
    // Teacher already has MATH for [4, 5]. Now assign MATH for [3, 4, 5].
    const updateAssignReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "POST", adminToken, {
      teacherId: createdTeacherId,
      subjectCode: "MATH",
      grades: [3, 4, 5],
    });

    const updateAssignRes = await postAssignmentsHandler(updateAssignReq);
    assert.ok([200, 201].includes(updateAssignRes.status));
    const updateAssignData = await updateAssignRes.json();
    assert.strictEqual(updateAssignData.success, true);
    assert.deepStrictEqual(updateAssignData.assignment.grades, [3, 4, 5]);

    // Verify there is only one MATH assignment for this teacher, not two
    const assignmentsReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "GET", adminToken);
    const assignmentsRes = await getAssignmentsHandler(assignmentsReq);
    const assignmentsData = await assignmentsRes.json();
    const mathAssignments = (assignmentsData.assignments || []).filter(
      (a: any) => a.teacherId === createdTeacherId && a.subjectCode === "MATH"
    );
    assert.strictEqual(mathAssignments.length, 1, "Must update existing assignment instead of duplicating");
  });

  await t.test("7. Edit Teacher details and toggle status (Active / Disabled)", async () => {
    // 7a. Edit details
    const patchReq = makeRequest(`http://localhost:3000/api/admin/teachers/${createdTeacherId}`, "PATCH", adminToken, {
      name: "Kavita S. Dave",
      teacherType: "class",
      status: "disabled",
    });

    const patchRes = await patchTeacherByIdHandler(patchReq, { params: Promise.resolve({ id: createdTeacherId }) });
    assert.strictEqual(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.strictEqual(patchData.success, true);
    assert.strictEqual(patchData.teacher.name, "Kavita S. Dave");
    assert.strictEqual(patchData.teacher.teacherType, "class");
    assert.strictEqual(patchData.teacher.status, "disabled");

    // 7b. Re-activate teacher
    const reactivateReq = makeRequest(`http://localhost:3000/api/admin/teachers/${createdTeacherId}`, "PATCH", adminToken, {
      status: "active",
    });
    const reactivateRes = await patchTeacherByIdHandler(reactivateReq, { params: Promise.resolve({ id: createdTeacherId }) });
    const reactivateData = await reactivateRes.json();
    assert.strictEqual(reactivateData.teacher.status, "active");
  });

  await t.test("8. Remove specific assignment via DELETE /api/admin/teachers/assignments/[id]", async () => {
    const listReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "GET", adminToken);
    const listRes = await getAssignmentsHandler(listReq);
    const listData = await listRes.json();
    const engAssignment = (listData.assignments || []).find(
      (a: any) => a.teacherId === createdTeacherId && a.subjectCode === "ENG"
    );
    assert.ok(engAssignment, "ENG assignment should exist");

    const deleteAsgReq = makeRequest(`http://localhost:3000/api/admin/teachers/assignments/${engAssignment.id}`, "DELETE", adminToken);
    const deleteAsgRes = await deleteAssignmentByIdHandler(deleteAsgReq, { params: Promise.resolve({ id: engAssignment.id }) });
    assert.strictEqual(deleteAsgRes.status, 200);
    const deleteAsgData = await deleteAsgRes.json();
    assert.strictEqual(deleteAsgData.success, true);

    // Verify ENG is gone
    const checkReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "GET", adminToken);
    const checkRes = await getAssignmentsHandler(checkReq);
    const checkData = await checkRes.json();
    assert.ok(!checkData.assignments.some((a: any) => a.id === engAssignment.id));
  });

  await t.test("9. Delete Teacher with Safe Cascading & Historical Record Preservation", async () => {
    // First, verify teacher still has assignments (GUJ and MATH)
    const beforeReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "GET", adminToken);
    const beforeRes = await getAssignmentsHandler(beforeReq);
    const beforeData = await beforeRes.json();
    const beforeAssignments = (beforeData.assignments || []).filter((a: any) => a.teacherId === createdTeacherId);
    assert.ok(beforeAssignments.length >= 1, "Teacher should have active assignments before deletion");

    // Perform deletion
    const delReq = makeRequest(`http://localhost:3000/api/admin/teachers/${createdTeacherId}`, "DELETE", adminToken);
    const delRes = await deleteTeacherByIdHandler(delReq, { params: Promise.resolve({ id: createdTeacherId }) });
    assert.strictEqual(delRes.status, 200);
    const delData = await delRes.json();
    assert.strictEqual(delData.success, true);
    assert.strictEqual(delData.cascadedAssignmentsRemoved, true);

    // Verify teacher is removed from directory
    const checkTeacherReq = makeRequest(`http://localhost:3000/api/admin/teachers/${createdTeacherId}`, "GET", adminToken);
    const checkTeacherRes = await getTeacherByIdHandler(checkTeacherReq, { params: Promise.resolve({ id: createdTeacherId }) });
    assert.strictEqual(checkTeacherRes.status, 404);

    // Verify related assignments are cascaded and removed
    const afterReq = makeRequest("http://localhost:3000/api/admin/teachers/assignments", "GET", adminToken);
    const afterRes = await getAssignmentsHandler(afterReq);
    const afterData = await afterRes.json();
    const lingeringAssignments = (afterData.assignments || []).filter((a: any) => a.teacherId === createdTeacherId);
    assert.strictEqual(lingeringAssignments.length, 0, "All assignments for deleted teacher must be cleanly removed");

    // Verify historical student records and assessments are intact
    const students = await db.getStudentsAsync();
    assert.ok(students.length > 0, "Student records must be preserved");
    const assessments = db.getAssessments();
    assert.ok(assessments.length > 0, "Assessments must be preserved");
  });
});
