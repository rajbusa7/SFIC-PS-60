import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await db.getStudentByIdAsync(id);

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    const results = db.getResults(id);
    const gaps = db.getLearningGaps(id);
    const remedialPlans = db.getRemedialPlans(id);
    const attempts = db.getAttempts(id);

    return NextResponse.json(
      {
        success: true,
        student,
        results,
        gaps,
        remedialPlans,
        attempts,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API GET /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // Check duplicate roll code if changed
    if (updates.studentCode) {
      const all = await db.getStudentsAsync();
      const duplicate = all.find(
        (s) =>
          s.id !== id &&
          s.studentCode.trim().toLowerCase() === String(updates.studentCode).trim().toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: `Student code '${updates.studentCode}' is already in use by ${duplicate.displayName}.`,
          },
          { status: 409, headers: noCacheHeaders }
        );
      }
    }

    if (updates.grade !== undefined || updates.section !== undefined) {
      const existing = await db.getStudentByIdAsync(id);
      if (existing) {
        const g = updates.grade !== undefined ? Number(updates.grade) : existing.grade;
        const s = updates.section !== undefined ? String(updates.section).trim().toUpperCase() : existing.section;
        updates.classroomId = `cls-${g}${s.toLowerCase()}`;
      }
    }

    const updated = await db.updateStudentAsync(id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      { success: true, student: updated },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API PUT /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db.deleteStudentAsync(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Student removed successfully" },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API DELETE /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
