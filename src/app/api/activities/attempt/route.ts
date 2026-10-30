import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activityId, studentId, assignmentId, answers, timeSpentSeconds } = body;

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
    const questionResults: Record<string, { isCorrect: boolean; correctAnswer: any; studentAnswer: any; explanation: string }> = {};

    // Calculate score objectively against activity questions
    activity.questions.forEach((q) => {
      const studentAns = answers[q.id];
      const isCorrect =
        studentAns !== undefined &&
        String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

      if (isCorrect) {
        score += 1;
      } else {
        incorrectQuestions.push(q.id);
      }

      questionResults[q.id] = {
        isCorrect,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAns,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((score / activity.questions.length) * 100);
    // XP gamification: base 10 XP + proportional score XP + bonus for mastery
    const baseReward = (activity as any).xpReward || 25;
    const xpEarned = Math.round((score / activity.questions.length) * baseReward) + (percentage >= 80 ? 15 : 5);

    const attempt = db.recordActivityAttempt({
      assignmentId,
      studentId,
      activityId,
      score,
      maximumScore: activity.questions.length,
      percentage,
      answers,
      incorrectQuestions,
    });

    // Determine badge / milestone
    let milestoneBadge: string | null = null;
    if (percentage === 100) {
      milestoneBadge = "Perfect Score Master 🌟";
    } else if (percentage >= 80) {
      milestoneBadge = "Concept Champion 🏆";
    } else if (percentage >= 60) {
      milestoneBadge = "Dedicated Learner 🎯";
    }

    return NextResponse.json({
      success: true,
      attempt,
      percentage: attempt.percentage,
      score,
      totalQuestions: activity.questions.length,
      timeSpentSeconds: timeSpentSeconds || 0,
      xpEarned,
      milestoneBadge,
      incorrectQuestions,
      questionResults,
      recommendedNextActivityId: (activity as any).recommendedNextActivityId || null,
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
