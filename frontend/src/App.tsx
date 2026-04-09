/**
 * App — application root.
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import RoleRoute from './routes/RoleRoute';
import { UserRole } from './types';

import MainLayout from './components/layout/MainLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';

import DashboardPage from './pages/dashboard/DashboardPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotificationPreferencesPage from './pages/notifications/NotificationPreferencesPage';
import BookingsPage from './pages/bookings/BookingsPage';
import CreateBookingPage from './pages/bookings/CreateBookingPage';
import TicketsPage from './pages/tickets/TicketsPage';
import ResourcesPage from './pages/resources/ResourcesPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ProfilePage from './pages/profile/ProfilePage';
import LoginHistoryPage from './pages/profile/LoginHistoryPage';

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
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/register"         element={<RegisterPage />} />
            <Route path="/oauth/callback"   element={<OAuthCallbackPage />} />
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/reset-password"   element={<ResetPasswordPage />} />
            <Route path="/forbidden"        element={<ForbiddenPage />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* ── Protected routes ── */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>

                <Route path="/dashboard"     element={<DashboardPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/notifications/preferences" element={<NotificationPreferencesPage />} />
                <Route path="/profile"       element={<ProfilePage />} />
                <Route path="/login-history" element={<LoginHistoryPage />} />
                
                {/* Booking Routes */}
                <Route path="/bookings"        element={<BookingsPage />} />
                <Route path="/bookings/create" element={<CreateBookingPage />} />
                
                <Route path="/tickets"       element={<TicketsPage />} />
                <Route path="/resources"     element={<ResourcesPage />} />

                {/* Admin-only routes */}
                <Route element={<RoleRoute allowedRoles={[UserRole.ADMIN]} />}>
                   <Route path="/admin/users" element={<UserManagementPage />} />
                </Route>

              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
