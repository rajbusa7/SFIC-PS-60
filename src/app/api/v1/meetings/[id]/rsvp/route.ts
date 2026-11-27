import { NextResponse } from "next/server";
import { ptmService } from "@backend/services/ptmService";
import { validateMeetingRsvp } from "@shared/schemas/validation";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["parent"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validation = validateMeetingRsvp(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
          error: validation.errors[0]?.message || "Invalid RSVP payload",
        },
        { status: 400 }
      );
    }

    const invite = await ptmService.respondToInvite(auth.actor, id, validation.data!);
    return NextResponse.json({ success: true, invite });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
