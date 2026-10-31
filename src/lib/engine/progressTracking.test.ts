import { describe, it } from "node:test";
import assert from "node:assert";
import { GET } from "../../app/api/progress/route";
import { db } from "../db/database";
import {
  calculatePercentagePointDelta,
  determineTrend,
  calculateAverage,
} from "./calculations";

describe("Progress Tracking & Analytics Engine", () => {
  it("should calculate exact percentage-point delta and differentiate from relative growth", () => {
    // Aarav Division case: 40% initial, 35% latest
    const initial = 40;
    const latest = 35;
    const ppDelta = calculatePercentagePointDelta(latest, initial);
    assert.strictEqual(ppDelta, -5, "Delta should be exactly -5 percentage points");

    const relativeGrowth = Math.round(((latest - initial) / initial) * 1000) / 10;
    assert.strictEqual(relativeGrowth, -12.5, "Relative decline should be -12.5%");

    // Positive improvement case: 35% initial, 75% latest
    const impInitial = 35;
    const impLatest = 75;
    const impPpDelta = calculatePercentagePointDelta(impLatest, impInitial);
    assert.strictEqual(impPpDelta, 40, "Delta should be +40 percentage points");
    const impRelativeGrowth = Math.round(((impLatest - impInitial) / impInitial) * 1000) / 10;
    assert.strictEqual(impRelativeGrowth, 114.3, "Relative growth should be +114.3%");
  });

  it("should accurately determine trend directions", () => {
    const declining = determineTrend([40, 35]);
    assert.strictEqual(declining.trend, "declining");
    assert.strictEqual(declining.deltaPercentagePoints, -5);

    const improving = determineTrend([35, 75]);
    assert.strictEqual(improving.trend, "improving");
    assert.strictEqual(improving.deltaPercentagePoints, 40);

    const stable = determineTrend([60, 62]);
    assert.strictEqual(stable.trend, "stable");
    assert.strictEqual(stable.deltaPercentagePoints, 2);

    const insufficient = determineTrend([75]);
    assert.strictEqual(insufficient.trend, "insufficient_data");
  });

  it("should return consistent test count and scores for Aarav Patel's Division tests", async () => {
    const req = new Request("http://localhost:3000/api/progress?studentId=std-aarav");
    const res = await GET(req);
    const data = await res.json();

    assert.strictEqual(data.success, true);
    assert.ok(data.progressItems.length > 0, "Should return progress items for Aarav");

    const divItem = data.progressItems.find(
      (item: any) => item.studentId === "std-aarav" && item.conceptId === "c-div-01"
    );
    assert.ok(divItem, "Division concept item must exist for Aarav Patel");
    assert.strictEqual(divItem.attemptsCount, 2, "Aarav Patel must have exactly 2 tests on Division");
    assert.strictEqual(divItem.initialPercentage, 40, "Initial score must be 40%");
    assert.strictEqual(divItem.latestPercentage, 35, "Latest score must be 35%");
    assert.strictEqual(divItem.deltaPercentagePoints, -5, "Delta must be -5 pp");
    assert.strictEqual(divItem.masteryStatus, "Needs Support", "Status must be Needs Support");
    assert.strictEqual(divItem.history.length, 2, "History must contain 2 entries");

    // Check student record summary for Aarav
    const aaravSummary = data.studentRecords.find((s: any) => s.id === "std-aarav");
    assert.ok(aaravSummary, "Aarav student summary must exist");
    assert.strictEqual(aaravSummary.assessmentsAttempted, 5, "Total assessments across concepts should be 5");
    assert.ok(aaravSummary.recommendation.length > 0, "Personalized recommendation must be generated");
  });

  it("should compute all 14 KPIs accurately from live records", async () => {
    const req = new Request("http://localhost:3000/api/progress");
    const res = await GET(req);
    const data = await res.json();

    assert.strictEqual(data.success, true);
    const kpis = data.kpis;
    assert.ok(kpis, "KPIs object must be present");

    // Check all 14 KPIs exist and are numbers
    const requiredKpiKeys = [
      "totalStudentsTracked",
      "studentsShowingGrowth",
      "studentsShowingDecline",
      "studentsMaintaining",
      "studentsMastery",
      "studentsNeedingSupport",
      "totalAssessmentsCompleted",
      "totalActivitiesCompleted",
      "interventionsCompleted",
      "activeInterventions",
      "gapsResolved",
      "overallClassAverage",
      "avgPercentagePointImprovement",
      "studentsWithoutRecentAssessments",
    ];

    for (const key of requiredKpiKeys) {
      assert.ok(typeof kpis[key] === "number", `KPI ${key} must be a number`);
      assert.ok(!isNaN(kpis[key]), `KPI ${key} must not be NaN`);
    }

    assert.ok(kpis.totalStudentsTracked > 0, "Total students tracked should be > 0");
    assert.ok(kpis.totalAssessmentsCompleted > 0, "Total assessments should be > 0");
    assert.ok(kpis.overallClassAverage >= 0 && kpis.overallClassAverage <= 100, "Class average should be 0-100");
  });

  it("should filter by standard/grade and subject correctly", async () => {
    // Filter grade 4
    const gradeReq = new Request("http://localhost:3000/api/progress?grade=4");
    const gradeRes = await GET(gradeReq);
    const gradeData = await gradeRes.json();
    assert.strictEqual(gradeData.success, true);
    gradeData.progressItems.forEach((item: any) => {
      assert.strictEqual(item.grade, 4, "Every item should have grade 4");
    });

    // Filter subject MATH
    const mathReq = new Request("http://localhost:3000/api/progress?subject=MATH");
    const mathRes = await GET(mathReq);
    const mathData = await mathRes.json();
    assert.strictEqual(mathData.success, true);
    mathData.progressItems.forEach((item: any) => {
      assert.strictEqual(item.subjectCode, "MATH", "Every item should have subjectCode MATH");
    });
  });
});
