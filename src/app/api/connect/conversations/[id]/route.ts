import { NextResponse } from "next/server";
import { getConnectUser } from "@/lib/connect/auth";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const conversation = db.getConversationById(id, user.id, user.role);

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found or access denied." }, { status: 404 });
    }

    const participants = db.getConversationParticipants(id);

    return NextResponse.json({
      success: true,
      conversation,
      participants,
    });
  } catch (error: any) {
    console.error("GET /api/connect/conversations/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const conversation = db.getConversationById(id, user.id, user.role);

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found or access denied." }, { status: 404 });
    }

    // Only conversation admins or school admins can modify
    const isConvAdmin = conversation.adminIds?.includes(user.id) || user.role === "admin";
    if (!isConvAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not have permission to manage this conversation." }, { status: 403 });
    }

    const body = await request.json();
    const { title, titleGujarati, description, isPinned, allowParentReplies, addParticipants, removeParticipants } = body;

    if (title) conversation.title = title;
    if (titleGujarati) conversation.titleGujarati = titleGujarati;
    if (description !== undefined) conversation.description = description;
    if (isPinned !== undefined) conversation.isPinned = Boolean(isPinned);
    if (allowParentReplies !== undefined) conversation.allowParentReplies = Boolean(allowParentReplies);

    if (Array.isArray(addParticipants)) {
      conversation.participantIds = Array.from(new Set([...conversation.participantIds, ...addParticipants]));
    }

    if (Array.isArray(removeParticipants)) {
      conversation.participantIds = conversation.participantIds.filter((p) => !removeParticipants.includes(p));
    }

    const saved = db.saveConversation(conversation);

    return NextResponse.json({ success: true, conversation: saved });
  } catch (error: any) {
    console.error("PUT /api/connect/conversations/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const conversation = db.getConversationById(id, user.id, user.role);

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });
    }

    const isConvAdmin = conversation.adminIds?.includes(user.id) || user.role === "admin";
    if (!isConvAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Only administrators can delete conversations." }, { status: 403 });
    }

    const deleted = db.deleteConversation(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("DELETE /api/connect/conversations/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
