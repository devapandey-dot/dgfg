import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface UserPermissionsDetails {
  role?: { id: number; name: string } | null;
  directPermissions?: string[];
  revokedPermissions?: string[];
  effectivePermissions?: string[];
}

export const permissionService = {
  details: async (userId: number | string): Promise<ApiResponse<UserPermissionsDetails>> => {
    try {
      const response = await api.get<ApiResponse<UserPermissionsDetails>>(`/user-permissions/${userId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user permissions',
      };
    }
  },

  add: async (userId: number | string, permission_code: string): Promise<ApiResponse<{ message?: string }>> => {
    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(`/user-permissions/${userId}/permissions`, { permission_code });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to add permission',
      };
    }
  },

  remove: async (userId: number | string, permission_code: string): Promise<ApiResponse<{ message?: string }>> => {
    try {
      const response = await api.delete<ApiResponse<{ message?: string }>>(`/user-permissions/${userId}/permissions`, { data: { permission_code } });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove permission',
      };
    }
  },
};
