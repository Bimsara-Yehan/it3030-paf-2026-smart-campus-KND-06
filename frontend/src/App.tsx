/**
 * App — application root.
 *
 * Wires together:
 *  - React Query's QueryClientProvider (server-state caching)
 *  - AuthProvider (JWT auth context)
 *  - React Router's BrowserRouter + route tree
 *
 * Route structure:
 *  /                     → redirect to /dashboard
 *  /login                → LoginPage              (public)
 *  /oauth/callback       → OAuthCallbackPage      (public)
 *  /forbidden            → ForbiddenPage          (public)
 *
 *  All routes below require authentication (PrivateRoute) and are
 *  rendered inside MainLayout (sidebar + topbar):
 *  /dashboard            → DashboardPage
 *  /notifications        → NotificationsPage
 *  /bookings             → BookingsPage
 *  /tickets              → TicketsPage
 *  /resources            → ResourcesPage
 *  /admin/users          → UserManagementPage     (ADMIN only, via RoleRoute)
 *
 *  *                     → redirect to /dashboard
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/context/AuthContext';
import PrivateRoute from '@/routes/PrivateRoute';
import RoleRoute from '@/routes/RoleRoute';
import { UserRole } from '@/types';

import MainLayout from '@/components/layout/MainLayout';

import LoginPage from '@/pages/auth/LoginPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import ForbiddenPage from '@/pages/errors/ForbiddenPage';

import DashboardPage from '@/pages/dashboard/DashboardPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import BookingsPage from '@/pages/bookings/BookingsPage';
import TicketsPage from '@/pages/tickets/TicketsPage';
import ResourcesPage from '@/pages/resources/ResourcesPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';

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
            {/* ── Public routes (no auth, no layout) ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* ── Protected routes — wrapped in PrivateRoute + MainLayout ── */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>

                {/* Available to all authenticated roles */}
                <Route path="/dashboard"     element={<DashboardPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/bookings"      element={<BookingsPage />} />
                <Route path="/tickets"       element={<TicketsPage />} />
                <Route path="/resources"     element={<ResourcesPage />} />

                {/* Admin-only routes — RoleRoute enforces the ADMIN role */}
                <Route element={<RoleRoute allowedRoles={[UserRole.ADMIN]} />}>
                  <Route path="/admin/users" element={<UserManagementPage />} />
                </Route>

              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
