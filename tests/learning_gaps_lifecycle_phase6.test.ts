import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateReassessmentOutcome,
  getMasteryEvidenceText,
  getInitialObservationText,
} from "../src/lib/engine/reassessmentEngine";
import { calculateTodaysPriorities } from "../src/lib/engine/todaysPriorities";
import { generatePedagogicalPrescription } from "../src/lib/engine/prescriptionEngine";

describe("Phase 6: Learning Gaps Lifecycle & Reassessment Management", () => {
  const defaultSupportThreshold = 60;
  const defaultMasteryThreshold = 80;

  // --------------------------------------------------------------------------
  // 1. Status Transition Tests
  // --------------------------------------------------------------------------

  it("Test 1: Initial observation (35%, no history) evaluates to Needs Support based on threshold", () => {
    const outcome = evaluateReassessmentOutcome({
      currentScore: 35,
      previousScore: null,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.status, "Needs Support");
    assert.equal(outcome.isInitialObservation, true);
    assert.equal(outcome.scoreDelta, null);
    assert.equal(outcome.scoreDeltaFormatted, "First assessment");
    assert.match(outcome.explanation, /Initial observation: The student's current score is 35%/i);
  });

  it("Test 2: Score 35% -> 45% remains in Needs Support (below 60% support threshold)", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 35,
      currentScore: 45,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.status, "Needs Support");
    assert.equal(outcome.outcomeCode, "STILL_NEEDS_SUPPORT");
    assert.equal(outcome.scoreDelta, 10);
    assert.equal(outcome.scoreDeltaFormatted, "+10 pp");
    assert.match(outcome.outcomeLabel, /Still Needs Support/i);
  });

  it("Test 3: Score 45% -> 65% transitions to Developing (within 60%–79% range)", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 45,
      currentScore: 65,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.status, "Developing");
    assert.equal(outcome.outcomeCode, "IMPROVED_TO_DEVELOPING");
    assert.equal(outcome.scoreDelta, 20);
    assert.equal(outcome.scoreDeltaFormatted, "+20 pp");
    assert.match(outcome.outcomeLabel, /Improved to Developing/i);
  });

  it("Test 4: Score 65% -> 85% transitions to Mastered (reaches 80% benchmark)", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 65,
      currentScore: 85,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.status, "Mastered");
    assert.equal(outcome.outcomeCode, "REACHED_MASTERY");
    assert.equal(outcome.scoreDelta, 20);
    assert.equal(outcome.scoreDeltaFormatted, "+20 pp");
    assert.match(outcome.outcomeLabel, /Reached Mastery/i);
  });

  it("Test 5: Score 85% -> 80% maintains Mastered (boundary condition: score === masteryThreshold)", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 85,
      currentScore: 80,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.status, "Mastered");
    assert.equal(outcome.outcomeCode, "MASTERY_MAINTAINED");
    assert.equal(outcome.scoreDelta, -5);
    assert.equal(outcome.scoreDeltaFormatted, "-5 pp");
    assert.match(outcome.outcomeLabel, /Mastery Maintained/i);
  });

  // --------------------------------------------------------------------------
  // 2. Reassessment Delta Tests
  // --------------------------------------------------------------------------

  it("Test 6: 35% -> 85% displays +50 pp improvement and Reached Mastery", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 35,
      currentScore: 85,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.scoreDelta, 50);
    assert.equal(outcome.scoreDeltaFormatted, "+50 pp");
    assert.equal(outcome.outcomeCode, "REACHED_MASTERY");
    assert.equal(outcome.outcomeLabel, "Reached Mastery");
    assert.match(outcome.explanation, /Score improved from 35% to 85% \(\+50 pp\)/i);
  });

  it("Test 7: Declining performance (85% -> 65%) is NOT described as improvement", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 85,
      currentScore: 65,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.scoreDelta, -20);
    assert.equal(outcome.scoreDeltaFormatted, "-20 pp");
    assert.equal(outcome.outcomeCode, "DECLINED");
    assert.match(outcome.outcomeLabel, /Declining/i);
    assert.doesNotMatch(outcome.outcomeLabel, /improved|progress/i);
    assert.doesNotMatch(outcome.explanation, /improved|positive progress/i);
  });

  it("Test 8: Identical scores (75% -> 75%) are correctly identified as Stable Developing", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 75,
      currentScore: 75,
      supportThreshold: defaultSupportThreshold,
      masteryThreshold: defaultMasteryThreshold,
    });

    assert.equal(outcome.scoreDelta, 0);
    assert.equal(outcome.scoreDeltaFormatted, "0 pp");
    assert.equal(outcome.outcomeCode, "STABLE");
    assert.match(outcome.outcomeLabel, /Stable/i);
  });

  it("Test 9: Incompatible records (different students) are rejected from comparison", () => {
    const outcome = evaluateReassessmentOutcome({
      studentId: "std-aarav",
      previousStudentId: "std-diya",
      currentScore: 85,
      previousScore: 40,
    });

    assert.equal(outcome.isComparable, false);
    assert.match(outcome.incomparableReason!, /different students/i);
  });

  it("Test 10: Incompatible competencies (different concepts) are rejected from comparison", () => {
    const outcome = evaluateReassessmentOutcome({
      studentId: "std-aarav",
      previousStudentId: "std-aarav",
      conceptId: "c-div-01",
      previousConceptId: "c-place-01",
      currentScore: 85,
      previousScore: 40,
    });

    assert.equal(outcome.isComparable, false);
    assert.match(outcome.incomparableReason!, /different competencies/i);
  });

  // --------------------------------------------------------------------------
  // 3. Mastered Record Handling Tests
  // --------------------------------------------------------------------------

  it("Test 11: Mastered records generate Mastery Evidence without cognitive obstacle phrasing", () => {
    const textEn = getMasteryEvidenceText(85, 80, "en");
    assert.match(textEn, /Mastery achieved: The student scored 85%, meeting the configured mastery benchmark of 80%/i);
    assert.match(textEn, /No immediate remedial intervention is required/i);
    assert.doesNotMatch(textEn, /cognitive obstacle|gap|roadblock/i);

    const textGu = getMasteryEvidenceText(85, 80, "gu");
    assert.match(textGu, /નિપુણતા પ્રાપ્ત થઈ/);
    assert.match(textGu, /કોઈ તાત્કાલિક ઉપચારની જરૂર નથી/);
  });

  it("Test 12: Mastered records generate maintenance prescriptions and are not eligible for remedial plans", () => {
    const prescription = generatePedagogicalPrescription({
      conceptId: "c-div-01",
      conceptName: "Division Basics",
      status: "Mastered",
    });

    assert.equal(prescription.recommendationType, "Mastery Maintenance");
    assert.equal(prescription.remedialPlanEligible, false);
    assert.match(prescription.planStatusLabel, /Mastery achieved — continue periodic retrieval practice/i);
    assert.doesNotMatch(prescription.planStatusLabel, /Ready for 5-Step/i);
  });

  it("Test 13: Mastered students are excluded from immediate-support priority counts", () => {
    const gaps = [
      { id: "g1", studentId: "std-1", dynamicStatus: "Mastered", status: "Resolved", updatedAt: new Date().toISOString() },
      { id: "g2", studentId: "std-2", dynamicStatus: "Needs Support", status: "Active" },
    ];

    const priorities = calculateTodaysPriorities(gaps);
    assert.equal(priorities.immediateSupportCount, 1);
    assert.deepEqual(priorities.immediateSupportStudentIds, ["std-2"]);
    assert.equal(priorities.recentlyMasteredCount, 1);
    assert.deepEqual(priorities.recentlyMasteredStudentIds, ["std-1"]);
  });

  it("Test 14: Accurately localizes Reassess Delta outcomes into Gujarati", () => {
    const outcome = evaluateReassessmentOutcome({
      previousScore: 35,
      currentScore: 85,
      supportThreshold: 60,
      masteryThreshold: 80,
      language: "gu",
    });

    assert.equal(outcome.outcomeCode, "REACHED_MASTERY");
    assert.equal(outcome.outcomeLabelGu, "પ્રભુત્વ પ્રાપ્ત કર્યું");
    assert.match(outcome.explanationGu, /પ્રભુત્વ પ્રાપ્ત કર્યું/);
  });
});

