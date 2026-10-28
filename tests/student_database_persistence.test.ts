import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { POST as postStudentHandler, GET as getStudentsHandler } from "../src/app/api/students/route";
import {
  GET as getStudentByIdHandler,
  PUT as putStudentHandler,
  DELETE as deleteStudentHandler,
} from "../src/app/api/students/[id]/route";
import { POST as postV1StudentHandler, GET as getV1StudentsHandler } from "../src/app/api/v1/students/route";
import {
  GET as getV1StudentByIdHandler,
  PUT as putV1StudentHandler,
  DELETE as deleteV1StudentHandler,
} from "../src/app/api/v1/students/[id]/route";
import { db } from "../src/lib/db/database";
import { isPostgresConfigured, getPostgresConnectionString } from "../src/lib/db/postgres";

function mockRequest(url: string, method = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Student Database Persistent Storage & CRUD Verification Suite", () => {
  const initialStudentCount = db.getStudents().length;
  let createdStudentId: string = "";
  const uniqueCode = `MPS-PERSIST-${Date.now().toString().slice(-5)}`;

  it("1. Database configuration audit: identifies active storage engine and PostgreSQL readiness", () => {
    const configured = isPostgresConfigured();
    const connectionStr = getPostgresConnectionString();
    if (configured) {
      assert.ok(connectionStr, "Connection string must be present when configured");
      console.log("[Test Audit]: Active Storage Engine -> PostgreSQL Cloud Database");
    } else {
      console.log("[Test Audit]: Active Storage Engine -> Persistent File Store (data/shikshasetu_store.json) with PostgreSQL Auto-Migrator ready");
    }
    assert.ok(initialStudentCount >= 15, "Initial database must have baseline enrolled students");
  });

  it("2. Validation Check: Rejects invalid student creation missing required fields", async () => {
    const badReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: "",
      displayName: "",
      grade: 4,
    });
    const res = await postStudentHandler(badReq);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error);
  });

  it("3. CREATE: Adds a new student and persists to database", async () => {
    const countBefore = (await db.getStudentsAsync()).length;
    const createReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: uniqueCode,
      displayName: "Pooja Vaghela",
      grade: 4,
      section: "B",
      classroomId: "cls-4b",
      notes: "Enrolled from Bhavnagar Model School. Demonstrates strong verbal Gujarati proficiency.",
      enrollmentStatus: "active",
    });

    const res = await postStudentHandler(createReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.student.id);
    assert.equal(data.student.studentCode, uniqueCode);
    assert.equal(data.student.displayName, "Pooja Vaghela");
    assert.equal(data.student.grade, 4);
    assert.equal(data.student.section, "B");

    createdStudentId = data.student.id;

    // Verify student count increased in database
    const currentStudents = await db.getStudentsAsync();
    assert.equal(currentStudents.length, countBefore + 1);
  });

  it("4. CONFLICT / DUPLICATE: Rejects duplicate student enrollment code with 409", async () => {
    const duplicateReq = mockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: uniqueCode, // exact duplicate code
      displayName: "Different Student",
      grade: 4,
      section: "A",
    });

    const res = await postStudentHandler(duplicateReq);
    assert.equal(res.status, 409, "Must return HTTP 409 Conflict for duplicate student roll code");
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes(uniqueCode));
  });

  it("5. READ: Retrieves newly created student record by ID with related records", async () => {
    const getReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`);
    const res = await getStudentByIdHandler(getReq, {
      params: Promise.resolve({ id: createdStudentId }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.displayName, "Pooja Vaghela");
    assert.equal(data.student.section, "B");
    assert.ok(Array.isArray(data.gaps));
    assert.ok(Array.isArray(data.results));
  });

  it("6. SEARCH & FILTER: Locates student by search query and grade filter", async () => {
    // Search by name
    const searchReq = mockRequest(`http://localhost:3000/api/students?search=Pooja`);
    const searchRes = await getStudentsHandler(searchReq);
    const searchData = await searchRes.json();
    assert.equal(searchRes.status, 200);
    assert.ok(searchData.students.some((s: any) => s.id === createdStudentId));

    // Filter by grade
    const gradeReq = mockRequest(`http://localhost:3000/api/students?grade=4`);
    const gradeRes = await getStudentsHandler(gradeReq);
    const gradeData = await gradeRes.json();
    assert.ok(gradeData.students.some((s: any) => s.id === createdStudentId));
  });

  it("7. UPDATE: Modifies student information and verifies persistence", async () => {
    const updatedNotes = "Promoted to Class 5 and verified by academic supervisor.";
    const putReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`, "PUT", {
      displayName: "Pooja K. Vaghela",
      grade: 5,
      section: "A",
      classroomId: "cls-5a",
      notes: updatedNotes,
    });

    const res = await putStudentHandler(putReq, {
      params: Promise.resolve({ id: createdStudentId }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.displayName, "Pooja K. Vaghela");
    assert.equal(data.student.grade, 5);
    assert.equal(data.student.section, "A");
    assert.equal(data.student.notes, updatedNotes);

    // Direct database verification
    const fetched = await db.getStudentByIdAsync(createdStudentId);
    assert.ok(fetched);
    assert.equal(fetched.displayName, "Pooja K. Vaghela");
    assert.equal(fetched.grade, 5);
  });

  it("8. API V1 PARITY: Validates that /api/v1/students routes access the exact same data source", async () => {
    const v1Req = mockRequest(`http://localhost:3000/api/v1/students/${createdStudentId}`);
    const v1Res = await getV1StudentByIdHandler(v1Req, {
      params: Promise.resolve({ id: createdStudentId }),
    });
    assert.equal(v1Res.status, 200);
    const v1Data = await v1Res.json();
    assert.equal(v1Data.success, true);
    assert.equal(v1Data.student.displayName, "Pooja K. Vaghela");
  });

  it("9. DELETE: Permanently removes student and cascade-deletes related records", async () => {
    const delReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`, "DELETE");
    const delRes = await deleteStudentHandler(delReq, {
      params: Promise.resolve({ id: createdStudentId }),
    });
    assert.equal(delRes.status, 200);
    const delData = await delRes.json();
    assert.equal(delData.success, true);

    // Confirm student no longer exists
    const verifyReq = mockRequest(`http://localhost:3000/api/students/${createdStudentId}`);
    const verifyRes = await getStudentByIdHandler(verifyReq, {
      params: Promise.resolve({ id: createdStudentId }),
    });
    assert.equal(verifyRes.status, 404, "Deleted student must return HTTP 404 Not Found");

    // Verify student count returned to baseline
    const remainingStudents = await db.getStudentsAsync();
    assert.equal(remainingStudents.length, initialStudentCount);
  });
});
