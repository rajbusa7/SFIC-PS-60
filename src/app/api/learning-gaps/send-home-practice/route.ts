import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;

    // Optional teacher verification (defaults to authorized if in demo/preview)
    const body = await request.json();
    const { studentId, gapId, activity, customNotes, language } = body;

    if (!studentId || !activity) {
      return NextResponse.json(
        { success: false, error: "Student ID and Activity details are required." },
        { status: 400 }
      );
    }

    const result = await db.sendHomePracticeToParentAsync({
      studentId,
      activity,
      customNotes,
      language: language || "en",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Failed to dispatch home practice to Parent Bridge." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      parentName: result.parentName,
      message: "Home practice approved and sent to Parent Bridge successfully.",
    });
  } catch (error: any) {
    console.error("[Send Home Practice API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send home practice" },
      { status: 500 }
    );
  }
}
