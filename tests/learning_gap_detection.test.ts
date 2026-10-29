import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/lib/db/database";
import { detectLearningGap } from "@/lib/engine/gapDetection";
import { calculatePercentage } from "@/lib/engine/calculations";
import { GET as getLearningGapsHandler, POST as postLearningGapsHandler } from "@/app/api/learning-gaps/route";
import { DELETE as deleteResultHandler } from "@/app/api/assessments/results/[id]/route";

function createMockRequest(url: string, method: string = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Checklist Point 3: Learning Gap Detection Comprehensive Test Suite", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  // Requirement 2 & 11: Accurate Percentage Calculation & Boundary Values
  describe("1. Boundary Value Analysis (Requirement 11 & Classification Rules)", () => {
    it("Evaluates 0% as 'Needs Support'", () => {
      const pct = calculatePercentage(0, 100);
      assert.equal(pct, 0);

      const detection = detectLearningGap("c-test-1", "Concept Test", [
        { marksObtained: 0, maximumMarks: 100, recordedAt: "2026-10-01" },
      ]);
      assert.equal(detection.latestPercentage, 0);
      assert.equal(detection.masteryStatus, "Needs Support");
      assert.equal(detection.requiresRemediation, true);
      assert.match(detection.reason, /below the operational mastery threshold|foundational intervention/);
    });

    it("Evaluates 59.99% as 'Needs Support' (below 60% threshold)", () => {
      const pct = calculatePercentage(59.99, 100);
      assert.equal(pct, 59.99);

      const detection = detectLearningGap("c-test-2", "Concept Test", [
        { marksObtained: 59.99, maximumMarks: 100, recordedAt: "2026-10-01" },
      ]);
      assert.equal(detection.latestPercentage, 59.99);
      assert.equal(detection.masteryStatus, "Needs Support");
      assert.equal(detection.requiresRemediation, true);
    });

    it("Evaluates 60% as 'Developing' (developing threshold boundary)", () => {
      const pct = calculatePercentage(60, 100);
      assert.equal(pct, 60);

      const detection = detectLearningGap("c-test-3", "Concept Test", [
        { marksObtained: 60, maximumMarks: 100, recordedAt: "2026-10-01" },
      ]);
      assert.equal(detection.latestPercentage, 60);
      assert.equal(detection.masteryStatus, "Developing");
      assert.match(detection.reason, /core basics|Developing/);
    });

    it("Evaluates 79.99% as 'Developing' (below 80% mastery threshold)", () => {
      const pct = calculatePercentage(79.99, 100);
      assert.equal(pct, 79.99);

      const detection = detectLearningGap("c-test-4", "Concept Test", [
        { marksObtained: 79.99, maximumMarks: 100, recordedAt: "2026-10-01" },
      ]);
      assert.equal(detection.latestPercentage, 79.99);
      assert.equal(detection.masteryStatus, "Developing");
      assert.match(detection.reason, /grasped core basics/);
    });

    it("Evaluates 80% as 'Mastered' (mastery threshold met)", () => {
      const pct = calculatePercentage(80, 100);
      assert.equal(pct, 80);

      const detection = detectLearningGap("c-test-5", "Concept Test", [
        { marksObtained: 80, maximumMarks: 100, recordedAt: "2026-10-01" },
      ]);
      assert.equal(detection.latestPercentage, 80);
      assert.equal(detection.masteryStatus, "Mastered");
      assert.match(detection.reason, /achieved 80%|mastery/);
    });

    it("Evaluates 100% as 'Mastered' (perfect score mastery threshold met)", () => {
      const pct = calculatePercentage(100, 100);
      assert.equal(pct, 100);

      const detection = detectLearningGap("c-test-6", "Concept Test", [
        { marksObtained: 100, maximumMarks: 100, recordedAt: "2026-10-01" },
      ]);
      assert.equal(detection.latestPercentage, 100);
      assert.equal(detection.masteryStatus, "Mastered");
      assert.equal(detection.priority, "Low");
      assert.equal(detection.requiresRemediation, false);
    });
  });

  // Requirement 4: Student-and-Competency Level Independence
  describe("2. Competency-Level Independence (Requirement 4)", () => {
    it("Allows the same student to have different mastery statuses across multiple competencies", () => {
      const student = db.getStudents()[0];
      assert.ok(student, "A student must exist in database");

      // Record 3 results for 3 different concepts for the same student
      const concepts = db.getConcepts().slice(0, 3);
      assert.equal(concepts.length, 3, "At least 3 concepts should exist");

      // Concept 1: Needs Support (30%)
      // Concept 2: Developing (70%)
      // Concept 3: Mastered (90%)
      db.recordResults([
        {
          studentId: student.id,
          conceptId: concepts[0].id,
          assessmentId: "asm-comp-1",
          marksObtained: 15,
          maximumMarks: 50, // 30% -> Needs Support
          recordedAt: "2026-10-10T10:00:00Z",
        },
        {
          studentId: student.id,
          conceptId: concepts[1].id,
          assessmentId: "asm-comp-2",
          marksObtained: 35,
          maximumMarks: 50, // 70% -> Developing
          recordedAt: "2026-10-10T10:00:00Z",
        },
        {
          studentId: student.id,
          conceptId: concepts[2].id,
          assessmentId: "asm-comp-3",
          marksObtained: 45,
          maximumMarks: 50, // 90% -> Mastered
          recordedAt: "2026-10-10T10:00:00Z",
        },
      ]);

      const studentGaps = db.getLearningGaps(student.id);

      const gapConcept0 = studentGaps.find((g) => g.conceptId === concepts[0].id);
      const gapConcept1 = studentGaps.find((g) => g.conceptId === concepts[1].id);
      const gapConcept2 = studentGaps.find((g) => g.conceptId === concepts[2].id);

      assert.ok(gapConcept0, "Gap for Concept 0 must exist");
      assert.ok(gapConcept1, "Gap for Concept 1 must exist");
      assert.ok(gapConcept2, "Gap for Concept 2 must exist");

      assert.equal(gapConcept0.masteryStatus, "Needs Support");
      assert.equal(gapConcept0.status, "Active");

      assert.equal(gapConcept1.masteryStatus, "Developing");

      assert.equal(gapConcept2.masteryStatus, "Mastered");
      assert.equal(gapConcept2.status, "Resolved");
    });
  });

  // Requirement 5: Explainability & Gap Information Detail
  describe("3. Detailed Gap Presentation & Explainability (Requirement 5)", () => {
    it("Populates all required metadata: student identifier, name, subject, competency, score, date, threshold, and reason", () => {
      const student = db.getStudents()[0];
      const concept = db.getConcepts()[0];

      db.recordResults([
        {
          studentId: student.id,
          conceptId: concept.id,
          assessmentId: "asm-explain-1",
          marksObtained: 18,
          maximumMarks: 40, // 45% -> Needs Support
          recordedAt: "2026-10-15T09:30:00Z",
        },
      ]);

      const gaps = db.getLearningGaps(student.id);
      const gap = gaps.find((g) => g.conceptId === concept.id);
      assert.ok(gap);

      // Student info
      assert.equal(gap.studentId, student.id);
      assert.equal(gap.studentName, student.displayName);
      assert.equal(gap.studentCode, student.studentCode);
      assert.equal(gap.classroomId, student.classroomId);

      // Subject and competency
      assert.equal(gap.conceptId, concept.id);
      assert.equal(gap.conceptName, concept.name);
      assert.ok(gap.subjectCode);

      // Score and date
      assert.equal(gap.marksObtained, 18);
      assert.equal(gap.maximumMarks, 40);
      assert.equal(gap.latestPercentage, 45);
      assert.equal(gap.assessmentDate, "2026-10-15T09:30:00Z");

      // Classification & thresholds
      assert.equal(gap.masteryStatus, "Needs Support");
      assert.ok(gap.thresholdsUsed);
      assert.equal(gap.thresholdsUsed.developing, 60);
      assert.equal(gap.thresholdsUsed.mastery, 80);

      // Clear deterministic explanation
      assert.ok(gap.reason.length > 10, "Must provide clear, deterministic reason");
      assert.ok(gap.suggestedAction && gap.suggestedAction.length > 10, "Must provide pedagogical action");
    });
  });

  // Requirement 6: Handling Multiple Assessments Chronologically
  describe("4. Multiple Assessment Chronology (Requirement 6)", () => {
    it("Uses latest assessment score for current status, preserves history, and tracks delta percentage points", () => {
      const student = db.addStudent({
        displayName: "Chrono Test Student",
        studentCode: "STU-CHRONO-99",
        classroomId: "cls-4a",
        grade: 4,
        section: "A",
        enrollmentStatus: "active",
      });
      const concept = db.getConcepts()[0];

      // Session 1: Baseline assessment -> 35% (Needs Support)
      db.recordResults([
        {
          studentId: student.id,
          conceptId: concept.id,
          assessmentId: "asm-session-1",
          marksObtained: 7,
          maximumMarks: 20, // 35%
          recordedAt: "2026-10-01T10:00:00Z",
        },
      ]);

      let gaps = db.getLearningGaps(student.id);
      let gap = gaps.find((g) => g.conceptId === concept.id);
      assert.ok(gap);
      assert.equal(gap.latestPercentage, 35);
      assert.equal(gap.masteryStatus, "Needs Support");
      assert.equal(gap.attemptsCount, 1);
      assert.equal(gap.previousPercentage, undefined);
      assert.equal(gap.deltaPercentagePoints, undefined);

      // Session 2: Formative reassessment -> 85% (Mastered)
      db.recordResults([
        {
          studentId: student.id,
          conceptId: concept.id,
          assessmentId: "asm-session-2",
          marksObtained: 17,
          maximumMarks: 20, // 85%
          recordedAt: "2026-10-15T10:00:00Z",
        },
      ]);

      gaps = db.getLearningGaps(student.id);
      gap = gaps.find((g) => g.conceptId === concept.id);
      assert.ok(gap);
      // Latest result determines status
      assert.equal(gap.latestPercentage, 85);
      assert.equal(gap.masteryStatus, "Mastered");
      assert.equal(gap.status, "Resolved");
      assert.equal(gap.attemptsCount, 2);
      // History preserved: baseline was 35%, delta is +50 pp
      assert.equal(gap.previousPercentage, 35);
      assert.equal(gap.deltaPercentagePoints, 50);
      assert.match(gap.reason, /\+50 percentage points/);
    });

    it("Reactivates gap status if performance drops from Mastered back below 60%", () => {
      const student = db.addStudent({
        displayName: "Reactivate Test Student",
        studentCode: "STU-REACT-98",
        classroomId: "cls-4a",
        grade: 4,
        section: "A",
        enrollmentStatus: "active",
      });
      const concept = db.getConcepts()[0];

      // Session 1: Mastered (85%)
      db.recordResults([
        {
          studentId: student.id,
          conceptId: concept.id,
          assessmentId: "asm-cycle-1",
          marksObtained: 85,
          maximumMarks: 100,
          recordedAt: "2026-10-01T10:00:00Z",
        },
      ]);

      let gap = db.getLearningGaps(student.id).find((g) => g.conceptId === concept.id);
      assert.ok(gap);
      assert.equal(gap.masteryStatus, "Mastered");
      assert.equal(gap.status, "Resolved");

      // Session 2: Performance drops to 45% (Needs Support)
      db.recordResults([
        {
          studentId: student.id,
          conceptId: concept.id,
          assessmentId: "asm-cycle-2",
          marksObtained: 45,
          maximumMarks: 100,
          recordedAt: "2026-10-15T10:00:00Z",
        },
      ]);

      gap = db.getLearningGaps(student.id).find((g) => g.conceptId === concept.id);
      assert.ok(gap);
      assert.equal(gap.latestPercentage, 45);
      assert.equal(gap.masteryStatus, "Needs Support");
      assert.equal(gap.status, "Active", "Gap must transition back to Active when score drops < 60%");
    });
  });

  // Requirement 7: Elimination of Stale / Duplicate Gap Records on Deletion
  describe("5. Lifecycle & Stale Gap Elimination (Requirement 7)", () => {
    it("Eliminates stale gap records when student assessment results are deleted", async () => {
      const student = db.getStudents()[0];
      const concept = db.getConcepts()[0];

      // Create a result that flags a gap
      const [result] = db.recordResults([
        {
          studentId: student.id,
          conceptId: concept.id,
          assessmentId: "asm-del-test",
          marksObtained: 20,
          maximumMarks: 100, // 20%
          recordedAt: "2026-10-20T10:00:00Z",
        },
      ]);

      let gap = db.getLearningGaps(student.id).find((g) => g.conceptId === concept.id);
      assert.ok(gap, "Gap must be created after recording result");

      // Delete the result
      const req = createMockRequest(`http://localhost/api/assessments/results/${result.id}`, "DELETE");
      const res = await deleteResultHandler(req, { params: Promise.resolve({ id: result.id }) });
      const data = await res.json();
      assert.equal(data.success, true);

      // Check if stale gap record was cleanly eliminated
      const remainingGaps = db.getLearningGaps(student.id).filter((g) => g.conceptId === concept.id);
      const remainingResults = db.getResults(student.id, concept.id);

      if (remainingResults.length === 0) {
        assert.equal(remainingGaps.length, 0, "Stale gap must be eliminated when no results remain for the concept");
      }
    });
  });

  // Requirement 8: Filters Support in Database and API
  describe("6. Filters for Subject, Class, Competency, and Status (Requirement 8)", () => {
    it("Filters gaps by classroomId, subjectCode, priority, and status via API", async () => {
      const req = createMockRequest("http://localhost/api/learning-gaps?subjectCode=MATH&priority=High");
      const res = await getLearningGapsHandler(req);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.gaps));

      for (const g of data.gaps) {
        assert.equal(g.subjectCode, "MATH");
        assert.equal(g.priority, "High");
      }
    });

    it("Filters gaps by classroomId correctly", () => {
      const classGaps = db.getLearningGaps({ classroomId: "cls-3a" });
      for (const g of classGaps) {
        assert.equal(g.classroomId, "cls-3a");
      }
    });
  });

  // Requirement 12: Protection & Validation
  describe("7. Input Validation & Protection (Requirement 12)", () => {
    it("Rejects POST /api/learning-gaps with missing or invalid studentId", async () => {
      const req = createMockRequest("http://localhost/api/learning-gaps", "POST", {});
      const res = await postLearningGapsHandler(req);
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.error, /studentId is required/i);
    });

    it("Rejects recalculation for nonexistent studentId", async () => {
      const req = createMockRequest("http://localhost/api/learning-gaps", "POST", {
        studentId: "nonexistent-student-xyz",
      });
      const res = await postLearningGapsHandler(req);
      const data = await res.json();

      assert.equal(res.status, 404);
      assert.equal(data.success, false);
      assert.match(data.error, /Student not found/i);
    });
  });
});
