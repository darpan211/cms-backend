import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/index.js';

export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'halted' | 'cancelled';

export interface IUserSubscription {
  status: SubscriptionStatus;
  razorpaySubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface IUser extends Document {
  mobileNumber: string;
  password: string;
  role: 'user';
  subscription: IUserSubscription;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const subscriptionSchema = new Schema<IUserSubscription>(
  {
    status: {
      type: String,
      enum: ['none', 'trial', 'active', 'halted', 'cancelled'],
      default: 'none',
      required: true,
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{10,15}$/,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: [ROLES.USER],
      default: ROLES.USER,
      required: true,
    },
    subscription: {
      type: subscriptionSchema,
      required: true,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ 'subscription.currentPeriodEnd': 1 });

userSchema.pre('save', async function (this: IUser): Promise<void> {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods['comparePassword'] = async function (
  this: IUser,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
