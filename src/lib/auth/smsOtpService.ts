/**
 * StudySaathi AI - Real SMS OTP Authentication & Verification Engine
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements real SMS OTP delivery and verification supporting:
 * 1. Twilio Verify API (Global enterprise standard with carrier routing & TRAI compliance)
 * 2. Twilio Programmable SMS API (Direct carrier SMS delivery)
 * 3. MSG91 API (India's leading TRAI DLT registered transactional SMS gateway)
 *
 * Security Principles:
 * - Zero plaintext OTPs in database (SHA-256 with salt)
 * - Zero OTP values exposed in API responses or logs
 * - Strict 60-second resend cooldown per phone number
 * - Rate limited: Maximum 4 OTP deliveries per phone per hour
 * - Brute-force protection: Locks after 5 failed verification attempts
 * - Strict Role Isolation: A verified phone proves possession of the phone,
 *   NOT that the user is a teacher. Teachers MUST exist in the verified school database.
 */

import crypto from "crypto";
import { normalizePhoneNumber, maskPhoneNumber } from "./phoneUtils";
import { db } from "@/lib/db/database";
import type { UserRole, User } from "@shared/types";
import type { SessionUser } from "./session";

export interface PhoneVerificationRecord {
  id: string;
  phone: string;
  role: UserRole;
  otpHash?: string;
  verificationSid?: string;
  provider: "twilio_verify" | "twilio_sms" | "msg91" | "test_provider";
  attempts: number;
  maxAttempts: number;
  status: "pending" | "verified" | "expired" | "failed";
  expiresAt: string;
  lastSentAt: string;
  createdAt: string;
}

export type SmsProviderType = "twilio_verify" | "twilio_sms" | "msg91" | "test_provider" | "none";

/**
 * Detects the currently active SMS OTP Provider based on server environment variables.
 */
export function getActiveSmsProvider(): { type: SmsProviderType; name: string; isConfigured: boolean } {
  // 1. Twilio Verify Service (Recommended for OTP)
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_VERIFY_SERVICE_SID
  ) {
    return { type: "twilio_verify", name: "Twilio Verify", isConfigured: true };
  }

  // 2. Twilio Programmable SMS (Account SID + Auth Token + Outgoing Phone Number)
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    return { type: "twilio_sms", name: "Twilio SMS", isConfigured: true };
  }

  // 3. MSG91 (India DLT Registered Gateway)
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return { type: "msg91", name: "MSG91 (India DLT)", isConfigured: true };
  }

  // 4. Test Environment Only (Strictly guarded by NODE_ENV === 'test' and ALLOW_TEST_OTP === 'true')
  if (process.env.NODE_ENV === "test" && process.env.ALLOW_TEST_OTP === "true") {
    return { type: "test_provider", name: "Test OTP Engine", isConfigured: true };
  }

  return { type: "none", name: "Not Configured", isConfigured: false };
}

// In-memory verification storage synchronized with database
const memoryVerifications = new Map<string, PhoneVerificationRecord>();
const phoneRateLimits = new Map<string, number[]>(); // E.164 -> timestamps

function hashOtp(otp: string, phone: string): string {
  const salt = process.env.AUTH_SECRET || "studysaathi_otp_salt_gujarat_2026";
  return crypto.createHmac("sha256", salt).update(`${phone}:${otp}`).digest("hex");
}

