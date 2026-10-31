import { NextResponse } from "next/server";
import { emailOtpService } from "@/lib/auth/emailOtpService";
import { smsOtpService } from "@/lib/auth/smsOtpService";

/**
 * POST /api/auth/otp/send (and /api/v1/auth/otp/send)
 *
 * Requests cryptographically secure OTP delivery to a user's email address (or mobile phone).
 * Enforces email validation, role authorization checks, resend cooldowns (60s),
 * and rate-limiting. Never exposes the generated OTP in response payloads.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone, role, purpose } = body;

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

    // 1. Primary Email OTP path
    if (email && typeof email === "string" && email.trim()) {
      const result = await emailOtpService.sendOtp(
        email.trim(),
        role,
        purpose || "login"
      );

      return NextResponse.json({
        success: true,
        verificationId: result.verificationId,
        maskedEmail: result.maskedEmail,
        maskedPhone: result.maskedEmail, // Backwards-compatibility with UI components expecting maskedPhone
        cooldownSeconds: result.cooldownSeconds,
        provider: result.provider,
        message: result.message,
      });
    }

    // 2. Legacy Phone OTP fallback (if phone provided without email)
    if (phone && typeof phone === "string" && phone.trim()) {
      const result = await smsOtpService.sendOtp(phone.trim(), role);

      return NextResponse.json({
        success: true,
        verificationId: result.verificationId,
        maskedPhone: result.maskedPhone,
        cooldownSeconds: result.cooldownSeconds,
        provider: result.provider,
        message: result.message,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Email address is required to deliver a verification code.",
        field: "email",
      },
      { status: 400 }
    );
  } catch (err: any) {
    const message = err.message || "Failed to deliver verification code.";

    // Classify error responses for clear client feedback
    if (
      message.includes("not registered as an authorized school teacher") ||
      message.includes("not registered to an authorized teacher") ||
      message.includes("not registered as a Parent account")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: "ACCOUNT_NOT_REGISTERED",
        },
        { status: 404 }
      );
    }

    if (
      message.includes("wait") ||
      message.includes("limit reached") ||
      message.includes("Hourly verification limit")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    if (
      message.includes("Gateway Not Configured") ||
      message.includes("gateway is not configured")
    ) {
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
