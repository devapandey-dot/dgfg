export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  tenant_id: number;
  role: string;
  twofa_enabled?: boolean;
  phone_number?: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  requires_2fa?: boolean;
}

export interface SignupResponse {
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface TenantItem {
  id: number;
  name: string;
  domain?: string | null;
  plan?: string;
  status?: string;
  logo?: string | null;
  timezone?: string;
  country?: string | null;
}

export interface TenantResponse {
  tenant: TenantItem;
  message?: string;
}
