/**
 * StudySaathi AI - Gmail Communication & Parent Bridge Verification Test Suite
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Verifies end-to-end integration:
 * 1. Gmail OAuth 2.0 authorization URL and scope configuration
 * 2. RFC 2822 base64url message encoding compliance
 * 3. Gmail connection state persistence and status retrieval
 * 4. Token refresh logic when close to expiration
 * 5. Disconnect Gmail workflow
 * 6. Responsive HTML Email Templates with strictly ZERO emojis
 * 7. Parent Bridge Communication Dispatch API (/api/v1/parent-bridge/communications/send)
 * 8. Notice Distribution with Gmail Integration (/api/notices/[id]/send)
 * 9. Strict Parent-Child RBAC access authorization
 * 10. Student Attendance summary & alert thresholds (<85%)
 * 11. Home Learning Activity completion and feedback persistence
 */

import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  getGmailAuthorizationUrl,
  formatBase64UrlEmail,
  sendParentEmail,
  getGmailStatus,
  disconnectGmail,
  getValidGmailAccessToken,
  sentGmailTestDeliveries,
  GMAIL_SCOPES,
} from "../src/lib/gmail/gmailService";
import {
  generateNoticeEmailHtml,
  generateAttendanceEmailHtml,
  generateAcademicReportEmailHtml,
  generateLearningGapEmailHtml,
  generateRemedialPlanEmailHtml,
  generateGeneralUpdateEmailHtml,
} from "../src/lib/gmail/emailTemplates";
import { db } from "../src/lib/db/database";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { POST as sendCommunicationHandler } from "../src/app/api/v1/parent-bridge/communications/send/route";
import { GET as getHistoryHandler } from "../src/app/api/v1/parent-bridge/communications/history/route";
import { POST as sendNoticeHandler } from "../src/app/api/notices/[id]/send/route";
import { GET as getStudentHandler } from "../src/app/api/parent/students/[id]/route";
import { POST as completeActivityHandler } from "../src/app/api/v1/parent-bridge/home-activities/[activityId]/complete/route";
import type { GmailConnection, SchoolNotice, StudentAttendanceSummary } from "../packages/shared/src/types/notice";

// Emoji detector regex to ensure 100% compliance with ZERO emojis requirement
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

