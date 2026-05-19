import type { Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { generateSlug } from '../utils/slug.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { CategorySchema } from '../schemas/validation.js';
import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Fetch all available categories (public endpoint)
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
export const getCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.status(200).json(categories);
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Fetch a single category by ID (public endpoint)
 *     tags:
 *       - Categories
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
export const getCategoryById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await Category.findById(req.params['id']);

  if (!category) {
    throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
  }

  res.status(200).json(category);
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new category (superadmin only)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 */
export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = CategorySchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(400, errorMessage);
  }

  const { name, thumbnailUrl } = validationResult.data;
  const slug = generateSlug(name);

  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    throw new AppError(409, ERROR_MESSAGES.DUPLICATE_ENTRY);
  }

  if (!req.user) {
    throw new AppError(401, ERROR_MESSAGES.UNAUTHORIZED);
  }

  const category = await Category.create({
    name,
    slug,
    ...(thumbnailUrl && { thumbnailUrl }),
    createdBy: req.user.userId,
  });

  res.status(201).json(category);
});

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update a category
 *     description: Update category details (superadmin only)
 *     tags:
 *       - Categories
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
 *             properties:
 *               name:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
 */
export const updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = CategorySchema.partial().safeParse(req.body);

  if (!validationResult.success) {
    throw new AppError(400, validationResult.error.issues[0]?.message || 'Validation failed');
  }

  const category = await Category.findById(req.params['id']);

  if (!category) {
    throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
  }

  const { name, thumbnailUrl } = validationResult.data;

  if (name) {
    category.name = name;
    category.slug = generateSlug(name);
  }

  if (thumbnailUrl !== undefined) {
    category.thumbnailUrl = thumbnailUrl;
  }

  await category.save();
  res.status(200).json(category);
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Delete a category (superadmin only)
 *     tags:
 *       - Categories
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
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await Category.findByIdAndDelete(req.params['id']);

  if (!category) {
    throw new AppError(404, ERROR_MESSAGES.NOT_FOUND);
  }

  res.status(200).json({ message: 'Category deleted successfully' });
});
