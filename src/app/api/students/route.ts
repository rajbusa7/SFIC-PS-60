import { NextResponse } from "next/server";
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
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId") || undefined;
    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : undefined;
    const search = searchParams.get("search") || undefined;

    const students = await db.getStudentsAsync({ classroomId, grade, search });
    return NextResponse.json(
      { success: true, count: students.length, students },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API /api/students error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch students" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const { studentCode, displayName, classroomId, grade, section, enrollmentStatus, notes } = body;

    const trimmedName = typeof displayName === "string" ? displayName.trim() : "";
    const trimmedCode = typeof studentCode === "string" ? studentCode.trim() : "";
    const parsedGrade = Number(grade);
    const sec = typeof section === "string" && section.trim() ? section.trim().toUpperCase() : "A";

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Student full name is required (minimum 2 characters)" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!trimmedCode || trimmedCode.length < 2) {
      return NextResponse.json(
        { success: false, error: "Student code / roll number is required (minimum 2 characters)" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (isNaN(parsedGrade) || parsedGrade < 1 || parsedGrade > 5) {
      return NextResponse.json(
        { success: false, error: "Grade must be an integer between 1 and 5 (Primary School)" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!["A", "B", "C"].includes(sec)) {
      return NextResponse.json(
        { success: false, error: "Section must be A, B, or C" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const clsId = classroomId || `cls-${parsedGrade}${sec.toLowerCase()}`;

    // Duplicate check on roll / student code
    const existingStudents = await db.getStudentsAsync();
    const isDuplicate = existingStudents.some(
      (s) => s.studentCode.trim().toLowerCase() === trimmedCode.toLowerCase()
    );
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: `Student with code '${trimmedCode}' already exists.` },
        { status: 409, headers: noCacheHeaders }
      );
    }

    const newStudent = await db.addStudentAsync({
      studentCode: trimmedCode,
      displayName: trimmedName,
      classroomId: clsId,
      grade: parsedGrade,
      section: sec,
      enrollmentStatus: enrollmentStatus || "active",
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    return NextResponse.json(
      { success: true, student: newStudent },
      { status: 201, headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API POST /api/students error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add student to database" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
