/**
 * DashboardPage — the main landing page for authenticated users.
 *
 * Displays a personalised welcome message, the user's role badge,
 * and quick-navigation cards to other campus modules.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/** Human-readable label for each backend role value. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  TECHNICIAN: 'Technician',
  USER: 'Student / Staff',
};

/** Tailwind colour classes for each role badge. */
const ROLE_COLOURS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  TECHNICIAN: 'bg-yellow-100 text-yellow-700',
  USER: 'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Smart Campus Hub</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Welcome card ── */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-600">Welcome back</p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            {user?.fullName ?? 'Campus User'}
          </h2>

          {user?.role && (
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                ROLE_COLOURS[user.role] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          )}

          <p className="mt-4 text-sm text-gray-500">
            You are successfully authenticated. Use the cards below to navigate to a module.
          </p>

          {/* ── Module cards ── */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => navigate('/notifications')}
              className="rounded-xl border border-gray-200 p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <p className="font-semibold text-gray-800">Notifications</p>
              <p className="mt-1 text-sm text-gray-500">
                View your campus alerts and messages.
              </p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
