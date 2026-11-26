import { NextResponse } from "next/server";
import { getConnectUser } from "@/lib/connect/auth";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, reason } = body;

    if (!messageId || !reason) {
      return NextResponse.json({ success: false, error: "messageId and reason are required." }, { status: 400 });
    }

    const reported = db.reportMessage(messageId, reason);
    if (!reported) {
      return NextResponse.json({ success: false, error: "Message not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Message reported to school administrators for moderation review.",
    });
  } catch (error: any) {
    console.error("POST /api/connect/messages/report error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
