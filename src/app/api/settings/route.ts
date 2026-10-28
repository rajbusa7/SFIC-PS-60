import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = db.getSettings();
    const school = db.getSchool();
    return NextResponse.json({ success: true, settings, school });
  } catch (error) {
    console.error("API GET /api/settings error:", error);
    return NextResponse.json({ success: false, error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { masteryThreshold, developingThreshold, preferredLanguage, enableAiAssist } = body;

    const updated = db.updateSettings({
      ...(masteryThreshold !== undefined ? { masteryThreshold: Number(masteryThreshold) } : {}),
      ...(developingThreshold !== undefined ? { developingThreshold: Number(developingThreshold) } : {}),
      ...(preferredLanguage ? { preferredLanguage } : {}),
      ...(enableAiAssist !== undefined ? { enableAiAssist: Boolean(enableAiAssist) } : {}),
    });

    // Re-evaluate gaps with new thresholds for all students
    const students = db.getStudents();
    for (const s of students) {
      db.recalculateLearningGapsForStudent(s.id);
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("API PUT /api/settings error:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
