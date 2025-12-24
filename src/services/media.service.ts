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
      const response = await api.get<ApiResponse<MediaListResponse>>('/media/assets', { params: queryParams });
      return response.data;
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
      const response = await api.post<ApiResponse<{ asset: MediaAssetItem }>>('/media/assets', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create media asset',
      };
    }
  },

  get: async (assetId: number | string): Promise<ApiResponse<{ asset: MediaAssetItem }>> => {
    try {
      const response = await api.get<ApiResponse<{ asset: MediaAssetItem }>>(`/media/assets/${assetId}`);
      return response.data;
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
      const response = await api.put<ApiResponse<{ asset: MediaAssetItem }>>(`/media/assets/${assetId}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update media asset',
      };
    }
  },

  delete: async (assetId: number | string): Promise<ApiResponse<{ success: boolean }>> => {
    try {
      const response = await api.delete<ApiResponse<{ success: boolean }>>(`/media/assets/${assetId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete media asset',
      };
    }
  },
};