export class SmsOtpService {
  /**
   * Request real SMS OTP delivery to a mobile phone.
   */
  async sendOtp(
    rawPhone: string,
    role: UserRole
  ): Promise<{
    success: boolean;
    verificationId: string;
    maskedPhone: string;
    cooldownSeconds: number;
    provider: string;
    message: string;
  }> {
    // 1. Validate & Normalize Phone Number
    const normalized = normalizePhoneNumber(rawPhone);
    if (!normalized.isValid) {
      throw new Error(normalized.error || "Invalid mobile number format.");
    }
    const phone = normalized.e164;
    const national = normalized.national;

    // 2. Strict Role Authorization Pre-Check
    // If attempting teacher login, the phone MUST belong to an authorized teacher in the DB!
    let targetUser: User | null = null;
    if (role === "teacher" || role === "admin") {
      targetUser = await db.getUserByPhoneAsync(phone);
      if (!targetUser) {
        // Also check if phone matches without +91 prefix
        targetUser = await db.getUserByPhoneAsync(national);
      }
      if (!targetUser) {
        throw new Error(
          "This mobile number is not registered to an authorized teacher or school administrator. Please contact your school administrator or sign in using your official email."
        );
      }
      if (targetUser.role !== "teacher" && targetUser.role !== "admin") {
        throw new Error("This account does not have teacher or administrator access.");
      }
      if (targetUser.status === "disabled") {
        throw new Error("This teacher account has been disabled. Please contact your school principal.");
      }
    }

    // 3. Enforce Rate Limiting & Cooldowns
    const now = Date.now();
    const existingVer = Array.from(memoryVerifications.values())
      .filter((v) => v.phone === phone && v.role === role && v.status === "pending")
      .sort((a, b) => new Date(b.lastSentAt).getTime() - new Date(a.lastSentAt).getTime())[0];

    if (existingVer) {
      const elapsedSeconds = Math.floor((now - new Date(existingVer.lastSentAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        const remaining = 60 - elapsedSeconds;
        throw new Error(`Please wait ${remaining} seconds before requesting another SMS.`);
      }
    }

    // Hourly rate limit: Max 4 requests per hour per mobile number
    const recentSends = (phoneRateLimits.get(phone) || []).filter((ts) => now - ts < 60 * 60 * 1000);
    if (recentSends.length >= 4) {
      throw new Error("Maximum SMS request limit reached for this hour. Please try again after 60 minutes.");
    }

    // 4. Inspect Active SMS Provider
    const activeProvider = getActiveSmsProvider();
    if (!activeProvider.isConfigured || activeProvider.type === "none") {
      throw new Error(
        "SMS Gateway Not Configured: Real SMS OTP delivery requires SMS gateway credentials. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID (or MSG91_AUTH_KEY and MSG91_TEMPLATE_ID) in your server environment."
      );
    }

    // 5. Generate Verification ID and Expiry
    const verificationId = `votp-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes

    let verificationSid: string | undefined = undefined;
    let otpHash: string | undefined = undefined;

    // 6. Deliver Real SMS Through Configured Provider
    if (activeProvider.type === "twilio_verify") {
      // TWILIO VERIFY API: Twilio generates, delivers, and verifies the OTP directly
      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

      const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", phone);
      params.append("Channel", "sms");

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok || data.status === "failed") {
        console.error("[Twilio Verify Delivery Error]:", data);
        throw new Error(data.message || "Failed to dispatch SMS through Twilio Verify gateway.");
      }
      verificationSid = data.sid;
    } else if (activeProvider.type === "msg91") {
      // MSG91 API (India DLT Registered Gateway)
      const authKey = process.env.MSG91_AUTH_KEY!;
      const templateId = process.env.MSG91_TEMPLATE_ID!;

      const url = new URL("https://control.msg91.com/api/v5/otp");
      url.searchParams.append("template_id", templateId);
      url.searchParams.append("mobile", phone.replace("+", ""));
      url.searchParams.append("authkey", authKey);
      url.searchParams.append("otp_expiry", "10");

      const res = await fetch(url.toString(), { method: "GET" });
      const data = await res.json();

      if (!res.ok || data.type === "error") {
        console.error("[MSG91 Delivery Error]:", data);
        throw new Error(data.message || "Failed to dispatch SMS through MSG91 gateway.");
      }
      verificationSid = data.request_id;
    } else if (activeProvider.type === "twilio_sms") {
      // TWILIO DIRECT PROGRAMMABLE SMS: Generate cryptographic 6-digit OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      otpHash = hashOtp(otpCode, phone);

      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", phone);
      params.append("From", fromNumber);
      params.append(
        "Body",
        `Your StudySaathi AI verification code is ${otpCode}. Valid for 10 minutes. Do not share this code.`
      );

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("[Twilio SMS Delivery Error]:", data);
        throw new Error(data.message || "Failed to deliver SMS through Twilio.");
      }
      verificationSid = data.sid;
    } else if (activeProvider.type === "test_provider") {
      // Strictly for automated tests: Cryptographic hash with standard test seed
      const testOtp = process.env.TEST_FIXED_OTP || "739281";
      otpHash = hashOtp(testOtp, phone);
      verificationSid = `test-sid-${Date.now()}`;
    }

    // 7. Store Verification Record
    const record: PhoneVerificationRecord = {
      id: verificationId,
      phone,
      role,
      otpHash,
      verificationSid,
      provider: activeProvider.type as any,
      attempts: 0,
      maxAttempts: 5,
      status: "pending",
      expiresAt,
      lastSentAt: new Date(now).toISOString(),
      createdAt: new Date(now).toISOString(),
    };

    memoryVerifications.set(verificationId, record);
    recentSends.push(now);
    phoneRateLimits.set(phone, recentSends);

    return {
      success: true,
      verificationId,
      maskedPhone: maskPhoneNumber(phone),
      cooldownSeconds: 60,
      provider: activeProvider.name,
      message: `Verification code sent to ${maskPhoneNumber(phone)} via SMS.`,
    };
  }

  /**
   * Verify an OTP code received via SMS and establish an authenticated user session.
   */
  async verifyOtp(
    rawPhone: string,
    rawOtp: string,
    role: UserRole,
    verificationId?: string
  ): Promise<{
    success: boolean;
    user: SessionUser;
    message: string;
  }> {
    // 1. Normalize Phone & Validate OTP Format
    const normalized = normalizePhoneNumber(rawPhone);
    if (!normalized.isValid) {
      throw new Error(normalized.error || "Invalid mobile number format.");
    }
    const phone = normalized.e164;
    const national = normalized.national;

    const otp = (rawOtp || "").trim();
    if (!otp || !/^\d{4,8}$/.test(otp)) {
      throw new Error("Invalid verification code. Please enter the numbers received in the SMS.");
    }

    // 2. Locate Active Verification Session
    let record: PhoneVerificationRecord | undefined = undefined;
    if (verificationId) {
      record = memoryVerifications.get(verificationId);
    }
    if (!record) {
      // Find latest pending verification for this phone and role
      const candidates = Array.from(memoryVerifications.values()).filter(
        (v) => v.phone === phone && v.role === role && v.status === "pending"
      );
      candidates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      record = candidates[0];
    }

    if (!record) {
      throw new Error("No active verification request found. Please request a new verification code.");
    }

    // Check expiration
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      record.status = "expired";
      throw new Error("Verification code has expired. Please request a new code.");
    }

    // Check brute force attempts
    if (record.attempts >= record.maxAttempts) {
      record.status = "failed";
      throw new Error("Too many incorrect attempts. Please request a new verification code.");
    }

    record.attempts += 1;

    // 3. Provider Verification Check
    let isApproved = false;

    if (record.provider === "twilio_verify") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

      const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", phone);
      params.append("Code", otp);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (res.ok && (data.status === "approved" || data.valid === true)) {
        isApproved = true;
      }
    } else if (record.provider === "msg91") {
      const authKey = process.env.MSG91_AUTH_KEY!;
      const url = new URL("https://control.msg91.com/api/v5/otp/verify");
      url.searchParams.append("otp", otp);
      url.searchParams.append("mobile", phone.replace("+", ""));
      url.searchParams.append("authkey", authKey);

      const res = await fetch(url.toString(), { method: "GET" });
      const data = await res.json();

      if (res.ok && (data.type === "success" || data.message === "OTP verified success")) {
        isApproved = true;
      }
    } else if (record.provider === "twilio_sms" || record.provider === "test_provider") {
      if (record.otpHash) {
        const computedHash = hashOtp(otp, phone);
        if (crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(record.otpHash))) {
          isApproved = true;
        }
      }
    }

    if (!isApproved) {
      const remainingAttempts = record.maxAttempts - record.attempts;
      throw new Error(
        `Incorrect verification code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : "Please request a new code."}`
      );
    }

    // 4. Mark Verification Success
    record.status = "verified";

    // 5. Account Lookup or Registration
    let sessionUser: SessionUser;

    if (role === "teacher" || role === "admin") {
      // TEACHER / ADMIN: Must be an authorized registered staff member
      let teacherUser = await db.getUserByPhoneAsync(phone);
      if (!teacherUser) {
        teacherUser = await db.getUserByPhoneAsync(national);
      }

      if (!teacherUser) {
        throw new Error(
          "No authorized teacher account found for this verified phone number. Access denied."
        );
      }

      sessionUser = {
        id: teacherUser.id,
        name: teacherUser.name,
        email: teacherUser.email,
        phone,
        phoneVerified: true,
        role: teacherUser.role,
        schoolId: teacherUser.schoolId,
        provider: "phone",
      };
    } else {
      // PARENT: Look up existing parent or register new parent
      let parentUser = await db.getUserByPhoneAsync(phone);
      if (!parentUser) {
        parentUser = await db.getUserByPhoneAsync(national);
      }

      let parentProfile = await db.getParentByPhoneAsync(phone);
      if (!parentProfile) {
        parentProfile = await db.getParentByPhoneAsync(national);
      }

      if (!parentUser) {
        // Create new permanent Parent User in Database
        const parentId = `par-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
        const parentEmail = `parent.${national}@studysaathi.in`;
        const parentName = parentProfile?.name || `Parent (${national.slice(-4)})`;

        parentUser = await db.createUserAsync({
          id: parentId,
          name: parentName,
          email: parentEmail,
          phone,
          role: "parent",
          schoolId: "sch-gn-01",
          provider: "phone" as any,
          status: "active",
        });

        // Ensure parent profile exists
        if (!parentProfile) {
          parentProfile = await db.createParentProfileAsync({
            id: `prof-${parentId}`,
            userId: parentUser.id,
            name: parentName,
            email: parentEmail,
            phone,
            preferredLanguage: "gu",
            relationship: "guardian",
            studentIds: [],
          });
        }
      }

      sessionUser = {
        id: parentUser.id,
        name: parentUser.name,
        email: parentUser.email,
        phone,
        phoneVerified: true,
        role: "parent",
        schoolId: parentUser.schoolId,
        provider: "phone",
      };
    }

    return {
      success: true,
      user: sessionUser,
      message: "Phone verification successful. Session authenticated.",
    };
  }
}

export const smsOtpService = new SmsOtpService();

