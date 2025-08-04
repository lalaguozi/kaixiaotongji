// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 开销类别
export interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  userId: number;
  createdAt: string;
}

// 开销记录
export interface ExpenseRecord {
  id: number;
  amount: number;
  description: string;
  categoryId: number;
  userId: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory;
}

// 创建开销记录请求
export interface CreateExpenseRequest {
  amount: number;
  description: string;
  categoryId: number;
  date: string;
}

// 更新开销记录请求
export interface UpdateExpenseRequest {
  amount?: number;
  description?: string;
  categoryId?: number;
  date?: string;
}

// 统计数据
export interface ExpenseStatistics {
  totalAmount: number;
  recordCount: number;
  categoryBreakdown: {
    categoryId: number;
    categoryName: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  dailyData: {
    date: string;
    amount: number;
  }[];
  weeklyData: {
    week: string;
    amount: number;
  }[];
  monthlyData: {
    month: string;
    amount: number;
  }[];
  yearlyData: {
    year: string;
    amount: number;
  }[];
}

// 统计查询参数
export interface StatisticsQuery {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 筛选参数
export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
}