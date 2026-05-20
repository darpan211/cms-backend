import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/index.js';

export interface ISuperadmin extends Document {
  email: string;
  password: string;
  role: 'superadmin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const superadminSchema = new Schema<ISuperadmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
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
      enum: [ROLES.SUPERADMIN],
      default: ROLES.SUPERADMIN,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

superadminSchema.pre('save', async function (this: ISuperadmin): Promise<void> {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

superadminSchema.methods['comparePassword'] = async function (
  this: ISuperadmin,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const Superadmin = mongoose.model<ISuperadmin>('Superadmin', superadminSchema);
