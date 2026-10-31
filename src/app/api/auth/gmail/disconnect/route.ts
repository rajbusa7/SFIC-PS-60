import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/gmail/gmailService";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);
    if (sessionToken) {
      const session = await verifySession(sessionToken);
      if (session && session.role !== "teacher" && session.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Only teachers or administrators can disconnect school Gmail." },
          { status: 403 }
        );
      }
    }

    const disconnected = disconnectGmail();
    return NextResponse.json({
      success: true,
      message: disconnected
        ? "Gmail connection successfully removed."
        : "No active Gmail connection found to disconnect.",
    });
  } catch (error: any) {
    console.error("[Gmail Disconnect API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect Gmail" },
      { status: 500 }
    );
  }
}

