import { NextResponse } from "next/server";
import { emailOtpService } from "@/lib/auth/emailOtpService";
import { getClientIp } from "@/lib/auth/rateLimiter";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const { tempToken } = body;

    if (!tempToken || typeof tempToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Temporary verification token is required." },
        { status: 400 }
      );
    }

    const resendResult = await emailOtpService.resendLoginOtp(tempToken, ip);

    return NextResponse.json({
      success: true,
      tempToken: resendResult.tempToken,
      maskedEmail: resendResult.maskedEmail,
      cooldownSeconds: resendResult.cooldownSeconds,
      expiresInSeconds: resendResult.expiresInSeconds,
      message: resendResult.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to resend verification code.",
      },
      { status: 400 }
    );
  }
}
