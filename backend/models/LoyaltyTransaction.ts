import mongoose, { Schema, Document } from 'mongoose';

export interface ILoyaltyTransaction {
  _id: string;
  user: any;
  order?: any;
  points: number; // positive = added, negative = deducted
  type: 'earned' | 'redeemed' | 'bonus' | 'adjustment';
  description: string;
  balanceAfter: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const LoyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    user: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.Mixed, ref: 'Order' },
    points: { type: Number, required: true },
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'bonus', 'adjustment'],
      required: true,
    },
    description: { type: String, required: true },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

export const LoyaltyTransactionModel =
  mongoose.models.LoyaltyTransaction ||
  mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', LoyaltyTransactionSchema);
