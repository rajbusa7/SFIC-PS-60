import { NextResponse } from "next/server";
import { studentService } from "@backend/services/studentService";
import { validateCreateStudent } from "@shared/schemas/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId") || undefined;
    const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : undefined;
    const search = searchParams.get("search") || undefined;

    const students = await studentService.getStudents({ classroomId, grade, search });
    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateCreateStudent(body);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const newStudent = await studentService.createStudent({
      ...validation.data!,
      enrollmentStatus: validation.data!.enrollmentStatus || "active",
    });
    return NextResponse.json({ success: true, student: newStudent }, { status: 201 });
  } catch (error: any) {
    const isConflict = error.message?.includes("already exists") || error.message?.includes("already in use");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add student" },
      { status: isConflict ? 409 : 500 }
    );
  }
}
