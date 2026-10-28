import { NextResponse } from "next/server";
import { learningGapService } from "@backend/services/learningGapService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const status = searchParams.get("status") || undefined;

    const gaps = await learningGapService.getLearningGaps(studentId, priority, status);
    return NextResponse.json({ success: true, count: gaps.length, learningGaps: gaps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch learning gaps" }, { status: 500 });
  }
}
