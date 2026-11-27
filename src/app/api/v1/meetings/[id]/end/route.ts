import { NextResponse } from "next/server";
import { livekitService } from "@/lib/video/livekitService";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const meeting = await livekitService.endMeeting(auth.actor, id);
    return NextResponse.json({ success: true, meeting });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
