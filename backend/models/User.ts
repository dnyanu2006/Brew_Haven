import mongoose, { Schema, Document } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'staff' | 'kitchen' | 'admin';
  phone?: string;
  loyaltyPoints: number;
  addresses?: Array<{
    label: string;
    street: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
  }>;
  favorites: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'staff', 'kitchen', 'admin'],
      default: 'customer',
      index: true,
    },
    phone: { type: String, trim: true },
    loyaltyPoints: { type: Number, default: 100, min: 0 },
    addresses: [
      {
        label: { type: String, default: 'Home' },
        street: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    favorites: [{ type: Schema.Types.Mixed, ref: 'MenuItem' }],
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
