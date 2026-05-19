import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IVideo {
  title: string;
  s3Key: string;
  duration: number;
  order: number;
  thumbnailUrl?: string | null;
  _id?: mongoose.Types.ObjectId;
}

export interface IContent extends Document {
  categoryId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videos: IVideo[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    s3Key: {
      type: String,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
  },
  { _id: true },
);

const contentSchema = new Schema<IContent>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    videos: [videoSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Content = mongoose.model<IContent>('Content', contentSchema);
