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
export interface ExpenseCategory {
    id: number;
    name: string;
    icon: string;
    color: string;
    userId: number;
    createdAt: string;
}
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
export interface CreateExpenseRequest {
    amount: number;
    description: string;
    categoryId: number;
    date: string;
}
export interface UpdateExpenseRequest {
    amount?: number;
    description?: string;
    categoryId?: number;
    date?: string;
}
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
export interface StatisticsQuery {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginationParams {
    page: number;
    limit: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface ExpenseFilters {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    minAmount?: number;
    maxAmount?: number;
    description?: string;
}
//# sourceMappingURL=types.d.ts.map