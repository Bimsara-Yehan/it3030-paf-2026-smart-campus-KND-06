/**
 * OAuthCallbackPage — handles the redirect from Spring Security after
 * a successful Google OAuth2 login.
 *
 * Spring Boot appends the JWT tokens as query parameters, e.g.:
 *   /oauth/callback?token=<accessToken>&refreshToken=<refreshToken>
 *
 * This page:
 *  1. Reads the tokens from the URL
 *  2. Persists them to localStorage
 *  3. Performs a hard redirect to /dashboard so AuthProvider re-initialises
 *     and fetches the current user from /auth/me
 *
 * If no token is found the user is sent back to /login with an error flag.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/axiosClient';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // The parameter name may differ depending on your Spring Boot configuration.
    // Support both "token" and "accessToken" to be safe.
    const accessToken =
      searchParams.get('token') ?? searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Hard-redirect so AuthProvider's useEffect fires with the new token.
    window.location.replace('/dashboard');
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Completing sign-in…</p>
      </div>
    </div>
  );
}
