import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/api/auth.api";
import type { User } from "@/types/models";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  mustChangePassword: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
      mustChangePassword: false,

      login: async (email, password) => {
        const res = await authApi.login(email, password);
        const { accessToken, refreshToken, user, mustChangePassword } = res.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Fetch permissions after login
        let permissions: string[] = [];
        try {
          const permRes = await authApi.myPermissions();
          permissions = permRes.data.data.permissions;
        } catch {
          permissions = [];
        }

        set({ user, accessToken, refreshToken, permissions, isAuthenticated: true, mustChangePassword: mustChangePassword ?? false });
      },

      logout: async () => {
        const refreshToken = get().refreshToken;
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch {
          // ignore errors on logout
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        set({ user: null, accessToken: null, refreshToken: null, permissions: [], isAuthenticated: false, mustChangePassword: false });
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
        mustChangePassword: state.mustChangePassword,
      }),
    }
  )
);
