/**
 * NotificationPreferencesPage — Module E notification preference management.
 *
 * Rendered inside MainLayout; accessible to all authenticated roles.
 *
 * Features:
 *  - Fetches current preferences from GET /notifications/preferences on mount.
 *  - Defaults missing types to "enabled" (backend only returns explicitly-set records).
 *  - Preferences grouped into three sections: Bookings, Tickets, System.
 *  - Each row: icon, label, description, animated toggle switch.
 *  - Optimistic updates — toggle flips immediately; API call runs in background.
 *  - Per-type saving spinner while the PATCH request is in flight.
 *  - Rollback to previous value if the API call fails.
 *  - Success toast on save; error toast on failure (auto-dismiss after 4 s).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import type { ApiResponse, NotificationType } from '@/types';

// ── All supported notification types ──────────────────────────────────────────

const ALL_TYPES: NotificationType[] = [
  'BOOKING_APPROVED',
  'BOOKING_REJECTED',
  'BOOKING_CANCELLED',
  'TICKET_ASSIGNED',
  'TICKET_STATUS_CHANGED',
  'NEW_COMMENT',
  'SYSTEM_ANNOUNCEMENT',
];

// ── Per-type display configuration ────────────────────────────────────────────

interface PrefConfig {
  label: string;
  description: string;
  iconPath: string;
  iconBg: string;
  iconColor: string;
}

const PREF_CONFIG: Record<NotificationType, PrefConfig> = {
  BOOKING_APPROVED: {
    label: 'Booking Approved',
    description: 'When one of your booking requests is approved by an administrator.',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    iconPath: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  BOOKING_REJECTED: {
    label: 'Booking Rejected',
    description: 'When one of your booking requests is declined.',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    iconPath: 'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  BOOKING_CANCELLED: {
    label: 'Booking Cancelled',
    description: 'When a confirmed booking is cancelled by you or an admin.',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    iconPath: 'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  },
  TICKET_ASSIGNED: {
    label: 'Ticket Assigned',
    description: 'When a support ticket is assigned to you or a technician.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    iconPath:
      'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',
  },
  TICKET_STATUS_CHANGED: {
    label: 'Ticket Status Changed',
    description: 'When the status of a ticket you submitted or own is updated.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    iconPath:
      'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
  },
  NEW_COMMENT: {
    label: 'New Comment on Ticket',
    description: 'When someone adds a comment to a ticket you are involved in.',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    iconPath:
      'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  },
  SYSTEM_ANNOUNCEMENT: {
    label: 'System Announcements',
    description: 'Campus-wide announcements and important system notices.',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-500',
    iconPath:
      'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
  },
};

// ── Preference groups ─────────────────────────────────────────────────────────

interface PrefGroup {
  title: string;
  description: string;
  types: NotificationType[];
}

const GROUPS: PrefGroup[] = [
  {
    title: 'Bookings',
    description: 'Notifications related to room and resource bookings.',
    types: ['BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED'],
  },
  {
    title: 'Tickets',
    description: 'Notifications related to support and maintenance tickets.',
    types: ['TICKET_ASSIGNED', 'TICKET_STATUS_CHANGED', 'NEW_COMMENT'],
  },
  {
    title: 'System',
    description: 'Platform-level announcements from administrators.',
    types: ['SYSTEM_ANNOUNCEMENT'],
  },
];

// ── API response shape for GET /notifications/preferences ─────────────────────

interface PreferenceRecord {
  notificationType: NotificationType;
  enabled: boolean;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

// ── Toggle switch sub-component ───────────────────────────────────────────────

interface ToggleProps {
  enabled: boolean;
  saving: boolean;
  onChange: () => void;
}

function Toggle({ enabled, saving, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={saving}
      onClick={onChange}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        enabled ? 'bg-blue-600' : 'bg-gray-200',
        saving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      ].join(' ')}
    >
      {/* Thumb */}
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow',
          'transition duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

// ── Preference row sub-component ──────────────────────────────────────────────

