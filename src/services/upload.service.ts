import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  storage: string;
}

export const uploadService = {
  uploadFile: async (file: File): Promise<ApiResponse<UploadResult>> => {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await api.post<any>('/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload file',
      };
    }
  },

  info: async (): Promise<ApiResponse<{ hasS3?: boolean }>> => {
    try {
      const response = await api.get<any>('/upload/info');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch upload info',
      };
    }
  },
};
