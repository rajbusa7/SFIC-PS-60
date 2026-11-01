import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { parseGradeNumber, normalizeClassroomId } from "../src/context/FilterContext";

describe("Dashboard Class Selection Dropdown & Multi-Grade Student Filtering Suite", () => {
  before(() => {
    db.resetToDemoData();
  });

  after(() => {
    db.resetToDemoData();
  });

  it("1. parseGradeNumber accurately resolves all grade representations", () => {
    assert.equal(parseGradeNumber("all"), null);
    assert.equal(parseGradeNumber(""), null);
    assert.equal(parseGradeNumber(null), null);
    assert.equal(parseGradeNumber(undefined), null);

    assert.equal(parseGradeNumber(1), 1);
    assert.equal(parseGradeNumber("1"), 1);
    assert.equal(parseGradeNumber("cls-1a"), 1);
    assert.equal(parseGradeNumber("Class 1"), 1);
    assert.equal(parseGradeNumber("ધોરણ ૧"), 1);

    assert.equal(parseGradeNumber(2), 2);
    assert.equal(parseGradeNumber("2"), 2);
    assert.equal(parseGradeNumber("cls-2a"), 2);
    assert.equal(parseGradeNumber("Class 2"), 2);
    assert.equal(parseGradeNumber("ધોરણ ૨"), 2);

    assert.equal(parseGradeNumber(3), 3);
    assert.equal(parseGradeNumber("3"), 3);
    assert.equal(parseGradeNumber("cls-3a"), 3);
    assert.equal(parseGradeNumber("Class 3"), 3);

    assert.equal(parseGradeNumber(4), 4);
    assert.equal(parseGradeNumber("4"), 4);
    assert.equal(parseGradeNumber("cls-4a"), 4);
    assert.equal(parseGradeNumber("Class 4"), 4);

    assert.equal(parseGradeNumber(5), 5);
    assert.equal(parseGradeNumber("5"), 5);
    assert.equal(parseGradeNumber("cls-5a"), 5);
    assert.equal(parseGradeNumber("Class 5"), 5);

    assert.equal(normalizeClassroomId("1"), "cls-1a");
    assert.equal(normalizeClassroomId("cls-2a"), "cls-2a");
    assert.equal(normalizeClassroomId("all"), "all");
  });

  it("2. 'All Classes (1-5)' filters and returns all 19 students across all 5 grades", () => {
    const students = db.getStudents();
    const selectedClass: string = "all";
    const selectedGrade = parseGradeNumber(selectedClass);

    const filtered = students.filter((s) => {
      if (selectedClass !== "all") {
        if (selectedGrade !== null) {
          if (s.grade !== selectedGrade && s.classroomId !== selectedClass) return false;
        } else if (s.classroomId !== selectedClass) {
          return false;
        }
      }
      return true;
    });

    assert.equal(filtered.length, 19, "All Classes must return all 19 enrolled students");
    const grades = new Set(filtered.map((s) => s.grade));
    assert.ok(grades.has(1), "Contains Grade 1 students");
    assert.ok(grades.has(2), "Contains Grade 2 students");
    assert.ok(grades.has(3), "Contains Grade 3 students");
    assert.ok(grades.has(4), "Contains Grade 4 students");
    assert.ok(grades.has(5), "Contains Grade 5 students");
  });

  it("3. Selecting 'Class 1' filters and displays only Class 1 students", () => {
    const students = db.getStudents();
    const selectedClass: string = "1";
    const selectedGrade = parseGradeNumber(selectedClass);
    assert.equal(selectedGrade, 1);

    const filtered = students.filter((s) => {
      if (selectedClass !== "all") {
        if (selectedGrade !== null) {
          if (s.grade !== selectedGrade && s.classroomId !== selectedClass) return false;
        } else if (s.classroomId !== selectedClass) {
          return false;
        }
      }
      return true;
    });

    assert.equal(filtered.length, 2, "Class 1 must have exactly 2 students");
    assert.ok(filtered.every((s) => s.grade === 1), "All filtered students must be in Grade 1");
    const names = filtered.map((s) => s.displayName);
    assert.ok(names.includes("Arjun Pandya"));
    assert.ok(names.includes("Krisha Modi"));

    // Check Immediate Attention gaps for Class 1
    const studentIds = new Set(filtered.map((s) => s.id));
    const allGaps = db.getLearningGaps();
    const filteredGaps = allGaps.filter(
      (g) => (g.grade === 1 || studentIds.has(g.studentId)) && (g.status === "Active" || g.status === "Under Intervention")
    );
    assert.ok(filteredGaps.length >= 1, "Must contain Krisha Modi's active gap");
    assert.ok(filteredGaps.some((g) => g.studentName === "Krisha Modi"));
  });

  it("4. Selecting 'Class 2' filters and displays only Class 2 students", () => {
    const students = db.getStudents();
    const selectedClass: string = "2";
    const selectedGrade = parseGradeNumber(selectedClass);
    assert.equal(selectedGrade, 2);

    const filtered = students.filter((s) => {
      if (selectedClass !== "all") {
        if (selectedGrade !== null) {
          if (s.grade !== selectedGrade && s.classroomId !== selectedClass) return false;
        } else if (s.classroomId !== selectedClass) {
          return false;
        }
      }
      return true;
    });

    assert.equal(filtered.length, 2, "Class 2 must have exactly 2 students");
    assert.ok(filtered.every((s) => s.grade === 2), "All filtered students must be in Grade 2");
    const names = filtered.map((s) => s.displayName);
    assert.ok(names.includes("Hetvi Raval"));
    assert.ok(names.includes("Neel Parmar"));

    // Check Immediate Attention gaps for Class 2
    const studentIds = new Set(filtered.map((s) => s.id));
    const allGaps = db.getLearningGaps();
    const filteredGaps = allGaps.filter(
      (g) => (g.grade === 2 || studentIds.has(g.studentId)) && (g.status === "Active" || g.status === "Under Intervention")
    );
    assert.ok(filteredGaps.length >= 1, "Must contain Hetvi Raval's active gap");
    assert.ok(filteredGaps.some((g) => g.studentName === "Hetvi Raval"));
  });

  it("5. Selecting 'Class 3' filters and displays only Class 3 students", () => {
    const students = db.getStudents();
    const selectedClass: string = "3";
    const selectedGrade = parseGradeNumber(selectedClass);
    assert.equal(selectedGrade, 3);

    const filtered = students.filter((s) => {
      if (selectedClass !== "all") {
        if (selectedGrade !== null) {
          if (s.grade !== selectedGrade && s.classroomId !== selectedClass) return false;
        } else if (s.classroomId !== selectedClass) {
          return false;
        }
      }
      return true;
    });

    assert.equal(filtered.length, 5, "Class 3 must have exactly 5 students");
    assert.ok(filtered.every((s) => s.grade === 3));

    // Check Immediate Attention gaps for Class 3
    const studentIds = new Set(filtered.map((s) => s.id));
    const allGaps = db.getLearningGaps();
    const filteredGaps = allGaps.filter(
      (g) => (g.grade === 3 || studentIds.has(g.studentId)) && (g.status === "Active" || g.status === "Under Intervention")
    );
    assert.ok(filteredGaps.length >= 1);
    assert.ok(filteredGaps.some((g) => g.studentName === "Diya Joshi"));
  });

  it("6. Selecting 'Class 4' filters and displays only Class 4 students", () => {
    const students = db.getStudents();
    const selectedClass: string = "4";
    const selectedGrade = parseGradeNumber(selectedClass);
    assert.equal(selectedGrade, 4);

    const filtered = students.filter((s) => {
      if (selectedClass !== "all") {
        if (selectedGrade !== null) {
          if (s.grade !== selectedGrade && s.classroomId !== selectedClass) return false;
        } else if (s.classroomId !== selectedClass) {
          return false;
        }
      }
      return true;
    });

    assert.equal(filtered.length, 6, "Class 4 must have exactly 6 students");
    assert.ok(filtered.every((s) => s.grade === 4));
    const names = filtered.map((s) => s.displayName);
    assert.ok(names.includes("Aarav Patel"));
    assert.ok(names.includes("Dev Shah"));

    // Check Immediate Attention gaps for Class 4
    const studentIds = new Set(filtered.map((s) => s.id));
    const allGaps = db.getLearningGaps();
    const filteredGaps = allGaps.filter(
      (g) => (g.grade === 4 || studentIds.has(g.studentId)) && (g.status === "Active" || g.status === "Under Intervention")
    );
    assert.ok(filteredGaps.some((g) => g.studentName === "Aarav Patel"));
    assert.ok(filteredGaps.some((g) => g.studentName === "Dev Shah"));
  });

  it("7. Selecting 'Class 5' filters Class 5 students and cleanly handles zero-gap empty state", () => {
    const students = db.getStudents();
    const selectedClass: string = "5";
    const selectedGrade = parseGradeNumber(selectedClass);
    assert.equal(selectedGrade, 5);

    const filtered = students.filter((s) => {
      if (selectedClass !== "all") {
        if (selectedGrade !== null) {
          if (s.grade !== selectedGrade && s.classroomId !== selectedClass) return false;
        } else if (s.classroomId !== selectedClass) {
          return false;
        }
      }
      return true;
    });

    assert.equal(filtered.length, 4, "Class 5 must have exactly 4 students");
    assert.ok(filtered.every((s) => s.grade === 5));

    // Check Immediate Attention gaps for Class 5
    const studentIds = new Set(filtered.map((s) => s.id));
    const allGaps = db.getLearningGaps();
    const filteredGaps = allGaps.filter(
      (g) => (g.grade === 5 || studentIds.has(g.studentId)) && (g.status === "Active" || g.status === "Under Intervention")
    );
    assert.equal(filteredGaps.length, 0, "Class 5 has zero active gaps (clean empty state)");
  });

  it("8. Switching repeatedly between classes maintains clean state without leakage", () => {
    const students = db.getStudents();
    const classesToTest = ["1", "4", "2", "5", "3", "all", "2", "all"];

    for (const cls of classesToTest) {
      const gNum = parseGradeNumber(cls);
      const filtered = students.filter((s) => {
        if (cls !== "all") {
          if (gNum !== null) {
            if (s.grade !== gNum && s.classroomId !== cls) return false;
          } else if (s.classroomId !== cls) {
            return false;
          }
        }
        return true;
      });

      if (cls === "all") assert.equal(filtered.length, 19);
      else if (cls === "1") assert.equal(filtered.length, 2);
      else if (cls === "2") assert.equal(filtered.length, 2);
      else if (cls === "3") assert.equal(filtered.length, 5);
      else if (cls === "4") assert.equal(filtered.length, 6);
      else if (cls === "5") assert.equal(filtered.length, 4);
    }
  });

  it("9. Canonical classroom IDs (cls-1a to cls-5a) yield identical filter behavior", () => {
    const students = db.getStudents();

    for (let g = 1; g <= 5; g++) {
      const idStr: string = `cls-${g}a`;
      const numStr: string = String(g);

      const parsedId = parseGradeNumber(idStr);
      const parsedNum = parseGradeNumber(numStr);
      assert.equal(parsedId, g);
      assert.equal(parsedNum, g);

      const filteredById = students.filter((s) => {
        if (idStr !== "all") {
          if (parsedId !== null) {
            if (s.grade !== parsedId && s.classroomId !== idStr) return false;
          } else if (s.classroomId !== idStr) {
            return false;
          }
        }
        return true;
      });

      const filteredByNum = students.filter((s) => {
        if (numStr !== "all") {
          if (parsedNum !== null) {
            if (s.grade !== parsedNum && s.classroomId !== numStr) return false;
          } else if (s.classroomId !== numStr) {
            return false;
          }
        }
        return true;
      });

      assert.equal(filteredById.length, filteredByNum.length);
    }
  });
});
