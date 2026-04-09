import { useState, useCallback } from 'react';
import bookingApi from '../api/bookingApi';
import type { CreateBookingRequest, UpdateStatusRequest } from '../api/bookingApi';
import type { Booking } from '../types';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch all bookings (Admin) */
  const fetchAllBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingApi.getAll();
      setBookings(response.data.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetch user bookings (Student) */
  const fetchMyBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingApi.getMyBookings();
      setBookings(response.data.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch your bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Create booking */
  const createBooking = async (data: CreateBookingRequest) => {
    setLoading(true);
    setError(null);
    try {
      await bookingApi.create(data);
      return { success: true };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  /** Update status (Admin) */
  const updateStatus = async (id: string, data: UpdateStatusRequest) => {
    setLoading(true);
    setError(null);
    try {
      await bookingApi.updateStatus(id, data);
      return { success: true };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update booking status');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    error,
    fetchAllBookings,
    fetchMyBookings,
    createBooking,
    updateStatus,
  };
};

export default useBookings;
