/**
 * NotificationBell — polling unread-count indicator in the topbar.
 *
 * Fetches GET /notifications/unread-count every 30 seconds and shows
 * a red badge when there are unread notifications. Clicking navigates
 * to /notifications. The interval is cleared on unmount to prevent
 * state updates on an unmounted component.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '@/api/axiosClient';
import type { ApiResponse } from '@/types';

/** Shape of the unread-count API data payload. */
interface UnreadCountData {
  count: number;
}

/** How often (ms) to re-fetch the unread count. */
const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    /** Fetch the current unread notification count from the backend. */
    const fetchCount = async () => {
      try {
        const { data } = await axiosClient.get<ApiResponse<UnreadCountData>>(
          '/notifications/unread-count',
        );
        setUnreadCount(data.data.count);
      } catch {
        // Silently swallow errors — a stale badge is acceptable,
        // and flooding the console on every poll would be noisy.
      }
    };

    // Fetch immediately, then start the polling interval.
    fetchCount();
    const intervalId = setInterval(fetchCount, POLL_INTERVAL_MS);

    // Clean up the interval when the component unmounts so we don't
    // attempt to update state on an unmounted component.
    return () => clearInterval(intervalId);
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