interface PrefRowProps {
  type: NotificationType;
  enabled: boolean;
  saving: boolean;
  onToggle: (type: NotificationType) => void;
}

function PreferenceRow({ type, enabled, saving, onToggle }: PrefRowProps) {
  const cfg = PREF_CONFIG[type];

  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-gray-200">

      {/* Type icon */}
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

      {/* Label + description */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{cfg.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{cfg.description}</p>
      </div>

      {/* Saving spinner + toggle */}
      <div className="ml-4 flex shrink-0 items-center gap-2.5">
        {saving && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        )}
        <Toggle enabled={enabled} saving={saving} onChange={() => onToggle(type)} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationPreferencesPage() {

  // ── State ─────────────────────────────────────────────────────────────────

  /** Map of notificationType → enabled. Defaults to all-enabled until fetch completes. */
  const [prefs, setPrefs] = useState<Record<NotificationType, boolean>>(
    () => Object.fromEntries(ALL_TYPES.map((t) => [t, true])) as Record<NotificationType, boolean>,
  );

  /** Set of types currently being saved (spinner shown). */
  const [saving, setSaving] = useState<Set<NotificationType>>(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [toasts, setToasts]       = useState<ToastItem[]>([]);

  /** Stable ref to latest prefs for rollback snapshots inside callbacks. */
  const latestRef = useRef<Record<NotificationType, boolean>>(prefs);
  latestRef.current = prefs;

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, kind: ToastItem['kind'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Initial fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchPrefs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await axiosClient.get<ApiResponse<PreferenceRecord[]>>(
          '/notifications/preferences',
        );

        if (!cancelled) {
          // Start from all-enabled defaults, then apply stored values.
          const merged = Object.fromEntries(
            ALL_TYPES.map((t) => [t, true]),
          ) as Record<NotificationType, boolean>;

          for (const record of data.data) {
            if (record.notificationType in merged) {
              merged[record.notificationType] = record.enabled;
            }
          }

          setPrefs(merged);
        }
      } catch {
        if (!cancelled) setError('Failed to load preferences. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPrefs();
    return () => { cancelled = true; };
  }, []);

  // ── Toggle handler (optimistic) ────────────────────────────────────────────

  const handleToggle = useCallback(async (type: NotificationType) => {
    const snapshot = latestRef.current;
    const newValue = !snapshot[type];

    // Optimistic update
    setPrefs((prev) => ({ ...prev, [type]: newValue }));
    setSaving((prev) => new Set(prev).add(type));

    try {
      await axiosClient.put(`/notifications/preferences/${type}`, { enabled: newValue });
      showToast(`${PREF_CONFIG[type].label} ${newValue ? 'enabled' : 'disabled'}.`);
    } catch {
      // Rollback
      setPrefs(snapshot);
      showToast(`Failed to update ${PREF_CONFIG[type].label}. Please try again.`, 'error');
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }
  }, [showToast]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">

      {/* ── Toast container ── */}
      {toasts.length > 0 && (
        <div className="fixed right-5 top-5 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={[
                'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg',
                t.kind === 'success'
                  ? 'border-green-200 bg-white'
                  : 'border-red-200 bg-white',
              ].join(' ')}
            >
              {/* Icon */}
              <span
                className={[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  t.kind === 'success' ? 'bg-green-100' : 'bg-red-100',
                ].join(' ')}
              >
                {t.kind === 'success' ? (
                  <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">Choose which notifications you want to receive.</p>
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* ── Error state ── */}
      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Preference groups ── */}
      {!isLoading && !error && (
        <div className="space-y-8">
          {GROUPS.map((group) => (
            <section key={group.title}>

              {/* Group header */}
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-800">{group.title}</h2>
                <p className="mt-0.5 text-xs text-gray-400">{group.description}</p>
              </div>

              {/* Preference rows */}
              <div className="space-y-2">
                {group.types.map((type) => (
                  <PreferenceRow
                    key={type}
                    type={type}
                    enabled={prefs[type]}
                    saving={saving.has(type)}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}
