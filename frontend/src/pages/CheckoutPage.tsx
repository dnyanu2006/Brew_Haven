import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  CreditCard,
  QrCode,
  Banknote,
  Tag,
  Gift,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartTotalPaise,
    clearCart,
    setCurrentView,
    navigateTo,
    setAuthMessage,
    setTrackingOrderNumber,
    user,
    showToast,
  } = useApp();

  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [tableNumber, setTableNumber] = useState('T-01');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.addresses?.[0]?.street || '');

  const [paymentMethod, setPaymentMethod] = useState<'test_upi' | 'cod' | 'test_card'>('test_upi');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!phone && user.phone) setPhone(user.phone);
      if (!email && user.email) setEmail(user.email);
      if (!address && user.addresses?.[0]?.street) setAddress(user.addresses[0].street);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#C87D32] flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-[#291811]">
            Sign In Required to Complete Purchase
          </h2>
          <p className="text-xs text-[#6B5547] leading-relaxed">
            Please sign in to your customer account to finalize your order, earn loyalty points, and track live barista updates.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setAuthMessage('Please sign in to continue with your purchase.');
              try {
                localStorage.setItem('brewhaven_pending_redirect', 'checkout');
              } catch (e) {}
              navigateTo('login');
            }}
            className="px-6 py-3 bg-[#291811] text-[#FAF7F2] text-xs font-semibold rounded-xl hover:bg-[#3D251A] transition-colors shadow-xs"
          >
            Sign In as Customer
          </button>
          <button
            onClick={() => navigateTo('cart')}
            className="px-5 py-2.5 border border-[#D9CEBF] text-[#291811] text-xs font-medium rounded-xl hover:bg-[#FAF7F2] transition-colors"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EFE8DF] flex items-center justify-center mx-auto text-[#8C6D58]">
          ☕
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#291811]">Your cart is empty</h2>
        <p className="text-xs text-[#6B5547]">
          Add your favorite specialty beverages and pastries before checking out.
        </p>
        <button
          onClick={() => setCurrentView('menu')}
          className="px-5 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg"
        >
          Explore Menu
        </button>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.validateCoupon(couponCode, cartTotalPaise);
      if (res.valid) {
        setAppliedCoupon({ code: res.code, discountPaise: res.discountPaise });
        showToast(`Coupon applied! -₹${res.discountPaise / 100}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid coupon', 'error');
    }
  };

  // Discount math
  const couponDiscountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const loyaltyDiscountPaise =
    useLoyaltyPoints && user
      ? Math.min(user.loyaltyPoints * 100, Math.max(0, cartTotalPaise - couponDiscountPaise))
      : 0;

  const totalDiscountPaise = couponDiscountPaise + loyaltyDiscountPaise;
  const deliveryFeePaise = orderType === 'delivery' ? 4000 : 0;
  const taxablePaise = Math.max(0, cartTotalPaise - totalDiscountPaise);
  const taxPaise = Math.round(taxablePaise * 0.05); // 5% GST
  const grandTotalPaise = taxablePaise + taxPaise + deliveryFeePaise;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone) {
      showToast('Please provide your name and contact phone number', 'error');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber) {
      showToast('Please specify a table number', 'error');
      return;
    }

    if (orderType === 'delivery' && !address) {
      showToast('Delivery address is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createOrder({
        customerDetails: {
          name,
          phone,
          email: email || 'guest@brewhaven.com',
          address: orderType === 'delivery' ? address : `Table ${tableNumber}, Brew Haven`,
        },
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        items: cart,
        couponCode: appliedCoupon?.code,
        useLoyaltyPoints,
        paymentMethod,
      });

      clearCart();
      setTrackingOrderNumber(res.order.orderNumber);
      showToast('Order confirmed! Sending ticket to barista station.', 'success');
      setCurrentView('tracking');
    } catch (err: any) {
      showToast(err.message || 'Failed to place order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#8C6D58]">
        <button
          onClick={() => setCurrentView('menu')}
          className="flex items-center gap-1 hover:text-[#291811]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Menu</span>
        </button>
        <span>/</span>
        <span className="text-[#291811] font-semibold">Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Checkout Details Form */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          {/* 1. Dining Mode */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              1. Choose Order Type
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'dine-in', label: 'Dine-In', icon: UtensilsCrossed, desc: 'Table service' },
                { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag, desc: 'Pickup counter' },
                { id: 'delivery', label: 'Delivery', icon: Truck, desc: 'Home delivery' },
              ].map((type) => {
                const Icon = type.icon;
                const isSelected = orderType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setOrderType(type.id as any)}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#291811] bg-[#291811] text-[#FAF7F2] shadow-xs'
                        : 'border-[#E0D5C8] bg-[#FAF7F2] text-[#5C4538] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1 text-[#E5B26E]" />
                    <span className="block font-semibold text-xs">{type.label}</span>
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        isSelected ? 'text-[#D4C3B3]' : 'text-[#8C6D58]'
                      }`}
                    >
                      {type.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Conditional fields based on order type */}
            {orderType === 'dine-in' && (
              <div className="pt-2">
                <label className="text-xs font-semibold text-[#5C4538] block mb-1">
                  Select Your Table Number
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTableNumber(t)}
                      className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border text-center transition-all ${
                        tableNumber === t
                          ? 'border-[#291811] bg-[#291811] text-[#FAF7F2]'
                          : 'border-[#E0D5C8] bg-[#FAF7F2] text-[#5C4538]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className="pt-2">
                <label className="text-xs font-semibold text-[#5C4538] block mb-1">
                  Delivery Address & Landmark
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment, building, street name, Indiranagar, Bengaluru..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
              </div>
            )}
          </div>

          {/* 2. Customer Contact */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              2. Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#5C4538] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5C4538] block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98111 22334"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5C4538] block mb-1">Email for Receipt</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              3. Payment Option
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'test_upi', label: 'Test UPI / QR', icon: QrCode, desc: 'Simulated UPI Intent' },
                { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay at Counter / Cash' },
                { id: 'test_card', label: 'Test Card', icon: CreditCard, desc: 'Simulated Payment' },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = paymentMethod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#291811] bg-white ring-2 ring-[#291811]'
                        : 'border-[#E0D5C8] bg-[#FAF7F2] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-[#C87D32] mb-1.5" />
                    <span className="block font-semibold text-xs text-[#291811]">{p.label}</span>
                    <span className="block text-[10px] text-[#8C6D58] mt-0.5">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#291811] text-[#FAF7F2] font-semibold text-xs sm:text-sm rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#E5B26E]" />
                <span>Creating Order in MongoDB...</span>
              </>
            ) : (
              <span>Confirm & Place Order · ₹{(grandTotalPaise / 100).toFixed(0)}</span>
            )}
          </button>
        </form>

        {/* Right Column: Order Summary & Coupon */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#291811]">
              Order Summary ({cart.length})
            </h3>

            {/* Itemized list */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs pb-2 border-b border-[#F2ECE4]">
                  <div>
                    <div className="font-semibold text-[#291811]">
                      {item.quantity}x {item.name}
                    </div>
                    <div className="text-[11px] text-[#8C6D58] space-x-1">
                      {item.size && <span>{item.size}</span>}
                      {item.milk && <span>· {item.milk}</span>}
                    </div>
                    {item.toppings.length > 0 && (
                      <div className="text-[10px] text-[#A66F43]">+ {item.toppings.join(', ')}</div>
                    )}
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#291811]">
                    ₹{(item.lineTotalPaise / 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Box */}
            <div className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code (e.g. FIRSTBREW)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#E0D5C8] font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A]"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Loyalty points toggle */}
            {user && user.loyaltyPoints > 0 && (
              <label className="flex items-center justify-between p-3 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] cursor-pointer">
                <div>
                  <span className="text-xs font-medium text-[#291811] block">Redeem Loyalty Points</span>
                  <span className="text-[11px] text-[#8C6D58]">
                    Balance: <b className="font-mono">{user.loyaltyPoints} pts</b> (save ₹{user.loyaltyPoints})
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={useLoyaltyPoints}
                  onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                  className="w-4 h-4 accent-[#291811] rounded cursor-pointer"
                />
              </label>
            )}

            {/* Calculations */}
            <div className="pt-3 border-t border-[#E8DFD5] space-y-2 text-xs text-[#5C4538]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono tabular-nums text-[#291811]">
                  ₹{(cartTotalPaise / 100).toFixed(0)}
                </span>
              </div>

              {couponDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span className="font-mono tabular-nums">-₹{(couponDiscountPaise / 100).toFixed(0)}</span>
                </div>
              )}

              {loyaltyDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Loyalty Redemption</span>
                  <span className="font-mono tabular-nums">-₹{(loyaltyDiscountPaise / 100).toFixed(0)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>5% F&B GST</span>
                <span className="font-mono tabular-nums text-[#291811]">
                  ₹{(taxPaise / 100).toFixed(0)}
                </span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-mono tabular-nums text-[#291811]">₹40</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#F2ECE4] flex justify-between text-sm font-semibold text-[#291811]">
                <span>Total Amount</span>
                <span className="font-mono text-base text-[#C87D32] tabular-nums">
                  ₹{(grandTotalPaise / 100).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
