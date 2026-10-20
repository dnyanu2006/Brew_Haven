import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.ts';
import { CategoryModel } from '../models/Category.ts';
import { MenuItemModel } from '../models/MenuItem.ts';
import { TableModel } from '../models/Table.ts';
import { CouponModel } from '../models/Coupon.ts';
import { InventoryModel } from '../models/Inventory.ts';
import { ReviewModel } from '../models/Review.ts';
import { OrderModel } from '../models/Order.ts';
import { ReservationModel } from '../models/Reservation.ts';
import { LoyaltyTransactionModel } from '../models/LoyaltyTransaction.ts';

// Initial pre-configured seed catalog for Brew Haven
export const INITIAL_CATEGORIES = [
  {
    _id: 'cat_hot_coffee',
    name: 'Espresso & Hot Coffee',
    slug: 'hot-coffee',
    description: 'Crafted with our signature double-shot espresso blend roasted in-house.',
    displayOrder: 1,
    isActive: true,
  },
  {
    _id: 'cat_cold_brew',
    name: 'Cold Brews & Iced Crafts',
    slug: 'cold-brews',
    description: '18-hour slow steeped specialty roasts and velvety iced tonics.',
    displayOrder: 2,
    isActive: true,
  },
  {
    _id: 'cat_pour_over',
    name: 'Single Origin & Manual Pour',
    slug: 'manual-pour',
    description: 'Pure terroir notes brewed fresh via V60, Chemex, and Aeropress.',
    displayOrder: 3,
    isActive: true,
  },
  {
    _id: 'cat_bakery',
    name: 'Fresh Viennoiserie & Bakes',
    slug: 'bakery-viennoiserie',
    description: 'French butter croissants, cruffins, and sourdough baked daily at 6:00 AM.',
    displayOrder: 4,
    isActive: true,
  },
  {
    _id: 'cat_savory',
    name: 'Gourmet Savory Bites',
    slug: 'savory-bites',
    description: 'Artisanal toasts, focaccia sandwiches, and warm brunch plates.',
    displayOrder: 5,
    isActive: true,
  },
  {
    _id: 'cat_teas',
    name: 'Artisanal Infusions & Teas',
    slug: 'artisanal-teas',
    description: 'First-flush Darjeeling, ceremonial Japanese matcha, and herbal blends.',
    displayOrder: 6,
    isActive: true,
  },
];

