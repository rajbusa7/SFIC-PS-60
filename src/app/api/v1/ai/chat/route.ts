import { NextResponse } from "next/server";
import { aiService } from "@backend/services/aiService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history = [], language = "en", userRole = "teacher" } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ success: false, error: "Message is required." }, { status: 400 });
    }

    const result = await aiService.askAssistant(message, history, language, userRole);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to process chat message" }, { status: 500 });
  }
}
