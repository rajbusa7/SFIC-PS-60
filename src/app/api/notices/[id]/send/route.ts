import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { grade, section, studentIds, requireApprovedTranslations = true } = body;

    const notice = db.getNoticeById(id);
    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found." },
        { status: 404 }
      );
    }

    // Safety check: ensure notice has at least simplified content or original content
    if (!notice.simplifiedContent && !notice.originalContent) {
      return NextResponse.json(
        { success: false, error: "Cannot send empty notice." },
        { status: 400 }
      );
    }

    const deliveries = db.sendNoticeToParents(id, {
      grade: grade ? Number(grade) : notice.targetClassGrade,
      section: section || notice.targetSection,
      studentIds,
    });

    return NextResponse.json({
      success: true,
      message: `Notice successfully dispatched to ${deliveries.length} parents.`,
      deliveriesCount: deliveries.length,
      data: deliveries,
    });
  } catch (error: any) {
    console.error("Error in POST /api/notices/[id]/send:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch notice." },
      { status: 500 }
    );
  }
}
