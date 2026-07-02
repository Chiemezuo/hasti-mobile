import { apiFetch } from "../client";

export interface Conversation {
  id: string;
  status: string;
  role: "buyer" | "realtor";
  counterpart: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  property: {
    id: string;
    title: string;
    price: string;
    status: string;
    coverImage: {
      key: string;
      thumbnailKeys: Record<string, string>;
    } | null;
    path: string;
  };
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: "USER" | "REALTOR" | "SYSTEM";
  body: string | null;
  offerId: string | null;
  moderationFlags: string[];
  attachment: {
    objectId: string;
    type: "IMAGE" | "PDF";
    status: "PENDING" | "READY" | "FAILED";
  } | null;
  readAt: string | null;
  createdAt: string;
  mine: boolean;
}

export interface ConversationsResponse {
  items: Conversation[];
  nextCursor: string | null;
}

export interface MessagesResponse {
  messages: Message[];
  olderCursor: string | null;
}

export interface ConversationDetailResponse {
  conversation: Conversation;
  messages: Message[];
  olderCursor: string | null;
}

export async function getConversations(
  cursor?: string
): Promise<ConversationsResponse> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<ConversationsResponse>({ path: `/conversations${params}` });
}

export async function openConversation(propertyId: string): Promise<Conversation> {
  return apiFetch<Conversation>({
    path: "/conversations",
    method: "POST",
    body: JSON.stringify({ propertyId }),
  });
}

export async function getConversation(id: string): Promise<ConversationDetailResponse> {
  return apiFetch<ConversationDetailResponse>({ path: `/conversations/${id}` });
}

export async function getMessages(
  conversationId: string,
  opts: { before?: string; after?: string } = {}
): Promise<MessagesResponse> {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(opts).filter(([, v]) => v !== undefined)
    ) as Record<string, string>
  );
  return apiFetch<MessagesResponse>({
    path: `/conversations/${conversationId}/messages?${params}`,
  });
}

export async function sendMessage(
  conversationId: string,
  input: { body?: string; attachment?: { key: string; type: "IMAGE" | "PDF"; name: string } }
): Promise<Message> {
  return apiFetch<Message>({
    path: `/conversations/${conversationId}/messages`,
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function markRead(conversationId: string): Promise<void> {
  await apiFetch({
    path: `/conversations/${conversationId}/read`,
    method: "POST",
  });
}

export async function presignAttachment(
  conversationId: string,
  contentType: string
): Promise<{ url: string; key: string; expiresIn: number }> {
  return apiFetch({
    path: `/conversations/${conversationId}/attachments/presign`,
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export async function escalate(conversationId: string): Promise<void> {
  await apiFetch({
    path: `/conversations/${conversationId}/escalate`,
    method: "POST",
  });
}
