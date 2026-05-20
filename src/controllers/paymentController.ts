import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { RazorpayService } from '../services/razorpay.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { CancelSubscriptionSchema, SubscribeSchema } from '../schemas/validation.js';
import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * @swagger
 * /api/payments/subscribe:
 *   post:
 *     summary: Create a Razorpay subscription
 *     description: Creates a Razorpay subscription for the authenticated user. Trial pricing (₹2 / 7 days, then ₹149/month) is configured on the Plan in the Razorpay dashboard, not in the request payload.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptionId:
 *                   type: string
 *                 razorpayKeyId:
 *                   type: string
 *                 shortUrl:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export const subscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validationResult = SubscribeSchema.safeParse(req.body ?? {});

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
    throw new AppError(400, errorMessage);
  }

  if (!req.user) {
    throw new AppError(401, ERROR_MESSAGES.UNAUTHORIZED);
  }

  // NOTE: ₹2 trial for 7 days then ₹149/month must be configured on the Plan in
  // the Razorpay dashboard. The Razorpay subscription API does not accept
  // ad-hoc trial pricing in the create payload — do NOT try to set it here.
  const subscription = await RazorpayService.createSubscription({
    planId: RazorpayService.getPlanId(),
    totalCount: 12,
    notes: { userId: req.user.userId },
  });

  // NOTE: do not persist razorpaySubscriptionId on the user here — the
  // `subscription.authenticated` webhook is the source of truth for status
  // transitions. Writing in both places creates race conditions.
  res.status(200).json({
    subscriptionId: subscription.id,
    razorpayKeyId: RazorpayService.getPublicKeyId(),
    shortUrl: subscription.shortUrl,
  });
});

/**
 * @swagger
 * /api/payments/cancel:
 *   post:
 *     summary: Cancel a Razorpay subscription at period end
 *     description: Cancels the authenticated user's subscription at the end of the current billing cycle, preserving grace-period access.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razorpaySubscriptionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 accessUntil:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Subscription does not belong to the authenticated user
 */
export const cancelSubscription = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validationResult = CancelSubscriptionSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
      throw new AppError(400, errorMessage);
    }

    if (!req.user) {
      throw new AppError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { razorpaySubscriptionId } = validationResult.data;

    const user = await User.findOne({
      _id: req.user.userId,
      'subscription.razorpaySubscriptionId': razorpaySubscriptionId,
    });

    if (!user) {
      throw new AppError(403, 'Subscription does not belong to the authenticated user');
    }

    // `true` => cancel at cycle end, preserves grace period.
    await RazorpayService.cancelSubscription(razorpaySubscriptionId, true);

    user.subscription.cancelAtPeriodEnd = true;
    user.subscription.status = 'cancelled';
    await user.save();

    res.status(200).json({
      status: 'cancelled',
      accessUntil: user.subscription.currentPeriodEnd,
    });
  },
);
