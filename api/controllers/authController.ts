import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbGet, dbRun, createDefaultCategoriesForUser } from '../database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/types';

// 用户注册
export const register = async (req: Request, res: Response) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, email, password }: RegisterRequest = req.body;

    // 检查用户名是否已存在
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const result = await dbRun(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const userId = result.lastID;

    // 为新用户创建默认类别
    await createDefaultCategoriesForUser(userId);

    // 获取创建的用户信息
    const user = await dbGet(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    // 生成Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      token
    };

    res.status(201).json({
      success: true,
      data: response,
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 用户登录
export const login = async (req: Request, res: Response) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, password }: LoginRequest = req.body;

    // 查找用户
    const user = await dbGet(
      'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      token
    };

    res.json({
      success: true,
      data: response,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    const user = await dbGet(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};