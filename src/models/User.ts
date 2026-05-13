import mongoose, { Document, Schema } from 'mongoose';
import { ROLES } from '../constants/index.js';

export interface IUser extends Document {
  mobileNumber: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{10,15}$/,
    },
    role: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.USER],
      default: ROLES.USER,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>('User', userSchema);
