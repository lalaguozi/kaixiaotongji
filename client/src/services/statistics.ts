import { apiRequest } from './api';
import { ExpenseStatistics, StatisticsQuery } from '@shared/types';

export interface TodayStatistics {
  today: {
    amount: number;
    count: number;
  };
  thisMonth: {
    amount: number;
    count: number;
  };
  thisYear: {
    amount: number;
    count: number;
  };
}

export interface MonthlyComparisonData {
  month: string;
  amount: number;
  count: number;
}

export interface CategoryTrendData {
  period: string;
  amount: number;
  count: number;
  categoryName: string;
  categoryColor: string;
}

export const statisticsService = {
  // 获取统计数据
  getStatistics: async (query?: Partial<StatisticsQuery>): Promise<ExpenseStatistics> => {
    const searchParams = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await apiRequest.get<ExpenseStatistics>(
      `/statistics?${searchParams.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取统计数据失败');
  },

  // 获取今日统计
  getTodayStatistics: async (): Promise<TodayStatistics> => {
    const response = await apiRequest.get<TodayStatistics>('/statistics/today');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取今日统计失败');
  },

  // 获取月度对比数据
  getMonthlyComparison: async (months: number = 6): Promise<MonthlyComparisonData[]> => {
    const response = await apiRequest.get<MonthlyComparisonData[]>(
      `/statistics/monthly-comparison?months=${months}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取月度对比数据失败');
  },

  // 获取类别趋势数据
  getCategoryTrends: async (
    categoryId: number, 
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    limit: number = 12
  ): Promise<CategoryTrendData[]> => {
    const response = await apiRequest.get<CategoryTrendData[]>(
      `/statistics/category-trends/${categoryId}?period=${period}&limit=${limit}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || '获取类别趋势数据失败');
  },

  // 导出统计数据
  exportStatistics: async (query?: Partial<StatisticsQuery>): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    searchParams.append('format', 'csv');

    // 注意：这里返回CSV格式的Blob，实际实现可能需要在后端添加导出接口
    const response = await fetch(`/api/statistics/export?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('kaixiaotongji_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('导出数据失败');
    }

    return response.blob();
  }
};