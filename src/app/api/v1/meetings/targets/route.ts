import { NextResponse } from "next/server";
import { ptmService } from "@backend/services/ptmService";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireNextActor(request, ["teacher", "admin"]);
  if ("response" in auth) return auth.response;

  try {
    const targets = await ptmService.getScheduleTargets(auth.actor);
    return NextResponse.json({ success: true, ...targets });
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
