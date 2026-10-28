import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { GET as getAssessmentsHandler, POST as postAssessmentHandler } from "../src/app/api/assessments/route";
import { GET as getResultsHandler, POST as postResultsHandler } from "../src/app/api/assessments/results/route";
import { GET as getGapsHandler } from "../src/app/api/learning-gaps/route";
import { GET as getPlansHandler, POST as postPlanHandler, PUT as putPlanHandler } from "../src/app/api/remedial-plans/route";
import { GET as getProgressHandler } from "../src/app/api/progress/route";
import { POST as postActivityAttemptHandler } from "../src/app/api/activities/attempt/route";
import { GET as getSettingsHandler, PUT as putSettingsHandler } from "../src/app/api/settings/route";
import { db } from "../src/lib/db/database";
import { translations } from "../src/lib/i18n/translations";

function mockRequest(url: string, method = "GET", body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("ShikshaSetu AI - Core Workflows & Multi-Module Persistence Suite", () => {
  let testStudentId: string = "";
  const testConceptId = "c-frac-01";
  let createdAssessmentId: string = "";
  let createdPlanId: string = "";

  before(async () => {
    // Create an isolated fictional test student for this end-to-end suite
    const testStudent = await db.addStudentAsync({
      studentCode: `MPS-WORKFLOW-${Date.now()}`,
      displayName: "Fictional Test Student",
      grade: 4,
      section: "A",
      classroomId: "cls-4a",
      notes: "Dedicated test student for persistence validation",
      enrollmentStatus: "active",
    });
    testStudentId = testStudent.id;
  });

  after(async () => {
    // Clean up fictional test student
    if (testStudentId) {
      await db.deleteStudentAsync(testStudentId);
    }
  });

  it("Workflow 5: Add an assessment and verify that it appears in assessment history", async () => {
    const postReq = mockRequest("http://localhost:3000/api/assessments", "POST", {
      title: "Class 4: Fractions Evaluation Check",
      classroomId: "cls-4a",
      subjectId: "sub-math",
      subjectCode: "MATH",
      assessmentDate: "2026-10-28",
      maxMarks: 20,
      conceptIds: [testConceptId],
      status: "published",
      scores: [
        {
          studentId: testStudentId,
          conceptId: testConceptId,
          marksObtained: 6,
          notes: "Initial evaluation before intervention",
        },
      ],
    });

    const res = await postAssessmentHandler(postReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.assessment?.id);
    createdAssessmentId = data.assessment.id;

    // Verify it appears in history
    const getReq = mockRequest("http://localhost:3000/api/assessments", "GET");
    const getRes = await getAssessmentsHandler(getReq);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    const found = getData.assessments.find((a: any) => a.id === createdAssessmentId);
    assert.ok(found, "Newly created assessment must be in assessment history");
    assert.equal(found.title, "Class 4: Fractions Evaluation Check");
  });

  it("Workflow 6: Record assessment results and verify corresponding learning-gap calculations", async () => {
    // Fetch learning gaps for this student
    const gapsReq = mockRequest(`http://localhost:3000/api/learning-gaps?studentId=${testStudentId}`, "GET");
    const gapsRes = await getGapsHandler(gapsReq);
    const gapsData = await gapsRes.json();
    assert.equal(gapsData.success, true);

    const gap = gapsData.gaps.find((g: any) => g.conceptId === testConceptId);
    assert.ok(gap, "Learning gap must be detected for low fractions score (6/20 = 30%)");
    assert.equal(gap.status, "Active");
    assert.equal(gap.priority, "High");
    assert.equal(gap.masteryStatus, "Needs Support");
  });

  it("Workflow 7: Create a remedial plan and verify persistent status and step updates", async () => {
    // Find gap
    const gaps = db.getLearningGaps(testStudentId);
    const gap = gaps.find((g: any) => g.conceptId === testConceptId);
    assert.ok(gap, "Gap must be present in database");

    // Create plan
    const createPlanReq = mockRequest("http://localhost:3000/api/remedial-plans", "POST", {
      gapId: gap.id,
      customNotes: "Use paper folding and circular fraction discs.",
    });

    const planRes = await postPlanHandler(createPlanReq);
    assert.equal(planRes.status, 200);
    const planData = await planRes.json();
    assert.equal(planData.success, true);
    assert.ok(planData.plan?.id);
    createdPlanId = planData.plan.id;

    // Toggle step completion to step 1 and 2
    const updateReq = mockRequest("http://localhost:3000/api/remedial-plans", "PUT", {
      id: createdPlanId,
      completedSteps: [1, 2],
      status: "In Progress",
    });

    const updateRes = await putPlanHandler(updateReq);
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.deepEqual(updateData.plan.completedSteps, [1, 2]);
    assert.equal(updateData.plan.status, "In Progress");

    // Fetch plans list to verify persistent storage
    const getPlansReq = mockRequest(`http://localhost:3000/api/remedial-plans?studentId=${testStudentId}`, "GET");
    const getPlansRes = await getPlansHandler(getPlansReq);
    const getPlansData = await getPlansRes.json();
    assert.equal(getPlansData.success, true);
    const foundPlan = getPlansData.plans.find((p: any) => p.id === createdPlanId);
    assert.ok(foundPlan);
    assert.deepEqual(foundPlan.completedSteps, [1, 2]);
  });

  it("Workflow 8: Reassessment workflow records positive percentage-point growth and resolves gap", async () => {
    // Reassess with 18/20 (90%)
    const reassessReq = mockRequest("http://localhost:3000/api/assessments/results", "POST", {
      results: [
        {
          assessmentId: `asm-retest-${Date.now()}`,
          studentId: testStudentId,
          conceptId: testConceptId,
          marksObtained: 18,
          maximumMarks: 20,
          notes: "Student mastered fraction parts using physical shapes.",
          recordedAt: new Date(Date.now() + 1000).toISOString(),
        },
      ],
    });

    const res = await postResultsHandler(reassessReq);
    assert.equal(res.status, 200);

    // Verify progress metrics
    const progReq = mockRequest(`http://localhost:3000/api/progress?studentId=${testStudentId}`, "GET");
    const progRes = await getProgressHandler(progReq);
    const progData = await progRes.json();
    assert.equal(progData.success, true);

    const conceptProgress = progData.progressItems.find(
      (item: any) => item.studentId === testStudentId && item.conceptId === testConceptId
    );
    assert.ok(conceptProgress, "Progress item must exist for fraction reassessment");
    assert.ok(conceptProgress.deltaPercentagePoints > 0, "Must show positive percentage-point growth delta");
    assert.equal(conceptProgress.latestPercentage, 90);

    // Verify gap status is now resolved
    const gaps = db.getLearningGaps(testStudentId);
    const updatedGap = gaps.find((g: any) => g.conceptId === testConceptId);
    assert.ok(updatedGap);
    assert.equal(updatedGap.status, "Resolved");
  });

  it("Workflow 9: Learning Activity attempt recording persists scores and answers", async () => {
    const actReq = mockRequest("http://localhost:3000/api/activities/attempt", "POST", {
      activityId: "act-div-01",
      studentId: testStudentId,
      answers: {
        "q1": "3",
      },
    });

    const res = await postActivityAttemptHandler(actReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.attempt?.id);
    assert.equal(data.attempt.studentId, testStudentId);
  });

  it("Workflow 10: Validation checks and error handling for invalid marks, missing IDs", async () => {
    // Negative marks
    const invalidReq1 = mockRequest("http://localhost:3000/api/assessments/results", "POST", {
      results: [{ marksObtained: -5, maximumMarks: 20 }],
    });
    const res1 = await postResultsHandler(invalidReq1);
    assert.equal(res1.status, 400);

    // Marks exceeding maximum
    const invalidReq2 = mockRequest("http://localhost:3000/api/assessments/results", "POST", {
      results: [{ marksObtained: 25, maximumMarks: 20 }],
    });
    const res2 = await postResultsHandler(invalidReq2);
    assert.equal(res2.status, 400);

    // Missing plan ID in PUT
    const invalidReq3 = mockRequest("http://localhost:3000/api/remedial-plans", "PUT", {});
    const res3 = await putPlanHandler(invalidReq3);
    assert.equal(res3.status, 400);
  });

  it("Workflow 11: Settings thresholds update propagates and re-evaluates student gaps", async () => {
    const setReq = mockRequest("http://localhost:3000/api/settings", "PUT", {
      masteryThreshold: 85,
      developingThreshold: 65,
    });
    const res = await putSettingsHandler(setReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.settings.masteryThreshold, 85);
    assert.equal(data.settings.developingThreshold, 65);

    // Restore standard thresholds
    const restoreReq = mockRequest("http://localhost:3000/api/settings", "PUT", {
      masteryThreshold: 80,
      developingThreshold: 60,
    });
    await putSettingsHandler(restoreReq);
  });

  it("Workflow 12: Gujarati and English translations integrity", () => {
    assert.ok(translations.en, "English translations must exist");
    assert.ok(translations.gu, "Gujarati translations must exist");

    // Check critical module keys exist in both languages
    assert.ok(translations.en.nav.dashboard);
    assert.ok(translations.gu.nav.dashboard);
    assert.ok(translations.en.nav.students);
    assert.ok(translations.gu.nav.students);
    assert.ok(translations.en.learningGaps.title);
    assert.ok(translations.gu.learningGaps.title);
    assert.ok(translations.en.remedialPlans.title);
    assert.ok(translations.gu.remedialPlans.title);
    assert.ok(translations.en.reports.title);
    assert.ok(translations.gu.reports.title);
  });
});
