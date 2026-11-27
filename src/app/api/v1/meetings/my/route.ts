import { NextResponse } from "next/server";
import { ptmService } from "@backend/services/ptmService";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireNextActor(request, ["parent"]);
  if ("response" in auth) return auth.response;

  try {
    const invites = await ptmService.listParentMeetings(auth.actor);
    return NextResponse.json({ success: true, count: invites.length, invites });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
