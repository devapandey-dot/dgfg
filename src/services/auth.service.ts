import api from './api';
import { ApiResponse, LoginResponse, SignupResponse, ForgotPasswordResponse, ResetPasswordResponse } from '@/types/api.types';

export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  },

  verifyOTP: async (email: string, otp: string): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Verification failed',
      };
    }
  },

  signup: async (data: any): Promise<ApiResponse<SignupResponse>> => {
    try {
      const response = await api.post<ApiResponse<SignupResponse>>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed',
      };
    }
  },

  forgotPassword: async (email: string): Promise<ApiResponse<ForgotPasswordResponse>> => {
    try {
      const response = await api.post<ApiResponse<ForgotPasswordResponse>>('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Request failed',
      };
    }
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<ResetPasswordResponse>> => {
    try {
      const response = await api.post<ApiResponse<ResetPasswordResponse>>('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Reset failed',
      };
    }
  },

  googleAuth: (): void => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    window.location.href = `${backendUrl}/auth/google`;
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await api.post<ApiResponse>('/auth/logout', { refreshToken });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Logout failed',
      };
    }
  },
  
  // Storage helpers
  getAccessToken: () => localStorage.getItem('accessToken'),
  setAccessToken: (token: string) => localStorage.setItem('accessToken', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: any) => localStorage.setItem('user', JSON.stringify(user)),
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};
