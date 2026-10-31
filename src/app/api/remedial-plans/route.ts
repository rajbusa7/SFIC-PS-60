import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const id = searchParams.get("id") || searchParams.get("planId") || undefined;

    if (id) {
      const plan = db.getRemedialPlanById(id);
      if (!plan) {
        return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, plan });
    }

    let plans = db.getRemedialPlans(studentId);

    if (status && status !== "all") {
      plans = plans.filter((p) => p.status === status);
    }

    return NextResponse.json({ success: true, plans, count: plans.length });
  } catch (error: any) {
    console.error("API GET /api/remedial-plans error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch remedial plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, gapId, customNotes, plan, planId, parentPlanId, marksObtained, maximumMarks, answers, notes, teacherFeedback, language } = body;

    // 1. Reassessment Action
    if (action === "reassess" || (marksObtained !== undefined && (planId || body.id))) {
      const targetId = planId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: "planId is required for reassessment" }, { status: 400 });
      }
      const result = db.recordPlanReassessment(
        targetId,
        Number(marksObtained),
        Number(maximumMarks || 5),
        answers,
        notes,
        teacherFeedback
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, plan: result.plan });
    }

    // 2. Follow-Up Plan Generation Action
    if (action === "followUp" || parentPlanId) {
      const targetParentId = parentPlanId || planId;
      if (!targetParentId) {
        return NextResponse.json({ success: false, error: "parentPlanId is required to generate follow-up plan" }, { status: 400 });
      }
      const followUp = db.generateFollowUpPlan(targetParentId, customNotes);
      if (!followUp) {
        return NextResponse.json({ success: false, error: "Parent plan not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, plan: followUp, isFollowUp: true });
    }

    // 3. Upgrade / Repair Existing Incomplete Plan
    if (action === "upgrade" || action === "repair") {
      const targetId = planId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: "planId is required" }, { status: 400 });
      }
      const upgraded = db.repairOrUpgradePlan(targetId);
      if (!upgraded) {
        return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, plan: upgraded });
    }

    // 4. Direct save of custom / reviewed AI plan
    if (plan && plan.studentId && plan.conceptId) {
      const saved = db.saveCustomRemedialPlan(plan);
      return NextResponse.json({ success: true, plan: saved });
    }

    // 5. Standard create from learning gap
    if (!gapId) {
      return NextResponse.json({ success: false, error: "gapId or full plan object is required" }, { status: 400 });
    }

    const targetGap = db.getLearningGapById(gapId);
    if (!targetGap) {
      return NextResponse.json(
        { success: false, error: "Could not create plan: Learning gap record not found" },
        { status: 404 }
      );
    }

    if (targetGap.masteryStatus === "Mastered" || targetGap.status === "Resolved") {
      return NextResponse.json(
        { success: false, error: "Remedial plan not needed: Competency is already mastered. Periodic maintenance practice is recommended." },
        { status: 400 }
      );
    }

    const createdPlan = db.createRemedialPlanForGap(gapId, customNotes, {
      language: language === "gu" ? "gu" : "en",
      forceRegenerate: Boolean(body.forceRegenerate),
      diagnosisType: body.diagnosisType,
      pedagogicalPrescription: body.pedagogicalPrescription,
      trend: body.trend,
    });

    if (!createdPlan) {
      return NextResponse.json(
        { success: false, error: "Could not create plan: Student or concept not found" },
        { status: 404 }
      );
    }

    if (!Array.isArray(createdPlan.steps) || createdPlan.steps.length !== 5) {
      return NextResponse.json(
        { success: false, error: "Plan generation failed: Exactly 5 teaching steps required." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, plan: createdPlan });
  } catch (error: any) {
    console.error("API POST /api/remedial-plans error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create remedial plan" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      teacherNotes,
      steps,
      learningObjective,
      completedSteps,
      teacherObservations,
      startDate,
      targetDate,
      reviewDate,
      masteryBenchmark,
      action,
      marksObtained,
      maximumMarks,
      answers,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 });
    }

    // If PUT carries reassessment action
    if (action === "reassess" || marksObtained !== undefined) {
      const result = db.recordPlanReassessment(
        id,
        Number(marksObtained),
        Number(maximumMarks || 5),
        answers,
        notes
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, plan: result.plan });
    }

    const updated = db.updateRemedialPlan(id, {
      ...(status ? { status } : {}),
      ...(teacherNotes !== undefined ? { teacherNotes } : {}),
      ...(steps ? { steps } : {}),
      ...(learningObjective ? { learningObjective } : {}),
      ...(completedSteps !== undefined ? { completedSteps } : {}),
      ...(teacherObservations !== undefined ? { teacherObservations } : {}),
      ...(startDate ? { startDate } : {}),
      ...(targetDate ? { targetDate } : {}),
      ...(reviewDate ? { reviewDate } : {}),
      ...(masteryBenchmark !== undefined ? { masteryBenchmark: Number(masteryBenchmark) } : {}),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    console.error("API PUT /api/remedial-plans error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update plan" }, { status: 500 });
  }
}
