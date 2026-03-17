/**
 * useNotifications — custom hook for the Notifications module.
 *
 * Responsibilities:
 *  - Fetch all notifications for the authenticated user on mount.
 *  - Expose derived state: unreadCount (computed, not a separate API call).
 *  - Provide mutating actions with optimistic updates so the UI responds
 *    instantly without waiting for the server round-trip.
 *  - Roll back optimistic updates if an API call fails.
 *
 * All API calls go through axiosClient so the JWT interceptor handles
 * attaching the Authorization header automatically.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import type { ApiResponse, Notification } from '@/types';

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseNotificationsReturn {
  /** Sorted newest-first list of notifications. */
  notifications: Notification[];
  /** Number of unread notifications (derived from local state, not a separate API call). */
  unreadCount: number;
  isLoading: boolean;
  /** Non-null when the initial fetch fails. */
  error: string | null;
  /** Mark a single notification as read (optimistic). */
  markAsRead: (id: string) => Promise<void>;
  /** Mark every notification as read (optimistic). */
  markAllAsRead: () => Promise<void>;
  /** Remove a notification permanently (optimistic). */
  deleteNotification: (id: string) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  /**
   * Ref that always holds the latest notifications array.
   * Used by action callbacks as a stable snapshot for rollbacks —
   * avoids capturing stale closures in useCallback deps.
   */
  const latestRef = useRef<Notification[]>([]);
  useEffect(() => {
    latestRef.current = notifications;
  }, [notifications]);

  // ── Initial fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false; // guard against setting state after unmount

    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await axiosClient.get<ApiResponse<Notification[]>>('/notifications');

        if (!cancelled) {
          // Sort newest-first once here; local state mutations preserve order.
          const sorted = [...data.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setNotifications(sorted);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load notifications. Please try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Optimistically marks one notification as read, then persists to the server.
   * Rolls back to the pre-call state if the request fails.
   */
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    const snapshot = latestRef.current;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
    } catch {
      setNotifications(snapshot); // revert optimistic update
    }
  }, []);

  /**
   * Optimistically marks every notification as read, then persists.
   * Rolls back the entire list on failure.
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    const snapshot = latestRef.current;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await axiosClient.patch('/notifications/read-all');
    } catch {
      setNotifications(snapshot);
    }
  }, []);

  /**
   * Optimistically removes a notification from the list, then persists.
   * Restores the full list on failure.
   */
  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    const snapshot = latestRef.current;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await axiosClient.delete(`/notifications/${id}`);
    } catch {
      setNotifications(snapshot);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
