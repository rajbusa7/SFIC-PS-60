import { NextResponse } from "next/server";
import { livekitService } from "@/lib/video/livekitService";
import { requireNextActor, ptmErrorResponse } from "@/lib/auth/ptmRequestActor";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireNextActor(request, ["teacher", "admin", "parent"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { audioOnly, participantName } = body;

    const tokenRes = await livekitService.generateToken(auth.actor, id, {
      audioOnly: Boolean(audioOnly),
      participantName: participantName || auth.actor.name,
    });

    return NextResponse.json(tokenRes);
  } catch (err: any) {
    return ptmErrorResponse(err);
  }
}
