import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import {
  calculateInterventionEffectiveness,
  getInterventionFeedbackForPrescription,
} from "@/lib/engine/interventionEffectiveness";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const interventionType = searchParams.get("interventionType") || undefined;

    const records = db.getInterventionRecords({
      conceptId,
      studentId,
      interventionType,
    });

    const effectiveness = calculateInterventionEffectiveness(records, {
      conceptId,
      subjectCode,
      interventionType,
    });

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
      effectiveness,
    });
  } catch (error: any) {
    console.error("[Interventions API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load intervention records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      interventionType,
      conceptId,
      conceptName,
      subjectCode,
      gapType,
      studentId,
      studentName,
      preInterventionScore,
      postInterventionScore,
      durationMinutes,
      teacherFeedback,
      outcome,
    } = body;

    if (!interventionType || !conceptId || !studentId) {
      return NextResponse.json(
        { success: false, error: "Missing required intervention fields." },
        { status: 400 }
      );
    }

    const pre = Number(preInterventionScore ?? 0);
    const post = Number(postInterventionScore ?? 0);
    const scoreDelta = Math.round((post - pre) * 10) / 10;

    const record = db.recordIntervention({
      interventionType,
      conceptId,
      conceptName: conceptName || "Curricular Concept",
      subjectCode: subjectCode || "MATH",
      gapType: gapType || "Conceptual Gap",
      studentId,
      studentName: studentName || "Student",
      preInterventionScore: pre,
      postInterventionScore: post,
      scoreDelta,
      date: new Date().toISOString(),
      durationMinutes: Number(durationMinutes || 12),
      teacherFeedback,
      outcome: outcome || (post >= 80 ? "Mastered" : post >= 60 ? "Developing" : "Needs Further Support"),
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("[Record Intervention API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record intervention" },
      { status: 500 }
    );
  }
}
