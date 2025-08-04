# 开销统计 (KaiXiaoTongJi)

一个现代化的个人开销统计管理系统，支持多平台使用。

## 功能特性

- 📊 **开销记录管理** - 记录每日开销明细，支持多种类别
- 📈 **统计分析** - 按周、月、年生成统计图表
- 🔐 **用户系统** - 完整的注册登录功能，数据隔离
- 📱 **响应式设计** - 适配手机和电脑端，随时随地记录
- 🎨 **现代UI** - 美观简洁的用户界面
- 💾 **数据安全** - 本地SQLite数据库存储

## 技术架构

### 前端
- React 18 + TypeScript
- Tailwind CSS - 样式框架
- Vite - 构建工具
- Recharts - 图表组件
- React Router - 路由管理

### 后端
- Node.js + Express + TypeScript
- SQLite - 数据库
- JWT - 用户认证
- bcrypt - 密码加密
- CORS - 跨域支持

## 快速开始

### 安装依赖
```bash
npm run install:all
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 启动生产服务
```bash
npm start
```

## 项目结构

```
kaixiaotongji/
├── client/              # React前端应用
│   ├── src/
│   │   ├── components/  # 组件
│   │   ├── pages/       # 页面
│   │   ├── hooks/       # 自定义Hook
│   │   ├── services/    # API服务
│   │   ├── types/       # 类型定义
│   │   └── utils/       # 工具函数
├── server/              # Node.js后端
│   ├── src/
│   │   ├── controllers/ # 控制器
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由
│   │   ├── middleware/  # 中间件
│   │   └── utils/       # 工具函数
├── shared/              # 共享类型定义
└── database/            # 数据库文件
```

## 开发说明

1. 前端运行在 http://localhost:5173
2. 后端运行在 http://localhost:3001
3. 数据库文件存储在 `database/expenses.db`

## 许可证

MIT License