import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

export const config = {
  // 服务器配置
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT配置
  jwtSecret: process.env.JWT_SECRET || 'kaixiaotongji-secret-key-2024',
  jwtExpiresIn: '7d',
  
  // 数据库配置
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, '../../../database/expenses.db'),
  
  // CORS配置
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // 速率限制配置
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // 分页配置
  defaultPageSize: 20,
  maxPageSize: 100,
};

export default config;