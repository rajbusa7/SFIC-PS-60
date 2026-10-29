import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import Next.js route handlers
import { GET as healthHandler } from "@/app/api/v1/health/route";
import { POST as authLoginHandler } from "@/app/api/v1/auth/login/route";
import { GET as studentsHandler } from "@/app/api/v1/students/route";
import { GET as studentIdHandler } from "@/app/api/v1/students/[id]/route";
import { POST as gapAnalyzeHandler } from "@/app/api/v1/learning-gaps/analyze/route";
import { POST as remedialGenHandler } from "@/app/api/v1/remedial-plans/generate/route";
import { POST as worksheetGenHandler } from "@/app/api/v1/worksheets/generate/route";
import { POST as tutorHandler } from "@/app/api/v1/ai/tutor/route";
import { POST as chatHandler } from "@/app/api/v1/ai/chat/route";
import { GET as reportsHandler } from "@/app/api/v1/reports/overview/route";

function createMockRequest(url: string, method: string = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Next.js /api/v1 REST Endpoints Functional Tests", () => {
  it("GET /api/v1/health returns 200 with system health telemetry", async () => {
    const res = await healthHandler();
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, "healthy");
    assert.ok(data.database);
    assert.ok(data.ai);
  });

  it("POST /api/v1/auth/login validates email and authenticates user", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/auth/login", "POST", {
      email: "teacher@shikshasetu.edu.in",
    });
    const res = await authLoginHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.role, "teacher");
  });

  it("GET /api/v1/students returns enrolled student directory", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/students");
    const res = await studentsHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.students.length >= 15);
  });

  it("GET /api/v1/students/[id] returns student profile by id", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/students/std-aarav");
    const res = await studentIdHandler(req, { params: Promise.resolve({ id: "std-aarav" }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.student.displayName, "Aarav Patel");
    assert.equal(data.student.grade, 4);
  });

  it("POST /api/v1/learning-gaps/analyze calculates deterministic 35% and diagnosis", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/learning-gaps/analyze", "POST", {
      studentId: "std-aarav",
      studentName: "Aarav Patel",
      marksObtained: 7,
      maximumMarks: 20,
      conceptName: "Division Basics",
      language: "en",
    });
    const res = await gapAnalyzeHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.analysis.deterministicMetrics.calculatedPercentage, 35);
    assert.equal(data.analysis.deterministicMetrics.masteryStatus, "Needs Support");
  });

  it("POST /api/v1/remedial-plans/generate produces 5-step concrete intervention", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/remedial-plans/generate", "POST", {
      studentId: "std-aarav",
      studentName: "Aarav Patel",
      conceptName: "Division Basics & Equal Sharing",
      latestPercentage: 35,
      language: "en",
    });
    const res = await remedialGenHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.plan.steps.length >= 5);
  });

  it("POST /api/v1/worksheets/generate produces questions with answer keys", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/worksheets/generate", "POST", {
      grade: 4,
      concept: "Division Basics",
      questionCount: 4,
      language: "en",
    });
    const res = await worksheetGenHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.worksheet.questions.length, 4);
    assert.ok(data.worksheet.questions[0].answerKey);
  });

  it("POST /api/v1/ai/tutor supports Gujarati curriculum explanations", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/tutor", "POST", {
      query: "ધોરણ ૪ માં ભાગાકારની સમાન વહેંચણી કેવી રીતે શીખવવી?",
      grade: 4,
      subject: "Mathematics",
      language: "gu",
    });
    const res = await tutorHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.tutorResponse.language, "gu");
  });

  it("POST /api/v1/ai/chat returns authorized classroom guidance", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Give me teaching strategies for struggling learners in Class 4",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.message.length > 20);
  });

  it("GET /api/v1/reports/overview provides school telemetry and distribution", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/reports/overview");
    const res = await reportsHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.report.totalStudents >= 15);
    assert.ok(data.report.subjectPerformance.length > 0);
  });
});
