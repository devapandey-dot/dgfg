import api from './api';
import { ApiResponse } from '@/types/api.types';

export interface SubscriptionResponse {
  subscription: {
    id: number;
    tenant_id: number;
    plan_id: number;
    plan_name: string;
    plan_type: 'Free' | 'Individual' | 'Business';
    price: number;
    currency: string;
    status: 'Active' | 'Trial' | 'Upcoming' | 'Expired' | 'Cancelled';
    Plan?: {
      id: number;
      plan_name: string;
      plan_type: string;
      description: string;
      price: number;
    };
  };
  usage: any;
}

export interface Plan {
  id: number;
  plan_name: string;
  plan_type: 'Free' | 'Individual' | 'Business';
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'Monthly' | 'Yearly';
  trial_days: number;
  max_social_accounts: number;
  max_posts_per_month: string;
  no_of_tenant: number;
  supported_channels: string[];
  storage_limit_mb: number;
  enable_ai_features: boolean;
  enable_approval_workflow: boolean;
  enable_advanced_analytics: boolean;
  enable_inbox: boolean;
  enable_review_management: boolean;
  custom_domain_support: boolean;
  is_active: boolean;
}

export interface PlansResponse {
  plans: Plan[];
}

export interface CreateSubscriptionRequest {
  plan_id: number;
  tenant_id?: number;
  provider?: 'paypal' | 'cashfree' | 'razorpay';
  customer_email?: string;
  customer_phone?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: any;
  order_id?: string;
  approval_url?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  payment_required?: boolean;
  will_be_upcoming?: boolean;
  razorpay_key?: string;
}

export interface CapturePaymentRequest {
  order_id: string;
  plan_id: number;
  tenant_id?: number;
  provider?: 'paypal' | 'cashfree' | 'razorpay';
  razorpay_payment_id?: string;
}

export interface CapturePaymentResponse {
  success: boolean;
  message: string;
  subscription: any;
  payment_status: string;
}

export const subscriptionService = {
  getSubscriptionByOrgId: async (orgId: number): Promise<ApiResponse<SubscriptionResponse>> => {
    try {
      const response = await api.get<ApiResponse<SubscriptionResponse>>(`/subscriptions/org/${orgId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch subscription',
      };
    }
  },

  getAllPlans: async (params?: {
    is_active?: boolean;
    plan_type?: string;
    billing_cycle?: string;
  }): Promise<ApiResponse<PlansResponse>> => {
    try {
      const response = await api.get<ApiResponse<PlansResponse>>('/plans', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch plans',
      };
    }
  },

  createSubscription: async (data: CreateSubscriptionRequest): Promise<ApiResponse<CreateSubscriptionResponse>> => {
    try {
      const response = await api.post<ApiResponse<CreateSubscriptionResponse>>('/subscriptions/create-subscription', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create subscription',
      };
    }
  },

  capturePayment: async (data: CapturePaymentRequest): Promise<ApiResponse<CapturePaymentResponse>> => {
    try {
      const response = await api.post<ApiResponse<CapturePaymentResponse>>('/subscriptions/capture-payment', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to capture payment',
      };
    }
  },
};
