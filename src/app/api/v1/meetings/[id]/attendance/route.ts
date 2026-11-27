import { NextResponse } from "next/server";
import { database } from "@/lib/db/database";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const attendance = await database.getMeetingAttendanceAsync(id);
    return NextResponse.json({ success: true, count: attendance.length, attendance });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin", "parent"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { action, parentId: propParentId } = body;

    const parentId = propParentId || auth.actor.id;

    if (action === "leave") {
      const record = await database.recordMeetingAttendanceLeaveAsync(id, parentId);
      return NextResponse.json({ success: true, action: "leave", record });
    }

    // Default: join
    const record = await database.recordMeetingAttendanceJoinAsync(id, parentId);
    return NextResponse.json({ success: true, action: "join", record }, { status: 201 });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
