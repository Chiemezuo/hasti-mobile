import { apiFetch } from "../client";

export interface Notification {
  id: string;
  event: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  groups: NotificationGroup[];
}

export interface NotificationGroup {
  key: string;
  label: string;
  locked: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
  };
}

export interface NotificationsResponse {
  items: Notification[];
  nextCursor: string | null;
}

export async function getNotifications(
  cursor?: string
): Promise<NotificationsResponse> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<NotificationsResponse>({ path: `/notifications${params}` });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>({ path: "/notifications/unread-count" });
}

export async function markNotificationsRead(
  ids?: string[]
): Promise<void> {
  await apiFetch({
    path: "/notifications/read",
    method: "POST",
    body: JSON.stringify(ids ? { ids } : { all: true }),
  });
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>({
    path: "/notifications/preferences",
  });
}

export async function updateNotificationPreferences(
  overrides: Record<string, { inApp?: boolean; email?: boolean }>
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>({
    path: "/notifications/preferences",
    method: "PUT",
    body: JSON.stringify({ overrides }),
  });
}

export async function getRealtimeToken(): Promise<{ token: string }> {
  return apiFetch<{ token: string }>({ path: "/realtime/token" });
}
