import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = db.getRemedialPlanById(id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: `Remedial plan '${id}' was not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch remedial plan" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      teacherNotes,
      steps,
      learningObjective,
      stepNumber,
      stepCompleted,
      teacherApproval,
    } = body;

    // Step completion toggle
    if (stepNumber !== undefined && stepCompleted !== undefined) {
      const stepUpdated = db.recordRemedialStepCompletion(
        id,
        Number(stepNumber),
        Boolean(stepCompleted)
      );
      if (!stepUpdated) {
        return NextResponse.json(
          { success: false, error: `Remedial plan '${id}' not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, plan: stepUpdated });
    }

    // Teacher approval
    if (status === "Approved") {
      const approved = db.updateRemedialPlanStatus(id, "Approved", teacherNotes, teacherApproval);
      if (!approved) {
        return NextResponse.json(
          { success: false, error: `Remedial plan '${id}' not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, plan: approved });
    }

    const updated = db.updateRemedialPlan(id, {
      ...(status ? { status } : {}),
      ...(teacherNotes !== undefined ? { teacherNotes } : {}),
      ...(steps ? { steps } : {}),
      ...(learningObjective ? { learningObjective } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Remedial plan '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update remedial plan" },
      { status: 500 }
    );
  }
}
