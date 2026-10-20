import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number; // e.g. 15 for 15%, or 5000 for ₹50.00
  minOrderValuePaise: number;
  maxDiscountPaise?: number;
  expiryDate?: Date;
  isActive: boolean;
  usageLimit?: number;
  timesUsed: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, required: true },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 1 },
    minOrderValuePaise: { type: Number, default: 0 },
    maxDiscountPaise: { type: Number },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    usageLimit: { type: Number, default: 500 },
    timesUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
