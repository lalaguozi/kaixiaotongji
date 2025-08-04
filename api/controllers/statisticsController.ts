import { Request, Response } from 'express';
import { dbGet, dbAll } from '../database';
import { ExpenseStatistics, StatisticsQuery } from '../../shared/types';

// 获取统计数据
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const query: StatisticsQuery = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
      period: (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly'
    };

    // 构建WHERE条件
    const conditions = ['er.user_id = ?'];
    const params = [userId];

    if (query.startDate) {
      conditions.push('DATE(datetime(er.expense_date/1000, \'unixepoch\')) >= ?');
      params.push(query.startDate as any);
    }

    if (query.endDate) {
      conditions.push('DATE(datetime(er.expense_date/1000, \'unixepoch\')) <= ?');
      params.push(query.endDate as any);
    }

    if (query.categoryId) {
      conditions.push('er.category_id = ?');
      params.push(query.categoryId);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 获取总金额和记录数
    const totalQuery = `
      SELECT 
        COALESCE(SUM(er.amount), 0) as totalAmount,
        COUNT(*) as recordCount
      FROM expense_records er
      ${whereClause}
    `;
    const totalResult = await dbGet(totalQuery, params);

    // 获取类别分布
    const categoryQuery = `
      SELECT 
        er.category_id,
        ec.name as category_name,
        ec.color as category_color,
        SUM(er.amount) as amount,
        COUNT(*) as count
      FROM expense_records er
      LEFT JOIN expense_categories ec ON er.category_id = ec.id
      ${whereClause}
      GROUP BY er.category_id, ec.name, ec.color
      ORDER BY amount DESC
    `;
    const categoryData = await dbAll(categoryQuery, params);

    // 计算类别百分比
    const categoryBreakdown = categoryData.map(item => ({
      categoryId: item.category_id,
      categoryName: item.category_name || '未知类别',
      amount: item.amount,
      percentage: totalResult.totalAmount > 0 ? (item.amount / totalResult.totalAmount) * 100 : 0,
      color: item.category_color || '#6B7280'
    }));

    // 获取按时间分组的数据
    let timeGroupData = [];
    
    switch (query.period) {
      case 'daily':
        const dailyQuery = `
          SELECT 
            DATE(datetime(er.expense_date/1000, 'unixepoch')) as date,
            SUM(er.amount) as amount
          FROM expense_records er
          ${whereClause}
          GROUP BY DATE(datetime(er.expense_date/1000, 'unixepoch'))
          ORDER BY date DESC
          LIMIT 30
        `;
        timeGroupData = await dbAll(dailyQuery, params);
        break;

      case 'weekly':
        const weeklyQuery = `
          SELECT 
            strftime('%Y-W%W', datetime(er.expense_date/1000, 'unixepoch')) as week,
            SUM(er.amount) as amount
          FROM expense_records er
          ${whereClause}
          GROUP BY strftime('%Y-%W', datetime(er.expense_date/1000, 'unixepoch'))
          ORDER BY week DESC
          LIMIT 12
        `;
        timeGroupData = await dbAll(weeklyQuery, params);
        break;

      case 'monthly':
        const monthlyQuery = `
          SELECT 
            strftime('%Y-%m', datetime(er.expense_date/1000, 'unixepoch')) as month,
            SUM(er.amount) as amount
          FROM expense_records er
          ${whereClause}
          GROUP BY strftime('%Y-%m', datetime(er.expense_date/1000, 'unixepoch'))
          ORDER BY month DESC
          LIMIT 12
        `;
        timeGroupData = await dbAll(monthlyQuery, params);
        break;

      case 'yearly':
        const yearlyQuery = `
          SELECT 
            strftime('%Y', datetime(er.expense_date/1000, 'unixepoch')) as year,
            SUM(er.amount) as amount
          FROM expense_records er
          ${whereClause}
          GROUP BY strftime('%Y', datetime(er.expense_date/1000, 'unixepoch'))
          ORDER BY year DESC
          LIMIT 5
        `;
        timeGroupData = await dbAll(yearlyQuery, params);
        break;
    }

    // 格式化时间数据
    const formatTimeData = (data: any[], period: string) => {
      return data.map(item => {
        switch (period) {
          case 'daily':
            return { date: item.date, amount: item.amount };
          case 'weekly':
            return { week: item.week, amount: item.amount };
          case 'monthly':
            return { month: item.month, amount: item.amount };
          case 'yearly':
            return { year: item.year, amount: item.amount };
          default:
            return item;
        }
      });
    };

    const statistics: ExpenseStatistics = {
      totalAmount: totalResult.totalAmount,
      recordCount: totalResult.recordCount,
      categoryBreakdown,
      dailyData: query.period === 'daily' ? formatTimeData(timeGroupData, 'daily') : [],
      weeklyData: query.period === 'weekly' ? formatTimeData(timeGroupData, 'weekly') : [],
      monthlyData: query.period === 'monthly' ? formatTimeData(timeGroupData, 'monthly') : [],
      yearlyData: query.period === 'yearly' ? formatTimeData(timeGroupData, 'yearly') : []
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取月度对比数据
export const getMonthlyComparison = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const months = parseInt(req.query.months as string) || 6;

    const query = `
      SELECT 
        strftime('%Y-%m', datetime(er.expense_date/1000, 'unixepoch')) as month,
        SUM(er.amount) as amount,
        COUNT(*) as count
      FROM expense_records er
      WHERE er.user_id = ?
        AND datetime(er.expense_date/1000, 'unixepoch') >= date('now', '-${months} months')
      GROUP BY strftime('%Y-%m', datetime(er.expense_date/1000, 'unixepoch'))
      ORDER BY month DESC
    `;

    const monthlyData = await dbAll(query, [userId]);

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('获取月度对比数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取类别趋势数据
export const getCategoryTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const categoryId = parseInt(req.params.categoryId);
    const period = (req.query.period as string) || 'monthly';
    const limit = parseInt(req.query.limit as string) || 12;

    let groupBy = '';
    let dateFormat = '';
    
    switch (period) {
      case 'daily':
        groupBy = 'DATE(datetime(er.expense_date/1000, \'unixepoch\'))';
        dateFormat = 'date';
        break;
      case 'weekly':
        groupBy = 'strftime(\'%Y-%W\', datetime(er.expense_date/1000, \'unixepoch\'))';
        dateFormat = 'week';
        break;
      case 'monthly':
        groupBy = 'strftime(\'%Y-%m\', datetime(er.expense_date/1000, \'unixepoch\'))';
        dateFormat = 'month';
        break;
      case 'yearly':
        groupBy = 'strftime(\'%Y\', datetime(er.expense_date/1000, \'unixepoch\'))';
        dateFormat = 'year';
        break;
      default:
        groupBy = 'strftime(\'%Y-%m\', datetime(er.expense_date/1000, \'unixepoch\'))';
        dateFormat = 'month';
    }

    const query = `
      SELECT 
        ${groupBy} as period,
        SUM(er.amount) as amount,
        COUNT(*) as count,
        ec.name as category_name,
        ec.color as category_color
      FROM expense_records er
      LEFT JOIN expense_categories ec ON er.category_id = ec.id
      WHERE er.user_id = ? AND er.category_id = ?
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT ?
    `;

    const trendData = await dbAll(query, [userId, categoryId, limit]);

    res.json({
      success: true,
      data: trendData.map(item => ({
        [dateFormat]: item.period,
        amount: item.amount,
        count: item.count,
        categoryName: item.category_name,
        categoryColor: item.category_color
      }))
    });
  } catch (error) {
    console.error('获取类别趋势数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取今日统计
export const getTodayStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const today = new Date().toISOString().split('T')[0];

    const todayQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as todayAmount,
        COUNT(*) as todayCount
      FROM expense_records
      WHERE user_id = ? AND DATE(datetime(expense_date/1000, 'unixepoch')) = ?
    `;

    const monthQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as monthAmount,
        COUNT(*) as monthCount
      FROM expense_records
      WHERE user_id = ? AND strftime('%Y-%m', datetime(expense_date/1000, 'unixepoch')) = strftime('%Y-%m', 'now')
    `;

    const yearQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as yearAmount,
        COUNT(*) as yearCount
      FROM expense_records
      WHERE user_id = ? AND strftime('%Y', datetime(expense_date/1000, 'unixepoch')) = strftime('%Y', 'now')
    `;

    const [todayResult, monthResult, yearResult] = await Promise.all([
      dbGet(todayQuery, [userId, today]),
      dbGet(monthQuery, [userId]),
      dbGet(yearQuery, [userId])
    ]);

    res.json({
      success: true,
      data: {
        today: {
          amount: todayResult.todayAmount,
          count: todayResult.todayCount
        },
        thisMonth: {
          amount: monthResult.monthAmount,
          count: monthResult.monthCount
        },
        thisYear: {
          amount: yearResult.yearAmount,
          count: yearResult.yearCount
        }
      }
    });
  } catch (error) {
    console.error('获取今日统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};