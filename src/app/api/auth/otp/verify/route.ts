import { NextResponse } from "next/server";
import { emailOtpService } from "@/lib/auth/emailOtpService";
import { smsOtpService } from "@/lib/auth/smsOtpService";
import { signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session";

/**
 * POST /api/auth/otp/verify (and /api/v1/auth/otp/verify)
 *
 * Verifies the 6-digit OTP code through the configured authentication engine.
 * Rejects expired, invalid, or replayed OTP attempts.
 * Establishes an authenticated HMAC-SHA256 session with HTTP-only cookies on success.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone, otp, code, role, verificationId } = body;
    const submittedOtp = otp || code;

    if (!submittedOtp || typeof submittedOtp !== "string") {
      return NextResponse.json(
        { success: false, error: "6-digit verification code is required." },
        { status: 400 }
      );
    }

    if (!role || (role !== "teacher" && role !== "parent" && role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Invalid role specified. Must be 'teacher' or 'parent'." },
        { status: 400 }
      );
    }

    // 1. Primary Email OTP path
    if (email && typeof email === "string" && email.trim()) {
      const result = await emailOtpService.verifyOtp(
        email.trim(),
        submittedOtp.trim(),
        role,
        verificationId
      );

      // Create cryptographically signed HMAC-SHA256 session
      const sessionToken = await signSession({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        phoneVerified: result.user.phoneVerified,
        emailVerified: true,
        role: result.user.role,
        schoolId: result.user.schoolId,
        provider: "email",
      });

      const redirectUrl = result.user.role === "parent" ? "/parent/dashboard" : "/dashboard";

      const response = NextResponse.json({
        success: true,
        verified: true,
        user: result.user,
        redirectUrl,
        message: result.message,
      });

      // Set secure HTTP-only session cookie
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

      return response;
    }

    // 2. Legacy Phone OTP fallback
    if (phone && typeof phone === "string" && phone.trim()) {
      const result = await smsOtpService.verifyOtp(
        phone.trim(),
        submittedOtp.trim(),
        role,
        verificationId
      );

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
        verified: true,
        user: result.user,
        redirectUrl,
        message: result.message,
      });

      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Email address is required for verification." },
      { status: 400 }
    );
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
