import test from "node:test";
import assert from "node:assert/strict";
import {
  getSmartRemediationGroups,
  addStudentToGroup,
  removeStudentFromGroup,
  acceptGroup,
  dismissGroup,
  generateGroup5StepPlan,
} from "./smartGroupingEngine";

test("Smart Remediation Grouping Engine - Comprehensive Test Suite", async (t) => {
  const groups = getSmartRemediationGroups();

  await t.test("1. Group Generation: constructs GROUP A (Place Value Foundation) with required students and intervention", () => {
    const groupA = groups.find((g) => g.groupLabel === "GROUP A");
    assert.ok(groupA);
    assert.equal(groupA.title, "Place Value Foundation");
    assert.equal(groupA.sharedIssue, "Regrouping / tens and ones");
    assert.equal(groupA.suggestedIntervention, "Base-10 blocks");
    assert.equal(groupA.estimatedDuration, "10–12 minutes");

    // Check members: Aarav, Diya, Meera, Kabir
    const studentNames = groupA.students.map((s) => s.studentName);
    assert.ok(studentNames.includes("Aarav Patel"));
    assert.ok(studentNames.includes("Diya Joshi"));
    assert.ok(studentNames.includes("Meera Shah"));
    assert.ok(studentNames.includes("Kabir Varma"));

    // Verify non-percentage grouping: shared error pattern is column regrouping
    assert.ok(groupA.students.every((s) => s.errorPattern?.toLowerCase().includes("regroup") || s.errorPattern?.toLowerCase().includes("carry")));
  });

  await t.test("2. Teacher Control: removing a student from a suggested group", () => {
    const groupA = groups.find((g) => g.groupLabel === "GROUP A")!;
    assert.equal(groupA.students.length, 4);

    const updated = removeStudentFromGroup(groupA, "std-kabir");
    assert.equal(updated.students.length, 3);
    assert.ok(!updated.students.some((s) => s.studentId === "std-kabir"));
    assert.ok(updated.students.some((s) => s.studentId === "std-aarav"));
  });

  await t.test("3. Teacher Control: adding an appropriate student to a suggested group", () => {
    const groupA = groups.find((g) => g.groupLabel === "GROUP A")!;
    const updated = addStudentToGroup(groupA, {
      studentId: "std-jay",
      studentName: "Jay Patel",
      currentScore: 44,
      errorPattern: "Carrying delay",
    });

    assert.equal(updated.students.length, 5);
    const added = updated.students.find((s) => s.studentId === "std-jay");
    assert.ok(added);
    assert.equal(added?.isCustomAdded, true);

    // Duplicate check
    const dupCheck = addStudentToGroup(updated, {
      studentId: "std-jay",
      studentName: "Jay Patel",
    });
    assert.equal(dupCheck.students.length, 5);
  });

  await t.test("4. Teacher Control: accepting and dismissing groups", () => {
    const groupA = groups.find((g) => g.groupLabel === "GROUP A")!;
    assert.equal(groupA.status, "suggested");

    const accepted = acceptGroup(groupA);
    assert.equal(accepted.status, "accepted");

    const dismissed = dismissGroup(groupA);
    assert.equal(dismissed.status, "dismissed");
  });

  await t.test("5. Group 5-Step Plan Generation: reuses existing 5-step engine and binds group metadata", () => {
    const groupA = groups.find((g) => g.groupLabel === "GROUP A")!;
    const plan = generateGroup5StepPlan(groupA);

    assert.ok(plan);
    assert.equal(plan.isGroupPlan, true);
    assert.equal(plan.groupLabel, "GROUP A");
    assert.equal(plan.groupTitle, "Place Value Foundation");
    assert.equal(plan.sharedIssue, "Regrouping / tens and ones");
    assert.equal(plan.suggestedIntervention, "Base-10 blocks");
    assert.equal(plan.estimatedDuration, "10–12 minutes");

    // Guarantee 5 concrete steps
    assert.ok(Array.isArray(plan.steps));
    assert.equal(plan.steps.length, 5);
    assert.ok(plan.steps[0].title);
    assert.ok(plan.steps[0].description);
  });
});
