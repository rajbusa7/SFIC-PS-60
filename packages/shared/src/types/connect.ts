import type { UserRole } from "./student";

export type ConversationType = "direct" | "class_group" | "announcement";

export interface ChatMessageAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface ChatMessageReadReceipt {
  userId: string;
  readAt: string;
}

export interface ChatMessageReplyContext {
  id: string;
  senderName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  text: string;
  textGujarati?: string;
  attachments?: ChatMessageAttachment[];
  replyTo?: ChatMessageReplyContext;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  readBy: ChatMessageReadReceipt[];
  isAnnouncement?: boolean;
  isPinned?: boolean;
  isReported?: boolean;
  reportReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  role: UserRole;
  email?: string;
  childName?: string;
  childGrade?: number;
  childSection?: string;
  joinedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  titleGujarati?: string;
  description?: string;
  classroomId?: string;
  grade?: number;
  section?: string;
  schoolId: string;
  avatarUrl?: string;
  participantIds: string[];
  adminIds: string[];
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageSenderName?: string;
  unreadCounts?: Record<string, number>; // userId -> number
  isPinned?: boolean;
  allowParentReplies?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatNotification {
  id: string;
  userId: string;
  conversationId: string;
  messageId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
