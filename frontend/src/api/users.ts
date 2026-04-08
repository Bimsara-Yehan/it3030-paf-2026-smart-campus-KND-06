import axiosClient from './axiosClient';
import type { ApiResponse, User, TicketCategory } from '@/types';

export const userApi = {
  getTechnicians: async (category?: TicketCategory): Promise<User[]> => {
    const url = category 
      ? `/users/technicians?category=${category}`
      : '/users/technicians';
    const response = await axiosClient.get<ApiResponse<User[]>>(url);
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await axiosClient.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  }
};
