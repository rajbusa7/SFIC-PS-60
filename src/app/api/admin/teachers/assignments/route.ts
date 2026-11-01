import { NextResponse } from "next/server";
import { authorizeAdminOnly } from "@/lib/auth/authorization";
import { db } from "@/lib/db/database";
import type { SubjectCode } from "@shared/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId") || undefined;

  const assignments = db.getTeacherAssignments(teacherId);
  return NextResponse.json({ success: true, assignments });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { teacherId, subjectCode, classroomIds, grades } = body;

    if (!teacherId || typeof teacherId !== "string") {
      return NextResponse.json({ success: false, error: "Teacher ID is required." }, { status: 400 });
    }

    if (!subjectCode || typeof subjectCode !== "string") {
      return NextResponse.json({ success: false, error: "Subject code is required." }, { status: 400 });
    }

    const teacher = db.getUserById(teacherId);
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found." }, { status: 404 });
    }

    if (teacher.role !== "teacher") {
      return NextResponse.json({ success: false, error: "User is not a teacher account." }, { status: 400 });
    }

    const normalizedSubject = subjectCode.toUpperCase() as SubjectCode;
    const assigned = db.setTeacherAssignment({
      teacherId,
      subjectCode: normalizedSubject,
      classroomIds: Array.isArray(classroomIds) ? classroomIds : [],
      grades: Array.isArray(grades) ? grades.map(Number).filter((g) => g >= 1 && g <= 5) : [],
    });

    return NextResponse.json({ success: true, assignment: assigned }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create assignment." }, { status: 500 });
  }
}