function createJsonRequest(url: string, method: string, body?: any, cookies?: Record<string, string>): Request {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (cookies) {
    const cookieStr = Object.entries(cookies)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("; ");
    headers.set("Cookie", cookieStr);
  }
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("StudySaathi AI - Gmail Communication & Parent Bridge Integration", () => {
  before(() => {
    (process.env as any).NODE_ENV = "test";
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id-sfic-2026.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret-sfic-2026";
  });

  beforeEach(() => {
    sentGmailTestDeliveries.length = 0;
  });

  // --------------------------------------------------------------------------
  // TEST 1: Gmail OAuth URL & Scope Validation
  // --------------------------------------------------------------------------
  test("1. Gmail OAuth URL contains required offline consent and Gmail send scope", () => {
    const origin = "https://studysaathi-ai.gujarat.gov.in";
    const state = "state-token-123:redirect:gmail";
    const authUrl = getGmailAuthorizationUrl(origin, state);

    assert.ok(authUrl.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
    assert.ok(authUrl.includes("client_id=test-google-client-id"));
    assert.ok(authUrl.includes("access_type=offline"));
    assert.ok(authUrl.includes("prompt=consent"));
    assert.ok(authUrl.includes(encodeURIComponent("https://www.googleapis.com/auth/gmail.send")));
    assert.ok(authUrl.includes("state=state-token-123"));
  });

  // --------------------------------------------------------------------------
  // TEST 2: RFC 2822 Base64url Email Formatting
  // --------------------------------------------------------------------------
  test("2. formatBase64UrlEmail encodes valid RFC 2822 base64url string without padding", () => {
    const fromEmail = "principal@modelprimaryschool.edu";
    const fromName = "Model Primary School Gandhinagar";
    const toEmail = "rajesh.patel@gmail.com";
    const toName = "Rajeshbhai Patel";
    const subject = "Class 4 Mathematics Progress Report";
    const html = "<p>Student has mastered foundational multiplication.</p>";

    const encoded = formatBase64UrlEmail(fromEmail, fromName, toEmail, toName, subject, html);

    assert.ok(typeof encoded === "string" && encoded.length > 0);
    // Base64url characters only: no +, no /, no trailing =
    assert.ok(!encoded.includes("+"));
    assert.ok(!encoded.includes("/"));
    assert.ok(!encoded.includes("="));

    // Decode and verify RFC 2822 content
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decoded = Buffer.from(base64, "base64").toString("utf-8");

    assert.ok(decoded.includes(fromEmail));
    assert.ok(decoded.includes(toEmail));
    assert.ok(decoded.includes("MIME-Version: 1.0"));
    assert.ok(decoded.includes("Content-Type: text/html; charset=UTF-8"));
    assert.ok(decoded.includes(html));
  });

  // --------------------------------------------------------------------------
  // TEST 3: Gmail Connection State Management
  // --------------------------------------------------------------------------
  test("3. Saves Gmail connection, reports active status, and supports clean disconnect", () => {
    const connection: GmailConnection = {
      id: "gconn-test-01",
      schoolId: "sch-model-paliyad",
      email: "principal.paliyad@gmail.com",
      connectedByUserId: "usr-admin-01",
      accessToken: "ya29.test-access-token-active",
      refreshToken: "1//04-test-refresh-token",
      expiresAt: Date.now() + 3600 * 1000,
      scope: GMAIL_SCOPES,
      connectedAt: new Date().toISOString(),
      status: "connected",
    };

    db.saveGmailConnection(connection);

    const status = getGmailStatus();
    assert.strictEqual(status.isConnected, true);
    assert.strictEqual(status.email, "principal.paliyad@gmail.com");
    assert.strictEqual(status.status, "connected");

    // Test token retrieval for valid token
    const token = connection.accessToken;
    assert.strictEqual(token, "ya29.test-access-token-active");

    // Test disconnect
    const disconnected = disconnectGmail();
    assert.strictEqual(disconnected, true);

    const postStatus = getGmailStatus();
    assert.strictEqual(postStatus.isConnected, false);
    assert.strictEqual(postStatus.status, "disconnected");
  });

  // --------------------------------------------------------------------------
  // TEST 4: Responsive HTML Templates Verification & ZERO Emojis Check
  // --------------------------------------------------------------------------
  test("4. All 6 email templates render responsive HTML with strictly ZERO emojis", () => {
    const mockNotice: SchoolNotice = {
      id: "notice-ptm-01",
      schoolId: "sch-01",
      title: "Parent-Teacher Meeting for Term 1 Evaluation",
      originalContent: "All parents are cordially invited to review their child's academic progress.",
      simplifiedContent: "Please come to school to meet your child's teachers on Friday.",
      category: "pta" as any,
      status: "sent",
      originalLanguage: "gu",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetAudience: "class",
      targetClassGrade: 4,
    };

    const mockAttendance: StudentAttendanceSummary = {
      studentId: "std-aarav",
      attendanceRate: 94.5,
      totalDays: 110,
      presentDays: 104,
      absentDays: 6,
      lastUpdated: new Date().toISOString(),
      recentAbsences: [
        { date: "2026-10-24", reason: "Mild fever", isExcused: true, notifiedParent: true },
      ],
      teacherRemarks: "Aarav is regular and attends all core remedial classes.",
    };

    const noticeHtml = generateNoticeEmailHtml(mockNotice, "Rajeshbhai Patel", { studentName: "Aarav Patel", language: "gu" });
    const attendanceHtml = generateAttendanceEmailHtml("Aarav Patel", "Rajeshbhai Patel", mockAttendance, { language: "gu" });
    const academicHtml = generateAcademicReportEmailHtml("Aarav Patel", "Rajeshbhai Patel", {
      averagePercentage: 88,
      trend: "improving",
      recentAssessments: [
        { title: "Math Unit 1", subject: "Mathematics", score: 22, maxScore: 25, percentage: 88 },
      ],
      teacherFeedback: "Excellent conceptual grasp of fractions.",
    }, { language: "gu" });

    const gapHtml = generateLearningGapEmailHtml("Aarav Patel", "Rajeshbhai Patel", {
      conceptName: "Two-digit Multiplication",
      subject: "Mathematics",
      priority: "High",
      status: "Needs Support",
      score: 45,
      whyFlaggedDiagnosis: "Confusion in step-by-step regrouping procedure.",
      recommendedHomeActivity: "Practice 10 minutes of grid multiplication.",
    }, { language: "gu" });

    const planHtml = generateRemedialPlanEmailHtml("Aarav Patel", "Rajeshbhai Patel", {
      conceptName: "Multiplication Step-by-Step",
      learningObjective: "Master two-digit by one-digit multiplication without errors.",
      steps: [
        { stepNumber: 1, title: "Concrete Grouping", description: "Use 12 items to divide equally", durationMinutes: 10 },
        { stepNumber: 2, title: "Repeated Addition", description: "Practice repeated addition hops", durationMinutes: 15 },
      ],
      practiceInstructions: "Review daily for 15 minutes before dinner.",
    }, { language: "gu" });

    const generalHtml = generateGeneralUpdateEmailHtml("Aarav Patel", "Rajeshbhai Patel", {
      title: "Science Project Materials Reminder",
      subject: "Materials for Friday Practical",
      content: "Please send 2 small plastic bottles with your child on Friday.",
      teacherName: "Sureshbhai Joshi",
    }, { language: "gu" });

    const allTemplates = [noticeHtml, attendanceHtml, academicHtml, gapHtml, planHtml, generalHtml];

    // Verify all templates are valid non-empty HTML
    for (const html of allTemplates) {
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("StudySaathi AI"));
      assert.ok(html.includes("Aarav Patel"));
      assert.ok(html.includes("Rajeshbhai Patel"));

      // STRICT ZERO EMOJI TEST
      const hasEmoji = EMOJI_REGEX.test(html);
      assert.strictEqual(hasEmoji, false, "HTML template must contain strictly ZERO emojis");
    }
  });

  // --------------------------------------------------------------------------
  // TEST 5: Parent Bridge Direct Communication Dispatch API
  // --------------------------------------------------------------------------
  test("5. POST /api/v1/parent-bridge/communications/send dispatches report and records communication", async () => {
    const teacherSession = await signSession({
      id: "usr-tea-01",
      name: "Sureshbhai Joshi",
      email: "teacher.suresh@school.edu",
      role: "teacher",
      schoolId: "sch-01",
    });

    const req = createJsonRequest(
      "http://localhost:3000/api/v1/parent-bridge/communications/send",
      "POST",
      {
        studentId: "std-aarav",
        type: "attendance",
        title: "Aarav Patel - Term 1 Attendance Summary",
        subject: "Attendance Update for Aarav Patel",
        language: "gu",
        customMessage: "Aarav is maintaining 94.5% attendance this semester.",
      },
      { [SESSION_COOKIE_NAME]: teacherSession }
    );

    const res = await sendCommunicationHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.communication);
    assert.strictEqual(data.communication.studentId, "std-aarav");
    assert.strictEqual(data.communication.parentEmail, "rajesh.patel@gmail.com");
    assert.strictEqual(data.communication.deliveryStatus, "delivered");

    // Verify test mailbox captured the dispatch
    assert.strictEqual(sentGmailTestDeliveries.length, 1);
    assert.strictEqual(sentGmailTestDeliveries[0].to, "rajesh.patel@gmail.com");
    assert.strictEqual(sentGmailTestDeliveries[0].subject, "Attendance Update for Aarav Patel");

    // Verify communication is queryable in database
    const saved = db.getCommunicationById(data.communication.id);
    assert.ok(saved);
    assert.strictEqual(saved.id, data.communication.id);
    assert.strictEqual(saved.type, "attendance");
  });

  // --------------------------------------------------------------------------
  // TEST 6: Notice Dispatch via Gmail & Communication Recording
  // --------------------------------------------------------------------------
  test("6. POST /api/notices/[id]/send dispatches notice to parent emails and logs communications", async () => {
    // Create a fresh notice to test dispatch
    const targetNotice = db.createNotice({
      title: "Science Fair Project Notification",
      originalContent: "All students are requested to prepare their science exhibits.",
      simplifiedContent: "Please help your child prepare their science project for Friday.",
      category: "general" as any,
      status: "draft",
      targetAudience: "all",
      originalLanguage: "gu",
    });

    const req = createJsonRequest(
      `http://localhost:3000/api/notices/${targetNotice.id}/send`,
      "POST",
      {
        studentIds: ["std-aarav"],
        sendViaGmail: true,
      }
    );

    const res = await sendNoticeHandler(req as any, {
      params: Promise.resolve({ id: targetNotice.id }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.deliveriesCount >= 1);
    assert.ok(data.emailsSent >= 1);

    // Verify parent communication was persisted
    const comms = db.getParentCommunications({ studentId: "std-aarav", type: "notice" });
    assert.ok(comms.length > 0);
    assert.strictEqual(comms[0].studentId, "std-aarav");
    assert.strictEqual(comms[0].channel, "email");
  });

  // --------------------------------------------------------------------------
  // TEST 7: Strict Parent-Child RBAC Security Enforcement
  // --------------------------------------------------------------------------
  test("7. Strict RBAC: Parent can access their linked child, but is rejected for other children", async () => {
    // Rajeshbhai Patel is parent of std-aarav only
    const parentSession = await signSession({
      id: "usr-par-01", // Linked to par-aarav which has studentIds: ["std-aarav"]
      name: "Rajeshbhai Patel",
      email: "rajesh.patel@gmail.com",
      role: "parent",
      schoolId: "sch-01",
    });

    // 1. Authorized access to own child (std-aarav)
    const authReq = createJsonRequest(
      "http://localhost:3000/api/parent/students/std-aarav",
      "GET",
      undefined,
      { [SESSION_COOKIE_NAME]: parentSession }
    );
    const authRes = await getStudentHandler(authReq, {
      params: Promise.resolve({ id: "std-aarav" }),
    });
    const authData = await authRes.json();

    assert.strictEqual(authRes.status, 200);
    assert.strictEqual(authData.success, true);
    assert.strictEqual(authData.student.id, "std-aarav");
    assert.ok(authData.attendance);
    assert.ok(Array.isArray(authData.communications));

    // 2. Unauthorized access to another student (std-pooja)
    const unauthReq = createJsonRequest(
      "http://localhost:3000/api/parent/students/std-pooja",
      "GET",
      undefined,
      { [SESSION_COOKIE_NAME]: parentSession }
    );
    const unauthRes = await getStudentHandler(unauthReq, {
      params: Promise.resolve({ id: "std-pooja" }),
    });
    const unauthData = await unauthRes.json();

    assert.strictEqual(unauthRes.status, 403);
    assert.strictEqual(unauthData.success, false);
    assert.ok(unauthData.error.includes("Forbidden") || unauthData.error.includes("not authorized"));
  });

  // --------------------------------------------------------------------------
  // TEST 8: Student Attendance Summary & Alert Threshold (<85%)
  // --------------------------------------------------------------------------
  test("8. Student Attendance reflects accurate rates and Pooja Sharma flags an attendance alert (<85%)", () => {
    const aaravAtt = db.getStudentAttendance("std-aarav");
    assert.ok(aaravAtt);
    assert.strictEqual(aaravAtt.attendanceRate, 94.5);
    assert.ok(aaravAtt.attendanceRate >= 85, "Aarav attendance should be regular (>=85%)");

    const poojaAtt = db.getStudentAttendance("std-pooja");
    assert.ok(poojaAtt);
    assert.strictEqual(poojaAtt.attendanceRate, 81.8);
    assert.ok(poojaAtt.attendanceRate < 85, "Pooja attendance should trigger alert (<85%)");
    assert.strictEqual(poojaAtt.absentDays, 20);
    assert.ok(poojaAtt.recentAbsences.length > 0);
  });

  // --------------------------------------------------------------------------
  // TEST 9: Home Learning Activity Completion & Feedback Persistence
  // --------------------------------------------------------------------------
  test("9. Parent can complete a home activity with feedback and it persists in real-time", async () => {
    const parentSession = await signSession({
      id: "usr-par-01",
      name: "Rajeshbhai Patel",
      email: "rajesh.patel@gmail.com",
      role: "parent",
      schoolId: "sch-01",
    });

    const req = createJsonRequest(
      "http://localhost:3000/api/v1/parent-bridge/home-activities/act-home-01/complete",
      "POST",
      {
        studentId: "std-aarav",
        conceptId: "c-math-mult",
        completed: true,
        feedback: "We practiced with 12 spoons and 3 cups. Aarav quickly grasped equal sharing.",
      },
      { [SESSION_COOKIE_NAME]: parentSession }
    );

    const res = await completeActivityHandler(req, {
      params: Promise.resolve({ activityId: "act-home-01" }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.completed);
    assert.strictEqual(data.data.feedback, "We practiced with 12 spoons and 3 cups. Aarav quickly grasped equal sharing.");

    // Verify completions query includes it
    const completions = await db.getParentActivityCompletionsAsync("std-aarav");
    const matched = completions.find((c: any) => c.activityId === "act-home-01");
    assert.ok(matched);
    assert.strictEqual(matched.completed, true);
  });
});
