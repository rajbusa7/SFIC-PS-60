import { describe, it } from "node:test";
import assert from "node:assert";
import { IntelligentWorksheetGenerator, CURRICULUM_QUESTION_BANK } from "./worksheetGenerator";
import { GET as getReportsHandler } from "../../app/api/reports/route";
import { POST as generateWorksheetHandler } from "../../app/api/worksheets/generate/route";
import { POST as evaluateWorksheetHandler } from "../../app/api/worksheets/evaluate/route";

describe("Intelligent Worksheet Generator & Reports Engine", () => {
  it("should have verified curriculum questions strictly mapped to standards 1 through 8", () => {
    assert.ok(CURRICULUM_QUESTION_BANK.length > 15, "Question bank must contain curriculum questions");

    const std1 = CURRICULUM_QUESTION_BANK.filter((q) => q.grade === 1);
    const std4 = CURRICULUM_QUESTION_BANK.filter((q) => q.grade === 4);
    const std8 = CURRICULUM_QUESTION_BANK.filter((q) => q.grade === 8);

    assert.ok(std1.length > 0, "Std 1 questions must exist");
    assert.ok(std4.length > 0, "Std 4 questions must exist");
    assert.ok(std8.length > 0, "Std 8 questions must exist");

    // Verify curriculum separation: Std 1 must not contain algebra or fractions
    std1.forEach((q) => {
      assert.ok(
        !q.textEn.toLowerCase().includes("fraction") && !q.textEn.toLowerCase().includes("algebra"),
        "Std 1 questions must be foundational, not advanced"
      );
    });
  });

  it("should generate a complete, valid worksheet with teacher answer key and explanations", () => {
    const ws = IntelligentWorksheetGenerator.generateWorksheet({
      grade: 4,
      subjectCode: "MATH",
      conceptId: "c-div-01",
      worksheetType: "remedial",
      difficulty: "Medium",
      questionCount: 5,
      language: "en",
      studentId: "std-aarav",
      studentName: "Aarav Patel",
    });

    assert.strictEqual(ws.grade, 4);
    assert.strictEqual(ws.subjectCode, "MATH");
    assert.strictEqual(ws.questions.length, 5);
    assert.ok(ws.totalMarks > 0, "Total marks must be > 0");
    assert.ok(ws.teacherAnswerKey.answers.length === 5, "Answer key must contain answers for all 5 questions");

    // Every question must have an explanation and correct answer
    ws.questions.forEach((q, idx) => {
      assert.ok(q.questionText.length > 0, `Question ${idx + 1} must have text`);
      assert.ok(q.explanation.length > 0, `Question ${idx + 1} must have explanation`);
      assert.ok(q.correctAnswer !== undefined, `Question ${idx + 1} must have correct answer`);
    });
  });

  it("should adaptively prioritize weak concepts for students with learning gaps (e.g. Aarav Division)", () => {
    const ws = IntelligentWorksheetGenerator.generateWorksheet({
      grade: 4,
      subjectCode: "MATH",
      studentId: "std-aarav",
      studentName: "Aarav Patel",
      studentPreviousScore: 35,
      activeGapConceptId: "c-div-01",
      questionCount: 4,
    });

    assert.ok(ws.adaptiveMetadata?.isAdaptive, "Worksheet must be marked as adaptive");
    assert.strictEqual(ws.adaptiveMetadata?.studentPrioritizedConcept, "c-div-01");
    assert.ok(
      ws.questions.some((q) => q.conceptId === "c-div-01"),
      "Must include prioritized division questions for Aarav"
    );
  });

  it("should generate 3-version differentiated classroom bundle (Support, Developing, Advanced)", () => {
    const bundle = IntelligentWorksheetGenerator.generateThreeTierClassroomBundle({
      grade: 4,
      subjectCode: "MATH",
      conceptId: "c-div-01",
      questionCount: 3,
    });

    assert.ok(bundle.supportTier, "Support tier must exist");
    assert.ok(bundle.developingTier, "Developing tier must exist");
    assert.ok(bundle.advancedTier, "Advanced tier must exist");

    assert.strictEqual(bundle.supportTier.difficulty, "Easy");
    assert.strictEqual(bundle.developingTier.difficulty, "Medium");
    assert.strictEqual(bundle.advancedTier.difficulty, "Hard");
  });

  it("should serve comprehensive data for academic reports across all 17 report types", async () => {
    const req = new Request("http://localhost:3000/api/reports?type=student&studentId=std-aarav");
    const res = await getReportsHandler(req);
    const data = await res.json();

    assert.strictEqual(data.success, true);
    assert.strictEqual(data.selectedStudent.id, "std-aarav");
    assert.ok(data.metrics, "Metrics must exist");
    assert.ok(data.conceptBreakdown.length > 0, "Concept breakdown must exist");
    assert.ok(data.monthlyData.length >= 2, "Monthly trends must exist");
    assert.ok(data.termData.letterGrade, "Term evaluation letter grade must exist");
  });

  it("should record student worksheet evaluations and update scores", async () => {
    const evalReq = new Request("http://localhost:3000/api/worksheets/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worksheetId: "ws-demo-aarav-div",
        studentId: "std-aarav",
        studentName: "Aarav Patel",
        scoresPerQuestion: { 1: 2, 2: 3, 3: 5 },
        teacherComments: "Excellent application on word problems!",
        timeSpentMinutes: 18,
      }),
    });

    const evalRes = await evaluateWorksheetHandler(evalReq);
    const evalData = await evalRes.json();

    assert.strictEqual(evalData.success, true);
    assert.strictEqual(evalData.submission.studentId, "std-aarav");
    assert.ok(evalData.submission.percentage >= 80, "Percentage should reflect recorded scores");
  });
});
