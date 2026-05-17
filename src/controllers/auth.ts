import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { UserLoginSchema, AdminLoginSchema, CreateSuperadminSchema } from '../schemas/validation.js';
import { ROLES, ERROR_MESSAGES } from '../constants/index.js';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login with mobile number
 *     description: Login or register a user with mobile number
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "8780951343"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid mobile number
 */
export const userLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = UserLoginSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(400, errorMessage);
  }

  const { mobileNumber } = validationResult.data;

  let user = await User.findOne({ mobileNumber });

  if (!user) {
    user = await User.create({
      mobileNumber,
      role: ROLES.USER,
    });
  }

  const token = generateToken({
    userId: user._id.toString(),
    mobileNumber: user.mobileNumber,
    role: user.role,
  });

  res.status(200).json({
    token,
    user: {
      id: user._id,
      mobileNumber: user.mobileNumber,
      role: user.role,
    },
  });
});

/**
 * @swagger
 * /api/auth/admin-login:
 *   post:
 *     summary: Admin login with mobile number
 *     description: Login as admin (user must already exist with admin role)
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "8780951343"
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid credentials or not an admin
 *       400:
 *         description: Invalid mobile number
 */
export const adminLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = AdminLoginSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(401, errorMessage);
  }

  const { mobileNumber } = validationResult.data;

  const foundUser = await User.findOne({ mobileNumber, role: ROLES.ADMIN });

  if (!foundUser) {
    throw new AppError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const token = generateToken({
    userId: foundUser._id.toString(),
    mobileNumber: foundUser.mobileNumber,
    role: foundUser.role,
  });

  res.status(200).json({
    token,
    user: {
      id: foundUser._id,
      mobileNumber: foundUser.mobileNumber,
      role: foundUser.role,
    },
  });
});

/**
 * @swagger
 * /api/auth/create-superadmin:
 *   post:
 *     summary: Create a superadmin user
 *     description: Create a new superadmin account (admin only)
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Superadmin created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 *       403:
 *         description: Admin access required
 */
export const createSuperadmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = CreateSuperadminSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(400, errorMessage);
  }

  const { mobileNumber } = validationResult.data;

  const existingUser = await User.findOne({ mobileNumber });

  if (existingUser) {
    throw new AppError(409, ERROR_MESSAGES.DUPLICATE_ENTRY);
  }

  const superadmin = await User.create({
    mobileNumber,
    role: ROLES.ADMIN,
  });

  res.status(201).json({
    message: 'Superadmin created successfully',
    user: {
      id: superadmin._id,
      mobileNumber: superadmin.mobileNumber,
      role: superadmin.role,
    },
  });
});
