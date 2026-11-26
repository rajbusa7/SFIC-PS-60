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
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "conversationId is required." }, { status: 400 });
    }

    const readCount = db.markMessagesAsRead(conversationId, user.id);
    return NextResponse.json({ success: true, readCount });
  } catch (error: any) {
    console.error("POST /api/connect/messages/read error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
