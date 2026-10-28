import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = db.getSettings();
    const school = db.getSchool();
    return NextResponse.json({ success: true, settings, school });
  } catch (error) {
    console.error("API GET /api/settings error:", error);
    return NextResponse.json({ success: false, error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      masteryThreshold,
      developingThreshold,
      preferredLanguage,
      enableAiAssist,
      aiAssistantName,
    } = body;

    // If aiAssistantName is being changed, enforce validation and admin authorization
    if (aiAssistantName !== undefined) {
      if (typeof aiAssistantName !== "string" || !aiAssistantName.trim()) {
        return NextResponse.json(
          { success: false, error: "AI Assistant Name cannot be empty or contain only whitespace." },
          { status: 400 }
        );
      }

      const trimmedName = aiAssistantName.trim();
      if (trimmedName.length > 60) {
        return NextResponse.json(
          { success: false, error: "AI Assistant Name cannot exceed 60 characters." },
          { status: 400 }
        );
      }

      // Check admin authorization via session cookie or header
      let isAdmin = false;
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
      const token = match ? decodeURIComponent(match[1]) : null;

      if (token) {
        const session = await verifySession(token);
        if (session && session.role === "admin") {
          isAdmin = true;
        }
      }

      // Fallback for programmatic API clients / testing
      if (!isAdmin) {
        const roleHeader = request.headers.get("x-user-role");
        if (roleHeader === "admin") {
          isAdmin = true;
        }
      }

      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "Access denied: Only administrators can modify the AI assistant name." },
          { status: 403 }
        );
      }
    }

    const updated = db.updateSettings({
      ...(masteryThreshold !== undefined ? { masteryThreshold: Number(masteryThreshold) } : {}),
      ...(developingThreshold !== undefined ? { developingThreshold: Number(developingThreshold) } : {}),
      ...(preferredLanguage ? { preferredLanguage } : {}),
      ...(enableAiAssist !== undefined ? { enableAiAssist: Boolean(enableAiAssist) } : {}),
      ...(aiAssistantName !== undefined ? { aiAssistantName: aiAssistantName.trim() } : {}),
    });

    // Re-evaluate gaps with new thresholds if thresholds changed
    if (masteryThreshold !== undefined || developingThreshold !== undefined) {
      const students = db.getStudents();
      for (const s of students) {
        db.recalculateLearningGapsForStudent(s.id);
      }
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("API PUT /api/settings error:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
