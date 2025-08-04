import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useAsync from '@/hooks/useAsync';
import { statisticsService } from '@/services/statistics';
import { formatCurrency, formatDate } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
// Button组件在这里没有使用
import Layout from '@/components/layout/Layout';
import { 
  TrendingUp, 
  TrendingDown, 

  PieChart, 
  Calendar,
  Plus,
  BarChart3,
  ArrowRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: todayStats, loading: todayLoading } = useAsync(
    () => statisticsService.getTodayStatistics(),
    []
  );

  const { data: monthlyStats, loading: monthlyLoading } = useAsync(
    () => statisticsService.getStatistics({ period: 'monthly' }),
    []
  );

  const quickActions = [
    {
      name: '记录开销',
      description: '快速添加新的开销记录',
      href: '/expenses/new',
      icon: Plus,
      color: 'bg-blue-500'
    },
    {
      name: '查看统计',
      description: '查看详细的统计报表',
      href: '/statistics',
      icon: BarChart3,
      color: 'bg-green-500'
    },
    {
      name: '管理类别',
      description: '管理开销分类',
      href: '/categories',
      icon: PieChart,
      color: 'bg-purple-500'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '深夜好';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            {getGreeting()}，{user?.username}！
          </h1>
          <p className="text-primary-100">
            今天是 {formatDate(new Date(), 'yyyy年MM月dd日')}，让我们来看看您的开销情况
          </p>
        </div>

        {/* Today's Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日开销</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayLoading ? '...' : formatCurrency(todayStats?.today.amount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                共 {todayStats?.today.count || 0} 笔记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月开销</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayLoading ? '...' : formatCurrency(todayStats?.thisMonth.amount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                共 {todayStats?.thisMonth.count || 0} 笔记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今年开销</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayLoading ? '...' : formatCurrency(todayStats?.thisYear.amount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                共 {todayStats?.thisYear.count || 0} 笔记录
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${action.color}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-primary-600">
                            {action.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>本月类别分布</CardTitle>
              <CardDescription>查看各类别的开销占比</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : monthlyStats?.categoryBreakdown.length ? (
                <div className="space-y-3">
                  {monthlyStats.categoryBreakdown.slice(0, 5).map((category) => (
                    <div key={category.categoryId} className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {category.categoryName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/statistics"
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mt-4"
                  >
                    查看详细统计
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>开始使用</CardTitle>
              <CardDescription>完善您的账户设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                  <span className="text-sm text-gray-900">账户已创建</span>
                </div>
                
                <Link to="/expenses/new" className="flex items-center space-x-3 group">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-900 group-hover:text-primary-600">
                    添加第一笔开销记录
                  </span>
                </Link>
                
                <Link to="/categories" className="flex items-center space-x-3 group">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <PieChart className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-900 group-hover:text-primary-600">
                    自定义开销类别
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;