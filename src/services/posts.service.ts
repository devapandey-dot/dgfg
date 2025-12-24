import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface PostListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostItem {
  post_id?: number;
  id?: number | string;
  post_name?: string;
  description?: string;
  status?: string;
  post_type?: string;
  platforms?: string[] | string;
  scheduled_time?: string | null;
  created_at?: string;
  updated_at?: string;
  attachments?: Array<{ attachment_id: number; file_url: string; file_type: string; file_size: number }>;
  assignments?: Array<{ assignment_id: number; user_id: number; role?: string; is_complete?: boolean; completed_at?: string | null }>;
}

export interface PostListResponse {
  data: PostItem[];
  meta: PostListMeta;
}

export const postsService = {
  get: async (postId: number | string): Promise<ApiResponse<{ post: PostItem }>> => {
    try {
      const response = await api.get<ApiResponse<{ post: PostItem }>>(`/posts/${postId}`, {
        params: { _: Date.now() }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch post',
      };
    }
  },

  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string | string[];
    post_type?: string | string[];
    platforms?: string | string[];
    created_from?: string;
    created_to?: string;
    scheduled_from?: string;
    scheduled_to?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    search?: string;
  }): Promise<ApiResponse<PostListResponse>> => {
    try {
      const queryParams = { ...params };
      // Convert array params to comma-separated strings if needed
      ['status', 'post_type', 'platforms'].forEach(key => {
        if (Array.isArray((queryParams as any)[key])) {
          (queryParams as any)[key] = (queryParams as any)[key].join(',');
        }
      });

      const response = await api.get<any>('/posts', { params: queryParams });
      
      // Normalize response
      const normalized: PostListResponse = Array.isArray(response.data.data)
        ? { data: response.data.data, meta: response.data.meta }
        : response.data;

      return { success: true, data: normalized };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch posts',
      };
    }
  },

  action: async (
    postId: number | string,
    action: string,
    payload: Record<string, any> = {}
  ): Promise<ApiResponse<{ post?: PostItem }>> => {
    try {
      const response = await api.post<ApiResponse<{ post?: PostItem }>>(`/posts/${postId}/action`, { action, payload });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to perform action',
      };
    }
  },

  addComment: async (
    postId: number | string,
    data: { message: string; parent_comment_id?: number; mentions?: number[] }
  ): Promise<ApiResponse<{ comment?: any }>> => {
    try {
      const response = await api.post<ApiResponse<{ comment?: any }>>(`/posts/${postId}/comments`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to add comment',
      };
    }
  },

  getComments: async (postId: number | string): Promise<ApiResponse<{ comments?: any[] }>> => {
    try {
      const response = await api.get<ApiResponse<{ comments?: any[] }>>(`/posts/${postId}/comments`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch comments',
      };
    }
  },

  create: async (payload: {
    post_name: string;
    post_type: string;
    description?: string;
    platforms: string[];
    scheduled_time?: string | null;
    status?: string;
    attachments?: Array<{ file_url: string; file_type: string; file_size?: number }>;
    assignments?: Array<{ user_id: number; role?: string }>;
  }): Promise<ApiResponse<PostItem>> => {
    try {
      const response = await api.post<ApiResponse<PostItem>>('/posts', payload);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create post',
      };
    }
  },
};
