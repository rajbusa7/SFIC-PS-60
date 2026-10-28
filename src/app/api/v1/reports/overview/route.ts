import { NextResponse } from "next/server";
import { reportService } from "@backend/services/reportService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : undefined;

    const report = await reportService.getOverviewReport(grade);
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
