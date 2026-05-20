import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  thumbnailUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Superadmin',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
