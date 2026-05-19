export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const UPLOAD_URL_EXPIRY = 15 * 60; // 15 minutes
export const STREAM_URL_EXPIRY = 3600; // 1 hour
export const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
export const JWT_EXPIRY = process.env['JWT_EXPIRY'] || '7d';
export const S3_BUCKET = process.env['DO_SPACES_BUCKET'] || process.env['S3_BUCKET'] || '';
export const DO_SPACES_CDN = process.env['DO_SPACES_CDN'] || '';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  USER: 'user',
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized access',
  SUPERADMIN_ONLY: 'Superadmin access required',
  NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'Duplicate entry',
  INVALID_FILE: 'Invalid file type or size',
  USER_EXISTS: 'User with this mobile number already exists',
  SUPERADMIN_EXISTS: 'Superadmin with this email already exists',
} as const;
