/**
 * App — application root.
 *
 * Wires together:
 *  - React Query's QueryClientProvider (server-state caching)
 *  - AuthProvider (JWT auth context)
 *  - React Router's BrowserRouter + route tree
 *
 * Route structure:
 *  /                   → redirect to /dashboard
 *  /login              → LoginPage          (public)
 *  /oauth/callback     → OAuthCallbackPage  (public)
 *  /forbidden          → ForbiddenPage      (public)
 *  /dashboard          → DashboardPage      (requires auth)
 *  /notifications      → NotificationsPage  (requires auth)
 *  *                   → redirect to /dashboard
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/context/AuthContext';
import PrivateRoute from '@/routes/PrivateRoute';

import LoginPage from '@/pages/auth/LoginPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import ForbiddenPage from '@/pages/errors/ForbiddenPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* ── Protected routes ── */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
