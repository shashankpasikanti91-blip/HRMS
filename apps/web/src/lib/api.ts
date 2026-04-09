import axios from "axios";

// FastAPI backend base URL – set NEXT_PUBLIC_API_URL in .env.local / .env.production
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL as string) ||
  "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request interceptor: attach JWT + company header ────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: automatic token refresh on 401 ────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          // FastAPI token format: { access_token, refresh_token, token_type, expires_in }
          const { data } = await axios.post(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken },
          );
          const newAccess: string = data.access_token;
          const newRefresh: string = data.refresh_token ?? refreshToken;
          localStorage.setItem("access_token", newAccess);
          localStorage.setItem("refresh_token", newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export { API_BASE_URL };
