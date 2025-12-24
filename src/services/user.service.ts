import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  tenant_id: number;
  is_active?: boolean;
}

export interface UsersListResponse {
  users: Array<UserProfile & { role?: { id: number; name: string } }>;
}

export const userService = {
  me: async (): Promise<ApiResponse<{ user: UserProfile }>> => {
    try {
      const response = await api.get<any>('/users/me');
      return {
        success: true,
        data: { user: response.data.user },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user profile',
      };
    }
  },

  list: async (): Promise<ApiResponse<UsersListResponse>> => {
    try {
      const response = await api.get<any>('/users');
      return {
        success: true,
        data: { users: response.data.users },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users',
      };
    }
  },

  updateRole: async (userId: number | string, roleId: number | string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.put<ApiResponse<{ message: string }>>(`/users/${userId}/role`, { role_id: roleId });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update user role',
      };
    }
  },

  remove: async (userId: number | string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove user',
      };
    }
  },
};
