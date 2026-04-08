/**
 * NotificationsPage — Module E entry point.
 *
 * Rendered inside MainLayout (sidebar + topbar already present).
 * Uses the useNotifications hook for all data-fetching and mutations.
 *
 * Layout:
 *  - Page header: title, unread badge, "Mark all as read" button
 *  - Notification list: newest first, each card shows icon / text / actions
 *  - Unread cards: blue left border + blue-tinted background
 *  - Empty, loading, and error states handled inline
 */

import { useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationType } from '../../types';

// ── Time-ago helper ───────────────────────────────────────────────────────────

/**
 * Converts an ISO-8601 timestamp into a human-readable relative string
 * like "3 hours ago" or "2 days ago".
 */
function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60)                   return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60)                      return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)                       return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)                       return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5)                      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12)                    return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

// ── Notification type → visual config ─────────────────────────────────────────

interface TypeConfig {
  iconPath: string;
  iconColor: string;
  iconBg: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  BOOKING_APPROVED: {
    iconBg:    'bg-green-100',
    iconColor: 'text-green-600',
    iconPath:  'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  BOOKING_REJECTED: {
    iconBg:    'bg-red-100',
    iconColor: 'text-red-600',
    iconPath:  'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  BOOKING_CANCELLED: {
    iconBg:    'bg-orange-100',
    iconColor: 'text-orange-600',
    iconPath:  'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  TICKET_ASSIGNED: {
    iconBg:    'bg-blue-100',
    iconColor: 'text-blue-600',
    iconPath:
      'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
  },
  TICKET_STATUS_CHANGED: {
    iconBg:    'bg-blue-100',
    iconColor: 'text-blue-600',
    iconPath:
      'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
  },
  NEW_COMMENT: {
    iconBg:    'bg-purple-100',
    iconColor: 'text-purple-600',
    iconPath:
      'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  },
  SYSTEM_ANNOUNCEMENT: {
    iconBg:    'bg-gray-100',
    iconColor: 'text-gray-500',
    iconPath:
      'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
  },
};

// ── Notification card ─────────────────────────────────────────────────────────

interface CardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationCard({ notification, onMarkAsRead, onDelete }: CardProps) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.SYSTEM_ANNOUNCEMENT;
  const text = notification.title ?? notification.message;

  return (
    <div
      className={[
        'flex items-start gap-4 rounded-xl border p-4 transition-colors',
        notification.isRead
          ? 'border-gray-200 bg-white'
          : 'border-blue-200 bg-blue-50',
      ].join(' ')}
    >
      {/* ── Type icon ── */}
      <div
        className={[
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          cfg.iconBg,
        ].join(' ')}
      >
        <svg
          className={['h-5 w-5', cfg.iconColor].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.iconPath} />
        </svg>
      </div>

      {/* ── Content ── */}
      <div className="min-w-0 flex-1">
        {/* Message — bold if unread */}
        <p
          className={[
            'text-sm leading-snug',
            notification.isRead ? 'text-gray-700' : 'font-medium text-gray-900',
          ].join(' ')}
        >
          {text}
        </p>

        {/* Show full message as secondary line when title is distinct from message */}
        {notification.title && notification.title !== notification.message && (
          <p className="mt-0.5 text-xs text-gray-500 leading-snug">{notification.message}</p>
        )}

        {/* Timestamp */}
        <p className="mt-1.5 text-xs text-gray-400">{timeAgo(notification.createdAt)}</p>
      </div>

      {/* ── Actions ── */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Mark as read — only on unread */}
        {!notification.isRead && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
            className="rounded-lg p-1.5 text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
          >
            {/* Envelope-open icon */}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5z"
              />
            </svg>
          </button>
        )}

        {/* Delete — on all notifications */}
        <button
          onClick={() => onDelete(notification.id)}
          title="Delete notification"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  // All hooks unconditionally at the top — no early returns above this line.
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">

      {/* ── Page header ── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Mark all as read — only visible when there are unread notifications */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* ── Error state ── */}
      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700">You're all caught up!</p>
          <p className="mt-1 text-sm text-gray-400">No notifications at the moment.</p>
        </div>
      )}

      {/* ── Notification list ── */}
      {!isLoading && !error && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}

    </div>
  );
}
