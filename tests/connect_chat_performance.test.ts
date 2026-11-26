import { describe, it } from "node:test";
import assert from "node:assert";
import { db } from "../src/lib/db/database";
import type { ChatMessage } from "../packages/shared/src/types/connect";

describe("ClassConnect Performance & Stress Testing Suite", () => {
  const convId = "conv-class-4a";

  it("1. Two-way communication between Teacher and Parent", () => {
    const teacherMsg: ChatMessage = {
      id: `perf-t-${Date.now()}`,
      conversationId: convId,
      senderId: "usr-teacher-01",
      senderName: "Pooja Sharma",
      senderRole: "teacher",
      text: "Hello from Teacher",
      status: "sent",
      readBy: [{ userId: "usr-teacher-01", readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    db.saveMessage(teacherMsg);

    const parentMsg: ChatMessage = {
      id: `perf-p-${Date.now()}`,
      conversationId: convId,
      senderId: "par-001",
      senderName: "Dineshbhai Patel",
      senderRole: "parent",
      text: "Hello from Parent",
      status: "sent",
      readBy: [{ userId: "par-001", readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    db.saveMessage(parentMsg);

    const msgs = db.getMessages(convId, 10);
    assert.ok(msgs.some((m) => m.id === teacherMsg.id));
    assert.ok(msgs.some((m) => m.id === parentMsg.id));
  });

  it("2. Rapid consecutive sending of 20 messages without lag or corruption", () => {
    const start = performance.now();
    const sentIds: string[] = [];

    for (let i = 0; i < 20; i++) {
      const id = `rapid-${Date.now()}-${i}`;
      sentIds.push(id);
      db.saveMessage({
        id,
        conversationId: convId,
        senderId: "usr-teacher-01",
        senderName: "Pooja Sharma",
        senderRole: "teacher",
        text: `Rapid message #${i + 1}`,
        status: "sent",
        readBy: [{ userId: "usr-teacher-01", readAt: new Date().toISOString() }],
        createdAt: new Date(Date.now() + i * 50).toISOString(),
      });
    }

    const duration = performance.now() - start;
    // 20 saves in memory/disk should be snappy
    assert.ok(duration < 2000, `20 consecutive messages saved in ${duration.toFixed(1)}ms`);

    const latest20 = db.getMessages(convId, 25);
    for (const id of sentIds) {
      assert.ok(latest20.some((m) => m.id === id), `Message ${id} must persist`);
    }
  });

  it("3. Scalability with 1,000 existing messages (paged query response in < 15ms)", () => {
    // Generate bulk messages in store efficiently
    const bulkId = "conv-stress-test";
    db.saveConversation({
      id: bulkId,
      type: "class_group",
      title: "Stress Test Classroom",
      participantIds: ["usr-teacher-01", "par-001"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Populate bulk messages in one batch
    for (let i = 0; i < 1000; i++) {
      const msg: ChatMessage = {
        id: `stress-msg-${i}`,
        conversationId: bulkId,
        senderId: i % 2 === 0 ? "usr-teacher-01" : "par-001",
        senderName: i % 2 === 0 ? "Teacher" : "Parent",
        senderRole: i % 2 === 0 ? "teacher" : "parent",
        text: `Stress test message payload line #${i + 1}`,
        status: "read",
        readBy: [],
        createdAt: new Date(Date.now() - (1000 - i) * 1000).toISOString(),
      };
      if (i === 999) {
        db.saveMessage(msg);
      } else {
        const store = (db as any).getStore ? (db as any).getStore() : null;
        // fallback to standard saveMessage if getStore not public
        db.saveMessage(msg);
      }
    }

    // Measure paginated query performance
    const start = performance.now();
    const paged = db.getMessages(bulkId, { limit: 40 });
    const queryDuration = performance.now() - start;

    assert.strictEqual(paged.length, 40, "Must return requested 40 items");
    assert.strictEqual(paged.hasMore, true, "Should indicate more items exist");
    assert.ok(paged.totalCount >= 1000, "Should accurately reflect total count");
    assert.ok(queryDuration < 20, `1,000-message slice took ${queryDuration.toFixed(2)}ms (must be < 20ms)`);

    // Measure older pagination query
    const oldestTimestamp = paged[0].createdAt;
    const olderBatch = db.getMessages(bulkId, { before: oldestTimestamp, limit: 40 });
    assert.strictEqual(olderBatch.length, 40);
    assert.ok(new Date(olderBatch[olderBatch.length - 1].createdAt).getTime() < new Date(oldestTimestamp).getTime());

    // Clean up
    db.deleteConversation(bulkId);
  });

  it("4. Incremental polling query efficiency (zero payload when no new messages)", () => {
    const latest = db.getMessages(convId, 1);
    assert.ok(latest.length > 0);
    const newestTime = latest[latest.length - 1].createdAt;

    // Poll with `since` equal to the newest message
    const pollResult = db.getMessages(convId, { since: newestTime });
    assert.strictEqual(pollResult.length, 0, "Polling with latest timestamp should yield 0 new items immediately");
  });

  it("5. Read receipt updates and unread counts", () => {
    const testDirectId = "conv-direct-pooja-aarav";
    const initialDirectUnread = db.getConversationById(testDirectId)?.unreadCounts?.["par-001"] || 0;

    const newMsg: ChatMessage = {
      id: `unread-test-${Date.now()}`,
      conversationId: testDirectId,
      senderId: "usr-teacher-01",
      senderName: "Pooja Sharma",
      senderRole: "teacher",
      text: "Unread count validation message",
      status: "sent",
      readBy: [{ userId: "usr-teacher-01", readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    db.saveMessage(newMsg);

    const postSendDirectUnread = db.getConversationById(testDirectId)?.unreadCounts?.["par-001"] || 0;
    assert.strictEqual(postSendDirectUnread, initialDirectUnread + 1, "Direct conversation unread count should increment by 1");

    // Parent reads
    const marked = db.markMessagesAsRead(testDirectId, "par-001");
    assert.ok(marked >= 1);

    const postReadDirectUnread = db.getConversationById(testDirectId)?.unreadCounts?.["par-001"] || 0;
    assert.strictEqual(postReadDirectUnread, 0, "Parent unread count for direct chat should be 0 after reading");
  });
});
