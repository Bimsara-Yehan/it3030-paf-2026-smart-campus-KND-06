/**
 * UserManagementPage — ADMIN-only user administration panel.
 *
 * Rendered inside MainLayout; access is enforced by RoleRoute in App.tsx.
 *
 * Features:
 *  - Live search across full name and email
 *  - Role filter tabs (All / Admin / Technician / User) with per-tab counts
 *  - User table: avatar, name+email, role badge, status badge, actions
 *  - Change-role dropdown and activate/deactivate button per row
 *  - Self-protection: the logged-in admin's own row is disabled for all mutations
 *  - Optimistic updates via useUsers hook; errors surface as auto-dismiss toasts
 *
 * All hooks are declared before any conditional logic (Rules of Hooks).
 */

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { UserRole } from '../../types';
import type { User } from '../../types';

// ── Visual config ─────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, { label: string; badge: string; avatar: string }> = {
  [UserRole.ADMIN]:      { label: 'Admin',         badge: 'bg-red-100 text-red-700',    avatar: 'bg-red-500' },
  [UserRole.TECHNICIAN]: { label: 'Technician',    badge: 'bg-purple-100 text-purple-700', avatar: 'bg-purple-500' },
  [UserRole.USER]:       { label: 'User', badge: 'bg-green-100 text-green-700', avatar: 'bg-green-600' },
};

// Filter tab options
type RoleFilter = 'ALL' | UserRole;
const TABS: { key: RoleFilter; label: string }[] = [
  { key: 'ALL',               label: 'All' },
  { key: UserRole.ADMIN,      label: 'Admin' },
  { key: UserRole.TECHNICIAN, label: 'Technician' },
  { key: UserRole.USER,       label: 'User' },
];

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastItem {
  id:      number;
  message: string;
  /** Controls the colour scheme. Defaults to 'error' (red). */
  type:    'error' | 'info';
}

// ── CSV export ────────────────────────────────────────────────────────────────

/** Human-readable role labels written into the CSV file. */
const CSV_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]:      'Admin',
  [UserRole.TECHNICIAN]: 'Technician',
  [UserRole.USER]:       'User',
};

/**
 * Escapes a single CSV cell value.
 * Wraps in double-quotes and escapes any embedded double-quotes by doubling them.
 * This handles values that contain commas, quotes, or newlines safely.
 */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Converts the users array to a RFC 4180-compliant CSV string and triggers
 * a browser file-download without any server round-trip.
 *
 * Steps:
 *  1. Build header + data rows as a 2-D string array.
 *  2. Join each row with commas and join rows with CRLF (RFC 4180 line endings).
 *  3. Wrap in a Blob → create an object URL → click a temporary <a> element.
 *  4. Revoke the object URL immediately after the click to free memory.
 *
 * @param users    The full (unfiltered) user list to export.
 * @param filename Desired file name including .csv extension.
 */
