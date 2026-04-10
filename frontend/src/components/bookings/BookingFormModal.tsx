import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import axiosClient from '../../api/axiosClient';

interface FormData {
  startTime: string;
  endTime: string;
  purpose: string;
  attendees?: number;
}

interface Props {
  resourceId: string;
  selectedDate: Date;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingFormModal = ({ resourceId, selectedDate, onClose, onSuccess }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onChange' });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const getDuration = () => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  };

  const validateStartHours = (val: string) => {
    if (!val) return true;
    const h = Number(val.split(':')[0]);
    return (h >= 8 && h < 17) || 'Must be between 8:00 AM and 5:00 PM';
  };

  const validateEndTime = (val: string) => {
    if (!val) return true;
    const [sh, sm] = (startTime || '00:00').split(':').map(Number);
    const [eh, em] = val.split(':').map(Number);
    if (eh < 8 || eh > 17 || (eh === 17 && em > 0)) return 'Must be between 8:00 AM and 5:00 PM';
    if (eh * 60 + em <= sh * 60 + sm) return 'End time must be after start time';
    return true;
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      // Guard: no past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        setServerError('Cannot book dates in the past.');
        return;
      }

      const [sh, sm] = data.startTime.split(':').map(Number);
      const [eh, em] = data.endTime.split(':').map(Number);

      const startDt = new Date(selectedDate);
      startDt.setHours(sh, sm, 0, 0);
      const endDt = new Date(selectedDate);
      endDt.setHours(eh, em, 0, 0);

      // Use local date-time string (not UTC) so backend LocalDateTime parses correctly
      const toLocalIso = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss");

      await axiosClient.post('/bookings', {
        resourceId,
        startTime: toLocalIso(startDt),
        endTime: toLocalIso(endDt),
        purpose: data.purpose,
        ...(data.attendees ? { attendees: Number(data.attendees) } : {}),
      });

      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create booking. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const duration = getDuration();
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-xl font-bold">New Booking Request</h2>
          <p className="text-sm text-blue-100 mt-0.5">Fill in the details for your reservation</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Selected date (read-only) */}
          <div className="p-3 bg-linear-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Selected Date</p>
            <p className="text-sm font-bold text-blue-900">{formattedDate}</p>
          </div>

          {/* Time fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                min="08:00"
                max="17:00"
                {...register('startTime', {
                  required: 'Start time is required',
                  validate: validateStartHours,
                })}
                className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${
                  errors.startTime
                    ? 'border-red-500 focus:ring-red-200'
                    : startTime
                    ? 'border-blue-500 focus:ring-blue-200'
                    : 'border-gray-200 focus:ring-blue-200'
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.startTime.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">End Time *</label>
              <input
                type="time"
                min="08:00"
                max="17:00"
                {...register('endTime', {
                  required: 'End time is required',
                  validate: validateEndTime,
                })}
                className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${
                  errors.endTime
                    ? 'border-red-500 focus:ring-red-200'
                    : endTime
                    ? 'border-blue-500 focus:ring-blue-200'
                    : 'border-gray-200 focus:ring-blue-200'
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Duration summary */}
          {duration && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm font-semibold text-green-700">Duration: {duration}</p>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Purpose *</label>
            <textarea
              rows={3}
              placeholder="Describe the purpose of your booking..."
              {...register('purpose', {
                required: 'Purpose is required',
                minLength: { value: 5, message: 'At least 5 characters required' },
                maxLength: { value: 500, message: 'Maximum 500 characters' },
              })}
              className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors resize-none ${
                errors.purpose
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-200 focus:ring-blue-200'
              }`}
            />
            {errors.purpose && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {errors.purpose.message}
              </p>
            )}
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Attendees</label>
            <input
              type="number"
              placeholder="Optional"
              {...register('attendees', {
                min: { value: 1, message: 'Minimum 1 attendee' },
                max: { value: 999, message: 'Maximum 999 attendees' },
              })}
              className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${
                errors.attendees
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-200 focus:ring-blue-200'
              }`}
            />
            {errors.attendees && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {errors.attendees.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠</span> {serverError}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;
