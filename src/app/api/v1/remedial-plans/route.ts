import { NextResponse } from "next/server";
import { remedialService } from "@backend/services/remedialService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const status = searchParams.get("status") || undefined;

    const plans = await remedialService.getRemedialPlans(studentId, status);
    return NextResponse.json({ success: true, count: plans.length, remedialPlans: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch remedial plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gapId, customNotes, plan } = body;

    if (plan) {
      const saved = await remedialService.updatePlan(plan.id, plan);
      return NextResponse.json({ success: true, remedialPlan: saved });
    }

    if (gapId) {
      const created = await remedialService.generatePlan({
        conceptId: gapId,
        gapReason: customNotes,
      });
      return NextResponse.json({ success: true, ...created }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: "Invalid remedial plan payload" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to save remedial plan" }, { status: 500 });
  }
}
