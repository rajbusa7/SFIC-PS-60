import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const roleHeader = request.headers.get("x-user-role");
    const roleParam = searchParams.get("role");
    const isStudent = roleHeader === "student" || roleParam === "student";

    const activity = db.getActivityById(id, isStudent);
    if (!activity) {
      return NextResponse.json(
        { success: false, error: `Activity with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch activity" },
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

    const updated = db.updateActivity(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Activity with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, activity: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update activity" },
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
    const deleted = db.deleteActivity(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Activity with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Activity deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete activity" },
      { status: 500 }
    );
  }
}
