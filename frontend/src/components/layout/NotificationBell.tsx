/**
 * NotificationBell — real-time unread-count indicator in the topbar.
 *
 * Connects to GET /notifications/stream (SSE) to receive instant push
 * updates whenever a new notification is created for the logged-in user.
 * The SSE event data is the new total unread count as a plain string.
 *
 * Because browser EventSource cannot send custom headers, the JWT is
 * passed as a `?token=` query parameter — the backend JwtFilter accepts
 * this as a fallback for SSE connections.
 *
 * Falls back to polling every 30 seconds as a safety net (e.g. if the
 * SSE stream fails to connect in environments that don't support it).
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient, { ACCESS_TOKEN_KEY } from '../../api/axiosClient';
import type { ApiResponse } from '../../types';

const POLL_INTERVAL_MS = 30_000;
const BASE_URL = 'http://localhost:8081/api/v1';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  /** Fetch the current unread count via REST (used as initial load + fallback). */
  const fetchCount = async () => {
    try {
      const { data } = await axiosClient.get<ApiResponse<number>>(
        '/notifications/unread-count',
      );
      // The API wraps the count in data.data — it may be a plain number
      const raw = data.data as unknown;
      const count = typeof raw === 'number' ? raw : (raw as { count?: number })?.count ?? 0;
      setUnreadCount(count);
    } catch {
      // Silently swallow — a stale badge is acceptable
    }
  };

  useEffect(() => {
    // Initial fetch so the badge is correct before SSE connects
    fetchCount();

    // ── SSE connection ─────────────────────────────────────────────────────
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      const url = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        // Stream is live — re-fetch to sync count immediately
        fetchCount();
      });

      es.addEventListener('notification', (e: MessageEvent) => {
        // Event data is the new unread count as a plain string
        const count = parseInt(e.data, 10);
        if (!isNaN(count)) {
          setUnreadCount(count);
        }
      });

      es.onerror = () => {
        // Browser will auto-reconnect after a delay — no action needed here
      };
    }

    // ── Fallback polling (keeps badge fresh if SSE is unavailable) ─────────
    const intervalId = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      onClick={() => navigate('/notifications')}
      aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
      className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
    >
      {/* Bell SVG icon */}
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>

      {/* Unread badge — only rendered when count > 0 */}
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
