import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface SocialProfile {
  _id?: string;
  id?: string | number;
  name?: string;
  color?: string;
  isDefault?: boolean;
}

export interface SocialAccount {
  id: number;
  tenant_id?: number;
  late_profile_id?: string;
  late_account_id?: string;
  platform: string;
  username?: string;
  display_name?: string;
  profile_picture?: string;
  is_active?: boolean;
}

export interface SocialPostRequest {
  postId: number | string;
  publish_now?: boolean;
  scheduled_time?: string | null;
  publishNow?: boolean;
  scheduledFor?: string | null;
  platforms?: string[];
  accountIds?: Record<string, string>;
}

export interface SocialPostResponse {
  job_id?: string;
  status?: string;
  message?: string;
  data?: any;
}

export const socialService = {
  getProfiles: async (): Promise<ApiResponse<SocialProfile[]>> => {
    try {
      const response = await api.get<ApiResponse<SocialProfile[]>>('/social/profiles');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch social profiles',
      };
    }
  },

  getAccounts: async (params?: { late_profile_id?: string; platform?: string; is_active?: boolean }): Promise<ApiResponse<SocialAccount[]>> => {
    try {
      const response = await api.get<ApiResponse<SocialAccount[]>>('/social/accounts', {
        params: { ...params, _: Date.now() }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch social accounts',
      };
    }
  },

  getProfileAccounts: async (profileId: string): Promise<ApiResponse<SocialAccount[]>> => {
    try {
      const response = await api.get<ApiResponse<SocialAccount[]>>(`/social/profiles/${profileId}/accounts`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch profile accounts',
      };
    }
  },

  initiateChannelConnect: async (
    platform: string,
    params: { profileId: string; redirect_url: string; headless?: boolean | string }
  ): Promise<ApiResponse<{ authUrl: string; state?: string }>> => {
    try {
      const response = await api.get<ApiResponse<{ authUrl: string; state?: string }>>(`/social/connect/${platform}`, { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || `Failed to initiate ${platform} connection`,
      };
    }
  },

  scheduleOrPublish: async (payload: SocialPostRequest): Promise<ApiResponse<SocialPostResponse>> => {
    try {
      const response = await api.post<ApiResponse<SocialPostResponse>>('/social/posts', payload);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to schedule or publish post',
      };
    }
  },
};
