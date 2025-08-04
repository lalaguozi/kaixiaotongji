import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAsync from '@/hooks/useAsync';
import { expensesService } from '@/services/expenses';
import { categoriesService } from '@/services/categories';
import { UpdateExpenseRequest } from '@shared/types';
import { formatDate } from '@/utils';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EditExpense: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const expenseId = parseInt(id || '0');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: expense, loading: expenseLoading } = useAsync(
    () => expensesService.getExpenseById(expenseId),
    [expenseId]
  );

  const { data: categories, loading: categoriesLoading } = useAsync(
    () => categoriesService.getCategories(),
    []
  );

  const [formData, setFormData] = useState<UpdateExpenseRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when expense is loaded
  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount,
        description: expense.description,
        categoryId: expense.categoryId,
        date: expense.date
      });
    }
  }, [expense]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.amount !== undefined && formData.amount <= 0) {
      newErrors.amount = '请输入有效的金额';
    }

    if (formData.description !== undefined && !formData.description.trim()) {
      newErrors.description = '请输入开销描述';
    }

    if (formData.categoryId && !categories?.find(c => c.id === formData.categoryId)) {
      newErrors.categoryId = '请选择有效的类别';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UpdateExpenseRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await expensesService.updateExpense(expenseId, formData);
      toast.success('开销记录更新成功');
      navigate('/expenses');
    } catch (error) {
      console.error('更新开销记录失败:', error);
      toast.error('更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条开销记录吗？此操作无法撤销。')) {
      return;
    }

    setIsDeleting(true);
    try {
      await expensesService.deleteExpense(expenseId);
      toast.success('开销记录删除成功');
      navigate('/expenses');
    } catch (error) {
      console.error('删除开销记录失败:', error);
      toast.error('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    handleInputChange('amount', amount);
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const getSelectedCategory = () => {
    return categories?.find(c => c.id === formData.categoryId);
  };

  if (expenseLoading || categoriesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!expense) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">记录不存在</h1>
            <p className="text-gray-600 mb-4">要编辑的开销记录不存在或已被删除</p>
            <Button onClick={() => navigate('/expenses')}>
              返回列表
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/expenses')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">编辑开销记录</h1>
              <p className="mt-1 text-sm text-gray-600">
                修改开销记录信息
              </p>
            </div>
          </div>
          
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            icon={<Trash2 className="w-4 h-4" />}
          >
            删除记录
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>开销信息</CardTitle>
            <CardDescription>修改开销的详细信息</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div className="space-y-3">
                <Input
                  label="金额 (¥)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  error={errors.amount}
                  placeholder="0.00"
                  fullWidth
                />
                
                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 mr-2">快速选择：</span>
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickAmount(amount)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      ¥{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">类别</label>
                  {categories && categories.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleInputChange('categoryId', category.id)}
                          className={`p-3 border rounded-lg text-left transition-all ${
                            formData.categoryId === category.id
                              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-white text-sm"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {category.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-gray-500">暂无类别</div>
                    </div>
                  )}
                  {errors.categoryId && (
                    <p className="text-sm text-red-600">{errors.categoryId}</p>
                  )}
                </div>

                {/* Selected Category Preview */}
                {getSelectedCategory() && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: getSelectedCategory()!.color }}
                      >
                        {getSelectedCategory()!.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          已选择: {getSelectedCategory()!.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="详细描述这笔开销..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Date */}
              <Input
                label="日期"
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                error={errors.date}
                fullWidth
              />

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/expenses')}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={<Save className="w-4 h-4" />}
                >
                  保存更改
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Original Info */}
        <Card>
          <CardHeader>
            <CardTitle>原始信息</CardTitle>
            <CardDescription>记录的原始信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">创建时间:</span>
              <span className="text-sm text-gray-900">{formatDate(expense.createdAt, 'yyyy-MM-dd HH:mm')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">最后更新:</span>
              <span className="text-sm text-gray-900">{formatDate(expense.updatedAt, 'yyyy-MM-dd HH:mm')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditExpense;