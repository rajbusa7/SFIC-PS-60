import { NextResponse } from "next/server";
import { validateMeetingAccess } from "@/lib/ptm/ptmAuth";
import { db } from "@/lib/db/database";
import type { PtmMeetingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await validateMeetingAccess(request, id);

    if (!access.allowed || !access.meeting) {
      return NextResponse.json(
        { success: false, error: access.error || "Access denied to meeting." },
        { status: access.status }
      );
    }

    return NextResponse.json({
      success: true,
      meeting: access.meeting,
      currentUser: access.user,
    });
  } catch (err: any) {
    console.error("[PTM GET Meeting Details Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve meeting." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await validateMeetingAccess(request, id);

    if (!access.allowed || !access.meeting) {
      return NextResponse.json(
        { success: false, error: access.error || "Access denied to meeting." },
        { status: access.status }
      );
    }

    // Only teachers and admins can change meeting status
    if (access.user?.role !== "teacher" && access.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only teachers or administrators can update meeting status." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses: PtmMeetingStatus[] = [
      "scheduled",
      "waiting",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await db.updatePtmMeetingStatusAsync(access.meeting.id, status);

    return NextResponse.json({
      success: true,
      meeting: updated,
    });
  } catch (err: any) {
    console.error("[PTM PATCH Meeting Status Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update meeting status." },
      { status: 500 }
    );
  }
}
