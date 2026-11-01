import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db/database";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { GET as getAuthMeHandler } from "../src/app/api/auth/me/route";

function makeSessionRequest(token?: string) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`);
  }
  return new Request("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers,
  });
}

test("Profile Dropdown and Account Authentication Integrity Test Suite", async (t) => {
  // Ensure fresh seed data
  db.resetToDemoData();

  // 1. Create a dynamic teacher account for Raj Busa
  const rajUser = await db.createUserAsync({
    name: "Raj Busa",
    email: "raj.busa@shikshasetu.edu.in",
    role: "teacher",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  // Assign Mathematics (Classes 1, 2) to Raj Busa
  await db.setTeacherAssignmentAsync({
    teacherId: rajUser.id,
    teacherName: rajUser.name,
    teacherEmail: rajUser.email,
    schoolId: "sch-gn-01",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    grades: [1, 2],
    classes: ["1", "2"],
    isClassTeacher: true,
  });

  const rajToken = await signSession({
    id: rajUser.id,
    name: rajUser.name,
    email: rajUser.email,
    role: rajUser.role,
    schoolId: rajUser.schoolId,
    provider: "local",
  });

  const poojaToken = await signSession({
    id: "usr-teacher-01",
    name: "Pooja Sharma",
    email: "teacher@studysaathi.edu.in",
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

  const parentToken = await signSession({
    id: "par-001",
    name: "Dineshbhai Patel",
    email: "dinesh.patel@example.com",
    role: "parent",
    schoolId: "sch-gn-01",
    provider: "local",
  });

  await t.test("Test 1: Raj Busa session returns strictly Raj Busa info and his assigned subjects", async () => {
    const req = makeSessionRequest(rajToken);
    const res = await getAuthMeHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.user.id, rajUser.id);
    assert.strictEqual(data.user.name, "Raj Busa");
    assert.strictEqual(data.user.email, "raj.busa@shikshasetu.edu.in");
    assert.strictEqual(data.user.role, "teacher");

    // Must return only Raj Busa's assignments
    assert.strictEqual(data.assignments.length, 1);
    assert.strictEqual(data.assignments[0].teacherId, rajUser.id);
    assert.strictEqual(data.assignments[0].subjectCode, "MATH");
    assert.deepStrictEqual(data.assignments[0].grades, [1, 2]);

    // Zero leakage of Pooja Sharma's or Priya Patel's assignments
    const containsOther = data.assignments.some((a: any) => a.teacherId !== rajUser.id);
    assert.strictEqual(containsOther, false, "Must not leak any assignments of other teachers");
  });

  await t.test("Test 2: Pooja Sharma session returns strictly Pooja Sharma info and her assigned subjects", async () => {
    const req = makeSessionRequest(poojaToken);
    const res = await getAuthMeHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.user.name, "Pooja Sharma");
    assert.strictEqual(data.user.role, "teacher");

    // Pooja Sharma has MATH (1-5) and GUJ (3-4)
    assert.strictEqual(data.assignments.length, 2);
    const subjects = data.assignments.map((a: any) => a.subjectCode).sort();
    assert.deepStrictEqual(subjects, ["GUJ", "MATH"]);

    // Zero leakage of Raj Busa's assignments
    const containsRaj = data.assignments.some((a: any) => a.teacherId === rajUser.id);
    assert.strictEqual(containsRaj, false, "Must not leak Raj Busa's assignments");
  });

  await t.test("Test 3: Administrator session returns administrator profile", async () => {
    const req = makeSessionRequest(adminToken);
    const res = await getAuthMeHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.user.name, "Principal R. K. Trivedi");
    assert.strictEqual(data.user.role, "admin");
  });

  await t.test("Test 4: Parent session returns parent profile with zero teacher assignments", async () => {
    const req = makeSessionRequest(parentToken);
    const res = await getAuthMeHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.user.name, "Dineshbhai Patel");
    assert.strictEqual(data.user.role, "parent");
    assert.strictEqual(data.assignments.length, 0, "Parent must have zero teacher assignments");
  });

  await t.test("Test 5: AppHeader component code verification - Account switcher is completely eliminated", () => {
    const headerPath = path.resolve("src/components/layout/AppHeader.tsx");
    const headerCode = fs.readFileSync(headerPath, "utf8");

    // 1. "Switch Active Role" must NOT exist in AppHeader
    assert.strictEqual(
      headerCode.includes("Switch Active Role"),
      false,
      "AppHeader must not contain 'Switch Active Role'"
    );

    // 2. switchRole calls must NOT exist in AppHeader
    assert.strictEqual(
      headerCode.includes("switchRole("),
      false,
      "AppHeader must not contain switchRole calls"
    );

    // 3. Fallback to hardcoded names inside dropdown must NOT exist
    assert.strictEqual(
      headerCode.includes("Principal R.K. Trivedi"),
      false,
      "AppHeader must not hardcode 'Principal R.K. Trivedi' in dropdown options"
    );
    assert.strictEqual(
      headerCode.includes("Dineshbhai Patel"),
      false,
      "AppHeader must not hardcode 'Dineshbhai Patel' in dropdown options"
    );

    // 4. Must render authenticated user's name dynamically
    assert.strictEqual(
      headerCode.includes("user?.name || \"Authenticated User\""),
      true,
      "AppHeader must display dynamic authenticated user name"
    );

    // 5. Must calculate user initials dynamically
    assert.strictEqual(
      headerCode.includes("userInitials"),
      true,
      "AppHeader must compute and display dynamic user initials"
    );

    // 6. Sign Out button must be present and call logout()
    assert.strictEqual(
      headerCode.includes("await logout()"),
      true,
      "AppHeader must contain working Sign Out button calling logout()"
    );

    // 7. Teacher assignments section must be present
    assert.strictEqual(
      headerCode.includes("Assigned Subjects & Classes"),
      true,
      "AppHeader must display teacher's assigned subjects & classes"
    );
  });

  await t.test("Test 6: Initials calculation algorithm correctness", () => {
    function computeInitials(name?: string | null, role?: string): string {
      if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
          return parts[0].slice(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      if (role === "admin") return "A";
      if (role === "parent") return "P";
      return "T";
    }

    assert.strictEqual(computeInitials("Raj Busa"), "RB");
    assert.strictEqual(computeInitials("Pooja Sharma"), "PS");
    assert.strictEqual(computeInitials("Priya Patel"), "PP");
    assert.strictEqual(computeInitials("Amit Verma"), "AV");
    assert.strictEqual(computeInitials("Principal R. K. Trivedi"), "PT");
    assert.strictEqual(computeInitials("Dineshbhai Patel"), "DP");
    assert.strictEqual(computeInitials("Raj"), "RA");
    assert.strictEqual(computeInitials(null, "admin"), "A");
    assert.strictEqual(computeInitials(null, "parent"), "P");
    assert.strictEqual(computeInitials(null, "teacher"), "T");
  });

  // Clean up store
  db.resetToDemoData();
});

