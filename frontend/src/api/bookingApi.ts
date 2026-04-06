import axiosClient from './axiosClient';
import type { ApiResponse, Booking, BookingStatus } from '../types';

export interface CreateBookingRequest {
  resourceId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  reason: string;
}

export interface UpdateStatusRequest {
  status: BookingStatus;
  rejectionReason?: string;
}

export const bookingApi = {
  /** Get all bookings (Admin) */
  getAll: () => 
    axiosClient.get<ApiResponse<Booking[]>>('/bookings'),

  /** Get user's own bookings */
  getMyBookings: () => 
    axiosClient.get<ApiResponse<Booking[]>>('/bookings/me'),

  /** Get single booking details */
  getById: (id: string) => 
    axiosClient.get<ApiResponse<Booking>>(`/bookings/${id}`),

  /** Create a new booking request */
  create: (data: CreateBookingRequest) => 
    axiosClient.post<ApiResponse<Booking>>('/bookings', data),

  /** update booking status (Admin) */
  updateStatus: (id: string, data: UpdateStatusRequest) => 
    axiosClient.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, data),

  /** Delete/Cancel a booking */
  delete: (id: string) => 
    axiosClient.delete<ApiResponse<void>>(`/bookings/${id}`),
};

export default bookingApi;
