import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  menuItem: any;
  name: string;
  image?: string;
  pricePaise: number;
  quantity: number;
  size?: string;
  milk?: string;
  sugar?: string;
  toppings?: string[];
  extras?: string[];
  instructions?: string;
  subtotalPaise: number;
}

export interface IOrderStatusHistory {
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
  note?: string;
  timestamp: Date;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user?: any;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    address?: string;
  };
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  items: IOrderItem[];
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
  paymentMethod: 'test_upi' | 'cod' | 'test_card';
  paymentStatus: 'pending' | 'paid';
  couponCode?: string;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  estimatedPrepMinutes?: number;
  statusHistory: IOrderStatusHistory[];
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.Mixed, ref: 'User', index: true },
    customerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String },
    },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true,
      default: 'dine-in',
    },
    tableNumber: { type: String },
    items: [
      {
        menuItem: { type: Schema.Types.Mixed, ref: 'MenuItem', required: true },
        name: { type: String, required: true },
        image: { type: String },
        pricePaise: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: { type: String },
        milk: { type: String },
        sugar: { type: String },
        toppings: [{ type: String }],
        extras: [{ type: String }],
        instructions: { type: String },
        subtotalPaise: { type: Number, required: true },
      },
    ],
    subtotalPaise: { type: Number, required: true },
    taxPaise: { type: Number, required: true, default: 0 },
    deliveryFeePaise: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true },
    status: {
      type: String,
      enum: ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'],
      default: 'placed',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['test_upi', 'cod', 'test_card'],
      default: 'test_upi',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'paid',
    },
    couponCode: { type: String },
    loyaltyPointsUsed: { type: Number, default: 0 },
    loyaltyPointsEarned: { type: Number, default: 0 },
    estimatedPrepMinutes: { type: Number, default: 15 },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
