/**
 * StudySaathi AI - Cryptographically Secure Email OTP Service
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements real, cryptographically secure 6-digit Email OTP 2FA for teachers,
 * administrators, and privileged users.
 *
 * Security Features:
 * - CSPRNG 6-digit generation (crypto.randomInt)
 * - Zero plaintext OTP storage (HMAC-SHA256 with server secret)
 * - 5-minute strict expiration window
 * - Single-use consumption (immediate invalidation on verification)
 * - Brute-force protection: Locks after 5 failed verification attempts
 * - Strict 60-second resend cooldown per email
 * - Invalidation of prior pending codes on resend
 * - Zero OTP exposure in API payloads or client-side logs
 * - Zero emojis in code, logs, and emails
 */

import crypto from "crypto";
import { emailService } from "./emailService";
import { rateLimiter } from "./rateLimiter";
import { securityAudit } from "./auditLog";
import type { UserRole, User } from "@shared/types";

export interface EmailOtpRecord {
  id: string;
  email: string;
  role: UserRole;
  otpHash: string;
  tempToken: string;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "verified" | "expired" | "failed";
  expiresAt: number;
  createdAt: number;
  userId: string;
  userName: string;
}

export interface SendEmailOtpResult {
  success: boolean;
  tempToken: string;
  maskedEmail: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
  message: string;
}

export interface VerifyEmailOtpResult {
  success: boolean;
  user: User;
  message: string;
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;

// In-memory verification storage
const memoryEmailOtps = new Map<string, EmailOtpRecord>(); // tempToken -> record
const emailToActiveToken = new Map<string, string>(); // normalized email -> tempToken

function hashEmailOtp(otp: string, email: string): string {
  const secret = process.env.AUTH_SECRET || "studysaathi_email_otp_salt_gujarat_2026";
  return crypto.createHmac("sha256", secret).update(`${email.toLowerCase()}:${otp.trim()}`).digest("hex");
}

function maskEmailAddress(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }
  return `${user.substring(0, 2)}***${user[user.length - 1]}@${domain}`;
}

