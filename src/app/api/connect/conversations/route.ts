import { NextResponse } from "next/server";
import { getConnectUser } from "@/lib/connect/auth";
import { db } from "@/lib/db/database";
import type { Conversation, ConversationType } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in to access Connect." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") as ConversationType | null;
    const searchQuery = searchParams.get("search")?.toLowerCase().trim();

    let conversations = db.getConversations(user.id, user.role);

    if (typeFilter) {
      conversations = conversations.filter((c) => c.type === typeFilter);
    }

    if (searchQuery) {
      conversations = conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery) ||
          (c.titleGujarati && c.titleGujarati.toLowerCase().includes(searchQuery)) ||
          (c.lastMessageText && c.lastMessageText.toLowerCase().includes(searchQuery))
      );
    }

    // Sort: Pinned first, then by latest message timestamp
    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    const unreadTotal = db.getUnreadChatCount(user.id);

    return NextResponse.json({
      success: true,
      conversations,
      unreadTotal,
      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("GET /api/connect/conversations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      titleGujarati,
      description,
      classroomId,
      participantIds = [],
      allowParentReplies = true,
      initialMessage,
    } = body;

    if (!type || !title) {
      return NextResponse.json({ success: false, error: "Type and Title are required." }, { status: 400 });
    }

    // RBAC:
    if (type === "announcement" && user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Forbidden: Only administrators or teachers can create announcement channels." }, { status: 403 });
    }

    if (type === "class_group" && user.role === "parent") {
      return NextResponse.json({ success: false, error: "Forbidden: Parents cannot create class groups." }, { status: 403 });
    }

    // 1. Check for duplicate direct conversation
    if (type === "direct") {
      const otherParticipantId = participantIds.find((id: string) => id !== user.id);
      if (otherParticipantId) {
        const existingConvs = db.getConversations(user.id, user.role).filter((c) => c.type === "direct");
        const found = existingConvs.find(
          (c) => c.participantIds.includes(user.id) && c.participantIds.includes(otherParticipantId)
        );
        if (found) {
          return NextResponse.json({ success: true, conversation: found, isExisting: true });
        }
      }
    }

    // Ensure creator is in participants
    const allParticipants = Array.from(new Set([user.id, ...(participantIds || [])]));

    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      titleGujarati: titleGujarati || title,
      description: description || "",
      classroomId: classroomId || undefined,
      schoolId: user.schoolId || "sch-gn-01",
      participantIds: allParticipants,
      adminIds: [user.id],
      lastMessageText: initialMessage || undefined,
      lastMessageAt: initialMessage ? now : undefined,
      lastMessageSenderName: initialMessage ? user.name : undefined,
      unreadCounts: {},
      isPinned: false,
      allowParentReplies: allowParentReplies !== false,
      createdAt: now,
      updatedAt: now,
    };

    const saved = db.saveConversation(newConv);

    if (initialMessage) {
      db.saveMessage({
        id: `msg-${Date.now()}`,
        conversationId: saved.id,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text: initialMessage,
        status: "sent",
        readBy: [{ userId: user.id, readAt: now }],
        createdAt: now,
      });
    }

    return NextResponse.json({ success: true, conversation: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/connect/conversations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
