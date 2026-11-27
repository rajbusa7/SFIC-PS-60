import { NextResponse } from "next/server";
import { extractSessionToken, verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db/database";
import type { Student } from "@/lib/types";

async function authorizeStaffForStudent(request: Request, student: Student) {
  const sessionToken = await extractSessionToken(request);
  if (!sessionToken) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 }),
    };
  }

  const session = await verifySession(sessionToken);
  if (!session || (session.role !== "teacher" && session.role !== "admin")) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Access denied. Teacher or Admin role required." },
        { status: 403 }
      ),
    };
  }

  if (session.role === "teacher") {
    let assignments = await db.getTeacherAssignmentsAsync(session.id);
    if ((!assignments || assignments.length === 0) && session.email) {
      assignments = await db.getTeacherAssignmentsAsync(session.email);
    }
    if (!assignments || assignments.length === 0) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { success: false, error: "No subjects have been assigned to your account. Please contact your administrator." },
          { status: 403 }
        ),
      };
    }

    const assignedClassroomIds = assignments.flatMap((a) => a.classroomIds || []);
    const assignedGrades = assignments.flatMap((a) => a.grades || []);
    const isAuthorized =
      assignedClassroomIds.includes(student.classroomId) || assignedGrades.includes(student.grade);

    if (!isAuthorized) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to manage linking codes for this student." },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true as const, session };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const auth = await authorizeStaffForStudent(request, student);
    if (!auth.ok) return auth.response;

    const [linkingCodes, connectedParents] = await Promise.all([
      db.getLinkingCodesForStudentAsync(studentId),
      db.getParentsByStudentIdAsync(studentId),
    ]);

    return NextResponse.json({
      success: true,
      student: { id: student.id, name: student.displayName, studentCode: student.studentCode, grade: student.grade, section: student.section },
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

    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const auth = await authorizeStaffForStudent(request, student);
    if (!auth.ok) return auth.response;

    let expiresInDays = 7;
    try {
      const body = await request.json();
      if (body && typeof body.expiresInDays === "number" && Number.isFinite(body.expiresInDays)) {
        expiresInDays = Math.min(30, Math.max(1, Math.round(body.expiresInDays)));
      }
    } catch {
      // Empty body defaults to 7 days
    }

    const newCode = await db.createLinkingCodeAsync(studentId, auth.session.id, expiresInDays);

    return NextResponse.json({
      success: true,
      message: `Generated secure verification code ${newCode.code} valid for ${expiresInDays} days.`,
      linkingCode: newCode,
    });
  } catch (error: any) {
    console.error("[Generate Link Code Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate linking code" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get("codeId");

    if (!codeId) {
      return NextResponse.json({ success: false, error: "codeId query parameter is required." }, { status: 400 });
    }

    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const auth = await authorizeStaffForStudent(request, student);
    if (!auth.ok) return auth.response;

    const revoked = await db.revokeLinkingCodeAsync(codeId, studentId);
    if (!revoked) {
      return NextResponse.json(
        { success: false, error: "Active linking code not found or already used." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code revoked.",
    });
  } catch (error: any) {
    console.error("[Revoke Link Code Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to revoke linking code" }, { status: 500 });
  }
}

