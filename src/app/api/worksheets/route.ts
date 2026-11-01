import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!, 10) : undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    const worksheets = (db as any).getWorksheets({ grade, subjectCode, studentId });

    return NextResponse.json(
      {
        success: true,
        worksheets,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("API GET /api/worksheets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve worksheets" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing worksheet ID" }, { status: 400 });
    }

    const deleted = (db as any).deleteWorksheet(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("API DELETE /api/worksheets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete worksheet" },
      { status: 500 }
    );
  }
}
