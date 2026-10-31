import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);
    let sessionUser: any = null;
    if (sessionToken) {
      sessionUser = await verifySession(sessionToken);
    }

    const url = new URL(request.url);
    const studentIdParam = url.searchParams.get("studentId");
    const parentIdParam = url.searchParams.get("parentId");
    const typeParam = url.searchParams.get("type");
    const statusParam = url.searchParams.get("status");

    // Enforce strict parent RBAC
    if (sessionUser && sessionUser.role === "parent") {
      const parentProfile = await db.getParentByUserIdAsync(sessionUser.id);
      if (!parentProfile) {
        return NextResponse.json(
          { success: false, error: "Parent profile not found." },
          { status: 404 }
        );
      }

      const authorizedStudentIds = parentProfile.studentIds || [];
      if (studentIdParam && !authorizedStudentIds.includes(studentIdParam)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to view communications for this student." },
          { status: 403 }
        );
      }

      let communications = db.getParentCommunications({
        parentId: parentProfile.id,
        studentId: studentIdParam || undefined,
        type: (typeParam as any) || undefined,
        status: (statusParam as any) || undefined,
      });

      // Also include any communications addressing their authorized students
      if (authorizedStudentIds.length > 0) {
        const studentComms = authorizedStudentIds.flatMap((sid) =>
          db.getParentCommunications({ studentId: sid })
        );
        const map = new Map<string, any>();
        [...communications, ...studentComms].forEach((c) => map.set(c.id, c));
        communications = Array.from(map.values()).sort(
          (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );
      }

      return NextResponse.json({
        success: true,
        count: communications.length,
        data: communications,
      });
    }

    // Teacher or admin or general authorized request
    const communications = db.getParentCommunications({
      studentId: studentIdParam || undefined,
      parentId: parentIdParam || undefined,
      type: (typeParam as any) || undefined,
      status: (statusParam as any) || undefined,
    });

    return NextResponse.json({
      success: true,
      count: communications.length,
      data: communications,
    });
  } catch (error: any) {
    console.error("[Communication History API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve communication history" },
      { status: 500 }
    );
  }
}

