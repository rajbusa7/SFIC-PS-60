import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activityId, studentId, assignmentId, answers } = body;

    if (!activityId || !studentId || !answers) {
      return NextResponse.json(
        { success: false, error: "Missing activityId, studentId, or answers" },
        { status: 400 }
      );
    }

    const activity = db.getActivityById(activityId);
    if (!activity) {
      return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
    }

    let score = 0;
    const incorrectQuestions: string[] = [];

    // Calculate score objectively against activity questions
    activity.questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (
        studentAns !== undefined &&
        String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
      ) {
        score += 1;
      } else {
        incorrectQuestions.push(q.id);
      }
    });

    const attempt = db.recordActivityAttempt({
      assignmentId,
      studentId,
      activityId,
      score,
      maximumScore: activity.questions.length,
      percentage: Math.round((score / activity.questions.length) * 100),
      answers,
      incorrectQuestions,
    });

    return NextResponse.json({
      success: true,
      attempt,
      percentage: attempt.percentage,
      feedback:
        attempt.percentage >= 80
          ? "Outstanding work! Concept mastered with high confidence."
          : attempt.percentage >= 50
          ? "Good practice! Review the questions you missed with your teacher."
          : "Keep practicing! Hands-on practice with objects will help build your foundation.",
    });
  } catch (error) {
    console.error("API POST /api/activities/attempt error:", error);
    return NextResponse.json({ success: false, error: "Failed to record attempt" }, { status: 500 });
  }
}
