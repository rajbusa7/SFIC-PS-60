import test from "node:test";
import assert from "node:assert/strict";
import { diagnoseLearningGap, mapConfidenceToLevel } from "./diagnosisEngine";

test("Learning Gap Diagnosis Engine - Comprehensive Test Suite", async (t) => {
  await t.test("1. Insufficient Evidence: Flag single assessment observations and mark confidence as Low", () => {
    const result = diagnoseLearningGap({
      conceptId: "c-frac-01",
      conceptName: "Fractions Representation",
      currentScore: 55,
      attemptCount: 1,
      evidenceCount: 1,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: false,
    });

    assert.equal(result.gapType, "Insufficient Evidence");
    assert.equal(result.confidenceLevel, "Low");
    assert.equal(result.lowConfidenceDisclaimer, "Insufficient evidence — run a short diagnostic check.");
    assert.match(result.diagnosis, /insufficient evidence/i);
    assert.match(result.gapTypeReason, /single assessment observation/i);
    assert.match(result.gapTypeReason, /diagnostic exit ticket/i);
    assert.ok(result.confidence >= 0.55 && result.confidence <= 0.70);
    assert.equal(result.assessmentsAnalyzed, 1);
    assert.equal(result.questionsAnalyzed, 5);
    assert.ok(result.triggerRule.includes("55%"));
    assert.ok(result.errorPatternDetected.includes("Single observation"));
    assert.ok(Array.isArray(result.supportingEvidence));
    assert.ok(result.supportingEvidence.length >= 2);
    assert.ok(result.recommendedDiagnosticAction?.includes("exit ticket"));
    assert.equal(result.hasQuestionLevelEvidence, false);
  });

  await t.test("2. Prerequisite Gap: Detect unmastered prerequisites as root cause with High confidence", () => {
    const result = diagnoseLearningGap({
      conceptId: "c-div-02",
      conceptName: "2-Digit Division with Remainder",
      currentScore: 25,
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: false,
      hasRepeatedErrors: true,
    });

    assert.equal(result.gapType, "Prerequisite Gap");
    assert.equal(result.confidenceLevel, "High");
    assert.equal(result.confidence, 0.92);
    assert.equal(result.assessmentsAnalyzed, 2);
    assert.equal(result.questionsAnalyzed, 10);
    assert.match(result.gapTypeReason, /prerequisite foundational concepts/i);
    assert.ok(result.supportingEvidence.some((e) => e.includes("prerequisite")));
    assert.ok(result.triggerRule.includes("25%"));
  });

  await t.test("3. Careless Slip: Identify isolated dip from prior mastery with trigger rule", () => {
    const result = diagnoseLearningGap({
      conceptId: "c-geo-01",
      conceptName: "Basic Shapes & Perimeter",
      currentScore: 72,
      previousScore: 90,
      scoreDelta: -18,
      trend: "Declining",
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: false,
    });

    assert.equal(result.gapType, "Careless Slip");
    assert.equal(result.confidenceLevel, "High");
    assert.equal(result.confidence, 0.86);
    assert.match(result.gapTypeReason, /careless computational slip|temporary lapse/i);
    assert.ok(result.supportingEvidence.some((e) => e.includes("verified mastery")));
    assert.ok(result.triggerRule.includes("90%"));
  });

  await t.test("4. Language / Comprehension Barrier: Identify linguistic decoding obstacles in English/Gujarati", () => {
    const result = diagnoseLearningGap({
      conceptId: "c-eng-verb-01",
      conceptName: "Subject-Verb Agreement",
      subjectCode: "ENG",
      subjectName: "English",
      currentScore: 45,
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: true,
    });

    assert.equal(result.gapType, "Language / Comprehension Barrier");
    assert.equal(result.confidenceLevel, "High");
    assert.equal(result.confidence, 0.89);
    assert.ok(result.errorPatternDetected.includes("singular and plural"));
    assert.match(result.gapTypeReason, /subject-number agreement|singular vs plural/i);
    assert.ok(result.supportingEvidence.some((e) => e.includes("singular vs. plural")));
  });

  await t.test("5. Procedural Error: Identify multi-step execution and regrouping mistakes", () => {
    const result = diagnoseLearningGap({
      conceptId: "c-place-01",
      conceptName: "Place Value & 3-Digit Addition",
      subjectCode: "MATH",
      subjectName: "Mathematics",
      currentScore: 50,
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: false,
      errorPattern: "regrouping units to tens column",
    });

    assert.equal(result.gapType, "Procedural Error");
    assert.equal(result.confidenceLevel, "High");
    assert.equal(result.confidence, 0.89);
    assert.ok(result.errorPatternDetected.includes("regrouping"));
    assert.equal(
      result.gapTypeReason,
      "Student correctly identifies place values but repeatedly fails during column regrouping and carry-over execution."
    );
    assert.ok(result.supportingEvidence.some((e) => e.includes("regrouping")));
  });

  await t.test("6. Conceptual Gap: Classify persistent low scores with question evidence", () => {
    const sampleQuestionEvidence = [
      {
        questionNumber: 1,
        questionText: "If you have 12 laddus and want to share them equally among 3 friends, how many does each get?",
        topic: "Equal Sharing",
        studentResponse: "9 laddus",
        correctResponse: "4 laddus",
        detectedError: "Subtracted 3 from 12 (12 - 3 = 9) instead of equal partitioning",
        relatedConcept: "Division as Equal Sharing",
      },
    ];

    const result = diagnoseLearningGap({
      conceptId: "c-div-01",
      conceptName: "Division Basics & Equal Sharing",
      subjectCode: "MATH",
      subjectName: "Mathematics",
      currentScore: 35,
      previousScore: 40,
      scoreDelta: -5,
      trend: "Declining",
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: true,
      questionEvidence: sampleQuestionEvidence,
    });

    assert.equal(result.gapType, "Conceptual Gap");
    assert.equal(result.confidenceLevel, "High");
    assert.equal(result.confidence, 0.94);
    assert.equal(result.hasQuestionLevelEvidence, true);
    assert.equal(result.questionEvidence.length, 1);
    assert.equal(result.questionEvidence[0].studentResponse, "9 laddus");
    assert.equal(result.questionEvidence[0].correctResponse, "4 laddus");
    assert.ok(result.errorPatternDetected.includes("subtracts divisor"));
    assert.match(result.gapTypeReason, /equal sharing|repeated grouping/i);
  });

  await t.test("7. Prerequisite Gap takes precedence over single observation when prerequisitesMastered is false", () => {
    const result = diagnoseLearningGap({
      conceptId: "c-mult-02",
      conceptName: "Multiplication Multi-digit",
      currentScore: 40,
      attemptCount: 1,
      evidenceCount: 1,
      prerequisitesMastered: false,
    });

    assert.equal(result.gapType, "Prerequisite Gap");
    assert.equal(result.confidenceLevel, "High");
  });

  await t.test("8. Insufficient Evidence prescribes short diagnostic exit ticket", () => {
    const result = diagnoseLearningGap({
      conceptId: "c-evs-01",
      conceptName: "Plant Parts & Photosynthesis",
      currentScore: 50,
      attemptCount: 1,
      evidenceCount: 1,
      prerequisitesMastered: true,
    });

    assert.equal(result.gapType, "Insufficient Evidence");
    assert.equal(result.confidenceLevel, "Low");
    assert.ok(result.lowConfidenceDisclaimer);
    assert.match(result.lowConfidenceDisclaimer, /insufficient evidence/i);
    assert.ok(result.recommendedDiagnosticAction);
    assert.match(result.recommendedDiagnosticAction, /diagnostic exit ticket/i);
  });

  await t.test("9. mapConfidenceToLevel maps scores correctly across High, Medium, Low", () => {
    assert.equal(mapConfidenceToLevel(0.95), "High");
    assert.equal(mapConfidenceToLevel(0.85), "High");
    assert.equal(mapConfidenceToLevel(0.84), "Medium");
    assert.equal(mapConfidenceToLevel(0.70), "Medium");
    assert.equal(mapConfidenceToLevel(0.69), "Low");
    assert.equal(mapConfidenceToLevel(0.40), "Low");
  });
});
