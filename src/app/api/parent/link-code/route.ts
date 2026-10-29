import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid linking code." },
        { status: 400 }
      );
    }

    const parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      return NextResponse.json(
        { success: false, error: "Parent profile not found." },
        { status: 404 }
      );
    }

    const redeemResult = await db.redeemLinkingCodeAsync(
      code.trim(),
      session.id,
      parentProfile.id
    );

    if (!redeemResult.success) {
      return NextResponse.json(
        { success: false, error: redeemResult.error || "Failed to redeem code." },
        { status: 400 }
      );
    }

    const linkedStudent = redeemResult.studentId
      ? await db.getStudentByIdAsync(redeemResult.studentId)
      : null;

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${linkedStudent?.displayName || "student"} to your parent account!`,
      student: linkedStudent,
      studentId: redeemResult.studentId,
    });
  } catch (error: any) {
    console.error("[Redeem Code API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to redeem linking code" },
      { status: 500 }
    );
  }
}
