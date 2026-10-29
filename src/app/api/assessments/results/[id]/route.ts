import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = db.updateResult(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Assessment result with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, result: updated });
  } catch (error: any) {
    console.error("API PUT /api/assessments/results/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update result" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = db.deleteResult(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Assessment result with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Assessment result deleted successfully" });
  } catch (error: any) {
    console.error("API DELETE /api/assessments/results/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Delete failed" }, { status: 500 });
  }
}
