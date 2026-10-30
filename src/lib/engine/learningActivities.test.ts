import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../db/database";
import { COMPREHENSIVE_ACTIVITIES } from "../db/activitiesData";
import { formatSubjectName } from "../i18n/translations";

test("Learning Activities Upgrade - Multi-Subject & Grade Coverage", () => {
  const activities = db.getActivities();
  assert.ok(activities.length >= 30, `Expected at least 30 activities, found ${activities.length}`);

  // Test supported subjects
  const subjects = new Set(activities.map((a) => a.subjectCode));
  assert.ok(subjects.has("MATH"), "Must contain Mathematics activities");
  assert.ok(subjects.has("ENG"), "Must contain English activities");
  assert.ok(subjects.has("GUJ"), "Must contain Gujarati activities");
  assert.ok(subjects.has("EVS"), "Must contain EVS activities");
  assert.ok(subjects.has("SCI"), "Must contain Science activities");
  assert.ok(subjects.has("SST"), "Must contain Social Science activities");
  assert.ok(subjects.has("HIN"), "Must contain Hindi activities");

  // Test difficulty levels
  const difficulties = new Set(activities.map((a) => a.difficulty));
  assert.ok(difficulties.has("Easy"), "Must support Easy");
  assert.ok(difficulties.has("Medium"), "Must support Medium");
  assert.ok(difficulties.has("Hard"), "Must support Hard");

  // Test grade distribution
  const grades = new Set(activities.map((a) => a.grade));
  for (let g = 1; g <= 8; g++) {
    assert.ok(grades.has(g), `Must have activities for Grade ${g}`);
  }
});

test("Learning Activities - Subject Separation & Quality", () => {
  const activities = db.getActivities();

  activities.forEach((act) => {
    assert.ok(act.id, "Activity must have id");
    assert.ok(act.title, "Activity must have title");
    assert.ok(act.questions && act.questions.length > 0, `Activity ${act.id} must have questions`);

    // Verify Math questions don't appear in English or Gujarati
    if (act.subjectCode === "ENG") {
      assert.doesNotMatch(act.title, /ગુણાકાર|ભાગાકાર|સરવાળો/, "English activity must not have Math title");
    }
    if (act.subjectCode === "GUJ") {
      assert.doesNotMatch(act.title, /Fraction|Decimals|Algebra/, "Gujarati activity must not have English math title");
    }

    // Verify question validity
    act.questions.forEach((q) => {
      assert.ok(q.id, "Question must have id");
      assert.ok(q.questionText, "Question must have text");
      assert.ok(q.correctAnswer !== undefined, "Question must have correct answer");
      assert.ok(q.explanation, "Question must have explanation");
    });
  });
});

test("Learning Activities - Attempt Recording, Scoring & XP Gamification", () => {
  const act = db.getActivities().find((a) => a.id === "act-div-01");
  assert.ok(act, "act-div-01 must exist");

  // Prepare perfect answers
  const perfectAnswers: Record<string, any> = {};
  act.questions.forEach((q) => {
    perfectAnswers[q.id] = q.correctAnswer;
  });

  const attempt = db.recordActivityAttempt({
    studentId: "std-aarav",
    activityId: act.id,
    score: act.questions.length,
    maximumScore: act.questions.length,
    percentage: 100,
    answers: perfectAnswers,
    incorrectQuestions: [],
  });

  assert.equal(attempt.percentage, 100);
  assert.equal(attempt.score, act.questions.length);

  // Verify persistence
  const studentAttempts = db.getAttempts("std-aarav");
  const found = studentAttempts.find((a) => a.activityId === act.id);
  assert.ok(found, "Attempt must be persisted for student");
  assert.equal(found.percentage, 100);
});

test("Learning Activities - Bilingual Translation Helpers", () => {
  assert.equal(formatSubjectName("MATH", "gu"), "ગણિત");
  assert.equal(formatSubjectName("ENG", "gu"), "અંગ્રેજી");
  assert.equal(formatSubjectName("GUJ", "gu"), "ગુજરાતી");
  assert.equal(formatSubjectName("EVS", "gu"), "પર્યાવરણ (આસપાસ)");
  assert.equal(formatSubjectName("SCI", "gu"), "વિજ્ઞાન");
  assert.equal(formatSubjectName("SST", "gu"), "સામાજિક વિજ્ઞાન");
  assert.equal(formatSubjectName("HIN", "gu"), "હિન્દી");

  assert.equal(formatSubjectName("MATH", "en"), "Mathematics");
  assert.equal(formatSubjectName("SCI", "en"), "Science");
});
