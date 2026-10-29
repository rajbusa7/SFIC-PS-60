import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId") || undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const gradeStr = searchParams.get("grade");
    const grade = gradeStr ? Number(gradeStr) : undefined;
    const remedialPlanId = searchParams.get("remedialPlanId") || undefined;

    let worksheets = db.getWorksheets(conceptId, subjectCode, grade);

    if (remedialPlanId) {
      worksheets = worksheets.filter((w) => w.remedialPlanId === remedialPlanId);
    }

    return NextResponse.json({
      success: true,
      count: worksheets.length,
      worksheets,
    });
  } catch (error: any) {
    console.error("API GET /api/worksheets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch worksheets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      subject,
      subjectCode,
      grade,
      concept,
      conceptId,
      remedialPlanId,
      studentName,
      difficulty = "Medium",
      instructions = "Read all questions carefully and write your answers with neat step-by-step working.",
      totalMarks,
      teacherGuidelines,
      questions,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { success: false, error: "Worksheet title is required" },
        { status: 400 }
      );
    }

    if (!subject || !String(subject).trim()) {
      return NextResponse.json(
        { success: false, error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!concept || !String(concept).trim()) {
      return NextResponse.json(
        { success: false, error: "Target concept name is required" },
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
        { success: false, error: "At least one question is required for a worksheet" },
        { status: 400 }
      );
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !String(q.question).trim()) {
        return NextResponse.json(
          { success: false, error: `Question ${i + 1} must have question text` },
          { status: 400 }
        );
      }
      if (!q.marks || Number(q.marks) <= 0) {
        return NextResponse.json(
          { success: false, error: `Question ${i + 1} must specify marks greater than 0` },
          { status: 400 }
        );
      }
    }

    const created = db.createWorksheet({
      title: title.trim(),
      subject: subject.trim(),
      subjectCode,
      grade: Number(grade),
      concept: concept.trim(),
      conceptId,
      remedialPlanId,
      studentName: studentName?.trim(),
      difficulty,
      instructions: instructions.trim(),
      totalMarks: Number(totalMarks) || questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 2), 0),
      teacherGuidelines: teacherGuidelines?.trim(),
      questions: questions.map((q: any, idx: number) => ({
        questionNumber: q.questionNumber || idx + 1,
        question: q.question.trim(),
        marks: Number(q.marks) || 2,
        type: q.type || "word_problem",
        options: q.options,
        answerKey: q.answerKey || "",
        stepExplanation: q.stepExplanation || "",
      })),
    });

    return NextResponse.json({ success: true, worksheet: created }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/worksheets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create worksheet" },
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
        { success: false, error: "Worksheet ID is required for update" },
        { status: 400 }
      );
    }

    const updated = db.updateWorksheet(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Worksheet with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, worksheet: updated });
  } catch (error: any) {
    console.error("API PUT /api/worksheets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update worksheet" },
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
        { success: false, error: "Worksheet ID is required" },
        { status: 400 }
      );
    }

    const deleted = db.deleteWorksheet(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Worksheet with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Worksheet deleted successfully" });
  } catch (error: any) {
    console.error("API DELETE /api/worksheets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete worksheet" },
      { status: 500 }
    );
  }
}
