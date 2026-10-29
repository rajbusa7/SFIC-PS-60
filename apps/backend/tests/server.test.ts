import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app";
import type { Server } from "http";

let server: Server;
let baseUrl: string;

describe("ShikshaSetu AI Standalone Express Backend Tests", () => {
  before(() => {
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /api/v1/health returns healthy system status and environment info", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, "healthy");
    assert.ok(data.uptime >= 0);
    assert.ok(data.database);
    assert.ok(data.ai);
  });

  it("POST /api/v1/auth/login authenticates demo teacher", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher@shikshasetu.edu.in" }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.role, "teacher");
  });

  it("GET /api/v1/students returns seeded students list", async () => {
    const res = await fetch(`${baseUrl}/api/v1/students`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.students.length >= 15);
  });

  it("GET /api/v1/students/:id returns specific student details", async () => {
    const res = await fetch(`${baseUrl}/api/v1/students/std-aarav`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.displayName, "Aarav Patel");
    assert.equal(data.student.grade, 4);
  });

  it("GET /api/v1/students/:id/learning-gaps returns gaps for Aarav", async () => {
    const res = await fetch(`${baseUrl}/api/v1/students/std-aarav/learning-gaps`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.learningGaps.length >= 1);
  });

  it("POST /api/v1/learning-gaps/analyze provides deterministic metrics and diagnosis", async () => {
    const res = await fetch(`${baseUrl}/api/v1/learning-gaps/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "std-aarav",
        studentName: "Aarav Patel",
        studentClass: 4,
        subject: "MATH",
        conceptName: "Division Basics",
        marksObtained: 7,
        maximumMarks: 20,
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.analysis.deterministicMetrics.calculatedPercentage, 35);
    assert.equal(data.analysis.deterministicMetrics.masteryStatus, "Needs Support");
  });

  it("POST /api/v1/worksheets/generate returns structured printable questions", async () => {
    const res = await fetch(`${baseUrl}/api/v1/worksheets/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade: 4,
        concept: "Division Basics",
        questionCount: 3,
        language: "en",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.worksheet.questions.length, 3);
  });

  it("GET /api/v1/reports/overview returns complete school analytics metrics", async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/overview`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.report.totalStudents >= 15);
    assert.ok(data.report.masteryDistribution);
    assert.ok(data.report.priorityBreakdown);
  });
});
