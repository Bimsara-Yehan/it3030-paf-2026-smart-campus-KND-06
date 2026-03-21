/**
 * LoginHistoryPage — shows the last 10 login attempts for the current user.
 *
 * Each row displays:
 *  - Status icon  (green check = SUCCESS, red ✕ = FAILED)
 *  - Browser name  (parsed from User-Agent by the backend DTO)
 *  - Device / OS   (parsed from User-Agent by the backend DTO)
 *  - IP address
 *  - Formatted date + time (locale-aware)
 *
 * Data flow:
 *  GET /api/v1/auth/login-history  →  ApiResponse<LoginHistoryEntry[]>
 *  The backend returns at most 10 entries, newest first.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '@/api/axiosClient';

// ── Types ─────────────────────────────────────────────────────────────────────

type LoginStatus = 'SUCCESS' | 'FAILED';

interface LoginHistoryEntry {
  id: string;
  userId: string | null;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  status: LoginStatus;
  createdAt: string;       // ISO-8601 string from the backend
  browser: string;         // parsed by LoginHistoryResponse.getBrowser()
  device: string;          // parsed by LoginHistoryResponse.getDevice()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginHistoryPage() {
  const navigate = useNavigate();

  const [entries, setEntries]   = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    axiosClient
      .get<{ data: LoginHistoryEntry[] }>('/auth/login-history')
      .then((res) => {
        if (!cancelled) setEntries(res.data.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load login history. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Back to profile"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Login Activity</h1>
          <p className="text-sm text-gray-500">Last 10 login attempts on your account</p>
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No login history yet</p>
          <p className="mt-1 text-xs text-gray-400">Your login activity will appear here after your first sign-in.</p>
        </div>
      )}

      {/* ── History list ── */}
      {!loading && !error && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </div>
      )}

      {/* ── Footer note ── */}
      {!loading && !error && entries.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          Showing the {entries.length} most recent login attempt{entries.length !== 1 ? 's' : ''}.
          If you see activity you don't recognise, change your password immediately.
        </p>
      )}

    </div>
  );
}

// ── HistoryRow sub-component ──────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: LoginHistoryEntry }) {
  const isSuccess = entry.status === 'SUCCESS';

  const formattedDate = new Date(entry.createdAt).toLocaleString(undefined, {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });

  return (
    <li className="flex items-start gap-4 px-5 py-4">

      {/* Status icon */}
      <div className={[
        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        isSuccess ? 'bg-green-100' : 'bg-red-100',
      ].join(' ')}>
        {isSuccess ? (
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={[
            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
            isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
          ].join(' ')}>
            {isSuccess ? 'Successful login' : 'Failed attempt'}
          </span>
          <span className="text-sm text-gray-900 font-medium">
            {entry.browser} on {entry.device}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500">
          {entry.ipAddress && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {entry.ipAddress}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formattedDate}
          </span>
        </div>
      </div>

    </li>
  );
}
