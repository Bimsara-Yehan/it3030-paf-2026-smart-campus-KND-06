/**
 * Axios HTTP client for the Smart Campus API.
 *
 * Responsibilities:
 *  - Set base URL to /api/v1 (Vite proxies this to http://localhost:8080)
 *  - Attach the Bearer access token to every outgoing request
 *  - On a 401 response, silently refresh the access token and retry
 *  - If the refresh itself fails, clear local storage and redirect to /login
 */

import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// ── Storage keys (exported so AuthContext can reuse them) ────────────────────
export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

const BASE_URL = '/api/v1';

// Create a dedicated instance so we never accidentally modify axios globals.
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token-refresh state ───────────────────────────────────────────────────────

/** Whether a refresh request is already in flight. */
let isRefreshing = false;

/** Requests that arrived while a refresh was in progress. */
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** Flush the pending queue once a new token is available (or on failure). */
function flushQueue(error: unknown, token: string | null = null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

function clearAuthAndRedirect() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.location.href = '/login';
}

// ── Request interceptor ───────────────────────────────────────────────────────

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Extend the config type to track whether we already retried.
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // If another refresh is already running, queue this request.
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    try {
      // Use a plain axios call (not axiosClient) to avoid interceptor loops.
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

      // Backend wraps the payload: { success, message, data: AuthResponse }
      const auth = data.data;
      const newAccessToken: string = auth.accessToken;
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      if (auth.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      }

      flushQueue(null, newAccessToken);

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
