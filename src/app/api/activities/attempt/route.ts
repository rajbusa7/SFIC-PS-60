import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const activityId = searchParams.get("activityId") || undefined;

    const attempts = db.getAttempts(studentId, activityId);
    return NextResponse.json({ success: true, count: attempts.length, attempts });
  } catch (error: any) {
    console.error("API GET /api/activities/attempt error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch activity attempts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activityId, studentId, assignmentId, answers } = body;

    if (!activityId || !String(activityId).trim()) {
      return NextResponse.json(
        { success: false, error: "activityId is required" },
        { status: 400 }
      );
    }

    if (!studentId || !String(studentId).trim()) {
      return NextResponse.json(
        { success: false, error: "studentId is required" },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "answers object is required" },
        { status: 400 }
      );
    }

    const activity = db.getActivityById(activityId);
    if (!activity) {
      return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
    }

    let score = 0;
    const incorrectQuestions: string[] = [];

    // Calculate score objectively against stored server answer key
    const review = activity.questions.map((q) => {
      const studentAns = answers[q.id];
      const isCorrect =
        studentAns !== undefined &&
        String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

      if (isCorrect) {
        score += 1;
      } else {
        incorrectQuestions.push(q.id);
      }

      return {
        questionId: q.id,
        questionText: q.questionText,
        questionTextGujarati: q.questionTextGujarati,
        studentAnswer: studentAns ?? "Not answered",
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect,
      };
    });

    const maxScore = Math.max(1, activity.questions.length);

    const attempt = db.recordActivityAttempt({
      assignmentId,
      studentId,
      activityId,
      score,
      maximumScore: maxScore,
      percentage: Math.round((score / maxScore) * 100),
      answers,
      incorrectQuestions,
    });

    return NextResponse.json({
      success: true,
      attempt,
      score: attempt.score,
      maximumScore: attempt.maximumScore,
      percentage: attempt.percentage,
      review,
      results: review,
      feedback:
        attempt.percentage >= 80
          ? "Outstanding work! Concept mastered with high confidence."
          : attempt.percentage >= 50
          ? "Good practice! Review the questions you missed with your teacher."
          : "Keep practicing! Hands-on practice with objects will help build your foundation.",
    });
  } catch (error: any) {
    console.error("API POST /api/activities/attempt error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to record attempt" }, { status: 500 });
  }
}
