import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  DashboardStats,
  Order,
  Reservation,
  MenuItem,
  InventoryItem,
  Coupon,
  Review,
} from '../types/index.ts';
import {
  Shield,
  DollarSign,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Database,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  LogOut,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, showToast, navigateTo, logout } = useApp();

  // Route protection: unauthorized users or customers are blocked
  if (!user || user.role === 'customer') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-[#291811]">
            Access Denied: Staff Authorization Required
          </h2>
          <p className="text-xs text-[#6B5547] leading-relaxed">
            The management console, live kitchen orders, and inventory systems are strictly restricted
            to authenticated Brew Haven staff and administrators.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigateTo('staff-login')}
            className="px-5 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-semibold rounded-xl hover:bg-[#3D251A] transition-colors"
          >
            Staff Portal Sign In
          </button>
          <button
            onClick={() => navigateTo('home')}
            className="px-5 py-2.5 border border-[#D9CEBF] text-[#291811] text-xs font-medium rounded-xl hover:bg-[#FAF7F2] transition-colors"
          >
            Return to Cafe
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'orders' | 'menu' | 'reservations' | 'coupons' | 'inventory' | 'reviews' | 'database'
  >('analytics');

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Entities
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Modals & form state
  const [editingMenuItem, setEditingMenuItem] = useState<Partial<MenuItem> | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    description: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    minOrderValueInr: number;
  }>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValueInr: 250,
  });

  // DB URI state
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [isConnectingDb, setIsConnectingDb] = useState(false);

  const loadAllData = () => {
    setIsLoadingStats(true);
    Promise.all([
      api.getDashboardStats().catch(() => null),
      api.getAllOrders().catch(() => []),
      api.getAllReservations().catch(() => []),
      api.getMenuItems().catch(() => []),
      api.getInventory().catch(() => []),
      api.getCoupons().catch(() => []),
      api.getAllReviews().catch(() => []),
    ])
      .then(([st, ords, resvs, items, inv, coups, revs]) => {
        if (st) setStats(st);
        setOrders(ords);
        setReservations(resvs);
        setMenuItems(items);
        setInventory(inv);
        setCoupons(coups);
        setReviews(revs);
      })
      .finally(() => setIsLoadingStats(false));
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      showToast(`Order status updated to ${status}`, 'success');
      // refresh stats
      api.getDashboardStats().then((st) => setStats(st)).catch(() => {});
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  const handleReservationStatus = async (id: string, status: string) => {
    try {
      const updated = await api.updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => (r._id === id ? updated : r)));
      showToast(`Reservation status updated to ${status}`, 'success');
    } catch {
      showToast('Failed to update reservation', 'error');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      setMenuItems((prev) => prev.map((i) => (i._id === item._id ? updated : i)));
      showToast(`${item.name} availability toggled`, 'success');
    } catch {
      showToast('Failed to update item availability', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from the menu?')) return;
    try {
      await api.deleteMenuItem(id);
      setMenuItems((prev) => prev.filter((i) => i._id !== id));
      showToast('Menu item removed', 'info');
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem || !editingMenuItem.name || !editingMenuItem.pricePaise) return;

    try {
      setIsSavingItem(true);
      if (editingMenuItem._id) {
        const updated = await api.updateMenuItem(editingMenuItem._id, editingMenuItem);
        setMenuItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
        showToast('Menu item updated successfully!', 'success');
      } else {
        const created = await api.createMenuItem(editingMenuItem);
        setMenuItems((prev) => [created, ...prev]);
        showToast('New menu item created!', 'success');
      }
      setEditingMenuItem(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save menu item', 'error');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleRestock = async (invId: string) => {
    const qtyStr = prompt('Enter restock quantity to add:');
    if (!qtyStr) return;
    const amount = parseFloat(qtyStr);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const updated = await api.restockItem(invId, amount);
      setInventory((prev) => prev.map((i) => (i._id === invId ? updated : i)));
      showToast(`Added ${amount} ${updated.unit} to stock`, 'success');
    } catch {
      showToast('Failed to restock item', 'error');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountValue) return;

    try {
      const created = await api.createCoupon({
        code: newCoupon.code.toUpperCase(),
        description: newCoupon.description || 'Special seasonal discount',
        discountType: newCoupon.discountType,
        discountValue:
          newCoupon.discountType === 'flat'
            ? newCoupon.discountValue * 100 // convert INR to paise
            : newCoupon.discountValue,
        minOrderValuePaise: newCoupon.minOrderValueInr * 100,
        isActive: true,
      });

      setCoupons((prev) => [created, ...prev]);
      setNewCoupon({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValueInr: 250,
      });
      showToast(`Coupon ${created.code} created successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create coupon', 'error');
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const updated = await api.toggleCoupon(id);
      setCoupons((prev) => prev.map((c) => (c._id === id ? updated : c)));
      showToast('Coupon status updated', 'success');
    } catch {
      showToast('Failed to toggle coupon', 'error');
    }
  };

  const handleReviewModeration = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const updated = await api.moderateReview(id, status);
      setReviews((prev) => prev.map((r) => (r._id === id ? updated : r)));
      showToast(`Review marked as ${status}`, 'success');
    } catch {
      showToast('Failed to moderate review', 'error');
    }
  };

  const handleConnectMongoAtlas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;

    try {
      setIsConnectingDb(true);
      const res = await api.connectMongoAtlas(mongoUriInput.trim());
      showToast(res.message, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to connect to MongoDB Atlas.', 'error');
    } finally {
      setIsConnectingDb(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8DFD5] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#291811] text-[#E5B26E] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-[#291811]">
                Brew Haven Management Portal
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm bg-[#EFE8DF] text-[#4A3528]">
                Staff Console
              </span>
            </div>
            <p className="text-xs text-[#8C6D58]">
              Logged in as <b className="text-[#291811]">{user?.name || 'Administrator'}</b> ({user?.role || 'admin'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* MongoDB Atlas Indicator Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E0D5C8] bg-white text-xs">
            <Database className="w-3.5 h-3.5 text-[#C87D32]" />
            <span className="text-[#5C4538]">Database:</span>
            <span className="font-semibold text-emerald-800">
              {stats?.dbStatus?.type === 'mongodb_atlas' ? 'MongoDB Atlas (Connected)' : 'Active Store'}
            </span>
          </div>

          <button
            onClick={loadAllData}
            className="p-2 text-[#5C4538] hover:text-[#291811] rounded-lg border border-[#E0D5C8] bg-white hover:bg-[#F2ECE4] cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            title="Sign out of staff portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#E8DFD5] text-xs font-medium">
        {[
          { id: 'analytics', label: 'Overview & KPIs' },
          { id: 'orders', label: 'Live Orders', count: orders.length },
          { id: 'menu', label: 'Menu Catalog', count: menuItems.length },
          { id: 'reservations', label: 'Reservations', count: reservations.length },
          { id: 'coupons', label: 'Coupons & Promos', count: coupons.length },
          { id: 'inventory', label: 'Inventory & Stock', count: inventory.length },
          { id: 'reviews', label: 'Reviews Moderation', count: reviews.length },
          { id: 'database', label: 'MongoDB Atlas Setup' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-[#291811] text-[#FAF7F2] font-semibold'
                : 'text-[#6B5547] hover:bg-[#EFE8DF] hover:text-[#291811]'
            }`}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS & KPIS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6D58]">
                Total Cafe Revenue
              </span>
              <div className="font-mono text-2xl font-bold text-[#291811] tabular-nums">
                ₹{(stats.totalRevenuePaise / 100).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-[#C87D32] block">
                Today: ₹{(stats.todayRevenuePaise / 100).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6D58]">
                Lifetime Orders
              </span>
              <div className="font-mono text-2xl font-bold text-[#291811] tabular-nums">
                {stats.totalOrdersCount}
              </div>
              <span className="text-[11px] text-[#8C6D58] block">
                Today: {stats.todayOrdersCount} orders placed
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6D58]">
                Active Reservations
              </span>
              <div className="font-mono text-2xl font-bold text-[#291811] tabular-nums">
                {stats.activeReservationsCount}
              </div>
              <span className="text-[11px] text-[#8C6D58] block">Tables booked & held</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6D58]">
                Low Stock Alerts
              </span>
              <div className="font-mono text-2xl font-bold text-rose-700 tabular-nums">
                {stats.lowStockCount}
              </div>
              <span className="text-[11px] text-[#8C6D58] block">Ingredients below threshold</span>
            </div>
          </div>

          {/* Breakdown & Bestsellers Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Bestselling Items */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
              <h3 className="font-serif text-base font-semibold text-[#291811]">
                Top Selling Beverages & Bakes
              </h3>
              <div className="space-y-3">
                {stats.topSellingItems.length === 0 ? (
                  <p className="text-xs text-[#8C6D58]">No sales records yet.</p>
                ) : (
                  stats.topSellingItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-[#F2ECE4]">
                      <div>
                        <span className="font-semibold text-[#291811] block">{item.name}</span>
                        <span className="text-[11px] text-[#8C6D58] font-mono">{item.count} orders fulfilled</span>
                      </div>
                      <span className="font-mono font-bold text-[#C87D32] tabular-nums">
                        ₹{(item.revenuePaise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Channel Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
              <h3 className="font-serif text-base font-semibold text-[#291811]">
                Order Channel Volume
              </h3>
              <div className="space-y-3 text-xs">
                {Object.entries(stats.orderTypeCounts).map(([type, count]) => (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="capitalize">{type}</span>
                      <span className="font-mono">{count} orders</span>
                    </div>
                    <div className="w-full bg-[#EFE8DF] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#291811] h-full"
                        style={{
                          width: `${
                            stats.totalOrdersCount > 0 ? (count / stats.totalOrdersCount) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8C6D58]">
            <span>Showing all {orders.length} kitchen tickets</span>
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord._id}
                className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F2ECE4]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#291811]">
                        #{ord.orderNumber}
                      </span>
                      <span className="capitalize font-semibold text-[#C87D32]">
                        {ord.orderType} {ord.tableNumber && `(${ord.tableNumber})`}
                      </span>
                      <span className="text-[#8C6D58]">· {ord.customerDetails?.name}</span>
                    </div>
                    <span className="text-[11px] text-[#8C6D58]">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {ord.paymentMethod}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[#8C6D58]">Status:</span>
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                      className="bg-[#FAF7F2] border border-[#E0D5C8] font-semibold text-xs py-1 px-2.5 rounded-lg text-[#291811]"
                    >
                      <option value="placed">Placed</option>
                      <option value="accepted">Accepted</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 text-[#5C4538]">
                  {ord.items.map((itm, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {itm.quantity}x <b>{itm.name}</b> ({[itm.size, itm.milk, ...(itm.toppings || [])].filter(Boolean).join(', ')})
                      </span>
                      <span className="font-mono font-medium">₹{(itm.subtotalPaise / 100).toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#F2ECE4] flex justify-between font-bold text-[#291811]">
                  <span>Total Amount</span>
                  <span className="font-mono text-[#C87D32] text-sm">
                    ₹{(ord.totalPaise / 100).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#8C6D58]">
              {menuItems.length} Products Active in Menu
            </span>
            <button
              onClick={() =>
                setEditingMenuItem({
                  name: '',
                  category: 'cat_hot_coffee',
                  categoryName: 'Espresso & Hot Coffee',
                  pricePaise: 25000,
                  description: '',
                  image: '/src/assets/images/coffee_pour_over_specialty_1792323909005.jpg',
                  isVeg: true,
                  isAvailable: true,
                  tags: ['Specialty'],
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Menu Product</span>
            </button>
          </div>

          {/* Edit / Create Form Modal */}
          {editingMenuItem && (
            <div className="p-6 bg-white rounded-2xl border border-[#E8DFD5] shadow-md space-y-4">
              <h3 className="font-serif text-base font-semibold text-[#291811]">
                {editingMenuItem._id ? 'Edit Menu Item' : 'Create New Menu Item'}
              </h3>
              <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-[#5C4538] block mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={editingMenuItem.name || ''}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                      className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#5C4538] block mb-1">Price (in INR)</label>
                    <input
                      type="number"
                      required
                      value={editingMenuItem.pricePaise ? editingMenuItem.pricePaise / 100 : ''}
                      onChange={(e) =>
                        setEditingMenuItem({
                          ...editingMenuItem,
                          pricePaise: Math.round(parseFloat(e.target.value) * 100),
                        })
                      }
                      className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#5C4538] block mb-1">Category</label>
                    <select
                      value={editingMenuItem.categoryName || 'Espresso & Hot Coffee'}
                      onChange={(e) =>
                        setEditingMenuItem({
                          ...editingMenuItem,
                          categoryName: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                    >
                      <option value="Espresso & Hot Coffee">Espresso & Hot Coffee</option>
                      <option value="Cold Brews & Iced Crafts">Cold Brews & Iced Crafts</option>
                      <option value="Single Origin & Manual Pour">Single Origin & Manual Pour</option>
                      <option value="Fresh Viennoiserie & Bakes">Fresh Viennoiserie & Bakes</option>
                      <option value="Gourmet Savory Bites">Gourmet Savory Bites</option>
                      <option value="Artisanal Infusions & Teas">Artisanal Infusions & Teas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#5C4538] block mb-1">Description & Tasting Notes</label>
                  <textarea
                    rows={2}
                    required
                    value={editingMenuItem.description || ''}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                    className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#5C4538] block mb-1">Image URL / Path</label>
                  <input
                    type="text"
                    required
                    value={editingMenuItem.image || ''}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image: e.target.value })}
                    className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                  />
                </div>

                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMenuItem.isVeg}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isVeg: e.target.checked })}
                      className="accent-[#291811]"
                    />
                    <span>Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMenuItem.isAvailable}
                      onChange={(e) =>
                        setEditingMenuItem({ ...editingMenuItem, isAvailable: e.target.checked })
                      }
                      className="accent-[#291811]"
                    />
                    <span>Available / In Stock</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMenuItem(null)}
                    className="px-4 py-2 border border-[#E0D5C8] text-[#5C4538] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingItem}
                    className="px-4 py-2 bg-[#291811] text-[#FAF7F2] font-semibold rounded-lg"
                  >
                    {isSavingItem ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Menu Items Table */}
          <div className="bg-white rounded-xl border border-[#E8DFD5] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E8DFD5] text-[#8C6D58] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {menuItems.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAF7F2]/50">
                    <td className="p-3 font-medium text-[#291811] flex items-center gap-2.5">
                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover" />
                      <span>{item.name}</span>
                    </td>
                    <td className="p-3 text-[#5C4538]">{item.categoryName}</td>
                    <td className="p-3 font-mono font-bold">₹{(item.pricePaise / 100).toFixed(0)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-2 py-0.5 rounded-sm font-semibold text-[10px] uppercase ${
                          item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.isAvailable ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setEditingMenuItem(item)}
                        className="text-[#5C4538] hover:text-[#291811] p-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RESERVATIONS & TABLES */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8C6D58]">
            <span>{reservations.length} Bookings Recorded</span>
          </div>

          <div className="space-y-3">
            {reservations.map((res) => (
              <div
                key={res._id}
                className="p-4 bg-white rounded-xl border border-[#E8DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#291811]">
                      {res.reservationCode}
                    </span>
                    <span className="font-semibold text-[#C87D32]">
                      Table {res.tableNumber || 'Auto'}
                    </span>
                    <span className="text-[#8C6D58]">· {res.customerName} ({res.customerPhone})</span>
                  </div>
                  <p className="text-[#5C4538] mt-0.5">
                    {res.date} at <b className="font-mono">{res.timeSlot}</b> · {res.guestCount} Guests · Area: {res.seatingArea}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#8C6D58]">Status:</span>
                  <select
                    value={res.status}
                    onChange={(e) => handleReservationStatus(res._id, e.target.value)}
                    className="bg-[#FAF7F2] border border-[#E0D5C8] font-semibold text-xs py-1 px-2.5 rounded-lg"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="seated">Seated</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Create Coupon Card */}
          <form onSubmit={handleCreateCoupon} className="p-5 bg-white rounded-xl border border-[#E8DFD5] space-y-3 text-xs">
            <h3 className="font-serif text-sm font-semibold text-[#291811]">Create New Discount Coupon</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-[#5C4538] block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON20"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 border border-[#E0D5C8] rounded-lg uppercase font-mono bg-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#5C4538] block mb-1">Discount Type</label>
                <select
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                  className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-[#5C4538] block mb-1">
                  Value ({newCoupon.discountType === 'percentage' ? '%' : '₹'})
                </label>
                <input
                  type="number"
                  required
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: parseInt(e.target.value, 10) })}
                  className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#5C4538] block mb-1">Min Order (₹)</label>
                <input
                  type="number"
                  value={newCoupon.minOrderValueInr}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValueInr: parseInt(e.target.value, 10) })}
                  className="w-full p-2 border border-[#E0D5C8] rounded-lg bg-[#FAF7F2]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#291811] text-[#FAF7F2] font-semibold rounded-lg"
            >
              Add Coupon
            </button>
          </form>

          {/* Existing Coupons List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {coupons.map((c) => (
              <div key={c._id} className="p-4 bg-white rounded-xl border border-[#E8DFD5] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm text-[#291811]">{c.code}</span>
                  <button
                    onClick={() => handleToggleCoupon(c._id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
                <p className="text-[#6B5547] text-[11px]">{c.description}</p>
                <div className="pt-2 border-t border-[#F2ECE4] text-[#8C6D58] flex justify-between">
                  <span>
                    {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `₹${c.discountValue / 100} Flat`}
                  </span>
                  <span>Used: {c.timesUsed} times</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: INVENTORY & STOCK */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8C6D58]">
            <span>{inventory.length} Ingredient Stocks Tracked</span>
          </div>

          <div className="bg-white rounded-xl border border-[#E8DFD5] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E8DFD5] text-[#8C6D58] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Min Threshold</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {inventory.map((inv) => (
                  <tr key={inv._id} className="hover:bg-[#FAF7F2]/50">
                    <td className="p-3 font-semibold text-[#291811]">{inv.ingredientName}</td>
                    <td className="p-3 uppercase text-[10px] text-[#8C6D58]">{inv.category}</td>
                    <td className="p-3 font-mono font-bold">
                      {inv.currentStock} {inv.unit}
                    </td>
                    <td className="p-3 font-mono text-[#8C6D58]">
                      {inv.minThreshold} {inv.unit}
                    </td>
                    <td className="p-3">
                      {inv.isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRestock(inv._id)}
                        className="px-2.5 py-1 bg-[#291811] text-[#FAF7F2] rounded text-[11px] font-medium hover:bg-[#3D251A]"
                      >
                        + Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8C6D58]">
            <span>{reviews.length} Customer Reviews Submitted</span>
          </div>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev._id} className="p-4 bg-white rounded-xl border border-[#E8DFD5] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-[#291811]">{rev.userName}</span>
                    <span className="text-[#8C6D58] ml-2 font-mono">({rev.rating}★)</span>
                    <span className="text-[#C87D32] ml-2 block sm:inline">Product: {rev.menuItemName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      rev.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
                <p className="text-[#5C4538] italic">"{rev.comment}"</p>
                <div className="flex gap-2 pt-1">
                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleReviewModeration(rev._id, 'approved')}
                      className="px-2.5 py-1 bg-emerald-800 text-white rounded text-[11px]"
                    >
                      Approve
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleReviewModeration(rev._id, 'rejected')}
                      className="px-2.5 py-1 border border-rose-300 text-rose-700 rounded text-[11px]"
                    >
                      Hide / Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: MONGODB ATLAS SETUP */}
      {activeTab === 'database' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-6 text-xs text-[#5C4538]">
          <div>
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              MongoDB Atlas Integration Status
            </h3>
            <p className="mt-1 leading-relaxed">
              Brew Haven uses Mongoose models to connect to MongoDB Atlas for persistent storage of
              all users, products, orders, tables, and reservations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex justify-between">
              <span>Database Engine:</span>
              <span className="font-bold text-[#291811] uppercase font-mono">
                {stats?.dbStatus?.type || 'Fallback / Local Store'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Configured URI:</span>
              <span className="font-mono text-[11px] text-[#8C6D58]">
                {stats?.dbStatus?.maskedUri || 'None specified in .env'}
              </span>
            </div>
          </div>

          {/* Connect form */}
          <form onSubmit={handleConnectMongoAtlas} className="space-y-3">
            <label className="font-semibold text-[#291811] block">
              Connect or Switch MongoDB Atlas Connection String
            </label>
            <input
              type="text"
              required
              value={mongoUriInput}
              onChange={(e) => setMongoUriInput(e.target.value)}
              placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/brewhaven?retryWrites=true&w=majority"
              className="w-full p-2.5 rounded-lg border border-[#E0D5C8] font-mono text-xs bg-[#FAF7F2]"
            />
            <p className="text-[11px] text-[#8C6D58]">
              Tip: Paste your MongoDB Atlas URI here to dynamically connect and seed your cloud cluster.
            </p>
            <button
              type="submit"
              disabled={isConnectingDb}
              className="px-5 py-2.5 bg-[#291811] text-[#FAF7F2] font-semibold rounded-lg flex items-center gap-2"
            >
              {isConnectingDb ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E5B26E]" />
                  <span>Connecting to MongoDB Atlas...</span>
                </>
              ) : (
                <span>Connect & Auto-Seed MongoDB Atlas</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
