import { NextResponse } from "next/server";
import { getConnectUser } from "@/lib/connect/auth";
import { db } from "@/lib/db/database";
import type { ChatMessage, ChatMessageAttachment } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "conversationId is required." }, { status: 400 });
    }

    // Server-side access check
    const conversation = db.getConversationById(conversationId, user.id, user.role);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Forbidden: You are not authorized to view messages in this conversation." }, { status: 403 });
    }

    const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") || "100")));
    const messages = db.getMessages(conversationId, limit);

    // Auto mark as read for viewer
    db.markMessagesAsRead(conversationId, user.id);

    return NextResponse.json({
      success: true,
      messages,
      conversationTitle: conversation.title,
      type: conversation.type,
    });
  } catch (error: any) {
    console.error("GET /api/connect/messages error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, text, attachments = [], replyTo } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "conversationId is required." }, { status: 400 });
    }

    const cleanText = (text || "").trim();
    if (!cleanText && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ success: false, error: "Message text or attachment is required." }, { status: 400 });
    }

    // Server-side access check
    const conversation = db.getConversationById(conversationId, user.id, user.role);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Forbidden: You are not authorized to send messages in this conversation." }, { status: 403 });
    }

    // Role restriction on announcements
    if (conversation.type === "announcement" && !conversation.allowParentReplies && user.role === "parent") {
      return NextResponse.json({
        success: false,
        error: "Forbidden: Parent replies are disabled for this official school announcement channel.",
      }, { status: 403 });
    }

    // Validate attachment size limits (max 10MB)
    const validAttachments: ChatMessageAttachment[] = [];
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att && att.name && att.url) {
          if (att.size && att.size > 10 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: `Attachment ${att.name} exceeds 10MB limit.` }, { status: 400 });
          }
          validAttachments.push({
            id: att.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: att.name,
            url: att.url,
            size: att.size || 0,
            mimeType: att.mimeType || "application/octet-stream",
          });
        }
      }
    }

    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: cleanText,
      attachments: validAttachments.length > 0 ? validAttachments : undefined,
      replyTo: replyTo ? { id: replyTo.id, senderName: replyTo.senderName, text: replyTo.text } : undefined,
      status: "sent",
      readBy: [{ userId: user.id, readAt: now }],
      isAnnouncement: conversation.type === "announcement",
      createdAt: now,
    };

    const saved = db.saveMessage(newMsg);

    return NextResponse.json({ success: true, message: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/connect/messages error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
