import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRY } from '../constants/index.js';

export interface JWTPayload {
  userId: string;
  mobileNumber: string;
  role: 'admin' | 'user';
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY || JWT_EXPIRY as any });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
