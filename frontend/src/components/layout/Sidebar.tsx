/**
 * Sidebar — fixed left-side navigation panel.
 *
 * Renders:
 *  - Logo / app title at the top
 *  - Role-aware navigation links in the middle (active link is highlighted)
 *  - User profile section (avatar, name, role badge) pinned to the bottom
 *
 * Navigation visibility by role:
 *  ALL       → Dashboard, Notifications
 *  USER      → My Bookings, My Tickets, Resources
 *  ADMIN     → All Bookings, All Tickets, Resources, User Management
 *  TECHNICIAN→ Assigned Tickets, Resources
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

// ── Nav item type ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  /** Heroicons-compatible SVG path data for the item icon. */
  iconPath: string;
  /** Renders the item indented as a visual sub-item of the preceding entry. */
  indent?: boolean;
}

// ── Shared nav items (all roles) ──────────────────────────────────────────────

const NAV_COMMON: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    iconPath:
      'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  },
  {
    label: 'Notifications',
    to: '/notifications',
    iconPath:
      'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  },
  {
    label: 'Preferences',
    to: '/notifications/preferences',
    indent: true,
    iconPath:
      'M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  },
  {
    label: 'Login Activity',
    to: '/login-history',
    indent: true,
    iconPath:
      'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Active Sessions',
    to: '/sessions',
    indent: true,
    iconPath:
      'M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 15V5.25A2.25 2.25 0 0 1 3.75 3h16.5A2.25 2.25 0 0 1 21 5.25Z',
  },
];

// ── Role-specific nav items ───────────────────────────────────────────────────

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  [UserRole.USER]: [
    {
      label: 'My Bookings',
      to: '/bookings',
      iconPath:
        'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    },
    {
      label: 'My Tickets',
      to: '/tickets',
      iconPath:
        'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
    },
    {
      label: 'Resources',
      to: '/resources',
      iconPath:
        'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
    },
  ],
  [UserRole.ADMIN]: [
    {
      label: 'All Bookings',
      to: '/bookings',
      iconPath:
        'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    },
    {
      label: 'All Tickets',
      to: '/tickets',
      iconPath:
        'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
    },
    {
      label: 'Resources',
      to: '/resources',
      iconPath:
        'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
    },
    {
      label: 'User Management',
      to: '/admin/users',
      iconPath:
        'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    },
  ],
  [UserRole.TECHNICIAN]: [
    {
      label: 'Assigned Tickets',
      to: '/tickets',
      iconPath:
        'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
    },
    {
      label: 'Resources',
      to: '/resources',
      iconPath:
        'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
    },
  ],
};

// ── Role badge colours ────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; classes: string }> = {
  [UserRole.ADMIN]:      { label: 'Administrator', classes: 'bg-red-100 text-red-700' },
  [UserRole.TECHNICIAN]: { label: 'Technician',    classes: 'bg-blue-100 text-blue-700' },
  [UserRole.USER]:       { label: 'Student / Staff', classes: 'bg-green-100 text-green-700' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  // Build the nav list: shared items + role-specific items.
  const navItems: NavItem[] = [...NAV_COMMON, ...(NAV_BY_ROLE[user.role] ?? [])];

  // Derive initials for the avatar fallback (up to 2 words).
  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  const badge = ROLE_BADGE[user.role];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* ── Logo / title ── */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-gray-200 px-5">
        {/* Simple square logo mark */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-sm font-bold text-white">SC</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 leading-tight">
          Smart Campus<br />
          <span className="text-xs font-normal text-gray-500">Operations Hub</span>
        </span>
      </div>

      {/* ── Navigation links ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.to} className={item.indent ? 'pl-4' : undefined}>
                <button
                  onClick={() => navigate(item.to)}
                  className={[
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                    item.indent ? 'text-xs font-medium' : 'text-sm font-medium py-2.5',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Icon — slightly smaller for sub-items */}
                  <svg
                    className={[
                      'shrink-0',
                      item.indent ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5',
                      isActive ? 'text-blue-600' : 'text-gray-400',
                    ].join(' ')}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User profile section — clicking navigates to /profile ── */}
      <div className="shrink-0 border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-100"
          aria-label="View your profile"
        >
          {/* Avatar — profile picture or initials fallback */}
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.fullName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {initials}
            </div>
          )}

          {/* Name + role badge */}
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-gray-900">{user.fullName}</p>
            <span
              className={[
                'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold',
                badge.classes,
              ].join(' ')}
            >
              {badge.label}
            </span>
          </div>
          {/* Arrow hint */}
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
