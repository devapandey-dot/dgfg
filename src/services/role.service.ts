import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface RoleItem {
  id: number;
  name: string;
  description?: string;
}

export interface RolesListResponse {
  roles: RoleItem[];
}

export const roleService = {
  list: async (): Promise<ApiResponse<RolesListResponse>> => {
    try {
      const response = await api.get<any>('/roles');
      return {
        success: true,
        data: { roles: response.data.roles as RoleItem[] },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch roles',
      };
    }
  },
};
