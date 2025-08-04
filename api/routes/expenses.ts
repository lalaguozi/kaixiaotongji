import { Router } from 'express';
import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getExpenseById
} from '../../server/src/controllers/expenseController';
import { authenticateToken } from '../../server/src/middleware/auth';
import { 
  validateCreateExpense, 
  validateUpdateExpense, 
  validateDeleteExpense,
  validateGetExpenseById,
  validatePagination,
  validateExpenseFilters
} from '../../server/src/middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取开销记录列表
router.get('/', validatePagination, validateExpenseFilters, getExpenses);

// 创建新开销记录
router.post('/', validateCreateExpense, createExpense);

// 获取单个开销记录详情
router.get('/:id', validateGetExpenseById, getExpenseById);

// 更新开销记录
router.put('/:id', validateUpdateExpense, updateExpense);

// 删除开销记录
router.delete('/:id', validateDeleteExpense, deleteExpense);

export default router;