import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { GET as getPlansHandler, POST as postPlansHandler } from "../src/app/api/remedial-plans/route";
import { generateRemedialPlan, CURRICULUM_TEMPLATES } from "../src/lib/engine/remedialEngine";
import { db } from "../src/lib/db/database";

function mockJsonRequest(url: string, method: string, body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Generate 5-Step Plan Functionality Verification", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  afterEach(() => {
    db.resetToDemoData();
  });

  it("1. Generates a valid plan for Dev Shah's Subject-Verb Agreement gap (c-eng-verb-01)", async () => {
    const gap = db.getLearningGapById("gap-dev-verb");
    assert.ok(gap, "Learning gap gap-dev-verb must exist in database");

    const req = mockJsonRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: "gap-dev-verb",
      language: "en",
    });

    const res = await postPlansHandler(req);
    assert.equal(res.status, 200, "API response must be 200 OK");

    const body = await res.json();
    assert.ok(body.success, "Response must indicate success");
    assert.ok(body.plan, "Response must include the generated plan");

    const plan = body.plan;
    assert.equal(plan.studentId, "std-dev");
    assert.equal(plan.studentName, "Dev Shah");
    assert.equal(plan.conceptId, "c-eng-verb-01");
    assert.equal(plan.subjectCode, "ENG");
    assert.equal(plan.subject, "ENG");
    assert.equal(plan.steps.length, 5, "Generated plan must have exactly 5 steps");
  });

  it("2. Validates that every plan has exactly 5 sequential steps with all 7 mandatory fields", async () => {
    const req = mockJsonRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: "gap-dev-verb",
      language: "en",
      forceRegenerate: true,
    });
    const res = await postPlansHandler(req);
    const { plan } = await res.json();

    assert.equal(plan.steps.length, 5, "Plan must contain exactly 5 steps");

    // Verify ordering
    for (let i = 0; i < plan.steps.length; i++) {
      assert.equal(plan.steps[i].stepNumber, i + 1, `Step ${i + 1} must have correct stepNumber`);
    }

    const stepMatchers = [
      /Concept|Review|Understand/i,
      /Demonstration|Model|Concrete/i,
      /Guided/i,
      /Independent/i,
      /Reassessment|Exit Ticket|Diagnostic|Mastery/i,
    ];

    plan.steps.forEach((step: any, index: number) => {
      // 1. Step Title
      assert.ok(step.title && step.title.length > 3, `Step ${index + 1} missing title`);
      assert.match(
        step.title,
        stepMatchers[index],
        `Step ${index + 1} title (${step.title}) must match pedagogical progression`
      );

      // 2. Learning Objective
      assert.ok(
        step.learningObjective && step.learningObjective.length > 5,
        `Step ${index + 1} missing learningObjective`
      );

      // 3. Teacher Instructions
      assert.ok(
        step.teacherInstructions && step.teacherInstructions.length > 10,
        `Step ${index + 1} missing teacherInstructions`
      );

      // 4. Student Activity
      assert.ok(
        step.studentInstructions && step.studentInstructions.length > 10,
        `Step ${index + 1} missing studentInstructions (Student Activity)`
      );

      // 5. Materials Required
      assert.ok(
        Array.isArray(step.requiredMaterials) && step.requiredMaterials.length > 0,
        `Step ${index + 1} missing requiredMaterials`
      );

      // 6. Estimated Duration
      assert.ok(
        typeof step.durationMinutes === "number" && step.durationMinutes > 0,
        `Step ${index + 1} missing valid durationMinutes`
      );

      // 7. Success Criteria
      assert.ok(
        step.expectedResult && step.expectedResult.length > 5,
        `Step ${index + 1} missing expectedResult (Success Criteria)`
      );
    });
  });

  it("3. Adapts pedagogical plan across subjects: Math, English, Science/EVS, and Gujarati", () => {
    // 3a. Math template test
    const mathPlan = generateRemedialPlan(
      "std-1",
      "Student One",
      "c-div-01",
      "Division Basics",
      "MATH",
      db.getLearningGapById("gap-aarav-div") || {} as any,
      "Needs hands-on counters",
      {
        studentClass: 4,
        studentSection: "A",
        baselineScore: 35,
        diagnosisType: "CONCEPTUAL_GAP",
      }
    );
    assert.equal(mathPlan.subjectCode, "MATH");
    assert.equal(mathPlan.subject, "MATH");
    assert.equal(mathPlan.steps.length, 5);
    const mathMaterials = mathPlan.steps.flatMap(s => s.requiredMaterials || []).join(" ").toLowerCase();
    assert.ok(
      mathMaterials.includes("counter") ||
      mathMaterials.includes("manipulative") ||
      mathMaterials.includes("bead") ||
      mathMaterials.includes("flashcard") ||
      mathMaterials.includes("worksheet"),
      "Math plan must include concrete manipulatives/materials"
    );

    // 3b. English template test
    const engPlan = generateRemedialPlan(
      "std-2",
      "Student Two",
      "c-eng-verb-01",
      "Subject-Verb Agreement",
      "ENG",
      db.getLearningGapById("gap-dev-verb") || {} as any,
      "Sentence cards",
      {
        studentClass: 4,
        studentSection: "B",
        baselineScore: 50,
        diagnosisType: "PROCEDURAL_ERROR",
      }
    );
    assert.equal(engPlan.subjectCode, "ENG");
    assert.equal(engPlan.subject, "ENG");
    assert.equal(engPlan.steps.length, 5);
    const engContent = engPlan.steps.map(s => (s.teacherInstructions || "") + " " + (s.studentInstructions || "")).join(" ").toLowerCase();
    assert.ok(
      engContent.includes("verb") || engContent.includes("subject") || engContent.includes("sentence"),
      "English plan must focus on grammatical concepts and sentence practice"
    );

    // 3c. Gujarati template test
    const gujPlan = generateRemedialPlan(
      "std-3",
      "Student Three",
      "c-guj-matra-01",
      "Gujarati Vowel Signs (Matras)",
      "GUJ",
      {} as any,
      "Chart paper",
      {
        studentClass: 3,
        studentSection: "A",
        baselineScore: 40,
        language: "gu",
      }
    );
    assert.equal(gujPlan.subjectCode, "GUJ");
    assert.equal(gujPlan.subject, "GUJ");
    assert.equal(gujPlan.steps.length, 5);
    assert.ok(
      gujPlan.steps.some(s => (s.teacherInstructions || "").length > 5),
      "Gujarati plan steps must be populated"
    );

    // 3d. Science/EVS template test
    const sciPlan = generateRemedialPlan(
      "std-4",
      "Student Four",
      "c-sci-01",
      "Plant Life Cycle & Parts",
      "SCI",
      {} as any,
      "Plant specimens",
      {
        studentClass: 5,
        studentSection: "C",
        baselineScore: 45,
      }
    );
    assert.equal(sciPlan.steps.length, 5);
    assert.ok(sciPlan.steps.every(s => s.durationMinutes > 0));
  });

  it("4. Adapts plan steps based on Cognitive Obstacle Diagnosis (Phase 2)", () => {
    const conceptualPlan = generateRemedialPlan(
      "std-1",
      "Student One",
      "c-div-01",
      "Division Basics",
      "MATH",
      {} as any,
      "",
      {
        baselineScore: 35,
        diagnosisType: "CONCEPTUAL_GAP",
      }
    );
    assert.match(
      conceptualPlan.steps[0].teacherInstructions || "",
      /Concrete Representation/i,
      "Conceptual Gap must emphasize concrete visual/hands-on models in step 1"
    );

    const proceduralPlan = generateRemedialPlan(
      "std-1",
      "Student One",
      "c-div-01",
      "Division Basics",
      "MATH",
      {} as any,
      "",
      {
        baselineScore: 50,
        diagnosisType: "PROCEDURAL_ERROR",
      }
    );
    assert.match(
      proceduralPlan.steps[1].teacherInstructions || "",
      /Explicit Procedural Steps/i,
      "Procedural Error must emphasize explicit step sequencing in step 2"
    );

    const prerequisitePlan = generateRemedialPlan(
      "std-1",
      "Student One",
      "c-div-01",
      "Division Basics",
      "MATH",
      {} as any,
      "",
      {
        baselineScore: 25,
        diagnosisType: "PREREQUISITE_WEAKNESS",
      }
    );
    assert.match(
      prerequisitePlan.steps[0].teacherInstructions || "",
      /Foundational Prerequisite Review/i,
      "Prerequisite Weakness must emphasize foundational prerequisite competencies in step 1"
    );

    const carelessPlan = generateRemedialPlan(
      "std-1",
      "Student One",
      "c-div-01",
      "Division Basics",
      "MATH",
      {} as any,
      "",
      {
        baselineScore: 65,
        diagnosisType: "CARELESS_ERROR",
      }
    );
    assert.match(
      carelessPlan.steps[3].teacherInstructions || "",
      /Self-Checking Checklist/i,
      "Careless Error must emphasize self-checking checklist in step 4"
    );
  });

  it("5. Prevents duplicate plans on repeated clicks (idempotency)", async () => {
    // First generation
    const req1 = mockJsonRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: "gap-dev-verb",
    });
    const res1 = await postPlansHandler(req1);
    const body1 = await res1.json();
    const firstPlanId = body1.plan.id;

    // Second generation without forceRegenerate
    const req2 = mockJsonRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: "gap-dev-verb",
      forceRegenerate: false,
    });
    const res2 = await postPlansHandler(req2);
    const body2 = await res2.json();
    const secondPlanId = body2.plan.id;

    assert.equal(firstPlanId, secondPlanId, "Repeated call must return the existing plan without creating a duplicate");

    // Total count of plans for this student/concept in database should remain 1
    const allPlans = db.getRemedialPlans();
    const devPlans = allPlans.filter(p => p.studentId === "std-dev" && p.conceptId === "c-eng-verb-01");
    assert.equal(devPlans.length, 1, "Only 1 plan record must exist in DB for std-dev and c-eng-verb-01");
  });

  it("6. Rejects plan generation for Mastered records (400 Bad Request)", async () => {
    // Set a gap to Mastered
    db.updateLearningGap("gap-aarav-div", { masteryStatus: "Mastered" });
    const masteredGap = db.getLearningGapById("gap-aarav-div");
    assert.ok(masteredGap);
    assert.equal(masteredGap.masteryStatus, "Mastered");

    const req = mockJsonRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: "gap-aarav-div",
    });
    const res = await postPlansHandler(req);
    assert.equal(res.status, 400, "Mastered gaps must be rejected with 400 Bad Request");

    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /mastered/i, "Error message must state gap is already mastered");
  });

  it("7. Handles invalid gap ID gracefully with 404 Not Found", async () => {
    const req = mockJsonRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: "non-existent-gap-9999",
    });
    const res = await postPlansHandler(req);
    assert.equal(res.status, 404, "Non-existent gap must return 404");

    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /not found/i);
  });

  it("8. Verifies persistence and retrieval via GET /api/remedial-plans", async () => {
    // Generate plan
    const postReq = mockJsonRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: "gap-dev-verb",
    });
    const postRes = await postPlansHandler(postReq);
    const postBody = await postRes.json();
    const planId = postBody.plan.id;

    // Fetch via GET endpoint (simulates page load/refresh)
    const getReq = new Request(`http://localhost:3000/api/remedial-plans?planId=${planId}`, { method: "GET" });
    const getRes = await getPlansHandler(getReq);
    assert.equal(getRes.status, 200);

    const getBody = await getRes.json();
    assert.ok(getBody.success);
    assert.equal(getBody.plan.id, planId);
    assert.equal(getBody.plan.steps.length, 5);
  });
});
