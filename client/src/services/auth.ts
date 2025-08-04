import { apiRequest, tokenManager } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '@shared/types';

export const authService = {
  // 用户登录
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      tokenManager.set(response.data.token);
      return response.data;
    }
    
    throw new Error(response.message || '登录失败');
  },

  // 用户注册
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiRequest.post<AuthResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      tokenManager.set(response.data.token);
      return response.data;
    }
    
    throw new Error(response.message || '注册失败');
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<User> => {
    const response = await apiRequest.get<User>('/auth/me');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取用户信息失败');
  },

  // 用户登出
  logout: (): void => {
    tokenManager.remove();
    window.location.href = '/login';
  },

  // 检查是否已登录
  isAuthenticated: (): boolean => {
    return tokenManager.exists();
  },

  // 检查token有效性
  checkTokenValidity: async (): Promise<boolean> => {
    try {
      if (!tokenManager.exists()) {
        return false;
      }
      
      await authService.getCurrentUser();
      return true;
    } catch (error) {
      tokenManager.remove();
      return false;
    }
  }
};