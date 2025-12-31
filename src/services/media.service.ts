import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface MediaAssetItem {
  asset_id: number;
  tenant_id?: number;
  uploaded_by?: number;
  file_url: string;
  storage_provider?: string;
  file_type: string;
  file_size?: number;
  original_name?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[];
  rights_expiry?: string | null;
  created_at?: string;
  updated_at?: string;
  uploader?: { id: number; name: string; email: string };
}

export interface MediaListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MediaListResponse {
  data: MediaAssetItem[];
  meta: MediaListMeta;
}

export const mediaService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    sort_by?: 'created_at' | 'rights_expiry' | 'title' | string;
    sort_order?: 'ASC' | 'DESC';
    tags?: string[] | string;
    search?: string;
    expiring_before?: string;
    expiring_after?: string;
  }): Promise<ApiResponse<MediaListResponse>> => {
    try {
      const queryParams = { ...params };
      if (Array.isArray(queryParams.tags)) {
        queryParams.tags = queryParams.tags.join(',');
      }
      const response = await api.get<any>('/media/assets', { params: queryParams });
      
      // Normalize response to ensure consistency
      const data = response.data.data || response.data;
      const meta = response.data.meta || response.meta;

      return {
        success: true,
        data: Array.isArray(data) ? { data, meta } : data
      } as ApiResponse<MediaListResponse>;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch media assets',
      };
    }
  },

  create: async (data: {
    file_url: string;
    storage_provider?: string;
    file_type?: string;
    file_size?: number;
    original_name?: string | null;
    title?: string | null;
    description?: string | null;
    tags?: string[] | string;
    rights_expiry?: string | null;
  }): Promise<ApiResponse<{ asset: MediaAssetItem }>> => {
    try {
      const response = await api.post<any>('/media/assets', data);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create media asset',
      };
    }
  },

  get: async (assetId: number | string): Promise<ApiResponse<{ asset: MediaAssetItem }>> => {
    try {
      const response = await api.get<any>(`/media/assets/${assetId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch media asset',
      };
    }
  },

  update: async (
    assetId: number | string,
    data: {
      title?: string | null;
      description?: string | null;
      tags?: string[] | string;
      rights_expiry?: string | null;
    }
  ): Promise<ApiResponse<{ asset: MediaAssetItem }>> => {
    try {
      const response = await api.patch<any>(`/media/assets/${assetId}`, data);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update media asset',
      };
    }
  },

  delete: async (assetId: number | string): Promise<ApiResponse> => {
    try {
      await api.delete(`/media/assets/${assetId}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete media asset',
      };
    }
  },
};
