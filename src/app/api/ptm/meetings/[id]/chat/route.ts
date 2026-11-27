import { NextResponse } from "next/server";
import { validateMeetingAccess } from "@/lib/ptm/ptmAuth";
import { db } from "@/lib/db/database";
import type { PtmChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await validateMeetingAccess(request, id);

    if (!access.allowed || !access.meeting) {
      return NextResponse.json(
        { success: false, error: access.error || "Access denied." },
        { status: access.status }
      );
    }

    const messages = await db.getPtmChatMessagesAsync(access.meeting.id);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (err: any) {
    console.error("[PTM GET Chat Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve meeting chat." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await validateMeetingAccess(request, id);

    if (!access.allowed || !access.meeting || !access.user) {
      return NextResponse.json(
        { success: false, error: access.error || "Access denied." },
        { status: access.status }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Message cannot be empty." }, { status: 400 });
    }

    const chatMsg: PtmChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meetingId: access.meeting.id,
      senderId: access.user.id,
      senderName: access.user.name,
      senderRole: access.user.role,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    const saved = await db.savePtmChatMessageAsync(chatMsg);

    return NextResponse.json({
      success: true,
      message: saved,
    });
  } catch (err: any) {
    console.error("[PTM POST Chat Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send chat message." },
      { status: 500 }
    );
  }
}
