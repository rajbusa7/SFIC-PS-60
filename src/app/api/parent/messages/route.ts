import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const session = await verifySession(sessionToken);
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      return NextResponse.json({ success: true, messages: [] });
    }

    const messages = await db.getMessagesForParentAsync(parentProfile.id);
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("[Get Messages API Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const session = await verifySession(sessionToken);
    if (!session || session.role !== "parent") {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      return NextResponse.json({ success: false, error: "Parent profile not found." }, { status: 404 });
    }

    const body = await request.json();
    const { studentId, subject, message } = body;

    if (!studentId || !parentProfile.studentIds?.includes(studentId)) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to send messages regarding this student." },
        { status: 403 }
      );
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ success: false, error: "Subject is required." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ success: false, error: "Message body is required." }, { status: 400 });
    }

    const newMsg = await db.createParentMessageAsync(
      parentProfile.id,
      studentId,
      subject.trim(),
      message.trim()
    );

    return NextResponse.json({
      success: true,
      message: "Your message has been delivered to the teacher's portal.",
      data: newMsg,
    });
  } catch (error: any) {
    console.error("[Send Message API Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to send message" }, { status: 500 });
  }
}
