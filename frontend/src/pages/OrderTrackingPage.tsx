import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Order } from '../types/index.ts';
import {
  Search,
  CheckCircle2,
  Clock,
  Coffee,
  Check,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Received at cafe terminal' },
  { key: 'accepted', label: 'Accepted', desc: 'Barista confirmed ticket' },
  { key: 'preparing', label: 'Crafting', desc: 'Grinding, pulling & frothing' },
  { key: 'ready', label: 'Ready', desc: 'At counter or for courier' },
  { key: 'completed', label: 'Enjoyed', desc: 'Order fulfilled' },
];

export const OrderTrackingPage: React.FC = () => {
  const { trackingOrderNumber, setTrackingOrderNumber, addToCart, setCurrentView, showToast } =
    useApp();

  const [inputOrderNumber, setInputOrderNumber] = useState(trackingOrderNumber || 'BH-1001');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = async (orderNum: string) => {
    if (!orderNum.trim()) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.getOrder(orderNum.trim());
      setOrder(res);
      setTrackingOrderNumber(res.orderNumber);
    } catch (err: any) {
      setErrorMsg(err.message || 'Order not found. Please check order number.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trackingOrderNumber) {
      fetchOrder(trackingOrderNumber);
    } else {
      fetchOrder('BH-1001');
    }
  }, [trackingOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(inputOrderNumber);
  };

  const getStepIndex = (status: string) => {
    if (status === 'out_for_delivery') return 3;
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const handleAdvanceStatus = async () => {
    if (!order) return;
    const currentIdx = getStepIndex(order.status);
    const nextIdx = Math.min(STATUS_STEPS.length - 1, currentIdx + 1);
    const nextStatus = STATUS_STEPS[nextIdx].key;

    try {
      const updated = await api.updateOrderStatus(order._id, nextStatus, 'Barista status update');
      setOrder(updated);
      showToast(`Status updated to ${nextStatus}`, 'success');
    } catch (err: any) {
      showToast('Could not advance status', 'error');
    }
  };

  const handleReorder = () => {
    if (!order) return;
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
    showToast('Items added to cart!', 'success');
    setCurrentView('menu');
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">
      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C87D32] block mb-1">
            Real-time Kitchen Terminal
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#291811]">
            Live Order Tracker
          </h1>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
            <input
              type="text"
              value={inputOrderNumber}
              onChange={(e) => setInputOrderNumber(e.target.value.toUpperCase())}
              placeholder="Enter Order # e.g. BH-1001"
              className="w-full text-xs font-mono uppercase pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Track</span>}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {order && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-6 sm:p-8 space-y-8 shadow-xs">
          {/* Top Order Badge Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8DFD5] gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-mono text-xl font-bold text-[#291811]">
                  Order #{order.orderNumber}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-sm bg-[#EFE8DF] font-semibold text-[#291811] uppercase tracking-wider">
                  {order.orderType}
                </span>
              </div>
              <p className="text-xs text-[#8C6D58] mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Quick Demo Simulator Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleAdvanceStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E0D5C8] text-xs font-medium text-[#291811] hover:bg-[#F2ECE4] transition-colors"
                title="Advance to next status to simulate barista workflow"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#C87D32]" />
                <span>Simulate Next Step</span>
              </button>
            </div>
          </div>

          {/* Stepper Visual Timeline */}
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 relative">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#C87D32] text-white ring-4 ring-[#EFE8DF]'
                          : isPassed
                          ? 'bg-[#291811] text-[#FAF7F2]'
                          : 'bg-[#F2ECE4] text-[#A89687]'
                      }`}
                    >
                      {isPassed && !isCurrent ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <span
                        className={`block text-xs font-semibold ${
                          isPassed ? 'text-[#291811]' : 'text-[#8C6D58]'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="hidden sm:block text-[10px] text-[#8C6D58] mt-0.5 leading-tight">
                        {step.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E8DFD5]">
            {/* Left: Customer & Delivery Info */}
            <div className="space-y-3 text-xs text-[#5C4538]">
              <h4 className="font-serif text-sm font-semibold text-[#291811]">Service Details</h4>
              <p>
                <span className="text-[#8C6D58] block">Customer:</span>
                <span className="font-semibold text-[#291811]">{order.customerDetails?.name}</span> (
                {order.customerDetails?.phone})
              </p>
              {order.orderType === 'dine-in' && (
                <p>
                  <span className="text-[#8C6D58] block">Dining Table:</span>
                  <span className="font-mono font-bold text-[#291811]">
                    {order.tableNumber || 'Table Assigned'}
                  </span>
                </p>
              )}
              {order.orderType === 'delivery' && (
                <p>
                  <span className="text-[#8C6D58] block">Delivery Location:</span>
                  <span className="text-[#291811]">{order.customerDetails?.address}</span>
                </p>
              )}
              <p>
                <span className="text-[#8C6D58] block">Payment:</span>
                <span className="capitalize font-mono text-[#291811]">
                  {order.paymentMethod.replace('_', ' ')} · {order.paymentStatus}
                </span>
              </p>
            </div>

            {/* Right: Items Receipt */}
            <div className="space-y-3 text-xs">
              <h4 className="font-serif text-sm font-semibold text-[#291811]">Itemized Bill</h4>
              <div className="space-y-2">
                {order.items.map((itm, i) => (
                  <div key={i} className="flex justify-between items-start text-[#5C4538]">
                    <div>
                      <span className="font-medium text-[#291811]">
                        {itm.quantity}x {itm.name}
                      </span>
                      <span className="text-[11px] text-[#8C6D58] block">
                        {[itm.size, itm.milk, ...(itm.toppings || [])].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-[#291811]">
                      ₹{(itm.subtotalPaise / 100).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F2ECE4] space-y-1 text-[#8C6D58]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">₹{(order.subtotalPaise / 100).toFixed(0)}</span>
                </div>
                {order.discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">-₹{(order.discountPaise / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-mono tabular-nums">₹{(order.taxPaise / 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#291811] pt-1 border-t border-[#E8DFD5]">
                  <span>Total Paid</span>
                  <span className="font-mono text-[#C87D32]">₹{(order.totalPaise / 100).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reorder Button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleReorder}
              className="px-4 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#E5B26E]" />
              <span>Order These Items Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