export const INITIAL_MENU_ITEMS = [
  {
    _id: 'item_caramel_macchiato',
    name: 'Salted Caramel Silk Macchiato',
    slug: 'salted-caramel-silk-macchiato',
    description: 'Velvety micro-foamed whole milk marked with a rich double ristretto shot, artisanal Himalayan pink salt caramel drizzle, and Madagascar vanilla.',
    category: 'cat_hot_coffee',
    categoryName: 'Espresso & Hot Coffee',
    pricePaise: 28000, // ₹280.00
    image: '/images/latte_art_caramel_macchiato_1792323909916.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    isFeatured: true,
    tags: ['Signature', 'Bestseller', 'Sweet & Velvety'],
    prepTimeMinutes: 6,
    calories: 220,
    allergens: ['Dairy'],
    customizationOptions: {
      sizes: [
        { name: 'Regular (250ml)', priceDeltaPaise: 0, volumeMl: 250 },
        { name: 'Large (350ml)', priceDeltaPaise: 4000, volumeMl: 350 },
        { name: 'Jumbo (450ml)', priceDeltaPaise: 8000, volumeMl: 450 },
      ],
      milkOptions: [
        { name: 'Farm Whole Milk', priceDeltaPaise: 0, isDefault: true },
        { name: 'Barista Oat Milk', priceDeltaPaise: 4000 },
        { name: 'Creamy Almond Milk', priceDeltaPaise: 5000 },
        { name: 'Soy Milk', priceDeltaPaise: 3000 },
        { name: 'Skimmed Milk', priceDeltaPaise: 0 },
      ],
      sugarLevels: [
        { label: 'Unsweetened (0%)', percentage: 0 },
        { label: 'Light Sweet (25%)', percentage: 25 },
        { label: 'Balanced (50%)', percentage: 50 },
        { label: 'Standard (75%)', percentage: 75 },
        { label: 'Sweet Tooth (100%)', percentage: 100 },
      ],
      toppings: [
        { name: 'Handcrafted Whipped Cream', priceDeltaPaise: 3500 },
        { name: 'Toasted Hazelnut Crunch', priceDeltaPaise: 3000 },
        { name: 'Belgian Cocoa Dust', priceDeltaPaise: 1500 },
      ],
      extras: [
        { name: 'Extra Espresso Ristretto Shot', priceDeltaPaise: 4500 },
        { name: 'Extra Salted Caramel Shot', priceDeltaPaise: 3500 },
        { name: 'Pure Vanilla Bean Extract', priceDeltaPaise: 3000 },
      ],
    },
    ratingAverage: 4.9,
    ratingCount: 84,
  },
  {
    _id: 'item_ethiopian_pour_over',
    name: 'Ethiopian Yirgacheffe V60',
    slug: 'ethiopian-yirgacheffe-v60',
    description: 'Lightly roasted heirloom single-origin pour-over displaying vibrant jasmine floral aromatics, wild bergamot, and sweet apricot finish.',
    category: 'cat_pour_over',
    categoryName: 'Single Origin & Manual Pour',
    pricePaise: 29000, // ₹290.00
    image: '/images/coffee_pour_over_specialty_1792323909005.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    isFeatured: true,
    tags: ['Single Origin', 'Fruity & Floral', 'Specialty'],
    prepTimeMinutes: 7,
    calories: 5,
    allergens: [],
    customizationOptions: {
      sizes: [
        { name: 'Single Cup (240ml)', priceDeltaPaise: 0, volumeMl: 240 },
        { name: 'Shared Carafe (500ml)', priceDeltaPaise: 18000, volumeMl: 500 },
      ],
      milkOptions: [
        { name: 'Black / No Milk (Recommended)', priceDeltaPaise: 0, isDefault: true },
        { name: 'Splash of Oat Milk', priceDeltaPaise: 2000 },
      ],
      sugarLevels: [
        { label: 'Zero Sugar (Pure Terroir)', percentage: 0 },
        { label: 'Demerara Raw Sugar on Side', percentage: 25 },
      ],
      toppings: [],
      extras: [
        { name: 'Ice Sphere for Chilling', priceDeltaPaise: 2000 },
      ],
    },
    ratingAverage: 4.95,
    ratingCount: 52,
  },
  {
    _id: 'item_french_butter_croissant',
    name: 'Artisanal French Butter Croissant',
    slug: 'artisanal-french-butter-croissant',
    description: '36-layer laminated pastry made with Normandy cultured butter. Crisp honey-comb crust with a cloud-soft, buttery interior.',
    category: 'cat_bakery',
    categoryName: 'Fresh Viennoiserie & Bakes',
    pricePaise: 19000, // ₹190.00
    image: '/images/pastry_croissant_breakfast_1792323910120.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    isFeatured: true,
    tags: ['Fresh Baked', 'Vegetarian', 'Classic'],
    prepTimeMinutes: 3,
    calories: 280,
    allergens: ['Dairy', 'Gluten'],
    customizationOptions: {
      sizes: [
        { name: 'Standard Single Piece', priceDeltaPaise: 0 },
        { name: 'Pair (2 Pieces - 10% Off)', priceDeltaPaise: 15000 },
      ],
      milkOptions: [],
      sugarLevels: [],
      toppings: [
        { name: 'Warm Organic Honey Glaze', priceDeltaPaise: 2000 },
        { name: 'Sea Salt Whipped Butter Pot', priceDeltaPaise: 2500 },
      ],
      extras: [
        { name: 'Artisanal Strawberry Rhubarb Jam', priceDeltaPaise: 3000 },
        { name: 'Warm Melted Dark Gianduja Dip', priceDeltaPaise: 4000 },
      ],
    },
    ratingAverage: 4.88,
    ratingCount: 67,
  },
  {
    _id: 'item_cold_brew_nitro',
    name: 'Nitro Cascara Reserve Cold Brew',
    slug: 'nitro-cascara-reserve-cold-brew',
    description: 'Micro-nitrogen infused cold brew poured from our tap. Incredibly creamy stout-like head with natural notes of milk chocolate, cherry blossom, and roasted cacao.',
    category: 'cat_cold_brew',
    categoryName: 'Cold Brews & Iced Crafts',
    pricePaise: 27000, // ₹270.00
    image: '/images/hero_brewhaven_cafe_1792323910107.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    isFeatured: true,
    tags: ['Cold Infusion', 'High Caffeine', 'Nitro Tap'],
    prepTimeMinutes: 3,
    calories: 12,
    allergens: [],
    customizationOptions: {
      sizes: [
        { name: 'Regular (330ml)', priceDeltaPaise: 0, volumeMl: 330 },
        { name: 'Large (450ml)', priceDeltaPaise: 5000, volumeMl: 450 },
      ],
      milkOptions: [
        { name: 'Pure Nitro Black', priceDeltaPaise: 0, isDefault: true },
        { name: 'Sweet Vanilla Cold Foam Top', priceDeltaPaise: 4000 },
        { name: 'Oat Milk Float', priceDeltaPaise: 3500 },
      ],
      sugarLevels: [
        { label: 'Unsweetened (0%)', percentage: 0 },
        { label: 'Vanilla Infused (30%)', percentage: 30 },
        { label: 'Caramel Infused (50%)', percentage: 50 },
      ],
      toppings: [
        { name: 'Cocoa Nibs Garnish', priceDeltaPaise: 2000 },
      ],
      extras: [
        { name: 'Cold Brew Concentrate Shot', priceDeltaPaise: 4500 },
      ],
    },
    ratingAverage: 4.92,
    ratingCount: 45,
  },
  {
    _id: 'item_avocado_sourdough_tartine',
    name: 'Truffle Hass Avocado Sourdough',
    slug: 'truffle-hass-avocado-sourdough',
    description: 'Charred 24hr fermented sourdough bread, whipped Persian feta cream, smashed Hass avocado, sun-dried tomatoes, toasted pumpkin seeds, and white truffle oil drizzle.',
    category: 'cat_savory',
    categoryName: 'Gourmet Savory Bites',
    pricePaise: 34000, // ₹340.00
    image: '/images/pastry_croissant_breakfast_1792323910120.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    isFeatured: true,
    tags: ['Gourmet', 'Brunch', 'Vegetarian'],
    prepTimeMinutes: 10,
    calories: 360,
    allergens: ['Dairy', 'Gluten', 'Seeds'],
    customizationOptions: {
      sizes: [
        { name: 'Single Toast Slice', priceDeltaPaise: 0 },
        { name: 'Platter Double Slice', priceDeltaPaise: 22000 },
      ],
      milkOptions: [],
      sugarLevels: [],
      toppings: [
        { name: 'Poached Organic Farm Egg', priceDeltaPaise: 4500 },
        { name: 'Pickled Pink Shallots', priceDeltaPaise: 2000 },
        { name: 'Chili Flakes & Hemp Hearts', priceDeltaPaise: 1500 },
      ],
      extras: [
        { name: 'Smoked Garlic Mushrooms', priceDeltaPaise: 6000 },
        { name: 'Crumbled Greek Goat Feta', priceDeltaPaise: 4500 },
      ],
    },
    ratingAverage: 4.85,
    ratingCount: 39,
  },
  {
    _id: 'item_ceremonial_matcha_latte',
    name: 'Uji Ceremonial Matcha Latte',
    slug: 'uji-ceremonial-matcha-latte',
    description: 'First harvest stone-ground green tea from Uji, Kyoto whisked with velvety steamed oat milk and a touch of raw organic wildflower blossom agave.',
    category: 'cat_teas',
    categoryName: 'Artisanal Infusions & Teas',
    pricePaise: 31000, // ₹310.00
    image: '/images/latte_art_caramel_macchiato_1792323909916.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    isFeatured: false,
    tags: ['Antioxidant', 'Kyoto Matcha', 'Zen'],
    prepTimeMinutes: 5,
    calories: 140,
    allergens: [],
    customizationOptions: {
      sizes: [
        { name: 'Regular (250ml)', priceDeltaPaise: 0, volumeMl: 250 },
        { name: 'Large (350ml)', priceDeltaPaise: 4500, volumeMl: 350 },
      ],
      milkOptions: [
        { name: 'Barista Oat Milk (Recommended)', priceDeltaPaise: 0, isDefault: true },
        { name: 'Whole Cow Milk', priceDeltaPaise: 0 },
        { name: 'Almond Milk', priceDeltaPaise: 4000 },
      ],
      sugarLevels: [
        { label: 'Unsweetened (Pure Matcha)', percentage: 0 },
        { label: 'Subtle Agave (25%)', percentage: 25 },
        { label: 'Standard Sweet (50%)', percentage: 50 },
      ],
      toppings: [
        { name: 'Matcha Dust Cream Cloud', priceDeltaPaise: 3500 },
      ],
      extras: [
        { name: 'Double Matcha Powder Boost', priceDeltaPaise: 5000 },
      ],
    },
    ratingAverage: 4.87,
    ratingCount: 29,
  },
  {
    _id: 'item_classic_cortado',
    name: 'Spanish Cortado (1:1 Ratio)',
    slug: 'spanish-cortado',
    description: 'Equal parts bold espresso and velvety steamed milk in a small Gibraltar glass, cutting the acidity for a smooth, punchy coffee experience.',
    category: 'cat_hot_coffee',
    categoryName: 'Espresso & Hot Coffee',
    pricePaise: 22000, // ₹220.00
    image: '/images/latte_art_caramel_macchiato_1792323909916.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    isFeatured: false,
    tags: ['Barista Pick', 'Strong', 'Low Sugar'],
    prepTimeMinutes: 4,
    calories: 60,
    allergens: ['Dairy'],
    customizationOptions: {
      sizes: [
        { name: 'Gibraltar Glass (150ml)', priceDeltaPaise: 0, volumeMl: 150 },
      ],
      milkOptions: [
        { name: 'Whole Milk', priceDeltaPaise: 0, isDefault: true },
        { name: 'Oat Milk', priceDeltaPaise: 3000 },
        { name: 'Almond Milk', priceDeltaPaise: 3500 },
      ],
      sugarLevels: [
        { label: '0% Unsweetened', percentage: 0 },
        { label: 'One Brown Sugar Cube', percentage: 25 },
      ],
      toppings: [],
      extras: [
        { name: 'Cinnamon Bark Dust', priceDeltaPaise: 1000 },
      ],
    },
    ratingAverage: 4.9,
    ratingCount: 41,
  },
  {
    _id: 'item_chocolate_cruffin',
    name: 'Dark Chocolate Ganache Cruffin',
    slug: 'dark-chocolate-ganache-cruffin',
    description: 'Croissant dough baked in a muffin mold, rolled in cinnamon spiced raw sugar and filled with molten 70% Single Origin Ecuadorian chocolate cream.',
    category: 'cat_bakery',
    categoryName: 'Fresh Viennoiserie & Bakes',
    pricePaise: 24000, // ₹240.00
    image: '/images/pastry_croissant_breakfast_1792323910120.jpg',
    isVeg: true,
    isAvailable: true,
    isBestseller: true,
    isFeatured: true,
    tags: ['Chocolate', 'Indulgent', 'Bakery'],
    prepTimeMinutes: 3,
    calories: 340,
    allergens: ['Dairy', 'Gluten'],
    customizationOptions: {
      sizes: [
        { name: 'Single Cruffin', priceDeltaPaise: 0 },
      ],
      milkOptions: [],
      sugarLevels: [],
      toppings: [
        { name: 'Roasted Almond Flakes', priceDeltaPaise: 2000 },
      ],
      extras: [
        { name: 'Warm Espresso Shot Pour-Over', priceDeltaPaise: 3500 },
      ],
    },
    ratingAverage: 4.96,
    ratingCount: 78,
  },
];

