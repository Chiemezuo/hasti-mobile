import { apiFetch } from "../client";
import { saveTokens } from "@/auth/token-store";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
  role?: "USER" | "REALTOR";
  acceptTerms: true;
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
}

export type OtpPurpose = "SIGNUP" | "RESET" | "LOGIN_2FA" | "BANK_LINK";

export interface OtpRequestInput {
  email?: string;
  phone?: string;
  purpose: OtpPurpose;
}

export interface OtpVerifyInput {
  email?: string;
  phone?: string;
  purpose: OtpPurpose;
  code: string;
}

export async function register(input: RegisterInput): Promise<void> {
  await apiFetch({ path: "/auth/register", method: "POST", body: JSON.stringify(input) });
}

export async function login(input: LoginInput): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>({
    path: "/auth/login",
    method: "POST",
    body: JSON.stringify(input),
  });
  await saveTokens(data);
  return data;
}

export async function requestOtp(input: OtpRequestInput): Promise<void> {
  await apiFetch({ path: "/auth/otp/request", method: "POST", body: JSON.stringify(input) });
}

export async function verifyOtp(input: OtpVerifyInput): Promise<void> {
  await apiFetch({ path: "/auth/otp/verify", method: "POST", body: JSON.stringify(input) });
}

export async function forgotPassword(input: { email?: string; phone?: string }): Promise<void> {
  await apiFetch({
    path: "/auth/password/forgot",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resetPassword(input: {
  email?: string;
  phone?: string;
  code: string;
  password: string;
}): Promise<void> {
  await apiFetch({ path: "/auth/password/reset", method: "POST", body: JSON.stringify(input) });
}

export async function logout(): Promise<void> {
  await apiFetch({ path: "/auth/logout", method: "POST" }).catch(() => {});
}
