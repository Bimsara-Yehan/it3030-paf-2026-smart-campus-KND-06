// Types matching Backend DTOs for Module C: Incident Ticketing

import type { User } from './index';

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED'
} as const;
export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;
export type TicketPriority = typeof TicketPriority[keyof typeof TicketPriority];

export const TicketCategory = {
  IT_SUPPORT: 'IT_SUPPORT',
  MAINTENANCE: 'MAINTENANCE',
  CLEANING: 'CLEANING',
  SECURITY: 'SECURITY',
  OTHER: 'OTHER'
} as const;
export type TicketCategory = typeof TicketCategory[keyof typeof TicketCategory];

// ── Models (Responses) ───────────────────────────────────────────────────────

export interface TicketResponse {
  id: string;
  reporter?: User;
  resourceId?: string; // UUID from backend
  category: TicketCategory;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  preferredContact?: string;
  assignedTechnician?: User;
  assignedBy?: User;
  assignedAt?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  closedBy?: User;
  closedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentResponse {
  id: string;
  ticketId: string;
  author: User;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentResponse {
  id: string;
  ticketId: string;
  uploader: User;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

// ── Requests ─────────────────────────────────────────────────────────────────

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  resourceId?: string;
  preferredContact?: string;
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
  resolutionNotes?: string;
}

export interface AddCommentRequest {
  message: string;
}
