/**
 * useSessionTimeout — monitors the JWT access token's expiry and warns the
 * user before their session ends.
 *
 * Behaviour:
 *  - Reads the current access token from localStorage on every check.
 *  - Decodes the JWT payload (base64url → JSON) to extract the `exp` claim.
 *  - Polls every 30 seconds (POLL_INTERVAL_MS) so it stays lightweight.
 *  - When ≤ WARN_THRESHOLD_MS remain the warning becomes visible and a
 *    1-second countdown interval starts to keep secondsRemaining accurate.
 *  - When the token is already expired: calls logout() and redirects to /login.
 *  - extendSession() calls POST /auth/refresh, stores the new tokens, and
 *    immediately resets the warning without waiting for the next poll cycle.
 *
 * Usage (inside a component that lives inside BrowserRouter + AuthProvider):
 *   const { showWarning, secondsRemaining, extendSession } = useSessionTimeout();
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/axiosClient';
import { useAuth } from '@/context/AuthContext';
import type { ApiResponse, AuthResponse } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

/** How often (ms) the hook checks the token expiry in the background. */
const POLL_INTERVAL_MS   = 30_000;   // 30 seconds

/** How far before expiry (ms) the warning modal appears. */
const WARN_THRESHOLD_MS  = 120_000;  // 2 minutes

// ── JWT utility ───────────────────────────────────────────────────────────────

/**
 * Decodes the JWT payload and returns the `exp` claim as a Unix millisecond
 * timestamp, or `null` if the token is absent/malformed.
 *
 * JWT structure: base64url(header) . base64url(payload) . signature
 * The payload is the middle segment; `atob` handles standard base64.
 * We replace `-` → `+` and `_` → `/` for base64url → base64 compatibility.
 */
function getTokenExpiresAt(token: string | null): number | null {
  if (!token) return null;
  try {
    const b64Payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64Payload)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseSessionTimeoutReturn {
  /** Whether the "session expiring soon" warning should be displayed. */
  showWarning:      boolean;
  /** Approximate seconds until the token expires. Updated every second when the warning is visible. */
  secondsRemaining: number;
  /** Exchanges the refresh token for a new access token and dismisses the warning. */
  extendSession:    () => Promise<void>;
}

export function useSessionTimeout(): UseSessionTimeoutReturn {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [showWarning,      setShowWarning]      = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // ── Helper: perform one expiry check against the current localStorage token ──

  const checkExpiry = (): void => {
    const token     = localStorage.getItem(ACCESS_TOKEN_KEY);
    const expiresAt = getTokenExpiresAt(token);

    if (!expiresAt) return; // No token or unreadable — AuthContext handles the redirect.

    const msLeft = expiresAt - Date.now();

    if (msLeft <= 0) {
      // Token is already expired — force logout.
      logout();
      navigate('/login', { replace: true });
      return;
    }

    if (msLeft <= WARN_THRESHOLD_MS) {
      setShowWarning(true);
      setSecondsRemaining(Math.ceil(msLeft / 1000));
    } else {
      // Token has plenty of time left — dismiss any lingering warning.
      setShowWarning(false);
      setSecondsRemaining(0);
    }
  };

  // ── Background poll: runs every 30 seconds ────────────────────────────────

  useEffect(() => {
    checkExpiry(); // Run once immediately on mount / token change.

    const pollId = setInterval(checkExpiry, POLL_INTERVAL_MS);
    return () => clearInterval(pollId);

    // checkExpiry is a stable inline function; its dependencies (logout, navigate)
    // are stable references from React Router / React context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout, navigate]);

  // ── 1-second countdown: only active while the warning is visible ───────────

  useEffect(() => {
    if (!showWarning) return;

    const countdownId = setInterval(() => {
      const token     = localStorage.getItem(ACCESS_TOKEN_KEY);
      const expiresAt = getTokenExpiresAt(token);

      if (!expiresAt) return;

      const secs = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(secs);

      if (secs <= 0) {
        logout();
        navigate('/login', { replace: true });
      }
    }, 1000);

    return () => clearInterval(countdownId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWarning, logout, navigate]);

  // ── extendSession: refresh the token and reset the warning ───────────────

  const extendSession = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token available.');

      const { data } = await axiosClient.post<ApiResponse<AuthResponse>>(
        '/auth/refresh',
        { refreshToken },
      );

      // Persist the new token pair so all subsequent requests use them.
      localStorage.setItem(ACCESS_TOKEN_KEY,  data.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);

      // Immediately reset the warning — do not wait for the next 30-second poll.
      setShowWarning(false);
      setSecondsRemaining(0);
    } catch {
      // Refresh failed (token revoked / server error) — treat as a forced logout.
      logout();
      navigate('/login', { replace: true });
    }
  };

  return { showWarning, secondsRemaining, extendSession };
}
