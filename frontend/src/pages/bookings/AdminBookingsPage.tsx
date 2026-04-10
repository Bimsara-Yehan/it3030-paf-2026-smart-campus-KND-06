import React, { useEffect, useState } from 'react';
import useBookings from '../../hooks/useBookings';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import { BookingStatus } from '../../types';
import type { BookingStatus as BookingStatusType } from '../../types';
import { format } from 'date-fns';

const AdminBookingsPage: React.FC = () => {
  const { bookings, loading, error, fetchAllBookings, updateStatus } = useBookings();
  const [filter, setFilter] = useState<BookingStatusType | 'ALL'>('ALL');

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    let reason = '';
    if (status === BookingStatus.REJECTED) {
      reason = window.prompt('Please enter a reason for rejection:') || 'No reason provided';
    }
    
    const result = await updateStatus(id, { status, rejectionReason: reason });
    if (result.success) {
      fetchAllBookings();
    } else {
      alert(result.message);
    }
  };

  const filteredBookings = filter === 'ALL' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900">
            Booking Approval Matrix
          </h1>
          <p className="text-gray-500 mt-1">Review and manage incoming resource requests.</p>
        </div>

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-sm">
          {(['ALL', ...Object.values(BookingStatus)] as (BookingStatusType | 'ALL')[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${filter === s 
                  ? 'bg-amber-700 text-white shadow-md shadow-amber-200'
                  : 'text-gray-600 hover:bg-white/50'}
              `}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-3">
          <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
          {error}
        </div>
      )}

      <div className="relative group overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl shadow-gray-900/5 min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-700/30 border-t-amber-700 rounded-full animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 flex items-center justify-center border-4 border-white shadow-inner">
               <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">No booking records found</h3>
            <p className="text-gray-500 mt-2 max-w-xs">
              {filter === 'ALL' 
                ? "There are no resource requests in the system currently." 
                : `No bookings found with status '${filter}'.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/40 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.resource?.name}</p>
                        <p className="text-xs text-gray-500">Resource ID: {booking.resource?.id.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                          {booking.user?.fullName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.user?.fullName}</p>
                          <p className="text-xs text-gray-500">{booking.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{format(new Date(booking.startTime), 'MMM dd, yyyy')}</p>
                        <p className="text-xs opacity-75">
                          {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === BookingStatus.PENDING ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(booking.id, BookingStatus.APPROVED)}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                            title="Approve"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, BookingStatus.REJECTED)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                            title="Reject"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Actioned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;
