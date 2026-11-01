import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import {
  calculatePrePostImprovement,
  evaluateAssessmentComparability,
  calculateRelativeImprovement,
  calculatePercentagePointDelta,
} from "../src/lib/engine/calculations";
import { improvementService } from "../apps/backend/src/services/improvementService";

describe("Pre-Test vs Post-Test Learning Improvement Tracking - Verification Suite", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  after(() => {
    db.resetToDemoData();
  });

  it("Scenario 1: Student whose score improves (Empirical growth +50 pp)", () => {
    // std-aarav on Division (c-div-01): Pre-test was 8/20 (40%) and 7/20 (35%)
    // Follow-up post-test: 17/20 (85%)
    const { result, improvement } = db.recordFollowUpAssessment({
      studentId: "std-aarav",
      conceptId: "c-div-01",
      assessmentId: "asm-post-div-01",
      marksObtained: 17,
      maximumMarks: 20,
      notes: "Post-remediation assessment after CRA manipulative drills.",
      assessmentDate: "2026-10-20",
    });

    assert.ok(result);
    assert.equal(result.marksObtained, 17);
    assert.equal(result.percentage, 85);

    assert.ok(improvement);
    assert.equal(improvement.studentId, "std-aarav");
    assert.equal(improvement.conceptId, "c-div-01");
    assert.equal(improvement.preTest.percentage, 40); // Initial baseline was 40% (res-aarav-01)
    assert.equal(improvement.postTest?.percentage, 85);
    assert.equal(improvement.deltaPercentagePoints, 45); // 85 - 40 = +45 pp
    assert.equal(improvement.status, "Improvement observed");
    assert.equal(improvement.comparabilityStatus, "comparable");
    assert.ok(improvement.relativeImprovementPercentage !== null);
    assert.ok(improvement.relativeImprovementPercentage! > 0);
    assert.ok(improvement.causalAttributionDisclaimer.includes("Pedagogical progress must be evaluated holistically"));
  });

  it("Scenario 2: Student whose score remains unchanged (Stable performance, 0 pp delta)", () => {
    // Record baseline: 10/25 = 40%
    db.recordResults([
      {
        assessmentId: "asm-stable-pre",
        studentId: "std-meera",
        conceptId: "c-mult-01",
        marksObtained: 10,
        maximumMarks: 25,
        percentage: 40,
        recordedAt: "2026-09-01T10:00:00Z",
      },
    ]);

    // Record follow-up: 10/25 = 40%
    const { improvement } = db.recordFollowUpAssessment({
      studentId: "std-meera",
      conceptId: "c-mult-01",
      assessmentId: "asm-stable-post",
      marksObtained: 10,
      maximumMarks: 25,
      assessmentDate: "2026-09-20",
    });

    assert.equal(improvement.preTest.percentage, 40);
    assert.equal(improvement.postTest?.percentage, 40);
    assert.equal(improvement.deltaPercentagePoints, 0);
    assert.equal(improvement.relativeImprovementPercentage, 0);
    assert.equal(improvement.status, "No measurable change");
  });

  it("Scenario 3: Student whose score declines (Performance declined by -20 pp)", () => {
    // Record baseline: 15/20 = 75%
    db.recordResults([
      {
        assessmentId: "asm-decline-pre",
        studentId: "std-dev",
        conceptId: "c-place-01",
        marksObtained: 15,
        maximumMarks: 20,
        percentage: 75,
        recordedAt: "2026-09-05T10:00:00Z",
      },
    ]);

    // Record follow-up: 11/20 = 55%
    const { improvement } = db.recordFollowUpAssessment({
      studentId: "std-dev",
      conceptId: "c-place-01",
      assessmentId: "asm-decline-post",
      marksObtained: 11,
      maximumMarks: 20,
      assessmentDate: "2026-09-25",
    });

    assert.equal(improvement.preTest.percentage, 75);
    assert.equal(improvement.postTest?.percentage, 55);
    assert.equal(improvement.deltaPercentagePoints, -20);
    assert.ok(improvement.relativeImprovementPercentage! < 0);
    assert.equal(improvement.status, "Performance declined");
  });

  it("Scenario 4: Zero baseline score handled safely without division by zero", () => {
    const evaluation = calculatePrePostImprovement({
      preTest: {
        conceptId: "c-frac-01",
        marksObtained: 0,
        maximumMarks: 20,
        percentage: 0,
        assessmentDate: "2026-09-01",
      },
      postTest: {
        conceptId: "c-frac-01",
        marksObtained: 10,
        maximumMarks: 20,
        percentage: 50,
        assessmentDate: "2026-09-18",
      },
    });

    assert.equal(evaluation.deltaPercentagePoints, 50);
    // Relative improvement must be null (undefined for zero baseline) and flagged in notes
    assert.equal(evaluation.relativeImprovementPercentage, null);
    assert.ok(evaluation.comparabilityNotes.includes("mathematically undefined"));
    assert.equal(evaluation.status, "Improvement observed");
  });

  it("Scenario 5: Missing pre-test data (Student has no assessments for concept)", () => {
    const result = db.evaluateStudentImprovement("std-aarav", "c-nonexistent-concept");
    assert.equal(result, null);
  });

  it("Scenario 6: Missing post-test data (Awaiting post-test)", () => {
    // Diya Sharma only has baseline assessment for Place Value (c-place-01)
    const improvement = db.evaluateStudentImprovement("std-diya", "c-place-01");
    assert.ok(improvement);
    assert.ok(improvement.preTest);
    assert.equal(improvement.postTest, undefined);
    assert.equal(improvement.deltaPercentagePoints, null);
    assert.equal(improvement.relativeImprovementPercentage, null);
    assert.equal(improvement.status, "Awaiting post-test");
  });

  it("Scenario 7: Different maximum marks normalized accurately (15 marks vs 20 marks)", () => {
    // Pre-test: 6 out of 15 = 40%
    // Post-test: 16 out of 20 = 80%
    const evaluation = calculatePrePostImprovement({
      preTest: {
        conceptId: "c-div-01",
        marksObtained: 6,
        maximumMarks: 15,
        percentage: 40,
        assessmentDate: "2026-09-01",
      },
      postTest: {
        conceptId: "c-div-01",
        marksObtained: 16,
        maximumMarks: 20,
        percentage: 80,
        assessmentDate: "2026-09-20",
      },
    });

    assert.equal(evaluation.deltaPercentagePoints, 40); // 80% - 40% = +40 pp
    assert.equal(evaluation.relativeImprovementPercentage, 100); // ((80 - 40) / 40) * 100 = 100%
    assert.equal(evaluation.status, "Improvement observed");
    assert.equal(evaluation.comparabilityStatus, "comparable");
  });

  it("Scenario 8: Different competencies flagged as not comparable and rejected", () => {
    const comp = evaluateAssessmentComparability(
      { conceptId: "c-div-01", maximumMarks: 20 },
      { conceptId: "c-mult-01", maximumMarks: 20 }
    );

    assert.equal(comp.isComparable, false);
    assert.equal(comp.status, "not_comparable");
    assert.ok(comp.notes.includes("different competencies"));

    const evaluation = calculatePrePostImprovement({
      preTest: { conceptId: "c-div-01", marksObtained: 8, maximumMarks: 20, percentage: 40 },
      postTest: { conceptId: "c-mult-01", marksObtained: 16, maximumMarks: 20, percentage: 80 },
    });

    assert.equal(evaluation.status, "Insufficient evidence");
    assert.equal(evaluation.deltaPercentagePoints, null);
    assert.equal(evaluation.comparabilityStatus, "not_comparable");
  });

  it("Scenario 9: Non-comparable assessments flag limitation when scoring scale differs radically", () => {
    // e.g. 5 marks oral quiz vs 50 marks written comprehensive exam (ratio 10x)
    const comp = evaluateAssessmentComparability(
      { conceptId: "c-div-01", maximumMarks: 5 },
      { conceptId: "c-div-01", maximumMarks: 50 }
    );

    assert.equal(comp.status, "limited_comparability");
    assert.ok(comp.notes.includes("scoring scale differs significantly"));
  });

  it("Scenario 10: Repeated evaluations do not produce unnecessary duplicate records", () => {
    // Record first follow-up
    db.recordFollowUpAssessment({
      studentId: "std-meera",
      conceptId: "c-div-01",
      assessmentId: "asm-meera-post",
      marksObtained: 18,
      maximumMarks: 20,
    });

    const initialImprovements = db.getImprovements({ studentId: "std-meera", conceptId: "c-div-01" });
    assert.equal(initialImprovements.length, 1);

    // Call evaluateStudentImprovement repeatedly
    db.evaluateStudentImprovement("std-meera", "c-div-01");
    db.evaluateStudentImprovement("std-meera", "c-div-01");

    const afterImprovements = db.getImprovements({ studentId: "std-meera", conceptId: "c-div-01" });
    assert.equal(afterImprovements.length, 1); // No duplicates!
  });

  it("Scenario 11: Invalid student identifier is rejected safely", async () => {
    await assert.rejects(
      async () => {
        await improvementService.getImprovements({ studentId: "std-nonexistent-999" });
      },
      {
        message: /Student 'std-nonexistent-999' not found/,
      }
    );
  });

  it("Scenario 12: Unauthorised user request enforces parental data isolation", async () => {
    // Parent of std-diya attempts to access std-aarav's improvement records
    await assert.rejects(
      async () => {
        await improvementService.getImprovements(
          { studentId: "std-aarav" },
          { role: "parent", studentId: "std-diya" }
        );
      },
      {
        message: /Parents can only access their own child's improvement data/,
      }
    );

    // Parent accessing their own child succeeds
    const diyaImprovements = await improvementService.getImprovements(
      { studentId: "std-diya" },
      { role: "parent", studentId: "std-diya" }
    );
    assert.ok(Array.isArray(diyaImprovements));
  });

  it("Scenario 13: Historical assessment records are strictly preserved and never overwritten", () => {
    const resultsBefore = db.getResults("std-aarav", "c-div-01");
    const countBefore = resultsBefore.length;
    const originalScores = resultsBefore.map((r) => ({ id: r.id, marks: r.marksObtained }));

    // Record a follow-up assessment
    db.recordFollowUpAssessment({
      studentId: "std-aarav",
      conceptId: "c-div-01",
      assessmentId: "asm-post-preserve",
      marksObtained: 19,
      maximumMarks: 20,
    });

    const resultsAfter = db.getResults("std-aarav", "c-div-01");
    assert.equal(resultsAfter.length, countBefore + 1);

    // Verify all original records are completely intact with identical IDs and marks
    for (const orig of originalScores) {
      const match = resultsAfter.find((r) => r.id === orig.id);
      assert.ok(match, `Original assessment result ${orig.id} was not preserved!`);
      assert.equal(match.marksObtained, orig.marks);
    }
  });

  it("Scenario 14: Class-level improvement summary aggregates cohort metrics accurately", () => {
    const summary = db.getClassroomImprovementSummary("cls-4a");
    assert.ok(summary);
    assert.ok(summary.totalStudentsEvaluated >= 1);
    assert.equal(typeof summary.improvingCount, "number");
    assert.equal(typeof summary.averagePercentagePointsGrowth, "number");
    assert.ok(Array.isArray(summary.improvements));
  });

  it("Regression Test: Student Directory, Assessment System, Gap Detection and Remedial Plans continue to function", () => {
    // Student Directory
    const students = db.getStudents();
    assert.equal(students.length, 15);

    // Assessments
    const assessments = db.getAssessments();
    assert.ok(assessments.length >= 6);

    // Gap Detection
    const gaps = db.getLearningGaps();
    assert.ok(gaps.length >= 3);

    // Remedial Plans
    const plans = db.getRemedialPlans();
    assert.ok(plans.length >= 2);
  });
});
