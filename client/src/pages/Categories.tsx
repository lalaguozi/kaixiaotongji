import React, { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext'; // 暂时不需要
import useAsync from '@/hooks/useAsync';
import { categoriesService, CreateCategoryRequest, UpdateCategoryRequest } from '@/services/categories';
import { ExpenseCategory } from '@shared/types';
import { formatDate, generateRandomColor } from '@/utils';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Categories: React.FC = () => {
  // const { logout } = useAuth(); // 暂时不需要logout功能
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, loading, execute: refetchCategories } = useAsync(
    () => categoriesService.getCategories(),
    []
  );

  const [newCategory, setNewCategory] = useState<CreateCategoryRequest>({
    name: '',
    icon: '💰',
    color: generateRandomColor()
  });

  const [editCategory, setEditCategory] = useState<UpdateCategoryRequest>({});

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('请输入类别名称');
      return;
    }

    setIsSubmitting(true);
    try {
      await categoriesService.createCategory(newCategory);
      toast.success('类别创建成功');
      setNewCategory({ name: '', icon: '💰', color: generateRandomColor() });
      setIsCreating(false);
      await refetchCategories();
    } catch (error) {
      console.error('创建类别失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (id: number) => {
    if (!editCategory.name?.trim()) {
      toast.error('请输入类别名称');
      return;
    }

    setIsSubmitting(true);
    try {
      await categoriesService.updateCategory(id, editCategory);
      toast.success('类别更新成功');
      setEditingId(null);
      setEditCategory({});
      await refetchCategories();
    } catch (error) {
      console.error('更新类别失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定要删除这个类别吗？删除后相关的开销记录将无法找到对应类别。')) {
      return;
    }

    try {
      await categoriesService.deleteCategory(id);
      toast.success('类别删除成功');
      await refetchCategories();
    } catch (error) {
      console.error('删除类别失败:', error);
    }
  };

  const startEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setEditCategory({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory({});
  };

  const commonIcons = ['💰', '🍽️', '🚗', '🛒', '🎮', '🏥', '📚', '🏠', '💼', '🎬', '👕', '⛽', '📱', '🎯'];

  if (loading) {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">类别管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              管理您的开销分类，让记录更加有序
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            添加类别
          </Button>
        </div>

        {/* Create Category Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>创建新类别</CardTitle>
              <CardDescription>为您的开销添加一个新的分类</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="类别名称"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：餐饮、交通、购物..."
                  fullWidth
                />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">图标</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="选择图标"
                      className="w-20"
                    />
                    <div className="flex flex-wrap gap-1">
                      {commonIcons.slice(0, 6).map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">颜色</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewCategory(prev => ({ ...prev, color: generateRandomColor() }))}
                    >
                      随机
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCategory({ name: '', icon: '💰', color: generateRandomColor() });
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  loading={isSubmitting}
                  icon={<Save className="w-4 h-4" />}
                >
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {editingId === category.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <Input
                      value={editCategory.name || ''}
                      onChange={(e) => setEditCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="类别名称"
                      fullWidth
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editCategory.icon || category.icon}
                        onChange={(e) => setEditCategory(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="图标"
                        className="w-16"
                      />
                      <input
                        type="color"
                        value={editCategory.color || category.color}
                        onChange={(e) => setEditCategory(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={cancelEdit}
                        icon={<X className="w-4 h-4" />}
                      >
                        取消
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateCategory(category.id)}
                        loading={isSubmitting}
                        icon={<Save className="w-4 h-4" />}
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          创建于 {formatDate(category.createdAt, 'MM月dd日')}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(category)}
                        icon={<Edit2 className="w-4 h-4" />}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {categories?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无类别</h3>
              <p className="text-gray-500 mb-4">创建您的第一个开销类别来开始记录</p>
              <Button
                onClick={() => setIsCreating(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                添加类别
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Categories;