function downloadCsv(users: User[], filename: string): void {
  const HEADER = ['ID', 'Full Name', 'Email', 'Role', 'Status', 'Joined Date'];

  const rows = users.map((u) => [
    u.id,
    u.fullName,
    u.email,
    CSV_ROLE_LABEL[u.role] ?? u.role,
    u.isActive ? 'Active' : 'Inactive',
    // createdAt is an ISO-8601 string; slice the first 10 chars = YYYY-MM-DD
    u.createdAt.slice(0, 10),
  ]);

  const csv = [HEADER, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href     = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the object URL so the browser can free the Blob memory.
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive up-to-two initials from a full name. */
function initials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single-row table entry. */
interface RowProps {
  user: User;
  isSelf: boolean;
  onRoleChange: (id: string, role: UserRole) => void;
  onStatusToggle: (id: string, isActive: boolean) => void;
}

function UserRow({ user, isSelf, onRoleChange, onStatusToggle }: RowProps) {
  const cfg = ROLE_BADGE[user.role] ?? ROLE_BADGE[UserRole.USER];

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">

      {/* Avatar + Name + Email */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.fullName}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                cfg.avatar,
              ].join(' ')}
            >
              {initials(user.fullName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {user.fullName}
              {isSelf && (
                <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  you
                </span>
              )}
            </p>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role badge */}
      <td className="px-4 py-3">
        <span
          className={[
            'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
            cfg.badge,
          ].join(' ')}
        >
          {cfg.label}
        </span>
      </td>

      {/* Status badge */}
      <td className="px-4 py-3">
        <span
          className={[
            'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
            user.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500',
          ].join(' ')}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">

          {/* Role selector */}
          <select
            value={user.role}
            disabled={isSelf}
            onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
            title={isSelf ? 'Cannot change your own role' : 'Change role'}
            className={[
              'rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700',
              'transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100',
              isSelf ? 'cursor-not-allowed opacity-40' : 'hover:border-gray-300 cursor-pointer',
            ].join(' ')}
          >
            <option value={UserRole.USER}>USER</option>
            <option value={UserRole.ADMIN}>ADMIN</option>
            <option value={UserRole.TECHNICIAN}>TECHNICIAN</option>
          </select>

          {/* Activate / Deactivate */}
          <button
            disabled={isSelf}
            onClick={() => onStatusToggle(user.id, !user.isActive)}
            title={isSelf ? 'Cannot change your own status' : undefined}
            className={[
              'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              isSelf
                ? 'cursor-not-allowed border-gray-200 text-gray-300'
                : user.isActive
                  ? 'border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-300'
                  : 'border-green-200 text-green-600 hover:bg-green-50 focus:ring-green-300',
            ].join(' ')}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserManagementPage() {

  // ── All hooks unconditionally at the top ─────────────────────────────────
  const { user: currentUser } = useAuth();
  const { users, isLoading, error, updateUserRole, updateUserStatus } = useUsers();

  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [toasts, setToasts]         = useState<ToastItem[]>([]);

  // ── Toast helpers ─────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 4 s
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── CSV export handler ─────────────────────────────────────────────────────

  const handleExportCsv = useCallback(() => {
    if (users.length === 0) {
      showToast('No users to export.', 'info');
      return;
    }
    const today    = new Date().toISOString().slice(0, 10);
    const filename = `smartcampus-users-${today}.csv`;
    downloadCsv(users, filename);
  }, [users, showToast]);

  // ── Derived data ──────────────────────────────────────────────────────────

  /** Per-tab counts are always based on the unfiltered list. */
  const tabCounts = useMemo<Record<RoleFilter, number>>(
    () => ({
      ALL:                    users.length,
      [UserRole.ADMIN]:       users.filter((u) => u.role === UserRole.ADMIN).length,
      [UserRole.TECHNICIAN]:  users.filter((u) => u.role === UserRole.TECHNICIAN).length,
      [UserRole.USER]:        users.filter((u) => u.role === UserRole.USER).length,
    }),
    [users],
  );

  /** Apply role tab then search (case-insensitive across name and email). */
  const visibleUsers = useMemo<User[]>(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
      .filter(
        (u) =>
          !q ||
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
  }, [users, roleFilter, search]);

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleRoleChange = async (id: string, role: UserRole) => {
    try {
      await updateUserRole(id, role);
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleStatusToggle = async (id: string, newActive: boolean) => {
    try {
      await updateUserStatus(id, newActive);
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">

      {/* ── Toast container ── */}
      {toasts.length > 0 && (
        <div className="fixed right-5 top-5 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={[
                'flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg',
                t.type === 'info' ? 'border-amber-200' : 'border-red-200',
              ].join(' ')}
            >
              <span className={[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                t.type === 'info' ? 'bg-amber-100' : 'bg-red-100',
              ].join(' ')}>
                {t.type === 'info' ? (
                  <svg className="h-3.5 w-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                )}
              </span>
              <p className="text-sm text-gray-700">{t.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          {!isLoading && !error && (
            <p className="mt-0.5 text-sm text-gray-500">
              {users.length} {users.length === 1 ? 'user' : 'users'} registered
            </p>
          )}
        </div>

        {/* Export CSV button — exports all users regardless of current filter */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Role filter tabs ── */}
      <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={[
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              roleFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab.label}
            <span
              className={[
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                roleFilter === tab.key
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-200 text-gray-500',
              ].join(' ')}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div className="relative mb-5">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
        </svg>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-700 border-t-transparent" />
        </div>
      )}

      {/* ── Fetch error ── */}
      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      {!isLoading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {visibleUsers.length === 0 ? (

            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600">No users found</p>
              <p className="mt-1 text-xs text-gray-400">
                {search ? 'Try a different search term.' : 'No users in this category yet.'}
              </p>
            </div>

          ) : (

            <table className="w-full min-w-[640px] table-auto border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isSelf={u.id === currentUser?.id}
                    onRoleChange={handleRoleChange}
                    onStatusToggle={handleStatusToggle}
                  />
                ))}
              </tbody>
            </table>

          )}
        </div>
      )}

      {/* Results count when searching */}
      {!isLoading && !error && search && visibleUsers.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          Showing {visibleUsers.length} of {users.length} users
        </p>
      )}

    </div>
  );
}
