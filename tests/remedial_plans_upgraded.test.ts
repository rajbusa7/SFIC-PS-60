import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { GET as getPlansHandler, POST as postPlansHandler, PUT as putPlansHandler } from "../src/app/api/remedial-plans/route";
import { generateRemedialPlan, CURRICULUM_TEMPLATES } from "../src/lib/engine/remedialEngine";
import { detectLearningGap } from "../src/lib/engine/gapDetection";
import { db } from "../src/lib/db/database";

function mockRequest(url: string, method: string, body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Upgraded Remedial Plans Comprehensive Verification Suite", () => {
  after(() => {
    db.resetToDemoData();
  });

  it("1. Generates a valid plan from real available student inputs (name, class, section, baseline score)", () => {
    const gap = detectLearningGap("c-div-01", "Division Basics", [
      { marksObtained: 7, maximumMarks: 20, recordedAt: "2026-09-24T10:00:00Z" },
    ]);

    const plan = generateRemedialPlan(
      "std-aarav",
      "Aarav Patel",
      "c-div-01",
      "Division Basics & Equal Sharing",
      "MATH",
      gap,
      "Needs hands-on counters",
      {
        studentClass: 4,
        studentSection: "A",
        baselineScore: 35,
        baselineEvidence: "Baseline score of 35% on diagnostic exam",
        knownMisconceptions: "Struggling to divide into equal sets",
        confirmedOrInferred: "confirmed",
        masteryBenchmark: 80,
      }
    );

    assert.equal(plan.studentName, "Aarav Patel");
    assert.equal(plan.studentClass, 4);
    assert.equal(plan.studentSection, "A");
    assert.equal(plan.baselineScore, 35);
    assert.equal(plan.confirmedOrInferred, "confirmed");
    assert.equal(plan.masteryBenchmark, 80);
    assert.ok(plan.learningObjective.length > 10);
    assert.ok(plan.expectedSkill && plan.expectedSkill.length > 10);
  });

  it("2. Verifies that every newly generated plan contains exactly five ordered teaching steps", () => {
    const testConcepts = [
      { id: "c-div-01", name: "Division Basics", subject: "MATH" },
      { id: "c-mult-01", name: "Multiplication Tables", subject: "MATH" },
      { id: "c-place-01", name: "Place Value", subject: "MATH" },
      { id: "c-eng-blend-01", name: "Phonetic Blends", subject: "ENG" },
      { id: "c-eng-comp-01", name: "Reading Comprehension", subject: "ENG" },
      { id: "c-guj-matra-01", name: "Gujarati Matras", subject: "GUJ" },
      { id: "c-evs-water-01", name: "Water Cycle", subject: "EVS" },
      { id: "c-custom-unseen", name: "Unseen Concept", subject: "MATH" },
    ];

    for (const item of testConcepts) {
      const gap = detectLearningGap(item.id, item.name, [
        { marksObtained: 8, maximumMarks: 20, recordedAt: "2026-10-01" },
      ]);

      const plan = generateRemedialPlan(
        "std-test",
        "Test Student",
        item.id,
        item.name,
        item.subject as any,
        gap
      );

      assert.equal(plan.steps.length, 5, `Plan for ${item.id} must have exactly 5 steps`);
      for (let i = 0; i < 5; i++) {
        assert.equal(plan.steps[i].stepNumber, i + 1, `Step ${i + 1} must have correct number`);
        assert.ok(plan.steps[i].title.length > 0, `Step ${i + 1} must have a title`);
        assert.ok(plan.steps[i].learningObjective?.length, `Step ${i + 1} must have a learning objective`);
        assert.ok(plan.steps[i].teacherInstructions?.length, `Step ${i + 1} must have teacher instructions`);
        assert.ok(plan.steps[i].studentInstructions?.length, `Step ${i + 1} must have student instructions`);
        assert.ok(plan.steps[i].description.length > 0, `Step ${i + 1} must have description`);
        assert.ok(plan.steps[i].durationMinutes > 0, `Step ${i + 1} must have duration`);
      }
    }
  });

  it("3. Verifies that activities match the targeted subject and curriculum competency", () => {
    const mathGap = detectLearningGap("c-div-01", "Division", [{ marksObtained: 7, maximumMarks: 20, recordedAt: "2026-10-01T10:00:00Z" }]);
    const mathPlan = generateRemedialPlan("std-1", "Aarav", "c-div-01", "Division Basics", "MATH", mathGap);
    assert.match(mathPlan.steps[1].description, /counting|pebble|counter|circular/i);

    const gujGap = detectLearningGap("c-guj-matra-01", "Matras", [{ marksObtained: 8, maximumMarks: 20, recordedAt: "2026-10-01T10:00:00Z" }]);
    const gujPlan = generateRemedialPlan("std-2", "Diya", "c-guj-matra-01", "Gujarati Matras", "GUJ", gujGap, undefined, { language: "gu" });
    assert.match(gujPlan.steps[0].description, /માત્રા|ઉચ્ચારણ|કાનો/);

    const evsGap = detectLearningGap("c-evs-water-01", "Water Cycle", [{ marksObtained: 8, maximumMarks: 20, recordedAt: "2026-10-01T10:00:00Z" }]);
    const evsPlan = generateRemedialPlan("std-3", "Kabir", "c-evs-water-01", "Water Cycle", "EVS", evsGap);
    assert.match(evsPlan.steps[1].description, /droplet|cloud|condensation|water/i);
  });

  it("4. Verifies assessment questions and answer keys validity in Step 5", () => {
    const gap = detectLearningGap("c-div-01", "Division", [{ marksObtained: 7, maximumMarks: 20, recordedAt: "2026-10-01T10:00:00Z" }]);
    const plan = generateRemedialPlan("std-aarav", "Aarav", "c-div-01", "Division Basics", "MATH", gap);

    assert.ok(Array.isArray(plan.reassessmentQuestions));
    assert.equal(plan.reassessmentQuestions?.length, 5);

    plan.reassessmentQuestions?.forEach((q, idx) => {
      assert.equal(q.questionNumber, idx + 1);
      assert.ok(q.question && q.question.length > 5);
      assert.ok(q.correctAnswer && q.correctAnswer.length > 0);
      assert.ok(q.explanation && q.explanation.length > 0);
      assert.ok(q.marks >= 1);
    });
  });

  it("5 & 6. Verifies score calculation, baseline vs reassessment delta in percentage points, and benchmark decisions", async () => {
    // Baseline: 35%. Reassessment: 4 out of 5 = 80%.
    // Expected improvement = +45 percentage points (80 - 35 = 45 pp).
    const plan = db.createRemedialPlanForGap("gap-aarav-div", "Initial intervention");
    assert.ok(plan);

    const req = mockRequest("http://localhost:3000/api/remedial-plans", "POST", {
      action: "reassess",
      planId: plan.id,
      marksObtained: 4,
      maximumMarks: 5,
      answers: { 1: "5 candies", 2: "3 kites", 3: "6", 4: "5 × 4 = 20", 5: "Wrong" },
      notes: "Student demonstrated clear improvement.",
    });

    const res = await postPlansHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    const updatedPlan = data.plan;
    assert.equal(updatedPlan.reassessmentResult.marksObtained, 4);
    assert.equal(updatedPlan.reassessmentResult.maximumMarks, 5);
    assert.equal(updatedPlan.reassessmentResult.percentage, 80);
    assert.equal(updatedPlan.reassessmentResult.baselinePercentage, 35);
    // CRITICAL: delta must be +45 percentage points!
    assert.equal(updatedPlan.reassessmentResult.deltaPercentagePoints, 45);
    assert.equal(updatedPlan.reassessmentResult.isMastered, true);
    assert.equal(updatedPlan.status, "Completed");
    assert.deepEqual(updatedPlan.completedSteps, [1, 2, 3, 4, 5]);
    assert.ok(updatedPlan.reassessmentResult.retentionCheckDate);
  });

  it("7. Verifies that a failed reassessment keeps objective unresolved and triggers adaptive follow-up", async () => {
    // Create new plan for Dev
    const devPlan = db.createRemedialPlanForGap("gap-dev-verb", "Subject verb review");
    assert.ok(devPlan);

    // Reassess with only 2 out of 5 = 40% (below 80% benchmark)
    const reassessReq = mockRequest("http://localhost:3000/api/remedial-plans", "POST", {
      action: "reassess",
      planId: devPlan.id,
      marksObtained: 2,
      maximumMarks: 5,
      notes: "Student still confuses singular and plural subject agreement.",
    });

    const reassessRes = await postPlansHandler(reassessReq);
    assert.equal(reassessRes.status, 200);
    const reassessData = await reassessRes.json();
    assert.equal(reassessData.success, true);
    assert.equal(reassessData.plan.reassessmentResult.isMastered, false);
    assert.equal(reassessData.plan.status, "Needs Review");

    // Generate adaptive follow-up plan
    const followUpReq = mockRequest("http://localhost:3000/api/remedial-plans", "POST", {
      action: "followUp",
      parentPlanId: devPlan.id,
      customNotes: "Use physical subject-verb color cards and alternative scaffolding.",
    });

    const followUpRes = await postPlansHandler(followUpReq);
    assert.equal(followUpRes.status, 200);
    const followUpData = await followUpRes.json();
    assert.equal(followUpData.success, true);
    assert.ok(followUpData.plan);
    assert.equal(followUpData.plan.parentPlanId, devPlan.id);
    assert.equal(followUpData.plan.isFollowUp, true);
    assert.equal(followUpData.plan.steps.length, 5);
    assert.match(followUpData.plan.steps[1].title, /Alternative|અનુકૂલિત/i);
  });

  it("8. Verifies successful reassessment resolves learning gap in database", () => {
    const gap = db.getLearningGaps("std-aarav").find((g) => g.conceptId === "c-div-01");
    assert.ok(gap);
    assert.equal(gap.status, "Resolved");
    assert.equal(gap.masteryStatus, "Mastered");
  });

  it("9 & 10. Verifies step completion persistence and accurate progress tracking without overflow", async () => {
    const plan = db.createRemedialPlanForGap("gap-diya-place", "Place value steps");
    assert.ok(plan);

    // Toggle steps 1, 2, 3
    const putReq1 = mockRequest("http://localhost:3000/api/remedial-plans", "PUT", {
      id: plan.id,
      completedSteps: [1, 2, 3],
      status: "In Progress",
    });
    const res1 = await putPlansHandler(putReq1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.deepEqual(data1.plan.completedSteps, [1, 2, 3]);

    // Check progress percentage = (3 / 5) * 100 = 60%
    const pct = Math.round((data1.plan.completedSteps.length / data1.plan.steps.length) * 100);
    assert.equal(pct, 60);

    // Fetch via GET to confirm persistence across requests
    const getReq = mockRequest(`http://localhost:3000/api/remedial-plans?id=${plan.id}`, "GET");
    const getRes = await getPlansHandler(getReq);
    const getData = await getRes.json();
    assert.deepEqual(getData.plan.completedSteps, [1, 2, 3]);
  });

  it("11. Verifies that status filters return correct plans", async () => {
    const reqAll = mockRequest("http://localhost:3000/api/remedial-plans", "GET");
    const resAll = await getPlansHandler(reqAll);
    const dataAll = await resAll.json();
    assert.ok(dataAll.plans.length > 0);

    const reqCompleted = mockRequest("http://localhost:3000/api/remedial-plans?status=Completed", "GET");
    const resCompleted = await getPlansHandler(reqCompleted);
    const dataCompleted = await resCompleted.json();
    assert.ok(dataCompleted.plans.every((p: any) => p.status === "Completed"));
  });

  it("12. Verifies that editing a plan preserves recorded activity progress and assessment history", async () => {
    const plans = db.getRemedialPlans("std-aarav");
    const aaravPlan = plans[0];
    assert.ok(aaravPlan);
    const priorCompletedSteps = aaravPlan.completedSteps;
    const priorReassessment = aaravPlan.reassessmentResult;

    // Update teacher observations
    const editReq = mockRequest("http://localhost:3000/api/remedial-plans", "PUT", {
      id: aaravPlan.id,
      teacherNotes: "Updated teacher notes after session 2.",
      teacherObservations: "Student showed high engagement with counting tokens.",
    });

    const editRes = await putPlansHandler(editReq);
    assert.equal(editRes.status, 200);
    const editData = await editRes.json();

    // Notes updated
    assert.equal(editData.plan.teacherNotes, "Updated teacher notes after session 2.");
    // Assessment and steps preserved
    assert.deepEqual(editData.plan.completedSteps, priorCompletedSteps);
    if (priorReassessment) {
      assert.deepEqual(editData.plan.reassessmentResult, priorReassessment);
    }
  });

  it("13. Verifies authentic Gujarati generation and content integrity", () => {
    const gap = detectLearningGap("c-div-01", "Division", [{ marksObtained: 7, maximumMarks: 20, recordedAt: "2026-10-01T10:00:00Z" }]);
    const gujPlan = generateRemedialPlan("std-aarav", "આરવ પટેલ", "c-div-01", "Division Basics", "MATH", gap, undefined, { language: "gu" });

    assert.equal(gujPlan.steps.length, 5);
    assert.ok(gujPlan.learningObjective.includes("ભાગાકાર"));
    assert.ok(gujPlan.reassessmentQuestions && gujPlan.reassessmentQuestions.length === 5);
    assert.ok(gujPlan.worksheet);
    assert.equal(gujPlan.worksheet.language, "gu");
    assert.ok(gujPlan.worksheet.instructions.includes("ધ્યાનપૂર્વક"));
  });

  it("14. Verifies input validation and error handling", async () => {
    // Missing plan ID
    const badReq1 = mockRequest("http://localhost:3000/api/remedial-plans", "PUT", {});
    const badRes1 = await putPlansHandler(badReq1);
    assert.equal(badRes1.status, 400);

    // Negative marks in reassessment
    const badReq2 = mockRequest("http://localhost:3000/api/remedial-plans", "POST", {
      action: "reassess",
      planId: "plan-aarav-div-01",
      marksObtained: -3,
      maximumMarks: 5,
    });
    const badRes2 = await postPlansHandler(badReq2);
    assert.equal(badRes2.status, 400);

    // Marks exceeding maximum
    const badReq3 = mockRequest("http://localhost:3000/api/remedial-plans", "POST", {
      action: "reassess",
      planId: "plan-aarav-div-01",
      marksObtained: 10,
      maximumMarks: 5,
    });
    const badRes3 = await postPlansHandler(badReq3);
    assert.equal(badRes3.status, 400);
  });

  it("15. Verifies Worksheet Generator integration provides targeted printable worksheet", () => {
    const gap = detectLearningGap("c-mult-01", "Multiplication", [{ marksObtained: 7, maximumMarks: 20, recordedAt: "2026-10-01T10:00:00Z" }]);
    const plan = generateRemedialPlan("std-meera", "Meera Shah", "c-mult-01", "Multiplication Tables", "MATH", gap);

    assert.ok(plan.worksheet);
    assert.equal(plan.worksheet.concept, "Multiplication Tables (2 to 9)");
    assert.ok(plan.worksheet.questions.length >= 5);
    assert.ok(plan.worksheet.questions[0].answerKey);
    assert.ok(plan.worksheet.questions[0].stepExplanation);
  });

  it("16. Verifies that older plans with fewer than 5 steps can be safely upgraded/repaired", () => {
    // Create incomplete plan record in store directly
    const store = db.getRemedialPlans();
    const incompletePlan = {
      ...store[0],
      id: "legacy-plan-test",
      steps: store[0].steps.slice(0, 3), // only 3 steps
    };
    db.saveCustomRemedialPlan(incompletePlan);

    const upgraded = db.repairOrUpgradePlan("legacy-plan-test");
    assert.ok(upgraded);
    assert.equal(upgraded.steps.length, 5, "Upgraded plan must now have exactly 5 steps");
    assert.equal(upgraded.id, "legacy-plan-test");
  });
});
