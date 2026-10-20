import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomizationOption {
  sizes?: Array<{ name: string; priceDeltaPaise: number; volumeMl?: number }>;
  milkOptions?: Array<{ name: string; priceDeltaPaise: number; isDefault?: boolean }>;
  sugarLevels?: Array<{ label: string; percentage: number }>;
  toppings?: Array<{ name: string; priceDeltaPaise: number }>;
  extras?: Array<{ name: string; priceDeltaPaise: number }>;
}

export interface IMenuItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: any;
  categoryName?: string;
  pricePaise: number; // e.g. 24000 = ₹240.00
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  tags: string[];
  prepTimeMinutes: number;
  calories?: number;
  allergens?: string[];
  customizationOptions: ICustomizationOption;
  ratingAverage: number;
  ratingCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.Mixed, ref: 'Category', required: true, index: true },
    categoryName: { type: String },
    pricePaise: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    isVeg: { type: Boolean, default: true, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    isBestseller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
    prepTimeMinutes: { type: Number, default: 8 },
    calories: { type: Number },
    allergens: [{ type: String }],
    customizationOptions: {
      sizes: [
        {
          name: { type: String, required: true },
          priceDeltaPaise: { type: Number, default: 0 },
          volumeMl: { type: Number },
        },
      ],
      milkOptions: [
        {
          name: { type: String, required: true },
          priceDeltaPaise: { type: Number, default: 0 },
          isDefault: { type: Boolean, default: false },
        },
      ],
      sugarLevels: [
        {
          label: { type: String, required: true },
          percentage: { type: Number, required: true },
        },
      ],
      toppings: [
        {
          name: { type: String, required: true },
          priceDeltaPaise: { type: Number, default: 0 },
        },
      ],
      extras: [
        {
          name: { type: String, required: true },
          priceDeltaPaise: { type: Number, default: 0 },
        },
      ],
    },
    ratingAverage: { type: Number, default: 4.8, min: 1, max: 5 },
    ratingCount: { type: Number, default: 12 },
  },
  { timestamps: true }
);

export const MenuItemModel = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
