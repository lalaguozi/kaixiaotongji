import React, { useState } from 'react';
import useAsync from '@/hooks/useAsync';
import { statisticsService } from '@/services/statistics';
import { categoriesService } from '@/services/categories';
import { StatisticsQuery } from '@shared/types';
import { formatCurrency, formatDate, getDateRange } from '@/utils';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const Statistics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState(() => {
    const range = getDateRange('month');
    return {
      startDate: formatDate(range.start, 'yyyy-MM-dd'),
      endDate: formatDate(range.end, 'yyyy-MM-dd')
    };
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  const { data: categories } = useAsync(
    () => categoriesService.getCategories(),
    []
  );

  const { data: statistics, loading: statsLoading, execute: refetchStats } = useAsync(
    () => {
      const query: StatisticsQuery = {
        period: selectedPeriod,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedCategoryId && { categoryId: selectedCategoryId })
      };
      return statisticsService.getStatistics(query);
    },
    [selectedPeriod, dateRange, selectedCategoryId]
  );

  const { data: todayStats } = useAsync(
    () => statisticsService.getTodayStatistics(),
    []
  );

  const periodOptions = [
    { value: 'daily', label: '按日', icon: Calendar },
    { value: 'weekly', label: '按周', icon: BarChart3 },
    { value: 'monthly', label: '按月', icon: TrendingUp },
    { value: 'yearly', label: '按年', icon: TrendingDown }
  ];

  const quickDateRanges = [
    {
      label: '今天',
      getValue: () => {
        const range = getDateRange('today');
        return {
          startDate: formatDate(range.start, 'yyyy-MM-dd'),
          endDate: formatDate(range.end, 'yyyy-MM-dd')
        };
      }
    },
    {
      label: '本周',
      getValue: () => {
        const range = getDateRange('week');
        return {
          startDate: formatDate(range.start, 'yyyy-MM-dd'),
          endDate: formatDate(range.end, 'yyyy-MM-dd')
        };
      }
    },
    {
      label: '本月',
      getValue: () => {
        const range = getDateRange('month');
        return {
          startDate: formatDate(range.start, 'yyyy-MM-dd'),
          endDate: formatDate(range.end, 'yyyy-MM-dd')
        };
      }
    },
    {
      label: '今年',
      getValue: () => {
        const range = getDateRange('year');
        return {
          startDate: formatDate(range.start, 'yyyy-MM-dd'),
          endDate: formatDate(range.end, 'yyyy-MM-dd')
        };
      }
    }
  ];

  const getTimeSeriesData = () => {
    if (!statistics) return [];

    switch (selectedPeriod) {
      case 'daily':
        return statistics.dailyData.map(item => ({
          period: formatDate(item.date, 'MM-dd'),
          amount: item.amount,
          fullDate: item.date
        }));
      case 'weekly':
        return statistics.weeklyData.map(item => ({
          period: item.week,
          amount: item.amount
        }));
      case 'monthly':
        return statistics.monthlyData.map(item => ({
          period: item.month,
          amount: item.amount
        }));
      case 'yearly':
        return statistics.yearlyData.map(item => ({
          period: item.year,
          amount: item.amount
        }));
      default:
        return [];
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-primary-600">
            {`开销: ${formatCurrency(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  if (statsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
            <p className="mt-1 text-sm text-gray-600">
              查看您的开销统计和趋势分析
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={refetchStats}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              刷新
            </Button>
            <Button
              variant="outline"
              icon={<Download className="w-4 h-4" />}
            >
              导出
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今日开销</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todayStats?.today.amount || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {todayStats?.today.count || 0} 笔记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">本月开销</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todayStats?.thisMonth.amount || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {todayStats?.thisMonth.count || 0} 笔记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今年开销</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todayStats?.thisYear.amount || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {todayStats?.thisYear.count || 0} 笔记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">当前查询</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(statistics?.totalAmount || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {statistics?.recordCount || 0} 笔记录
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>筛选条件</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="开始日期"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                fullWidth
              />
              
              <Input
                label="结束日期"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                fullWidth
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">类别</label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
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
            </div>

            {/* Quick Date Range */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 mr-2">快速选择：</span>
              {quickDateRanges.map(range => (
                <button
                  key={range.label}
                  onClick={() => setDateRange(range.getValue())}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Period Selection */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 mr-2">统计周期：</span>
              {periodOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedPeriod(option.value as any)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                      selectedPeriod === option.value
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>开销趋势</CardTitle>
              <CardDescription>
                {selectedPeriod === 'daily' && '每日开销变化'}
                {selectedPeriod === 'weekly' && '每周开销变化'}
                {selectedPeriod === 'monthly' && '每月开销变化'}
                {selectedPeriod === 'yearly' && '每年开销变化'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `¥${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>类别分布</CardTitle>
              <CardDescription>各类别开销占比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics?.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ categoryName, percentage }) => 
                        `${categoryName} ${percentage.toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {statistics?.categoryBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '金额']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <Card>
          <CardHeader>
            <CardTitle>类别详情</CardTitle>
            <CardDescription>各类别的详细开销统计</CardDescription>
          </CardHeader>
          <CardContent>
            {statistics?.categoryBreakdown.length ? (
              <div className="space-y-4">
                {statistics.categoryBreakdown.map((category) => (
                  <div key={category.categoryId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="font-medium text-gray-900">{category.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(category.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Statistics;