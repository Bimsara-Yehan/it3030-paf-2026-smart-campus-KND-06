import axiosClient from './axiosClient';
import type { ApiResponse } from '../types';
import type {
  TicketResponse,
  CreateTicketRequest,
  UpdateTicketStatusRequest,
  CommentResponse,
  AddCommentRequest,
  AttachmentResponse
} from '../types/ticket';

/**
 * Service functions for all 14 Ticket API endpoints.
 */
export const ticketApi = {
  // ── Tickets ────────────────────────────────────────────────────────────────

  createTicket: async (data: CreateTicketRequest): Promise<TicketResponse> => {
    const response = await axiosClient.post<ApiResponse<TicketResponse>>('/tickets', data);
    return response.data.data;
  },

  getAllTickets: async (): Promise<TicketResponse[]> => {
    const response = await axiosClient.get<ApiResponse<TicketResponse[]>>('/tickets');
    return response.data.data;
  },

  getMyTickets: async (): Promise<TicketResponse[]> => {
    const response = await axiosClient.get<ApiResponse<TicketResponse[]>>('/tickets/my');
    return response.data.data;
  },

  getTicketById: async (id: string): Promise<TicketResponse> => {
    const response = await axiosClient.get<ApiResponse<TicketResponse>>(`/tickets/${id}`);
    return response.data.data;
  },

  getSimilarTickets: async (query: string): Promise<TicketResponse[]> => {
    const response = await axiosClient.get<ApiResponse<TicketResponse[]>>(`/tickets/similar`, {
      params: { query }
    });
    return response.data.data;
  },

  assignTicket: async (id: string, technicianId: string): Promise<TicketResponse> => {
    const response = await axiosClient.patch<ApiResponse<TicketResponse>>(
      `/tickets/${id}/assign`,
      null,
      { params: { technicianId } } // Depending on backend expectation, usually query param or body
    );
    return response.data.data;
  },

  updateTicketStatus: async (id: string, data: UpdateTicketStatusRequest): Promise<TicketResponse> => {
    const response = await axiosClient.patch<ApiResponse<TicketResponse>>(`/tickets/${id}/status`, data);
    return response.data.data;
  },

  closeTicket: async (id: string): Promise<TicketResponse> => {
    const response = await axiosClient.patch<ApiResponse<TicketResponse>>(`/tickets/${id}/close`);
    return response.data.data;
  },

  deleteTicket: async (id: string): Promise<void> => {
    await axiosClient.delete(`/tickets/${id}`);
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  addComment: async (ticketId: string, data: AddCommentRequest): Promise<CommentResponse> => {
    const response = await axiosClient.post<ApiResponse<CommentResponse>>(`/tickets/${ticketId}/comments`, data);
    return response.data.data;
  },

  getComments: async (ticketId: string): Promise<CommentResponse[]> => {
    const response = await axiosClient.get<ApiResponse<CommentResponse[]>>(`/tickets/${ticketId}/comments`);
    return response.data.data;
  },

  updateComment: async (commentId: string, data: AddCommentRequest): Promise<CommentResponse> => {
    const response = await axiosClient.put<ApiResponse<CommentResponse>>(`/tickets/comments/${commentId}`, data);
    return response.data.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await axiosClient.delete(`/tickets/comments/${commentId}`);
  },

  // ── Attachments ────────────────────────────────────────────────────────────

  uploadAttachment: async (ticketId: string, file: File): Promise<AttachmentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post<ApiResponse<AttachmentResponse>>(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  getAttachments: async (ticketId: string): Promise<AttachmentResponse[]> => {
    const response = await axiosClient.get<ApiResponse<AttachmentResponse[]>>(`/tickets/${ticketId}/attachments`);
    return response.data.data;
  },

  downloadAttachment: async (attachmentId: string): Promise<Blob> => {
    const response = await axiosClient.get(`/tickets/attachments/${attachmentId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await axiosClient.delete(`/tickets/attachments/${attachmentId}`);
  }
};
