import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      worksheetId,
      studentId,
      studentName,
      answers = {},
      scoresPerQuestion = {},
      teacherComments,
      timeSpentMinutes = 15,
    } = body;

    if (!worksheetId || !studentId) {
      return NextResponse.json(
        { success: false, error: "Missing worksheetId or studentId" },
        { status: 400 }
      );
    }

    const worksheet = (db as any).getWorksheetById(worksheetId);
    let totalMarks = worksheet?.totalMarks || 10;
    let marksObtained = 0;
    const incorrectQuestions: number[] = [];

    if (worksheet && worksheet.questions) {
      worksheet.questions.forEach((q: any) => {
        const score = Number(scoresPerQuestion[q.questionNumber]) || 0;
        marksObtained += score;
        if (score < q.marks) {
          incorrectQuestions.push(q.questionNumber);
        }
      });
    } else {
      marksObtained = Object.values(scoresPerQuestion).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0
      );
    }

    const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;

    const submission = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      worksheetId,
      studentId,
      studentName: studentName || "Student",
      answers,
      scoresPerQuestion,
      marksObtained,
      totalMarks,
      percentage,
      incorrectQuestions,
      teacherComments,
      evaluatedAt: new Date().toISOString(),
      timeSpentMinutes,
    };

    (db as any).recordWorksheetSubmission(submission);

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    console.error("API POST /api/worksheets/evaluate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate worksheet" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worksheetId = searchParams.get("worksheetId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    const submissions = (db as any).getWorksheetSubmissions(worksheetId, studentId);

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error: any) {
    console.error("API GET /api/worksheets/evaluate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve submissions" },
      { status: 500 }
    );
  }
}
