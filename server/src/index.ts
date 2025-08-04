import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import config from './config';
import { initializeDatabase } from './database';

// 导入路由
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import expenseRoutes from './routes/expenses';
import statisticsRoutes from './routes/statistics';

const app = express();

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
    env: config.nodeEnv
  });
});

// 静态文件服务 - 提供前端页面
if (config.nodeEnv === 'production') {
  // 提供静态文件
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // 处理前端路由 - 所有非API请求都返回index.html
  app.get('*', (req, res) => {
    // 排除API路径
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: '请求的API资源不存在'
      });
    }
    
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // 开发环境的404处理
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: '请求的资源不存在'
    });
  });
}



// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: config.nodeEnv === 'production' ? '服务器内部错误' : err.message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库
    await initializeDatabase();
    console.log('数据库初始化完成');

    // 启动服务器
    app.listen(config.port, () => {
      console.log(`🚀 服务器运行在 http://localhost:${config.port}`);
      console.log(`📊 开销统计API服务已启动`);
      console.log(`🌍 环境: ${config.nodeEnv}`);
      console.log(`🔗 前端地址: ${config.clientUrl}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('接收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('接收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

startServer();