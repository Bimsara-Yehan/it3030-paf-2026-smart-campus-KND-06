import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../../api/tickets';
import { ticketKeys } from '../../hooks/useTickets';
import { useToastStore } from '../../store/useToastStore';
import type { TicketResponse, TicketStatus } from '../../types/ticket';
import { Link } from 'react-router-dom';

const COLUMNS = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
] as TicketStatus[];

interface KanbanBoardProps {
  tickets: TicketResponse[];
}

export default function KanbanBoard({ tickets }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<TicketStatus | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      ticketApi.updateTicketStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      addToast(`Ticket #${variables.id.split('-')[0]} moved to ${variables.status.replace('_', ' ')}`, 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to move ticket', 'error');
    }
  });

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image hack
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (isDraggingOver !== status) {
      setIsDraggingOver(status);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(null);
  };

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setIsDraggingOver(null);
    if (!draggedTicketId) return;

    const ticket = tickets.find((t) => t.id === draggedTicketId);
    if (ticket && ticket.status !== status) {
      // Optimistic visual update could go here
      updateStatusMutation.mutate({ id: draggedTicketId, status });
    }
    setDraggedTicketId(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full min-h-[600px] items-start">
      {COLUMNS.map((status) => {
        const columnTickets = tickets.filter((t) => t.status === status);
        const isOver = isDraggingOver === status;

        return (
          <div
            key={status}
            className={`flex-shrink-0 w-80 bg-gray-50 rounded-xl border flex flex-col max-h-full transition-colors ${
              isOver ? 'border-blue-400 bg-blue-50 shadow-inner' : 'border-gray-200'
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-gray-200 bg-white/50 rounded-t-xl flex justify-between items-center">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">
                {status.replace('_', ' ')}
              </h3>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                {columnTickets.length}
              </span>
            </div>

            {/* Column Body / Tickets */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
              {columnTickets.map((ticket) => {
                const isDragging = draggedTicketId === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    onDragEnd={() => setDraggedTicketId(null)}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group animate-in slide-in-from-bottom duration-500 ${
                      isDragging ? 'opacity-40 scale-95 border-blue-300 ring-2 ring-blue-100' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(ticket.priority)}`}
                          title={`Priority: ${ticket.priority}`}
                        />
                        <span className="text-xs font-semibold text-gray-400 uppercase">
                          {ticket.id.split('-')[0]}
                        </span>
                      </div>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 transition-opacity"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-800 mb-1 leading-snug">
                      {ticket.title}
                    </h4>
                    
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
                      <span className="text-xs font-medium text-gray-500 truncate max-w-[120px]">
                        {ticket.assignedTechnician ? ticket.assignedTechnician.fullName : 'Unassigned'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">
                        {ticket.category?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {columnTickets.length === 0 && (
                <div className="h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 group-hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 shimmer">
                     <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                     </svg>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Drop here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
