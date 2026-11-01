import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateGapSeverity,
  mapSeverityScoreToLevel,
  type SeverityInput,
} from "./severityEngine";

describe("Learning Gap Severity Engine", () => {
  it("maps severity scores correctly to standardized levels (0-24: Low, 25-49: Medium, 50-74: High, 75-100: Critical)", () => {
    assert.equal(mapSeverityScoreToLevel(0), "Low");
    assert.equal(mapSeverityScoreToLevel(24), "Low");
    assert.equal(mapSeverityScoreToLevel(25), "Medium");
    assert.equal(mapSeverityScoreToLevel(49), "Medium");
    assert.equal(mapSeverityScoreToLevel(50), "High");
    assert.equal(mapSeverityScoreToLevel(74), "High");
    assert.equal(mapSeverityScoreToLevel(75), "Critical");
    assert.equal(mapSeverityScoreToLevel(100), "Critical");
  });

  it("calculates Critical severity score (75-100) when compounded by unmastered prerequisites and repeated errors", () => {
    const input: SeverityInput = {
      conceptId: "c-div-01",
      conceptName: "Division Basics",
      currentScore: 20, // Severe deficit (< 25%)
      previousScore: 25,
      scoreDelta: -5,
      trend: "Declining",
      attemptCount: 3,
      evidenceCount: 3,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: false, // Compounding prerequisite gap (+20)
      hasRepeatedErrors: true, // Repeated errors (+15)
      recencyDays: 7, // Fresh evidence (+5)
    };

    const result = calculateGapSeverity(input);

    assert.ok(result.severityScore >= 75 && result.severityScore <= 100);
    assert.equal(result.severityLevel, "Critical");
    assert.ok(result.severityReasons.length >= 2);
    // Explainable reasons match the exact weighted drivers
    assert.ok(result.severityReasons.some((r) => r.includes("deficit") || r.includes("benchmark")));
    assert.ok(result.severityReasons.some((r) => r.includes("prerequisite")));
    assert.ok(result.severityReasons.some((r) => r.includes("Persistent") || r.includes("trajectory")));
  });

  it("calculates High severity (50-74) for persistent difficulty with declining trajectory (Aarav case)", () => {
    const input: SeverityInput = {
      conceptId: "c-div-01",
      conceptName: "Division Basics",
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
      recencyDays: 10,
    };

    const result = calculateGapSeverity(input);

    assert.ok(result.severityScore >= 50 && result.severityScore <= 74);
    assert.equal(result.severityLevel, "High");
    assert.ok(result.severityReasons.length > 0);
    assert.ok(result.severityReasons.some((r) => r.includes("Persistent") || r.includes("below")));
  });

  it("calculates Medium severity (25-49) for developing concept needing guided practice", () => {
    const input: SeverityInput = {
      conceptId: "c-mult-01",
      conceptName: "Multiplication Tables",
      currentScore: 70, // In developing range (60-79)
      trend: "Insufficient Data",
      attemptCount: 1,
      evidenceCount: 1,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: false,
    };

    const result = calculateGapSeverity(input);

    assert.ok(result.severityScore >= 25 && result.severityScore <= 49);
    assert.equal(result.severityLevel, "Medium");
  });

  it("calculates Low severity (0-24) for mastered concept with stable trajectory", () => {
    const input: SeverityInput = {
      conceptId: "c-water-01",
      conceptName: "Water Cycle",
      currentScore: 85, // Above mastery threshold
      previousScore: 75,
      scoreDelta: 10,
      trend: "Improving",
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: false,
    };

    const result = calculateGapSeverity(input);

    assert.ok(result.severityScore >= 0 && result.severityScore <= 24);
    assert.equal(result.severityLevel, "Low");
  });

  it("reduces severity when student has positive upward recovery trend", () => {
    const decliningInput: SeverityInput = {
      currentScore: 45,
      previousScore: 55,
      scoreDelta: -10,
      trend: "Declining",
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: false,
    };

    const improvingInput: SeverityInput = {
      currentScore: 45,
      previousScore: 35,
      scoreDelta: 10,
      trend: "Improving",
      attemptCount: 2,
      evidenceCount: 2,
      supportThreshold: 60,
      masteryThreshold: 80,
      prerequisitesMastered: true,
      hasRepeatedErrors: false,
    };

    const decliningResult = calculateGapSeverity(decliningInput);
    const improvingResult = calculateGapSeverity(improvingInput);

    // Improving trajectory at same score should have strictly lower severity score than declining
    assert.ok(improvingResult.severityScore < decliningResult.severityScore);
  });
});
