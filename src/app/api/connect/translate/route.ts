import { NextResponse } from "next/server";
import { getConnectUser } from "@/lib/connect/auth";
import { centralAi } from "@/lib/ai/centralAiService";

export async function POST(request: Request) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { text, targetLanguage = "gu" } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ success: false, error: "Text is required." }, { status: 400 });
    }

    const res = await centralAi.translate(text.trim(), {
      targetLanguage: targetLanguage as any,
      sourceLanguage: "auto" as any,
      readingLevel: "simple" as any,
      preserveEntities: true,
    });

    return NextResponse.json({
      success: true,
      originalText: text,
      translatedText: res.translatedText,
      targetLanguage,
    });
  } catch (error: any) {
    console.error("POST /api/connect/translate error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to translate" }, { status: 500 });
  }
}
