import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  my: () => [...ticketKeys.lists(), 'my'] as const,
  allTickets: () => [...ticketKeys.lists(), 'all'] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  comments: (id: string) => [...ticketKeys.detail(id), 'comments'] as const,
  attachments: (id: string) => [...ticketKeys.detail(id), 'attachments'] as const,
};

export function useTickets() {
  const { user } = useAuth();
  
  // Admins and Technicians see all tickets; Users see only their own.
  const isElevated = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  return useQuery({
    queryKey: isElevated ? ticketKeys.allTickets() : ticketKeys.my(),
    queryFn: () => isElevated ? ticketApi.getAllTickets() : ticketApi.getMyTickets(),
    enabled: !!user,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to window
    refetchOnMount: true, // Refetch when component mounts
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => ticketApi.getTicketById(id),
    enabled: !!id,
  });
}

export function useTicketComments(id: string) {
  return useQuery({
    queryKey: ticketKeys.comments(id),
    queryFn: () => ticketApi.getComments(id),
    enabled: !!id,
  });
}

export function useTicketAttachments(id: string) {
  return useQuery({
    queryKey: ticketKeys.attachments(id),
    queryFn: () => ticketApi.getAttachments(id),
    enabled: !!id,
  });
}
