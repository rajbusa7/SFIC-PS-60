import { NextResponse } from "next/server";
import { ptmService } from "@backend/services/ptmService";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const meeting = await ptmService.cancelMeeting(auth.actor, id);
    return NextResponse.json({ success: true, meeting });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
