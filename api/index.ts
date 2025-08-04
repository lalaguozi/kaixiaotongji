import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initializeDatabase } from './database';

// 导入路由
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import expenseRoutes from './routes/expenses';
import statisticsRoutes from './routes/statistics';

const app = express();

// 配置
const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'production',
  jwtSecret: process.env.JWT_SECRET || 'kaixiaotongji-secret-key-2024',
  jwtExpiresIn: '7d',
  databasePath: process.env.DATABASE_PATH || '/tmp/expenses.db',
  clientUrl: process.env.CLIENT_URL || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  defaultPageSize: 20,
  maxPageSize: 100,
};

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use(limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 初始化数据库
initializeDatabase();

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/statistics', statisticsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务正常运行',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API路由未找到'
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? '服务器内部错误' : err.message
  });
});

export default app;