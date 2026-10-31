/**
 * StudySaathi AI - Real Email Delivery & Verification Engine
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements real transactional email delivery supporting:
 * 1. Resend REST API (Modern HTTPS standard for serverless and Next.js / Vercel)
 * 2. Nodemailer / SMTP (Universal standard for custom mail servers, Gmail, AWS SES SMTP)
 * 3. SendGrid REST API (Enterprise transactional email infrastructure)
 * 4. Test Environment Mailbox (Strictly guarded by NODE_ENV === 'test' for automated test assertions)
 *
 * Security & Reliability Principles:
 * - Zero API keys or SMTP credentials exposed to frontend
 * - Never simulate success if delivery fails
 * - Responsive, accessible HTML email template
 * - Clear 5-minute expiration notice & security disclaimer
 * - Zero emojis in templates and notifications
 */

import nodemailer from "nodemailer";

export type EmailProviderType = "resend" | "smtp" | "sendgrid" | "test_provider" | "none";

export interface ActiveEmailProviderInfo {
  type: EmailProviderType;
  name: string;
  isConfigured: boolean;
  fromAddress: string;
}

/**
 * Detects the currently active Email Provider based on server environment variables.
 */
export function getActiveEmailProvider(): ActiveEmailProviderInfo {
  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "StudySaathi AI <onboarding@resend.dev>";

  // Explicit override via EMAIL_PROVIDER
  const configuredProvider = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();

  // 1. Resend API
  if (
    (configuredProvider === "resend" || !configuredProvider) &&
    process.env.RESEND_API_KEY
  ) {
    return {
      type: "resend",
      name: "Resend",
      isConfigured: true,
      fromAddress,
    };
  }

  // 2. SMTP (Nodemailer)
  if (
    (configuredProvider === "smtp" || !configuredProvider) &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return {
      type: "smtp",
      name: `SMTP (${process.env.SMTP_HOST})`,
      isConfigured: true,
      fromAddress,
    };
  }

  // 3. SendGrid API
  if (
    (configuredProvider === "sendgrid" || !configuredProvider) &&
    process.env.SENDGRID_API_KEY
  ) {
    return {
      type: "sendgrid",
      name: "SendGrid",
      isConfigured: true,
      fromAddress,
    };
  }

  // 4. Test Environment (for automated test runner)
  if (
    process.env.NODE_ENV === "test" &&
    (process.env.ALLOW_TEST_OTP === "true" || configuredProvider === "test")
  ) {
    return {
      type: "test_provider",
      name: "Test Mailbox Engine",
      isConfigured: true,
      fromAddress: "StudySaathi AI Test <test@studysaathi.edu.in>",
    };
  }

  return {
    type: "none",
    name: "Not Configured",
    isConfigured: false,
    fromAddress,
  };
}

export interface SentEmailRecord {
  to: string;
  subject: string;
  otpCode: string;
  sentAt: string;
  provider: EmailProviderType;
  messageId?: string;
  html: string;
}

// In-memory inspection mailbox for testing & verification
export const deliveredTestEmails: SentEmailRecord[] = [];

/**
 * Generates an accessible, responsive HTML email template for StudySaathi AI.
 */
export function generateOtpEmailHtml(params: {
  otpCode: string;
  recipientName?: string;
  role?: string;
  expiresInMinutes?: number;
}): { html: string; text: string } {
  const { otpCode, recipientName, role, expiresInMinutes = 5 } = params;
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
  const roleLabel = role === "parent" ? "Parent Portal" : "Teacher Portal";

  const text = `
StudySaathi AI - Email Verification Code

${greeting}

Your 6-digit verification code for StudySaathi AI (${roleLabel}) is:

${otpCode}

This code is valid for ${expiresInMinutes} minutes and can only be used once.

SECURITY WARNING:
Never share this code with anyone. StudySaathi AI administrators or teachers will never ask for your verification code.

If you did not request this verification code, please ignore this email or contact support.

---
StudySaathi AI - Educational Learning Bridge
Government of Gujarat Primary Education Initiative
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StudySaathi AI Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 580px;
      margin: 40px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%);
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 13px;
      color: #bfdbfe;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 16px 0;
    }
    .intro {
      font-size: 15px;
      color: #475569;
      margin: 0 0 24px 0;
    }
    .otp-container {
      background: #f0fdf4;
      border: 2px dashed #86efac;
      border-radius: 10px;
      padding: 24px 16px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #166534;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #15803d;
      margin: 4px 0;
      display: inline-block;
    }
    .otp-expiry {
      font-size: 13px;
      color: #166534;
      margin-top: 8px;
    }
    .security-box {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
    }
    .security-title {
      font-size: 13px;
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 4px 0;
    }
    .security-desc {
      font-size: 12px;
      color: #b91c1c;
      margin: 0;
    }
    .meta-text {
      font-size: 13px;
      color: #64748b;
      margin: 20px 0 0 0;
    }
    .footer {
      background: #f1f5f9;
      padding: 20px 28px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">StudySaathi AI</h1>
      <p class="brand-sub">Educational Learning Bridge &bull; ${roleLabel}</p>
    </div>
    <div class="content">
      <p class="greeting">${greeting}</p>
      <p class="intro">
        We received a request to verify your email address for your StudySaathi AI account. Use the 6-digit verification code below to complete authentication:
      </p>

      <div class="otp-container">
        <div class="otp-label">Verification Code</div>
        <div class="otp-code">${otpCode}</div>
        <div class="otp-expiry">Valid for <strong>${expiresInMinutes} minutes</strong> (Single-use only)</div>
      </div>

      <div class="security-box">
        <p class="security-title">Security Notice</p>
        <p class="security-desc">
          Never share this code with anyone. StudySaathi AI administrators or teachers will never ask you for your verification code.
        </p>
      </div>

      <p class="meta-text">
        If you did not request this verification code, you can safely ignore this email. No changes will be made to your account.
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; 2026 StudySaathi AI. Primary Education Initiative.</p>
      <p class="footer-text">Secure Transactional Authentication Service</p>
    </div>
  </div>
</body>
</html>
`.trim();

  return { html, text };
}

