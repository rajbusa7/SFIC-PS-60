import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

// Sliding-window rate limit for failed code verification attempts per parent user
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;
const failedAttemptLog = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (failedAttemptLog.get(userId) || []).filter(
    (ts) => now - ts < FAILED_ATTEMPT_WINDOW_MS
  );
  failedAttemptLog.set(userId, recent);
  return recent.length >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(userId: string): void {
  const now = Date.now();
  const recent = (failedAttemptLog.get(userId) || []).filter(
    (ts) => now - ts < FAILED_ATTEMPT_WINDOW_MS
  );
  recent.push(now);
  failedAttemptLog.set(userId, recent);
}

function clearFailedAttempts(userId: string): void {
  failedAttemptLog.delete(userId);
}

export async function POST(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in as a parent." },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session || session.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Access denied. Parent role required." },
        { status: 403 }
      );
    }

    if (isRateLimited(session.id)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "RATE_LIMITED",
          error: "Too many invalid verification attempts. Please wait 15 minutes or verify the code with your school teacher.",
        },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, errorCode: "INVALID_CODE", error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const rawCode = body?.code ?? body?.verificationCode ?? body?.linkingCode;
    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json(
        {
          success: false,
          errorCode: "INVALID_CODE",
          error: "Please enter a valid verification code.",
        },
        { status: 400 }
      );
    }

    const normalizedCode = rawCode.trim().toUpperCase().replace(/\s+/g, "");
    if (normalizedCode.length < 4 || normalizedCode.length > 32) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "INVALID_CODE",
          error: "Invalid verification code format. Codes look like PAR-4892.",
        },
        { status: 400 }
      );
    }

    let parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      const user = await db.getUserByIdAsync(session.id);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Parent profile not found. Please sign in again." },
          { status: 404 }
        );
      }
      parentProfile = await db.createParentProfileAsync({
        userId: user.id,
        name: user.name,
        email: user.email,
        preferredLanguage: "gu",
        relationship: "guardian",
        studentIds: [],
      });
    }

    const redeemResult = await db.redeemLinkingCodeAsync(
      normalizedCode,
      session.id,
      parentProfile.id
    );

    if (!redeemResult.success) {
      if (redeemResult.errorCode !== "ALREADY_LINKED") {
        recordFailedAttempt(session.id);
      }
      const status = redeemResult.errorCode === "ALREADY_LINKED" ? 409 : 400;
      return NextResponse.json(
        {
          success: false,
          errorCode: redeemResult.errorCode || "INVALID_CODE",
          error: redeemResult.error || "Invalid verification code. Please check the code provided by your school.",
        },
        { status }
      );
    }

    clearFailedAttempts(session.id);

    const linkedStudent = redeemResult.studentId
      ? await db.getStudentByIdAsync(redeemResult.studentId)
      : null;

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${linkedStudent?.displayName || "student"} to your parent account!`,
      student: linkedStudent
        ? {
            id: linkedStudent.id,
            studentCode: linkedStudent.studentCode,
            displayName: linkedStudent.displayName,
            classroomId: linkedStudent.classroomId,
            grade: linkedStudent.grade,
            section: linkedStudent.section,
            enrollmentStatus: linkedStudent.enrollmentStatus,
          }
        : null,
      school: db.getSchool(),
      studentId: redeemResult.studentId,
    });
  } catch (error: any) {
    console.error("[Redeem Code API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify code right now. Please try again." },
      { status: 500 }
    );
  }
}
