/**
 * SessionsPage — shows all active refresh-token sessions for the current user.
 *
 * Each row displays the browser, device/OS, IP address, and when the session
 * was created. The user can revoke any individual session (e.g. a device they
 * no longer have access to).
 *
 * Data flow:
 *  GET    /api/v1/auth/sessions       → ApiResponse<SessionEntry[]>
 *  DELETE /api/v1/auth/sessions/{id}  → ApiResponse<void>
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

interface SessionEntry {
  id: string;
  browser: string;
  device: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

export default function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get<{ data: SessionEntry[] }>('/auth/sessions')
      .then((res) => { if (!cancelled) setSessions(res.data.data ?? []); })
      .catch(() => { if (!cancelled) setError('Failed to load sessions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await axiosClient.delete(`/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to revoke session. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">

      {/* ── Header ── */}
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
          <h1 className="text-xl font-semibold text-gray-900">Active Sessions</h1>
          <p className="text-sm text-gray-500">Devices currently logged into your account</p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-amber-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 15V5.25A2.25 2.25 0 0 1 3.75 3h16.5A2.25 2.25 0 0 1 21 5.25Z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No active sessions</p>
        </div>
      )}

      {/* ── Session list ── */}
      {!loading && sessions.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                revoking={revoking === session.id}
                onRevoke={() => handleRevoke(session.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          Revoking a session signs that device out immediately.
          If you see a session you don't recognise, revoke it and change your password.
        </p>
      )}
    </div>
  );
}

function SessionRow({
  session,
  revoking,
  onRevoke,
}: {
  session: SessionEntry;
  revoking: boolean;
  onRevoke: () => void;
}) {
  const createdAt = new Date(session.createdAt).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <li className="flex items-start gap-4 px-5 py-4">
      {/* Device icon */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
        <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 15V5.25A2.25 2.25 0 0 1 3.75 3h16.5A2.25 2.25 0 0 1 21 5.25Z" />
        </svg>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {session.browser} on {session.device}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500">
          {session.ipAddress && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0z" />
              </svg>
              {session.ipAddress}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
            Signed in {createdAt}
          </span>
        </div>
      </div>

      {/* Revoke button */}
      <button
        type="button"
        onClick={onRevoke}
        disabled={revoking}
        className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {revoking ? 'Revoking…' : 'Revoke'}
      </button>
    </li>
  );
}
