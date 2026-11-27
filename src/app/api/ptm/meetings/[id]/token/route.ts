import { NextResponse } from "next/server";
import { validateMeetingAccess, signPtmToken } from "@/lib/ptm/ptmAuth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await validateMeetingAccess(request, id);

    if (!access.allowed || !access.meeting || !access.user) {
      return NextResponse.json(
        { success: false, error: access.error || "Unauthorized to generate join token." },
        { status: access.status }
      );
    }

    const meeting = access.meeting;
    const user = access.user;

    const token = await signPtmToken({
      meetingId: meeting.id,
      meetingCode: meeting.meetingCode,
      userId: user.id,
      userName: user.name,
      role: user.role,
      canAdmit: user.role === "teacher" || user.role === "admin",
      canShareScreen: true,
    });

    return NextResponse.json({
      success: true,
      token,
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        teacherName: meeting.teacherName,
        studentName: meeting.studentName,
        parentName: meeting.parentName,
        scheduledDate: meeting.scheduledDate,
        startTime: meeting.startTime,
        durationMinutes: meeting.durationMinutes,
        status: meeting.status,
      },
      participant: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("[PTM POST Token Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate meeting token." },
      { status: 500 }
    );
  }
}
