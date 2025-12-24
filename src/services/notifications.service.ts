import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface NotificationItem {
  notification_id: number;
  tenant_id: number;
  user_id: number | null;
  post_id?: number | null;
  type: string;
  message?: string | null;
  payload?: any;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export const notificationsService = {
  list: async (params: { limit?: number; offset?: number; user_id?: number } = {}): Promise<ApiResponse<NotificationItem[]>> => {
    try {
      const response = await api.get<ApiResponse<NotificationItem[]>>('/notifications', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch notifications',
      };
    }
  },

  markRead: async (id: number | string): Promise<ApiResponse<NotificationItem>> => {
    try {
      const response = await api.post<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to mark notification as read',
      };
    }
  },
};
