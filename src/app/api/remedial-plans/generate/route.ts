import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, conceptId, gapId, forceRecreate, customNotes } = body;

    if (gapId) {
      const plan = db.createRemedialPlanForGap(gapId, customNotes, {
        forceRecreate: Boolean(forceRecreate),
      });
      if (!plan) {
        return NextResponse.json({ success: false, error: "Learning gap or student not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        plan,
        remedialPlan: plan,
        isAiGenerated: false,
        provider: "deterministic-curriculum-engine",
        modelUsed: "gujarat-primary-pedagogy-v1",
      });
    }

    if (studentId && conceptId) {
      const plan = db.createRemedialPlanForStudentConcept(studentId, conceptId, {
        forceRecreate: Boolean(forceRecreate),
        customNotes,
      });
      if (!plan) {
        return NextResponse.json({ success: false, error: "Student or concept not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        plan,
        remedialPlan: plan,
        isAiGenerated: false,
        provider: "deterministic-curriculum-engine",
        modelUsed: "gujarat-primary-pedagogy-v1",
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing required fields: studentId and conceptId, or gapId" },
      { status: 400 }
    );
  } catch (error) {
    console.error("API POST /api/remedial-plans/generate error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate remedial plan" }, { status: 500 });
  }
}
