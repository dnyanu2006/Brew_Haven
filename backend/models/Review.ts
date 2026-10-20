import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  _id: string;
  menuItem: any;
  menuItemName?: string;
  user?: any;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    menuItem: { type: Schema.Types.Mixed, ref: 'MenuItem', required: true, index: true },
    menuItemName: { type: String },
    user: { type: Schema.Types.Mixed, ref: 'User' },
    userName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    verifiedPurchase: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
      index: true,
    },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
