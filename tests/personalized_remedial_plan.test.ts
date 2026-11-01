import { test, describe, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { remedialService } from "../apps/backend/src/services/remedialService";
import { generatePersonalizedRemedialPlan } from "../src/lib/engine/remedialEngine";
import type { RemedialPlan } from "../packages/shared/src/types";

describe("Personalized Remedial Plan Generator - Complete Verification Suite", () => {
  beforeEach(() => {
    // Reset database to clean test state
    db.resetToDemoData();
  });

  after(() => {
    // Clean up to prevent test pollution
    db.resetToDemoData();
  });

  test("Scenario 1: Student has a recorded learning gap (Aarav Division case)", async () => {
    // std-aarav has an identified learning gap in c-div-01 (score: 35% < 60%)
    const { plan, isNew } = db.generatePersonalizedPlanForStudent("std-aarav", "c-div-01", {
      forceNew: true,
      preferredStatus: "Pending teacher approval",
    });

    assert.ok(plan, "Plan should be generated");
    assert.strictEqual(plan.studentId, "std-aarav", "Student ID must match");
    assert.strictEqual(plan.conceptId, "c-div-01", "Competency ID must match");
    assert.strictEqual(plan.subjectCode, "MATH", "Subject must match");

    // Supporting assessment evidence
    assert.ok(Array.isArray(plan.supportingEvidence), "Supporting evidence must be an array");
    assert.ok(plan.supportingEvidence.length > 0, "Must contain actual historical assessment records");
    const latestEvidence = plan.supportingEvidence[plan.supportingEvidence.length - 1];
    assert.strictEqual(latestEvidence.percentage, 35, "Latest evidence must record actual score of 35%");
    assert.ok(latestEvidence.assessmentDate, "Evidence must include assessment date");
    assert.ok(latestEvidence.marksObtained <= latestEvidence.maximumMarks, "Marks obtained must be valid");

    // Pedagogical strategy & 5-step concrete sequence
    assert.ok(plan.teachingStrategy, "Must provide recommended teaching strategy");
    assert.match(plan.teachingStrategy, /Concrete|CRA|Manipulative/i, "Must recommend concrete CRA methodology");
    assert.ok(plan.learningObjective.length > 10, "Learning objective must be specific and measurable");
    assert.strictEqual(plan.difficulty, "Beginner", "Difficulty must be Beginner for score < 40%");
    assert.strictEqual(plan.estimatedMinutes, 20, "Suggested duration must be 20 minutes");

    // Steps
    assert.ok(Array.isArray(plan.steps), "Steps must be an array");
    assert.strictEqual(plan.steps.length, 5, "Must have exactly 5 structured remedial steps");
    plan.steps.forEach((step, idx) => {
      assert.strictEqual(step.stepNumber, idx + 1, `Step number must be ${idx + 1}`);
      assert.ok(step.title, "Step title must not be empty");
      assert.ok(step.description, "Step description must not be empty");
      assert.ok(step.durationMinutes > 0, "Step duration must be greater than 0");
      assert.strictEqual(step.completed, false, "Initial step must be uncompleted");
    });

    // Low-cost materials & practice questions
    assert.ok(plan.requiredMaterials.length > 0, "Must specify low-cost classroom materials");
    assert.ok(Array.isArray(plan.practiceQuestions), "Must include practice questions");
    assert.ok(plan.practiceQuestions.length >= 2, "Must have at least 2 progressive practice questions");
    assert.ok(plan.practiceQuestions[0].question, "Practice question must have text");
    assert.ok(plan.practiceQuestions[0].answer, "Practice question must have answer");

    // Success criteria & reassessment interval
    assert.ok(plan.reassessmentCriteria, "Must specify reassessment criteria");
    assert.match(plan.reassessmentCriteria, /80%/, "Success criteria must require at least 80% mastery");
    assert.strictEqual(plan.recommendedReassessmentIntervalDays, 5, "Urgent gap (<40%) should have 5-day interval");
    assert.ok(new Date(plan.reviewDate!).getTime() > Date.now(), "Review date must be in future");

    // Status
    assert.strictEqual(plan.status, "Pending teacher approval", "Status must be as requested");
  });

  test("Scenario 2: Student has no detected learning gap (Aarav EVS Water Cycle case - 80% Mastered)", async () => {
    // std-aarav has high marks (80% Mastered) in c-evs-water-01
    const { plan } = db.generatePersonalizedPlanForStudent("std-aarav", "c-evs-water-01", {
      forceNew: true,
      preferredStatus: "Draft",
    });

    assert.ok(plan);
    assert.strictEqual(plan.studentId, "std-aarav");
    assert.match(plan.identifiedKnowledgeGap!, /mastery|No active learning gap/i, "Must identify student has mastery");
    assert.match(plan.recommendationReason, /Mastered|enrichment|maintenance/i, "Must recommend enrichment instead of false remediation");
    assert.strictEqual(plan.difficulty, "Advanced", "Difficulty should be Advanced for mastered student");
  });

  test("Scenario 3: Student has insufficient assessment data", async () => {
    // Register a new student who has no assessment results yet
    const newStudent = db.addStudent({
      studentCode: "STD-TEST-001",
      displayName: "Rohan Varma",
      grade: 4,
      section: "A",
      classroomId: "cls-04-a",
      enrollmentStatus: "active",
      notes: "Newly enrolled student with zero assessment history",
    });

    const { plan } = db.generatePersonalizedPlanForStudent(newStudent.id, "c-div-01", {
      forceNew: true,
    });

    assert.ok(plan);
    assert.strictEqual(plan.supportingEvidence?.length, 0, "Supporting evidence must be empty");
    assert.match(plan.identifiedKnowledgeGap!, /Insufficient assessment data/i, "Must articulate insufficient data");
    assert.match(plan.recommendationReason, /diagnostic baseline check/i, "Must recommend baseline diagnostic observation");
    assert.strictEqual(plan.difficulty, "Beginner", "Default difficulty should be Beginner");
  });

  test("Scenario 4: Student has multiple learning gaps", async () => {
    // Aarav Patel has gaps in both c-div-01 and c-place-01
    const res1 = db.generatePersonalizedPlanForStudent("std-aarav", "c-div-01", { forceNew: true });
    const res2 = db.generatePersonalizedPlanForStudent("std-aarav", "c-place-01", { forceNew: true });

    assert.notStrictEqual(res1.plan.id, res2.plan.id, "Plans for different concepts must have distinct IDs");
    assert.strictEqual(res1.plan.conceptId, "c-div-01");
    assert.strictEqual(res2.plan.conceptId, "c-place-01");

    // Fetch all plans for Aarav
    const aaravPlans = db.getRemedialPlans("std-aarav");
    assert.ok(aaravPlans.some((p) => p.conceptId === "c-div-01"), "Should include division plan");
    assert.ok(aaravPlans.some((p) => p.conceptId === "c-place-01"), "Should include place-value plan");
  });

  test("Scenario 5: Student has a previous remedial plan (History & Versioning)", async () => {
    // Generate initial plan for fractions (c-frac-01 has no pre-existing seed plan)
    const firstResult = db.generatePersonalizedPlanForStudent("std-aarav", "c-frac-01", {
      forceNew: true,
      preferredStatus: "Completed",
    });
    const firstPlan = firstResult.plan;
    assert.strictEqual(firstPlan.version, 1, "First plan should be version 1");

    // Generate subsequent plan after previous cycle
    const secondResult = db.generatePersonalizedPlanForStudent("std-aarav", "c-frac-01", {
      forceNew: true,
      preferredStatus: "Draft",
    });
    const secondPlan = secondResult.plan;

    assert.strictEqual(secondPlan.version, 2, "Second plan should increment version to 2");
    assert.strictEqual(secondPlan.previousPlanId, firstPlan.id, "Second plan must reference previousPlanId");
    assert.match(secondPlan.teachingStrategy!, /Cycle 2 Enhanced/i, "Strategy should adapt for cycle 2");

    // Retrieve history
    const history = db.getRemedialPlanHistory("std-aarav", "c-frac-01");
    assert.strictEqual(history.length, 2, "History must contain both iterations in chronological order");
  });

  test("Scenario 6: An activity step is marked completed and status updates", async () => {
    const { plan } = db.generatePersonalizedPlanForStudent("std-aarav", "c-div-01", {
      forceNew: true,
      preferredStatus: "Approved",
    });

    assert.strictEqual(plan.status, "Approved");
    assert.deepStrictEqual(plan.completedStepNumbers, []);

    // Complete Step 1
    const updated1 = db.recordRemedialStepCompletion(plan.id, 1, true);
    assert.ok(updated1);
    assert.strictEqual(updated1.status, "In Progress", "Completing a step should advance status to In Progress");
    assert.deepStrictEqual(updated1.completedStepNumbers, [1], "Completed steps must contain [1]");
    assert.strictEqual(updated1.steps[0].completed, true, "Step 1 completed flag must be true");

    // Complete Step 2
    const updated2 = db.recordRemedialStepCompletion(plan.id, 2, true);
    assert.ok(updated2);
    assert.deepStrictEqual(updated2.completedStepNumbers, [1, 2], "Completed steps must contain [1, 2]");
    assert.strictEqual(updated2.steps[1].completed, true, "Step 2 completed flag must be true");

    // Uncomplete Step 1
    const updated3 = db.recordRemedialStepCompletion(plan.id, 1, false);
    assert.ok(updated3);
    assert.deepStrictEqual(updated3.completedStepNumbers, [2], "Step 1 should be removed from completed steps");
    assert.strictEqual(updated3.steps[0].completed, false, "Step 1 completed flag must be false");
  });

  test("Scenario 7: An invalid student identifier is supplied", async () => {
    assert.throws(
      () => {
        db.generatePersonalizedPlanForStudent("non-existent-student-9999", "c-div-01");
      },
      /Student with ID 'non-existent-student-9999' was not found/,
      "Must throw descriptive error for invalid student ID"
    );
  });

  test("Scenario 8: An unauthorised user requests a plan", async () => {
    // Parent profile par-001 is for Aarav (std-aarav).
    // Attempting to access Diya's (std-diya) plans must be rejected.
    await assert.rejects(
      async () => {
        await remedialService.getRemedialPlans(
          { studentId: "std-diya" },
          undefined,
          { role: "parent", studentId: "std-aarav" }
        );
      },
      /Unauthorized: Parents can only access remedial plans for their own child/,
      "Must forbid parent from accessing another student's plan"
    );

    // Attempting to access Diya's individual plan by ID
    const diyaPlans = db.getRemedialPlans("std-diya");
    if (diyaPlans.length > 0) {
      await assert.rejects(
        async () => {
          await remedialService.getRemedialPlanById(diyaPlans[0].id, {
            role: "parent",
            studentId: "std-aarav",
          });
        },
        /Unauthorized: Parents can only view remedial plans for their own child/,
        "Must forbid parent from viewing other child's plan"
      );
    }
  });

  test("Scenario 9: Repeated request must not create duplicate plans", async () => {
    // std-diya has no pre-existing plan for c-place-01 in seed data
    // First request generates plan
    const call1 = db.generatePersonalizedPlanForStudent("std-diya", "c-place-01", {
      forceNew: false,
    });
    assert.strictEqual(call1.isNew, true, "First call creates new plan");

    const initialPlanCount = db.getRemedialPlans("std-diya").filter((p) => p.conceptId === "c-place-01").length;
    assert.strictEqual(initialPlanCount, 1, "Exactly 1 plan should exist after first call");

    // Second request (e.g. page refresh or repeated API call)
    const call2 = db.generatePersonalizedPlanForStudent("std-diya", "c-place-01", {
      forceNew: false,
    });
    assert.strictEqual(call2.isNew, false, "Second call must NOT create new plan");
    assert.strictEqual(call2.plan.id, call1.plan.id, "Must return the exact existing plan");

    const finalPlanCount = db.getRemedialPlans("std-diya").filter((p) => p.conceptId === "c-place-01").length;
    assert.strictEqual(finalPlanCount, 1, "Total plan count must not increase on duplicate call");
  });

  test("Scenario 10: External AI provider is unavailable (Deterministic offline fallback)", async () => {
    // Generate plan without any external API keys
    const result = await remedialService.generatePlan({
      studentId: "std-aarav",
      conceptId: "c-div-01",
      forceNew: true,
    });

    assert.ok(result.plan, "Plan must be produced offline");
    assert.strictEqual(result.isAiGenerated, false, "Must flag as rule-based deterministic");
    assert.ok(result.plan.steps.length === 5, "Offline plan must still have all 5 steps");
    assert.ok(result.plan.requiredMaterials.length > 0, "Must include offline materials");
  });

  test("Regression Test: Student Directory, Assessment System and Gap Detection continue to work", async () => {
    // 1. Student Directory
    const students = db.getStudents();
    assert.ok(students.length >= 5, "Students list must be accessible");
    const aarav = db.getStudentById("std-aarav");
    assert.ok(aarav && aarav.displayName === "Aarav Patel", "Student directory must return Aarav");

    // 2. Assessment System
    const assessments = db.getAssessments();
    assert.ok(assessments.length > 0, "Assessments must be accessible");

    // Record a new assessment result for Aarav showing improvement to 85%
    const results = db.recordResults([
      {
        assessmentId: "asm-retest-01",
        studentId: "std-aarav",
        conceptId: "c-div-01",
        marksObtained: 17,
        maximumMarks: 20,
        percentage: 85,
        recordedAt: new Date().toISOString(),
      },
    ]);
    assert.strictEqual(results[0].percentage, 85, "Calculated percentage must be 85%");

    // 3. Gap Detection automatically resolves upon reassessment
    const updatedGaps = db.getLearningGaps("std-aarav");
    const divGap = updatedGaps.find((g) => g.conceptId === "c-div-01");
    assert.ok(divGap, "Gap record must exist");
    assert.strictEqual(divGap.masteryStatus, "Mastered", "Gap must be updated to Mastered");
    assert.strictEqual(divGap.status, "Resolved", "Gap status must be Resolved");
  });
});
