import { NextResponse } from "next/server";
import { validateMeetingAccess } from "@/lib/ptm/ptmAuth";
import { db } from "@/lib/db/database";

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
        { success: false, error: access.error || "Access denied." },
        { status: access.status }
      );
    }

    // Only teachers and admins can view the waiting list
    if (access.user?.role !== "teacher" && access.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only teachers or administrators can inspect the waiting room." },
        { status: 403 }
      );
    }

    const waitingList = await db.getPtmWaitingParticipantsAsync(access.meeting.id);

    return NextResponse.json({
      success: true,
      waiting: waitingList,
    });
  } catch (err: any) {
    console.error("[PTM GET Waiting Room Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to inspect waiting room." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await validateMeetingAccess(request, id);

    if (!access.allowed || !access.meeting || !access.user) {
      return NextResponse.json(
        { success: false, error: access.error || "Access denied." },
        { status: access.status }
      );
    }

    const body = await request.json();
    const { action, participantId, status } = body;

    // 1. Parent requests entry
    if (action === "request_join") {
      const waiting = await db.addPtmWaitingParticipantAsync(access.meeting.id, {
        participantId: access.user.id,
        participantName: access.user.name,
        participantRole: access.user.role,
      });

      // Update meeting status to "waiting" if currently "scheduled"
      if (access.meeting.status === "scheduled") {
        await db.updatePtmMeetingStatusAsync(access.meeting.id, "waiting");
      }

      return NextResponse.json({
        success: true,
        entry: waiting,
      });
    }

    // 2. Parent checks their admission status
    if (action === "check_status") {
      const storeList = await db.getPtmWaitingParticipantsAsync(access.meeting.id);
      const isWaiting = storeList.some((p) => p.participantId === access.user!.id && p.status === "waiting");

      // If no longer in waiting list, check if admitted
      return NextResponse.json({
        success: true,
        status: isWaiting ? "waiting" : "admitted",
        meetingStatus: access.meeting.status,
      });
    }

    // 3. Teacher admits or rejects participant
    if (action === "admit" || action === "reject") {
      if (access.user.role !== "teacher" && access.user.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Only teachers or administrators can admit participants." },
          { status: 403 }
        );
      }

      if (!participantId) {
        return NextResponse.json({ success: false, error: "Missing participantId." }, { status: 400 });
      }

      const updated = await db.updatePtmWaitingStatusAsync(
        access.meeting.id,
        participantId,
        action === "admit" ? "admitted" : "rejected"
      );

      // If admitted and meeting is still scheduled/waiting, transition meeting to in_progress
      if (action === "admit") {
        await db.updatePtmMeetingStatusAsync(access.meeting.id, "in_progress");
      }

      return NextResponse.json({
        success: true,
        updated,
        action,
        participantId,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("[PTM POST Waiting Room Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update waiting room." },
      { status: 500 }
    );
  }
}