export const INITIAL_TABLES = [
  { _id: 'tbl_1', tableNumber: 'T-01', capacity: 2, location: 'window', status: 'available', isAvailable: true, notes: 'Sunlit street view table, cozy armchairs.' },
  { _id: 'tbl_2', tableNumber: 'T-02', capacity: 2, location: 'window', status: 'available', isAvailable: true, notes: 'Corner sunlit window table.' },
  { _id: 'tbl_3', tableNumber: 'T-03', capacity: 4, location: 'indoor', status: 'available', isAvailable: true, notes: 'Plush velvet booth seating with power outlets.' },
  { _id: 'tbl_4', tableNumber: 'T-04', capacity: 4, location: 'indoor', status: 'available', isAvailable: true, notes: 'Central cafe table next to bookshelf.' },
  { _id: 'tbl_5', tableNumber: 'T-05', capacity: 6, location: 'indoor', status: 'available', isAvailable: true, notes: 'Family gathering table in cedar wood.' },
  { _id: 'tbl_6', tableNumber: 'T-06', capacity: 4, location: 'patio', status: 'available', isAvailable: true, notes: 'Open garden patio with lush ferns.' },
  { _id: 'tbl_7', tableNumber: 'T-07', capacity: 2, location: 'patio', status: 'available', isAvailable: true, notes: 'Breezy outdoor bistro table.' },
  { _id: 'tbl_8', tableNumber: 'T-08', capacity: 2, location: 'bar', status: 'available', isAvailable: true, notes: 'Espresso bar stools directly facing master baristas.' },
];

