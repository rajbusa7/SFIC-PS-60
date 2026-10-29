import { NextResponse } from "next/server";
import { isGoogleAuthConfigured } from "@/lib/auth/google";
import { getActiveSmsProvider } from "@/lib/auth/smsOtpService";

export async function GET() {
  const isConfigured = isGoogleAuthConfigured();
  const smsProvider = getActiveSmsProvider();

  return NextResponse.json({
    success: true,
    googleConfigured: isConfigured,
    clientId: isConfigured ? process.env.GOOGLE_CLIENT_ID : null,
    smsProviderConfigured: smsProvider.isConfigured,
    smsProviderName: smsProvider.name,
    smsProviderType: smsProvider.type,
  });
}
