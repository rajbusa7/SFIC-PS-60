import { onAssignmentChange, type AssignmentChangeEvent } from "@/lib/realtime/assignmentBroadcaster";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Authorize connection: allow authenticated admin or teacher
  const token = await extractSessionToken(request);
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Handshake event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "CONNECTED",
            user: { id: session.id, role: session.role },
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );

      // Listen for real-time changes
      const unsubscribe = onAssignmentChange((event: AssignmentChangeEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keep-alive heartbeat every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

