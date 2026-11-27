import { NextResponse } from "next/server";
import { validateMeetingAccess } from "@/lib/ptm/ptmAuth";

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

    const meeting = access.meeting;
    const user = access.user;

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        agenda: meeting.agenda,
        teacherName: meeting.teacherName,
        studentName: meeting.studentName,
        parentName: meeting.parentName,
        scheduledDate: meeting.scheduledDate,
        startTime: meeting.startTime,
        durationMinutes: meeting.durationMinutes,
        status: meeting.status,
      },
      participant: user
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
          }
        : null,
    });
  } catch (err: any) {
    console.error("[PTM GET Lobby Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load lobby info." },
      { status: 500 }
    );
  }
}