export const INITIAL_COUPONS = [
  {
    _id: 'coup_firstbrew',
    code: 'FIRSTBREW',
    description: '20% off your entire first cafe order!',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValuePaise: 30000, // ₹300 min
    maxDiscountPaise: 15000, // ₹150 cap
    isActive: true,
    timesUsed: 14,
  },
  {
    _id: 'coup_haven50',
    code: 'HAVEN50',
    description: 'Flat ₹50 off on orders above ₹350',
    discountType: 'flat',
    discountValue: 5000, // ₹50 flat
    minOrderValuePaise: 35000, // ₹350 min
    isActive: true,
    timesUsed: 42,
  },
  {
    _id: 'coup_morning',
    code: 'MORNINGBREW',
    description: '15% off morning artisanal coffees & bakery',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValuePaise: 25000,
    maxDiscountPaise: 10000,
    isActive: true,
    timesUsed: 23,
  },
];

export const INITIAL_INVENTORY = [
  { _id: 'inv_1', ingredientName: 'Ethiopian Yirgacheffe Green Beans', category: 'beans', currentStock: 24, unit: 'kg', minThreshold: 8, costPerUnitPaise: 140000 },
  { _id: 'inv_2', ingredientName: 'Brew Haven Signature Espresso Blend', category: 'beans', currentStock: 45, unit: 'kg', minThreshold: 12, costPerUnitPaise: 120000 },
  { _id: 'inv_3', ingredientName: 'Organic Whole Farm Milk', category: 'dairy', currentStock: 62, unit: 'liters', minThreshold: 20, costPerUnitPaise: 7500 },
  { _id: 'inv_4', ingredientName: 'Oatly Barista Edition Oat Milk', category: 'dairy', currentStock: 18, unit: 'liters', minThreshold: 10, costPerUnitPaise: 28000 },
  { _id: 'inv_5', ingredientName: 'Almond Breeze Barista Milk', category: 'dairy', currentStock: 7, unit: 'liters', minThreshold: 8, costPerUnitPaise: 32000 },
  { _id: 'inv_6', ingredientName: 'Artisanal Salted Caramel Sauce', category: 'syrup', currentStock: 6, unit: 'liters', minThreshold: 3, costPerUnitPaise: 85000 },
  { _id: 'inv_7', ingredientName: 'French Normandy Cultured Butter', category: 'bakery', currentStock: 14, unit: 'kg', minThreshold: 5, costPerUnitPaise: 95000 },
  { _id: 'inv_8', ingredientName: '70% Dark Ecuadorian Chocolate Callets', category: 'bakery', currentStock: 11, unit: 'kg', minThreshold: 4, costPerUnitPaise: 160000 },
  { _id: 'inv_9', ingredientName: 'Compostable 350ml Coffee Cups & Lids', category: 'packaging', currentStock: 420, unit: 'units', minThreshold: 100, costPerUnitPaise: 800 },
];

