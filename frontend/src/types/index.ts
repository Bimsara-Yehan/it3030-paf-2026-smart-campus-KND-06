/**
 * Central type definitions for the Smart Campus Operations Hub.
 *
 * All shared interfaces, enums, and generic API wrappers live here so that
 * every module imports from a single source of truth.
 */

// ── Enums ────────────────────────────────────────────────────────────────────

// ── Enums (Refactored to Types/Consts for erasableSyntaxOnly) ────────────────

export type UserRole = 'USER' | 'ADMIN' | 'TECHNICIAN';
export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
} as const;

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export const BookingStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

// ── Domain models ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  profilePicture?: string;
  isActive: boolean;
  createdAt: string; // ISO-8601 date string
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

export interface Booking {
  id: string;
  user: User;
  resource: Resource;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  reason: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** All notification type values produced by the backend. */
export type NotificationType =
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_STATUS_CHANGED'
  | 'NEW_COMMENT'
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  id: string;
  userId: string;
  /** Optional title — fall back to `message` when absent. */
  title?: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedEntityType: 'BOOKING' | 'TICKET' | null;
  relatedEntityId: string | null;
  createdAt: string; // ISO-8601
}

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: string;
  enabled: boolean;
}

// ── Auth request / response shapes ──────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ── Generic API wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
