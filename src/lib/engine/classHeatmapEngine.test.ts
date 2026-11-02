import test from "node:test";
import assert from "node:assert/strict";
import {
  getClassLearningGapHeatmap,
  filterGapsByHeatmap,
  ClassHeatmapFilter,
} from "./classHeatmapEngine";

test("Class Learning Gap Heatmap Engine - Comprehensive Test Suite", async (t) => {
  const heatmap = getClassLearningGapHeatmap();

  await t.test("1. Heatmap Aggregation: matches exact required competency counts for Place Value, Multiplication, and Division", () => {
    // Place Value: 8 Needs Support, 12 Developing, 20 Mastered
    const placeValue = heatmap.competencies.find((c) => c.competencyName === "Place Value");
    assert.ok(placeValue);
    assert.equal(placeValue.needsSupportCount, 8);
    assert.equal(placeValue.developingCount, 12);
    assert.equal(placeValue.masteredCount, 20);
    assert.equal(placeValue.totalStudents, 40);

    // Multiplication: 11 Needs Support, 14 Developing, 15 Mastered
    const multiplication = heatmap.competencies.find((c) => c.competencyName === "Multiplication");
    assert.ok(multiplication);
    assert.equal(multiplication.needsSupportCount, 11);
    assert.equal(multiplication.developingCount, 14);
    assert.equal(multiplication.masteredCount, 15);
    assert.equal(multiplication.totalStudents, 40);

    // Division: 7 Needs Support, 10 Developing, 23 Mastered
    const division = heatmap.competencies.find((c) => c.competencyName === "Division");
    assert.ok(division);
    assert.equal(division.needsSupportCount, 7);
    assert.equal(division.developingCount, 10);
    assert.equal(division.masteredCount, 23);
    assert.equal(division.totalStudents, 40);
  });

  await t.test("2. Interactive Filtering: Clicking 'Multiplication -> Needs Support -> 11' returns exactly those 11 students", () => {
    const defaultGaps = [{ id: "default-gap-1", studentName: "Aarav Patel" }];
    const filter: ClassHeatmapFilter = {
      competencyName: "Multiplication",
      status: "Needs Support",
    };

    const filtered = filterGapsByHeatmap(filter, heatmap, defaultGaps);

    assert.equal(filtered.length, 11);
    assert.ok(filtered.every((s) => s.conceptName === "Multiplication"));
    assert.ok(filtered.every((s) => s.masteryStatus === "Needs Support"));

    // Verify student uniqueness
    const studentIds = new Set(filtered.map((s) => s.studentId));
    assert.equal(studentIds.size, 11);

    // Verify rich diagnosis fields
    const sample = filtered[0];
    assert.ok(sample.studentName);
    assert.ok(sample.latestPercentage < 60);
    assert.ok(sample.gapType);
    assert.ok(sample.supportingEvidence.length > 0);
  });

  await t.test("3. Interactive Filtering: Clicking 'Place Value -> Needs Support -> 8' returns exactly those 8 students", () => {
    const defaultGaps = [{ id: "default-gap-1" }];
    const filter: ClassHeatmapFilter = {
      competencyName: "Place Value",
      status: "Needs Support",
    };

    const filtered = filterGapsByHeatmap(filter, heatmap, defaultGaps);

    assert.equal(filtered.length, 8);
    assert.ok(filtered.every((s) => s.conceptName === "Place Value"));
    assert.ok(filtered.every((s) => s.masteryStatus === "Needs Support"));
  });

  await t.test("4. Interactive Filtering: Clicking 'Division -> Needs Support -> 7' returns exactly those 7 students", () => {
    const defaultGaps = [{ id: "default-gap-1" }];
    const filter: ClassHeatmapFilter = {
      competencyName: "Division",
      status: "Needs Support",
    };

    const filtered = filterGapsByHeatmap(filter, heatmap, defaultGaps);

    assert.equal(filtered.length, 7);
    assert.ok(filtered.every((s) => s.conceptName === "Division"));
    assert.ok(filtered.every((s) => s.masteryStatus === "Needs Support"));
  });

  await t.test("5. Interactive Filtering: Clicking 'Multiplication -> Developing -> 14' returns 14 developing students", () => {
    const defaultGaps = [{ id: "default-gap-1" }];
    const filter: ClassHeatmapFilter = {
      competencyName: "Multiplication",
      status: "Developing",
    };

    const filtered = filterGapsByHeatmap(filter, heatmap, defaultGaps);

    assert.equal(filtered.length, 14);
    assert.ok(filtered.every((s) => s.masteryStatus === "Developing"));
  });

  await t.test("6. Filter Clearing: Setting filter to null or clearing returns default learning gaps", () => {
    const defaultGaps = [
      { id: "gap-aarav-div", studentName: "Aarav Patel" },
      { id: "gap-diya-place", studentName: "Diya Joshi" },
    ];

    const resultNull = filterGapsByHeatmap(null, heatmap, defaultGaps);
    assert.equal(resultNull.length, 2);
    assert.deepEqual(resultNull, defaultGaps);

    const resultEmpty = filterGapsByHeatmap({}, heatmap, defaultGaps);
    assert.equal(resultEmpty.length, 2);
    assert.deepEqual(resultEmpty, defaultGaps);
  });
});
