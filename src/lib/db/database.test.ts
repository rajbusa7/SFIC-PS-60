import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db } from "./database";

describe("Database & Learning Gap Integration Flow", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  it("loads seeded classrooms, students, and learning gaps", () => {
    const students = db.getStudents();
    assert.equal(students.length, 15);

    const aarav = db.getStudentById("std-aarav");
    assert.ok(aarav);
    assert.equal(aarav?.displayName, "Aarav Patel");

    const gaps = db.getLearningGaps("std-aarav");
    assert.ok(gaps.length >= 1);
    const divGap = gaps.find((g) => g.conceptId === "c-div-01");
    assert.ok(divGap);
    assert.equal(divGap?.masteryStatus, "Needs Support");
    assert.equal(divGap?.priority, "High");
    assert.equal(divGap?.latestPercentage, 35);
  });

  it("executes the end-to-end reassessment workflow: Aarav improves from 35% to 85%", () => {
    // Check initial state
    let gaps = db.getLearningGaps("std-aarav");
    let divGap = gaps.find((g) => g.conceptId === "c-div-01");
    assert.equal(divGap?.masteryStatus, "Needs Support");

    // Teacher records a reassessment: 17 out of 20 (85%)
    db.recordResults([
      {
        assessmentId: "asm-02-retest",
        studentId: "std-aarav",
        conceptId: "c-div-01",
        marksObtained: 17,
        maximumMarks: 20,
        percentage: 85,
        recordedAt: new Date().toISOString(),
        notes: "Post-remediation evaluation after token sharing activity.",
      },
    ]);

    // Check automatically recalculated state
    gaps = db.getLearningGaps("std-aarav");
    divGap = gaps.find((g) => g.conceptId === "c-div-01");
    assert.ok(divGap);
    assert.equal(divGap?.masteryStatus, "Mastered");
    assert.equal(divGap?.latestPercentage, 85);
    assert.equal(divGap?.previousPercentage, 35);
    assert.equal(divGap?.deltaPercentagePoints, 50); // +50 pp improvement!
    assert.equal(divGap?.status, "Resolved");
  });

  it("resets to pristine demo state upon confirmation", () => {
    db.addStudent({
      studentCode: "MPS-TEMP-99",
      displayName: "Temporary Student",
      classroomId: "cls-4a",
      grade: 4,
      section: "A",
      enrollmentStatus: "active",
    });

    assert.equal(db.getStudents().length, 16);

    db.resetToDemoData();
    assert.equal(db.getStudents().length, 15);
  });
});
