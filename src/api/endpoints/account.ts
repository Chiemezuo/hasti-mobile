import { apiFetch } from "../client";

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycApproved: boolean;
  createdAt: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    businessName: string | null;
    cacNumber: string | null;
    address: string | null;
  } | null;
}

export interface Session {
  id: string;
  device: string | null;
  ip: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  current: boolean;
}

export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>({ path: "/me" });
}

export async function patchMe(data: {
  displayName?: string;
  bio?: string;
  address?: string;
  avatarKey?: string;
  businessName?: string;
  cacNumber?: string;
}): Promise<{ profile: UserProfile["profile"] }> {
  return apiFetch<{ profile: UserProfile["profile"] }>({
    path: "/me",
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function presignAvatar(
  contentType: string
): Promise<{ url: string; key: string; maxSize: number; expiresIn: number }> {
  return apiFetch({ path: "/me/avatar/presign", method: "POST", body: JSON.stringify({ contentType }) });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ revokedOtherSessions: number }> {
  return apiFetch({ path: "/me/password", method: "POST", body: JSON.stringify(input) });
}

export async function getSessions(): Promise<{ sessions: Session[] }> {
  return apiFetch<{ sessions: Session[] }>({ path: "/me/sessions" });
}

export async function deleteSession(id: string): Promise<void> {
  await apiFetch({ path: `/me/sessions/${id}`, method: "DELETE" });
}

export async function exportData(): Promise<unknown> {
  return apiFetch({ path: "/me/export" });
}

export async function closeAccount(password: string): Promise<void> {
  await apiFetch({ path: "/me/close", method: "POST", body: JSON.stringify({ password }) });
}
