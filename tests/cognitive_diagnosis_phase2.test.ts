import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateCognitiveDiagnosis,
  sanitizeScore,
  getDiagnosisBadgeStyle,
} from "../src/lib/engine/diagnosisEngine";

describe("Phase 2: Cognitive Obstacle & Why Flagged Diagnosis Engine", () => {
  // Test Case 1: Low performance (50%)
  it("Test 1: Low performance (50%) generates Needs Support with guided-practice recommendation", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Division Basics",
      latestPercentage: 50,
      supportThreshold: 60,
      masteryBenchmark: 80,
    });

    assert.equal(result.status, "Needs Support");
    assert.equal(result.diagnosisType, "Developing / Not Yet Mastered");
    assert.equal(result.isMastered, false);
    assert.equal(result.requiresRemediation, true);
    assert.match(result.explanation, /50%/);
    assert.match(result.explanation, /guided practice/i);
    assert.match(result.recommendedAction, /guided practice|fundamentals/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 2: Developing (70%, benchmark 80%)
  it("Test 2: Developing (70%, benchmark 80%) generates Developing / Not Yet Mastered", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Multiplication Tables",
      latestPercentage: 70,
      supportThreshold: 60,
      masteryBenchmark: 80,
    });

    assert.equal(result.status, "Developing");
    assert.equal(result.diagnosisType, "Developing / Not Yet Mastered");
    assert.equal(result.isMastered, false);
    assert.equal(result.requiresRemediation, true);
    assert.match(result.explanation, /Developing/i);
    assert.match(result.explanation, /reassessment/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 3: Mastered (85%, benchmark 80%)
  it("Test 3: Mastered (85%, benchmark 80%) generates Mastered with no immediate remediation", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Fractions",
      latestPercentage: 85,
      supportThreshold: 60,
      masteryBenchmark: 80,
    });

    assert.equal(result.status, "Mastered");
    assert.equal(result.diagnosisType, "Mastered");
    assert.equal(result.isMastered, true);
    assert.equal(result.requiresRemediation, false);
    assert.match(result.explanation, /Mastered/i);
    assert.match(result.explanation, /No immediate remediation is required/i);
    assert.match(result.explanation, /monitor retention/i);
    assert.doesNotMatch(result.explanation, /obstacle|struggling|confusion/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 4: Improving (55% -> 70%)
  it("Test 4: Improving performance (55% -> 70%) reflects progress without inventing full mastery", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Place Value",
      latestPercentage: 70,
      previousPercentage: 55,
      supportThreshold: 60,
      masteryBenchmark: 80,
      attemptsCount: 2,
    });

    assert.equal(result.status, "Developing");
    assert.equal(result.diagnosisType, "Developing / Not Yet Mastered");
    assert.match(result.explanation, /Developing and improving/i);
    assert.match(result.explanation, /55%/);
    assert.match(result.explanation, /70%/);
    assert.match(result.explanation, /progress/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 5: Declining (80% -> 65%)
  it("Test 5: Declining performance (80% -> 65%) flags slipping performance and recommends investigation", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Geometry & Shapes",
      latestPercentage: 65,
      previousPercentage: 80,
      supportThreshold: 60,
      masteryBenchmark: 80,
      attemptsCount: 2,
    });

    assert.equal(result.status, "Developing");
    assert.equal(result.diagnosisType, "Developing / Not Yet Mastered");
    assert.match(result.explanation, /Declining performance/i);
    assert.match(result.explanation, /decreased from 80% to 65%/i);
    assert.match(result.explanation, /missed problems/i);
    assert.match(result.recommendedAction, /investigate/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 6: Missing history (Current score only)
  it("Test 6: Missing history relies strictly on current evidence without inventing previous scores", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Reading Comprehension",
      latestPercentage: 50,
      previousPercentage: undefined,
      attemptsCount: 1,
    });

    assert.equal(result.status, "Needs Support");
    assert.doesNotMatch(result.explanation, /previous|increased|decreased|from undefined%|NaN/i);
    assert.match(result.explanation, /50%/);
    assert.match(result.explanation, /guided practice/i);
  });

  // Test Case 7: No question-level data available
  it("Test 7: No question-level data assigns Insufficient Evidence when explicitly flagged", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Grammar & Verbs",
      latestPercentage: 45,
      hasQuestionLevelData: false,
      errorEvidence: undefined,
    });

    assert.equal(result.status, "Needs Support");
    assert.equal(result.diagnosisType, "Insufficient Evidence");
    assert.match(result.explanation, /Available assessment data is insufficient/i);
    assert.match(result.explanation, /short diagnostic assessment/i);
    assert.doesNotMatch(result.explanation, /Conceptual Gap|Procedural Error/i);
  });

  // Test Case 8: Invalid score inputs (null, undefined, NaN, out of range)
  it("Test 8: Handles invalid and out-of-range scores safely with fallback, never crashing or displaying NaN", () => {
    const invalidInputs = [null, undefined, NaN, -10, 150, "abc"];

    for (const val of invalidInputs) {
      const sanitized = sanitizeScore(val);
      assert.equal(sanitized, null);

      const result = generateCognitiveDiagnosis({
        conceptName: "Test Concept",
        latestPercentage: val as any,
      });

      assert.equal(result.diagnosisType, "Insufficient Evidence");
      assert.equal(result.status, "Needs Support");
      assert.match(result.explanation, /Invalid or missing score data/i);
      assert.doesNotMatch(result.explanation, /NaN|null|undefined|-10|150/);
    }
  });

  // Test Case 9: Conceptual evidence (verified concept-level incorrect responses)
  it("Test 9: Verified conceptual error evidence correctly assigns Conceptual Gap", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Subject-Verb Agreement",
      latestPercentage: 45,
      errorEvidence: {
        hasConceptualEvidence: true,
        conceptualDetails: "confusion between singular and plural verbs with collective nouns",
      },
    });

    assert.equal(result.diagnosisType, "Conceptual Gap");
    assert.equal(result.status, "Needs Support");
    assert.match(result.explanation, /Conceptual Gap/i);
    assert.match(result.explanation, /underlying concept/i);
    assert.match(result.explanation, /collective nouns/i);
    assert.match(result.recommendedAction, /concrete manipulatives|visual models|multi-sensory/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 10: Procedural evidence (verified procedural error patterns)
  it("Test 10: Verified procedural error evidence correctly assigns Procedural Error", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "3-Digit Addition with Regrouping",
      latestPercentage: 50,
      errorEvidence: {
        hasProceduralEvidence: true,
        proceduralDetails: "column alignment and tens carry-over sequencing",
      },
    });

    assert.equal(result.diagnosisType, "Procedural Error");
    assert.equal(result.status, "Needs Support");
    assert.match(result.explanation, /Procedural Error/i);
    assert.match(result.explanation, /correct procedure/i);
    assert.match(result.explanation, /tens carry-over sequencing/i);
    assert.match(result.recommendedAction, /worked examples|scaffolding/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 11: Prerequisite weakness
  it("Test 11: Unmastered prerequisite concept assigns Prerequisite Weakness", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "Division Basics",
      latestPercentage: 35,
      prerequisiteInfo: {
        conceptId: "c-mult-01",
        conceptName: "Multiplication Tables",
        score: 50,
        isMastered: false,
      },
    });

    assert.equal(result.diagnosisType, "Prerequisite Weakness");
    assert.match(result.explanation, /Prerequisite Weakness/i);
    assert.match(result.explanation, /Multiplication Tables/);
    assert.match(result.explanation, /50%/);
    assert.match(result.recommendedAction, /Multiplication Tables/);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 12: Possible Careless Error
  it("Test 12: High historical baseline with isolated slip assigns Possible Careless Error", () => {
    const result = generateCognitiveDiagnosis({
      conceptName: "2D Shapes",
      latestPercentage: 75,
      previousPercentage: 95,
      attemptsCount: 2,
      errorEvidence: {
        hasCarelessEvidence: true,
      },
    });

    assert.equal(result.diagnosisType, "Possible Careless Error");
    assert.match(result.explanation, /Possible Careless Error/i);
    assert.match(result.explanation, /isolated slip/i);
    assert.match(result.recommendedAction, /self-review|error analysis/i);
    assert.doesNotMatch(result.explanation, /NaN|null|undefined/);
  });

  // Test Case 13: Full Gujarati localization support
  it("Test 13: Correctly localizes all diagnoses and badge metadata into Gujarati", () => {
    const resultGu = generateCognitiveDiagnosis({
      conceptName: "ભાગાકારની મૂળભૂત બાબતો",
      latestPercentage: 50,
      language: "gu",
    });

    assert.match(resultGu.explanation, /સહાયની જરૂર/);
    assert.match(resultGu.explanation, /૫૦%|50%/);
    assert.match(resultGu.recommendedAction, /માર્ગદર્શન|કાર્યપત્રકો/);
    assert.doesNotMatch(resultGu.explanation, /NaN|null|undefined/);

    const badgeGu = getDiagnosisBadgeStyle("Conceptual Gap");
    assert.equal(badgeGu.labelGu, "સૈદ્ધાંતિક ખામી");
    assert.equal(badgeGu.badgeVariant, "coral");
  });
});

