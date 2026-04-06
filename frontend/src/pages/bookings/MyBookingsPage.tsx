import React, { useEffect } from 'react';
import useBookings from '../../hooks/useBookings';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import { BookingStatus } from '../../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const MyBookingsPage: React.FC = () => {
  const { bookings, loading, error, fetchMyBookings } = useBookings();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            My Resource Requests
          </h1>
          <p className="text-gray-500 mt-1">Track and manage your upcoming campus resource bookings.</p>
        </div>

        <button
          onClick={() => navigate('/bookings/new')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Request Resource
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-3">
          <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/40 border border-white/40 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl min-h-[400px]">
          <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-inner">
             <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">You haven't made any bookings yet</h3>
          <p className="text-gray-500 mt-2 max-w-xs">
            Start by requesting a resource like a study room, lab, or equipment.
          </p>
          <button 
            onClick={() => navigate('/bookings/new')}
            className="mt-6 text-blue-600 font-semibold hover:underline"
          >
            Create your first request →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div 
              key={booking.id}
              className="group relative bg-white/50 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-blue-900/5 hover:bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>

              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-bold text-gray-900 truncate">{booking.resource?.name}</h3>
                {booking.status === BookingStatus.APPROVED && (
                  <a
                    href={`http://localhost:8081/api/bookings/${booking.id}/calendar`}
                    download
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Export to Calendar (.ics)"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </a>
                )}
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(new Date(booking.startTime), 'EEEE, MMM dd')}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                </div>
              </div>

              {booking.rejectionReason && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-600">
                  <p className="font-bold mb-1">Rejection Reason:</p>
                  <p>{booking.rejectionReason}</p>
                </div>
              )}

              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <button className="text-blue-600 text-sm font-bold flex items-center gap-1">
                   Details <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth={2}/></svg>
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
