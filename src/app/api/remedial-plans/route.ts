import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const classroomId = searchParams.get("classroomId") || undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search")?.toLowerCase().trim() || undefined;

    let plans = db.getRemedialPlans(studentId);

    if (classroomId) {
      plans = plans.filter((p) => p.classroomId === classroomId);
    }

    if (subjectCode) {
      plans = plans.filter((p) => p.subjectCode === subjectCode);
    }

    if (status && status !== "all") {
      plans = plans.filter((p) => p.status === status);
    }

    if (search) {
      plans = plans.filter((p) =>
        (p.studentName && p.studentName.toLowerCase().includes(search)) ||
        (p.studentCode && p.studentCode.toLowerCase().includes(search)) ||
        (p.conceptName && p.conceptName.toLowerCase().includes(search)) ||
        (p.learningObjective && p.learningObjective.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: plans.length,
      plans,
      remedialPlans: plans,
    });
  } catch (error) {
    console.error("API GET /api/remedial-plans error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch remedial plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gapId, studentId, conceptId, forceRecreate, customNotes, plan } = body;

    // Case 1: Direct save of custom or AI reviewed plan
    if (plan && plan.studentId && plan.conceptId) {
      const saved = db.saveCustomRemedialPlan(plan);
      return NextResponse.json({
        success: true,
        plan: saved,
        remedialPlan: saved,
      });
    }

    // Case 2: Direct generation by studentId and conceptId
    if (studentId && conceptId) {
      const createdPlan = db.createRemedialPlanForStudentConcept(studentId, conceptId, {
        forceRecreate: Boolean(forceRecreate),
        customNotes,
      });

      if (!createdPlan) {
        return NextResponse.json(
          {
            success: false,
            error: "Could not create remedial plan: Student or Competency not found.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        plan: createdPlan,
        remedialPlan: createdPlan,
      });
    }

    // Case 3: Generation by learning gap ID
    if (gapId) {
      const createdPlan = db.createRemedialPlanForGap(gapId, customNotes, {
        forceRecreate: Boolean(forceRecreate),
      });

      if (!createdPlan) {
        return NextResponse.json(
          {
            success: false,
            error: "Could not create remedial plan: Learning gap or associated student not found.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        plan: createdPlan,
        remedialPlan: createdPlan,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Missing required parameters: please provide either 'gapId' or both 'studentId' and 'conceptId'.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("API POST /api/remedial-plans error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create remedial plan" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, stepNumber, completed, action, status, teacherNotes, steps, learningObjective } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Sub-case A: Toggle individual step
    if (stepNumber !== undefined && completed !== undefined) {
      const updated = db.updateRemedialPlanStep(id, Number(stepNumber), Boolean(completed));
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Plan or step not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        plan: updated,
        remedialPlan: updated,
      });
    }

    // Sub-case B: Reopen plan
    if (action === "reopen") {
      const updated = db.reopenRemedialPlan(id);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Plan not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        plan: updated,
        remedialPlan: updated,
      });
    }

    // Sub-case C: General plan updates
    const updated = db.updateRemedialPlan(id, {
      ...(status ? { status } : {}),
      ...(teacherNotes !== undefined ? { teacherNotes } : {}),
      ...(steps ? { steps } : {}),
      ...(learningObjective ? { learningObjective } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: updated,
      remedialPlan: updated,
    });
  } catch (error) {
    console.error("API PUT /api/remedial-plans error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update remedial plan" },
      { status: 500 }
    );
  }
}
