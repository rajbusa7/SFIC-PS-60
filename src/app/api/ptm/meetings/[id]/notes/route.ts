import { NextResponse } from "next/server";
import { validateMeetingAccess } from "@/lib/ptm/ptmAuth";
import { db } from "@/lib/db/database";
import type { PtmMeetingNote } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
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

    const allNotes = await db.getPtmMeetingNotesAsync(access.meeting.id);

    // If parent, only return notes explicitly shared
    let filteredNotes = allNotes;
    if (access.user.role === "parent") {
      filteredNotes = allNotes.filter((n) => n.sharedWithParent === true);
    }

    return NextResponse.json({
      success: true,
      notes: filteredNotes,
      canEdit: access.user.role === "teacher" || access.user.role === "admin",
    });
  } catch (err: any) {
    console.error("[PTM GET Notes Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve meeting notes." },
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

    if (access.user.role !== "teacher" && access.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only teachers or administrators can record meeting notes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      discussionSummary,
      learningConcerns,
      studentStrengths,
      agreedActions,
      followUpDate,
      sharedWithParent,
    } = body;

    if (!discussionSummary || !discussionSummary.trim()) {
      return NextResponse.json(
        { success: false, error: "Discussion summary is required." },
        { status: 400 }
      );
    }

    const noteId = `note-${access.meeting.id}-${Date.now()}`;
    const note: PtmMeetingNote = {
      id: noteId,
      meetingId: access.meeting.id,
      studentId: access.meeting.studentId,
      teacherId: access.user.id,
      discussionSummary: discussionSummary.trim(),
      learningConcerns: learningConcerns ? learningConcerns.trim() : "",
      studentStrengths: studentStrengths ? studentStrengths.trim() : "",
      agreedActions: agreedActions ? agreedActions.trim() : "",
      followUpDate: followUpDate || undefined,
      sharedWithParent: Boolean(sharedWithParent),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.savePtmMeetingNoteAsync(note);

    return NextResponse.json({
      success: true,
      note: saved,
    });
  } catch (err: any) {
    console.error("[PTM POST Notes Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save meeting notes." },
      { status: 500 }
    );
  }
}
