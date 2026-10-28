import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const status = searchParams.get("status") || undefined;

    let plans = db.getRemedialPlans(studentId);

    if (status) {
      plans = plans.filter((p) => p.status === status);
    }

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("API GET /api/remedial-plans error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch remedial plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gapId, customNotes, plan } = body;

    // Direct save of reviewed AI plan
    if (plan && plan.studentId && plan.conceptId) {
      const saved = db.saveCustomRemedialPlan(plan);
      return NextResponse.json({ success: true, plan: saved });
    }

    if (!gapId) {
      return NextResponse.json({ success: false, error: "gapId or full plan object is required" }, { status: 400 });
    }

    const createdPlan = db.createRemedialPlanForGap(gapId, customNotes);
    if (!createdPlan) {
      return NextResponse.json(
        { success: false, error: "Could not create plan: Gap or student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, plan: createdPlan });
  } catch (error) {
    console.error("API POST /api/remedial-plans error:", error);
    return NextResponse.json({ success: false, error: "Failed to create remedial plan" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, teacherNotes, steps, learningObjective, completedSteps } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 });
    }

    const updated = db.updateRemedialPlan(id, {
      ...(status ? { status } : {}),
      ...(teacherNotes !== undefined ? { teacherNotes } : {}),
      ...(steps ? { steps } : {}),
      ...(learningObjective ? { learningObjective } : {}),
      ...(completedSteps !== undefined ? { completedSteps } : {}),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan: updated });
  } catch (error) {
    console.error("API PUT /api/remedial-plans error:", error);
    return NextResponse.json({ success: false, error: "Failed to update plan" }, { status: 500 });
  }
}
