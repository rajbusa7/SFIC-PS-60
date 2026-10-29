import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const worksheet = db.getWorksheetById(id);

    if (!worksheet) {
      return NextResponse.json(
        { success: false, error: `Worksheet with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, worksheet });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch worksheet" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = db.updateWorksheet(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Worksheet with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, worksheet: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update worksheet" },
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
    const deleted = db.deleteWorksheet(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Worksheet with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Worksheet deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete worksheet" },
      { status: 500 }
    );
  }
}
