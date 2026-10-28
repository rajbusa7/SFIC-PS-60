import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/auth/google";

export async function GET() {
  const isConfigured = isGoogleAuthConfigured();
  return NextResponse.json({
    success: true,
    googleConfigured: isConfigured,
    clientId: isConfigured ? process.env.GOOGLE_CLIENT_ID : null,
  });
}
