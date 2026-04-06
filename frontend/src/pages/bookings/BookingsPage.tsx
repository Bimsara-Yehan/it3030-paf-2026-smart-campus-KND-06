import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, BookingStatus } from '../../types';
import type { BookingStatus as BookingStatusType } from '../../types';
import axiosClient from '../../api/axiosClient';
import type { ApiResponse, Booking } from '../../types';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingStatusType | 'ALL'>('ALL');

  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/bookings' : '/bookings/my';
      const response = await axiosClient.get<ApiResponse<Booking[]>>(endpoint);
      setBookings(response.data.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [isAdmin]);

  const handleApprove = async (id: string) => {
    try {
      await axiosClient.patch(`/bookings/${id}/approve`);
      fetchBookings();
    } catch (err) {
      alert('Failed to approve booking.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Please enter a reason for rejection:');
    if (reason === null) return;
    try {
      await axiosClient.patch(`/bookings/${id}/reject`, { reason });
      fetchBookings();
    } catch (err) {
      alert('Failed to reject booking.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axiosClient.patch(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  const filteredBookings = filter === 'ALL' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  if (loading) return <div className="p-8 text-center text-blue-600">Loading bookings...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {isAdmin ? 'Booking Approval Matrix' : 'My Resource Requests'}
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            {isAdmin ? 'Review and manage incoming resource requests.' : 'Track and manage your campus resource reservations.'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => navigate('/bookings/create')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Booking
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl animate-shake">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-sm overflow-x-auto no-scrollbar">
        {(['ALL', ...Object.values(BookingStatus)] as (BookingStatusType | 'ALL')[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
              filter === s 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div 
              key={booking.id} 
              className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <BookingStatusBadge status={booking.status} />
              </div>

              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-bold text-gray-900 truncate">{booking.resource?.name}</h3>
                <div className="group-hover:opacity-0 transition-opacity">
                   <BookingStatusBadge status={booking.status} />
                </div>
              </div>
              
              <div className="mt-4 space-y-3 flex-grow">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                  </div>
                  <span className="font-medium">
                    {format(new Date(booking.startTime), 'MMM d, h:mm a')}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="font-semibold">{booking.user?.fullName}</span>
                  </div>
                )}
                {booking.notes && (
                   <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                      "{booking.notes}"
                   </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                {isAdmin && booking.status === BookingStatus.PENDING && (
                  <>
                    <button
                      onClick={() => handleApprove(booking.id)}
                      className="flex-1 px-4 py-2.5 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(booking.id)}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                      Reject
                    </button>
                  </>
                )}
                {!isAdmin && booking.status === BookingStatus.PENDING && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
             <div className="p-4 bg-white rounded-full shadow-lg mb-4 text-gray-300">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <h3 className="text-lg font-bold text-gray-900">No booking records found</h3>
             <p className="text-gray-500 max-w-xs">There are no resource requests matched to your current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
