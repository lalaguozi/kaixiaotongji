import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

// 用户注册
router.post('/register', validateRegister, register);

// 用户登录
router.post('/login', validateLogin, login);

// 获取当前用户信息
router.get('/me', authenticateToken, getCurrentUser);

export default router;