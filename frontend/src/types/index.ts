/**
 * Central type definitions for the Smart Campus Operations Hub.
 *
 * All shared interfaces, enums, and generic API wrappers live here so that
 * every module imports from a single source of truth.
 */

// ── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
}

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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: string[];
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
