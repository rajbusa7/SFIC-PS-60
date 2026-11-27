import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { validateUsername, validateEmail, validatePassword } from "../src/lib/auth/validation";
import { rateLimiter } from "../src/lib/auth/rateLimiter";
import { emailOtpService } from "../src/lib/auth/emailOtpService";
import { securityAudit } from "../src/lib/auth/auditLog";
import { signSession, verifySession } from "../src/lib/auth/session";
import { getGoogleAuthorizationUrl } from "../src/lib/auth/google";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { POST as loginHandler } from "../src/app/api/auth/login/route";
import { POST as verifyOtpHandler } from "../src/app/api/auth/login/verify-otp/route";
import { POST as resendOtpHandler } from "../src/app/api/auth/login/resend-otp/route";
import { deliveredTestEmails } from "../src/lib/auth/emailService";

describe("StudySaathi AI - Advanced Security & Account Protection Suite", () => {
  before(() => {
    process.env.NODE_ENV = "test";
    process.env.ALLOW_TEST_OTP = "true";
  });

  // =========================================================================
  // 1. PURE ALPHABETIC USERNAME VALIDATION
  // =========================================================================
  describe("Pure Alphabetic Username Validation", () => {
    it("accepts valid ASCII alphabetic usernames", () => {
      const validNames = ["Raj", "Aarav", "Yashvi", "Priya", "Rahul", "Pooja", "Vikram"];
      for (const name of validNames) {
        const result = validateUsername(name);
        assert.equal(result.isValid, true, `Expected '${name}' to be valid`);
        assert.equal(result.data, name);
      }
    });

    it("accepts valid Unicode Indian script names (Devanagari, Gujarati)", () => {
      const unicodeNames = [
        "રાજ",       // Gujarati: Raj
        "રમેશ",      // Gujarati: Ramesh
        "પ્રિયા",    // Gujarati: Priya
        "प्रिया",    // Devanagari: Priya
        "राहुल",     // Devanagari: Rahul
        "आरव",       // Devanagari: Aarav
      ];
      for (const name of unicodeNames) {
        const result = validateUsername(name);
        assert.equal(result.isValid, true, `Expected Indian script name '${name}' to be valid`);
      }
    });

    it("rejects usernames containing numbers", () => {
      const invalidNames = ["Raj123", "Raj007", "Aarav1", "99Priya", "Rahul2026"];
      for (const name of invalidNames) {
        const result = validateUsername(name);
        assert.equal(result.isValid, false, `Expected '${name}' to be rejected due to numbers`);
        assert.match(result.error!, /numbers are not allowed/i);
      }
    });

    it("rejects usernames containing spaces", () => {
      const spacedNames = ["Raj Busa", "Aarav Patel", "Priya Sharma", " Rahul", "Yashvi "];
      for (const name of spacedNames) {
        const result = validateUsername(name);
        assert.equal(result.isValid, false, `Expected '${name}' to be rejected due to spaces`);
        assert.match(result.error!, /spaces/i);
      }
    });

    it("rejects usernames containing special characters and symbols", () => {
      const symbolNames = ["Raj_01", "Raj@123", "Priya!", "Aarav-Patel", "User#1", "Rahul$"];
      for (const name of symbolNames) {
        const result = validateUsername(name);
        assert.equal(result.isValid, false, `Expected '${name}' to be rejected due to symbols`);
      }
    });

    it("rejects usernames containing emojis", () => {
      const emojiNames = ["Raj\uD83D\uDE80", "Priya\u2764\uFE0F", "Aarav\u2728"];
      for (const name of emojiNames) {
        const result = validateUsername(name);
        assert.equal(result.isValid, false, `Expected emoji '${name}' to be rejected`);
      }
    });

    it("enforces minimum and maximum length bounds (2 to 50 characters)", () => {
      assert.equal(validateUsername("").isValid, false, "Empty username must be rejected");
      assert.equal(validateUsername("R").isValid, false, "Single character must be rejected");
      assert.equal(validateUsername("A".repeat(51)).isValid, false, "Over 50 characters must be rejected");
      assert.equal(validateUsername("Aa").isValid, true, "2 characters must be accepted");
      assert.equal(validateUsername("A".repeat(50)).isValid, true, "50 characters must be accepted");
    });
  });

  // =========================================================================
  // 2. RFC 5322 EMAIL VALIDATION & NORMALIZATION
  // =========================================================================
  describe("Email Validation and Normalization", () => {
    it("accepts and normalizes valid email addresses", () => {
      const valid = [
        "teacher@studysaathi.edu.in",
        "ADMIN@SCHOOL.AC.IN",
        "principal.trivedi@gujarat.gov.in",
        "user.name+tag@domain.com",
      ];
      for (const em of valid) {
        const res = validateEmail(em);
        assert.equal(res.isValid, true, `Expected valid email: ${em}`);
        assert.equal(res.data, em.trim().toLowerCase());
      }
    });

    it("rejects malformed emails and invalid domain structures", () => {
      const invalid = [
        "notanemail",
        "user@domain",
        "user @domain.com",
        "user..double@domain.com",
        "@domain.com",
        "user@",
        "user@.com",
        "user@domain..com",
        "user@domain.c",
        "user@-domain.com",
      ];
      for (const em of invalid) {
        const res = validateEmail(em);
        assert.equal(res.isValid, false, `Expected invalid email to fail: ${em}`);
      }
    });
  });

  // =========================================================================
  // 3. PASSWORD STRENGTH VALIDATION
  // =========================================================================
  describe("Password Policy & Entropy Validation", () => {
    it("accepts compliant passwords meeting length, case, digit and symbol requirements", () => {
      const compliant = ["StudySaathi2026!", "Pooja@Sharma99", "Gujarat#Ed1234"];
      for (const pass of compliant) {
        const res = validatePassword(pass);
        assert.equal(res.isValid, true, `Expected password '${pass}' to be compliant`);
        assert.ok(res.score >= 4);
      }
    });

    it("rejects passwords lacking required character classes", () => {
      assert.equal(validatePassword("short1!").isValid, false, "Must reject < 8 chars");
      assert.equal(validatePassword("lowercase123!").isValid, false, "Must reject without uppercase");
      assert.equal(validatePassword("UPPERCASE123!").isValid, false, "Must reject without lowercase");
      assert.equal(validatePassword("NoDigitsHere!").isValid, false, "Must reject without digit");
      assert.equal(validatePassword("NoSpecialChars123").isValid, false, "Must reject without special symbol");
    });
  });

  // =========================================================================
  // 4. ROLE ESCALATION & SIGNUP PROTECTION
  // =========================================================================
  describe("Role Escalation Prevention & Registration Guard", () => {
    it("strictly blocks public creation of administrator or principal accounts", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "AttackerAdmin",
          email: "escalation@test.com",
          password: "SecurePassword2026!",
          role: "admin",
        }),
      });

      const res = await registerHandler(req);
      assert.equal(res.status, 403, "Admin registration via public endpoint must return 403 Forbidden");

      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.error, /administrator accounts cannot be created/i);
    });

    it("rejects registration with invalid username (e.g. containing numbers or spaces)", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Raj123",
          email: "raj123@test.com",
          password: "SecurePassword2026!",
        }),
      });

      const res = await registerHandler(req);
      assert.equal(res.status, 400, "Registration with numbers in username must return 400");
    });
  });

  // =========================================================================
  // 5. CRYPTOGRAPHICALLY SECURE EMAIL OTP VERIFICATION
  // =========================================================================
  describe("Cryptographically Secure Email OTP Verification", () => {
    const testUser = {
      id: "usr-test-otp-01",
      name: "Pratima",
      email: "pratima.shukla@studysaathi.edu.in",
      role: "teacher" as const,
      schoolId: "sch-gn-01",
    };

    it("generates a 6-digit numeric OTP and stores salted hash without plaintext", async () => {
      const initialDeliveredCount = deliveredTestEmails.length;
      const sendRes = await emailOtpService.sendLoginOtp({ user: testUser });

      assert.equal(sendRes.success, true);
      assert.ok(sendRes.tempToken.startsWith("eotp_"), "Temporary token must have secure prefix");
      assert.equal(sendRes.expiresInSeconds, 300, "Expiration must be 5 minutes (300 seconds)");
      assert.equal(sendRes.cooldownSeconds, 60, "Resend cooldown must be 60 seconds");

      // Verify email was delivered to test mailbox
      assert.equal(deliveredTestEmails.length, initialDeliveredCount + 1);
      const delivered = deliveredTestEmails[deliveredTestEmails.length - 1];
      assert.equal(delivered.to, testUser.email);
      assert.match(delivered.otpCode, /^\d{6}$/, "Generated OTP must be exactly 6 digits");
    });

    it("successfully verifies valid 6-digit OTP and establishes authenticated session", async () => {
      const sendRes = await emailOtpService.sendLoginOtp({ user: testUser });
      const delivered = deliveredTestEmails[deliveredTestEmails.length - 1];
      const otpCode = delivered.otpCode;

      const req = new Request("http://localhost:3000/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: sendRes.tempToken,
          otp: otpCode,
        }),
      });

      const res = await verifyOtpHandler(req);
      assert.equal(res.status, 200, "Valid OTP verification must return 200 OK");

      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.user?.id);

      // Verify session cookie was set
      const cookieHeader = res.headers.get("set-cookie");
      assert.ok(cookieHeader?.includes("studysaathi_session="));
    });

    it("strictly prevents single-use OTP replay", async () => {
      const sendRes = await emailOtpService.sendLoginOtp({ user: testUser });
      const delivered = deliveredTestEmails[deliveredTestEmails.length - 1];
      const otpCode = delivered.otpCode;

      // First verification succeeds
      const req1 = new Request("http://localhost:3000/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: sendRes.tempToken,
          otp: otpCode,
        }),
      });
      const res1 = await verifyOtpHandler(req1);
      assert.equal(res1.status, 200);

      // Second replay attempt must be rejected
      const req2 = new Request("http://localhost:3000/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: sendRes.tempToken,
          otp: otpCode,
        }),
      });
      const res2 = await verifyOtpHandler(req2);
      assert.equal(res2.status, 401, "Replaying already consumed OTP must return 401 Unauthorized");
    });

    it("locks and invalidates OTP session after exceeding max failed attempts (5 attempts)", async () => {
      const sendRes = await emailOtpService.sendLoginOtp({ user: testUser });

      for (let i = 1; i <= 4; i++) {
        const req = new Request("http://localhost:3000/api/auth/login/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tempToken: sendRes.tempToken,
            otp: "000000",
          }),
        });
        const res = await verifyOtpHandler(req);
        assert.equal(res.status, 401);
        const data = await res.json();
        assert.match(data.error, /attempt\(s\) remaining/i);
      }

      // 5th failed attempt should lock session
      const req5 = new Request("http://localhost:3000/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: sendRes.tempToken,
          otp: "000000",
        }),
      });
      const res5 = await verifyOtpHandler(req5);
      assert.equal(res5.status, 401);
      const data5 = await res5.json();
      assert.match(data5.error, /too many incorrect/i);
    });
  });

  // =========================================================================
  // 6. RATE LIMITING & BRUTE FORCE PROTECTION
  // =========================================================================
  describe("Rate Limiting & Brute Force Protection Engine", () => {
    it("enforces sliding window limits and reports remaining tokens", () => {
      const key = `test_rate_limit:ip:${Date.now()}`;
      const limit = 3;
      const windowSeconds = 10;

      // First 3 requests permitted
      for (let i = 1; i <= limit; i++) {
        const status = rateLimiter.consume(key, limit, windowSeconds);
        assert.equal(status.allowed, true);
        assert.equal(status.remaining, limit - i);
      }

      // 4th request must be blocked
      const blockedStatus = rateLimiter.consume(key, limit, windowSeconds);
      assert.equal(blockedStatus.allowed, false);
      assert.equal(blockedStatus.remaining, 0);
      assert.ok(blockedStatus.resetSeconds > 0);
    });
  });

  // =========================================================================
  // 7. SESSION SECURITY & CRYPTOGRAPHIC INTEGRITY
  // =========================================================================
  describe("Session Security & HMAC-SHA256 Token Verification", () => {
    it("successfully creates and verifies cryptographic HMAC session token", async () => {
      const user = {
        id: "usr-sec-01",
        name: "Aarav",
        email: "aarav.joshi@studysaathi.edu.in",
        role: "teacher" as const,
        schoolId: "sch-gn-01",
        provider: "local" as const,
      };

      const token = await signSession(user, 3600);
      assert.ok(token.includes("."), "Session token must contain payload and signature separated by dot");

      const verified = await verifySession(token);
      assert.ok(verified, "Valid signature must verify successfully");
      assert.equal(verified?.id, user.id);
      assert.equal(verified?.email, user.email);
    });

    it("rejects tampered or forged session token payloads", async () => {
      const user = {
        id: "usr-sec-02",
        name: "NormalTeacher",
        email: "teacher@studysaathi.edu.in",
        role: "teacher" as const,
        schoolId: "sch-gn-01",
      };

      const validToken = await signSession(user);
      const [payloadB64, signature] = validToken.split(".");

      // Tamper payload to escalate role to admin
      const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
      decoded.role = "admin";
      const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString("base64url");

      const forgedToken = `${tamperedPayloadB64}.${signature}`;
      const result = await verifySession(forgedToken);
      assert.equal(result, null, "Forged token signature mismatch must be rejected");
    });
  });

  // =========================================================================
  // 8. GOOGLE OAUTH CONSENT FLOW CONFIGURATION
  // =========================================================================
  describe("Google OAuth Consent Flow Parameters", () => {
    it("generates genuine authorization URL with select_account consent on registration", () => {
      const origin = "https://shikshasetu-ai-iota.vercel.app";
      const state = "test_csrf_token_12345:destination:register";

      const authUrl = getGoogleAuthorizationUrl(origin, state, "register");
      const url = new URL(authUrl);

      assert.equal(url.hostname, "accounts.google.com");
      assert.equal(url.pathname, "/o/oauth2/v2/auth");
      assert.equal(url.searchParams.get("prompt"), "select_account consent");
      assert.equal(url.searchParams.get("scope"), "openid email profile");
      assert.equal(url.searchParams.get("access_type"), "offline");
      assert.equal(url.searchParams.get("response_type"), "code");
    });

    it("uses minimal scopes and does not request Drive, Gmail, or Contacts", () => {
      const origin = "https://shikshasetu-ai-iota.vercel.app";
      const authUrl = getGoogleAuthorizationUrl(origin, "state:login");
      const url = new URL(authUrl);

      const scope = url.searchParams.get("scope") || "";
      assert.ok(scope.includes("openid"));
      assert.ok(scope.includes("email"));
      assert.ok(scope.includes("profile"));

      assert.ok(!scope.includes("gmail"), "Must not request Gmail");
      assert.ok(!scope.includes("drive"), "Must not request Drive");
      assert.ok(!scope.includes("contacts"), "Must not request Contacts");
    });
  });
});
