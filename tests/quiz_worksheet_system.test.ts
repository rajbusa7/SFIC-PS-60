import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/lib/db/database";
import { GET as getActivitiesHandler, POST as postActivitiesHandler, DELETE as deleteActivitiesHandler } from "@/app/api/activities/route";
import { GET as getActivityByIdHandler, PUT as putActivityByIdHandler, DELETE as deleteActivityByIdHandler } from "@/app/api/activities/[id]/route";
import { POST as postAttemptHandler, GET as getAttemptsHandler } from "@/app/api/activities/attempt/route";
import { GET as getWorksheetsHandler, POST as postWorksheetsHandler, DELETE as deleteWorksheetsHandler } from "@/app/api/worksheets/route";
import { GET as getWorksheetByIdHandler, PUT as putWorksheetByIdHandler, DELETE as deleteWorksheetByIdHandler } from "@/app/api/worksheets/[id]/route";

function createMockRequest(url: string, method: string = "GET", body?: any, headers?: Record<string, string>): Request {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Checklist Point 5: Quizzes, Worksheets and Student Practice System", () => {
  beforeEach(() => {
    db.resetToDemoData();
  });

  // 1. Quiz Management
  describe("1. Quiz Management (Create, View, Edit, Save, Delete)", () => {
    it("creates, saves, views, and updates a quiz with competency linkage", async () => {
      const newQuizData = {
        title: "Grade 4 Division Mastery Quiz",
        titleGujarati: "ધોરણ ૪ ભાગાકાર ક્વિઝ",
        conceptId: "c-div-01",
        conceptName: "Division Basics & Equal Sharing",
        subjectCode: "MATH",
        grade: 4,
        difficulty: "Medium",
        estimatedMinutes: 12,
        learningObjective: "Student demonstrates mastery in division with remainders",
        remedialPlanId: "plan-aarav-div",
        questions: [
          {
            id: "q-div-1",
            type: "mcq",
            questionText: "If 36 candies are divided equally among 6 children, how many does each get?",
            options: ["4", "5", "6", "7"],
            correctAnswer: "6",
            explanation: "36 divided by 6 equals 6 candies each.",
            hint: "Recall the 6 times table.",
          },
          {
            id: "q-div-2",
            type: "mcq",
            questionText: "What is 45 ÷ 5?",
            options: ["7", "8", "9", "10"],
            correctAnswer: "9",
            explanation: "5 × 9 = 45.",
          },
        ],
      };

      // API POST /api/activities
      const postReq = createMockRequest("http://localhost/api/activities", "POST", newQuizData);
      const postRes = await postActivitiesHandler(postReq);
      const postJson = await postRes.json();

      assert.equal(postRes.status, 201);
      assert.equal(postJson.success, true);
      assert.ok(postJson.activity?.id);
      assert.equal(postJson.activity.title, "Grade 4 Division Mastery Quiz");
      assert.equal(postJson.activity.learningObjective, "Student demonstrates mastery in division with remainders");

      const createdId = postJson.activity.id;

      // API GET /api/activities/[id]
      const getReq = createMockRequest(`http://localhost/api/activities/${createdId}`, "GET");
      const getRes = await getActivityByIdHandler(getReq, { params: Promise.resolve({ id: createdId }) });
      const getJson = await getRes.json();

      assert.equal(getRes.status, 200);
      assert.equal(getJson.success, true);
      assert.equal(getJson.activity.id, createdId);

      // API PUT /api/activities/[id] (Edit quiz)
      const putReq = createMockRequest(`http://localhost/api/activities/${createdId}`, "PUT", {
        title: "Updated Grade 4 Division Quiz",
        estimatedMinutes: 15,
      });
      const putRes = await putActivityByIdHandler(putReq, { params: Promise.resolve({ id: createdId }) });
      const putJson = await putRes.json();

      assert.equal(putRes.status, 200);
      assert.equal(putJson.success, true);
      assert.equal(putJson.activity.title, "Updated Grade 4 Division Quiz");
      assert.equal(putJson.activity.estimatedMinutes, 15);

      // Verify deletion
      const delReq = createMockRequest(`http://localhost/api/activities/${createdId}`, "DELETE");
      const delRes = await deleteActivityByIdHandler(delReq, { params: Promise.resolve({ id: createdId }) });
      const delJson = await delRes.json();

      assert.equal(delRes.status, 200);
      assert.equal(delJson.success, true);

      // Verify no longer found
      const checkReq = createMockRequest(`http://localhost/api/activities/${createdId}`, "GET");
      const checkRes = await getActivityByIdHandler(checkReq, { params: Promise.resolve({ id: createdId }) });
      assert.equal(checkRes.status, 404);
    });

    it("validates missing questions and invalid answer options on quiz creation", async () => {
      // Missing title
      const resNoTitle = await postActivitiesHandler(
        createMockRequest("http://localhost/api/activities", "POST", {
          conceptId: "c-div-01",
          subjectCode: "MATH",
          grade: 4,
          questions: [{ questionText: "Test", correctAnswer: "A" }],
        })
      );
      assert.equal(resNoTitle.status, 400);

      // Empty questions array
      const resNoQuestions = await postActivitiesHandler(
        createMockRequest("http://localhost/api/activities", "POST", {
          title: "Quiz with No Questions",
          conceptId: "c-div-01",
          subjectCode: "MATH",
          grade: 4,
          questions: [],
        })
      );
      assert.equal(resNoQuestions.status, 400);

      // MCQ with fewer than 2 options
      const resFewOptions = await postActivitiesHandler(
        createMockRequest("http://localhost/api/activities", "POST", {
          title: "Invalid MCQ Quiz",
          conceptId: "c-div-01",
          subjectCode: "MATH",
          grade: 4,
          questions: [
            {
              type: "mcq",
              questionText: "What is 2+2?",
              options: ["4"], // Invalid: needs at least 2 options
              correctAnswer: "4",
            },
          ],
        })
      );
      assert.equal(resFewOptions.status, 400);
      const fewOptionsJson = await resFewOptions.json();
      assert.match(fewOptionsJson.error, /at least 2.*options/i);

      // Question with missing correct answer
      const resNoAnswer = await postActivitiesHandler(
        createMockRequest("http://localhost/api/activities", "POST", {
          title: "Quiz with missing answer key",
          conceptId: "c-div-01",
          subjectCode: "MATH",
          grade: 4,
          questions: [
            {
              type: "mcq",
              questionText: "What is 5x5?",
              options: ["20", "25", "30"],
              correctAnswer: "", // Invalid
            },
          ],
        })
      );
      assert.equal(resNoAnswer.status, 400);
      const noAnswerJson = await resNoAnswer.json();
      assert.match(noAnswerJson.error, /correct answer/i);
    });
  });

  // 2. Worksheet Management
  describe("2. Worksheet Management (Create, View, Edit, Print Preparation)", () => {
    it("creates, saves, views, and updates an offline worksheet", async () => {
      const newWorksheetData = {
        title: "Place Value 3-Digit Addition Practice Sheet",
        subject: "Mathematics",
        subjectCode: "MATH",
        grade: 3,
        concept: "Place Value & 3-Digit Addition",
        conceptId: "c-place-01",
        difficulty: "Medium",
        remedialPlanId: "plan-std-dev-c-place",
        instructions: "Solve each addition problem carefully by lining up Hundreds, Tens, and Ones.",
        teacherGuidelines: "Check whether students regroup ones into tens accurately.",
        questions: [
          {
            questionNumber: 1,
            question: "Break down 478 into Hundreds, Tens, and Ones.",
            marks: 2,
            answerKey: "400 + 70 + 8",
            stepExplanation: "4 hundreds (400), 7 tens (70), and 8 ones (8).",
          },
          {
            questionNumber: 2,
            question: "Find the sum of 346 + 185 with carry-over.",
            marks: 3,
            answerKey: "531",
            stepExplanation: "6+5=11 (1 carry), 4+8+1=13 (1 carry), 3+1+1=5 -> 531.",
          },
        ],
      };

      // API POST /api/worksheets
      const postReq = createMockRequest("http://localhost/api/worksheets", "POST", newWorksheetData);
      const postRes = await postWorksheetsHandler(postReq);
      const postJson = await postRes.json();

      assert.equal(postRes.status, 201);
      assert.equal(postJson.success, true);
      assert.ok(postJson.worksheet?.id);
      assert.equal(postJson.worksheet.totalMarks, 5);

      const createdId = postJson.worksheet.id;

      // API GET /api/worksheets/[id]
      const getReq = createMockRequest(`http://localhost/api/worksheets/${createdId}`, "GET");
      const getRes = await getWorksheetByIdHandler(getReq, { params: Promise.resolve({ id: createdId }) });
      const getJson = await getRes.json();

      assert.equal(getRes.status, 200);
      assert.equal(getJson.worksheet.title, "Place Value 3-Digit Addition Practice Sheet");

      // API PUT /api/worksheets/[id]
      const putReq = createMockRequest(`http://localhost/api/worksheets/${createdId}`, "PUT", {
        instructions: "Updated instructions: Use pencil only.",
        difficulty: "Hard",
      });
      const putRes = await putWorksheetByIdHandler(putReq, { params: Promise.resolve({ id: createdId }) });
      const putJson = await putRes.json();

      assert.equal(putRes.status, 200);
      assert.equal(putJson.worksheet.instructions, "Updated instructions: Use pencil only.");
      assert.equal(putJson.worksheet.difficulty, "Hard");

      // Verify deletion
      const delReq = createMockRequest(`http://localhost/api/worksheets/${createdId}`, "DELETE");
      const delRes = await deleteWorksheetByIdHandler(delReq, { params: Promise.resolve({ id: createdId }) });
      assert.equal(delRes.status, 200);
    });

    it("validates missing required fields on worksheet creation", async () => {
      // Missing title
      const resNoTitle = await postWorksheetsHandler(
        createMockRequest("http://localhost/api/worksheets", "POST", {
          subject: "Mathematics",
          concept: "Addition",
          grade: 3,
          questions: [{ question: "Solve 2+2", marks: 2 }],
        })
      );
      assert.equal(resNoTitle.status, 400);

      // Zero or negative marks
      const resInvalidMarks = await postWorksheetsHandler(
        createMockRequest("http://localhost/api/worksheets", "POST", {
          title: "Math Sheet",
          subject: "Mathematics",
          concept: "Addition",
          grade: 3,
          questions: [{ question: "Solve 2+2", marks: 0 }],
        })
      );
      assert.equal(resInvalidMarks.status, 400);
    });
  });

  // 3. Security: Answer Key Masking for Students
  describe("3. Answer Key Security (No Leaks to Student Clients Before Submission)", () => {
    it("strips correct answers and explanations when requested with student role", async () => {
      // 1. Teacher Request (Full data with answers)
      const teacherReq = createMockRequest("http://localhost/api/activities?subjectCode=MATH", "GET");
      const teacherRes = await getActivitiesHandler(teacherReq);
      const teacherJson = await teacherRes.json();

      assert.ok(teacherJson.activities.length > 0);
      const teacherFirstActivity = teacherJson.activities[0];
      assert.ok(teacherFirstActivity.questions[0].correctAnswer, "Teacher view must include correct answers");

      // 2. Student Request via query param ?role=student
      const studentReqParam = createMockRequest("http://localhost/api/activities?subjectCode=MATH&role=student", "GET");
      const studentResParam = await getActivitiesHandler(studentReqParam);
      const studentJsonParam = await studentResParam.json();

      assert.ok(studentJsonParam.activities.length > 0);
      const studentFirstActivity = studentJsonParam.activities[0];
      for (const q of studentFirstActivity.questions) {
        assert.equal(q.correctAnswer, undefined, "Student payload must NOT expose correctAnswer");
        assert.equal(q.explanation, undefined, "Student payload must NOT expose explanation");
        assert.ok(q.options, "Student payload must still retain options for answering");
      }

      // 3. Student Request via X-User-Role: student header
      const studentReqHeader = createMockRequest("http://localhost/api/activities", "GET", undefined, {
        "x-user-role": "student",
      });
      const studentResHeader = await getActivitiesHandler(studentReqHeader);
      const studentJsonHeader = await studentResHeader.json();

      for (const act of studentJsonHeader.activities) {
        for (const q of act.questions) {
          assert.equal(q.correctAnswer, undefined);
          assert.equal(q.explanation, undefined);
        }
      }
    });
  });

  // 4. Student Practice Submission, Server-Side Scoring & Feedback
  describe("4. Student Activity Submission and Server-Side Scoring", () => {
    it("scores objective questions accurately against server stored answers and returns feedback", async () => {
      const activities = db.getActivities("c-div-01", "MATH");
      assert.ok(activities.length > 0);
      const targetAct = activities[0];

      // Prepare perfect answers according to server's true answers
      const perfectAnswers: Record<string, any> = {};
      for (const q of targetAct.questions) {
        perfectAnswers[q.id] = q.correctAnswer;
      }

      const attemptReq = createMockRequest("http://localhost/api/activities/attempt", "POST", {
        activityId: targetAct.id,
        studentId: "std-aarav",
        answers: perfectAnswers,
      });

      const attemptRes = await postAttemptHandler(attemptReq);
      const attemptJson = await attemptRes.json();

      assert.equal(attemptRes.status, 200);
      assert.equal(attemptJson.success, true);
      assert.equal(attemptJson.score, targetAct.questions.length);
      assert.equal(attemptJson.percentage, 100);
      assert.ok(attemptJson.results.length === targetAct.questions.length);

      // Now verify answer details are only returned upon submission
      assert.equal(attemptJson.results[0].isCorrect, true);
      assert.ok(attemptJson.results[0].explanation);
    });

    it("handles partial scores accurately and provides encouraging feedback", async () => {
      const activities = db.getActivities("c-div-01", "MATH");
      const targetAct = activities[0];

      // Submit only 1 correct answer, others incorrect
      const mixedAnswers: Record<string, any> = {};
      targetAct.questions.forEach((q, idx) => {
        mixedAnswers[q.id] = idx === 0 ? q.correctAnswer : "WrongAnswer999";
      });

      const attemptReq = createMockRequest("http://localhost/api/activities/attempt", "POST", {
        activityId: targetAct.id,
        studentId: "std-aarav",
        answers: mixedAnswers,
      });

      const attemptRes = await postAttemptHandler(attemptReq);
      const attemptJson = await attemptRes.json();

      assert.equal(attemptRes.status, 200);
      assert.equal(attemptJson.score, 1);
      assert.equal(attemptJson.percentage, Math.round((1 / targetAct.questions.length) * 100));
      assert.match(attemptJson.feedback, /good effort|keep practicing/i);
    });
  });

  // 5. Duplicate Submission Prevention
  describe("5. Duplicate Submission Prevention", () => {
    it("prevents rapid duplicate submissions within 15 seconds window", async () => {
      const activities = db.getActivities("c-div-01", "MATH");
      const targetAct = activities[0];

      const answers = { [targetAct.questions[0].id]: targetAct.questions[0].correctAnswer };

      // First submission
      const req1 = createMockRequest("http://localhost/api/activities/attempt", "POST", {
        activityId: targetAct.id,
        studentId: "std-aarav",
        answers,
      });
      const res1 = await postAttemptHandler(req1);
      const json1 = await res1.json();

      // Immediate second submission (< 15 seconds) with identical answers
      const req2 = createMockRequest("http://localhost/api/activities/attempt", "POST", {
        activityId: targetAct.id,
        studentId: "std-aarav",
        answers,
      });
      const res2 = await postAttemptHandler(req2);
      const json2 = await res2.json();

      assert.equal(json1.attempt.id, json2.attempt.id, "Second immediate attempt must return existing attempt ID without duplicate row creation");
    });
  });

  // 6. Learning Gap Integration & Pedagogical Invariant
  describe("6. Learning Gap Integration & Pedagogical Non-Mastery Invariant", () => {
    it("recommends relevant quizzes and worksheets for actual student learning gaps", async () => {
      // Aarav Patel has a detected gap in Division (c-div-01)
      const req = createMockRequest("http://localhost/api/activities?recommend=true&studentId=std-aarav", "GET");
      const res = await getActivitiesHandler(req);
      const json = await res.json();

      assert.equal(res.status, 200);
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.recommendations));

      // Check that recommendations contain Aarav's gap and linked quizzes/worksheets
      const divRec = json.recommendations.find((r: any) => r.gap.conceptId === "c-div-01");
      assert.ok(divRec, "Must have recommendation for division gap");
      assert.ok(divRec.recommendedActivities.length > 0, "Must recommend division quiz");
      assert.ok(divRec.recommendedWorksheets.length > 0, "Must recommend division worksheet");
    });

    it("updates remedial plan step progress upon activity attempt, but does NOT mark competency mastered", () => {
      // Find Aarav's division gap and plan
      const gapBefore = db.getLearningGaps("std-aarav").find((g) => g.conceptId === "c-div-01");
      assert.ok(gapBefore);
      assert.notEqual(gapBefore.masteryStatus, "Mastered");

      const planBefore = db.getRemedialPlans("std-aarav").find((p) => p.conceptId === "c-div-01");
      assert.ok(planBefore);

      // Record a 100% perfect activity attempt
      const activity = db.getActivities("c-div-01", "MATH")[0];
      const attempt = db.recordActivityAttempt({
        studentId: "std-aarav",
        activityId: activity.id,
        answers: { [activity.questions[0].id]: activity.questions[0].correctAnswer },
        score: activity.questions.length,
        maximumScore: activity.questions.length,
        percentage: 100,
        incorrectQuestions: [],
      });

      assert.ok(attempt);

      // Check Remedial Plan progress was updated to In Progress
      const planAfter = db.getRemedialPlans("std-aarav").find((p) => p.conceptId === "c-div-01");
      assert.ok(planAfter);
      assert.equal(planAfter.status, "In Progress");

      // CRITICAL REQUIREMENT 4: Activity completion alone must NOT automatically mark gap as Mastered
      const gapAfter = db.getLearningGaps("std-aarav").find((g) => g.conceptId === "c-div-01");
      assert.ok(gapAfter);
      assert.notEqual(
        gapAfter.masteryStatus,
        "Mastered",
        "Practice activities must not automatically mark competency as Mastered. Official mastery requires formative assessment."
      );
    });
  });

  // 7. Persistence Across Reloads
  describe("7. Persistence Across Data Store Reloads", () => {
    it("persists created quizzes, worksheets, and student attempts after fresh load", () => {
      const createdQuiz = db.createActivity({
        title: "Persistent Test Quiz",
        conceptId: "c-mult-01",
        conceptName: "Multiplication Tables",
        subjectCode: "MATH",
        grade: 3,
        activityType: "mcq",
        difficulty: "Medium",
        estimatedMinutes: 10,
        questions: [
          {
            id: "pq1",
            type: "mcq",
            questionText: "What is 3 x 4?",
            options: ["10", "11", "12", "14"],
            correctAnswer: "12",
            explanation: "3 times 4 equals 12",
          },
        ],
      });

      const createdWs = db.createWorksheet({
        title: "Persistent Multiplication Sheet",
        subject: "Mathematics",
        subjectCode: "MATH",
        grade: 3,
        concept: "Multiplication Tables",
        conceptId: "c-mult-01",
        instructions: "Solve with neat working.",
        totalMarks: 4,
        questions: [
          {
            questionNumber: 1,
            question: "Write 3 times 5.",
            marks: 4,
            answerKey: "15",
            stepExplanation: "3 groups of 5 makes 15",
          },
        ],
      });

      assert.ok(createdWs.id);

      // Now query fresh via DB methods
      const fetchedQuiz = db.getActivityById(createdQuiz.id);
      assert.ok(fetchedQuiz);
      assert.equal(fetchedQuiz.title, "Persistent Test Quiz");

      const fetchedWs = db.getWorksheetById(createdWs.id!);
      assert.ok(fetchedWs);
      assert.equal(fetchedWs.title, "Persistent Multiplication Sheet");
    });
  });
});
