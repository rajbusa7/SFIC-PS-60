import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTodaysPriorities,
  isWithinRecentDays,
  PriorityGapRecord,
} from "../src/lib/engine/todaysPriorities";

describe("Phase 5: Today's Priorities Engine", () => {
  const referenceNow = new Date("2026-10-31T12:00:00Z").getTime();

  it("Test 1: Active Needs Support student is counted under Immediate Support", () => {
    const gaps: PriorityGapRecord[] = [
      {
        id: "gap-1",
        studentId: "std-1",
        studentName: "Aarav",
        dynamicStatus: "Needs Support",
        status: "Active",
      },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.immediateSupportCount, 1);
    assert.deepEqual(result.immediateSupportStudentIds, ["std-1"]);
    assert.equal(result.developingCount, 0);
    assert.equal(result.readyToReassessCount, 0);
    assert.equal(result.recentlyMasteredCount, 0);
  });

  it("Test 2: Active Developing student is counted under Developing", () => {
    const gaps: PriorityGapRecord[] = [
      {
        id: "gap-2",
        studentId: "std-2",
        studentName: "Meera",
        dynamicStatus: "Developing",
        status: "Active",
      },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.developingCount, 1);
    assert.deepEqual(result.developingStudentIds, ["std-2"]);
    assert.equal(result.immediateSupportCount, 0);
  });

  it("Test 3: Completed remedial activity with reassessment eligibility is counted under Ready to Reassess", () => {
    const gaps: PriorityGapRecord[] = [
      {
        id: "gap-3",
        studentId: "std-3",
        studentName: "Diya",
        dynamicStatus: "Needs Support",
        status: "Under Intervention",
        remedialPlanStatus: "Completed",
      },
      {
        id: "gap-4",
        studentId: "std-4",
        studentName: "Kabir",
        dynamicStatus: "Developing",
        status: "Active",
        reassessmentDue: true,
      },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.readyToReassessCount, 2);
    assert.ok(result.readyToReassessStudentIds.includes("std-3"));
    assert.ok(result.readyToReassessStudentIds.includes("std-4"));
  });

  it("Test 4: Plan generated but not completed is NOT counted as Ready to Reassess", () => {
    const gaps: PriorityGapRecord[] = [
      {
        id: "gap-5",
        studentId: "std-5",
        studentName: "Dev",
        dynamicStatus: "Needs Support",
        status: "Active",
        remedialPlanId: "plan-dev-01",
        remedialPlanStatus: "Approved", // Plan generated & approved, but NOT completed
        reassessmentDue: false,
      },
      {
        id: "gap-6",
        studentId: "std-6",
        studentName: "Rohan",
        dynamicStatus: "Developing",
        status: "Under Intervention",
        remedialPlanId: "plan-rohan-01",
        remedialPlanStatus: "In Progress", // Plan in progress, not completed
      },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.readyToReassessCount, 0); // Must be strictly 0
    assert.equal(result.immediateSupportCount, 1); // std-5 in Needs Support
    assert.equal(result.developingCount, 1); // std-6 in Developing
  });

  it("Test 5: Recently mastered gap (within 7 days) is counted under Recently Mastered", () => {
    const threeDaysAgo = new Date(referenceNow - 3 * 24 * 60 * 60 * 1000).toISOString();
    const gaps: PriorityGapRecord[] = [
      {
        id: "gap-7",
        studentId: "std-7",
        studentName: "Aarav Mastered",
        dynamicStatus: "Mastered",
        status: "Resolved",
        updatedAt: threeDaysAgo,
      },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.recentlyMasteredCount, 1);
    assert.deepEqual(result.recentlyMasteredStudentIds, ["std-7"]);
    assert.equal(result.immediateSupportCount, 0);
  });

  it("Test 6: Mastered gap older than 7 days is NOT counted as Recently Mastered", () => {
    const twentyDaysAgo = new Date(referenceNow - 20 * 24 * 60 * 60 * 1000).toISOString();
    const gaps: PriorityGapRecord[] = [
      {
        id: "gap-8",
        studentId: "std-8",
        studentName: "Historical Mastered",
        dynamicStatus: "Mastered",
        status: "Resolved",
        updatedAt: twentyDaysAgo,
      },
      {
        id: "gap-9",
        studentId: "std-9",
        studentName: "Missing Date Mastered",
        dynamicStatus: "Mastered",
        status: "Resolved",
        updatedAt: undefined, // Missing timestamp should not be fabricated
      },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.recentlyMasteredCount, 0);
  });

  it("Test 7: Student with multiple gaps in one category is counted only ONCE", () => {
    const gaps: PriorityGapRecord[] = [
      { id: "gap-a1", studentId: "std-aarav", dynamicStatus: "Needs Support", status: "Active" },
      { id: "gap-a2", studentId: "std-aarav", dynamicStatus: "Needs Support", status: "Active" },
      { id: "gap-a3", studentId: "std-aarav", dynamicStatus: "Needs Support", status: "Active" },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.immediateSupportCount, 1); // 3 gaps, but only 1 unique student
    assert.deepEqual(result.immediateSupportStudentIds, ["std-aarav"]);
  });

  it("Test 8: Student with gaps in different categories is counted in each applicable category", () => {
    const gaps: PriorityGapRecord[] = [
      { id: "gap-d1", studentId: "std-diya", dynamicStatus: "Needs Support", status: "Active" },
      { id: "gap-d2", studentId: "std-diya", dynamicStatus: "Developing", status: "Active" },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.immediateSupportCount, 1);
    assert.equal(result.developingCount, 1);
    assert.equal(result.totalActionableStudents, 1); // 1 total student needing attention
  });

  it("Test 9: No eligible reassessment records safely returns zero count", () => {
    const gaps: PriorityGapRecord[] = [
      { id: "gap-10", studentId: "std-10", dynamicStatus: "Needs Support", status: "Active" },
      { id: "gap-11", studentId: "std-11", dynamicStatus: "Developing", status: "Active" },
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.readyToReassessCount, 0);
  });

  it("Test 10: Empty dataset safely yields zero counts without crashing", () => {
    const result = calculateTodaysPriorities([], referenceNow);
    assert.equal(result.immediateSupportCount, 0);
    assert.equal(result.developingCount, 0);
    assert.equal(result.readyToReassessCount, 0);
    assert.equal(result.recentlyMasteredCount, 0);
    assert.equal(result.totalActionableStudents, 0);
  });

  it("Test 11: Invalid or malformed statuses are safely excluded from incorrect categories", () => {
    const gaps: any[] = [
      { id: "gap-inv1", studentId: "std-inv1", dynamicStatus: "Unknown Status", status: "NaN" },
      { id: "gap-inv2", studentId: "std-inv2", dynamicStatus: null, status: undefined },
      { id: "gap-inv3", studentId: "", dynamicStatus: "Needs Support" }, // Missing studentId
      null,
      undefined,
    ];

    const result = calculateTodaysPriorities(gaps, referenceNow);
    assert.equal(result.immediateSupportCount, 0);
    assert.equal(result.developingCount, 0);
    assert.equal(result.readyToReassessCount, 0);
    assert.equal(result.recentlyMasteredCount, 0);
  });

  it("Test 12: isWithinRecentDays accurately checks 7-day boundary", () => {
    const now = referenceNow;
    const day6 = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();
    const day7Exact = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const day8 = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();

    assert.equal(isWithinRecentDays(day6, 7, now), true);
    assert.equal(isWithinRecentDays(day7Exact, 7, now), true);
    assert.equal(isWithinRecentDays(day8, 7, now), false);
    assert.equal(isWithinRecentDays(undefined, 7, now), false);
    assert.equal(isWithinRecentDays("invalid-date", 7, now), false);
  });
});