export class EmailOtpService {
  /**
   * Generates a CSPRNG 6-digit numeric OTP and dispatches it via real email.
   */
  async sendLoginOtp(params: {
    user: User;
    ip?: string;
  }): Promise<SendEmailOtpResult> {
    const { user, ip = "127.0.0.1" } = params;
    const normalizedEmail = user.email.trim().toLowerCase();

    // 1. Enforce 60-second resend cooldown per email address
    const cooldownKey = `email_otp_resend:${normalizedEmail}`;
    const resendStatus = rateLimiter.consume(cooldownKey, 1, RESEND_COOLDOWN_SECONDS);
    if (!resendStatus.allowed) {
      throw new Error(
        `Please wait ${resendStatus.resetSeconds} seconds before requesting a new verification code.`
      );
    }

    // 2. Invalidate any existing pending OTP tokens for this email
    const priorToken = emailToActiveToken.get(normalizedEmail);
    if (priorToken && memoryEmailOtps.has(priorToken)) {
      const prior = memoryEmailOtps.get(priorToken)!;
      prior.status = "expired";
      memoryEmailOtps.delete(priorToken);
    }

    // 3. Generate a cryptographically secure 6-digit OTP (100000 to 999999)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashEmailOtp(rawOtp, normalizedEmail);

    // 4. Generate cryptographically random temporary session token for verification phase
    const tempToken = `eotp_${crypto.randomBytes(24).toString("hex")}`;
    const now = Date.now();

    const record: EmailOtpRecord = {
      id: `otp-${now}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      role: user.role,
      otpHash,
      tempToken,
      attempts: 0,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      status: "pending",
      expiresAt: now + OTP_EXPIRY_MS,
      createdAt: now,
      userId: user.id,
      userName: user.name,
    };

    memoryEmailOtps.set(tempToken, record);
    emailToActiveToken.set(normalizedEmail, tempToken);

    // 5. Send real transactional email through active email delivery gateway
    try {
      await emailService.sendVerificationEmail({
        to: normalizedEmail,
        otpCode: rawOtp,
        recipientName: user.name,
        role: user.role,
      });

      securityAudit.record({
        eventType: "OTP_SENT",
        identifier: normalizedEmail,
        ip,
        role: user.role,
        status: "success",
        details: { provider: emailService },
      });
    } catch (err: any) {
      // In development or test fallback if email is not configured
      if (process.env.NODE_ENV !== "test") {
        console.warn("[EmailOtpService] Delivery warning:", err.message);
      }
      // If delivery failed critically and not in test, rethrow clear descriptive error
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Failed to deliver verification email: ${err.message}`);
      }
    }

    return {
      success: true,
      tempToken,
      maskedEmail: maskEmailAddress(normalizedEmail),
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      message: `A 6-digit verification code has been sent to ${maskEmailAddress(normalizedEmail)}.`,
    };
  }

  /**
   * Validates a submitted 6-digit OTP code against the temporary token.
   */
  async verifyLoginOtp(params: {
    tempToken: string;
    otp: string;
    ip?: string;
  }): Promise<VerifyEmailOtpResult> {
    const { tempToken, otp, ip = "127.0.0.1" } = params;

    if (!tempToken || typeof tempToken !== "string") {
      throw new Error("Invalid or missing temporary verification token.");
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      throw new Error("Please enter a valid 6-digit verification code.");
    }

    const record = memoryEmailOtps.get(tempToken);
    if (!record) {
      securityAudit.record({
        eventType: "OTP_FAILED",
        identifier: "unknown_token",
        ip,
        status: "failure",
        details: { reason: "token_not_found" },
      });
      throw new Error("Verification session expired or not found. Please log in again.");
    }

    const now = Date.now();

    // Check expiration
    if (now > record.expiresAt || record.status === "expired") {
      record.status = "expired";
      memoryEmailOtps.delete(tempToken);
      emailToActiveToken.delete(record.email);

      securityAudit.record({
        eventType: "OTP_FAILED",
        identifier: record.email,
        ip,
        role: record.role,
        status: "failure",
        details: { reason: "otp_expired" },
      });
      throw new Error("The verification code has expired (5-minute limit). Please request a new code.");
    }

    // Check attempts limit
    if (record.attempts >= record.maxAttempts || record.status === "failed") {
      record.status = "failed";
      memoryEmailOtps.delete(tempToken);
      emailToActiveToken.delete(record.email);

      securityAudit.record({
        eventType: "OTP_RATE_LIMITED",
        identifier: record.email,
        ip,
        role: record.role,
        status: "failure",
        details: { reason: "max_attempts_exceeded" },
      });
      throw new Error("Too many incorrect verification attempts. This code is now invalidated. Please request a new code.");
    }

    // Increment attempts
    record.attempts += 1;

    // Timing-safe verification of hash
    const candidateHash = hashEmailOtp(otp, record.email);
    const bufA = Buffer.from(candidateHash, "hex");
    const bufB = Buffer.from(record.otpHash, "hex");

    let isMatch = false;
    if (bufA.length === bufB.length) {
      isMatch = crypto.timingSafeEqual(bufA, bufB);
    }

    if (!isMatch) {
      const remainingAttempts = record.maxAttempts - record.attempts;
      securityAudit.record({
        eventType: "OTP_FAILED",
        identifier: record.email,
        ip,
        role: record.role,
        status: "failure",
        details: { remainingAttempts },
      });

      if (remainingAttempts <= 0) {
        record.status = "failed";
        memoryEmailOtps.delete(tempToken);
        emailToActiveToken.delete(record.email);
        throw new Error("Too many incorrect verification attempts. Please log in again.");
      }

      throw new Error(`Invalid verification code. ${remainingAttempts} attempt(s) remaining.`);
    }

    // Mark as verified and invalidate immediately (single-use)
    record.status = "verified";
    memoryEmailOtps.delete(tempToken);
    emailToActiveToken.delete(record.email);

    // Retrieve live user record from database
    const { db } = await import("@/lib/db/database");
    let user = (await db.getUserByIdAsync(record.userId)) || (await db.getUserByEmailAsync(record.email));

    if (!user) {
      user = {
        id: record.userId,
        name: record.userName,
        email: record.email,
        role: record.role,
        schoolId: "sch-gn-01",
        provider: "local",
      };
    }

    securityAudit.record({
      eventType: "OTP_VERIFIED",
      identifier: record.email,
      ip,
      role: user.role,
      status: "success",
    });

    return {
      success: true,
      user,
      message: "Two-factor authentication successful.",
    };
  }

  /**
   * Resends an OTP code using the active temporary token.
   */
  async resendLoginOtp(tempToken: string, ip = "127.0.0.1"): Promise<SendEmailOtpResult> {
    if (!tempToken) {
      throw new Error("Temporary verification token is required.");
    }

    const record = memoryEmailOtps.get(tempToken);
    if (!record) {
      throw new Error("Verification session not found or expired. Please sign in again.");
    }

    const { db } = await import("@/lib/db/database");
    const user = (await db.getUserByIdAsync(record.userId)) || (await db.getUserByEmailAsync(record.email));
    if (!user) {
      throw new Error("User record could not be found.");
    }

    return this.sendLoginOtp({ user, ip });
  }
}

export const emailOtpService = new EmailOtpService();
