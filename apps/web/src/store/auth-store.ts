import { create } from "zustand";
import api from "@/lib/api";
import type { AuthUser } from "@/types";

// ── Auth State ───────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  register: (payload: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /** Sign in with email/password against the FastAPI backend. */
  login: async (email: string, password: string) => {
    // FastAPI returns: { access_token, refresh_token, token_type, expires_in, user: { ... } }
    const { data } = await api.post("/auth/login", { email, password });

    const accessToken: string = data.access_token;
    const refreshToken: string = data.refresh_token;
    const user: AuthUser = data.user;

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);

    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => void 0);
      }
    } catch {
      // Ignore logout API errors – always clear session locally
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  /** Register a new account. */
  register: async (payload: { firstName: string; lastName: string; email: string; password: string }) => {
    const { data } = await api.post("/auth/register", {
      full_name: `${payload.firstName} ${payload.lastName}`.trim(),
      email: payload.email,
      password: payload.password,
    });
    const accessToken: string = data.access_token;
    const refreshToken: string = data.refresh_token;
    const user: AuthUser = data.user;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  /** Called on every page load to restore the session from stored tokens. */
  loadUser: async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // FastAPI current-user endpoint
      const { data } = await api.get("/auth/me");
      // Handle both direct response and wrapped { data: ... }
      const user: AuthUser = (data as { data?: AuthUser }).data ?? (data as AuthUser);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
