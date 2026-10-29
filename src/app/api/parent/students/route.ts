import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session || session.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Access denied. Parent role required." },
        { status: 403 }
      );
    }

    const parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      return NextResponse.json({ success: true, students: [] });
    }

    const students = await db.getLinkedStudentsForParentAsync(parentProfile.id);
    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    console.error("[Parent Students API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch linked students" },
      { status: 500 }
    );
  }
}
