import { NextResponse } from "next/server";
import { validateMeetingAccess } from "@/lib/ptm/ptmAuth";
import type { PtmSignalPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

interface StoredSignal extends PtmSignalPayload {
  id: string;
  timestamp: number;
}

// In-memory signaling cache per meeting room (kept for 60 seconds)
const signalCache = new Map<string, StoredSignal[]>();

function cleanOldSignals(meetingId: string) {
  const cutoff = Date.now() - 60 * 1000;
  const list = signalCache.get(meetingId);
  if (list) {
    const fresh = list.filter((s) => s.timestamp > cutoff);
    signalCache.set(meetingId, fresh);
  }
}

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

    const { searchParams } = new URL(request.url);
    const since = Number(searchParams.get("since") || 0);
    const currentUserId = access.user.id;

    cleanOldSignals(access.meeting.id);
    const list = signalCache.get(access.meeting.id) || [];

    // Filter signals: either targeted to current user, or broadcast, but NOT sent by current user
    const relevant = list.filter((s) => {
      if (s.timestamp <= since) return false;
      if (s.senderId === currentUserId) return false;
      if (s.targetId && s.targetId !== currentUserId) return false;
      return true;
    });

    return NextResponse.json({
      success: true,
      signals: relevant,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("[PTM GET Signal Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Signaling read error." },
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

    const body = await request.json();
    const { type, data, targetId } = body;

    if (!type) {
      return NextResponse.json({ success: false, error: "Missing signal type." }, { status: 400 });
    }

    cleanOldSignals(access.meeting.id);

    const signalItem: StoredSignal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      meetingId: access.meeting.id,
      senderId: access.user.id,
      targetId: targetId || undefined,
      type,
      data,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    };

    let list = signalCache.get(access.meeting.id);
    if (!list) {
      list = [];
      signalCache.set(access.meeting.id, list);
    }
    list.push(signalItem);

    return NextResponse.json({
      success: true,
      signalId: signalItem.id,
      timestamp: signalItem.timestamp,
    });
  } catch (err: any) {
    console.error("[PTM POST Signal Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Signaling dispatch error." },
      { status: 500 }
    );
  }
}
