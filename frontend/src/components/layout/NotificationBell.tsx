/**
 * NotificationBell — real-time unread-count indicator in the topbar.
 *
 * Opens a Server-Sent Events stream to GET /notifications/stream so the badge
 * updates instantly when a new notification arrives — no polling delay.
 *
 * Falls back to 30-second polling automatically if the SSE connection fails
 * (e.g. network issue, token expired, browser not supporting EventSource).
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient, { ACCESS_TOKEN_KEY } from '@/api/axiosClient';
import type { ApiResponse } from '@/types';

/** Fallback polling interval (ms) used only when SSE is unavailable. */
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
      // Backend returns ApiResponse<Long> — data.data is a plain number
      const count = typeof data.data === 'number' ? data.data : 0;
      setUnreadCount(count);
    } catch {
      // Silently swallow — a stale badge is acceptable
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchCount();

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return;

    let eventSource: EventSource | null = null;
    let pollFallback: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      if (!pollFallback) {
        pollFallback = setInterval(fetchCount, POLL_INTERVAL_MS);
      }
    };

    try {
      // Open SSE stream — JWT passed as query param because EventSource
      // cannot set the Authorization header
      const sseUrl = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // A new notification arrived — refresh the badge count immediately
      eventSource.addEventListener('notification', () => {
        fetchCount();
      });

      // SSE connection error → fall back to polling
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        eventSourceRef.current = null;
        startPollingFallback();
      };
    } catch {
      // EventSource constructor threw (shouldn't happen in modern browsers)
      startPollingFallback();
    }

    // When the user marks notifications as read on the notifications page,
    // re-fetch immediately so the badge count drops without waiting for SSE/poll
    window.addEventListener('notifications:read', fetchCount);

    return () => {
      eventSource?.close();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollFallback) clearInterval(pollFallback);
      window.removeEventListener('notifications:read', fetchCount);
    };
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
