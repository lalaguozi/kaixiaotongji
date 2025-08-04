import jwt from 'jsonwebtoken';
import config from '../config';

export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
}

// 生成Token
export const generateToken = (payload: JwtPayload): string => {
  return (jwt.sign as any)(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// 验证Token
export const verifyToken = (token: string): JwtPayload => {
  try {
    return (jwt.verify as any)(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Token无效');
  }
};

// 从Authorization header中提取token
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};