import type { Request, Response, NextFunction } from 'express';
import type { JWTPayload } from '../utils/jwt.js';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { ROLES, ERROR_MESSAGES } from '../constants/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    }
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== ROLES.ADMIN) {
    res.status(403).json({ error: ERROR_MESSAGES.ADMIN_ONLY });
    return;
  }
  next();
};
