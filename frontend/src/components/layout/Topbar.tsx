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
    <header className="flex h-16 shrink-0 items-center justify-end border-b border-gray-100 bg-white px-6">

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
          className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
