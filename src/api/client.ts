import Constants from "expo-constants";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "@/auth/token-store";
import type { ProblemDetail } from "@/lib/problem";

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3100";

const API_BASE = `${BASE_URL}/api/v1`;

// Token response shape — hand-typed until @hasti/contracts adds authTokenResponseSchema
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

// Single-flight refresh state
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = await getRefreshToken();
  if (!rt) return null;

  const res = await fetch(`${API_BASE}/auth/token/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const data: TokenResponse = await res.json();
  await saveTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  });
  return data.accessToken;
}

async function refreshOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// The public AUTH endpoints that must never have a bearer token
const PUBLIC_PATHS = new Set([
  "/auth/register",
  "/auth/login",
  "/auth/token/refresh",
  "/auth/otp/verify",
  "/auth/otp/request",
  "/auth/password/forgot",
  "/auth/password/reset",
  "/auth/logout",
  "/geo/suggest",
  "/contact",
]);

function isPublicPath(path: string): boolean {
  for (const pub of PUBLIC_PATHS) {
    if (path.startsWith(pub)) return true;
  }
  return false;
}

type ApiFetchOptions = RequestInit & {
  path: string;
};

export async function apiFetch<T>(options: ApiFetchOptions): Promise<T> {
  const { path, ...init } = options;
  const url = `${API_BASE}${path}`;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!isPublicPath(path)) {
    const at = await getAccessToken();
    if (at) headers.set("Authorization", `Bearer ${at}`);
  }

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401 && !isPublicPath(path)) {
    const newAt = await refreshOnce();
    if (!newAt) {
      // Refresh failed — caller should hard-logout
      throw new AuthError("Session expired");
    }
    headers.set("Authorization", `Bearer ${newAt}`);
    res = await fetch(url, { ...init, headers });
  }

  if (!res.ok) {
    let problem: ProblemDetail;
    try {
      problem = await res.json();
    } catch {
      problem = {
        type: "about:blank",
        title: res.statusText || "Request failed",
        status: res.status,
      };
    }
    throw new ApiError(problem);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetail) {
    super(problem.title);
    this.name = "ApiError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
