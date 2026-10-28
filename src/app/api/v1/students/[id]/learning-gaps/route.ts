import { NextResponse } from "next/server";
import { learningGapService } from "@backend/services/learningGapService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gaps = await learningGapService.getGapsForStudent(id);
    return NextResponse.json({ success: true, count: gaps.length, learningGaps: gaps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
