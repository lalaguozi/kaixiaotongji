import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbGet, dbAll, dbRun } from '../database';
import { ExpenseRecord, CreateExpenseRequest, UpdateExpenseRequest, PaginatedResponse, ExpenseFilters } from '../types';
import config from '../config';

// 获取开销记录列表
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || config.defaultPageSize, config.maxPageSize);
    
    // 筛选参数
    const filters: ExpenseFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
      description: req.query.description as string
    };

    // 构建WHERE条件
    const conditions = ['er.user_id = ?'];
    const params = [userId];

    if (filters.startDate) {
      conditions.push('er.expense_date >= ?');
      params.push(filters.startDate as any);
    }

    if (filters.endDate) {
      conditions.push('er.expense_date <= ?');
      params.push(filters.endDate as any);
    }

    if (filters.categoryId) {
      conditions.push('er.category_id = ?');
      params.push(filters.categoryId);
    }

    if (filters.minAmount !== undefined) {
      conditions.push('er.amount >= ?');
      params.push(filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      conditions.push('er.amount <= ?');
      params.push(filters.maxAmount);
    }

    if (filters.description) {
      conditions.push('er.description LIKE ?');
      params.push(`%${filters.description}%` as any);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM expense_records er
      ${whereClause}
    `;
    const countResult = await dbGet(countQuery, params);
    const total = countResult.total;

    // 获取分页数据
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        er.id,
        er.amount,
        er.description,
        er.category_id,
        er.user_id,
        er.expense_date,
        er.created_at,
        er.updated_at,
        ec.name as category_name,
        ec.icon as category_icon,
        ec.color as category_color
      FROM expense_records er
      LEFT JOIN expense_categories ec ON er.category_id = ec.id
      ${whereClause}
      ORDER BY er.expense_date DESC, er.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const expenses = await dbAll(dataQuery, [...params, limit, offset]);

    // 格式化数据
    const formattedExpenses: ExpenseRecord[] = expenses.map(expense => ({
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      categoryId: expense.category_id,
      userId: expense.user_id,
      date: expense.expense_date,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at,
      category: expense.category_name ? {
        id: expense.category_id,
        name: expense.category_name,
        icon: expense.category_icon,
        color: expense.category_color,
        userId: expense.user_id,
        createdAt: expense.created_at
      } : undefined
    }));

    const response: PaginatedResponse<ExpenseRecord> = {
      data: formattedExpenses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('获取开销记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建开销记录
export const createExpense = async (req: Request, res: Response) => {
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
    const { amount, description, categoryId, date }: CreateExpenseRequest = req.body;

    // 验证类别是否存在且属于当前用户
    const category = await dbGet(
      'SELECT id, name, icon, color FROM expense_categories WHERE id = ? AND user_id = ?',
      [categoryId, userId]
    );

    if (!category) {
      return res.status(400).json({
        success: false,
        message: '无效的类别ID'
      });
    }

    // 创建开销记录
    const result = await dbRun(
      'INSERT INTO expense_records (amount, description, category_id, user_id, expense_date) VALUES (?, ?, ?, ?, ?)',
      [amount, description, categoryId, userId, date]
    );

    const expenseId = result.lastID;

    // 获取创建的记录
    const expense = await dbGet(`
      SELECT 
        er.id,
        er.amount,
        er.description,
        er.category_id,
        er.user_id,
        er.expense_date,
        er.created_at,
        er.updated_at,
        ec.name as category_name,
        ec.icon as category_icon,
        ec.color as category_color
      FROM expense_records er
      LEFT JOIN expense_categories ec ON er.category_id = ec.id
      WHERE er.id = ?
    `, [expenseId]);

    const formattedExpense: ExpenseRecord = {
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      categoryId: expense.category_id,
      userId: expense.user_id,
      date: expense.expense_date,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at,
      category: {
        id: expense.category_id,
        name: expense.category_name,
        icon: expense.category_icon,
        color: expense.category_color,
        userId: expense.user_id,
        createdAt: expense.created_at
      }
    };

    res.status(201).json({
      success: true,
      data: formattedExpense,
      message: '开销记录创建成功'
    });
  } catch (error) {
    console.error('创建开销记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更新开销记录
export const updateExpense = async (req: Request, res: Response) => {
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
    const expenseId = parseInt(req.params.id);
    const { amount, description, categoryId, date }: UpdateExpenseRequest = req.body;

    // 检查记录是否存在且属于当前用户
    const existingExpense = await dbGet(
      'SELECT id FROM expense_records WHERE id = ? AND user_id = ?',
      [expenseId, userId]
    );

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: '开销记录不存在'
      });
    }

    // 如果更新类别，验证类别是否有效
    if (categoryId !== undefined) {
      const category = await dbGet(
        'SELECT id FROM expense_categories WHERE id = ? AND user_id = ?',
        [categoryId, userId]
      );

      if (!category) {
        return res.status(400).json({
          success: false,
          message: '无效的类别ID'
        });
      }
    }

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];

    if (amount !== undefined) {
      updateFields.push('amount = ?');
      updateValues.push(amount);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (categoryId !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(categoryId);
    }
    if (date !== undefined) {
      updateFields.push('expense_date = ?');
      updateValues.push(date);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(expenseId, userId);

    await dbRun(
      `UPDATE expense_records SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    // 获取更新后的记录
    const updatedExpense = await dbGet(`
      SELECT 
        er.id,
        er.amount,
        er.description,
        er.category_id,
        er.user_id,
        er.expense_date,
        er.created_at,
        er.updated_at,
        ec.name as category_name,
        ec.icon as category_icon,
        ec.color as category_color
      FROM expense_records er
      LEFT JOIN expense_categories ec ON er.category_id = ec.id
      WHERE er.id = ?
    `, [expenseId]);

    const formattedExpense: ExpenseRecord = {
      id: updatedExpense.id,
      amount: updatedExpense.amount,
      description: updatedExpense.description,
      categoryId: updatedExpense.category_id,
      userId: updatedExpense.user_id,
      date: updatedExpense.expense_date,
      createdAt: updatedExpense.created_at,
      updatedAt: updatedExpense.updated_at,
      category: {
        id: updatedExpense.category_id,
        name: updatedExpense.category_name,
        icon: updatedExpense.category_icon,
        color: updatedExpense.category_color,
        userId: updatedExpense.user_id,
        createdAt: updatedExpense.created_at
      }
    };

    res.json({
      success: true,
      data: formattedExpense,
      message: '开销记录更新成功'
    });
  } catch (error) {
    console.error('更新开销记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 删除开销记录
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const expenseId = parseInt(req.params.id);

    // 检查记录是否存在且属于当前用户
    const existingExpense = await dbGet(
      'SELECT id FROM expense_records WHERE id = ? AND user_id = ?',
      [expenseId, userId]
    );

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: '开销记录不存在'
      });
    }

    // 删除记录
    await dbRun(
      'DELETE FROM expense_records WHERE id = ? AND user_id = ?',
      [expenseId, userId]
    );

    res.json({
      success: true,
      message: '开销记录删除成功'
    });
  } catch (error) {
    console.error('删除开销记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取单个开销记录详情
export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const expenseId = parseInt(req.params.id);

    const expense = await dbGet(`
      SELECT 
        er.id,
        er.amount,
        er.description,
        er.category_id,
        er.user_id,
        er.expense_date,
        er.created_at,
        er.updated_at,
        ec.name as category_name,
        ec.icon as category_icon,
        ec.color as category_color
      FROM expense_records er
      LEFT JOIN expense_categories ec ON er.category_id = ec.id
      WHERE er.id = ? AND er.user_id = ?
    `, [expenseId, userId]);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: '开销记录不存在'
      });
    }

    const formattedExpense: ExpenseRecord = {
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      categoryId: expense.category_id,
      userId: expense.user_id,
      date: expense.expense_date,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at,
      category: {
        id: expense.category_id,
        name: expense.category_name,
        icon: expense.category_icon,
        color: expense.category_color,
        userId: expense.user_id,
        createdAt: expense.created_at
      }
    };

    res.json({
      success: true,
      data: formattedExpense
    });
  } catch (error) {
    console.error('获取开销记录详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};