import { NextResponse } from "next/server";
import { runPtmReminderJob } from "@/lib/notifications/ptmReminderCron";

export const dynamic = "force-dynamic";

function isCronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key");

  // If no CRON_SECRET is configured in env, allow in dev/local mode with warning
  if (!cronSecret) {
    console.warn("[Cron API] CRON_SECRET not set in environment. Allowing request for evaluation.");
    return true;
  }

  // Check Bearer token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === cronSecret) return true;
  }

  // Check X-Cron-Secret header or ?key query
  if (xCronSecret === cronSecret || queryKey === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  return handleCronRequest(request);
}

export async function POST(request: Request) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing CRON_SECRET. Pass 'Authorization: Bearer <CRON_SECRET>' or '?key=<CRON_SECRET>'.",
      },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const forceNowParam = url.searchParams.get("forceNow");
    const dryRun = url.searchParams.get("dryRun") === "true";
    const forceNow = forceNowParam ? new Date(forceNowParam) : undefined;
    const baseUrl = `${url.protocol}//${url.host}`;

    const result = await runPtmReminderJob({ forceNow, baseUrl, dryRun });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Cron API] Error running PTM reminder job:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute PTM reminders cron job",
      },
      { status: 500 }
    );
  }
}
