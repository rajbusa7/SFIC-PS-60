import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!, 10) : undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    const worksheets = (db as any).getWorksheets({ grade, subjectCode, studentId }) || [];

    return NextResponse.json({
      success: true,
      worksheets,
    });
  } catch (error: any) {
    console.error("API GET /api/v1/worksheets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve worksheets" },
      { status: 500 }
    );
  }
}
