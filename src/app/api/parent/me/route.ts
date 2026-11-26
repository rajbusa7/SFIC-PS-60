import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

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

    return NextResponse.json(
      {
        success: true,
        user: {
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          schoolId: session.schoolId,
          provider: session.provider,
          preferredLanguage: parentProfile?.preferredLanguage || "en",
          preferredScript: parentProfile?.preferredScript || undefined,
        },
        parentProfile,
        linkedStudents,
      },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error("[Parent Me API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load parent profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expired or invalid." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, preferredLanguage, preferredScript } = body;

    // Persist to user record
    await db.updateUserAsync(session.id, {
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
    });

    // Persist to parent profile record
    let parentProfile = await db.getParentByUserIdAsync(session.id);
    if (parentProfile) {
      parentProfile = await db.createParentProfileAsync({
        ...parentProfile,
        userId: parentProfile.userId || session.id,
        name: name || parentProfile.name,
        phone: phone !== undefined ? phone : parentProfile.phone,
        preferredLanguage: preferredLanguage || parentProfile.preferredLanguage,
      });
    } else {
      parentProfile = await db.createParentProfileAsync({
        userId: session.id,
        name: name || session.name,
        email: session.email,
        phone: phone || "",
        preferredLanguage: preferredLanguage || "gu",
        relationship: "guardian",
        studentIds: [],
      });
    }

    if (preferredLanguage || preferredScript) {
      await db.updateParentPreferencesAsync(session.id, {
        ...(preferredLanguage ? { preferredLanguage: preferredLanguage as any } : {}),
        ...(preferredScript ? { preferredScript: preferredScript as any } : {}),
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.id,
        name: name || session.name,
        email: session.email,
        role: session.role,
        preferredLanguage: preferredLanguage || parentProfile.preferredLanguage,
        phone,
      },
      parentProfile,
    });
  } catch (error: any) {
    console.error("[Parent Me PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update parent settings" },
      { status: 500 }
    );
  }
}
