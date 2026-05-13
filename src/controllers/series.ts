import type { Request, Response } from 'express';
import { Content } from '../models/Content.js';
import { Category } from '../models/Category.js';
import { S3Service } from '../services/s3.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { GenerateUploadUrlSchema, SeriesSchema } from '../schemas/validation.js';
import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * @swagger
 * /api/admin/series/generate-upload-url:
 *   post:
 *     summary: Generate presigned S3 upload URL
 *     description: Generate a presigned POST URL for client-side S3 upload (admin only)
 *     tags:
 *       - Series
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: "video.mp4"
 *               fileType:
 *                 type: string
 *                 example: "video/mp4"
 *     responses:
 *       200:
 *         description: Presigned upload URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 fields:
 *                   type: object
 *                 s3Key:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *       400:
 *         description: Validation error
 */
export const generateUploadUrl = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = GenerateUploadUrlSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(400, errorMessage);
  }

  const { fileName, fileType } = validationResult.data;
  const uploadData = await S3Service.generateUploadUrl(fileName, fileType);

  res.status(200).json(uploadData);
});

/**
 * @swagger
 * /api/admin/series:
 *   post:
 *     summary: Create a new series
 *     description: Create a new series and save video metadata (admin only)
 *     tags:
 *       - Series
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               videos:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Series created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 */
export const createSeries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = SeriesSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(400, errorMessage);
  }

  const { categoryId, title, description, thumbnailUrl, videos } = validationResult.data;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
  }

  const series = await Content.create({
    categoryId: categoryId as any,
    title,
    ...(description && { description }),
    ...(thumbnailUrl && { thumbnailUrl }),
    videos: videos || [],
  });

  res.status(201).json(series);
});

/**
 * @swagger
 * /api/series/{id}:
 *   get:
 *     summary: Get series with streaming URLs
 *     description: Fetch series details with presigned stream URLs for each video
 *     tags:
 *       - Series
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Series with streaming URLs
 *       404:
 *         description: Series not found
 */
export const getSeriesById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const series = await Content.findById(req.params['id']).populate('categoryId');

  if (!series) {
    throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
  }

  const videosWithUrls = await Promise.all(
    series.videos.map(async (video) => ({
      ...JSON.parse(JSON.stringify(video)),
      streamUrl: await S3Service.generateStreamUrl(video.s3Key),
    })),
  );

  res.status(200).json({
    ...series.toObject(),
    videos: videosWithUrls,
  });
});

/**
 * @swagger
 * /api/admin/series/{id}:
 *   patch:
 *     summary: Update series
 *     description: Update series details and videos (admin only)
 *     tags:
 *       - Series
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Series updated
 *       404:
 *         description: Series not found
 */
export const updateSeries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = SeriesSchema.partial().safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(400, errorMessage);
  }

  const series = await Content.findById(req.params['id']);

  if (!series) {
    throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
  }

  const { categoryId, title, description, thumbnailUrl, videos } = validationResult.data;

  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
    }
    series.categoryId = categoryId as any;
  }

  if (title) series.title = title;
  if (description) series.description = description;
  if (thumbnailUrl) series.thumbnailUrl = thumbnailUrl;
  if (videos) series.videos = videos;

  await series.save();
  res.status(200).json(series);
});

/**
 * @swagger
 * /api/admin/series/{id}:
 *   delete:
 *     summary: Delete series
 *     description: Delete a series (admin only)
 *     tags:
 *       - Series
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Series deleted
 *       404:
 *         description: Series not found
 */
export const deleteSeries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const series = await Content.findByIdAndDelete(req.params['id']);

  if (!series) {
    throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
  }

  res.status(200).json({ message: 'Series deleted successfully' });
});
