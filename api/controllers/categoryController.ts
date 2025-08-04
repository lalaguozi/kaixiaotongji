import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbGet, dbAll, dbRun } from '../database';
import { ExpenseCategory } from '../../shared/types';

// 获取用户的所有类别
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const categories = await dbAll(
      'SELECT id, name, icon, color, user_id, created_at FROM expense_categories WHERE user_id = ? ORDER BY name',
      [userId]
    );

    const formattedCategories: ExpenseCategory[] = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      userId: cat.user_id,
      createdAt: cat.created_at
    }));

    res.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('获取类别失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建新类别
export const createCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    const { name, icon = '💰', color = '#3B82F6' } = req.body;

    // 检查类别名称是否已存在
    const existingCategory = await dbGet(
      'SELECT id FROM expense_categories WHERE name = ? AND user_id = ?',
      [name, userId]
    );

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: '类别名称已存在'
      });
    }

    // 创建类别
    const result = await dbRun(
      'INSERT INTO expense_categories (name, icon, color, user_id) VALUES (?, ?, ?, ?)',
      [name, icon, color, userId]
    );

    const categoryId = result.lastID;

    // 获取创建的类别
    const category = await dbGet(
      'SELECT id, name, icon, color, user_id, created_at FROM expense_categories WHERE id = ?',
      [categoryId]
    );

    const formattedCategory: ExpenseCategory = {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      userId: category.user_id,
      createdAt: category.created_at
    };

    res.status(201).json({
      success: true,
      data: formattedCategory,
      message: '类别创建成功'
    });
  } catch (error) {
    console.error('创建类别失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更新类别
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    const categoryId = parseInt(req.params.id);
    const { name, icon, color } = req.body;

    // 检查类别是否存在且属于当前用户
    const existingCategory = await dbGet(
      'SELECT id FROM expense_categories WHERE id = ? AND user_id = ?',
      [categoryId, userId]
    );

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: '类别不存在'
      });
    }

    // 如果更新名称，检查新名称是否已存在
    if (name) {
      const duplicateCategory = await dbGet(
        'SELECT id FROM expense_categories WHERE name = ? AND user_id = ? AND id != ?',
        [name, userId, categoryId]
      );

      if (duplicateCategory) {
        return res.status(409).json({
          success: false,
          message: '类别名称已存在'
        });
      }
    }

    // 构建更新语句
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
    }
    if (color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(color);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }

    updateValues.push(categoryId, userId);

    await dbRun(
      `UPDATE expense_categories SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    // 获取更新后的类别
    const updatedCategory = await dbGet(
      'SELECT id, name, icon, color, user_id, created_at FROM expense_categories WHERE id = ?',
      [categoryId]
    );

    const formattedCategory: ExpenseCategory = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      icon: updatedCategory.icon,
      color: updatedCategory.color,
      userId: updatedCategory.user_id,
      createdAt: updatedCategory.created_at
    };

    res.json({
      success: true,
      data: formattedCategory,
      message: '类别更新成功'
    });
  } catch (error) {
    console.error('更新类别失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 删除类别
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const categoryId = parseInt(req.params.id);

    // 检查类别是否存在且属于当前用户
    const existingCategory = await dbGet(
      'SELECT id FROM expense_categories WHERE id = ? AND user_id = ?',
      [categoryId, userId]
    );

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: '类别不存在'
      });
    }

    // 检查是否有关联的开销记录
    const relatedExpenses = await dbGet(
      'SELECT COUNT(*) as count FROM expense_records WHERE category_id = ?',
      [categoryId]
    );

    if (relatedExpenses.count > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除有关联开销记录的类别'
      });
    }

    // 删除类别
    await dbRun(
      'DELETE FROM expense_categories WHERE id = ? AND user_id = ?',
      [categoryId, userId]
    );

    res.json({
      success: true,
      message: '类别删除成功'
    });
  } catch (error) {
    console.error('删除类别失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};