import { describe, it } from "node:test";
import assert from "node:assert";
import { db } from "@/lib/db/database";
import type { ChatMessage, Conversation } from "@/lib/types";

describe("ShikshaSetu Connect — WhatsApp-Style Parent-Teacher Chat System", () => {
  it("1. Database initializes with seeded announcements, class groups, and direct chats", () => {
    const convs = db.getConversations();
    assert.ok(convs.length >= 5, "Should have at least 5 default conversations");

    const announcements = convs.find((c) => c.type === "announcement");
    assert.ok(announcements, "Should have school announcements channel");
    assert.strictEqual(announcements.isPinned, true, "Announcements channel should be pinned");

    const class4a = convs.find((c) => c.classroomId === "cls-4a");
    assert.ok(class4a, "Should have Class 4A group");
    assert.strictEqual(class4a.type, "class_group");

    const direct = convs.find((c) => c.type === "direct");
    assert.ok(direct, "Should have direct parent-teacher chat");
  });

  it("2. Teacher and Parent can send and retrieve two-way direct private messages", () => {
    const convs = db.getConversations("usr-teacher-01", "teacher");
    const directConv = convs.find((c) => c.type === "direct");
    assert.ok(directConv, "Teacher should access direct conversation");

    const testMsgText = "Aarav completed the remedial worksheet on division with 85% accuracy!";
    const newMsg: ChatMessage = {
      id: `msg-test-${Date.now()}`,
      conversationId: directConv.id,
      senderId: "usr-teacher-01",
      senderName: "Pooja Sharma",
      senderRole: "teacher",
      text: testMsgText,
      status: "sent",
      readBy: [{ userId: "usr-teacher-01", readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };

    db.saveMessage(newMsg);

    const messages = db.getMessages(directConv.id);
    const saved = messages.find((m) => m.id === newMsg.id);
    assert.ok(saved, "Message should be saved and persistent in database");
    assert.strictEqual(saved.text, testMsgText);

    // Parent replies
    const parentReplyText = "Thank you Pooja Madam, we are continuing the practice daily.";
    const parentReplyMsg: ChatMessage = {
      id: `msg-parent-${Date.now()}`,
      conversationId: directConv.id,
      senderId: "par-001",
      senderName: "Dineshbhai Patel",
      senderRole: "parent",
      text: parentReplyText,
      replyTo: {
        id: newMsg.id,
        senderName: "Pooja Sharma",
        text: testMsgText.substring(0, 50),
      },
      status: "sent",
      readBy: [{ userId: "par-001", readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };

    db.saveMessage(parentReplyMsg);

    const updatedMessages = db.getMessages(directConv.id);
    const lastMsg = updatedMessages[updatedMessages.length - 1];
    assert.strictEqual(lastMsg.text, parentReplyText);
    assert.ok(lastMsg.replyTo, "Reply context should be preserved");
    assert.strictEqual(lastMsg.replyTo?.id, newMsg.id);
  });

  it("3. Class Group Chat allows sharing worksheets and notices to enrolled parents", () => {
    const class4a = db.getConversations().find((c) => c.classroomId === "cls-4a");
    assert.ok(class4a);

    const worksheetMsg: ChatMessage = {
      id: `msg-ws-${Date.now()}`,
      conversationId: class4a.id,
      senderId: "usr-teacher-01",
      senderName: "Pooja Sharma",
      senderRole: "teacher",
      text: "Please find attached the homework worksheet for Class 4 Mathematics.",
      attachments: [
        {
          id: "att-ws-math",
          name: "Std4_Math_Homework.pdf",
          url: "/docs/std4_math.pdf",
          size: 154000,
          mimeType: "application/pdf",
        },
      ],
      status: "sent",
      readBy: [{ userId: "usr-teacher-01", readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };

    db.saveMessage(worksheetMsg);

    const messages = db.getMessages(class4a.id);
    const retrieved = messages.find((m) => m.id === worksheetMsg.id);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.attachments?.length, 1);
    assert.strictEqual(retrieved.attachments[0].name, "Std4_Math_Homework.pdf");
  });

  it("4. Role-based isolation: Class 4 parent cannot access Class 1 or Class 2 group", () => {
    // Rajeshbhai / Dineshbhai is parent of Aarav (Class 4A only)
    const parentConvs = db.getConversations("par-001", "parent");

    const hasClass4A = parentConvs.some((c) => c.classroomId === "cls-4a");
    assert.strictEqual(hasClass4A, true, "Parent of Aarav must have access to Class 4A group");

    const hasClass1A = parentConvs.some((c) => c.classroomId === "cls-1a");
    assert.strictEqual(hasClass1A, false, "Parent of Aarav must NOT have access to Class 1A group");

    const hasClass2A = parentConvs.some((c) => c.classroomId === "cls-2a");
    assert.strictEqual(hasClass2A, false, "Parent of Aarav must NOT have access to Class 2A group");
  });

  it("5. Read receipts and unread badge counters calculate accurately", () => {
    const class4a = db.getConversations().find((c) => c.classroomId === "cls-4a");
    assert.ok(class4a);

    const parentId = "par-001";
    const newMsg: ChatMessage = {
      id: `msg-unread-${Date.now()}`,
      conversationId: class4a.id,
      senderId: "usr-teacher-01",
      senderName: "Pooja Sharma",
      senderRole: "teacher",
      text: "Notice: School timing tomorrow will be 8:00 AM to 12:30 PM.",
      status: "sent",
      readBy: [{ userId: "usr-teacher-01", readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };

    db.saveMessage(newMsg);

    const unreadCountBefore = db.getUnreadChatCount(parentId);
    assert.ok(unreadCountBefore > 0, "Unread count for parent should be greater than 0");

    // Parent views and marks conversation as read
    const markedCount = db.markMessagesAsRead(class4a.id, parentId);
    assert.ok(markedCount >= 1, "Should mark messages as read");

    const readMessages = db.getMessages(class4a.id);
    const targetMsg = readMessages.find((m) => m.id === newMsg.id);
    assert.strictEqual(targetMsg?.status, "read");
    assert.ok(targetMsg?.readBy.some((r) => r.userId === parentId));
  });

  it("6. Message reporting records report reason for administrative review", () => {
    const msgs = db.getMessages("conv-class-4a");
    assert.ok(msgs.length > 0);
    const testMsgId = msgs[0].id;

    const reported = db.reportMessage(testMsgId, "Contains outdated homework date");
    assert.strictEqual(reported, true);

    const updated = db.getMessages("conv-class-4a").find((m) => m.id === testMsgId);
    assert.strictEqual(updated?.isReported, true);
    assert.strictEqual(updated?.reportReason, "Contains outdated homework date");
  });
});
