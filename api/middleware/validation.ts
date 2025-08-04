import { body, param, query } from 'express-validator';

// 用户注册验证
export const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('密码长度必须在6-128个字符之间')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个字母和一个数字')
];

// 用户登录验证
export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空'),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 创建类别验证
export const validateCreateCategory = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('类别名称长度必须在1-50个字符之间')
    .trim(),
  
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('图标长度不能超过10个字符'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('颜色必须是有效的十六进制颜色代码')
];

// 更新类别验证
export const validateUpdateCategory = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('类别ID必须是有效的正整数'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('类别名称长度必须在1-50个字符之间')
    .trim(),
  
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('图标长度不能超过10个字符'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('颜色必须是有效的十六进制颜色代码')
];

// 删除类别验证
export const validateDeleteCategory = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('类别ID必须是有效的正整数')
];

// 创建开销验证
export const validateCreateExpense = [
  body('amount')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('金额必须是0.01-999999.99之间的数值'),
  
  body('description')
    .isLength({ min: 1, max: 200 })
    .withMessage('描述长度必须在1-200个字符之间')
    .trim(),
  
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('类别ID必须是有效的正整数'),
  
  body('date')
    .isISO8601()
    .withMessage('日期格式无效')
    .toDate()
];

// 更新开销验证
export const validateUpdateExpense = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('开销记录ID必须是有效的正整数'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('金额必须是0.01-999999.99之间的数值'),
  
  body('description')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('描述长度必须在1-200个字符之间')
    .trim(),
  
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('类别ID必须是有效的正整数'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('日期格式无效')
    .toDate()
];

// 删除开销验证
export const validateDeleteExpense = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('开销记录ID必须是有效的正整数')
];

// 获取开销详情验证
export const validateGetExpenseById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('开销记录ID必须是有效的正整数')
];

// 分页验证
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数')
];

// 开销过滤验证
export const validateExpenseFilters = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('类别ID必须是有效的正整数'),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小金额必须是非负数'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最大金额必须是非负数'),
  
  query('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述搜索词长度不能超过200个字符')
];

// 统计查询验证
export const validateStatisticsQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('类别ID必须是有效的正整数'),
  
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('统计周期必须是daily、weekly、monthly或yearly之一')
];

// 类别趋势验证
export const validateCategoryTrends = [
  param('categoryId')
    .isInt({ min: 1 })
    .withMessage('类别ID必须是有效的正整数'),
  
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('统计周期必须是daily、weekly、monthly或yearly之一'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('限制数量必须是1-100之间的整数')
];