/**
 * NotificationsPage — rendered inside MainLayout (sidebar + topbar already present).
 *
 * This is a placeholder for Module E (Notifications). The full notification list,
 * read/unread toggling, and preference management will be built out in the
 * next sprint. Only the page content is rendered here — no standalone shell.
 *
 * Hooks rule: all useState / useEffect calls must appear at the TOP of the
 * component, before any conditional returns.
 */

import { useAuth } from '@/context/AuthContext';

export default function NotificationsPage() {
  // ── All hooks at the top — no early returns above this line ──────────────
  const { user } = useAuth();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        {/* Bell icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <svg
            className="h-8 w-8 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>

        <p className="mt-2 text-gray-500">
          Module E — full implementation coming soon.
          {user?.fullName && (
            <>
              {' '}
              Logged in as <span className="font-medium text-gray-700">{user.fullName}</span>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
