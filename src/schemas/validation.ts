import { z } from 'zod';

const mobileField = z
  .string()
  .min(10, 'Mobile number must be at least 10 digits')
  .max(15, 'Mobile number must not exceed 15 digits')
  .regex(/^\d+$/, 'Mobile number must contain only digits');

const emailField = z
  .email('Invalid email address')
  .min(1, 'Email is required')
  .transform((v) => v.toLowerCase().trim());

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

export const UserRegisterSchema = z.object({
  mobileNumber: mobileField,
  password: passwordField,
});

export const UserLoginSchema = z.object({
  mobileNumber: mobileField,
  password: passwordField,
});

export const SuperadminRegisterSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const SuperadminLoginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const CategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters'),
  thumbnailUrl: z.url('Invalid thumbnail URL').optional(),
});

export const VideoSchema = z.object({
  title: z
    .string()
    .min(1, 'Video title is required')
    .max(200, 'Video title must not exceed 200 characters'),
  s3Key: z.string().min(1, 'S3 key is required'),
  duration: z.number().positive('Duration must be positive'),
  order: z.number().nonnegative('Order must be non-negative'),
});

export const SeriesSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  title: z
    .string()
    .min(1, 'Series title is required')
    .max(200, 'Series title must not exceed 200 characters'),
  description: z.string().optional(),
  thumbnailUrl: z.url('Invalid thumbnail URL').optional(),
  videos: z.array(VideoSchema).optional().default([]),
});

export const GenerateUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().regex(/^video\//, 'File type must be a video type'),
});

export type UserRegister = z.infer<typeof UserRegisterSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type SuperadminRegister = z.infer<typeof SuperadminRegisterSchema>;
export type SuperadminLogin = z.infer<typeof SuperadminLoginSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Video = z.infer<typeof VideoSchema>;
export type Series = z.infer<typeof SeriesSchema>;
export type GenerateUploadUrl = z.infer<typeof GenerateUploadUrlSchema>;
