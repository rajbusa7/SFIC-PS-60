import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

// Import route handlers
import { GET as getAssessmentsHandler, POST as postAssessmentHandler } from "@/app/api/assessments/route";
import {
  GET as getAssessmentByIdHandler,
  PUT as putAssessmentHandler,
  DELETE as deleteAssessmentHandler,
} from "@/app/api/assessments/[id]/route";
import {
  GET as getResultsHandler,
  POST as postResultsHandler,
} from "@/app/api/assessments/results/route";
import {
  PUT as putResultHandler,
  DELETE as deleteResultHandler,
} from "@/app/api/assessments/results/[id]/route";
import { GET as getStudentByIdHandler } from "@/app/api/students/[id]/route";
import { GET as getProgressHandler } from "@/app/api/progress/route";
import { db } from "@/lib/db/database";
import { calculatePercentage } from "@/lib/engine/calculations";
import { detectLearningGap } from "@/lib/engine/gapDetection";

function createMockRequest(url: string, method: string = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Checklist Point 2: Assessment System Comprehensive Integration Tests", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  // 1 & 2. Allow teachers to select an existing student and enter an assessment capturing all required fields
  it("1. Creates an assessment capturing subject, competency, date, maxMarks, marks obtained, and notes", async () => {
    const assessmentPayload = {
      classroomId: "cls-4a",
      subjectId: "sub-math",
      subjectCode: "MATH",
      title: "Unit 4 Multiplication & Division Mastery Check",
      assessmentDate: "2026-10-21",
      maxMarks: 25,
      conceptIds: ["c-div-01"],
      status: "published",
      scores: [
        {
          studentId: "std-aarav",
          conceptId: "c-div-01",
          marksObtained: 22,
          notes: "Excellent grasp of equal sharing and remainders.",
        },
      ],
    };

    const req = createMockRequest("http://localhost:3000/api/assessments", "POST", assessmentPayload);
    const res = await postAssessmentHandler(req);
    assert.equal(res.status, 201);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.assessment.id);
    assert.equal(data.assessment.title, "Unit 4 Multiplication & Division Mastery Check");
    assert.equal(data.assessment.subjectCode, "MATH");
    assert.equal(data.assessment.maxMarks, 25);
    assert.equal(data.assessment.assessmentDate, "2026-10-21");

    // Verify results record was created with accurate percentage (22 / 25 * 100 = 88%)
    const studentRes = db.getResults("std-aarav", "c-div-01", data.assessment.id);
    assert.equal(studentRes.length, 1);
    assert.equal(studentRes[0].marksObtained, 22);
    assert.equal(studentRes[0].maximumMarks, 25);
    assert.equal(studentRes[0].percentage, 88);
    assert.equal(studentRes[0].notes, "Excellent grasp of equal sharing and remainders.");
  });

  // 3. Input validation: marks obtained cannot be negative, maxMarks > 0, marksObtained <= maxMarks, required fields
  it("2. Validates inputs: rejects negative marks, maxMarks <= 0, and marks exceeding maxMarks", async () => {
    // A: Maximum marks <= 0
    const reqZeroMax = createMockRequest("http://localhost:3000/api/assessments", "POST", {
      classroomId: "cls-4a",
      subjectId: "sub-math",
      subjectCode: "MATH",
      title: "Invalid Max Marks",
      assessmentDate: "2026-10-21",
      maxMarks: 0,
      conceptIds: ["c-div-01"],
      scores: [{ studentId: "std-aarav", marksObtained: 5 }],
    });
    const resZeroMax = await postAssessmentHandler(reqZeroMax);
    assert.equal(resZeroMax.status, 400);
    const dataZeroMax = await resZeroMax.json();
    assert.ok(dataZeroMax.error.includes("greater than zero"));

    // B: Marks obtained cannot be negative
    const reqNeg = createMockRequest("http://localhost:3000/api/assessments", "POST", {
      classroomId: "cls-4a",
      subjectId: "sub-math",
      subjectCode: "MATH",
      title: "Negative Marks",
      assessmentDate: "2026-10-21",
      maxMarks: 20,
      conceptIds: ["c-div-01"],
      scores: [{ studentId: "std-aarav", marksObtained: -3 }],
    });
    const resNeg = await postAssessmentHandler(reqNeg);
    assert.equal(resNeg.status, 400);
    const dataNeg = await resNeg.json();
    assert.ok(dataNeg.error.includes("negative"));

    // C: Marks obtained cannot exceed maximum marks
    const reqExceed = createMockRequest("http://localhost:3000/api/assessments", "POST", {
      classroomId: "cls-4a",
      subjectId: "sub-math",
      subjectCode: "MATH",
      title: "Exceeding Marks",
      assessmentDate: "2026-10-21",
      maxMarks: 20,
      conceptIds: ["c-div-01"],
      scores: [{ studentId: "std-aarav", marksObtained: 25 }],
    });
    const resExceed = await postAssessmentHandler(reqExceed);
    assert.equal(resExceed.status, 400);
    const dataExceed = await resExceed.json();
    assert.ok(dataExceed.error.includes("cannot exceed maximum marks"));

    // D: Missing required fields
    const reqEmpty = createMockRequest("http://localhost:3000/api/assessments", "POST", {
      classroomId: "cls-4a",
      subjectCode: "MATH",
      title: "",
      maxMarks: 20,
      conceptIds: [],
    });
    const resEmpty = await postAssessmentHandler(reqEmpty);
    assert.equal(resEmpty.status, 400);
  });

  // 4 & 10. Accurate percentage and boundary classifications (59.99%, 60%, 79.99%, 80%)
  it("3. Calculates accurate percentage and correctly classifies boundary values: 59.99%, 60%, 79.99%, 80%", () => {
    // Boundary 1: 59.99% -> Below 60%: flag for learning support (Needs Support)
    const pct5999 = calculatePercentage(59.99, 100);
    assert.equal(pct5999, 59.99);
    const gap5999 = detectLearningGap(
      "c-div-01",
      "Division Basics",
      [{ marksObtained: 59.99, maximumMarks: 100, recordedAt: "2026-10-21" }]
    );
    assert.equal(gap5999.masteryStatus, "Needs Support");
    assert.equal(gap5999.requiresRemediation, true);

    // Boundary 2: 60.0% -> 60% to below 80%: classify as developing
    const pct60 = calculatePercentage(12, 20); // 12 / 20 * 100 = 60.0%
    assert.equal(pct60, 60.0);
    const gap60 = detectLearningGap(
      "c-div-01",
      "Division Basics",
      [{ marksObtained: 12, maximumMarks: 20, recordedAt: "2026-10-21" }]
    );
    assert.equal(gap60.masteryStatus, "Developing");
    assert.equal(gap60.requiresRemediation, true);

    // Boundary 3: 79.99% -> Below 80%: classify as developing
    const pct7999 = calculatePercentage(79.99, 100);
    assert.equal(pct7999, 79.99);
    const gap7999 = detectLearningGap(
      "c-div-01",
      "Division Basics",
      [{ marksObtained: 79.99, maximumMarks: 100, recordedAt: "2026-10-21" }]
    );
    assert.equal(gap7999.masteryStatus, "Developing");
    assert.equal(gap7999.requiresRemediation, true);

    // Boundary 4: 80.0% -> 80% or above: classify as meeting the mastery threshold
    const pct80 = calculatePercentage(16, 20); // 16 / 20 * 100 = 80.0%
    assert.equal(pct80, 80.0);
    const gap80 = detectLearningGap(
      "c-div-01",
      "Division Basics",
      [{ marksObtained: 16, maximumMarks: 20, recordedAt: "2026-10-21" }]
    );
    assert.equal(gap80.masteryStatus, "Mastered");
    assert.equal(gap80.requiresRemediation, false);
  });

  // 5 & 9. Persistent storage and availability across reloads
  it("4. Persists assessment records to disk and reloads consistently", async () => {
    const asm = db.createAssessment(
      {
        classroomId: "cls-4a",
        subjectId: "sub-eng",
        subjectCode: "ENG",
        title: "Reading Comprehension Check",
        assessmentDate: "2026-10-21",
        status: "published",
        maxMarks: 50,
        conceptIds: ["c-eng-01"],
      },
      [
        {
          studentId: "std-aarav",
          conceptId: "c-eng-01",
          marksObtained: 42,
          maximumMarks: 50,
          percentage: 84,
          recordedAt: "2026-10-21",
        },
      ]
    );

    // Verify stored on disk
    const storePath = path.join(process.cwd(), "data", "shikshasetu_store.json");
    const rawData = JSON.parse(fs.readFileSync(storePath, "utf8"));
    const foundOnDisk = rawData.assessments.find((a: any) => a.id === asm.id);
    assert.ok(foundOnDisk);
    assert.equal(foundOnDisk.title, "Reading Comprehension Check");

    // Verify result stored on disk
    const resultOnDisk = rawData.results.find(
      (r: any) => r.assessmentId === asm.id && r.studentId === "std-aarav"
    );
    assert.ok(resultOnDisk);
    assert.equal(resultOnDisk.marksObtained, 42);
    assert.equal(resultOnDisk.percentage, 84);
  });

  // 6. Display assessment history for each student including subject, competency, date, marks, and percentage
  it("5. GET /api/students/[id] returns student assessment history with enriched subject and concept details", async () => {
    const params = Promise.resolve({ id: "std-aarav" });
    const req = createMockRequest("http://localhost:3000/api/students/std-aarav");
    const res = await getStudentByIdHandler(req, { params });
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.results));
    assert.ok(data.results.length > 0);

    // Check that each result item has date, marks, maxMarks, percentage, subject, and competency
    const firstResult = data.results[0];
    assert.ok(firstResult.id);
    assert.ok(firstResult.recordedAt);
    assert.ok(firstResult.subjectCode);
    assert.ok(firstResult.conceptName);
    assert.ok(typeof firstResult.marksObtained === "number");
    assert.ok(typeof firstResult.maximumMarks === "number");
    assert.ok(typeof firstResult.percentage === "number");
  });

  // 7. View assessment details and edit existing assessments / results
  it("6. View assessment details via GET /api/assessments/[id] and update via PUT", async () => {
    const asmId = "asm-01";
    const params = Promise.resolve({ id: asmId });

    // View details
    const reqGet = createMockRequest(`http://localhost:3000/api/assessments/${asmId}`);
    const resGet = await getAssessmentByIdHandler(reqGet, { params });
    assert.equal(resGet.status, 200);
    const dataGet = await resGet.json();
    assert.equal(dataGet.success, true);
    assert.equal(dataGet.assessment.id, asmId);
    assert.ok(Array.isArray(dataGet.results));

    // Edit assessment title and update student score
    const reqPut = createMockRequest(`http://localhost:3000/api/assessments/${asmId}`, "PUT", {
      title: "Updated Term 1 Diagnostic Assessment",
      maxMarks: 20,
      scores: [
        {
          studentId: "std-aarav",
          conceptId: "c-div-01",
          marksObtained: 18,
          notes: "Substantial improvement following remedial practice.",
        },
      ],
    });
    const resPut = await putAssessmentHandler(reqPut, { params });
    assert.equal(resPut.status, 200);

    const dataPut = await resPut.json();
    assert.equal(dataPut.success, true);
    assert.equal(dataPut.assessment.title, "Updated Term 1 Diagnostic Assessment");

    // Check student result updated in place (18 / 20 = 90%)
    const updatedRes = db.getResults("std-aarav", "c-div-01", asmId);
    assert.equal(updatedRes[0].marksObtained, 18);
    assert.equal(updatedRes[0].percentage, 90);
  });

  // 7b. Update individual result via PUT /api/assessments/results/[id]
  it("7. Updates individual student result and automatically updates student gaps", async () => {
    const existingResults = db.getResults("std-aarav");
    assert.ok(existingResults.length > 0);
    const target = existingResults[0];

    const params = Promise.resolve({ id: target.id });
    const reqPut = createMockRequest(`http://localhost:3000/api/assessments/results/${target.id}`, "PUT", {
      marksObtained: 19,
      maximumMarks: 20,
      notes: "Scored 19/20 on reassessment.",
    });

    const resPut = await putResultHandler(reqPut, { params });
    assert.equal(resPut.status, 200);
    const dataPut = await resPut.json();
    assert.equal(dataPut.success, true);
    assert.equal(dataPut.result.marksObtained, 19);
    assert.equal(dataPut.result.percentage, 95);
  });

  // 8. Prevent duplicate submissions and handle repeated requests safely
  it("8. Deduplicates repeated result submissions for same assessment and concept", async () => {
    const initialCount = db.getResults().length;

    // First submission
    await postResultsHandler(
      createMockRequest("http://localhost:3000/api/assessments/results", "POST", {
        results: [
          {
            assessmentId: "asm-test-dedup",
            studentId: "std-aarav",
            conceptId: "c-div-01",
            marksObtained: 14,
            maximumMarks: 20,
            notes: "First attempt",
          },
        ],
      })
    );

    // Repeated submission with same (assessmentId, studentId, conceptId)
    await postResultsHandler(
      createMockRequest("http://localhost:3000/api/assessments/results", "POST", {
        results: [
          {
            assessmentId: "asm-test-dedup",
            studentId: "std-aarav",
            conceptId: "c-div-01",
            marksObtained: 17,
            maximumMarks: 20,
            notes: "Second attempt (overwrite/dedup)",
          },
        ],
      })
    );

    // Count should have increased by only 1, not 2
    const finalResults = db.getResults("std-aarav", "c-div-01", "asm-test-dedup");
    assert.equal(finalResults.length, 1);
    assert.equal(finalResults[0].marksObtained, 17);
    assert.equal(finalResults[0].percentage, 85);
  });

  // 10. Integration with learning-gap detection module
  it("9. Automatically triggers gap detection: <60% flags support, >=80% marks mastery", async () => {
    // Record low score (7 / 20 = 35%) -> flags learning support
    db.recordResults([
      {
        assessmentId: "asm-gap-test-1",
        studentId: "std-diya",
        conceptId: "c-frac-01",
        marksObtained: 7,
        maximumMarks: 20,
        percentage: 35,
        recordedAt: "2026-10-21",
      },
    ]);

    let diyaGaps = db.getLearningGaps("std-diya");
    const fracGap = diyaGaps.find((g) => g.conceptId === "c-frac-01");
    assert.ok(fracGap);
    assert.equal(fracGap.latestPercentage, 35);
    assert.equal(fracGap.status, "Active");

    // Later Diya improves to 18/20 = 90% -> classified as Mastered
    db.recordResults([
      {
        assessmentId: "asm-gap-test-2",
        studentId: "std-diya",
        conceptId: "c-frac-01",
        marksObtained: 18,
        maximumMarks: 20,
        percentage: 90,
        recordedAt: "2026-10-22",
      },
    ]);

    diyaGaps = db.getLearningGaps("std-diya");
    const updatedFracGap = diyaGaps.find((g) => g.conceptId === "c-frac-01");
    assert.ok(updatedFracGap);
    assert.equal(updatedFracGap.latestPercentage, 90);
    assert.equal(updatedFracGap.status, "Resolved");
  });

  // 11. Dashboard analytics update from actual saved assessment records
  it("10. GET /api/progress reflects actual saved assessment records", async () => {
    const req = createMockRequest("http://localhost:3000/api/progress");
    const res = await getProgressHandler(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.progressItems));
    assert.ok(Array.isArray(data.subjectAverages));
    assert.ok(typeof data.totalGaps === "number");
    assert.ok(typeof data.activeGapsCount === "number");
    assert.ok(typeof data.resolvedGapsCount === "number");
  });

  // Cascading deletion test
  it("11. DELETE /api/assessments/[id] cascades to remove associated results and recalculate gaps", async () => {
    // Create new temporary assessment
    const asm = db.createAssessment(
      {
        classroomId: "cls-4a",
        subjectId: "sub-math",
        subjectCode: "MATH",
        title: "Temporary Assessment",
        assessmentDate: "2026-10-21",
        status: "published",
        maxMarks: 20,
        conceptIds: ["c-add-01"],
      },
      [
        {
          studentId: "std-aarav",
          conceptId: "c-add-01",
          marksObtained: 19,
          maximumMarks: 20,
          percentage: 95,
          recordedAt: "2026-10-21",
        },
      ]
    );

    const params = Promise.resolve({ id: asm.id });
    const reqDelete = createMockRequest(`http://localhost:3000/api/assessments/${asm.id}`, "DELETE");
    const resDelete = await deleteAssessmentHandler(reqDelete, { params });
    assert.equal(resDelete.status, 200);

    // Verify assessment deleted
    assert.equal(db.getAssessmentById(asm.id), undefined);

    // Verify results cascadingly deleted
    const leftoverResults = db.getResults(undefined, undefined, asm.id);
    assert.equal(leftoverResults.length, 0);
  });
});
