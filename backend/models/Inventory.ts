import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory {
  _id: string;
  ingredientName: string;
  category: 'beans' | 'dairy' | 'syrup' | 'bakery' | 'packaging' | 'other';
  currentStock: number;
  unit: 'kg' | 'liters' | 'units' | 'packets' | 'grams';
  minThreshold: number;
  costPerUnitPaise: number;
  supplier?: string;
  lastRestocked: Date;
  isLowStock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    ingredientName: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ['beans', 'dairy', 'syrup', 'bakery', 'packaging', 'other'],
      default: 'beans',
    },
    currentStock: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ['kg', 'liters', 'units', 'packets', 'grams'],
      required: true,
    },
    minThreshold: { type: Number, required: true, default: 5 },
    costPerUnitPaise: { type: Number, default: 0 },
    supplier: { type: String },
    lastRestocked: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InventorySchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minThreshold;
});

export const InventoryModel = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
