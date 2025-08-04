import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config';

// 确保数据库目录存在
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
export const db = new sqlite3.Database(config.databasePath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
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
          description TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          expense_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES expense_categories (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // 创建索引
      db.run(`CREATE INDEX IF NOT EXISTS idx_expense_records_user_date ON expense_records(user_id, expense_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_expense_records_category ON expense_records(category_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_expense_categories_user ON expense_categories(user_id)`);

      // 插入默认类别
      const defaultCategories = [
        { name: '餐饮', icon: '🍽️', color: '#EF4444' },
        { name: '交通', icon: '🚗', color: '#3B82F6' },
        { name: '购物', icon: '🛒', color: '#10B981' },
        { name: '娱乐', icon: '🎮', color: '#8B5CF6' },
        { name: '医疗', icon: '🏥', color: '#F59E0B' },
        { name: '教育', icon: '📚', color: '#06B6D4' },
        { name: '住房', icon: '🏠', color: '#84CC16' },
        { name: '其他', icon: '💼', color: '#6B7280' }
      ];

      // 注意：这里我们暂时不插入默认类别，因为需要用户ID
      // 将在用户注册时为每个用户创建默认类别

      console.log('数据库表初始化完成');
      resolve();
    });
  });
};

// 为新用户创建默认类别
export const createDefaultCategoriesForUser = (userId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const defaultCategories = [
      { name: '餐饮', icon: '🍽️', color: '#EF4444' },
      { name: '交通', icon: '🚗', color: '#3B82F6' },
      { name: '购物', icon: '🛒', color: '#10B981' },
      { name: '娱乐', icon: '🎮', color: '#8B5CF6' },
      { name: '医疗', icon: '🏥', color: '#F59E0B' },
      { name: '教育', icon: '📚', color: '#06B6D4' },
      { name: '住房', icon: '🏠', color: '#84CC16' },
      { name: '其他', icon: '💼', color: '#6B7280' }
    ];

    const stmt = db.prepare(`
      INSERT INTO expense_categories (name, icon, color, user_id)
      VALUES (?, ?, ?, ?)
    `);

    let completed = 0;
    defaultCategories.forEach((category) => {
      stmt.run([category.name, category.icon, category.color, userId], (err) => {
        if (err) {
          console.error('创建默认类别失败:', err);
        }
        completed++;
        if (completed === defaultCategories.length) {
          stmt.finalize();
          resolve();
        }
      });
    });
  });
};

// 数据库查询包装器
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