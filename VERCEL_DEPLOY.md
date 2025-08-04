# Vercel 部署指南

本指南将帮助您将开销统计系统部署到 Vercel 云平台。

## 📋 部署前准备

### 1. 确保项目结构正确
项目已经配置好了以下文件：
- `vercel.json` - Vercel 部署配置
- `api/index.ts` - Vercel 无服务器函数入口
- `api/database.ts` - 适配 Vercel 的数据库配置
- `.env.example` - 环境变量示例

### 2. 推送代码到 GitHub
```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# 推送到 GitHub
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

## 🚀 Vercel 部署步骤

### 1. 注册 Vercel 账户
- 访问 [vercel.com](https://vercel.com)
- 使用 GitHub 账户登录

### 2. 导入项目
1. 点击 "New Project"
2. 选择您的 GitHub 仓库
3. 点击 "Import"

### 3. 配置项目设置
在项目设置页面：

**Framework Preset**: `Other`

**Build and Output Settings**:
- Build Command: `npm run build`
- Output Directory: `client/dist`
- Install Command: `npm run install:all`

### 4. 配置环境变量
在 Vercel 项目设置的 "Environment Variables" 部分添加：

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=https://your-app-name.vercel.app
DATABASE_PATH=/tmp/expenses.db
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**重要**: 
- 将 `your-super-secret-jwt-key-here` 替换为强密码
- 将 `your-app-name.vercel.app` 替换为您的实际域名

### 5. 部署
点击 "Deploy" 按钮开始部署。

## ⚠️ 重要注意事项

### 数据库限制
Vercel 使用无服务器架构，每次请求都会重新初始化：
- 数据库文件存储在 `/tmp` 目录（临时存储）
- 数据在函数重启时会丢失
- **建议生产环境使用外部数据库服务**

### 推荐的数据库解决方案
1. **PlanetScale** - MySQL 兼容的无服务器数据库
2. **Supabase** - PostgreSQL 数据库服务
3. **MongoDB Atlas** - NoSQL 数据库服务
4. **Vercel Postgres** - Vercel 官方数据库服务

## 🔧 生产环境优化

### 1. 使用外部数据库
修改 `api/database.ts` 以连接外部数据库：

```typescript
// 示例：使用 PostgreSQL
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### 2. 环境变量配置
添加数据库连接字符串：
```
DATABASE_URL=your-database-connection-string
```

### 3. 域名配置
在 Vercel 项目设置中：
1. 添加自定义域名
2. 更新 `CLIENT_URL` 环境变量

## 📱 访问应用

部署完成后：
1. Vercel 会提供一个 `.vercel.app` 域名
2. 访问该域名即可使用应用
3. 首次访问会自动初始化数据库

## 🐛 故障排除

### 常见问题

1. **构建失败**
   - 检查 `package.json` 中的脚本
   - 确保所有依赖都已正确安装

2. **API 请求失败**
   - 检查环境变量配置
   - 确认 CORS 设置正确

3. **数据库连接错误**
   - 检查数据库路径配置
   - 确认权限设置

### 查看日志
在 Vercel 控制台的 "Functions" 标签页可以查看详细日志。

## 🔄 更新部署

每次推送到 GitHub 主分支，Vercel 会自动重新部署：

```bash
git add .
git commit -m "Update application"
git push origin main
```

## 📞 支持

如果遇到问题：
1. 查看 Vercel 官方文档
2. 检查项目的 GitHub Issues
3. 联系开发团队

---

🎉 **恭喜！您的开销统计系统现在已经部署到云端了！**