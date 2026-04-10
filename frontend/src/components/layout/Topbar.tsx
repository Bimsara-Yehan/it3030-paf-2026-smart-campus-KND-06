/**
 * Topbar — fixed-height application header rendered above the page content.
 *
 * Displays:
 *  - Application name on the left
 *  - Notification bell, user's full name, and sign-out button on the right
 *
 * Height is fixed at 64px (h-16) to match the top-offset applied to the
 * scrollable content area in MainLayout.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/layout/NotificationBell';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <span className="text-base font-semibold text-gray-800 tracking-tight flex items-center gap-2">
        <img src="/logo.png" alt="Oakridge Logo" className="h-10 w-auto" />
      </span>

      {/* ── Right: actions cluster ── */}
      <div className="flex items-center gap-3">
        {/* Notification bell with unread badge */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" aria-hidden="true" />

        {/* Authenticated user's name */}
        {user && (
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            {user.fullName}
          </span>
        )}

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
