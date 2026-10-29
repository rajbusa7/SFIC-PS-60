import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId") || undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;

    let activities = db.getActivities(conceptId);

    if (subjectCode) {
      activities = activities.filter((a) => a.subjectCode === subjectCode);
    }

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error("API GET /api/activities error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch activities" }, { status: 500 });
  }
}
