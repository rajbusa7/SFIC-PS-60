import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getRoleAwareGapInterpretation,
  generateParentHomeActivity,
} from "./roleAwareGapEngine";
import {
  calculateInterventionEffectiveness,
  getInterventionFeedbackForPrescription,
} from "./interventionEffectiveness";
import type { InterventionRecord } from "@shared/types";

describe("Phase 6: Role-Aware Gap Interpretation & Intervention Effectiveness", () => {
  const sampleGap: any = {
    id: "gap-math-01",
    studentId: "stu-aarav-01",
    studentName: "Aarav Patel",
    conceptId: "c-math-add-3d",
    conceptName: "3-Digit Addition with Regrouping",
    subjectCode: "MATH",
    subjectName: "Mathematics",
    currentScore: 42,
    previousScore: 35,
    scoreDelta: 7,
    trend: "Improving",
    priority: "High Priority",
    status: "Active Gap",
    masteryStatus: "Needs Support",
    reason: "Needs foundational support in place value",
    dynamicStatus: "Needs Support",
    dynamicPriority: "High Priority",
    dynamicSeverityScore: 78,
    dynamicDiagnosis: "Prerequisite Concept Deficit",
    dynamicGapType: "Prerequisite Gap",
    dynamicTriggerRule: "Score dropped <60% across 3 consecutive assessments",
    dynamicRootConcept: { id: "c-math-place-value", name: "Place Value (Tens & Ones)" },
  };

  // ---------------------------------------------------------------------------
  // 1. Role-Aware Interpretation Tests
  // ---------------------------------------------------------------------------
  describe("Role-Aware Gap Interpretation", () => {
    it("Student View: Uses growth-oriented language and forbids negative deficit labels", () => {
      const studentInterp = getRoleAwareGapInterpretation(sampleGap, "student", "en");

      assert.strictEqual(studentInterp.role, "student");
      assert.ok(studentInterp.headline.length > 0);
      assert.ok(studentInterp.growthFocus && studentInterp.growthFocus.length > 0);
      assert.ok(studentInterp.milestones && studentInterp.milestones.length > 0);
      assert.ok(studentInterp.nextLearningStep && studentInterp.nextLearningStep.length > 0);

      // Verify STRICT absence of negative deficit terms
      const forbiddenPhrases = [
        "critical deficit",
        "cognitive obstacle",
        "severe learning gap",
        "failure",
        "failed",
        "deficient",
      ];

      const fullStudentText = [
        studentInterp.headline,
        studentInterp.growthFocus,
        studentInterp.progressNarrative,
        studentInterp.nextLearningStep || "",
        ...(studentInterp.milestones || []),
      ]
        .join(" ")
        .toLowerCase();

      for (const phrase of forbiddenPhrases) {
        assert.ok(
          !fullStudentText.includes(phrase),
          `Student text should NEVER contain negative deficit phrase "${phrase}"`
        );
      }
    });

    it("Parent View: Uses simple, non-technical language with strengths and 5-min home activity", () => {
      const parentInterp = getRoleAwareGapInterpretation(sampleGap, "parent", "en");

      assert.strictEqual(parentInterp.role, "parent");
      assert.ok(parentInterp.strengthsSummary, "Parent view must highlight child's strengths");
      assert.ok(parentInterp.growthFocus, "Parent view must explain current focus");
      assert.ok(parentInterp.progressNarrative, "Parent view must explain improvement/progress");
      assert.ok(parentInterp.teacherRecommendation, "Parent view must include teacher recommendation");
      assert.ok(parentInterp.parentHomeActivity, "Parent view must provide a 5-10 minute home activity");

      const act = parentInterp.parentHomeActivity;
      assert.ok(act.durationMinutes >= 5 && act.durationMinutes <= 15, "Activity must be 5-15 mins");
      assert.ok(act.commonHouseholdMaterials.length > 0, "Activity must use household materials");
      assert.ok(act.whatParentDoes.length > 0, "Activity must instruct parent clearly");
      assert.ok(act.conversationalPrompt.length > 0, "Activity must provide conversational prompt");

      // Verify STRICT absence of developer metrics
      const developerJargon = [
        "threshold formula",
        "coefficient",
        "p-value",
        "standard deviation",
        "weight factor",
        "beta parameter",
      ];
      const fullParentText = [
        parentInterp.headline,
        parentInterp.strengthsSummary || "",
        parentInterp.growthFocus,
        parentInterp.progressNarrative,
        parentInterp.teacherRecommendation || "",
      ]
        .join(" ")
        .toLowerCase();

      for (const jargon of developerJargon) {
        assert.ok(
          !fullParentText.includes(jargon),
          `Parent text should not contain developer formula jargon "${jargon}"`
        );
      }
    });

    it("Teacher View: Contains professional diagnostic detail and trigger rules", () => {
      const teacherInterp = getRoleAwareGapInterpretation(sampleGap, "teacher", "en");

      assert.strictEqual(teacherInterp.role, "teacher");
      assert.ok(teacherInterp.headline.includes("78/100"));
      assert.ok(teacherInterp.growthFocus && teacherInterp.growthFocus.includes("Place Value (Tens & Ones)"));
    });

    it("Multilingual Home Activities: Generates accurate activities in English, Gujarati, and Hindi", () => {
      const actEn = generateParentHomeActivity(sampleGap, "en");
      const actGu = generateParentHomeActivity(sampleGap, "gu");
      const actHi = generateParentHomeActivity(sampleGap, "hi");

      assert.strictEqual(actEn.language, "en");
      assert.strictEqual(actGu.language, "gu");
      assert.strictEqual(actHi.language, "hi");

      assert.ok(actGu.title.length > 0);
      assert.ok(actGu.whatParentDoes.length > 0);
      assert.ok(actHi.title.length > 0);
      assert.ok(actHi.whatParentDoes.length > 0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Intervention Effectiveness Tracking Tests
  // ---------------------------------------------------------------------------
  describe("Intervention Effectiveness Tracking", () => {
    const testRecords: InterventionRecord[] = [
      {
        id: "int-1",
        interventionType: "Base-10 Blocks & Bundling Sticks",
        conceptId: "c-math-add-3d",
        conceptName: "3-Digit Addition with Regrouping",
        subjectCode: "MATH",
        studentId: "stu-1",
        studentName: "Aarav",
        preInterventionScore: 35,
        postInterventionScore: 55,
        scoreDelta: 20,
        date: "2026-10-10",
        durationMinutes: 15,
        teacherFeedback: "Good visual engagement",
        outcome: "Developing",
      },
      {
        id: "int-2",
        interventionType: "Base-10 Blocks & Bundling Sticks",
        conceptId: "c-math-add-3d",
        conceptName: "3-Digit Addition with Regrouping",
        subjectCode: "MATH",
        studentId: "stu-2",
        studentName: "Diya",
        preInterventionScore: 40,
        postInterventionScore: 82,
        scoreDelta: 42,
        date: "2026-10-12",
        durationMinutes: 15,
        teacherFeedback: "Mastered regrouping",
        outcome: "Mastered",
      },
      {
        id: "int-3",
        interventionType: "Guided Structured Worksheets",
        conceptId: "c-math-add-3d",
        conceptName: "3-Digit Addition with Regrouping",
        subjectCode: "MATH",
        studentId: "stu-3",
        studentName: "Meera",
        preInterventionScore: 45,
        postInterventionScore: 50,
        scoreDelta: 5,
        date: "2026-10-14",
        durationMinutes: 20,
        teacherFeedback: "Needed repetitive prompts",
        outcome: "Developing",
      },
    ];

    it("Aggregates times used, average observed improvement, and mastery rate accurately", () => {
      const summaries = calculateInterventionEffectiveness(testRecords);

      const base10Summary = summaries.find((s) => s.interventionType === "Base-10 Blocks & Bundling Sticks");
      assert.ok(base10Summary, "Base-10 Blocks summary should exist");
      assert.strictEqual(base10Summary.timesUsed, 2);
      // (20 + 42) / 2 = 31
      assert.strictEqual(base10Summary.averageObservedImprovement, 31);
      // 1 out of 2 reached >= 80% (Diya reached 82%) => 50%
      assert.strictEqual(base10Summary.masteryAchievementRate, 50);
      assert.strictEqual(base10Summary.averageDurationMinutes, 15);
    });

    it("Strictly uses non-causal language in summary narratives", () => {
      const summaries = calculateInterventionEffectiveness(testRecords);

      for (const summary of summaries) {
        if (summary.hasSufficientEvidence) {
          assert.ok(
            summary.nonCausalStatement?.includes("Average observed improvement after this intervention"),
            "Summary statement must use strictly non-causal phrasing for sufficient evidence"
          );
        } else {
          assert.ok(
            summary.nonCausalStatement?.includes("Insufficient historical evidence"),
            "Summary statement must state insufficient evidence when observations < 2"
          );
        }

        // Must NEVER make causal claims
        assert.ok(
          !summary.nonCausalStatement?.toLowerCase().includes("causes"),
          "Summary statement must not make causal claim 'causes'"
        );
        assert.ok(
          !summary.nonCausalStatement?.toLowerCase().includes("guarantees"),
          "Summary statement must not claim 'guarantees'"
        );
      }
    });

    it("Feedback Loop: Returns empirical insight when timesUsed >= 2", () => {
      const feedback = getInterventionFeedbackForPrescription(
        "Base-10 Blocks & Bundling Sticks",
        "3-Digit Addition with Regrouping",
        testRecords
      );

      assert.ok(feedback);
      assert.strictEqual(feedback.hasHistoricalEvidence, true);
      assert.strictEqual(feedback.timesUsed, 2);
      assert.strictEqual(feedback.averageObservedImprovement, 31);
      assert.ok(feedback.feedbackText.includes("+31 percentage points"));
      assert.ok(feedback.feedbackText.includes("Average observed improvement after this intervention"));
    });

    it("Feedback Loop: Explicitly states 'Insufficient historical evidence' when timesUsed < 2 without fabricating data", () => {
      // Modality with only 1 record (or no records)
      const feedback = getInterventionFeedbackForPrescription(
        "Tactile Sand Trays",
        "3-Digit Addition with Regrouping",
        testRecords
      );

      assert.ok(feedback);
      assert.strictEqual(feedback.hasHistoricalEvidence, false);
      assert.strictEqual(feedback.timesUsed, 0);
      assert.ok(
        feedback.feedbackText.includes("Insufficient historical evidence"),
        "Must state insufficient evidence instead of fabricating improvement numbers"
      );
    });
  });
});
