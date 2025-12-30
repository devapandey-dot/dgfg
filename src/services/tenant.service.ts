import api from './api';
import { ApiResponse, TenantResponse, TenantItem } from '@/types/api.types';

export const tenantService = {
  get: async (id: number | string): Promise<ApiResponse<TenantResponse>> => {
    try {
      const response = await api.get<ApiResponse<TenantResponse>>(`/tenants/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch tenant',
      };
    }
  },

  update: async (
    id: number | string,
    data: Partial<Pick<TenantItem, 'name' | 'domain' | 'timezone' | 'country' | 'logo'>>
  ): Promise<ApiResponse<TenantResponse>> => {
    try {
      const response = await api.put<ApiResponse<TenantResponse>>(`/tenants/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update tenant',
      };
    }
  },

  createSubtenant: async (data: {
    name: string;
    domain: string;
    timezone: string;
    admin_email: string;
    admin_name: string;
    admin_password?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post<ApiResponse<any>>('/tenants/subtenant', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create sub-tenant',
      };
    }
  },
};
