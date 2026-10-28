import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST as tutorHandler } from "@/app/api/ai/tutor/route";
import { POST as gapAnalyzerHandler } from "@/app/api/ai/gap-analyzer/route";
import { POST as remedialHandler } from "@/app/api/ai/remedial/route";
import { POST as worksheetHandler } from "@/app/api/ai/worksheet/route";
import { POST as assistantHandler } from "@/app/api/ai/assistant/route";

function createMockRequest(body: any): Request {
  return new Request("http://localhost:3000/api/ai/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("StudySaathi AI API Routes Functional Tests", () => {
  it("POST /api/ai/tutor returns structured explanation, classroom example, and 3 practice questions", async () => {
    const req = createMockRequest({
      query: "My Class 4 students are struggling with division. How can I teach equal sharing?",
      grade: 4,
      subject: "Mathematics",
      language: "en",
    });

    const res = await tutorHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.tutorResponse.topic);
    assert.ok(data.tutorResponse.simpleExplanation);
    assert.ok(data.tutorResponse.classroomExample);
    assert.ok(Array.isArray(data.tutorResponse.stepByStepActivity));
    assert.equal(data.tutorResponse.practiceQuestions.length, 3, "Must have exactly 3 practice questions");
    assert.ok(data.tutorResponse.practiceQuestions[0].answer);
    assert.ok(data.tutorResponse.practiceQuestions[0].explanation);
  });

  it("POST /api/ai/tutor supports Gujarati when requested", async () => {
    const req = createMockRequest({
      query: "ધોરણ ૪ માં ભાગાકારની સમાન વહેંચણી કેવી રીતે શીખવવી?",
      grade: 4,
      subject: "Mathematics",
      language: "gu",
    });

    const res = await tutorHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.tutorResponse.language, "gu");
    // Verify Gujarati text presence
    assert.ok(data.tutorResponse.simpleExplanation.includes("ભાગાકાર") || data.tutorResponse.simpleExplanation.includes("વહેંચણી"));
  });

  it("POST /api/ai/gap-analyzer calculates deterministic percentage and evidence-based diagnosis", async () => {
    const req = createMockRequest({
      studentId: "std-aarav",
      studentName: "Aarav Patel",
      studentClass: 4,
      subject: "MATH",
      conceptName: "Division Basics",
      marksObtained: 7,
      maximumMarks: 20,
      teacherObservations: "Repeatedly subtracts instead of equal sharing.",
      language: "en",
    });

    const res = await gapAnalyzerHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);

    // Verify deterministic metrics
    assert.equal(data.analysis.deterministicMetrics.marksObtained, 7);
    assert.equal(data.analysis.deterministicMetrics.maximumMarks, 20);
    assert.equal(data.analysis.deterministicMetrics.calculatedPercentage, 35);
    assert.equal(data.analysis.deterministicMetrics.masteryStatus, "Needs Support");
    assert.equal(data.analysis.deterministicMetrics.priority, "High");

    // Verify AI pedagogical diagnosis
    assert.ok(data.analysis.aiPedagogicalDiagnosis.evidenceSummary);
    assert.ok(data.analysis.aiPedagogicalDiagnosis.underlyingMisconception);
    assert.ok(Array.isArray(data.analysis.aiPedagogicalDiagnosis.recommendedRemedialActivities));
    assert.ok(data.analysis.aiPedagogicalDiagnosis.suggestedReassessmentMethod);
    assert.ok(data.analysis.aiPedagogicalDiagnosis.ethicalSafetyDisclosure);
  });

  it("POST /api/ai/remedial generates 5-step remedial plan with low-cost materials and mastery criteria", async () => {
    const req = createMockRequest({
      studentId: "std-aarav",
      studentName: "Aarav Patel",
      conceptId: "c-div-01",
      conceptName: "Division Basics & Equal Sharing",
      subjectCode: "MATH",
      latestPercentage: 35,
      language: "en",
    });

    const res = await remedialHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.plan.learningObjective);
    assert.ok(data.plan.steps.length >= 5, "Must have 5 remedial steps");
    assert.ok(data.plan.requiredMaterials.length > 0);
    assert.ok(data.plan.reassessmentCriteria);
    assert.equal(data.plan.status, "Suggested");
  });

  it("POST /api/ai/worksheet generates validated worksheet with answer keys and printable format", async () => {
    const req = createMockRequest({
      grade: 4,
      subject: "MATH",
      concept: "Division Basics",
      difficulty: "Medium",
      questionCount: 5,
      language: "en",
      questionType: "mixed",
      studentName: "Aarav Patel",
    });

    const res = await worksheetHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.worksheet.questions.length, 5);
    assert.ok(data.worksheet.questions[0].answerKey);
    assert.ok(data.worksheet.questions[0].stepExplanation);
  });

  it("POST /api/ai/assistant answers pedagogical questions and provides authorized classroom summary", async () => {
    const req = createMockRequest({
      message: "Summarize active student learning gaps in Class 4",
      language: "en",
      userRole: "teacher",
    });

    const res = await assistantHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.message.length > 20);
  });
});
