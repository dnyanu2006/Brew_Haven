import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Order, Reservation, MenuItem } from '../types/index.ts';
import {
  User as UserIcon,
  Award,
  Clock,
  Calendar,
  Heart,
  LogOut,
  RotateCcw,
  ShoppingBag,
  MapPin,
  Check,
} from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const {
    user,
    setUser,
    logout,
    setCurrentView,
    navigateTo,
    addToCart,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'favorites' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.addresses?.[0]?.street || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    Promise.all([
      api.getUserOrders().catch(() => []),
      api.getUserReservations().catch(() => []),
      api.getMenuItems().catch(() => []),
    ])
      .then(([ords, resvs, allMenu]) => {
        setOrders(ords);
        setReservations(resvs);
        if (user.favorites && user.favorites.length > 0) {
          setFavoriteItems(allMenu.filter((m) => user.favorites?.includes(m._id)));
        }
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EFE8DF] flex items-center justify-center mx-auto text-[#8C6D58]">
          <UserIcon className="w-8 h-8 text-[#C87D32]" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#291811]">
          Sign in to your Brew Haven Account
        </h2>
        <p className="text-xs text-[#6B5547]">
          Access your member rewards, loyalty points, previous orders, and saved reservations.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigateTo('login')}
            className="px-6 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-semibold rounded-xl hover:bg-[#3D251A] transition-colors shadow-xs"
          >
            Sign In to Account
          </button>
          <button
            onClick={() => navigateTo('register')}
            className="px-6 py-2.5 bg-white border border-[#291811] text-[#291811] text-xs font-semibold rounded-xl hover:bg-[#291811] hover:text-[#FAF7F2] transition-colors"
          >
            Create New Account
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.updateProfile({
        name,
        phone,
        address: { street, city: 'Bengaluru', postalCode: '560038' },
      });
      setUser(res.user);
      showToast('Profile updated successfully.', 'success');
    } catch {
      showToast('Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = (order: Order) => {
    for (const item of order.items) {
      addToCart({
        id: `${item.menuItem}-${Date.now()}-${Math.random()}`,
        menuItemId: item.menuItem,
        name: item.name,
        image: item.image || '/src/assets/images/latte_art_caramel_macchiato_1792323909916.jpg',
        unitPricePaise: item.pricePaise,
        quantity: item.quantity,
        size: item.size,
        milk: item.milk,
        sugar: item.sugar,
        toppings: item.toppings || [],
        extras: item.extras || [],
        instructions: item.instructions,
        lineTotalPaise: item.subtotalPaise,
      });
    }
    showToast('Order items added to cart!', 'success');
    setCurrentView('menu');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">
      {/* Profile Header & Loyalty Balance Banner */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#291811] text-[#E5B26E] flex items-center justify-center font-serif text-2xl font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-[#291811]">{user.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#EFE8DF] text-[#4A3528]">
                {user.role} Member
              </span>
            </div>
            <p className="text-xs text-[#8C6D58] mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Loyalty Reward Metric Card */}
        <div className="flex items-center gap-4 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFD5]">
          <div className="w-10 h-10 rounded-lg bg-[#291811] text-[#E5B26E] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#8C6D58] uppercase tracking-wider block">
              Haven Points
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-bold text-[#291811] tabular-nums">
                {user.loyaltyPoints}
              </span>
              <span className="text-xs text-[#C87D32] font-medium">pts (Worth ₹{user.loyaltyPoints})</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-[#8C6D58] hover:text-rose-600 transition-colors self-start md:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex border-b border-[#E8DFD5] space-x-6 text-xs font-medium">
        {[
          { id: 'orders', label: 'Order History', count: orders.length },
          { id: 'reservations', label: 'Table Bookings', count: reservations.length },
          { id: 'favorites', label: 'Saved Favorites', count: favoriteItems.length },
          { id: 'settings', label: 'Profile Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#291811] text-[#291811] font-semibold'
                : 'border-transparent text-[#8C6D58] hover:text-[#291811]'
            }`}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E8DFD5] space-y-2">
              <p className="font-serif text-base font-medium text-[#291811]">No previous orders</p>
              <p className="text-xs text-[#8C6D58]">Your order history will appear here.</p>
              <button
                onClick={() => setCurrentView('menu')}
                className="mt-2 px-4 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord._id}
                className="p-5 bg-white rounded-2xl border border-[#E8DFD5] space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F2ECE4]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#291811]">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-[#EFE8DF] text-[#4A3528]">
                        {ord.orderType}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                        {ord.status}
                      </span>
                    </div>
                    <span className="text-xs text-[#8C6D58] mt-0.5 block">
                      {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#C87D32] tabular-nums">
                      ₹{(ord.totalPaise / 100).toFixed(0)}
                    </span>
                    <button
                      onClick={() => handleReorder(ord)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#E5B26E]" />
                      <span>Reorder</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5C4538]">
                  {ord.items.map((itm, i) => (
                    <div key={i} className="flex justify-between p-2 rounded-lg bg-[#FAF7F2]">
                      <div>
                        <span className="font-medium text-[#291811]">
                          {itm.quantity}x {itm.name}
                        </span>
                        <span className="block text-[10px] text-[#8C6D58]">
                          {[itm.size, itm.milk].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-[#291811]">
                        ₹{(itm.subtotalPaise / 100).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Reservations */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E8DFD5] space-y-2">
              <p className="font-serif text-base font-medium text-[#291811]">No reservations found</p>
              <button
                onClick={() => setCurrentView('reservations')}
                className="mt-2 px-4 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg"
              >
                Book a Table
              </button>
            </div>
          ) : (
            reservations.map((res) => (
              <div
                key={res._id}
                className="p-5 bg-white rounded-2xl border border-[#E8DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#291811]">
                      {res.reservationCode}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-stone-100 text-[#4A3528]">
                      {res.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C4538] mt-1">
                    {res.date} at <b className="font-mono">{res.timeSlot}</b> · {res.guestCount} Guests ·{' '}
                    <span className="capitalize">{res.seatingArea}</span> ({res.tableNumber || 'Assigned'})
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favoriteItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E8DFD5] space-y-2">
              <p className="font-serif text-base font-medium text-[#291811]">No favorite items yet</p>
              <p className="text-xs text-[#8C6D58]">
                Click the heart icon on any beverage or bakery card to bookmark it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {favoriteItems.map((item) => (
                <div key={item._id} className="p-4 bg-white rounded-xl border border-[#E8DFD5] space-y-3">
                  <h4 className="font-serif text-sm font-semibold text-[#291811]">{item.name}</h4>
                  <p className="text-xs text-[#8C6D58] line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE4]">
                    <span className="font-mono font-bold text-xs text-[#291811]">
                      ₹{(item.pricePaise / 100).toFixed(0)}
                    </span>
                    <button
                      onClick={() =>
                        addToCart({
                          id: `${item._id}-${Date.now()}`,
                          menuItemId: item._id,
                          name: item.name,
                          image: item.image,
                          unitPricePaise: item.pricePaise,
                          quantity: 1,
                          toppings: [],
                          extras: [],
                          lineTotalPaise: item.pricePaise,
                        })
                      }
                      className="px-3 py-1.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Profile Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateProfile} className="max-w-xl bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#291811]">Personal Details</h3>

          <div>
            <label className="text-xs font-semibold text-[#5C4538] block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5C4538] block mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5C4538] block mb-1">Default Delivery Street Address</label>
            <textarea
              rows={2}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="e.g. 42 Heritage Boulevard, Indiranagar"
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2]"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      )}
    </div>
  );
};
