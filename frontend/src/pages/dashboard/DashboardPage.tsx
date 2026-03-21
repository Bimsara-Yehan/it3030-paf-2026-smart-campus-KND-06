/**
 * DashboardPage — the main landing page for authenticated users.
 *
 * Rendered inside MainLayout which supplies the sidebar, topbar, and
 * sign-out action — this component owns only the page content.
 *
 * Role-aware sections:
 *  - ADMIN       → stat cards (user counts by role) + recent users table + module cards
 *  - USER / TECH → welcome card + module quick-links only
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axiosClient from '@/api/axiosClient';
import { UserRole } from '@/types';
import type { User } from '@/types';

// ── Role display helpers ───────────────────────────────────────────────────────

/** Human-readable label for each backend role value. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN:      'Administrator',
  TECHNICIAN: 'Technician',
  USER:       'User',
};

/** Tailwind colour classes for each role badge. */
const ROLE_COLOURS: Record<string, string> = {
  ADMIN:      'bg-red-100 text-red-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  USER:       'bg-green-100 text-green-700',
};

/** Avatar background colour for each role. */
const ROLE_AVATAR_BG: Record<string, string> = {
  ADMIN:      'bg-red-500',
  TECHNICIAN: 'bg-blue-500',
  USER:       'bg-green-600',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === UserRole.ADMIN;

  // ── Admin: user list state ─────────────────────────────────────────────────
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if the current user is an admin.
    if (!isAdmin) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    axiosClient
      .get<{ data: User[] }>('/users')
      .then((res) => {
        if (!cancelled) setUsers(res.data.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load user statistics. Please refresh the page.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isAdmin]);

  // ── Derived counts (cheap — runs only when users array changes) ────────────
  const totalUsers       = users.length;
  const adminCount       = users.filter((u) => u.role === UserRole.ADMIN).length;
  const technicianCount  = users.filter((u) => u.role === UserRole.TECHNICIAN).length;
  const regularUserCount = users.filter((u) => u.role === UserRole.USER).length;

  // Last 5 registered — sort descending by createdAt then slice
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">

      {/* ═══════════════════════════════════════════════════════════════════
          ADMIN-ONLY: Statistics + Recent Users
      ═══════════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <>
          {/* ── Error banner ── */}
          {error && !loading && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Users"
              value={totalUsers}
              loading={loading}
              colorRing="ring-blue-100"
              iconBg="bg-blue-50"
              iconText="text-blue-600"
              countText="text-blue-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            />

            <StatCard
              label="Admins"
              value={adminCount}
              loading={loading}
              colorRing="ring-red-100"
              iconBg="bg-red-50"
              iconText="text-red-600"
              countText="text-red-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              }
            />

            <StatCard
              label="Technicians"
              value={technicianCount}
              loading={loading}
              colorRing="ring-purple-100"
              iconBg="bg-purple-50"
              iconText="text-purple-600"
              countText="text-purple-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              }
            />

            <StatCard
              label="Regular Users"
              value={regularUserCount}
              loading={loading}
              colorRing="ring-green-100"
              iconBg="bg-green-50"
              iconText="text-green-600"
              countText="text-green-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
            />
          </div>

          {/* ── Recently Registered Users table ── */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Recently Registered Users</h3>
              <p className="mt-0.5 text-xs text-gray-500">Last 5 accounts created on the platform</p>
            </div>

            {loading ? (
              /* Skeleton rows */
              <ul className="divide-y divide-gray-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                  </li>
                ))}
              </ul>
            ) : recentUsers.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-400">No users found.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentUsers.map((u) => (
                  <RecentUserRow key={u.id} user={u} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ALL ROLES: Welcome card + module quick-links
      ═══════════════════════════════════════════════════════════════════ */}
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

// ── StatCard sub-component ────────────────────────────────────────────────────

interface StatCardProps {
  label:     string;
  value:     number;
  loading:   boolean;
  colorRing: string;
  iconBg:    string;
  iconText:  string;
  countText: string;
  icon:      React.ReactNode;
}

function StatCard({ label, value, loading, colorRing, iconBg, iconText, countText, icon }: StatCardProps) {
  return (
    <div className={['rounded-2xl bg-white p-5 shadow-sm ring-1', colorRing].join(' ')}>
      {/* Icon */}
      <div className={['inline-flex h-10 w-10 items-center justify-center rounded-xl', iconBg, iconText].join(' ')}>
        {icon}
      </div>

      {/* Count */}
      {loading ? (
        <div className="mt-4 h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
      ) : (
        <p className={['mt-4 text-3xl font-bold', countText].join(' ')}>{value}</p>
      )}

      {/* Label */}
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

// ── RecentUserRow sub-component ───────────────────────────────────────────────

function RecentUserRow({ user }: { user: User }) {
  // Derive up-to-2-letter initials from the full name
  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  const joinDate = new Date(user.createdAt).toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  });

  const avatarBg = ROLE_AVATAR_BG[user.role] ?? 'bg-gray-400';

  return (
    <li className="flex items-center gap-4 px-6 py-4">
      {/* Avatar */}
      {user.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.fullName}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', avatarBg].join(' ')}>
          {initials}
        </div>
      )}

      {/* Name + email */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{user.fullName}</p>
        <p className="truncate text-xs text-gray-400">{user.email}</p>
      </div>

      {/* Role badge */}
      <span className={['shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', ROLE_COLOURS[user.role] ?? 'bg-gray-100 text-gray-600'].join(' ')}>
        {ROLE_LABELS[user.role] ?? user.role}
      </span>

      {/* Active / inactive badge */}
      <span className={[
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
        user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500',
      ].join(' ')}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>

      {/* Join date */}
      <span className="shrink-0 text-xs text-gray-400">{joinDate}</span>
    </li>
  );
}
