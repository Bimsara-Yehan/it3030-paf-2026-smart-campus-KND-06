/**
 * NotificationsPage — placeholder for Module E (Notifications) implementation.
 *
 * Full notification list, read/unread state, and preference management
 * will be built out in the next sprint.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Smart Campus Hub</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            &larr; Dashboard
          </button>
        </div>
      </header>

      {/* ── Placeholder content ── */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="mt-2 text-gray-500">
            Module E — coming soon.{' '}
            {user?.fullName && (
              <>
                Logged in as <span className="font-medium">{user.fullName}</span>.
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
