import { useParams, Link } from 'react-router-dom';
import { useTicket, useTicketAttachments } from '../../hooks/useTickets';
import { TicketStatus } from '../../types/ticket';
import CommentSection from '../../components/tickets/CommentSection';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: ticket, isLoading, error } = useTicket(id!);
  const { data: attachments, isLoading: loadingAttachments } = useTicketAttachments(id!);

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

  const isTechOrAdmin = user?.role === UserRole.TECHNICIAN || user?.role === UserRole.ADMIN;

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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500">Ticket ID: {ticket.id}</p>
          </div>
          
          {/* Action Area */}
          {isTechOrAdmin && ticket.status !== TicketStatus.CLOSED && (
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium transition-colors">
                Update Status
              </button>
            </div>
          )}
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
                <span className="block text-sm font-medium text-gray-900 mt-1">{ticket.reporter?.fullName || 'Unknown'}</span>
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
                  {ticket.assignedTechnician ? ticket.assignedTechnician.fullName : <span className="text-gray-400 italic">Unassigned</span>}
                </span>
              </div>
              {ticket.resourceId && (
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase">Related Asset</span>
                  <span className="block text-sm font-medium text-gray-900 mt-1">{ticket.resourceId.split('-')[0]}</span>
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
