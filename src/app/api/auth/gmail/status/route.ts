import { NextResponse } from "next/server";
import { getGmailStatus } from "@/lib/gmail/gmailService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = getGmailStatus();
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error("[Gmail Status API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve Gmail status" },
      { status: 500 }
    );
  }
}

