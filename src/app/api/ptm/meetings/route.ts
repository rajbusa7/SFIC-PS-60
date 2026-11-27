import { NextResponse } from "next/server";
import { extractSessionToken, verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db/database";
import { generateMeetingCode, signPtmToken } from "@/lib/ptm/ptmAuth";
import { createPtmMeetingEmailTemplate } from "@/lib/gmail/emailTemplates";
import { sendCustomEmail } from "@/lib/auth/emailService";
import type { PtmDurationMinutes, PtmMeeting } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);
    const user = await verifySession(sessionToken);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view meetings." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "all";
    const statusParam = searchParams.get("status");

    let teacherIdFilter: string | undefined = undefined;
    let parentIdFilter: string | undefined = undefined;

    if (user.role === "teacher") {
      teacherIdFilter = user.id;
    } else if (user.role === "parent") {
      const parentProfile = await db.getParentByUserIdAsync(user.id);
      parentIdFilter = parentProfile?.id || user.id;
    }

    const allMeetings = await db.getPtmMeetingsAsync({
      teacherId: teacherIdFilter,
      parentId: parentIdFilter,
      status: (statusParam as any) || undefined,
    });

    const stats = await db.getPtmMeetingStatsAsync(teacherIdFilter, parentIdFilter);
    const todayStr = new Date().toISOString().split("T")[0];

    let filtered = allMeetings;
    if (tab === "today") {
      filtered = allMeetings.filter(
        (m) => m.scheduledDate === todayStr && m.status !== "cancelled" && m.status !== "completed"
      );
    } else if (tab === "upcoming") {
      filtered = allMeetings.filter(
        (m) =>
          (m.scheduledDate > todayStr ||
            (m.scheduledDate === todayStr && (m.status === "scheduled" || m.status === "waiting" || m.status === "in_progress"))) &&
          m.status !== "cancelled" &&
          m.status !== "completed"
      );
    } else if (tab === "past") {
      filtered = allMeetings.filter(
        (m) => m.status === "completed" || m.status === "cancelled" || m.status === "no_show" || m.scheduledDate < todayStr
      );
    }

    return NextResponse.json({
      success: true,
      meetings: filtered,
      stats,
      today: todayStr,
      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("[PTM GET Meetings Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve meetings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);
    const user = await verifySession(sessionToken);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to schedule meetings." },
        { status: 401 }
      );
    }

    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only authorized teachers or administrators can schedule meetings." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      parentId,
      title,
      scheduledDate,
      startTime,
      durationMinutes,
      agenda,
      teacherNotes,
    } = body;

    // 1. Validation
    if (!studentId || !parentId || !title || !scheduledDate || !startTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (student, parent, title, date, start time)." },
        { status: 400 }
      );
    }

    const validDurations: PtmDurationMinutes[] = [15, 30, 45, 60];
    const duration = validDurations.includes(Number(durationMinutes) as any)
      ? (Number(durationMinutes) as PtmDurationMinutes)
      : 30;

    // Verify student exists
    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Selected student record does not exist." }, { status: 404 });
    }

    // Verify parent exists
    const parent = await db.getParentByIdAsync(parentId);
    if (!parent) {
      return NextResponse.json({ success: false, error: "Selected parent record does not exist." }, { status: 404 });
    }

    // Verify parent-student association
    const isAssociated = parent.studentIds && parent.studentIds.includes(studentId);
    if (!isAssociated && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Parent is not associated with this student." },
        { status: 400 }
      );
    }

    // Check teacher authorized scope if teacher
    if (user.role === "teacher") {
      const assignments = await db.getTeacherAssignmentsAsync(user.id);
      const assignedClassIds = Array.from(new Set(assignments.flatMap((a) => a.classroomIds || [])));
      if (assignedClassIds.length > 0 && !assignedClassIds.includes(student.classroomId)) {
        return NextResponse.json(
          { success: false, error: "You are not authorized to schedule meetings for students outside your class." },
          { status: 403 }
        );
      }
    }

    // Check for duplicate time conflicts for the teacher
    const existing = await db.getPtmMeetingsAsync({
      teacherId: user.id,
      date: scheduledDate,
    });

    const hasConflict = existing.some(
      (m) =>
        m.status !== "cancelled" &&
        m.status !== "completed" &&
        m.startTime === startTime
    );

    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: `You already have a meeting scheduled on ${scheduledDate} at ${startTime}.` },
        { status: 409 }
      );
    }

    // 2. Create Meeting
    const meetingId = `ptm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const meetingCode = generateMeetingCode();

    const meeting: PtmMeeting = {
      id: meetingId,
      meetingCode,
      title: title.trim(),
      description: agenda ? agenda.trim() : undefined,
      agenda: agenda ? agenda.trim() : undefined,
      teacherNotes: teacherNotes ? teacherNotes.trim() : undefined,
      teacherId: user.id,
      teacherName: user.name,
      studentId: student.id,
      studentName: student.displayName,
      parentId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email || undefined,
      parentPhone: parent.phone || undefined,
      scheduledDate,
      startTime,
      durationMinutes: duration,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.createPtmMeetingAsync(meeting);

    // 3. Generate Parent Secure Join URL
    const appUrl = process.env.APP_URL || "https://shikshasetu-ai-iota.vercel.app";
    const joinToken = await signPtmToken({
      meetingId: saved.id,
      meetingCode: saved.meetingCode,
      userId: parent.id,
      userName: parent.name,
      role: "parent",
      canAdmit: false,
      canShareScreen: true,
    });

    const joinUrl = `${appUrl}/ptm/room/${saved.meetingCode}/lobby?token=${joinToken}`;

    // 4. Dispatch Email Invitation to Parent (Parent Bridge Integration)
    if (parent.email && parent.email.includes("@")) {
      const emailHtml = createPtmMeetingEmailTemplate({
        teacherName: user.name,
        studentName: student.displayName,
        parentName: parent.name,
        meetingTitle: saved.title,
        meetingDate: saved.scheduledDate,
        meetingTime: saved.startTime,
        durationMinutes: saved.durationMinutes,
        agenda: saved.agenda,
        joinUrl,
        meetingCode: saved.meetingCode,
      });

      sendCustomEmail({
        to: parent.email,
        subject: `StudySaathi AI: Parent-Teacher Meeting Invitation for ${student.displayName}`,
        html: emailHtml,
      }).catch((emailErr) => {
        console.warn("[PTM Email Delivery Non-blocking Note]:", emailErr);
      });
    }

    return NextResponse.json({
      success: true,
      meeting: saved,
      joinUrl,
      invitationSentTo: parent.email || null,
    });
  } catch (err: any) {
    console.error("[PTM POST Meeting Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to schedule meeting." },
      { status: 500 }
    );
  }
}
