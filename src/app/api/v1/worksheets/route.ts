import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId") || undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const gradeStr = searchParams.get("grade");
    const grade = gradeStr ? Number(gradeStr) : undefined;

    const worksheets = db.getWorksheets(conceptId, subjectCode, grade);
    return NextResponse.json({ success: true, count: worksheets.length, worksheets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch worksheets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = db.createWorksheet(body);
    return NextResponse.json({ success: true, worksheet: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create worksheet" }, { status: 400 });
  }
}
