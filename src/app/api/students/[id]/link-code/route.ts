import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const session = await verifySession(sessionToken);
    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Access denied. Teacher or Admin role required." }, { status: 403 });
    }

    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const linkingCodes = await db.getLinkingCodesForStudentAsync(studentId);
    const connectedParents = db.getParentsByStudentId(studentId);

    return NextResponse.json({
      success: true,
      student: { id: student.id, name: student.displayName, grade: student.grade, section: student.section },
      linkingCodes,
      connectedParents,
    });
  } catch (error: any) {
    console.error("[Get Link Codes Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch linking codes" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const session = await verifySession(sessionToken);
    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Access denied. Teacher or Admin role required." }, { status: 403 });
    }

    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const newCode = await db.createLinkingCodeAsync(studentId, session.id, 7);

    return NextResponse.json({
      success: true,
      message: `Generated secure linking code ${newCode.code} valid for 7 days.`,
      linkingCode: newCode,
    });
  } catch (error: any) {
    console.error("[Generate Link Code Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate linking code" }, { status: 500 });
  }
}

