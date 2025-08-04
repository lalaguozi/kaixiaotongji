import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAsync from '@/hooks/useAsync';
import { expensesService } from '@/services/expenses';
import { categoriesService } from '@/services/categories';
import { CreateExpenseRequest } from '@shared/types';
import { formatDate } from '@/utils';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const AddExpense: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, loading: categoriesLoading } = useAsync(
    () => categoriesService.getCategories(),
    []
  );

  const [formData, setFormData] = useState<CreateExpenseRequest>({
    amount: 0,
    description: '',
    categoryId: 0,
    date: formatDate(new Date(), 'yyyy-MM-dd')
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = '请输入有效的金额';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入开销描述';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '请选择类别';
    }

    if (!formData.date) {
      newErrors.date = '请选择日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateExpenseRequest, value: any) => {
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
      await expensesService.createExpense(formData);
      toast.success('开销记录添加成功');
      navigate('/expenses');
    } catch (error) {
      console.error('添加开销记录失败:', error);
      toast.error('添加失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    handleInputChange('amount', amount);
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const getSelectedCategory = () => {
    return categories?.find(c => c.id === formData.categoryId);
  };

  if (categoriesLoading) {
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/expenses')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">添加开销记录</h1>
            <p className="mt-1 text-sm text-gray-600">
              记录您的新开销
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>开销信息</CardTitle>
            <CardDescription>请填写开销的详细信息</CardDescription>
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
                      <div className="text-gray-500 mb-2">暂无类别</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/categories')}
                        icon={<Plus className="w-4 h-4" />}
                      >
                        先去创建类别
                      </Button>
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
                  value={formData.description}
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
                value={formData.date}
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
                  保存记录
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">💡 小贴士</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 及时记录开销可以帮助您更好地管理财务</li>
              <li>• 详细的描述有助于后续查看和分析</li>
              <li>• 可以先创建常用的类别，方便快速选择</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddExpense;