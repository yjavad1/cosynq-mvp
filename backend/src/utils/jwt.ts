import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    issuer: 'cosynq-api',
    audience: 'cosynq-app'
  });
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'cosynq-api',
      audience: 'cosynq-app'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: user._id.toString(),
    type: 'refresh'
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '30d',
    issuer: 'cosynq-api',
    audience: 'cosynq-app'
  });
};