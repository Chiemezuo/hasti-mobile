import { create } from "zustand";
import type { UserProfile } from "@/api/endpoints/account";
import { clearTokens } from "./token-store";
import { queryClient } from "@/api/queryClient";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await clearTokens();
    queryClient.clear();
    set({ user: null });
  },
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.user !== null);
}

export function useIsRealtor(): boolean {
  return useAuthStore((s) => s.user?.roles.includes("REALTOR") ?? false);
}

export function useKycApproved(): boolean {
  return useAuthStore((s) => s.user?.kycApproved ?? false);
}
