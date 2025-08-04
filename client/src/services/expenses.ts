import { apiRequest } from './api';
import { 
  ExpenseRecord, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  PaginatedResponse, 
  ExpenseFilters,
  PaginationParams
} from '@shared/types';

export interface GetExpensesParams extends PaginationParams, ExpenseFilters {}

export const expensesService = {
  // 获取开销记录列表
  getExpenses: async (params?: Partial<GetExpensesParams>): Promise<PaginatedResponse<ExpenseRecord>> => {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await apiRequest.get<PaginatedResponse<ExpenseRecord>>(
      `/expenses?${searchParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取开销记录失败');
  },

  // 获取单个开销记录详情
  getExpenseById: async (id: number): Promise<ExpenseRecord> => {
    const response = await apiRequest.get<ExpenseRecord>(`/expenses/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取开销记录详情失败');
  },

  // 创建开销记录
  createExpense: async (expenseData: CreateExpenseRequest): Promise<ExpenseRecord> => {
    const response = await apiRequest.post<ExpenseRecord>('/expenses', expenseData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '创建开销记录失败');
  },

  // 更新开销记录
  updateExpense: async (id: number, expenseData: UpdateExpenseRequest): Promise<ExpenseRecord> => {
    const response = await apiRequest.put<ExpenseRecord>(`/expenses/${id}`, expenseData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '更新开销记录失败');
  },

  // 删除开销记录
  deleteExpense: async (id: number): Promise<void> => {
    const response = await apiRequest.delete(`/expenses/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || '删除开销记录失败');
    }
  },

  // 批量删除开销记录
  batchDeleteExpenses: async (ids: number[]): Promise<void> => {
    const promises = ids.map(id => expensesService.deleteExpense(id));
    await Promise.all(promises);
  }
};