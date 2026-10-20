import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, Trash2, Plus, Minus, ArrowRight, Tag, Gift, Check } from 'lucide-react';
import { api } from '../services/api.ts';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartTotalPaise,
    user,
    requestProceedToCheckout,
    setCurrentView,
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

  if (!isCartOpen) return null;

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

  // Max loyalty discount: 1 point = ₹1 = 100 paise
  const maxLoyaltyDiscountPaise =
    useLoyaltyPoints && user
      ? Math.min(user.loyaltyPoints * 100, Math.max(0, cartTotalPaise - couponDiscountPaise))
      : 0;

  const totalDiscountPaise = couponDiscountPaise + maxLoyaltyDiscountPaise;
  const taxableAmountPaise = Math.max(0, cartTotalPaise - totalDiscountPaise);
  const gstTaxPaise = Math.round(taxableAmountPaise * 0.05); // 5% GST
  const grandTotalPaise = taxableAmountPaise + gstTaxPaise;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    requestProceedToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#E8DFD5]">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E8DFD5] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-semibold text-[#291811]">Your Cafe Order</h2>
            <span className="text-xs text-[#8C6D58] font-mono tabular-nums">
              ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-[#8C6D58] hover:text-[#291811] rounded-lg hover:bg-[#F2ECE4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#5C4538]">
              <div className="w-16 h-16 rounded-full bg-[#EFE8DF] flex items-center justify-center mb-4 text-[#8C6D58]">
                ☕
              </div>
              <h3 className="font-serif text-lg font-medium text-[#291811]">Your cart is empty</h3>
              <p className="text-xs text-[#6B5547] mt-1 max-w-[240px]">
                Explore our single-origin roasts, signature drinks, and fresh baked pastries.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setCurrentView('menu');
                }}
                className="mt-5 px-4 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
              >
                Browse Artisanal Menu
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-[#E8DFD5] flex gap-3 transition-all"
              >
                {/* Item Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-[#F5EFEB] overflow-hidden shrink-0">
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
                      <h4 className="font-serif text-xs font-semibold text-[#291811] line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#B59E8C] hover:text-rose-600 transition-colors p-0.5"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Customization Details Chips */}
                    <div className="text-[11px] text-[#8C6D58] mt-1 space-x-1.5 line-clamp-1">
                      {item.size && <span>{item.size}</span>}
                      {item.milk && <span>· {item.milk}</span>}
                      {item.sugar && <span>· {item.sugar}</span>}
                    </div>

                    {item.toppings.length > 0 && (
                      <p className="text-[10px] text-[#A66F43] truncate">
                        + {item.toppings.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Quantity and Price Row */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#FAF7F2]">
                    <div className="flex items-center border border-[#E0D5C8] rounded-md bg-[#FAF7F2] px-1 py-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="p-1 text-[#5C4538] hover:text-[#291811]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono tabular-nums text-[#291811]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="p-1 text-[#5C4538] hover:text-[#291811]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono text-xs font-semibold text-[#291811] tabular-nums">
                      ₹{(item.lineTotalPaise / 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Coupon Code & Loyalty Section */}
          {cart.length > 0 && (
            <div className="space-y-3 pt-2">
              {/* Coupon Box */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DFD5]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C4538] mb-2">
                  <Tag className="w-3.5 h-3.5 text-[#C87D32]" />
                  <span>Promo Code</span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 bg-[#EFE8DF] rounded-lg text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#291811]">{appliedCoupon.code}</span>
                      <span className="text-[#8C6D58] block text-[11px]">{appliedCoupon.description}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Try 'FIRSTBREW' or 'HAVEN50'"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#E0D5C8] uppercase font-mono placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-[#291811]"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                      className="px-3 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Loyalty Points Redemption (if logged in and has points) */}
              {user && user.loyaltyPoints > 0 && (
                <div className="p-3 bg-white rounded-xl border border-[#E8DFD5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#C87D32]" />
                    <div>
                      <span className="text-xs font-medium text-[#291811] block">Redeem Loyalty Points</span>
                      <span className="text-[11px] text-[#8C6D58]">
                        Available: <b className="font-mono">{user.loyaltyPoints} pts</b> (worth ₹{user.loyaltyPoints})
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useLoyaltyPoints}
                    onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                    className="w-4 h-4 accent-[#291811] rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bill Breakdown & Checkout Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#E8DFD5] bg-white shrink-0 space-y-2.5">
            <div className="space-y-1.5 text-xs text-[#5C4538]">
              <div className="flex justify-between">
                <span>Subtotal</span>
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
                  <span>Loyalty Points Discount</span>
                  <span className="font-mono tabular-nums">
                    -₹{(maxLoyaltyDiscountPaise / 100).toFixed(0)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>GST (5% F&B Tax)</span>
                <span className="font-mono tabular-nums text-[#291811]">
                  ₹{(gstTaxPaise / 100).toFixed(0)}
                </span>
              </div>

              <div className="pt-2 border-t border-[#F2ECE4] flex justify-between text-sm font-semibold text-[#291811]">
                <span>To Pay</span>
                <span className="font-mono tabular-nums text-base text-[#C87D32]">
                  ₹{(grandTotalPaise / 100).toFixed(0)}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full mt-3 py-3 px-4 bg-[#291811] text-[#FAF7F2] font-medium text-xs rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#E5B26E]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
