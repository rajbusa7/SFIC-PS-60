import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId") || undefined;
    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : undefined;
    const search = searchParams.get("search")?.toLowerCase();

    let students = db.getStudents(classroomId);

    if (grade) {
      students = students.filter((s) => s.grade === grade);
    }

    if (search) {
      students = students.filter(
        (s) =>
          s.displayName.toLowerCase().includes(search) ||
          s.studentCode.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error) {
    console.error("API /api/students error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentCode, displayName, classroomId, grade, section, enrollmentStatus, notes } = body;

    if (!displayName || !String(displayName).trim()) {
      return NextResponse.json(
        { success: false, error: "Student full name is required" },
        { status: 400 }
      );
    }

    if (!studentCode || !String(studentCode).trim()) {
      return NextResponse.json(
        { success: false, error: "Student unique code / ID is required" },
        { status: 400 }
      );
    }

    const numGrade = Number(grade);
    if (isNaN(numGrade) || numGrade < 1 || numGrade > 5) {
      return NextResponse.json(
        { success: false, error: "Grade must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (!section || !String(section).trim()) {
      return NextResponse.json(
        { success: false, error: "Section is required (e.g. 'A', 'B')" },
        { status: 400 }
      );
    }

    const cleanCode = String(studentCode).trim();
    const cleanSection = String(section).trim().toUpperCase();
    const finalClassroomId = classroomId || `cls-${numGrade}${cleanSection.toLowerCase()}`;

    // Check duplicate studentCode
    const existing = db.getStudentByCode(cleanCode);
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Student with ID '${cleanCode}' already exists.` },
        { status: 409 }
      );
    }

    const newStudent = db.addStudent({
      studentCode: cleanCode,
      displayName: String(displayName).trim(),
      classroomId: finalClassroomId,
      grade: numGrade,
      section: cleanSection,
      enrollmentStatus: enrollmentStatus || "active",
      notes: notes || "",
    });

    return NextResponse.json({ success: true, student: newStudent }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/students error:", error);
    const isConflict = error.message?.includes("already exists") || error.message?.includes("already in use");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add student" },
      { status: isConflict ? 409 : 500 }
    );
  }
}
