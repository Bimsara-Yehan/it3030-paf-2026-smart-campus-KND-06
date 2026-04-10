import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import type { Booking } from '../../types';
import BookingStatusBadge from './BookingStatusBadge';

interface Props {
  booking: Booking;
  onClose: () => void;
}

const BookingDetailsPopup = ({ booking, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={ref} className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-linear-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
          <h3 className="font-bold text-lg">Booking Details</h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <Row label="Resource" value={booking.resource?.name} />
          <Row label="From" value={format(new Date(booking.startTime), 'MMM d, yyyy h:mm a')} />
          <Row label="To" value={format(new Date(booking.endTime), 'MMM d, yyyy h:mm a')} />
          {booking.user && (
            <>
              <Row label="Booked by" value={booking.user.fullName} />
              <Row label="Email" value={booking.user.email} />
            </>
          )}
          {booking.notes && <Row label="Purpose" value={booking.notes} />}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm font-semibold text-gray-500">Status</span>
            <BookingStatusBadge status={booking.status} />
          </div>
          {booking.rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-semibold text-red-600 mb-0.5">Rejection Reason</p>
              <p className="text-sm text-red-700">{booking.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-start justify-between py-2 border-b border-gray-50">
    <span className="text-sm font-semibold text-gray-500 shrink-0 mr-4">{label}</span>
    <span className="text-sm text-gray-800 text-right break-all">{value || '—'}</span>
  </div>
);

export default BookingDetailsPopup;
