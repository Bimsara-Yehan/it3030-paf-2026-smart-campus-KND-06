import axiosClient from './axiosClient';
import type { ApiResponse, User } from '@/types';

export const userApi = {
  getTechnicians: async (): Promise<User[]> => {
    const response = await axiosClient.get<ApiResponse<User[]>>('/users/role/TECHNICIAN');
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await axiosClient.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  }
};
