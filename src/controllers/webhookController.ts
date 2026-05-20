import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { AppError, asyncHandler } from '../utils/errors.js';

interface RazorpayEntityWithId {
  id?: string;
  amount?: number;
  notes?: Record<string, string>;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    subscription?: { entity?: RazorpayEntityWithId };
    payment?: { entity?: RazorpayEntityWithId & { invoice_id?: string } };
    invoice?: { entity?: RazorpayEntityWithId & { subscription_id?: string } };
  };
}

const verifySignature = (rawBody: Buffer, signature: string, secret: string): boolean => {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

const extractSubscriptionId = (payload: RazorpayWebhookPayload): string | undefined => {
  const subEntity = payload.payload?.subscription?.entity;
  if (subEntity?.id) return subEntity.id;
  const invoiceEntity = payload.payload?.invoice?.entity;
  if (invoiceEntity?.subscription_id) return invoiceEntity.subscription_id;
  return undefined;
};

const extractPaymentId = (payload: RazorpayWebhookPayload): string | undefined => {
  return payload.payload?.payment?.entity?.id;
};

const extractInvoiceId = (payload: RazorpayWebhookPayload): string | undefined => {
  const invoiceEntity = payload.payload?.invoice?.entity;
  if (invoiceEntity?.id) return invoiceEntity.id;
  return payload.payload?.payment?.entity?.invoice_id;
};

const extractAmount = (payload: RazorpayWebhookPayload): number => {
  return (
    payload.payload?.payment?.entity?.amount ??
    payload.payload?.invoice?.entity?.amount ??
    payload.payload?.subscription?.entity?.amount ??
    0
  );
};

const extractNotesUserId = (payload: RazorpayWebhookPayload): string | undefined => {
  return payload.payload?.subscription?.entity?.notes?.['userId'];
};

/**
 * @swagger
 * /api/webhooks/razorpay:
 *   post:
 *     summary: Razorpay webhook receiver
 *     description: Receives Razorpay subscription/payment events. Authenticated via HMAC-SHA256 signature (`x-razorpay-signature`) — no bearer token required. The request body MUST be the raw JSON bytes; the signature is verified over those bytes before parsing.
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event acknowledged (including unhandled events — Razorpay retries non-200 responses)
 *       400:
 *         description: Missing or invalid signature, or malformed payload
 */
export const razorpayWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];

  if (!signature || typeof signature !== 'string' || !secret) {
    throw new AppError(400, 'Missing signature');
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    throw new AppError(400, 'Malformed payload');
  }

  if (!verifySignature(rawBody, signature, secret)) {
    throw new AppError(400, 'Invalid signature');
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookPayload;
  } catch {
    throw new AppError(400, 'Malformed payload');
  }

  const event = payload.event;
  if (!event || typeof event !== 'string') {
    throw new AppError(400, 'Malformed payload');
  }

  const subscriptionId = extractSubscriptionId(payload);
  const paymentId = extractPaymentId(payload);
  const invoiceId = extractInvoiceId(payload);
  const amount = extractAmount(payload);
  const notesUserId = extractNotesUserId(payload);

  // Resolve the user. For subscription.authenticated we also accept the
  // notes.userId set during /subscribe, since the user record won't yet
  // carry the subscriptionId.
  let user = subscriptionId
    ? await User.findOne({ 'subscription.razorpaySubscriptionId': subscriptionId })
    : null;

  if (!user && event === 'subscription.authenticated' && notesUserId) {
    if (mongoose.isValidObjectId(notesUserId)) {
      user = await User.findById(notesUserId);
    }
  }

  // Idempotency check: if we've already processed this paymentId or
  // invoiceId for this event, log a duplicate Transaction but skip the
  // user-state mutation.
  let isDuplicate = false;
  if (paymentId || invoiceId) {
    const dupQuery: Record<string, unknown> = { event };
    if (paymentId) dupQuery['razorpayPaymentId'] = paymentId;
    if (invoiceId) dupQuery['razorpayInvoiceId'] = invoiceId;
    const existing = await Transaction.findOne(dupQuery);
    if (existing) isDuplicate = true;
  }

  if (user && !isDuplicate) {
    const now = new Date();
    switch (event) {
      case 'subscription.authenticated': {
        user.subscription.status = 'trial';
        user.subscription.currentPeriodStart = now;
        user.subscription.currentPeriodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (subscriptionId) {
          user.subscription.razorpaySubscriptionId = subscriptionId;
        }
        await user.save();
        break;
      }
      case 'invoice.paid': {
        user.subscription.status = 'active';
        user.subscription.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        user.subscription.cancelAtPeriodEnd = false;
        await user.save();
        break;
      }
      case 'subscription.halted': {
        user.subscription.status = 'halted';
        await user.save();
        break;
      }
      case 'subscription.cancelled': {
        // Do not clear currentPeriodEnd — preserves grace-period access.
        user.subscription.status = 'cancelled';
        await user.save();
        break;
      }
      default: {
        // Unhandled events: audit-log only, no state mutation.
        break;
      }
    }
  }

  if (user) {
    await Transaction.create({
      userId: user._id,
      ...(subscriptionId && { razorpaySubscriptionId: subscriptionId }),
      ...(paymentId && { razorpayPaymentId: paymentId }),
      ...(invoiceId && { razorpayInvoiceId: invoiceId }),
      amount,
      event,
      rawPayload: payload as unknown as Record<string, unknown>,
    });
  }

  res.status(200).json({ received: true });
});
