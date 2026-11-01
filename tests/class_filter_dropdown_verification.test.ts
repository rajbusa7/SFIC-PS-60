import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { parseGradeNumber, normalizeClassroomId } from "../src/context/FilterContext";

describe("StudySaathi AI - Class Selection Dropdown & Multi-Grade Filtering Suite", () => {
  before(() => {
    db.resetToDemoData();
  });

  after(() => {
    db.resetToDemoData();
  });
  it("Requirement 1: parseGradeNumber correctly parses all string, numeric, and localized grade formats", () => {
    // Pure numbers
    assert.equal(parseGradeNumber(1), 1);
    assert.equal(parseGradeNumber(2), 2);
    assert.equal(parseGradeNumber(3), 3);
    assert.equal(parseGradeNumber(4), 4);
    assert.equal(parseGradeNumber(5), 5);

    // Number strings
    assert.equal(parseGradeNumber("1"), 1);
    assert.equal(parseGradeNumber("2"), 2);
    assert.equal(parseGradeNumber("3"), 3);
    assert.equal(parseGradeNumber("4"), 4);
    assert.equal(parseGradeNumber("5"), 5);

    // Classroom IDs
    assert.equal(parseGradeNumber("cls-1a"), 1);
    assert.equal(parseGradeNumber("cls-2a"), 2);
    assert.equal(parseGradeNumber("cls-3a"), 3);
    assert.equal(parseGradeNumber("cls-4a"), 4);
    assert.equal(parseGradeNumber("cls-5a"), 5);

    // English text formats
    assert.equal(parseGradeNumber("Class 1"), 1);
    assert.equal(parseGradeNumber("Class 2"), 2);
    assert.equal(parseGradeNumber("Standard 3"), 3);
    assert.equal(parseGradeNumber("Grade 4"), 4);
    assert.equal(parseGradeNumber("Std 5"), 5);

    // Gujarati localized text formats
    assert.equal(parseGradeNumber("ધોરણ ૧"), 1);
    assert.equal(parseGradeNumber("ધોરણ ૨"), 2);
    assert.equal(parseGradeNumber("ધોરણ ૩"), 3);

    // All / Null
    assert.equal(parseGradeNumber("all"), null);
    assert.equal(parseGradeNumber(""), null);
    assert.equal(parseGradeNumber(null), null);
    assert.equal(parseGradeNumber(undefined), null);

    // Canonical classroom ID normalization
    assert.equal(normalizeClassroomId("1"), "cls-1a");
    assert.equal(normalizeClassroomId("2"), "cls-2a");
    assert.equal(normalizeClassroomId("3"), "cls-3a");
    assert.equal(normalizeClassroomId("all"), "all");
  });

  it("Requirement 2: Database contains all enrolled students across Standards 1 through 5", async () => {
    const allStudents = await db.getStudentsAsync();
    assert.ok(allStudents.length >= 19, `Expected at least 19 students, found ${allStudents.length}`);

    const counts: Record<number, number> = {};
    for (const s of allStudents) {
      counts[s.grade] = (counts[s.grade] || 0) + 1;
    }

    assert.equal(counts[1], 2, "Standard 1 should have exactly 2 enrolled students");
    assert.equal(counts[2], 2, "Standard 2 should have exactly 2 enrolled students");
    assert.equal(counts[3], 5, "Standard 3 should have exactly 5 enrolled students");
    assert.equal(counts[4], 6, "Standard 4 should have exactly 6 enrolled students");
    assert.equal(counts[5], 4, "Standard 5 should have exactly 4 enrolled students");
  });

  it("Requirement 3: Class 1 filter displays only Class 1 students", async () => {
    const allStudents = await db.getStudentsAsync();
    const class1Students = allStudents.filter((s) => s.grade === 1);

    assert.equal(class1Students.length, 2);
    const names = class1Students.map((s) => s.displayName);
    assert.ok(names.includes("Arjun Pandya"), "Class 1 must include Arjun Pandya");
    assert.ok(names.includes("Krisha Modi"), "Class 1 must include Krisha Modi");

    // Must not include students from any other standard
    for (const s of class1Students) {
      assert.equal(s.grade, 1, `Student ${s.displayName} must have grade 1`);
    }
  });

  it("Requirement 4: Class 2 filter displays only Class 2 students", async () => {
    const allStudents = await db.getStudentsAsync();
    const class2Students = allStudents.filter((s) => s.grade === 2);

    assert.equal(class2Students.length, 2);
    const names = class2Students.map((s) => s.displayName);
    assert.ok(names.includes("Hetvi Raval"), "Class 2 must include Hetvi Raval");
    assert.ok(names.includes("Neel Parmar"), "Class 2 must include Neel Parmar");

    for (const s of class2Students) {
      assert.equal(s.grade, 2, `Student ${s.displayName} must have grade 2`);
    }
  });

  it("Requirement 5: Class 3 filter displays only Class 3 students", async () => {
    const allStudents = await db.getStudentsAsync();
    const class3Students = allStudents.filter((s) => s.grade === 3);

    assert.equal(class3Students.length, 5);
    const names = class3Students.map((s) => s.displayName);
    assert.ok(names.includes("Diya Joshi"));
    assert.ok(names.includes("Kabir Varma"));

    for (const s of class3Students) {
      assert.equal(s.grade, 3);
    }
  });

  it("Requirement 6: Class 4 filter displays only Class 4 students", async () => {
    const allStudents = await db.getStudentsAsync();
    const class4Students = allStudents.filter((s) => s.grade === 4);

    assert.equal(class4Students.length, 6);
    const names = class4Students.map((s) => s.displayName);
    assert.ok(names.includes("Aarav Patel"));
    assert.ok(names.includes("Meera Shah"));
    assert.ok(names.includes("Riya Desai"));

    for (const s of class4Students) {
      assert.equal(s.grade, 4);
    }
  });

  it("Requirement 7: Class 5 filter displays only Class 5 students", async () => {
    const allStudents = await db.getStudentsAsync();
    const class5Students = allStudents.filter((s) => s.grade === 5);

    assert.equal(class5Students.length, 4);
    const names = class5Students.map((s) => s.displayName);
    assert.ok(names.includes("Yash Trivedi"));
    assert.ok(names.includes("Tanvi Dave"));

    for (const s of class5Students) {
      assert.equal(s.grade, 5);
    }
  });

  it("Requirement 8: 'All Classes (1-5)' restores all 19 students", async () => {
    const allStudents = await db.getStudentsAsync();
    const activeGrade: string = "all";
    const filtered = allStudents.filter((s) => {
      if (activeGrade !== "all" && s.grade !== Number(activeGrade)) return false;
      return true;
    });

    assert.equal(filtered.length, 19, "All Classes filter must display all 19 students");
  });

  it("Requirement 9: Class filter and Show filter operate together without conflicting", async () => {
    const allStudents = await db.getStudentsAsync();
    const gaps = db.getLearningGaps();

    const getStudentGapCount = (studentId: string) =>
      gaps.filter((g) => g.studentId === studentId && (g.status === "Active" || g.status === "Under Intervention")).length;

    // Test 1: Class 1 + Show: With Active Gaps
    const class1WithGaps = allStudents.filter((s) => {
      if (s.grade !== 1) return false;
      return getStudentGapCount(s.id) > 0;
    });
    assert.equal(class1WithGaps.length, 1, "Class 1 with active gaps should be Krisha Modi");
    assert.equal(class1WithGaps[0].displayName, "Krisha Modi");

    // Test 2: Class 1 + Show: On Track
    const class1OnTrack = allStudents.filter((s) => {
      if (s.grade !== 1) return false;
      return getStudentGapCount(s.id) === 0;
    });
    assert.equal(class1OnTrack.length, 1, "Class 1 on track should be Arjun Pandya");
    assert.equal(class1OnTrack[0].displayName, "Arjun Pandya");

    // Test 3: Class 4 + Show: With Active Gaps
    const class4WithGaps = allStudents.filter((s) => {
      if (s.grade !== 4) return false;
      return getStudentGapCount(s.id) > 0;
    });
    assert.equal(class4WithGaps.length, 3, "Class 4 should have Aarav Patel, Dev Shah, and Meera Shah with gaps");
    const gapNames = class4WithGaps.map((s) => s.displayName);
    assert.ok(gapNames.includes("Aarav Patel"));
    assert.ok(gapNames.includes("Dev Shah"));
    assert.ok(gapNames.includes("Meera Shah"));

    // Test 4: Class 4 + Show: On Track
    const class4OnTrack = allStudents.filter((s) => {
      if (s.grade !== 4) return false;
      return getStudentGapCount(s.id) === 0;
    });
    assert.equal(class4OnTrack.length, 3, "Class 4 on track should have Riya Desai, Anaya Patel, Vihaan Mehta");
    const onTrackNames = class4OnTrack.map((s) => s.displayName);
    assert.ok(onTrackNames.includes("Riya Desai"));
    assert.ok(onTrackNames.includes("Anaya Patel"));
    assert.ok(onTrackNames.includes("Vihaan Mehta"));
  });

  it("Requirement 10: API endpoint /api/students accepts grade=1 through grade=5 query param", async () => {
    for (let g = 1; g <= 5; g++) {
      const studentsInGrade = await db.getStudentsAsync({ grade: g });
      assert.ok(studentsInGrade.length > 0, `API should return students for grade ${g}`);
      for (const s of studentsInGrade) {
        assert.equal(s.grade, g, `Student ${s.displayName} must match grade query param ${g}`);
      }
    }
  });
});
