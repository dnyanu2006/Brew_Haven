import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  Gift,
  Coffee,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    cart,
    cartTotalPaise,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    navigateTo,
    requestProceedToCheckout,
    user,
    showToast,
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
    description: string;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      showToast('Please enter a coupon code', 'info');
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await api.validateCoupon(couponInput, cartTotalPaise);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountPaise: res.discountPaise,
          description: res.description,
        });
        showToast(`Coupon ${res.code} applied! Saved ₹${res.discountPaise / 100}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid coupon code', 'error');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  // Calculations
  const couponDiscountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const maxLoyaltyDiscountPaise =
    useLoyaltyPoints && user
      ? Math.min(user.loyaltyPoints * 100, Math.max(0, cartTotalPaise - couponDiscountPaise))
      : 0;

  const totalDiscountPaise = couponDiscountPaise + maxLoyaltyDiscountPaise;
  const taxableAmountPaise = Math.max(0, cartTotalPaise - totalDiscountPaise);
  const gstTaxPaise = Math.round(taxableAmountPaise * 0.05); // 5% GST
  const grandTotalPaise = taxableAmountPaise + gstTaxPaise;

  const handleCheckout = () => {
    requestProceedToCheckout();
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-28 text-center">
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-10 sm:p-14 shadow-xs max-w-lg mx-auto space-y-5">
          <div className="w-20 h-20 rounded-full bg-[#FAF7F2] border border-[#E0D5C8] flex items-center justify-center mx-auto text-[#C87D32]">
            <Coffee className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87D32]">
              Your Cart
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#291811]">
              Your shopping bag is empty
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5547] leading-relaxed max-w-md mx-auto">
              You haven't added any specialty brews, single-origin pour overs, or fresh morning bakes
              yet. Explore our seasonal selection to find your cup.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigateTo('menu')}
              className="px-6 py-3 bg-[#291811] text-[#FAF7F2] text-xs font-semibold rounded-xl hover:bg-[#3D251A] transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-[#E5B26E]" />
              <span>Browse Artisanal Menu</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8DFD5]">
        <div>
          <button
            onClick={() => navigateTo('menu')}
            className="flex items-center gap-1.5 text-xs text-[#8C6D58] hover:text-[#291811] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#291811]">
            Your Shopping Bag
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5547] mt-1">
            Review your handcrafted selections, customized variants, and order summary.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to empty your shopping cart?')) {
              clearCart();
              showToast('Shopping cart emptied', 'info');
            }
          }}
          className="self-start sm:self-auto text-xs text-rose-700 hover:text-rose-900 font-medium px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Empty Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Itemized Cart List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8DFD5] divide-y divide-[#F2ECE4] overflow-hidden shadow-xs">
            {cart.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex gap-4 transition-colors hover:bg-[#FAF7F2]/40">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-[#F5EFEB] overflow-hidden shrink-0 border border-[#E8DFD5]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-sm sm:text-base font-semibold text-[#291811]">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#A89687] hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Customizations */}
                    <div className="text-xs text-[#8C6D58] mt-1 space-x-1.5 flex flex-wrap gap-y-1">
                      {item.size && <span className="font-medium text-[#5C4538]">{item.size}</span>}
                      {item.milk && <span>· {item.milk}</span>}
                      {item.sugar && <span>· {item.sugar}</span>}
                    </div>

                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-[11px] text-[#A66F43] mt-0.5">
                        Toppings: {item.toppings.join(', ')}
                      </p>
                    )}

                    {item.extras && item.extras.length > 0 && (
                      <p className="text-[11px] text-[#A66F43]">
                        Extras: {item.extras.join(', ')}
                      </p>
                    )}

                    {item.instructions && (
                      <p className="text-[11px] text-[#6B5547] italic mt-0.5">
                        Note: "{item.instructions}"
                      </p>
                    )}
                  </div>

                  {/* Price & Quantity Controls */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5EFEB]">
                    <div className="flex items-center border border-[#E0D5C8] rounded-lg bg-[#FAF7F2] px-1.5 py-1">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="p-1 text-[#5C4538] hover:text-[#291811] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-semibold tabular-nums text-[#291811]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="p-1 text-[#5C4538] hover:text-[#291811] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#8C6D58] block">Line Total</span>
                      <span className="font-mono text-sm sm:text-base font-bold text-[#291811] tabular-nums">
                        ₹{(item.lineTotalPaise / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-xs space-y-5">
            <h2 className="font-serif text-lg font-semibold text-[#291811]">
              Order Summary
            </h2>

            {/* Promo Coupon Section */}
            <div>
              <label className="text-xs font-semibold text-[#5C4538] flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5 text-[#C87D32]" />
                <span>Have a Promo Coupon?</span>
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-[#EFE8DF] rounded-xl text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#291811]">{appliedCoupon.code}</span>
                    <span className="text-[#8C6D58] block text-[11px]">{appliedCoupon.description}</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter FIRSTBREW or HAVEN50"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-[#E0D5C8] uppercase font-mono placeholder:normal-case placeholder:font-sans bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="px-4 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Loyalty Points Section (if customer logged in) */}
            {user && user.loyaltyPoints > 0 && (
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E0D5C8] bg-[#FAF7F2] cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Gift className="w-4 h-4 text-[#C87D32]" />
                  <div>
                    <span className="text-xs font-medium text-[#291811] block">
                      Redeem Haven Points
                    </span>
                    <span className="text-[11px] text-[#8C6D58]">
                      Balance: <b className="font-mono">{user.loyaltyPoints} pts</b> (Save ₹{user.loyaltyPoints})
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useLoyaltyPoints}
                  onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                  className="w-4 h-4 accent-[#291811] rounded cursor-pointer"
                />
              </label>
            )}

            {/* Bill Breakdown */}
            <div className="pt-3 border-t border-[#E8DFD5] space-y-2 text-xs text-[#5C4538]">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-mono tabular-nums text-[#291811]">
                  ₹{(cartTotalPaise / 100).toFixed(0)}
                </span>
              </div>

              {couponDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono tabular-nums">-₹{(couponDiscountPaise / 100).toFixed(0)}</span>
                </div>
              )}

              {maxLoyaltyDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Haven Loyalty Discount</span>
                  <span className="font-mono tabular-nums">
                    -₹{(maxLoyaltyDiscountPaise / 100).toFixed(0)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>5% F&B GST</span>
                <span className="font-mono tabular-nums text-[#291811]">
                  ₹{(gstTaxPaise / 100).toFixed(0)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#F2ECE4] flex justify-between items-baseline text-sm font-semibold text-[#291811]">
                <span>Grand Total</span>
                <span className="font-mono text-xl text-[#C87D32] tabular-nums font-bold">
                  ₹{(grandTotalPaise / 100).toFixed(0)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 bg-[#291811] text-[#FAF7F2] font-semibold text-xs sm:text-sm rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#E5B26E]" />
            </button>

            {!user && (
              <p className="text-[11px] text-[#8C6D58] text-center">
                * You will be prompted to sign in with your customer account before completing payment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
