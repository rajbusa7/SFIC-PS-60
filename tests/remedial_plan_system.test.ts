import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/lib/db/database";
import { generateRemedialPlan, CURRICULUM_TEMPLATES } from "@/lib/engine/remedialEngine";
import { detectLearningGap } from "@/lib/engine/gapDetection";
import { GET as getRemedialPlansHandler, POST as postRemedialPlansHandler, PUT as putRemedialPlansHandler } from "@/app/api/remedial-plans/route";
import type { RemedialPlan, RemedialStep } from "@/lib/types";

function createMockRequest(url: string, method: string = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Checklist Point 4: Remedial Plan Generation Comprehensive Test Suite", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  // Requirement 1 & 2: Real Data Linkage and Generation for Student & Competency
  describe("1. Real Assessment & Learning Gap Linkage (Requirements 1, 2 & 5)", () => {
    it("generates a remedial plan linked to real student assessment results and detected gap", () => {
      // Find an identified gap from real data
      const gaps = db.getLearningGaps();
      const targetGap = gaps.find((g) => g.latestPercentage < 60);
      assert.ok(targetGap, "Must have an identified gap with score < 60%");

      const plan = db.createRemedialPlanForGap(targetGap.id, "Teacher intervention note");
      assert.ok(plan, "Plan must be created");

      // Verify linkage
      assert.equal(plan.studentId, targetGap.studentId);
      assert.equal(plan.conceptId, targetGap.conceptId);
      assert.equal(plan.learningGapId, targetGap.id);
      assert.equal(plan.baselineScore, targetGap.latestPercentage);
      assert.ok(plan.studentCode, "Plan must link student roll code");
      assert.ok(plan.classroomId, "Plan must link classroom ID");
      assert.equal(plan.teacherNotes, "Teacher intervention note");

      // Verify gap is updated to Under Intervention
      const updatedGap = db.getLearningGaps().find((g) => g.id === targetGap.id);
      assert.equal(updatedGap?.status, "Under Intervention");
      assert.equal(updatedGap?.remedialPlanId, plan.id);
    });

    it("allows generating a plan directly by studentId and conceptId", () => {
      const student = db.getStudents()[0];
      const concept = db.getConcepts().find((c) => c.subjectCode === "MATH");
      assert.ok(student && concept);

      const plan = db.createRemedialPlanForStudentConcept(student.id, concept.id, {
        customNotes: "Direct student competency plan",
        forceRecreate: true,
      });

      assert.ok(plan, "Plan must be generated directly");
      assert.equal(plan.studentId, student.id);
      assert.equal(plan.studentName, student.displayName);
      assert.equal(plan.conceptId, concept.id);
      assert.equal(plan.teacherNotes, "Direct student competency plan");
    });
  });

  // Requirement 3: Five-Step Concrete Structure and Step Fields
  describe("2. Mandatory 5-Step Structure & Step Fields (Requirement 3)", () => {
    it("generates exactly 5 structured steps for all curriculum templates", () => {
      const templateKeys = Object.keys(CURRICULUM_TEMPLATES);
      assert.ok(templateKeys.length >= 5, "Curriculum templates must exist");

      for (const key of templateKeys) {
        const tmpl = CURRICULUM_TEMPLATES[key];
        assert.equal(
          tmpl.steps.length,
          5,
          `Template '${key}' must have exactly 5 remedial steps`
        );

        // Verify each step has all required fields
        tmpl.steps.forEach((step, idx) => {
          assert.equal(step.stepNumber, idx + 1, `Step index must match stepNumber`);
          assert.ok(step.title && step.title.trim().length > 0, `Step ${step.stepNumber} must have a title`);
          assert.ok(step.description && step.description.trim().length > 0, `Step ${step.stepNumber} must have a description`);
          assert.ok(step.durationMinutes > 0, `Step ${step.stepNumber} must have a positive duration`);
          assert.ok(step.learningObjective && step.learningObjective.trim().length > 0, `Step ${step.stepNumber} must have a learningObjective`);
          assert.ok(Array.isArray(step.materials) && step.materials.length > 0, `Step ${step.stepNumber} must list required materials`);
          assert.ok(step.checkUnderstanding && step.checkUnderstanding.trim().length > 0, `Step ${step.stepNumber} must have checkUnderstanding`);
          assert.equal(step.completed, false, `New step completion status must initially be false`);
        });
      }
    });

    it("ensures fallback engine generates a compliant 5-step concrete sequence for any unknown concept", () => {
      const mockDetection = {
        conceptId: "c-novel-robotics-01",
        conceptName: "Novel Robotics Concept",
        masteryStatus: "Needs Support" as const,
        requiresRemediation: true,
        priority: "High" as const,
        averagePercentage: 30,
        attemptsCount: 1,
        isSingleObservation: true,
        latestPercentage: 30,
        trend: "declining" as const,
        reason: "Novel concept baseline deficiency",
        suggestedAction: "Hands-on model build",
      };

      const plan = generateRemedialPlan(
        "std-test",
        "Test Student",
        "c-novel-robotics-01",
        "Novel Robotics Concept",
        "MATH",
        mockDetection
      );

      assert.equal(plan.steps.length, 5, "Fallback generator must produce exactly 5 steps");
      assert.equal(plan.completedStepsCount, 0);
      assert.equal(plan.progressPercentage, 0);

      plan.steps.forEach((step, idx) => {
        assert.equal(step.stepNumber, idx + 1);
        assert.ok(step.title);
        assert.ok(step.description);
        assert.ok(step.learningObjective);
        assert.ok(step.checkUnderstanding);
        assert.ok(step.durationMinutes > 0);
        assert.equal(step.completed, false);
      });
    });
  });

  // Requirement 4: Appropriate for Subject, Grade, and Competency (Offline / Deterministic)
  describe("3. Pedagogical Appropriateness across Subjects (Requirement 4)", () => {
    it("provides subject-appropriate manipulatives and steps for Mathematics", () => {
      const tmpl = CURRICULUM_TEMPLATES["c-div-01"];
      assert.equal(tmpl.subjectCode, "MATH");
      const matStr = tmpl.materials.join(" ").toLowerCase();
      assert.ok(matStr.includes("token") || matStr.includes("counter") || matStr.includes("cap"));
      assert.equal(tmpl.steps[1].activityType, "hands_on");
    });

    it("provides subject-appropriate phonics/reading steps for English", () => {
      const tmpl = CURRICULUM_TEMPLATES["c-eng-blend-01"];
      assert.equal(tmpl.subjectCode, "ENG");
      const matStr = tmpl.materials.join(" ").toLowerCase();
      assert.ok(matStr.includes("phonics") || matStr.includes("flashcard"));
      assert.equal(tmpl.steps[0].activityType, "phonics_drill");
    });

    it("provides language-appropriate Gujarati script and matra materials for Gujarati", () => {
      const tmpl = CURRICULUM_TEMPLATES["c-guj-matra-01"];
      assert.equal(tmpl.subjectCode, "GUJ");
      assert.ok(tmpl.learningObjective.includes("માત્રા"));
      assert.equal(tmpl.steps.length, 5);
    });

    it("provides experiment and observation steps for EVS/Science", () => {
      const tmpl = CURRICULUM_TEMPLATES["c-evs-water-01"];
      assert.equal(tmpl.subjectCode, "EVS");
      assert.ok(tmpl.materials.some((m) => m.toLowerCase().includes("water") || m.toLowerCase().includes("cup")));
    });
  });

  // Requirement 6: Progress Tracking, Step Completion, Reopening
  describe("4. Step Completion Toggling, Progress & Reopening (Requirement 6)", () => {
    it("toggles step completion, recalculates progress percentage, and persists to store", () => {
      const plans = db.getRemedialPlans();
      const plan = plans[0];
      assert.ok(plan);

      // Toggle step 1 to completed
      const updated1 = db.updateRemedialPlanStep(plan.id, 1, true);
      assert.ok(updated1);
      assert.equal(updated1.steps[0].completed, true);
      assert.equal(updated1.completedStepsCount, updated1.steps.filter((s) => s.completed).length);
      assert.equal(
        updated1.progressPercentage,
        Math.round((updated1.completedStepsCount! / updated1.steps.length) * 100)
      );

      // Verify persistence by reloading from store
      const reloaded = db.getRemedialPlanById(plan.id);
      assert.equal(reloaded?.steps[0].completed, true);
      assert.equal(reloaded?.progressPercentage, updated1.progressPercentage);
    });

    it("transitions status to 'Completed' when all 5 steps are marked done", () => {
      const plans = db.getRemedialPlans();
      const plan = plans[0];

      // Mark all 5 steps completed
      for (let i = 1; i <= 5; i++) {
        db.updateRemedialPlanStep(plan.id, i, true);
      }

      const completedPlan = db.getRemedialPlanById(plan.id);
      assert.ok(completedPlan);
      assert.equal(completedPlan.completedStepsCount, 5);
      assert.equal(completedPlan.progressPercentage, 100);
      assert.equal(completedPlan.status, "Completed");
    });

    it("allows teachers to reopen a completed remedial plan", () => {
      const plans = db.getRemedialPlans();
      const plan = plans[0];

      // Complete the plan first
      db.updateRemedialPlan(plan.id, { status: "Completed" });
      assert.equal(db.getRemedialPlanById(plan.id)?.status, "Completed");

      // Reopen plan
      const reopened = db.reopenRemedialPlan(plan.id);
      assert.ok(reopened);
      assert.equal(reopened.status, "In Progress");

      // Verify store persistence
      const reloaded = db.getRemedialPlanById(plan.id);
      assert.equal(reloaded?.status, "In Progress");
    });
  });

  // Requirement 7: Accidental Duplicate Prevention & Deliberate Recreation
  describe("5. Accidental Duplicate Prevention & Idempotency (Requirement 7)", () => {
    it("returns existing plan on rapid duplicate generation clicks without duplicating", () => {
      const student = db.getStudents()[0];
      const concept = db.getConcepts()[0];

      // Initial generation
      const initialPlan = db.createRemedialPlanForStudentConcept(student.id, concept.id, {
        forceRecreate: true,
      });
      assert.ok(initialPlan);

      const countBefore = db.getRemedialPlans().length;

      // Repeated click immediately after
      const duplicateAttempt = db.createRemedialPlanForStudentConcept(student.id, concept.id, {
        forceRecreate: false,
      });

      const countAfter = db.getRemedialPlans().length;

      assert.equal(countAfter, countBefore, "Count must NOT increase on accidental duplicate click");
      assert.equal(duplicateAttempt?.id, initialPlan.id, "Should return existing plan");
    });

    it("allows deliberate plan regeneration when forceRecreate is true", () => {
      const student = db.getStudents()[0];
      const concept = db.getConcepts()[0];

      const plan1 = db.createRemedialPlanForStudentConcept(student.id, concept.id, {
        forceRecreate: true,
      });

      // Explicitly force recreate
      const plan2 = db.createRemedialPlanForStudentConcept(student.id, concept.id, {
        forceRecreate: true,
        customNotes: "Regenerated plan",
      });

      assert.ok(plan1 && plan2);
      assert.notEqual(plan1.id, plan2.id, "Force recreate should produce a fresh plan instance");
      assert.equal(plan2.teacherNotes, "Regenerated plan");
    });
  });

  // Requirement 8: API Route Validation and Error Handling
  describe("6. API Endpoints & Error Handling (Requirement 8)", () => {
    it("GET /api/remedial-plans returns plans and supports status and subject filtering", async () => {
      const reqAll = createMockRequest("http://localhost:3000/api/remedial-plans");
      const resAll = await getRemedialPlansHandler(reqAll);
      const dataAll = await resAll.json();

      assert.equal(resAll.status, 200);
      assert.equal(dataAll.success, true);
      assert.ok(Array.isArray(dataAll.plans));
      assert.ok(Array.isArray(dataAll.remedialPlans));

      // Filter by subject
      const reqMath = createMockRequest("http://localhost:3000/api/remedial-plans?subjectCode=MATH");
      const resMath = await getRemedialPlansHandler(reqMath);
      const dataMath = await resMath.json();

      assert.equal(resMath.status, 200);
      dataMath.plans.forEach((p: RemedialPlan) => {
        assert.equal(p.subjectCode, "MATH");
      });
    });

    it("POST /api/remedial-plans returns 400 when missing required input", async () => {
      const req = createMockRequest("http://localhost:3000/api/remedial-plans", "POST", {});
      const res = await postRemedialPlansHandler(req);
      const data = await res.json();

      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.error, /Missing required parameters/);
    });

    it("POST /api/remedial-plans returns 404 when student or concept not found", async () => {
      const req = createMockRequest("http://localhost:3000/api/remedial-plans", "POST", {
        studentId: "non-existent-student-xyz",
        conceptId: "c-div-01",
      });
      const res = await postRemedialPlansHandler(req);
      const data = await res.json();

      assert.equal(res.status, 404);
      assert.equal(data.success, false);
      assert.match(data.error, /not found/i);
    });

    it("PUT /api/remedial-plans toggles individual step via stepNumber parameter", async () => {
      const plan = db.getRemedialPlans()[0];
      const req = createMockRequest("http://localhost:3000/api/remedial-plans", "PUT", {
        id: plan.id,
        stepNumber: 2,
        completed: true,
      });

      const res = await putRemedialPlansHandler(req);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.plan.steps[1].completed, true);
    });

    it("PUT /api/remedial-plans reopens plan with action='reopen'", async () => {
      const plan = db.getRemedialPlans()[0];
      db.updateRemedialPlan(plan.id, { status: "Completed" });

      const req = createMockRequest("http://localhost:3000/api/remedial-plans", "PUT", {
        id: plan.id,
        action: "reopen",
      });

      const res = await putRemedialPlansHandler(req);
      const data = await res.json();

      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.plan.status, "In Progress");
    });
  });
});
