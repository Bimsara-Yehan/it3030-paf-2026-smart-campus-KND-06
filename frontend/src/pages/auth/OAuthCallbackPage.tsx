/**
 * OAuthCallbackPage — completes the Google OAuth2 login flow.
 *
 * The Spring Boot OAuth2SuccessHandler redirects here after Google authenticates
 * the user and the backend issues JWT tokens:
 *
 *   http://localhost:5173/oauth/callback?token=<accessToken>&refreshToken=<refreshToken>
 *
 * This page:
 *  1. Reads both tokens from the URL query parameters.
 *  2. Stores them in localStorage under the exact keys used by axiosClient
 *     ('accessToken' and 'refreshToken') so the request interceptor picks them up.
 *  3. Calls GET /auth/me to retrieve the authenticated user's profile.
 *     (The axiosClient interceptor automatically attaches the token we just stored.)
 *  4. Hydrates AuthContext via loginWithTokens() so the rest of the SPA treats
 *     the user as logged in without a full page reload.
 *  5. Navigates to /dashboard using React Router (SPA navigation — no hard refresh).
 *
 * If the URL contains no token, or the /auth/me call fails, the user is redirected
 * to /login with error=oauth_failed so the login form can show an appropriate message.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import type { ApiResponse, User } from '../../types';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuth();

  useEffect(() => {
    // ── 1. Extract tokens from the URL ───────────────────────────────────────
    // The backend sends "token" (not "accessToken") as the query-param name.
    // Support both in case the backend config ever changes.
    const accessToken =
      searchParams.get('token') ?? searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken) {
      // No token in URL — either the backend failed or the URL was tampered with.
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // ── 2. Write tokens to localStorage immediately ───────────────────────────
    // axiosClient's request interceptor reads ACCESS_TOKEN_KEY on every request,
    // so storing here ensures the upcoming /auth/me call is authenticated.
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // ── 3 & 4. Fetch user profile and hydrate AuthContext ────────────────────
    axiosClient
      .get<ApiResponse<User>>('/auth/me')
      .then(({ data }) => {
        const user = data.data;

        // loginWithTokens writes tokens to localStorage (idempotent) AND
        // updates the in-memory AuthContext state (user + accessToken).
        // This is the key step: without it the SPA wouldn't know the user
        // is logged in until the next full page load.
        loginWithTokens(accessToken, refreshToken ?? '', user);

        // ── 5. SPA navigate to dashboard ─────────────────────────────────────
        // Using navigate() (not window.location.replace) keeps the React tree
        // alive and avoids a second AuthContext initialisation round-trip.
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        // /auth/me rejected the token — clear storage and send back to login.
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        navigate('/login?error=oauth_failed', { replace: true });
      });

    // loginWithTokens is stable (defined inside AuthProvider, never recreated),
    // but including it silences the exhaustive-deps lint rule correctly.
  }, [navigate, searchParams, loginWithTokens]);

  // ── Loading UI shown while /auth/me is in flight ───────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Completing sign-in…</p>
      </div>
    </div>
  );
}
