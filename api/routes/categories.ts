import { Router } from 'express';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../server/src/controllers/categoryController';
import { authenticateToken } from '../../server/src/middleware/auth';
import { 
  validateCreateCategory, 
  validateUpdateCategory, 
  validateDeleteCategory 
} from '../../server/src/middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户的所有类别
router.get('/', getCategories);

// 创建新类别
router.post('/', validateCreateCategory, createCategory);

// 更新类别
router.put('/:id', validateUpdateCategory, updateCategory);

// 删除类别
router.delete('/:id', validateDeleteCategory, deleteCategory);

export default router;