import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Superadmin } from '../models/Superadmin.js';
import { generateToken } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import {
  UserRegisterSchema,
  UserLoginSchema,
  SuperadminRegisterSchema,
  SuperadminLoginSchema,
} from '../schemas/validation.js';
import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a normal user with mobile number and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber, password]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "8780951343"
 *               password:
 *                 type: string
 *                 example: "Passw0rd!"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
export const userRegister = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parsed = UserRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message || 'Validation failed');
  }

  const { mobileNumber, password } = parsed.data;

  const exists = await User.findOne({ mobileNumber });
  if (exists) {
    throw new AppError(409, ERROR_MESSAGES.USER_EXISTS);
  }

  const user = await User.create({
    mobileNumber,
    password,
  });

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    mobileNumber: user.mobileNumber,
  });

  res.status(201).json({
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
 * /api/auth/login:
 *   post:
 *     summary: User login with mobile number and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobileNumber, password]
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "8780951343"
 *               password:
 *                 type: string
 *                 example: "Passw0rd!"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
export const userLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parsed = UserLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message || 'Validation failed');
  }

  const { mobileNumber, password } = parsed.data;

  const user = await User.findOne({ mobileNumber }).select('+password');
  if (!user) {
    throw new AppError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new AppError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    mobileNumber: user.mobileNumber,
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
 * /api/auth/superadmin/register:
 *   post:
 *     summary: Create a superadmin (bootstrap; only allowed if none exists)
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@darpan.com"
 *               password:
 *                 type: string
 *                 example: "SuperSecret123!"
 *     responses:
 *       201:
 *         description: Superadmin created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Superadmin already exists
 */
export const superadminRegister = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SuperadminRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message || 'Validation failed');
    }

    const { email, password } = parsed.data;

    const existingByEmail = await Superadmin.findOne({ email });
    if (existingByEmail) {
      throw new AppError(409, ERROR_MESSAGES.SUPERADMIN_EXISTS);
    }

    const superadmin = await Superadmin.create({
      email,
      password,
    });

    const token = generateToken({
      userId: superadmin._id.toString(),
      role: superadmin.role,
      email: superadmin.email,
    });

    res.status(201).json({
      token,
      user: {
        id: superadmin._id,
        email: superadmin.email,
        role: superadmin.role,
      },
    });
  },
);

/**
 * @swagger
 * /api/auth/superadmin/login:
 *   post:
 *     summary: Superadmin login with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@darpan.com"
 *               password:
 *                 type: string
 *                 example: "SuperSecret123!"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
export const superadminLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parsed = SuperadminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message || 'Validation failed');
  }

  const { email, password } = parsed.data;

  const superadmin = await Superadmin.findOne({ email }).select('+password');
  if (!superadmin) {
    throw new AppError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const ok = await superadmin.comparePassword(password);
  if (!ok) {
    throw new AppError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const token = generateToken({
    userId: superadmin._id.toString(),
    role: superadmin.role,
    email: superadmin.email,
  });

  res.status(200).json({
    token,
    user: {
      id: superadmin._id,
      email: superadmin.email,
      role: superadmin.role,
    },
  });
});
