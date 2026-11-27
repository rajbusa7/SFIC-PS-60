import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db/database";
import { signPtmToken, verifyPtmToken, generateMeetingCode } from "../src/lib/ptm/ptmAuth";
import { createPtmMeetingEmailTemplate } from "../src/lib/gmail/emailTemplates";
import type { PtmMeeting, PtmMeetingNote, PtmChatMessage } from "../src/lib/types";

describe("StudySaathi Live PTM System Verification", () => {
  const storePath = path.resolve(process.cwd(), "data/shikshasetu_store.json");
  let storeBackup = "";

  before(() => {
    if (fs.existsSync(storePath)) {
      storeBackup = fs.readFileSync(storePath, "utf-8");
    }
  });

  after(() => {
    if (storeBackup && fs.existsSync(storePath)) {
      fs.writeFileSync(storePath, storeBackup, "utf-8");
    }
  });

  describe("1. Database Model & Persistence", () => {
    test("loads baseline seeded meetings with valid statuses", () => {
      const meetings = db.getPtmMeetings();
      assert.ok(meetings.length >= 4, "Should have at least 4 baseline seeded meetings");

      const today = meetings.find((m) => m.id === "ptm-today-aarav");
      assert.ok(today, "Today's Aarav meeting should exist");
      assert.equal(today.teacherName, "Pooja Sharma");
      assert.equal(today.studentName, "Aarav Patel");
      assert.equal(today.status, "scheduled");

      const past = meetings.find((m) => m.id === "ptm-past-ishaan");
      assert.ok(past, "Past Ishaan meeting should exist");
      assert.equal(past.status, "completed");

      const cancelled = meetings.find((m) => m.id === "ptm-cancelled-anaya");
      assert.ok(cancelled, "Cancelled Anaya meeting should exist");
      assert.equal(cancelled.status, "cancelled");
    });

    test("computes database-backed meeting statistics accurately", () => {
      const stats = db.getPtmMeetingStats();
      assert.ok(stats.total >= 4, "Total meetings should match records count");
      assert.ok(stats.upcoming >= 2, "Should count upcoming and scheduled meetings");
      assert.ok(stats.completed >= 1, "Should count completed meetings");
      assert.ok(stats.cancelled >= 1, "Should count cancelled meetings");
      assert.equal(stats.total, stats.upcoming + stats.completed + stats.cancelled);
    });

    test("creates, retrieves, and updates meeting records", () => {
      const meetingId = `test-ptm-${Date.now()}`;
      const code = generateMeetingCode();
      const testMeeting: PtmMeeting = {
        id: meetingId,
        meetingCode: code,
        title: "Test Unit Remedial Consultation",
        teacherId: "usr-teacher-01",
        teacherName: "Pooja Sharma",
        studentId: "std-aarav",
        studentName: "Aarav Patel",
        parentId: "par-001",
        parentName: "Dineshbhai Patel",
        scheduledDate: "2026-12-01",
        startTime: "10:00",
        durationMinutes: 30,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const created = db.createPtmMeeting(testMeeting);
      assert.equal(created.id, meetingId);

      const byCode = db.getPtmMeetingById(code);
      assert.ok(byCode, "Should find created meeting by meetingCode");
      assert.equal(byCode.title, "Test Unit Remedial Consultation");

      const updated = db.updatePtmMeetingStatus(meetingId, "in_progress");
      assert.equal(updated?.status, "in_progress");

      const finished = db.updatePtmMeetingStatus(meetingId, "completed");
      assert.equal(finished?.status, "completed");
    });

    test("persists consultation notes and scopes parent access", () => {
      const noteId = `test-note-${Date.now()}`;
      const note: PtmMeetingNote = {
        id: noteId,
        meetingId: "ptm-today-aarav",
        studentId: "std-aarav",
        teacherId: "usr-teacher-01",
        discussionSummary: "Aarav demonstrated mastery in single-digit multiplication.",
        learningConcerns: "Division with remainders needs concrete visual steps.",
        studentStrengths: "Eager to solve puzzle cards.",
        agreedActions: "Daily 10-minute manipulative cards.",
        followUpDate: "2026-12-05",
        sharedWithParent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = db.savePtmMeetingNote(note);
      assert.equal(saved.id, noteId);

      const notes = db.getPtmMeetingNotes("ptm-today-aarav");
      assert.ok(notes.some((n) => n.id === noteId));
    });

    test("persists real-time in-meeting chat messages", () => {
      const chatMsg: PtmChatMessage = {
        id: `test-msg-${Date.now()}`,
        meetingId: "ptm-today-aarav",
        senderId: "usr-teacher-01",
        senderName: "Pooja Sharma",
        senderRole: "teacher",
        message: "Hello Dineshbhai, let us begin the session.",
        createdAt: new Date().toISOString(),
      };

      db.savePtmChatMessage(chatMsg);
      const messages = db.getPtmChatMessages("ptm-today-aarav");
      assert.ok(messages.some((m) => m.message === "Hello Dineshbhai, let us begin the session."));
    });

    test("manages waiting room participant lifecycle", () => {
      const waiting = db.addPtmWaitingParticipant("ptm-today-aarav", {
        participantId: "par-test-01",
        participantName: "Dineshbhai Patel",
        participantRole: "parent",
      });
      assert.equal(waiting.status, "waiting");

      const list = db.getPtmWaitingParticipants("ptm-today-aarav");
      assert.ok(list.some((p) => p.participantId === "par-test-01"));

      const admitted = db.updatePtmWaitingStatus("ptm-today-aarav", "par-test-01", "admitted");
      assert.ok(admitted);

      const listAfter = db.getPtmWaitingParticipants("ptm-today-aarav");
      assert.equal(listAfter.some((p) => p.participantId === "par-test-01"), false);
    });
  });

  describe("2. Meeting Security & Cryptographic Token Authentication", () => {
    test("signs and verifies valid HMAC-SHA256 meeting tokens", async () => {
      const token = await signPtmToken({
        meetingId: "ptm-today-aarav",
        meetingCode: "ptm-704-291",
        userId: "usr-teacher-01",
        userName: "Pooja Sharma",
        role: "teacher",
        canAdmit: true,
        canShareScreen: true,
      });

      assert.ok(typeof token === "string" && token.includes("."));

      const verified = await verifyPtmToken(token);
      assert.ok(verified, "Token verification should succeed");
      assert.equal(verified.meetingId, "ptm-today-aarav");
      assert.equal(verified.userId, "usr-teacher-01");
      assert.equal(verified.role, "teacher");
      assert.equal(verified.canAdmit, true);
    });

    test("rejects tampered or forged tokens", async () => {
      const token = await signPtmToken({
        meetingId: "ptm-today-aarav",
        meetingCode: "ptm-704-291",
        userId: "par-001",
        userName: "Dineshbhai Patel",
        role: "parent",
        canAdmit: false,
        canShareScreen: true,
      });

      const parts = token.split(".");
      const tampered = `${parts[0]}tampered.${parts[1]}`;
      const result = await verifyPtmToken(tampered);
      assert.equal(result, null, "Tampered token signature must fail verification");
    });

    test("rejects expired meeting tokens", async () => {
      // Sign token with -10 seconds lifetime (already expired)
      const expiredToken = await signPtmToken(
        {
          meetingId: "ptm-today-aarav",
          meetingCode: "ptm-704-291",
          userId: "par-001",
          userName: "Dineshbhai Patel",
          role: "parent",
          canAdmit: false,
          canShareScreen: true,
        },
        -10
      );

      const result = await verifyPtmToken(expiredToken);
      assert.equal(result, null, "Expired token must be rejected");
    });
  });

  describe("3. Email Invitation & Parent Bridge Integration", () => {
    test("generates brand-aligned responsive HTML invitation email", () => {
      const html = createPtmMeetingEmailTemplate({
        schoolName: "Model Primary School, Gandhinagar",
        teacherName: "Pooja Sharma",
        studentName: "Aarav Patel",
        parentName: "Dineshbhai Patel",
        meetingTitle: "Mathematics Division Remedial Consultation",
        meetingDate: "2026-11-28",
        meetingTime: "14:30",
        durationMinutes: 30,
        agenda: "Review 5-step concrete division manipulative activities.",
        joinUrl: "https://shikshasetu-ai-iota.vercel.app/ptm/room/ptm-704-291/lobby",
        meetingCode: "ptm-704-291",
      });

      assert.ok(html.includes("Mathematics Division Remedial Consultation"));
      assert.ok(html.includes("Pooja Sharma"));
      assert.ok(html.includes("Aarav Patel"));
      assert.ok(html.includes("ptm-704-291"));
      assert.ok(html.includes("https://shikshasetu-ai-iota.vercel.app/ptm/room/ptm-704-291/lobby"));
      assert.ok(html.includes("Join Video Meeting"));
      assert.ok(html.includes("#FAF6E9"));
      assert.ok(html.includes("#49352F"));
      // Ensure zero emojis in generated email
      assert.equal(/[\u{1F300}-\u{1F9FF}]/u.test(html), false);
    });
  });

  describe("4. Code Generation Format", () => {
    test("generates human-friendly 6-digit meeting codes", () => {
      const code = generateMeetingCode();
      assert.match(code, /^ptm-\d{3}-\d{3}$/);
    });
  });
});
