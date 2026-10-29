import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

// Import route handlers
import { GET as getStudentsHandler, POST as postStudentHandler } from "@/app/api/students/route";
import {
  GET as getStudentByIdHandler,
  PUT as putStudentHandler,
  DELETE as deleteStudentHandler,
} from "@/app/api/students/[id]/route";
import { db } from "@/lib/db/database";

function createMockRequest(url: string, method: string = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Checklist Point 1: Student Directory Comprehensive Integration Tests", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  it("1. GET /api/students returns real persistent student records", async () => {
    const req = createMockRequest("http://localhost:3000/api/students");
    const res = await getStudentsHandler(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.count >= 15);
    assert.equal(data.students.length, data.count);

    // Verify record has expected real fields
    const aarav = data.students.find((s: any) => s.id === "std-aarav");
    assert.ok(aarav);
    assert.equal(aarav.displayName, "Aarav Patel");
    assert.equal(aarav.studentCode, "MPS-4A-01");
    assert.equal(aarav.grade, 4);
    assert.equal(aarav.section, "A");
    assert.equal(aarav.enrollmentStatus, "active");
  });

  it("2. POST /api/students registers a new student with valid fields", async () => {
    const newStudentCode = `MPS-4A-TEST-${Date.now().toString().slice(-4)}`;
    const req = createMockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: newStudentCode,
      displayName: "Priya Solanki",
      grade: 4,
      section: "A",
      notes: "Excels in mental math; enthusiastic learner.",
      enrollmentStatus: "active",
    });

    const res = await postStudentHandler(req);
    assert.equal(res.status, 201);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.student.id);
    assert.equal(data.student.displayName, "Priya Solanki");
    assert.equal(data.student.studentCode, newStudentCode);
    assert.equal(data.student.grade, 4);
    assert.equal(data.student.section, "A");
    assert.equal(data.student.classroomId, "cls-4a");
    assert.equal(data.student.enrollmentStatus, "active");
    assert.equal(data.student.notes, "Excels in mental math; enthusiastic learner.");

    // Verify it is now present in db
    const retrieved = db.getStudentById(data.student.id);
    assert.ok(retrieved);
    assert.equal(retrieved.studentCode, newStudentCode);
  });

  it("3. POST /api/students validates required fields and rejects invalid data", async () => {
    // Missing display name
    const req1 = createMockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: "MPS-4A-INVALID",
      grade: 4,
      section: "A",
    });
    const res1 = await postStudentHandler(req1);
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.equal(data1.success, false);
    assert.match(data1.error, /name is required/i);

    // Missing student code
    const req2 = createMockRequest("http://localhost:3000/api/students", "POST", {
      displayName: "No Code Student",
      grade: 4,
      section: "A",
    });
    const res2 = await postStudentHandler(req2);
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.equal(data2.success, false);
    assert.match(data2.error, /code \/ id is required/i);

    // Invalid grade
    const req3 = createMockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: "MPS-9A-01",
      displayName: "Invalid Grade Student",
      grade: 9,
      section: "A",
    });
    const res3 = await postStudentHandler(req3);
    assert.equal(res3.status, 400);
    const data3 = await res3.json();
    assert.equal(data3.success, false);
    assert.match(data3.error, /grade must be an integer between 1 and 5/i);
  });

  it("4. POST /api/students prevents duplicate student IDs (409 Conflict)", async () => {
    // Attempt to register with Aarav's existing code
    const req = createMockRequest("http://localhost:3000/api/students", "POST", {
      studentCode: "MPS-4A-01", // Duplicate!
      displayName: "Another Student",
      grade: 4,
      section: "A",
    });

    const res = await postStudentHandler(req);
    assert.equal(res.status, 409);

    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /already exists/i);
  });

  it("5. GET /api/students/[id] retrieves full details of a student", async () => {
    const req = createMockRequest("http://localhost:3000/api/students/std-aarav");
    const res = await getStudentByIdHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.id, "std-aarav");
    assert.equal(data.student.displayName, "Aarav Patel");
    assert.ok(Array.isArray(data.gaps));
    assert.ok(Array.isArray(data.results));
    assert.ok(Array.isArray(data.remedialPlans));
  });

  it("6. GET /api/students/[id] returns 404 for nonexistent student", async () => {
    const req = createMockRequest("http://localhost:3000/api/students/non-existent-id");
    const res = await getStudentByIdHandler(req, {
      params: Promise.resolve({ id: "non-existent-id" }),
    });
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it("7. PUT /api/students/[id] updates existing student records", async () => {
    const req = createMockRequest("http://localhost:3000/api/students/std-aarav", "PUT", {
      displayName: "Aarav K. Patel",
      notes: "Updated teacher observation: great improvement after remedial plan.",
      grade: 4,
      section: "B",
    });

    const res = await putStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.displayName, "Aarav K. Patel");
    assert.equal(data.student.section, "B");
    assert.equal(data.student.classroomId, "cls-4b");
    assert.equal(data.student.notes, "Updated teacher observation: great improvement after remedial plan.");

    // Verify in db
    const updated = db.getStudentById("std-aarav");
    assert.equal(updated?.displayName, "Aarav K. Patel");
    assert.equal(updated?.section, "B");
  });

  it("8. PUT /api/students/[id] prevents duplicate student ID collision on update", async () => {
    // Try to update Diya's code (MPS-4A-02) to match Aarav's code (MPS-4A-01)
    const req = createMockRequest("http://localhost:3000/api/students/std-diya", "PUT", {
      studentCode: "MPS-4A-01", // taken by Aarav!
    });

    const res = await putStudentHandler(req, { params: Promise.resolve({ id: "std-diya" }) });
    assert.equal(res.status, 409);

    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /already in use/i);
  });

  it("9. PUT /api/students/[id] allows archiving student via enrollment status", async () => {
    const req = createMockRequest("http://localhost:3000/api/students/std-diya", "PUT", {
      enrollmentStatus: "transferred",
    });

    const res = await putStudentHandler(req, { params: Promise.resolve({ id: "std-diya" }) });
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.enrollmentStatus, "transferred");

    const retrieved = db.getStudentById("std-diya");
    assert.equal(retrieved?.enrollmentStatus, "transferred");
  });

  it("10. DELETE /api/students/[id] removes student and cascades to associated records", async () => {
    // Aarav has gaps and results
    assert.ok(db.getLearningGaps("std-aarav").length > 0);
    assert.ok(db.getResults("std-aarav").length > 0);

    const req = createMockRequest("http://localhost:3000/api/students/std-aarav", "DELETE");
    const res = await deleteStudentHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);

    // Verify student is gone
    assert.equal(db.getStudentById("std-aarav"), undefined);

    // Verify cascading deletion: gap analyses and results are purged
    assert.equal(db.getLearningGaps("std-aarav").length, 0);
    assert.equal(db.getResults("std-aarav").length, 0);
    assert.equal(db.getRemedialPlans("std-aarav").length, 0);
  });

  it("11. DELETE /api/students/[id] returns 404 for nonexistent student", async () => {
    const req = createMockRequest("http://localhost:3000/api/students/non-existent-student", "DELETE");
    const res = await deleteStudentHandler(req, {
      params: Promise.resolve({ id: "non-existent-student" }),
    });
    assert.equal(res.status, 404);
  });

  it("12. Persistence across restarts: file backing in data/shikshasetu_store.json", () => {
    const testCode = `MPS-4A-PERSIST-${Date.now().toString().slice(-4)}`;
    const student = db.addStudent({
      studentCode: testCode,
      displayName: "Persistence Test Student",
      classroomId: "cls-4a",
      grade: 4,
      section: "A",
      enrollmentStatus: "active",
      notes: "Testing file persistence",
    });

    // Check file on disk directly
    const storePath = path.join(process.cwd(), "data", "shikshasetu_store.json");
    assert.ok(fs.existsSync(storePath), "Store file must exist on disk");

    let diskContent = "";
    for (let i = 0; i < 5; i++) {
      try {
        diskContent = fs.readFileSync(storePath, "utf-8");
        break;
      } catch (err: any) {
        if (err.code === "EBUSY" && i < 4) {
          const start = Date.now();
          while (Date.now() - start < 20) {}
          continue;
        }
        throw err;
      }
    }
    const diskStore = JSON.parse(diskContent);
    const foundOnDisk = diskStore.students.find((s: any) => s.id === student.id);

    assert.ok(foundOnDisk, "Student must be written to disk in shikshasetu_store.json");
    assert.equal(foundOnDisk.studentCode, testCode);
    assert.equal(foundOnDisk.displayName, "Persistence Test Student");
  });
});
