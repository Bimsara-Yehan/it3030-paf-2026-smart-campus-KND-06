/**
 * DashboardPage — the main landing page for authenticated users.
 *
 * Rendered inside MainLayout which supplies the sidebar, topbar, and
 * sign-out action — this component owns only the page content.
 *
 * Displays a personalised welcome message, the user's role badge,
 * and quick-navigation cards to other campus modules.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/** Human-readable label for each backend role value. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN:      'Administrator',
  TECHNICIAN: 'Technician',
  USER:       'Student / Staff',
};

/** Tailwind colour classes for each role badge. */
const ROLE_COLOURS: Record<string, string> = {
  ADMIN:      'bg-red-100 text-red-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  USER:       'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* ── Welcome card ── */}
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <p className="text-sm font-medium text-blue-600">Welcome back</p>

        <h2 className="mt-1 text-3xl font-bold text-gray-900">
          {user?.fullName ?? 'Campus User'}
        </h2>

        {user?.role && (
          <span
            className={[
              'mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold',
              ROLE_COLOURS[user.role] ?? 'bg-gray-100 text-gray-600',
            ].join(' ')}
          >
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        )}

        <p className="mt-4 text-sm text-gray-500">
          You are successfully authenticated. Use the sidebar or the cards below to
          navigate to a module.
        </p>

        {/* ── Module quick-links ── */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => navigate('/notifications')}
            className="rounded-xl border border-gray-200 p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <p className="font-semibold text-gray-800">Notifications</p>
            <p className="mt-1 text-sm text-gray-500">View your campus alerts and messages.</p>
          </button>

          <button
            onClick={() => navigate('/bookings')}
            className="rounded-xl border border-gray-200 p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <p className="font-semibold text-gray-800">Bookings</p>
            <p className="mt-1 text-sm text-gray-500">Manage your room and resource bookings.</p>
          </button>

          <button
            onClick={() => navigate('/tickets')}
            className="rounded-xl border border-gray-200 p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <p className="font-semibold text-gray-800">Tickets</p>
            <p className="mt-1 text-sm text-gray-500">Submit and track maintenance requests.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