export const INITIAL_REVIEWS = [
  {
    _id: 'rev_1',
    menuItem: 'item_caramel_macchiato',
    menuItemName: 'Salted Caramel Silk Macchiato',
    userName: 'Kavita Sharma',
    rating: 5,
    comment: 'Hands down the best macchiato in town! The house-made salted caramel and microfoam texture are purely heavenly.',
    verifiedPurchase: true,
    status: 'approved',
    createdAt: new Date('2026-10-10T10:30:00Z'),
  },
  {
    _id: 'rev_2',
    menuItem: 'item_ethiopian_pour_over',
    menuItemName: 'Ethiopian Yirgacheffe V60',
    userName: 'Rohan Mehra',
    rating: 5,
    comment: 'The floral clarity on this V60 is incredible. You can really taste the bergamot notes. The barista even explained the brew ratio!',
    verifiedPurchase: true,
    status: 'approved',
    createdAt: new Date('2026-10-12T14:15:00Z'),
  },
  {
    _id: 'rev_3',
    menuItem: 'item_french_butter_croissant',
    menuItemName: 'Artisanal French Butter Croissant',
    userName: 'Ananya Iyer',
    rating: 5,
    comment: 'Flaky, buttery, crisp exterior with a featherlight honeycomb interior. Tastes just like a Parisian morning bakery.',
    verifiedPurchase: true,
    status: 'approved',
    createdAt: new Date('2026-10-14T09:00:00Z'),
  },
];

