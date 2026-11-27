import { NextResponse } from "next/server";
import { ptmService } from "@backend/services/ptmService";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin", "parent"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const meeting = await ptmService.getMeetingDetails(auth.actor, id);
    return NextResponse.json({ success: true, meeting });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const meeting = await ptmService.updateOrRescheduleMeeting(auth.actor, id, body);
    return NextResponse.json({ success: true, meeting });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}

export async function DELETE(
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
