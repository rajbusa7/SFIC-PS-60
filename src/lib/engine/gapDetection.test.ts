import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectLearningGap, DEFAULT_THRESHOLDS } from "./gapDetection";

describe("Learning Gap Detection Engine", () => {
  it("detects High Priority 'Needs Support' for repeated low performance (Aarav Division case)", () => {
    const history = [
      { marksObtained: 8, maximumMarks: 20, recordedAt: "2026-09-10" }, // 40%
      { marksObtained: 7, maximumMarks: 20, recordedAt: "2026-09-24" }, // 35%
    ];

    const result = detectLearningGap("c-div-01", "Division Basics", history);

    assert.equal(result.masteryStatus, "Needs Support");
    assert.equal(result.priority, "High");
    assert.equal(result.latestPercentage, 35);
    assert.equal(result.previousPercentage, 40);
    assert.equal(result.deltaPercentagePoints, -5);
    assert.equal(result.attemptsCount, 2);
    assert.equal(result.requiresRemediation, true);
    // Explainable reasoning matches requirements
    assert.match(result.reason, /persistent difficulty|below the configured/i);
    assert.match(result.suggestedAction, /fundamentals/i);
  });

  it("detects 'Developing' with Medium priority when student is between 60% and 79%", () => {
    const history = [
      { marksObtained: 14, maximumMarks: 20, recordedAt: "2026-10-01" }, // 70%
    ];

    const result = detectLearningGap("c-mult-01", "Multiplication Tables", history);

    assert.equal(result.masteryStatus, "Developing");
    assert.equal(result.priority, "Medium");
    assert.equal(result.latestPercentage, 70);
    assert.equal(result.requiresRemediation, true);
    assert.match(result.reason, /core basics/i);
  });

  it("detects Mastered and records positive percentage-point improvement upon reassessment", () => {
    const history = [
      { marksObtained: 7, maximumMarks: 20, recordedAt: "2026-09-24" }, // 35% (Initial)
      { marksObtained: 17, maximumMarks: 20, recordedAt: "2026-10-15" }, // 85% (Reassessment)
    ];

    const result = detectLearningGap("c-div-01", "Division Basics", history);

    assert.equal(result.masteryStatus, "Mastered");
    assert.equal(result.priority, "Low");
    assert.equal(result.latestPercentage, 85);
    assert.equal(result.previousPercentage, 35);
    assert.equal(result.deltaPercentagePoints, 50); // +50 pp
    assert.equal(result.requiresRemediation, false);
    assert.match(result.reason, /successfully mastered/i);
    assert.match(result.suggestedAction, /ready for advanced|curriculum/i);
  });

  it("identifies single observation limitation responsibly", () => {
    const history = [
      { marksObtained: 18, maximumMarks: 20, recordedAt: "2026-10-05" }, // 90%
    ];

    const result = detectLearningGap("c-geom-01", "2D Shapes", history);

    assert.equal(result.isSingleObservation, true);
    assert.equal(result.attemptsCount, 1);
    assert.match(result.reason, /single recorded assessment/i);
  });

  it("respects custom administrative thresholds", () => {
    const history = [
      { marksObtained: 16, maximumMarks: 20, recordedAt: "2026-10-05" }, // 80%
    ];

    // Under default (80%), 80% is Mastered
    const defaultRes = detectLearningGap("c-1", "Concept", history, DEFAULT_THRESHOLDS);
    assert.equal(defaultRes.masteryStatus, "Mastered");

    // Under strict school setting (85% mastery, 65% developing), 80% is Developing
    const strictRes = detectLearningGap("c-1", "Concept", history, {
      mastery: 85,
      developing: 65,
    });
    assert.equal(strictRes.masteryStatus, "Developing");
  });

  it("detects Critical priority for severe deficits below 30%", () => {
    const history = [
      { marksObtained: 4, maximumMarks: 20, recordedAt: "2026-10-01" }, // 20%
    ];

    const result = detectLearningGap("c-div-01", "Division Basics", history);
    assert.equal(result.priority, "Critical");
    assert.equal(result.masteryStatus, "Needs Support");
    assert.equal(result.lifecycleStatus, "Active Gap");
  });

  it("assigns internal lifecycle distinction: Active Gap, Monitoring/Developing, Closed Gap", () => {
    // 1. Needs Support -> Active Gap
    const active = detectLearningGap("c-1", "Test", [
      { marksObtained: 8, maximumMarks: 20, recordedAt: "2026-10-01" }, // 40%
    ]);
    assert.equal(active.lifecycleStatus, "Active Gap");

    // 2. Developing -> Monitoring/Developing
    const developing = detectLearningGap("c-1", "Test", [
      { marksObtained: 14, maximumMarks: 20, recordedAt: "2026-10-01" }, // 70%
    ]);
    assert.equal(developing.lifecycleStatus, "Monitoring/Developing");

    // 3. Mastered -> Closed Gap
    const mastered = detectLearningGap("c-1", "Test", [
      { marksObtained: 17, maximumMarks: 20, recordedAt: "2026-10-01" }, // 85%
    ]);
    assert.equal(mastered.lifecycleStatus, "Closed Gap");
  });

  it("differentiates Student A (improving/developing) vs Student B (declining/needs attention) at identical 75% score", () => {
    // Student A: 55% → 65% → 75% (Improving trajectory)
    const historyStudentA = [
      { marksObtained: 11, maximumMarks: 20, recordedAt: "2026-09-01" }, // 55%
      { marksObtained: 13, maximumMarks: 20, recordedAt: "2026-09-15" }, // 65%
      { marksObtained: 15, maximumMarks: 20, recordedAt: "2026-10-01" }, // 75%
    ];

    // Student B: 90% → 82% → 75% (Declining trajectory from mastery)
    const historyStudentB = [
      { marksObtained: 18, maximumMarks: 20, recordedAt: "2026-09-01" }, // 90%
      { marksObtained: 41, maximumMarks: 50, recordedAt: "2026-09-15" }, // 82%
      { marksObtained: 15, maximumMarks: 20, recordedAt: "2026-10-01" }, // 75%
    ];

    const resultA = detectLearningGap("c-math-div-01", "Division Basics", historyStudentA);
    const resultB = detectLearningGap("c-math-div-01", "Division Basics", historyStudentB);

    // Both have currentScore = 75%
    assert.equal(resultA.currentScore, 75);
    assert.equal(resultB.currentScore, 75);

    // Student A: Improving/Developing
    assert.equal(resultA.trend, "Improving");
    assert.match(resultA.trendText || "", /↑ \+10% Improving/);
    assert.equal(resultA.gapStatus, "Developing");
    assert.equal(resultA.masteryStatus, "Developing");
    assert.equal(resultA.lifecycleStatus, "Monitoring/Developing");
    assert.equal(resultA.requiresRemediation, false);
    assert.match(resultA.reason, /upward trajectory/i);

    // Student B: Declining and needing attention
    assert.equal(resultB.trend, "Declining");
    assert.match(resultB.trendText || "", /↓ -7% Declining/);
    assert.equal(resultB.gapStatus, "Needs Support");
    assert.equal(resultB.masteryStatus, "Needs Support");
    assert.equal(resultB.lifecycleStatus, "Active Gap");
    assert.equal(resultB.priority, "High");
    assert.equal(resultB.requiresRemediation, true);
    assert.match(resultB.reason, /declining trajectory|regression/i);
    assert.match(resultB.suggestedAction, /diagnose|stop regression/i);
  });

  it("provides all standardized trajectory fields: currentScore, previousScore, scoreDelta, trend, attemptCount, evidenceCount", () => {
    const history = [
      { marksObtained: 10, maximumMarks: 20, recordedAt: "2026-09-01" }, // 50%
      { marksObtained: 13, maximumMarks: 20, recordedAt: "2026-09-15" }, // 65%
    ];

    const result = detectLearningGap("c-test", "Test Topic", history);

    assert.equal(result.currentScore, 65);
    assert.equal(result.previousScore, 50);
    assert.equal(result.scoreDelta, 15);
    assert.equal(result.trend, "Improving");
    assert.match(result.trendText || "", /↑ \+15% Improving/);
    assert.equal(result.attemptCount, 2);
    assert.equal(result.evidenceCount, 2);
    assert.equal(result.supportThreshold, 60);
    assert.equal(result.masteryThreshold, 80);
    assert.equal(result.gapStatus, "Developing");
  });

  it("identifies Insufficient Data and Stable trends accurately", () => {
    // Insufficient Data (1 attempt)
    const single = detectLearningGap("c-1", "Single Observation", [
      { marksObtained: 14, maximumMarks: 20, recordedAt: "2026-10-01" }, // 70%
    ]);
    assert.equal(single.trend, "Insufficient Data");
    assert.equal(single.trendText, "⋯ Insufficient Data");
    assert.equal(single.attemptCount, 1);
    assert.equal(single.evidenceCount, 1);

    // Stable (70% -> 71% -> 70%)
    const stable = detectLearningGap("c-1", "Stable Trajectory", [
      { marksObtained: 70, maximumMarks: 100, recordedAt: "2026-09-01" }, // 70%
      { marksObtained: 71, maximumMarks: 100, recordedAt: "2026-09-15" }, // 71%
      { marksObtained: 70, maximumMarks: 100, recordedAt: "2026-10-01" }, // 70%
    ]);
    assert.equal(stable.trend, "Stable");
    assert.equal(stable.trendText, "→ Stable");
  });

  it("factors in prerequisite mastery status and assessment recency", () => {
    const history = [
      { marksObtained: 14, maximumMarks: 20, recordedAt: "2026-05-01" }, // 70% (older date)
    ];

    // With unmastered prerequisites and older assessment date
    const withPrereqGap = detectLearningGap(
      "c-div-01",
      "Division Basics",
      history,
      DEFAULT_THRESHOLDS,
      {
        prerequisitesMastered: false,
        referenceDate: "2026-10-01",
      }
    );

    assert.equal(withPrereqGap.prerequisitesMastered, false);
    assert.ok(withPrereqGap.recencyDays && withPrereqGap.recencyDays > 100);
    assert.match(withPrereqGap.reason, /prerequisite/i);
    assert.match(withPrereqGap.reason, /evidence recorded/i);
  });

  it("calculates severityScore (0-100), severityLevel and severityReasons explaining priority assignment", () => {
    // Critical scenario: 3 attempts below support threshold, declining, unmastered prerequisite
    const history = [
      { marksObtained: 5, maximumMarks: 20, recordedAt: "2026-09-01" }, // 25%
      { marksObtained: 4, maximumMarks: 20, recordedAt: "2026-09-15" }, // 20%
      { marksObtained: 3, maximumMarks: 20, recordedAt: "2026-10-01" }, // 15%
    ];

    const result = detectLearningGap(
      "c-div-01",
      "Division Basics",
      history,
      DEFAULT_THRESHOLDS,
      {
        prerequisitesMastered: false,
        hasRepeatedErrors: true,
      }
    );

    assert.ok(result.severityScore !== undefined && result.severityScore >= 75);
    assert.equal(result.severityLevel, "Critical");
    assert.equal(result.priority, "Critical");
    assert.ok(result.severityReasons && result.severityReasons.length >= 2);
    // Reasons explain the primary drivers transparently for teachers
    assert.ok(result.severityReasons.some((r) => r.includes("deficit") || r.includes("benchmark")));
    assert.ok(result.severityReasons.some((r) => r.includes("prerequisite")));
  });

  it("identifies root-cause prerequisite concept and ordered learning path", () => {
    const history = [
      { marksObtained: 10, maximumMarks: 25 },
      { marksObtained: 8, maximumMarks: 25 },
    ];

    const result = detectLearningGap(
      "c-place-01",
      "Place Value & 3-Digit Addition",
      history,
      DEFAULT_THRESHOLDS,
      {
        prerequisitesMastered: false,
      }
    );

    assert.equal(result.isRootGapIdentified, true);
    assert.ok(result.rootConcept);
    assert.equal(result.rootConcept?.name, "Regrouping");
    assert.ok(result.recommendedLearningOrder && result.recommendedLearningOrder.length >= 2);
    assert.ok(result.recommendedLearningOrder.includes("Regrouping"));
    assert.ok(result.recommendedLearningOrder.includes("3-Digit Addition"));
    assert.ok(result.rootCauseConfidence && result.rootCauseConfidence >= 0.8);
  });
});
