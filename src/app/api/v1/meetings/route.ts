import { NextResponse } from "next/server";
import { ptmService } from "@backend/services/ptmService";
import { validateCreateMeeting } from "@shared/schemas/validation";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";
import type { MeetingStatus } from "@shared/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || undefined) as MeetingStatus | undefined;
    const classId = searchParams.get("classId") || undefined;

    const meetings = await ptmService.listTeacherMeetings(auth.actor, { status, classId });
    return NextResponse.json({ success: true, count: meetings.length, meetings });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const validation = validateCreateMeeting(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
          error: validation.errors[0]?.message || "Invalid meeting payload",
        },
        { status: 400 }
      );
    }

    const meeting = await ptmService.createMeeting(auth.actor, validation.data!);
    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
