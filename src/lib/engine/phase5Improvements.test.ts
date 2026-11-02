import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateTodaysPriorities, isWithinRecentDays } from "./todaysPriorities";
import { generatePedagogicalPrescription, getSuggestedModality } from "./prescriptionEngine";
import { detectLearningGap } from "./gapDetection";
import { db } from "../db/database";

describe("Phase 5: Three Connected Learning Gap Improvements", () => {
  // =========================================================================
  // PART 1: TODAY'S PRIORITIES / ACTION QUEUE
  // =========================================================================
  describe("Part 1: Teacher Today's Priorities / Action Queue", () => {
    it("dynamically calculates actionable priority counts from live gap records without hardcoding", () => {
      const gaps = db.getLearningGaps();
      const priorities = calculateTodaysPriorities(gaps);

      // Verify counts are positive numbers calculated from data
      assert.strictEqual(typeof priorities.immediateSupportCount, "number");
      assert.strictEqual(typeof priorities.developingCount, "number");
      assert.strictEqual(typeof priorities.readyToReassessCount, "number");
      assert.strictEqual(typeof priorities.recentlyMasteredCount, "number");
      assert.strictEqual(typeof priorities.reopenedGapsCount, "number");

      // Verify students with reopened gaps or high priority needs support are in immediate support
      assert.ok(priorities.immediateSupportCount >= 1, "Should have at least 1 student needing immediate support");
      assert.ok(priorities.readyToReassessCount >= 1, "Meera Shah should be ready to reassess");
      assert.ok(priorities.recentlyMasteredCount >= 1, "Pooja Joshi should be recently mastered");
      assert.ok(priorities.reopenedGapsCount >= 1, "Arjun Mehta should have a reopened gap");

      // Verify student ID and Gap ID tracking are consistent
      assert.strictEqual(priorities.reopenedStudentIds.includes("std-arjun"), true);
      assert.strictEqual(priorities.readyToReassessStudentIds.includes("std-meera"), true);
      assert.strictEqual(priorities.recentlyMasteredStudentIds.includes("std-pooja"), true);
    });

    it("deduplicates multiple gaps for the same student within category", () => {
      const mockGaps = [
        { id: "g1", studentId: "s1", masteryStatus: "Needs Support", dynamicStatus: "Needs Support", status: "Active Gap" },
        { id: "g2", studentId: "s1", masteryStatus: "Needs Support", dynamicStatus: "Needs Support", status: "Active Gap" },
        { id: "g3", studentId: "s2", masteryStatus: "Developing", dynamicStatus: "Developing", status: "Monitoring/Developing" },
      ];

      const priorities = calculateTodaysPriorities(mockGaps as any);
      assert.strictEqual(priorities.immediateSupportCount, 1, "Should count 1 unique student even if student has 2 gaps");
      assert.strictEqual(priorities.immediateSupportGapIds.length, 2, "Should track both gap IDs for filtering");
      assert.strictEqual(priorities.developingCount, 1);
    });
  });

  // =========================================================================
  // PART 2: PERSONALIZED PEDAGOGICAL PRESCRIPTIONS
  // =========================================================================
  describe("Part 2: Personalized Pedagogical Prescriptions", () => {
    it("generates concrete manipulatives prescription for Place Value", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Place Value (Tens and Ones)",
        subjectCode: "MATH",
        currentScore: 40,
        gapStatus: "Needs Support",
      });

      assert.match(prescription.activity, /place-value chart|base-10 blocks|bundled sticks/i);
      assert.strictEqual(prescription.remedialPlanEligible, true);
      assert.strictEqual(prescription.suggestedModality, "Concrete Manipulatives (Base-10 Blocks / Place-Value Charts / Bundled Sticks)");
    });

    it("generates 3-5 guided examples with base-10 blocks for 3-Digit Addition Regrouping", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "3-Digit Addition with Regrouping",
        subjectCode: "MATH",
        currentScore: 45,
        gapStatus: "Needs Support",
      });

      assert.match(prescription.activity, /base-10 blocks|place-value chart/i);
      assert.match(prescription.activity, /guided.*examples/i);
      assert.strictEqual(prescription.remedialPlanEligible, true);
    });

    it("generates skip counting and retrieval practice for Multiplication Tables", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Multiplication Tables (2 to 9)",
        subjectCode: "MATH",
        currentScore: 50,
        gapStatus: "Needs Support",
      });

      assert.match(prescription.activity, /skip counting|arrays|retrieval practice/i);
      assert.strictEqual(prescription.remedialPlanEligible, true);
    });

    it("generates concrete objects equal grouping before symbolic division for Division", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Division Basics (Equal Sharing)",
        subjectCode: "MATH",
        currentScore: 35,
        gapStatus: "Needs Support",
      });

      assert.match(prescription.activity, /concrete objects|equal groups|symbolic/i);
      assert.strictEqual(prescription.remedialPlanEligible, true);
    });

    it("generates evidence-finding passage questions for Reading Comprehension", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Reading Comprehension & Context Clues",
        subjectCode: "ENG",
        currentScore: 45,
        gapStatus: "Needs Support",
      });

      assert.match(prescription.activity, /passage/i);
      assert.match(prescription.activity, /who|what|where|why|evidence/i);
      assert.strictEqual(prescription.remedialPlanEligible, true);
    });

    it("generates labelled visual sequence and self-explanation for Water Cycle", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Water Cycle & Weather Patterns",
        subjectCode: "EVS",
        currentScore: 50,
        gapStatus: "Needs Support",
      });

      assert.match(prescription.activity, /visual sequence|evaporation|condensation|precipitation|own words/i);
      assert.strictEqual(prescription.remedialPlanEligible, true);
    });

    it("prescribes error-checking checklist on 2-3 questions for Careless Slip without full remediation", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Multiplication Tables (2 to 9)",
        subjectCode: "MATH",
        currentScore: 72,
        gapStatus: "Developing",
        diagnosisType: "Careless Slip",
      });

      assert.strictEqual(prescription.remedialPlanEligible, false);
      assert.match(prescription.activity, /error-checking checklist on 2–3 questions/i);
      assert.strictEqual(prescription.planStatusLabel, "Verification & error-checking practice recommended");
      assert.strictEqual(prescription.approximateDuration, "5 minutes");
    });

    it("prescribes diagnostic exit ticket for Insufficient Evidence", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Fractions Introduction",
        subjectCode: "MATH",
        currentScore: 50,
        gapStatus: "Needs Support",
        diagnosisType: "Insufficient Evidence",
      });

      assert.strictEqual(prescription.remedialPlanEligible, false);
      assert.match(prescription.activity, /diagnostic.*task|diagnostic.*check|exit ticket/i);
      assert.strictEqual(prescription.planStatusLabel, "Diagnostic check recommended before intervention");
    });

    it("does NOT recommend remediation for Mastered concept", () => {
      const prescription = generatePedagogicalPrescription({
        conceptName: "Multiplication Tables (2 to 9)",
        subjectCode: "MATH",
        currentScore: 88,
        gapStatus: "Mastered",
      });

      assert.strictEqual(prescription.remedialPlanEligible, false);
      assert.match(prescription.activity, /mastery achieved/i);
      assert.strictEqual(prescription.planStatusLabel, "Mastery achieved — continue periodic retrieval practice.");
    });
  });

  // =========================================================================
  // PART 3 & 4: LONGITUDINAL PROGRESS TRACKING, REASSESSMENT & GAP REOPENING
  // =========================================================================
  describe("Part 3, 4 & 5: Longitudinal Progress & Gap Reopening", () => {
    it("preserves single observation without implying longitudinal progress", () => {
      const singleAssessment = [
        {
          marksObtained: 8,
          maximumMarks: 20, // 40%
          recordedAt: "2026-10-15T09:00:00Z",
        },
      ];

      const result = detectLearningGap("c-eval-01", "Single Observation", singleAssessment);
      assert.strictEqual(result.assessmentHistory?.length, 1);
      assert.match(result.assessmentHistory?.[0].assessment || "", /Initial Assessment/i);
      assert.strictEqual(result.totalImprovement, 0);
      assert.strictEqual(result.trend, "Insufficient Data");
      assert.strictEqual(result.gapReopened, false);
    });

    it("tracks longitudinal assessment pathway ribbons and delta progression correctly", () => {
      const longitudinalAssessments = [
        { marksObtained: 7, maximumMarks: 20, recordedAt: "2026-09-01T09:00:00Z" }, // 35%
        { marksObtained: 9, maximumMarks: 20, recordedAt: "2026-09-10T09:00:00Z" }, // 45%
        { marksObtained: 12, maximumMarks: 20, recordedAt: "2026-09-20T09:00:00Z" }, // 60%
        { marksObtained: 15, maximumMarks: 20, recordedAt: "2026-10-01T09:00:00Z" }, // 75%
        { marksObtained: 17, maximumMarks: 20, recordedAt: "2026-10-15T09:00:00Z" }, // 85%
      ];

      const result = detectLearningGap("c-div-01", "Division Basics", longitudinalAssessments);
      assert.strictEqual(result.assessmentHistory?.length, 5);
      assert.strictEqual(result.currentScore, 85);
      assert.strictEqual(result.previousScore, 75);
      assert.strictEqual(result.latestScoreDelta, 10);
      assert.strictEqual(result.totalImprovement, 50); // 85 - 35 = +50%
      assert.strictEqual(result.masteryStatus, "Mastered");
      assert.strictEqual(result.trend, "Improving");
      assert.strictEqual(result.gapReopened, false);
    });

    it("accurately detects Gap Reopening when a previously mastered concept drops meaningfully below mastery (82% → 85% → 83% → 62%)", () => {
      const reopenedAssessments = [
        { marksObtained: 41, maximumMarks: 50, recordedAt: "2026-09-01T09:00:00Z" }, // 82%
        { marksObtained: 17, maximumMarks: 20, recordedAt: "2026-09-15T10:00:00Z" }, // 85% (Mastered!)
        { marksObtained: 83, maximumMarks: 100, recordedAt: "2026-10-05T09:00:00Z" }, // 83%
        { marksObtained: 31, maximumMarks: 50, recordedAt: "2026-10-20T12:00:00Z" }, // 62% (Drop!)
      ];

      const result = detectLearningGap("c-frac-01", "Fractions", reopenedAssessments, undefined, {
        hasRepeatedErrors: true,
      });

      assert.strictEqual(result.gapReopened, true, "Gap should be flagged as reopened");
      assert.strictEqual(result.previousMasteryScore, 85, "Should preserve previous mastery benchmark score");
      assert.strictEqual(result.masteryDate, "2026-09-15T10:00:00Z", "Should record mastery date");
      assert.strictEqual(result.currentScore, 62);
      assert.strictEqual(result.masteryStatus, "Needs Support");
      assert.strictEqual(result.priority, "High");
      assert.match(result.reason, /reopened/i);
    });
  });
});

