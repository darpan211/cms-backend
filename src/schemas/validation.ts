import { z } from 'zod';

export const UserLoginSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),
});

export const AdminLoginSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),
});

export const CreateSuperadminSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),
});

export const CategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters'),
  thumbnailUrl: z
    .string()
    .url('Invalid thumbnail URL')
    .optional(),
});

export const VideoSchema = z.object({
  title: z
    .string()
    .min(1, 'Video title is required')
    .max(200, 'Video title must not exceed 200 characters'),
  s3Key: z
    .string()
    .min(1, 'S3 key is required'),
  duration: z
    .number()
    .positive('Duration must be positive'),
  order: z
    .number()
    .nonnegative('Order must be non-negative'),
});

export const SeriesSchema = z.object({
  categoryId: z
    .string()
    .min(1, 'Category ID is required'),
  title: z
    .string()
    .min(1, 'Series title is required')
    .max(200, 'Series title must not exceed 200 characters'),
  description: z
    .string()
    .optional(),
  thumbnailUrl: z
    .string()
    .url('Invalid thumbnail URL')
    .optional(),
  videos: z
    .array(VideoSchema)
    .optional()
    .default([]),
});

export const GenerateUploadUrlSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required'),
  fileType: z
    .string()
    .regex(/^video\//, 'File type must be a video type'),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;
export type AdminLogin = z.infer<typeof AdminLoginSchema>;
export type CreateSuperadmin = z.infer<typeof CreateSuperadminSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Video = z.infer<typeof VideoSchema>;
export type Series = z.infer<typeof SeriesSchema>;
export type GenerateUploadUrl = z.infer<typeof GenerateUploadUrlSchema>;
