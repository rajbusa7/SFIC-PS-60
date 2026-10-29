import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in as a parent." },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expired or invalid. Please sign in again." },
        { status: 401 }
      );
    }

    if (session.role !== "parent" && session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: This area is reserved for parents, teachers, and administrators." },
        { status: 403 }
      );
    }

    // Retrieve user and parent profile
    let parentProfile: any = null;
    let linkedStudents: any[] = [];

    if (session.role === "parent") {
      const user = await db.getUserByIdAsync(session.id);
      parentProfile = await db.getParentByUserIdAsync(session.id);

      // If parent profile does not exist yet for this parent user, create a default one
      if (!parentProfile && user) {
        parentProfile = await db.createParentProfileAsync({
          userId: user.id,
          name: user.name,
          email: user.email,
          preferredLanguage: "gu",
          relationship: "guardian",
          studentIds: [],
        });
      }

      // Retrieve linked students
      linkedStudents = parentProfile?.id
        ? await db.getLinkedStudentsForParentAsync(parentProfile.id)
        : [];
    } else {
      // Teacher or Admin previewing / managing Parent Bridge in unified frame
      parentProfile = (await db.getParentByIdAsync("par-001")) || {
        id: "par-001",
        userId: session.id,
        name: "Dineshbhai Patel (Parent Preview)",
        email: "dinesh.patel@example.com",
        preferredLanguage: "gu",
        relationship: "father",
        studentIds: ["std-aarav"],
      };
      linkedStudents = await db.getLinkedStudentsForParentAsync("par-001");
      if (linkedStudents.length === 0) {
        const students = await db.getStudents();
        linkedStudents = students.slice(0, 3);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        schoolId: session.schoolId,
        provider: session.provider,
      },
      parentProfile,
      linkedStudents,
    });
  } catch (error: any) {
    console.error("[Parent Me API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load parent profile" },
      { status: 500 }
    );
  }
}
