import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface InvitationItem {
  id: number;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | string;
  expires_at?: string;
  created_at?: string;
  role?: { id: number; name: string } | null;
  inviter?: { id: number; name: string; email: string } | null;
}

export interface InvitationsListResponse {
  invitations: InvitationItem[];
}

export const invitationService = {
  send: async (
    payload: { email: string; roleId?: number; role_id?: number; name?: string }
  ): Promise<ApiResponse<{ invitation: InvitationItem }>> => {
    try {
      const response = await api.post<any>('/invitations', payload);
      return {
        success: true,
        data: { invitation: response.data.data?.invitation as InvitationItem },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send invitation',
      };
    }
  },

  list: async (): Promise<ApiResponse<InvitationsListResponse>> => {
    try {
      const response = await api.get<any>('/invitations');
      return {
        success: true,
        data: { invitations: (response.data.data ?? []) as InvitationItem[] },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch invitations',
      };
    }
  },

  resend: async (id: number): Promise<ApiResponse<{ message?: string }>> => {
    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(`/invitations/${id}/resend`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to resend invitation',
      };
    }
  },

  cancel: async (id: number): Promise<ApiResponse<{ message?: string }>> => {
    try {
      const response = await api.delete<ApiResponse<{ message?: string }>>(`/invitations/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to cancel invitation',
      };
    }
  },

  verify: async (token: string): Promise<ApiResponse<{ 
    email: string; 
    tenant?: { id: number; name: string } | null; 
    role?: { id: number; name: string } | null; 
    inviter?: { id: number; name: string; email: string } | null; 
    expires_at?: string 
  }>> => {
    try {
      const response = await api.get<ApiResponse<any>>(`/auth/invitation/verify/${token}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to verify invitation',
      };
    }
  },

  accept: async (
    token: string,
    payload: { password: string; name?: string }
  ): Promise<ApiResponse<{ 
    user: { id: number; email: string; name: string; tenant_id: number; role?: string }; 
    accessToken: string; 
    refreshToken: string 
  }>> => {
    try {
      const response = await api.post<ApiResponse<any>>(`/auth/invitation/accept/${token}`, payload);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to accept invitation',
      };
    }
  },
};
