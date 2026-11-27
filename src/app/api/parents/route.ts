import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const parents = await db.getParentsByStudentIdAsync(studentId);
      return NextResponse.json({ success: true, parents }, { headers: noCacheHeaders });
    }

    const parents = db.getParents();
    return NextResponse.json({ success: true, count: parents.length, parents }, { headers: noCacheHeaders });
  } catch (error) {
    console.error("GET /api/parents error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch parents" }, { status: 500, headers: noCacheHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: noCacheHeaders });
    }

    const body = await request.json();
    const { name, phone, email, studentId, relationship = "guardian" } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Parent full name is required" }, { status: 400, headers: noCacheHeaders });
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone ? String(phone).trim() : "";
    const trimmedEmail = email ? String(email).trim() : "";

    let parent = trimmedPhone ? db.getParentByPhone(trimmedPhone) : undefined;
    if (!parent) {
      parent = db.getParents().find((p) => p.name.toLowerCase() === trimmedName.toLowerCase());
    }

    if (parent) {
      if (studentId && (!parent.studentIds || !parent.studentIds.includes(studentId))) {
        await db.linkParentToStudentAsync(parent.id, studentId, relationship);
      }
      return NextResponse.json({ success: true, parent, alreadyExisted: true }, { headers: noCacheHeaders });
    }

    const genId = `par-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newParent = await db.createParentProfileAsync({
      id: genId,
      userId: `usr-${genId}`,
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      relationship,
      studentIds: studentId ? [studentId] : [],
      preferredLanguage: "gu",
    });

    return NextResponse.json({ success: true, parent: newParent }, { status: 201, headers: noCacheHeaders });
  } catch (error) {
    console.error("POST /api/parents error:", error);
    return NextResponse.json({ success: false, error: "Failed to create parent" }, { status: 500, headers: noCacheHeaders });
  }
}
