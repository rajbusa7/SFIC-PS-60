import { NextResponse } from "next/server";
import { improvementService } from "@backend/services/improvementService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = request.headers.get("x-user-role") as any;
    const parentStudentId = request.headers.get("x-student-id") || undefined;

    const improvements = await improvementService.getImprovements(
      { studentId: id },
      { role: userRole, studentId: parentStudentId }
    );

    return NextResponse.json({
      success: true,
      count: improvements.length,
      improvements,
    });
  } catch (error: any) {
    const statusCode = error.message?.includes("Unauthorized") ? 403 : error.message?.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status: statusCode });
  }
}
