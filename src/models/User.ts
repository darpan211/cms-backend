import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/index.js';

export interface IUser extends Document {
  mobileNumber?: string;
  email?: string;
  password: string;
  role: 'superadmin' | 'user';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    mobileNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      match: /^\d{10,15}$/,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: [ROLES.SUPERADMIN, ROLES.USER],
      default: ROLES.USER,
    },
  },
  {
    timestamps: true,
  },
);

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
