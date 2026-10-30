import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId") || undefined;
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!, 10) : undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const activityType = searchParams.get("activityType") || undefined;
    const chapter = searchParams.get("chapter") || undefined;
    const search = searchParams.get("search")?.toLowerCase().trim() || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    let activities = db.getActivities(conceptId);

    // Apply Filters
    if (subjectCode && subjectCode !== "all") {
      activities = activities.filter((a) => a.subjectCode === subjectCode);
    }

    if (grade && !isNaN(grade)) {
      activities = activities.filter((a) => a.grade === grade);
    }

    if (difficulty && difficulty !== "all") {
      activities = activities.filter(
        (a) => a.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    if (activityType && activityType !== "all") {
      activities = activities.filter((a) => a.activityType === activityType);
    }

    if (chapter && chapter !== "all") {
      activities = activities.filter(
        (a) => (a as any).chapter === chapter || (a as any).chapterGujarati === chapter
      );
    }

    if (search) {
      activities = activities.filter((a) => {
        const text = [
          a.title,
          a.titleGujarati,
          a.conceptName,
          (a as any).conceptNameGujarati,
          (a as any).chapter,
          (a as any).chapterGujarati,
          (a as any).topic,
          (a as any).topicGujarati,
          a.subjectCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(search);
      });
    }

    // Optional student attempts for tracking & badges
    let studentAttempts: any[] = [];
    if (studentId) {
      studentAttempts = db.getAttempts(studentId);
    }

    return NextResponse.json({
      success: true,
      totalCount: activities.length,
      activities,
      attempts: studentAttempts,
    });
  } catch (error) {
    console.error("API GET /api/activities error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
