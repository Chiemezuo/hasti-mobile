import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "hasti_at";
const REFRESH_KEY = "hasti_rt";
const EXPIRY_KEY = "hasti_at_exp";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function saveTokens(pair: TokenPair): Promise<void> {
  const expiry = Date.now() + pair.expiresIn * 1000;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, pair.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, pair.refreshToken),
    SecureStore.setItemAsync(EXPIRY_KEY, String(expiry)),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function getTokenExpiry(): Promise<number | null> {
  const val = await SecureStore.getItemAsync(EXPIRY_KEY);
  return val ? Number(val) : null;
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(EXPIRY_KEY),
  ]);
}

export async function isTokenExpiringSoon(): Promise<boolean> {
  const expiry = await getTokenExpiry();
  if (!expiry) return true;
  // Refresh at 80% of lifetime (access token is ~15min = 900s; 80% = 720s)
  return Date.now() > expiry - 180_000;
}
