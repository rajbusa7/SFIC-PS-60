import { NextResponse } from "next/server";
import { smsOtpService } from "@/lib/auth/smsOtpService";
import { signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session";

/**
 * POST /api/auth/otp/verify (and /api/v1/auth/otp/verify)
 *
 * Verifies the mobile SMS OTP code through the configured authentication provider.
 * Rejects expired, invalid, or replayed OTP attempts.
 * Establishes an authenticated HMAC-SHA256 session with HTTP-only cookies on success.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, otp, role, verificationId } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "Mobile number is required." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { success: false, error: "Verification code is required." },
        { status: 400 }
      );
    }

    if (!role || (role !== "teacher" && role !== "parent" && role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Invalid role specified." },
        { status: 400 }
      );
    }

    // Verify through trusted SMS OTP Engine
    const result = await smsOtpService.verifyOtp(phone.trim(), otp.trim(), role, verificationId);

    // Create cryptographically signed HMAC-SHA256 session
    const sessionToken = await signSession({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      phoneVerified: true,
      role: result.user.role,
      schoolId: result.user.schoolId,
      provider: "phone",
    });

    const redirectUrl = result.user.role === "parent" ? "/parent/dashboard" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      user: result.user,
      redirectUrl,
      message: result.message,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

    return response;
  } catch (err: any) {
    const message = err.message || "OTP verification failed. Please try again.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 401 }
    );
  }
}
