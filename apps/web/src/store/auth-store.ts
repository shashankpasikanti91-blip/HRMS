import { create } from "zustand";
import api from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; tenantId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const result = data.data || data;
    localStorage.setItem("access_token", result.accessToken);
    localStorage.setItem("refresh_token", result.refreshToken);
    if (result.user?.tenantId) {
      localStorage.setItem("tenant_id", result.user.tenantId);
    }
    set({ user: result.user, isAuthenticated: true, isLoading: false });
  },

  register: async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    const result = data.data || data;
    localStorage.setItem("access_token", result.accessToken);
    localStorage.setItem("refresh_token", result.refreshToken);
    if (result.user?.tenantId) {
      localStorage.setItem("tenant_id", result.user.tenantId);
    }
    set({ user: result.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("tenant_id");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await api.get("/auth/users/me");
      const user = data.data || data;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