// Unified Memory Store for zero-crash fallback and instant responsiveness
class MemoryStore {
  users: any[] = [];
  categories: any[] = [];
  menuItems: any[] = [];
  tables: any[] = [];
  coupons: any[] = [];
  inventory: any[] = [];
  reviews: any[] = [];
  orders: any[] = [];
  reservations: any[] = [];
  loyaltyTransactions: any[] = [];

  constructor() {
    this.seedMemory();
  }

  seedMemory() {
    // Passwords hashed with bcrypt
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@123', salt);
    const staffHash = bcrypt.hashSync('Barista@123', salt);
    const customerHash = bcrypt.hashSync('Customer@123', salt);

    this.users = [
      {
        _id: 'usr_admin',
        name: 'Chief Barista Vikram',
        email: 'admin@brewhaven.com',
        passwordHash: adminHash,
        role: 'admin',
        phone: '+91 98765 43210',
        loyaltyPoints: 1200,
        favorites: ['item_caramel_macchiato'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'usr_staff',
        name: 'Barista Priya',
        email: 'barista@brewhaven.com',
        passwordHash: staffHash,
        role: 'staff',
        phone: '+91 98765 11223',
        loyaltyPoints: 450,
        favorites: ['item_ethiopian_pour_over'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'usr_customer',
        name: 'Alex Rivera',
        email: 'alex@example.com',
        passwordHash: customerHash,
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
        favorites: ['item_caramel_macchiato', 'item_french_butter_croissant'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    this.menuItems = JSON.parse(JSON.stringify(INITIAL_MENU_ITEMS));
    this.tables = JSON.parse(JSON.stringify(INITIAL_TABLES));
    this.coupons = JSON.parse(JSON.stringify(INITIAL_COUPONS));
    this.inventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    this.reviews = JSON.parse(JSON.stringify(INITIAL_REVIEWS));

    // Sample initial placed and preparing orders for demonstration
    this.orders = [
      {
        _id: 'ord_1001',
        orderNumber: 'BH-1001',
        user: 'usr_customer',
        customerDetails: {
          name: 'Alex Rivera',
          phone: '+91 98111 22334',
          email: 'alex@example.com',
          address: 'Table T-03, Brew Haven Cafe',
        },
        orderType: 'dine-in',
        tableNumber: 'T-03',
        items: [
          {
            menuItem: 'item_caramel_macchiato',
            name: 'Salted Caramel Silk Macchiato',
            image: '/images/latte_art_caramel_macchiato_1792323909916.jpg',
            pricePaise: 28000,
            quantity: 1,
            size: 'Regular (250ml)',
            milk: 'Farm Whole Milk',
            sugar: 'Balanced (50%)',
            toppings: ['Handcrafted Whipped Cream'],
            extras: [],
            subtotalPaise: 31500,
          },
          {
            menuItem: 'item_french_butter_croissant',
            name: 'Artisanal French Butter Croissant',
            image: '/images/pastry_croissant_breakfast_1792323910120.jpg',
            pricePaise: 19000,
            quantity: 1,
            size: 'Standard Single Piece',
            toppings: ['Sea Salt Whipped Butter Pot'],
            extras: [],
            subtotalPaise: 21500,
          },
        ],
        subtotalPaise: 53000,
        taxPaise: 2650, // 5% GST
        deliveryFeePaise: 0,
        discountPaise: 5000, // HAVEN50
        totalPaise: 50650, // ₹506.50
        status: 'preparing',
        paymentMethod: 'test_upi',
        paymentStatus: 'paid',
        couponCode: 'HAVEN50',
        loyaltyPointsEarned: 50,
        estimatedPrepMinutes: 10,
        statusHistory: [
          { status: 'placed', note: 'Order placed by guest', timestamp: new Date(Date.now() - 15 * 60000) },
          { status: 'accepted', note: 'Accepted by kitchen', timestamp: new Date(Date.now() - 12 * 60000) },
          { status: 'preparing', note: 'Espresso extraction in progress', timestamp: new Date(Date.now() - 5 * 60000) },
        ],
        createdAt: new Date(Date.now() - 15 * 60000),
        updatedAt: new Date(),
      },
    ];

    this.reservations = [
      {
        _id: 'res_2001',
        reservationCode: 'BH-RES-8821',
        user: 'usr_customer',
        customerName: 'Alex Rivera',
        customerEmail: 'alex@example.com',
        customerPhone: '+91 98111 22334',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '05:30 PM',
        guestCount: 2,
        tableNumber: 'T-01',
        seatingArea: 'window',
        specialRequests: 'Window seat for anniversary coffee tasting.',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

export const memoryDb = new MemoryStore();

/**
 * Automatically seeds MongoDB Atlas if connected and collections are empty
 */
export async function seedMongoIfEmpty() {
  if (mongoose.connection.readyState !== 1) return;

  try {
    const categoryCount = await CategoryModel.countDocuments();
    if (categoryCount === 0) {
      console.log('🌱 Seeding MongoDB Atlas collections with initial Brew Haven catalog...');
      await CategoryModel.insertMany(INITIAL_CATEGORIES);
      await MenuItemModel.insertMany(INITIAL_MENU_ITEMS);
      await TableModel.insertMany(INITIAL_TABLES);
      await CouponModel.insertMany(INITIAL_COUPONS);
      await InventoryModel.insertMany(INITIAL_INVENTORY);
      await ReviewModel.insertMany(INITIAL_REVIEWS);

      // Seed initial staff and customer users if not already present
      for (const u of memoryDb.users) {
        const existing = await UserModel.findOne({ email: u.email });
        if (!existing) {
          await UserModel.create(u);
        }
      }

      console.log('✅ MongoDB Atlas seeded successfully with artisanal menu and users!');
    }
  } catch (err: any) {
    console.error('Failed to seed MongoDB Atlas:', err?.message || err);
  }
}
