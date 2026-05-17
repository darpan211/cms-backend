import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.warn('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
};
