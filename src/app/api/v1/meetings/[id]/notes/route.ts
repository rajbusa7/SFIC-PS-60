import { NextResponse } from "next/server";
import { database } from "@/lib/db/database";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/meetings/[id]/notes
 * Teacher/Admin: can get all notes for students in this meeting.
 * Parent: can only get notes for their own linked child in this meeting.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin", "parent"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;

    if (auth.actor.role === "parent") {
      // Secure parent access: ensure student belongs to parent
      const parentNotes = await database.getMeetingNotesForParentAsync(auth.actor.id, id);
      return NextResponse.json({ success: true, count: parentNotes.length, notes: parentNotes });
    }

    // Teacher/Admin
    const notes = await database.getMeetingNotesAsync(id, studentId);
    return NextResponse.json({ success: true, count: notes.length, notes });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}

/**
 * POST /api/v1/meetings/[id]/notes
 * Only teacher (or admin) can create or update meeting notes and action items.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { studentId, notes, actionItems } = body;

    if (typeof notes !== "string") {
      return NextResponse.json(
        { success: false, error: "Notes content must be provided as a string." },
        { status: 400 }
      );
    }

    const saved = await database.saveMeetingNoteAsync({
      meetingId: id,
      studentId: studentId || null,
      notes: notes.trim(),
      actionItems: Array.isArray(actionItems) ? actionItems : [],
    });

    return NextResponse.json({ success: true, note: saved }, { status: 200 });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