export class EmailService {
  /**
   * Delivers an OTP verification email through the configured provider.
   */
  async sendVerificationEmail(params: {
    to: string;
    otpCode: string;
    recipientName?: string;
    role?: string;
  }): Promise<{ success: boolean; messageId?: string; provider: string }> {
    const { to, otpCode, recipientName, role } = params;
    const provider = getActiveEmailProvider();

    if (!provider.isConfigured) {
      throw new Error(
        "Email delivery gateway is not configured. Please set RESEND_API_KEY, SMTP_HOST/USER/PASS, or SENDGRID_API_KEY in server environment variables."
      );
    }

    const { html, text } = generateOtpEmailHtml({
      otpCode,
      recipientName,
      role,
      expiresInMinutes: 5,
    });

    const subject = `Your StudySaathi AI Verification Code: ${otpCode}`;

    // 1. Resend API
    if (provider.type === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: provider.fromAddress,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.message || data?.error || `Resend delivery failed with HTTP ${response.status}`;
        throw new Error(`Email provider error (Resend): ${errorMsg}`);
      }

      return {
        success: true,
        messageId: data?.id || `resend-${Date.now()}`,
        provider: "resend",
      };
    }

    // 2. SMTP (Nodemailer)
    if (provider.type === "smtp") {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: provider.fromAddress,
        to,
        subject,
        text,
        html,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
      };
    }

    // 3. SendGrid API
    if (provider.type === "sendgrid") {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: {
            email: provider.fromAddress.replace(/.*<([^>]+)>.*/, "$1"),
            name: "StudySaathi AI",
          },
          subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Email provider error (SendGrid HTTP ${response.status}): ${errorText}`);
      }

      return {
        success: true,
        messageId: `sendgrid-${Date.now()}`,
        provider: "sendgrid",
      };
    }

    // 4. Test Environment Mailbox
    if (provider.type === "test_provider") {
      const record: SentEmailRecord = {
        to,
        subject,
        otpCode,
        sentAt: new Date().toISOString(),
        provider: "test_provider",
        messageId: `test-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        html,
      };
      deliveredTestEmails.push(record);

      return {
        success: true,
        messageId: record.messageId,
        provider: "test_provider",
      };
    }

    throw new Error("Unsupported email provider.");
  }

  /**
   * Dispatches a custom transactional email (e.g. notices, academic reports, attendance)
   */
  async sendCustomEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    fromName?: string;
  }): Promise<{ success: boolean; messageId?: string; provider: string }> {
    const { to, subject, html, text = "", fromName } = params;
    const provider = getActiveEmailProvider();

    if (!provider.isConfigured) {
      throw new Error(
        "Email delivery gateway is not configured. Please set RESEND_API_KEY, SMTP_HOST/USER/PASS, or SENDGRID_API_KEY in server environment variables."
      );
    }

    const fromAddress = fromName
      ? `"${fromName}" <${provider.fromAddress.replace(/.*<([^>]+)>.*/, "$1")}>`
      : provider.fromAddress;

    // 1. Resend API
    if (provider.type === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text: text || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMsg = data?.message || data?.error || `Resend delivery failed with HTTP ${response.status}`;
        throw new Error(`Email provider error (Resend): ${errorMsg}`);
      }

      return {
        success: true,
        messageId: data?.id || `resend-${Date.now()}`,
        provider: "resend",
      };
    }

    // 2. SMTP (Nodemailer)
    if (provider.type === "smtp") {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: text || undefined,
        html,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
      };
    }

    // 3. SendGrid API
    if (provider.type === "sendgrid") {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: {
            email: provider.fromAddress.replace(/.*<([^>]+)>.*/, "$1"),
            name: fromName || "StudySaathi AI",
          },
          subject,
          content: [
            { type: "text/plain", value: text || subject },
            { type: "text/html", value: html },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Email provider error (SendGrid HTTP ${response.status}): ${errorText}`);
      }

      return {
        success: true,
        messageId: `sendgrid-${Date.now()}`,
        provider: "sendgrid",
      };
    }

    // 4. Test Environment Mailbox
    if (provider.type === "test_provider") {
      const record: SentEmailRecord = {
        to,
        subject,
        otpCode: "",
        sentAt: new Date().toISOString(),
        provider: "test_provider",
        messageId: `test-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        html,
      };
      deliveredTestEmails.push(record);

      return {
        success: true,
        messageId: record.messageId,
        provider: "test_provider",
      };
    }

    throw new Error("Unsupported email provider.");
  }
}

export const emailService = new EmailService();

export async function sendCustomEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}) {
  return emailService.sendCustomEmail(params);
}

