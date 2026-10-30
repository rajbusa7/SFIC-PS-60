import { NextResponse } from "next/server";
import { smsOtpService } from "@/lib/auth/smsOtpService";

/**
 * POST /api/auth/otp/send (and /api/v1/auth/otp/send)
 *
 * Requests real SMS OTP delivery to a verified mobile phone.
 * Enforces phone normalization (+91), role authorization checks, resend cooldowns (60s),
 * and carrier rate-limiting. Never exposes the generated OTP in response payloads.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, role } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Mobile number is required.",
          field: "phone",
        },
        { status: 400 }
      );
    }

    if (!role || (role !== "teacher" && role !== "parent" && role !== "admin")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing login role. Must be 'teacher' or 'parent'.",
          field: "role",
        },
        { status: 400 }
      );
    }

    const result = await smsOtpService.sendOtp(phone.trim(), role);

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
      maskedPhone: result.maskedPhone,
      cooldownSeconds: result.cooldownSeconds,
      provider: result.provider,
      message: result.message,
    });
  } catch (err: any) {
    const message = err.message || "Failed to deliver SMS verification code.";

    // Classify error responses for clear client feedback
    if (message.includes("not registered to an authorized teacher")) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: "TEACHER_NOT_REGISTERED",
        },
        { status: 404 }
      );
    }

    if (message.includes("wait") || message.includes("limit reached")) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    if (message.includes("SMS Gateway Not Configured")) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: "PROVIDER_NOT_CONFIGURED",
          providerConfigured: false,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}

