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
  clearSession: () => void;
  register: (payload: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /** Immediately clear session data without an API call (used on token expiry). */
  clearSession: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

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
    get().clearSession();
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

      // Use a short AbortController timeout so a slow /auth/me never blocks the entire layout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const { data } = await api.get("/auth/me", { signal: controller.signal });
        clearTimeout(timeout);
        // Handle both direct response and wrapped { data: ... }
        const user: AuthUser = (data as { data?: AuthUser }).data ?? (data as AuthUser);
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (err: unknown) {
        clearTimeout(timeout);
        throw err;
      }
    } catch (err: unknown) {
      // Only clear tokens on explicit 401 (unauthorized) or AbortError.
      // Network errors / 5xx / timeouts should NOT log the user out.
      const status = (err as { response?: { status?: number } })?.response?.status;
      const isAbort = (err as { name?: string })?.name === "AbortError" ||
                      (err as { code?: string })?.code === "ERR_CANCELED";

      if (status === 401) {
        // Token is definitively invalid — clear session
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else if (isAbort) {
        // Request timed out — keep whatever session state we have, just stop loading
        // If user was previously authenticated (tokens exist), keep them authenticated
        const hasToken = !!localStorage.getItem("access_token");
        set({ isLoading: false, ...(hasToken ? {} : { user: null, isAuthenticated: false }) });
      } else {
        // Transient error (network down, 5xx) — preserve existing auth state
        set({ isLoading: false });
      }
    }
  },
}));

// ── Session expiry event handler ─────────────────────────────────────────────
// Listen for token refresh failures from the API interceptor
if (typeof window !== "undefined") {
  window.addEventListener("auth:session-expired", () => {
    useAuthStore.getState().clearSession();
  });
}
