import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../../context/AuthContext';
import { UserRole, BookingStatus } from '../../types';
import type { Booking, ApiResponse } from '../../types';
import axiosClient from '../../api/axiosClient';
import BookingFormModal from './BookingFormModal';
import BookingDetailsPopup from './BookingDetailsPopup';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
  status: string;
}

interface Props {
  resourceId: string | null;
  resourceName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: '#16a34a',
  PENDING: '#6b7280',
  REJECTED: '#dc2626',
  CANCELLED: '#1f2937',
};

const CalendarBookingView = ({ resourceId, resourceName }: Props) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/bookings' : '/bookings/my';
      const res = await axiosClient.get<ApiResponse<Booking[]>>(endpoint);
      setBookings(res.data.data ?? []);
    } catch {
      // Silently fail — empty calendar is better than a crash
    } finally {
      setLoading(false);
    }
  }, [resourceId, isAdmin]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Only show bookings for the selected resource
  const resourceBookings = bookings.filter(b => b.resource?.id === resourceId);

  const events: CalendarEvent[] = resourceBookings.map(b => ({
    id: b.id,
    title: isAdmin
      ? `${b.user?.fullName ?? 'Unknown'} — ${b.notes ?? ''}`
      : b.notes ?? 'Booking',
    start: new Date(b.startTime),
    end: new Date(b.endTime),
    resource: b,
    status: b.status,
  }));

  const eventPropGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: STATUS_COLORS[event.status] ?? '#6b7280',
      opacity: event.status === 'PENDING' ? 0.7 : 1,
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      fontSize: '12px',
      fontWeight: 600,
      padding: '2px 6px',
    },
  });

  const handleSelectSlot = ({ start }: SlotInfo) => {
    if (!resourceId) {
      alert('Please select a resource first.');
      return;
    }

    // Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(start);
    picked.setHours(0, 0, 0, 0);
    if (picked < today) {
      alert('You cannot book dates in the past.');
      return;
    }

    // Warn if the clicked slot overlaps an approved booking
    const hasConflict = resourceBookings
      .filter(b => b.status === BookingStatus.APPROVED)
      .some(b => start >= new Date(b.startTime) && start < new Date(b.endTime));

    if (hasConflict) {
      alert('This time slot is already booked. Please choose a different time.');
      return;
    }

    setSelectedSlot({ start });
    setShowFormModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.resource);
  };

  const handleBookingCreated = () => {
    setShowFormModal(false);
    setSelectedSlot(null);
    fetchBookings();
  };

  // Business hours 08:00 – 17:00
  const minTime = new Date();
  minTime.setHours(8, 0, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(17, 0, 0, 0);

  if (!resourceId) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p className="text-gray-500 font-medium">Select a resource above to view its booking calendar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="text-lg font-bold">{resourceName ?? 'Resource'} — Booking Calendar</h2>
        <p className="text-sm text-blue-100">Click an empty slot to book · Business hours: 8 AM – 5 PM</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Legend:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-600 font-medium">
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-4 text-gray-900">
          <Calendar<CalendarEvent>
            localizer={localizer}
            events={events}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={['month', 'week', 'day']}
            defaultView="week"
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            min={minTime}
            max={maxTime}
            step={30}
            timeslots={2}
            style={{ height: 560 }}
          />
        </div>
      )}

      {/* Booking form modal */}
      {showFormModal && selectedSlot && (
        <BookingFormModal
          resourceId={resourceId}
          selectedDate={selectedSlot.start}
          onClose={() => { setShowFormModal(false); setSelectedSlot(null); }}
          onSuccess={handleBookingCreated}
        />
      )}

      {/* Booking details popup */}
      {selectedBooking && (
        <BookingDetailsPopup
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default CalendarBookingView;
