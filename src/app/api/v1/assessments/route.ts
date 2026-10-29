import { NextResponse } from "next/server";
import { assessmentService } from "@backend/services/assessmentService";
import { validateCreateAssessment } from "@shared/schemas/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;

    const assessments = await assessmentService.getAssessments(classroomId, subjectId);
    return NextResponse.json({ success: true, count: assessments.length, assessments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch assessments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateCreateAssessment(body);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const created = await assessmentService.createAssessment(
      {
        ...validation.data!,
        status: validation.data!.status || "published",
      },
      body.initialResults
    );
    return NextResponse.json({ success: true, assessment: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create assessment" }, { status: 500 });
  }
}
