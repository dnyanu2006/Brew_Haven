import {
  User,
  Category,
  MenuItem,
  Order,
  Reservation,
  Review,
  Coupon,
  InventoryItem,
  DashboardStats,
  AiRecommendation,
} from '../types/index.ts';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options?.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Failed request`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    fetchJson<{ message: string; user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string; staffOnly?: boolean }) =>
    fetchJson<{ message: string; user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    fetchJson<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => fetchJson<{ user: User }>('/auth/me'),

  toggleFavorite: (menuItemId: string) =>
    fetchJson<{ favorites: string[] }>('/auth/favorites', {
      method: 'POST',
      body: JSON.stringify({ menuItemId }),
    }),

  updateProfile: (body: { name?: string; phone?: string; address?: any }) =>
    fetchJson<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // Menu
  getCategories: () => fetchJson<Category[]>('/menu/categories'),

  getMenuItems: (params?: { category?: string; search?: string; vegOnly?: boolean; sort?: string; availableOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.vegOnly) query.set('vegOnly', 'true');
    if (params?.availableOnly) query.set('availableOnly', 'true');
    if (params?.sort) query.set('sort', params.sort);
    return fetchJson<MenuItem[]>(`/menu/items?${query.toString()}`);
  },

  getMenuItem: (idOrSlug: string) => fetchJson<MenuItem>(`/menu/items/${idOrSlug}`),

  createMenuItem: (body: Partial<MenuItem>) =>
    fetchJson<MenuItem>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateMenuItem: (id: string, body: Partial<MenuItem>) =>
    fetchJson<MenuItem>(`/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteMenuItem: (id: string) =>
    fetchJson<{ message: string }>(`/menu/items/${id}`, {
      method: 'DELETE',
    }),

  // Orders
  createOrder: (orderPayload: any) =>
    fetchJson<{ message: string; order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    }),

  getOrder: (idOrNumber: string) => fetchJson<Order>(`/orders/${idOrNumber}`),

  getUserOrders: () => fetchJson<Order[]>('/orders/my-orders'),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    fetchJson<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    }),

  // Reservations
  getTables: () => fetchJson<any[]>('/reservations/tables'),

  checkAvailability: (params: { date: string; timeSlot: string; guestCount?: number }) => {
    const query = new URLSearchParams();
    query.set('date', params.date);
    query.set('timeSlot', params.timeSlot);
    if (params.guestCount) query.set('guestCount', params.guestCount.toString());
    return fetchJson<{ available: boolean; availableTables: any[]; bookedCount: number }>(
      `/reservations/check-availability?${query.toString()}`
    );
  },

  createReservation: (body: any) =>
    fetchJson<{ message: string; reservation: Reservation }>('/reservations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getUserReservations: () => fetchJson<Reservation[]>('/reservations/my-reservations'),

  cancelReservation: (idOrCode: string) =>
    fetchJson<{ message: string; reservation: Reservation }>(`/reservations/${idOrCode}/cancel`, {
      method: 'PUT',
    }),

  // Reviews
  getItemReviews: (menuItemId: string) => fetchJson<Review[]>(`/reviews/item/${menuItemId}`),

  getAllReviews: () => fetchJson<Review[]>('/reviews/all'),

  createReview: (body: { menuItemId: string; rating: number; comment: string; userName?: string }) =>
    fetchJson<{ message: string; review: Review }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  moderateReview: (id: string, status: 'approved' | 'rejected') =>
    fetchJson<Review>(`/reviews/${id}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Coupons
  validateCoupon: (code: string, subtotalPaise: number) =>
    fetchJson<{
      valid: boolean;
      code: string;
      discountType: 'percentage' | 'flat';
      discountValue: number;
      discountPaise: number;
      description: string;
    }>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotalPaise }),
    }),

  getCoupons: () => fetchJson<Coupon[]>('/coupons'),

  createCoupon: (body: Partial<Coupon>) =>
    fetchJson<Coupon>('/coupons', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  toggleCoupon: (id: string) =>
    fetchJson<Coupon>(`/coupons/${id}/toggle`, {
      method: 'PUT',
    }),

  // Inventory
  getInventory: () => fetchJson<InventoryItem[]>('/inventory'),

  restockItem: (id: string, amount: number) =>
    fetchJson<InventoryItem>(`/inventory/restock/${id}`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  addInventoryItem: (body: Partial<InventoryItem>) =>
    fetchJson<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Admin
  getDashboardStats: () => fetchJson<DashboardStats>('/admin/stats'),

  getAllOrders: () => fetchJson<Order[]>('/admin/orders'),

  getAllReservations: () => fetchJson<Reservation[]>('/admin/reservations'),

  updateReservationStatus: (id: string, status: string) =>
    fetchJson<Reservation>(`/admin/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  connectMongoAtlas: (uri: string) =>
    fetchJson<{ message: string; dbStatus: any }>('/admin/connect-db', {
      method: 'POST',
      body: JSON.stringify({ uri }),
    }),

  // AI Sommelier
  getAiRecommendations: (preferences: {
    taste?: string;
    sweetness?: string;
    temperature?: string;
    dietary?: string;
    budgetMaxInr?: number;
    mood?: string;
  }) =>
    fetchJson<AiRecommendation>('/ai/recommend', {
      method: 'POST',
      body: JSON.stringify(preferences),
    }),
};
