export interface User {
  id: string;
  name: string;
  email: string;
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
  favorites?: string[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CustomizationOptions {
  sizes?: Array<{ name: string; priceDeltaPaise: number; volumeMl?: number }>;
  milkOptions?: Array<{ name: string; priceDeltaPaise: number; isDefault?: boolean }>;
  sugarLevels?: Array<{ label: string; percentage: number }>;
  toppings?: Array<{ name: string; priceDeltaPaise: number }>;
  extras?: Array<{ name: string; priceDeltaPaise: number }>;
}

export interface MenuItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryName?: string;
  pricePaise: number; // e.g. 28000 = ₹280.00
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  tags: string[];
  prepTimeMinutes: number;
  calories?: number;
  allergens?: string[];
  customizationOptions?: CustomizationOptions;
  ratingAverage: number;
  ratingCount: number;
}

export interface CartItem {
  id: string; // unique cart line id
  menuItemId: string;
  name: string;
  image: string;
  unitPricePaise: number;
  quantity: number;
  size?: string;
  milk?: string;
  sugar?: string;
  toppings: string[];
  extras: string[];
  instructions?: string;
  lineTotalPaise: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    address?: string;
  };
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  items: Array<{
    menuItem: string;
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
  }>;
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
  statusHistory?: Array<{
    status: string;
    note?: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: 'indoor' | 'patio' | 'window' | 'bar';
  isAvailable: boolean;
  status: 'available' | 'reserved' | 'occupied';
  notes?: string;
}

export interface Reservation {
  _id: string;
  reservationCode: string;
  user?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  tableNumber?: string;
  seatingArea: 'indoor' | 'patio' | 'window' | 'bar';
  specialRequests?: string;
  status: 'confirmed' | 'cancelled' | 'seated' | 'completed';
  createdAt: string;
}

export interface Review {
  _id: string;
  menuItem: string;
  menuItemName?: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValuePaise: number;
  maxDiscountPaise?: number;
  isActive: boolean;
  timesUsed: number;
}

export interface InventoryItem {
  _id: string;
  ingredientName: string;
  category: 'beans' | 'dairy' | 'syrup' | 'bakery' | 'packaging' | 'other';
  currentStock: number;
  unit: string;
  minThreshold: number;
  costPerUnitPaise: number;
  isLowStock?: boolean;
  lastRestocked: string;
}

export interface DashboardStats {
  totalRevenuePaise: number;
  totalOrdersCount: number;
  todayOrdersCount: number;
  todayRevenuePaise: number;
  activeReservationsCount: number;
  lowStockCount: number;
  totalCustomers: number;
  totalMenuItems: number;
  orderTypeCounts: {
    'dine-in': number;
    takeaway: number;
    delivery: number;
  };
  topSellingItems: Array<{
    name: string;
    count: number;
    revenuePaise: number;
  }>;
  dbStatus?: {
    connected: boolean;
    type: string;
    uriConfigured: boolean;
    maskedUri: string;
    error?: string;
    isMongooseConnected?: boolean;
  };
}

export interface AiRecommendation {
  source: string;
  baristaGreeting: string;
  recommendations: Array<{
    itemId: string;
    name: string;
    role: string;
    whyItFits: string;
    suggestedCustomization?: string;
    itemDetails?: MenuItem;
  }>;
  totalEstimatedPriceInr?: number;
}
