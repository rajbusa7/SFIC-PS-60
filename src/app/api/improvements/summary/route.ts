import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId") || undefined;

    const summary = db.getClassroomImprovementSummary(classroomId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("API GET /api/improvements/summary error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch improvement summary." },
      { status: 500 }
    );
  }
}
