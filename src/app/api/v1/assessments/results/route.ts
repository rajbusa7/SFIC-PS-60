import { NextResponse } from "next/server";
import { assessmentService } from "@backend/services/assessmentService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const conceptId = searchParams.get("conceptId") || undefined;

    const results = await assessmentService.getResults(studentId, conceptId);
    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const results = Array.isArray(body) ? body : body.results;

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ success: false, error: "Array of results is required" }, { status: 400 });
    }

    const recorded = await assessmentService.recordResults(results);
    return NextResponse.json({ success: true, count: recorded.length, results: recorded }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to record results" }, { status: 500 });
  }
}
