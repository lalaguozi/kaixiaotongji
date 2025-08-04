import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '@/hooks/useAsync';
import usePagination from '@/hooks/usePagination';
import { expensesService, GetExpensesParams } from '@/services/expenses';
import { categoriesService } from '@/services/categories';
import { ExpenseFilters } from '@shared/types';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses: React.FC = () => {
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: categories } = useAsync(
    () => categoriesService.getCategories(),
    []
  );

  const { data: expensesData, loading, execute: refetchExpenses } = useAsync(
    () => {
      const params: GetExpensesParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
        ...(searchTerm && { description: searchTerm })
      };
      return expensesService.getExpenses(params);
    },
    [currentPage, filters, searchTerm]
  );

  const expenses = expensesData?.data || [];
  const total = expensesData?.total || 0;

  const pagination = usePagination({
    totalItems: total,
    itemsPerPage,
    initialPage: currentPage
  });

  React.useEffect(() => {
    setCurrentPage(pagination.currentPage);
  }, [pagination.currentPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: ExpenseFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('确定要删除这条开销记录吗？')) {
      return;
    }

    try {
      await expensesService.deleteExpense(id);
      toast.success('开销记录删除成功');
      await refetchExpenses();
    } catch (error) {
      console.error('删除开销记录失败:', error);
    }
  };

  const getTotalAmount = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">开销记录</h1>
            <p className="mt-1 text-sm text-gray-600">
              管理您的所有开销记录
            </p>
          </div>
          <Link to="/expenses/new">
            <Button icon={<Plus className="w-4 h-4" />}>
              添加记录
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索开销描述..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  fullWidth
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={<Filter className="w-4 h-4" />}
                >
                  筛选
                </Button>
                
                {(Object.keys(filters).length > 0 || searchTerm) && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    icon={<X className="w-4 h-4" />}
                  >
                    清除
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="开始日期"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
                    fullWidth
                  />
                  
                  <Input
                    label="结束日期"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
                    fullWidth
                  />
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">类别</label>
                    <select
                      value={filters.categoryId || ''}
                      onChange={(e) => handleFilterChange({ 
                        ...filters, 
                        categoryId: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">所有类别</option>
                      {categories?.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      label="最小金额"
                      type="number"
                      placeholder="0"
                      value={filters.minAmount || ''}
                      onChange={(e) => handleFilterChange({ 
                        ...filters, 
                        minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      fullWidth
                    />
                    <Input
                      label="最大金额"
                      type="number"
                      placeholder="999999"
                      value={filters.maxAmount || ''}
                      onChange={(e) => handleFilterChange({ 
                        ...filters, 
                        maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalAmount())}
                </div>
                <p className="text-sm text-gray-600">当前页面总计</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {expenses.length}
                </div>
                <p className="text-sm text-gray-600">当前页面记录数</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {total}
                </div>
                <p className="text-sm text-gray-600">总记录数</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expenses List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : expenses.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            日期
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            类别
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            描述
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            金额
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{formatDate(expense.date)}</div>
                                <div className="text-gray-500">{formatRelativeTime(expense.createdAt)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {expense.category && (
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                                    style={{ backgroundColor: expense.category.color }}
                                  >
                                    {expense.category.icon}
                                  </div>
                                  <span>{expense.category.name}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="max-w-xs truncate" title={expense.description}>
                                {expense.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <Link to={`/expenses/${expense.id}/edit`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Edit2 className="w-4 h-4" />}
                                  >
                                    编辑
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  icon={<Trash2 className="w-4 h-4" />}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  删除
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          {expense.category && (
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: expense.category.color }}
                            >
                              {expense.category.icon}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {expense.category?.name || '未分类'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(expense.date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-gray-900">
                            {formatCurrency(expense.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatRelativeTime(expense.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-900">
                        {expense.description}
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Link to={`/expenses/${expense.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit2 className="w-4 h-4" />}
                          >
                            编辑
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          icon={<Trash2 className="w-4 h-4" />}
                          className="text-red-600 hover:text-red-700"
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      显示第 {pagination.startIndex + 1} - {Math.min(pagination.endIndex + 1, total)} 条，共 {total} 条记录
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pagination.previousPage}
                        disabled={!pagination.hasPreviousPage}
                        icon={<ChevronLeft className="w-4 h-4" />}
                      >
                        上一页
                      </Button>
                      
                      <div className="hidden sm:flex items-center space-x-1">
                        {pagination.getPageNumbers().map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.currentPage ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => pagination.goToPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        ))}
                      </div>
                      
                      <div className="sm:hidden text-sm text-gray-500">
                        {pagination.currentPage} / {pagination.totalPages}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pagination.nextPage}
                        disabled={!pagination.hasNextPage}
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无开销记录</h3>
              <p className="text-gray-500 mb-4">
                {Object.keys(filters).length > 0 || searchTerm 
                  ? '没有找到符合条件的记录，试试调整筛选条件'
                  : '开始记录您的第一笔开销'
                }
              </p>
              {Object.keys(filters).length > 0 || searchTerm ? (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  icon={<X className="w-4 h-4" />}
                >
                  清除筛选条件
                </Button>
              ) : (
                <Link to="/expenses/new">
                  <Button icon={<Plus className="w-4 h-4" />}>
                    添加记录
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Expenses;