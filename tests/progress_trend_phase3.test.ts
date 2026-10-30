import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAssessmentTrend,
  calculateScoreDelta,
  formatScoreDelta,
  STABILITY_TOLERANCE_PP,
} from "../src/lib/engine/progressTrend";

describe("Phase 3: Lightweight Assessment Progress Trend Engine", () => {
  // Test Case 1: Improving (50% -> 70%)
  it("Test 1: Improving performance (50% -> 70%) calculates +20 pp and outputs ↑ +20 pp Improving", () => {
    const result = calculateAssessmentTrend({
      currentScore: 70,
      previousScore: 50,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.hasPreviousAssessment, true);
    assert.equal(result.currentScore, 70);
    assert.equal(result.previousScore, 50);
    assert.equal(result.scoreDelta, 20); // +20 pp, NOT +40% growth
    assert.equal(result.trend, "Improving");
    assert.equal(result.trendLabel, "Improving");
    assert.equal(result.formattedDelta, "+20 pp");
    assert.equal(result.formattedBadge, "↑ +20 pp Improving");
    assert.equal(result.arrow, "↑");
    assert.equal(result.statusVariant, "mint");
  });

  // Test Case 2: Stable (75% -> 75%)
  it("Test 2: Stable performance (75% -> 75%) calculates 0 pp and outputs → Stable", () => {
    const result = calculateAssessmentTrend({
      currentScore: 75,
      previousScore: 75,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.hasPreviousAssessment, true);
    assert.equal(result.scoreDelta, 0);
    assert.equal(result.trend, "Stable");
    assert.equal(result.trendLabel, "Stable");
    assert.equal(result.formattedBadge, "→ Stable");
    assert.equal(result.arrow, "→");
    assert.equal(result.statusVariant, "neutral");
  });

  // Test Case 3: Declining (85% -> 65%)
  it("Test 3: Declining performance (85% -> 65%) calculates -20 pp and outputs ↓ -20 pp Declining", () => {
    const result = calculateAssessmentTrend({
      currentScore: 65,
      previousScore: 85,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.hasPreviousAssessment, true);
    assert.equal(result.scoreDelta, -20);
    assert.equal(result.trend, "Declining");
    assert.equal(result.trendLabel, "Declining");
    assert.equal(result.formattedDelta, "-20 pp");
    assert.equal(result.formattedBadge, "↓ -20 pp Declining");
    assert.equal(result.arrow, "↓");
    assert.equal(result.statusVariant, "coral");
  });

  // Test Case 4: Small improvement within 2 pp tolerance (70% -> 71%)
  it("Test 4: Small improvement (+1 pp) within stability tolerance (2 pp) is classified as Stable", () => {
    const result = calculateAssessmentTrend({
      currentScore: 71,
      previousScore: 70,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.hasPreviousAssessment, true);
    assert.equal(result.scoreDelta, 1);
    assert.equal(result.trend, "Stable");
    assert.equal(result.formattedBadge, "→ Stable");
    assert.equal(result.arrow, "→");
  });

  // Test Case 5: Small decline within 2 pp tolerance (70% -> 68%)
  it("Test 5: Small decline (-2 pp) within stability tolerance (2 pp) is classified as Stable", () => {
    const result = calculateAssessmentTrend({
      currentScore: 68,
      previousScore: 70,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.hasPreviousAssessment, true);
    assert.equal(result.scoreDelta, -2);
    assert.equal(result.trend, "Stable");
    assert.equal(result.formattedBadge, "→ Stable");
    assert.equal(result.arrow, "→");
  });

  // Test Case 6: Decline beyond tolerance (70% -> 67%)
  it("Test 6: Decline beyond 2 pp tolerance (-3 pp) is classified as Declining", () => {
    const result = calculateAssessmentTrend({
      currentScore: 67,
      previousScore: 70,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.scoreDelta, -3);
    assert.equal(result.trend, "Declining");
    assert.equal(result.formattedBadge, "↓ -3 pp Declining");
    assert.equal(result.arrow, "↓");
  });

  // Test Case 7: First assessment (no previous score)
  it("Test 7: First assessment (missing previous score) outputs First assessment without fabricating trend", () => {
    const result = calculateAssessmentTrend({
      currentScore: 70,
      previousScore: null,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.hasPreviousAssessment, false);
    assert.equal(result.scoreDelta, null);
    assert.equal(result.trend, null);
    assert.equal(result.trendLabel, "First assessment");
    assert.equal(result.formattedBadge, "First assessment");
    assert.equal(result.statusVariant, "amber");
  });

  // Test Case 8: Invalid history (undefined or NaN)
  it("Test 8: Invalid history handles null, undefined, NaN safely as First assessment", () => {
    const invalidValues = [undefined, null, NaN, -5, 120, "invalid"];

    for (const val of invalidValues) {
      const result = calculateAssessmentTrend({
        currentScore: 70,
        previousScore: val as any,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.hasPreviousAssessment, false);
      assert.equal(result.formattedBadge, "First assessment");
      assert.doesNotMatch(result.formattedBadge, /NaN|null|undefined/);
    }
  });

  // Test Case 9: Missing current score
  it("Test 9: Missing current score yields safe fallback without crashing or displaying NaN", () => {
    const result = calculateAssessmentTrend({
      currentScore: null,
      previousScore: 70,
    });

    assert.equal(result.isValid, false);
    assert.equal(result.scoreDelta, null);
    assert.equal(result.trend, null);
    assert.match(result.formattedBadge, /unavailable|ડેટા/i);
    assert.doesNotMatch(result.formattedBadge, /NaN|null|undefined/);
  });

  // Test Case 10: Percentage-point calculation utility
  it("Test 10: Percentage-point difference is strictly additive delta, never multiplicative growth", () => {
    const delta1 = calculateScoreDelta(70, 50);
    assert.equal(delta1, 20); // 70 - 50 = +20 pp (relative growth would be +40%)

    const delta2 = calculateScoreDelta(65, 85);
    assert.equal(delta2, -20); // 65 - 85 = -20 pp

    assert.equal(formatScoreDelta(20), "+20 pp");
    assert.equal(formatScoreDelta(-20), "-20 pp");
    assert.equal(formatScoreDelta(0), "0 pp");
    assert.equal(formatScoreDelta(null), "");
  });

  // Test Case 11: Gujarati localization
  it("Test 11: Accurately localizes trend badges and labels into Gujarati", () => {
    const improvingGu = calculateAssessmentTrend({
      currentScore: 70,
      previousScore: 50,
      language: "gu",
    });
    assert.equal(improvingGu.formattedBadgeGu, "↑ +20 pp સુધરતું");

    const stableGu = calculateAssessmentTrend({
      currentScore: 75,
      previousScore: 75,
      language: "gu",
    });
    assert.equal(stableGu.formattedBadgeGu, "→ સ્થિર");

    const decliningGu = calculateAssessmentTrend({
      currentScore: 65,
      previousScore: 85,
      language: "gu",
    });
    assert.equal(decliningGu.formattedBadgeGu, "↓ -20 pp ઘટતું");

    const firstGu = calculateAssessmentTrend({
      currentScore: 70,
      previousScore: null,
      language: "gu",
    });
    assert.equal(firstGu.formattedBadgeGu, "પ્રથમ મૂલ્યાંકન");
  });
});

