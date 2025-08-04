import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Vercel环境下的数据库配置
const getDatabasePath = () => {
  if (process.env.NODE_ENV === 'production') {
    // Vercel环境使用临时目录
    return '/tmp/expenses.db';
  }
  // 开发环境使用项目目录
  return path.join(process.cwd(), 'database', 'expenses.db');
};

const databasePath = getDatabasePath();

// 确保数据库目录存在
const dbDir = path.dirname(databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
export const db = new sqlite3.Database(databasePath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功:', databasePath);
  }
});

// 初始化数据库表
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 开销类别表
      db.run(`
        CREATE TABLE IF NOT EXISTS expense_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT NOT NULL DEFAULT '💰',
          color TEXT NOT NULL DEFAULT '#3B82F6',
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(name, user_id)
        )
      `);

      // 开销记录表
      db.run(`
        CREATE TABLE IF NOT EXISTS expense_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          expense_date DATE NOT NULL,
          category_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES expense_categories (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('数据库初始化失败:', err);
          reject(err);
        } else {
          console.log('数据库初始化成功');
          resolve();
        }
      });
    });
  });
};

// 为新用户创建默认类别
export const createDefaultCategoriesForUser = (userId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const defaultCategories = [
      { name: '餐饮', icon: '🍽️', color: '#EF4444' },
      { name: '交通', icon: '🚗', color: '#3B82F6' },
      { name: '购物', icon: '🛍️', color: '#8B5CF6' },
      { name: '娱乐', icon: '🎮', color: '#F59E0B' },
      { name: '医疗', icon: '🏥', color: '#10B981' },
      { name: '教育', icon: '📚', color: '#6366F1' },
      { name: '住房', icon: '🏠', color: '#84CC16' },
      { name: '其他', icon: '💰', color: '#6B7280' }
    ];

    const insertPromises = defaultCategories.map(category => {
      return new Promise<void>((resolveCategory, rejectCategory) => {
        db.run(
          'INSERT OR IGNORE INTO expense_categories (name, icon, color, user_id) VALUES (?, ?, ?, ?)',
          [category.name, category.icon, category.color, userId],
          (err) => {
            if (err) {
              rejectCategory(err);
            } else {
              resolveCategory();
            }
          }
        );
      });
    });

    Promise.all(insertPromises)
      .then(() => resolve())
      .catch(reject);
  });
};

// 数据库查询辅助函数
export const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const dbRun = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

export default db;