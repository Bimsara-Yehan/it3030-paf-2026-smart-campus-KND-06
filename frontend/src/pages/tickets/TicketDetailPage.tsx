import { useParams, Link } from 'react-router-dom';
import { useTicket, useTicketAttachments } from '../../hooks/useTickets';
import { useAuth } from '../../context/AuthContext';
import CommentSection from '../../components/tickets/CommentSection';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../../api/tickets';
import { ticketKeys } from '../../hooks/useTickets';
import { useToastStore } from '../../store/useToastStore';
import { calculateSLA } from '../../utils/slaUtils';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const addToast = useToastStore((state) => state.addToast);

  const { data: ticket, isLoading, error } = useTicket(id!);
  const { data: attachments, isLoading: loadingAttachments } = useTicketAttachments(id!);
  const queryClient = useQueryClient();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const sla = ticket ? calculateSLA(ticket.priority, ticket.createdAt, ticket.status, ticket.resolvedAt) : null;

  const statusMutation = useMutation({
    mutationFn: ({ status, resolutionNotes }: { status: string; resolutionNotes?: string }) => 
      ticketApi.updateTicketStatus(id!, { status: status as any, resolutionNotes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id!) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      addToast(`Status updated to ${variables.status.replace('_', ' ')}`, 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  });

  const handleUpdateStatus = (status: string) => {
    let notes = undefined;
    if (status === 'RESOLVED') {
      const input = prompt('Enter resolution notes:');
      if (input === null) return;
      notes = input;
    }
    statusMutation.mutate({ status, resolutionNotes: notes });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ticket Not Found</h3>
        <p className="text-gray-500 mb-6">The ticket you are looking for does not exist or you don't have permission to view it.</p>
        <Link to="/tickets" className="text-blue-600 hover:underline">← Back to Tickets</Link>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const isTechOrAdmin = user?.role === 'TECHNICIAN' || isAdmin;
  const isReporter = user?.id === ticket.reporterId;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      {/* Header with Navigation */}
      <div>
        <Link to="/tickets" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Tickets
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getStatusBadgeColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded-lg ${getPriorityBadgeColor(ticket.priority)}`}>
              {ticket.priority} Priority
            </span>
            {sla && (
              <span className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                sla.status === 'MET' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                sla.status === 'OVERDUE' || sla.status === 'MISSED' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {sla.label}
              </span>
            )}
          </div>
            <p className="text-sm text-gray-500">Ticket ID: {ticket.id}</p>
          </div>
          
          {/* Action Area */}
          <div className="flex gap-3">
            {isTechOrAdmin && ticket.status === 'OPEN' && (
              <button 
                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-sm font-medium transition-colors"
                disabled={statusMutation.isPending}
              >
                Accept Ticket
              </button>
            )}
            {isTechOrAdmin && ticket.status === 'IN_PROGRESS' && (
              <button 
                onClick={() => handleUpdateStatus('RESOLVED')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 text-sm font-medium transition-colors"
                disabled={statusMutation.isPending}
              >
                Resolve Ticket
              </button>
            )}
            {(isAdmin || isReporter) && ticket.status === 'RESOLVED' && (
              <button 
                onClick={() => handleUpdateStatus('CLOSED')}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg shadow-sm hover:bg-black text-sm font-medium transition-colors"
                disabled={statusMutation.isPending}
              >
                Close Ticket
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Context) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Description</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
               <h3 className="text-lg font-semibold text-gray-800">Activity History</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <TimelineItem 
                  title="Ticket Reported" 
                  date={ticket.createdAt} 
                  description={`Reported by ${ticket.reporterName}`}
                  completed={true}
                />
                {ticket.assignedAt && (
                  <TimelineItem 
                    title="Ticket Assigned" 
                    date={ticket.assignedAt} 
                    description={`Assigned to ${ticket.assignedTechnicianName}`}
                    completed={true}
                  />
                )}
                {ticket.resolvedAt && (
                  <TimelineItem 
                    title="Incident Resolved" 
                    date={ticket.resolvedAt} 
                    description={ticket.resolutionNotes || "Technician has resolved the issue."}
                    completed={true}
                    color="green"
                  />
                )}
                {ticket.closedAt && (
                  <TimelineItem 
                    title="Ticket Closed" 
                    date={ticket.closedAt} 
                    description={`Closed by ${ticket.assignedByName || 'Admin'}`}
                    completed={true}
                    color="gray"
                  />
                )}
              </div>
            </div>
          </div>

          <CommentSection ticketId={ticket.id} />
        </div>

        {/* Right Column (Metadata) */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase">Reporter</span>
                <span className="block text-sm font-medium text-gray-900 mt-1">{ticket.reporterName || 'Unknown'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase">Category</span>
                <span className="block text-sm font-medium text-gray-900 mt-1">{ticket.category.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase">Priority</span>
                <span className="block text-sm font-medium text-gray-900 mt-1">{ticket.priority}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase">Assignee</span>
                <span className="block text-sm font-medium text-gray-900 mt-1">
                  {ticket.assignedTechnicianName ? ticket.assignedTechnicianName : <span className="text-gray-400 italic">Unassigned</span>}
                </span>
              </div>
              {ticket.resolutionNotes && (
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase">Resolution Notes</span>
                  <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg mt-2 border border-green-100 italic">
                    "{ticket.resolutionNotes}"
                  </p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-100">
                <span className="block text-xs font-semibold text-gray-500 uppercase">Created On</span>
                <span className="block text-sm font-medium text-gray-900 mt-1">
                  {new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Attachments</h3>
            </div>
            <div className="p-6">
              {loadingAttachments ? (
                <p className="text-sm text-gray-500 text-center animate-pulse">Loading files...</p>
              ) : attachments?.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <span className="text-sm text-gray-500">No attachments found</span>
                </div>
              ) : (
                <ul className="space-y-3">
                  {attachments?.map(file => (
                    <li key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center overflow-hidden">
                        <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 truncate">{file.fileName || 'Image Attachment'}</span>
                      </div>
                      <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-semibold">View</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ title, date, description, completed, color = 'blue' }: { 
  title: string; 
  date: string; 
  description: string; 
  completed: boolean;
  color?: 'blue' | 'green' | 'gray';
}) {
  const colorMap = {
    blue: 'bg-blue-600',
    green: 'bg-emerald-500',
    gray: 'bg-gray-400'
  };

  return (
    <div className="relative pl-8 pb-2">
      <div className="absolute left-[3px] top-1 bottom-0 w-[2px] bg-gray-100"></div>
      <div className={`absolute left-0 top-1 w-2 h-2 rounded-full z-10 ${completed ? colorMap[color] : 'bg-gray-200'}`}></div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">{title}</span>
          <span className="text-[10px] font-medium text-gray-400">
             {new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}
