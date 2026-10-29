import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId") || undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const recommend = searchParams.get("recommend") === "true";

    // Role check: header or query parameter
    const roleHeader = request.headers.get("x-user-role");
    const roleParam = searchParams.get("role");
    const isStudent = roleHeader === "student" || roleParam === "student";

    if (recommend && studentId) {
      const recommendations = db.getRecommendationsForStudent(studentId);
      return NextResponse.json({ success: true, recommendations });
    }

    const activities = db.getActivities(conceptId, subjectCode, isStudent);

    return NextResponse.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error: any) {
    console.error("API GET /api/activities error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      titleGujarati,
      conceptId,
      conceptName,
      subjectCode,
      grade,
      activityType = "mcq",
      difficulty = "Medium",
      estimatedMinutes = 10,
      learningObjective,
      remedialPlanId,
      questions,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { success: false, error: "Quiz title is required" },
        { status: 400 }
      );
    }

    if (!conceptId || !String(conceptId).trim()) {
      return NextResponse.json(
        { success: false, error: "Target concept ID is required" },
        { status: 400 }
      );
    }

    if (!subjectCode || !String(subjectCode).trim()) {
      return NextResponse.json(
        { success: false, error: "Subject code is required" },
        { status: 400 }
      );
    }

    if (!grade || isNaN(Number(grade)) || Number(grade) < 1) {
      return NextResponse.json(
        { success: false, error: "Valid grade level (1-5) is required" },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one question is required" },
        { status: 400 }
      );
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !String(q.questionText).trim()) {
        return NextResponse.json(
          { success: false, error: `Question ${i + 1} must include question text` },
          { status: 400 }
        );
      }
      if (q.type === "mcq") {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return NextResponse.json(
            { success: false, error: `Question ${i + 1} (MCQ) must provide at least 2 answer options` },
            { status: 400 }
          );
        }
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === "") {
        return NextResponse.json(
          { success: false, error: `Question ${i + 1} must specify a valid correct answer` },
          { status: 400 }
        );
      }
    }

    const created = db.createActivity({
      title: title.trim(),
      titleGujarati: titleGujarati?.trim(),
      conceptId,
      conceptName: conceptName || conceptId,
      subjectCode,
      grade: Number(grade),
      activityType,
      difficulty,
      estimatedMinutes: Number(estimatedMinutes) || 10,
      learningObjective,
      remedialPlanId,
      questions: questions.map((q: any, idx: number) => ({
        id: q.id || `q-${idx + 1}-${Date.now()}`,
        questionText: q.questionText.trim(),
        questionTextGujarati: q.questionTextGujarati?.trim(),
        type: q.type || "mcq",
        options: q.options || (q.type === "true_false" ? ["True", "False"] : undefined),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        hint: q.hint,
      })),
    });

    return NextResponse.json({ success: true, activity: created }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/activities error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create quiz activity" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Activity ID is required for update" },
        { status: 400 }
      );
    }

    const updated = db.updateActivity(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Activity with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, activity: updated });
  } catch (error: any) {
    console.error("API PUT /api/activities error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update quiz activity" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const deleted = db.deleteActivity(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Activity with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Activity deleted successfully" });
  } catch (error: any) {
    console.error("API DELETE /api/activities error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete activity" },
      { status: 500 }
    );
  }
}
