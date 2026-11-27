import { NextResponse } from "next/server";
import { verifyMeetingJoinToken } from "@/lib/auth/signedMeetingToken";
import { database } from "@/lib/db/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token parameter." }, { status: 400 });
    }

    const verification = verifyMeetingJoinToken(token);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Invalid or expired meeting join link.",
        },
        { status: 401 }
      );
    }

    const { meetingId, parentId, studentId, inviteId } = verification.payload;
    const meeting = await database.getMeetingByIdAsync(meetingId);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found or deleted." }, { status: 404 });
    }

    const parent = await database.getParentByIdAsync(parentId);
    const student = studentId ? await database.getStudentByIdAsync(studentId) : null;

    return NextResponse.json({
      success: true,
      valid: true,
      payload: verification.payload,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        type: meeting.type,
        status: meeting.status,
        startTime: meeting.startTime,
        durationMin: meeting.durationMin,
        roomId: meeting.roomId,
        teacherName: meeting.teacherName,
      },
      parent: parent
        ? {
            id: parent.id,
            name: parent.name,
            phone: parent.phone,
            preferredLanguage: parent.preferredLanguage,
          }
        : null,
      student: student
        ? {
            id: student.id,
            displayName: student.displayName,
            grade: student.grade,
            section: student.section,
          }
        : null,
      redirectUrl: `/parent/meetings?meetingId=${meeting.id}&openRoom=true`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
