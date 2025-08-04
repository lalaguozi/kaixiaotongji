import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { ApiResponse } from '@shared/types';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token管理
const TOKEN_KEY = 'kaixiaotongji_token';

export const tokenManager = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
  
  exists: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token过期或无效
          tokenManager.remove();
          window.location.href = '/login';
          toast.error('登录已过期，请重新登录');
          break;
        case 403:
          toast.error('没有权限访问该资源');
          break;
        case 404:
          toast.error('请求的资源不存在');
          break;
        case 429:
          toast.error('请求过于频繁，请稍后重试');
          break;
        case 500:
          toast.error('服务器内部错误');
          break;
        default:
          if (data?.message) {
            toast.error(data.message);
          } else {
            toast.error('网络请求失败');
          }
      }
    } else if (error.request) {
      toast.error('网络连接失败，请检查网络');
    } else {
      toast.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

// API请求封装
export const apiRequest = {
  get: async <T = any>(url: string, config?: any): Promise<ApiResponse<T>> => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  delete: async <T = any>(url: string, config?: any): Promise<ApiResponse<T>> => {
    const response = await api.delete(url, config);
    return response.data;
  },

  patch: async <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    const response = await api.patch(url, data, config);
    return response.data;
  },
};

export default api;