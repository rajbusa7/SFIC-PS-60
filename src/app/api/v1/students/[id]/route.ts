import { NextResponse } from "next/server";
import { studentService } from "@backend/services/studentService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await studentService.getStudentById(id);
    if (!student) {
      return NextResponse.json({ success: false, error: `Student with id '${id}' not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await studentService.updateStudent(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: `Student with id '${id}' not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    const isConflict = error.message?.includes("already in use") || error.message?.includes("already exists");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update student" },
      { status: isConflict ? 409 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await studentService.deleteStudent(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: `Student with id '${id}' not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Student '${id}' deleted successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete student" }, { status: 500 });
  }
}
