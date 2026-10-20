import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { CategoryModel } from '../models/Category.ts';
import { MenuItemModel } from '../models/MenuItem.ts';
import { UserModel } from '../models/User.ts';
import { TableModel } from '../models/Table.ts';
import { CouponModel } from '../models/Coupon.ts';
import { InventoryModel } from '../models/Inventory.ts';
import { ReviewModel } from '../models/Review.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_COUPONS,
  INITIAL_INVENTORY,
  INITIAL_REVIEWS,
} from '../services/dbStore.ts';

dotenv.config();

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables. Please set it in .env first.');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas for manual seeding...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas.');

    console.log('🧹 Clearing existing collections...');
    await CategoryModel.deleteMany({});
    await MenuItemModel.deleteMany({});
    await UserModel.deleteMany({});
    await TableModel.deleteMany({});
    await CouponModel.deleteMany({});
    await InventoryModel.deleteMany({});
    await ReviewModel.deleteMany({});

    console.log('🌱 Inserting Categories...');
    await CategoryModel.insertMany(INITIAL_CATEGORIES);

    console.log('🌱 Inserting Menu Items...');
    await MenuItemModel.insertMany(INITIAL_MENU_ITEMS);

    console.log('🌱 Inserting Tables...');
    await TableModel.insertMany(INITIAL_TABLES);

    console.log('🌱 Inserting Coupons...');
    await CouponModel.insertMany(INITIAL_COUPONS);

    console.log('🌱 Inserting Inventory...');
    await InventoryModel.insertMany(INITIAL_INVENTORY);

    console.log('🌱 Inserting Reviews...');
    await ReviewModel.insertMany(INITIAL_REVIEWS);

    console.log('🌱 Seeding Staff and Demo Customer Users...');
    const salt = await bcrypt.genSalt(10);

    await UserModel.create([
      {
        name: 'Chief Barista Vikram',
        email: 'admin@brewhaven.com',
        passwordHash: await bcrypt.hash('Admin@123', salt),
        role: 'admin',
        phone: '+91 98765 43210',
        loyaltyPoints: 1200,
        favorites: [],
      },
      {
        name: 'Barista Priya',
        email: 'barista@brewhaven.com',
        passwordHash: await bcrypt.hash('Barista@123', salt),
        role: 'staff',
        phone: '+91 98765 11223',
        loyaltyPoints: 450,
        favorites: [],
      },
      {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        passwordHash: await bcrypt.hash('Customer@123', salt),
        role: 'customer',
        phone: '+91 98111 22334',
        loyaltyPoints: 240,
        addresses: [
          {
            label: 'Home',
            street: '42 Heritage Lane, Indiranagar',
            city: 'Bengaluru',
            postalCode: '560038',
            isDefault: true,
          },
        ],
        favorites: [],
      },
    ]);

    console.log('🎉 MongoDB Atlas successfully seeded with gourmet catalog and users!');
    console.log('Demo Credentials:');
    console.log('  Admin:    admin@brewhaven.com    / Admin@123');
    console.log('  Staff:    barista@brewhaven.com  / Barista@123');
    console.log('  Customer: alex@example.com       / Customer@123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err?.message || err);
    process.exit(1);
  }
}

runSeed();
