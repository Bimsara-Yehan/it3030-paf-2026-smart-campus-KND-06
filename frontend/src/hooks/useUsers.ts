/**
 * useUsers — custom hook for the Admin User Management module.
 *
 * Responsibilities:
 *  - Fetch the full user list from GET /users on mount.
 *  - Expose optimistic mutators for role and status changes.
 *    Each mutator updates local state immediately, calls the API,
 *    and rolls back to the previous snapshot if the call fails.
 *  - Re-throw the caught error so the calling component can display
 *    a toast without duplicating the rollback logic here.
 *
 * All requests go through axiosClient so the JWT interceptor
 * attaches the Authorization header automatically.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import type { ApiResponse, User, UserRole } from '@/types';

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseUsersReturn {
  users: User[];
  isLoading: boolean;
  /** Non-null when the initial fetch fails. */
  error: string | null;
  /**
   * Optimistically update a user's role and persist to the server.
   * Throws a descriptive Error if the API call fails (after rollback).
   */
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  /**
   * Optimistically toggle a user's active status and persist to the server.
   * Throws a descriptive Error if the API call fails (after rollback).
   */
  updateUserStatus: (id: string, isActive: boolean) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUsers(): UseUsersReturn {
  const [users, setUsers]       = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  /**
   * Stable ref to the latest users array — used inside useCallback functions
   * as a rollback snapshot without capturing a stale closure value.
   */
  const latestRef = useRef<User[]>([]);
  useEffect(() => {
    latestRef.current = users;
  }, [users]);

  // ── Initial fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await axiosClient.get<ApiResponse<User[]>>('/users');
        if (!cancelled) setUsers(data.data);
      } catch {
        if (!cancelled) setError('Failed to load users. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  // ── Mutators ──────────────────────────────────────────────────────────────

  /**
   * Optimistically replaces the role for one user, then PATCHes the server.
   * Restores the previous list and re-throws if the request fails.
   */
  const updateUserRole = useCallback(async (id: string, role: UserRole): Promise<void> => {
    const snapshot = latestRef.current;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      await axiosClient.patch(`/users/${id}/role`, { role });
    } catch {
      setUsers(snapshot);
      throw new Error('Failed to update role. Please try again.');
    }
  }, []);

  /**
   * Optimistically flips the isActive flag for one user, then PATCHes the server.
   * Restores the previous list and re-throws if the request fails.
   */
  const updateUserStatus = useCallback(async (id: string, isActive: boolean): Promise<void> => {
    const snapshot = latestRef.current;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive } : u)));
    try {
      await axiosClient.patch(`/users/${id}/status`, { isActive });
    } catch {
      setUsers(snapshot);
      throw new Error('Failed to update status. Please try again.');
    }
  }, []);

  return { users, isLoading, error, updateUserRole, updateUserStatus };
}
