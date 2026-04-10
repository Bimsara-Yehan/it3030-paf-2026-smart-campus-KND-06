import { useState, useMemo } from 'react';
import { useTickets } from '../../hooks/useTickets';
import TicketForm from '../../components/tickets/TicketForm';
import KanbanBoard from '../../components/tickets/KanbanBoard';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts';

export default function TicketsPage() {
  const { user } = useAuth();
  const { data: tickets, isLoading, error } = useTickets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'BOARD'>('LIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRIORITY' | 'STATUS'>('NEWEST');

  const isElevated = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  // ── Ticket counts ────────────────────────────────────────────────────────
  const openTicketsCount = tickets?.filter(t => t.status === 'OPEN').length || 0;
  const inProgressCount = tickets?.filter(t => t.status === 'IN_PROGRESS').length || 0;

  // ── Chart data calculations ──────────────────────────────────────────────
  const ticketsByCategory = useMemo(() => {
    if (!tickets) return [];
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name: name.replace('_', ' '),
      value,
      color: [`#3B82F6`, `#10B981`, `#F59E0B`, `#EF4444`, `#8B5CF6`][i % 5]
    }));
  }, [tickets]);

  const ticketsByDay = useMemo(() => {
    if (!tickets) return [];
    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      const day = t.createdAt.split('T')[0];
      if (last7Days.includes(day)) {
        counts[day] = (counts[day] || 0) + 1;
      }
    });

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString([], {month: 'short', day: 'numeric'}),
      count: counts[date] || 0
    }));
  }, [tickets]);

  const filteredTickets = (tickets || [])
    .filter((t) => (filterStatus === 'ALL' ? true : t.status === filterStatus))
    .filter((t) => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        const priorityMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
      if (sortBy === 'STATUS') {
        return a.status.localeCompare(b.status);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

  return (
    <div className="p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* ════════════════════════════════════════════════════════════════════
          INCIDENT TICKETING SUMMARY CARD (ADMIN/TECH ONLY)
      ════════════════════════════════════════════════════════════════════ */}
      {isElevated && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 p-6 shadow-md text-white animate-in slide-in-from-top duration-500">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-amber-100">Incident Ticketing Summary</p>
              <h2 className="mt-2 text-3xl font-bold">Active Campus Issues</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:flex md:items-center md:gap-12">
            <div className="flex flex-col">
              <span className="text-4xl font-bold">{isLoading ? '...' : openTicketsCount}</span>
              <span className="text-xs font-medium text-amber-100 flex items-center gap-2 mt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span> Open
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-bold">{isLoading ? '...' : inProgressCount}</span>
              <span className="text-xs font-medium text-amber-100 flex items-center gap-2 mt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400"></span> In Progress
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ANALYTICS CHARTS (Category & Volume) (ADMIN/TECH ONLY)
      ════════════════════════════════════════════════════════════════════ */}
      {isElevated && !isLoading && tickets && tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-500">
          {/* Tickets by Category */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Tickets by Category</h3>
              <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                {tickets.length} total
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">Distribution across categories</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {ticketsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Ticket Volume */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Recent Ticket Volume</h3>
              <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                Last 7 days
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">Daily submission trends</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsByDay} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                  <Tooltip cursor={{fill: '#F9FAFB'}} content={<VolumeTooltip />} />
                  <Bar dataKey="count" fill="#b45309" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TICKETS LIST & MANAGEMENT
      ════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Tickets</h2>
            <p className="text-gray-500 mt-1 text-sm">
              {user?.role === 'USER' ? 'View and track all your support requests.' : 'Review, assign, and resolve tickets.'}
            </p>
          </div>
          {user?.role !== 'ADMIN' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-5 py-2.5 bg-amber-700 text-white font-medium rounded-xl shadow-sm hover:bg-amber-800 transition-all focus:ring-4 focus:ring-amber-100 active:scale-95"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Submit New </span>Ticket
            </button>
          )}
        </div>

        {/* Filter and View Toggle Bar */}
        <div className="glass p-4 rounded-2xl shadow-sm border border-white/40 flex flex-col sm:flex-row justify-between gap-4 animate-in slide-in-from-bottom duration-500">
          <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? 'bg-amber-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all bg-gray-50/50"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="NEWEST">Latest First</option>
              <option value="PRIORITY">Highest Priority</option>
              <option value="STATUS">By Status</option>
            </select>

            {isElevated && (
              <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center shrink-0 shadow-inner">
                <button
                  onClick={() => setViewMode('LIST')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'LIST' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('BOARD')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'BOARD' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Board
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 w-full shimmer rounded-xl border border-gray-100" />
            ))}
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center">
            <div className="max-w-md">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Error loading tickets</h3>
              <p className="text-sm text-gray-500">We could not fetch the ticketing data. Please try refreshing.</p>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center animate-in scale-in">
            <div className="max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">There are no tickets matching this status. Everything on campus is running smoothly!</p>
              {filterStatus !== 'ALL' && (
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-all shadow-md active:scale-95"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'BOARD' && isElevated ? (
          <div className="p-6 bg-gray-50 h-[calc(100vh-300px)] overflow-hidden rounded-b-xl border-t border-gray-200">
            <KanbanBoard tickets={filteredTickets} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 animate-in fade-in duration-700">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Details</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Priority</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{ticket.title}</span>
                        <span className="text-xs text-gray-500">ID: {ticket.id.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="text-sm text-gray-700">{ticket.category?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeColor(ticket.status)}`}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-md ${getPriorityBadgeColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/tickets/${ticket.id}`} className="inline-flex items-center text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors">
                        View <span className="sr-only">, {ticket.title}</span>
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Modal for creating a ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-transparent text-left overflow-visible shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <TicketForm 
                onSuccess={() => setIsModalOpen(false)} 
                onCancel={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ── Chart tooltip components ────────────────────────────────────────────────

/**
 * Custom tooltip for the ticket category pie chart.
 */
function CategoryTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-700">{entry.name}</p>
      <p className="mt-0.5 text-amber-700">
        {entry.value} {entry.value === 1 ? 'ticket' : 'tickets'}
      </p>
    </div>
  );
}

/**
 * Custom tooltip for the ticket volume bar chart.
 */
function VolumeTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="mt-0.5 text-amber-700">
        {payload[0].value} {payload[0].value === 1 ? 'ticket' : 'tickets'}
      </p>
    </div>
  );
}
