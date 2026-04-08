// Types matching Backend DTOs for Module C: Incident Ticketing



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
  title: string;
  reporterName: string;
  reporterId: string;
  resourceId?: string; // UUID from backend
  category: TicketCategory;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  preferredContact?: string;
  assignedTechnicianName?: string;
  assignedTechnicianId?: string;
  assignedByName?: string;
  assignedById?: string;
  assignedAt?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentResponse {
  id: string;
  ticketId: string;
  authorName: string;
  authorId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentResponse {
  id: string;
  ticketId: string;
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
  notes?: string;
}

export interface AddCommentRequest {
  content: string;
}
