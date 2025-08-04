import { apiRequest } from './api';
import { ExpenseCategory } from '@shared/types';

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
}

export const categoriesService = {
  // 获取所有类别
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await apiRequest.get<ExpenseCategory[]>('/categories');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取类别失败');
  },

  // 创建新类别
  createCategory: async (categoryData: CreateCategoryRequest): Promise<ExpenseCategory> => {
    const response = await apiRequest.post<ExpenseCategory>('/categories', categoryData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '创建类别失败');
  },

  // 更新类别
  updateCategory: async (id: number, categoryData: UpdateCategoryRequest): Promise<ExpenseCategory> => {
    const response = await apiRequest.put<ExpenseCategory>(`/categories/${id}`, categoryData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '更新类别失败');
  },

  // 删除类别
  deleteCategory: async (id: number): Promise<void> => {
    const response = await apiRequest.delete(`/categories/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || '删除类别失败');
    }
  }
};