import type { Document, Types } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  razorpaySubscriptionId: string;
  razorpayPaymentId?: string;
  razorpayInvoiceId?: string;
  amount: number;
  event: string;
  rawPayload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpayInvoiceId: {
      type: String,
    },
    amount: {
      type: Number,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    rawPayload: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
