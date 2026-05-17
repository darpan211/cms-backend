import jwt, { type SignOptions } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRY } from '../constants/index.js';

export interface JWTPayload {
  userId: string;
  role: 'superadmin' | 'user';
  mobileNumber?: string;
  email?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const expiresIn = (JWT_EXPIRY || '7d') as NonNullable<SignOptions['expiresIn']>;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
