import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { CartItem } from '../types/index.ts';

export const CustomizationModal: React.FC = () => {
  const {
    customizingItem,
    setCustomizingItem,
    requestAddToCart,
    user,
    addToCart,
    navigateTo,
    setAuthMessage,
  } = useApp();

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedMilk, setSelectedMilk] = useState<string>('');
  const [selectedSugar, setSelectedSugar] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Initialize defaults whenever customizingItem changes
  useEffect(() => {
    if (customizingItem) {
      const opts = customizingItem.customizationOptions;
      if (opts?.sizes && opts.sizes.length > 0) {
        setSelectedSize(opts.sizes[0].name);
      } else {
        setSelectedSize('');
      }

      if (opts?.milkOptions && opts.milkOptions.length > 0) {
        const defMilk = opts.milkOptions.find((m) => m.isDefault) || opts.milkOptions[0];
        setSelectedMilk(defMilk.name);
      } else {
        setSelectedMilk('');
      }

      if (opts?.sugarLevels && opts.sugarLevels.length > 0) {
        setSelectedSugar(opts.sugarLevels[Math.floor(opts.sugarLevels.length / 2)].label);
      } else {
        setSelectedSugar('');
      }

      setSelectedToppings([]);
      setSelectedExtras([]);
      setInstructions('');
      setQuantity(1);
    }
  }, [customizingItem]);

  if (!customizingItem) return null;

  const opts = customizingItem.customizationOptions;

  // Calculate live item unit price in paise
  let unitPricePaise = customizingItem.pricePaise;

  if (selectedSize && opts?.sizes) {
    const sizeObj = opts.sizes.find((s) => s.name === selectedSize);
    if (sizeObj) unitPricePaise += sizeObj.priceDeltaPaise;
  }

  if (selectedMilk && opts?.milkOptions) {
    const milkObj = opts.milkOptions.find((m) => m.name === selectedMilk);
    if (milkObj) unitPricePaise += milkObj.priceDeltaPaise;
  }

  if (selectedToppings.length > 0 && opts?.toppings) {
    for (const tName of selectedToppings) {
      const topObj = opts.toppings.find((t) => t.name === tName);
      if (topObj) unitPricePaise += topObj.priceDeltaPaise;
    }
  }

  if (selectedExtras.length > 0 && opts?.extras) {
    for (const eName of selectedExtras) {
      const extObj = opts.extras.find((e) => e.name === eName);
      if (extObj) unitPricePaise += extObj.priceDeltaPaise;
    }
  }

  const lineTotalPaise = unitPricePaise * quantity;

  const toggleTopping = (name: string) => {
    setSelectedToppings((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const toggleExtra = (name: string) => {
    setSelectedExtras((prev) =>
      prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]
    );
  };

  const buildCartItem = (): CartItem => ({
    id: `${customizingItem._id}-${Date.now()}`,
    menuItemId: customizingItem._id,
    name: customizingItem.name,
    image: customizingItem.image,
    unitPricePaise,
    quantity,
    size: selectedSize || undefined,
    milk: selectedMilk || undefined,
    sugar: selectedSugar || undefined,
    toppings: selectedToppings,
    extras: selectedExtras,
    instructions: instructions.trim() || undefined,
    lineTotalPaise,
  });

  const handleAddToCart = () => {
    const cartLine = buildCartItem();
    requestAddToCart(cartLine);
    setCustomizingItem(null);
  };

  const handleBuyNow = () => {
    const cartLine = buildCartItem();
    setCustomizingItem(null);

    if (user) {
      addToCart(cartLine);
      navigateTo('checkout');
    } else {
      try {
        localStorage.setItem('brewhaven_pending_cart_item', JSON.stringify(cartLine));
        localStorage.setItem('brewhaven_pending_redirect', 'checkout');
      } catch (err) {
        console.error('Error saving pending cart item:', err);
      }
      setAuthMessage('Please sign in to continue with your purchase.');
      navigateTo('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-[#FAF7F2] rounded-2xl shadow-xl border border-[#E8DFD5] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E8DFD5] flex items-center justify-between bg-white shrink-0">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#C87D32]">
              {customizingItem.categoryName || 'Beverage'}
            </span>
            <h2 className="font-serif text-xl font-semibold text-[#291811]">
              {customizingItem.name}
            </h2>
          </div>
          <button
            onClick={() => setCustomizingItem(null)}
            className="p-2 text-[#8C6D58] hover:text-[#291811] rounded-lg hover:bg-[#F2ECE4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#291811]">
          {/* Item Description */}
          <p className="text-xs text-[#5C4538] leading-relaxed">
            {customizingItem.description}
          </p>

          {/* 1. Size Selection */}
          {opts?.sizes && opts.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="font-semibold text-xs uppercase tracking-wider text-[#5C4538]">
                  Select Serving Size
                </label>
                <span className="text-xs text-[#8C6D58]">Required</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {opts.sizes.map((s) => {
                  const isSelected = selectedSize === s.name;
                  const deltaInr = s.priceDeltaPaise > 0 ? `+₹${s.priceDeltaPaise / 100}` : 'Standard';
                  return (
                    <button
                      type="button"
                      key={s.name}
                      onClick={() => setSelectedSize(s.name)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-[#291811] bg-white ring-1 ring-[#291811] shadow-xs'
                          : 'border-[#E0D5C8] bg-[#F5EFEB] hover:bg-[#EFE7DE]'
                      }`}
                    >
                      <span className="block font-medium text-xs text-[#291811]">{s.name}</span>
                      <span className="block text-[11px] font-mono text-[#8C6D58] mt-0.5">
                        {deltaInr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Milk Options */}
          {opts?.milkOptions && opts.milkOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="font-semibold text-xs uppercase tracking-wider text-[#5C4538]">
                  Choice of Milk
                </label>
                <span className="text-xs text-[#8C6D58]">Customizable</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {opts.milkOptions.map((m) => {
                  const isSelected = selectedMilk === m.name;
                  const delta = m.priceDeltaPaise > 0 ? `+₹${m.priceDeltaPaise / 100}` : 'Included';
                  return (
                    <button
                      type="button"
                      key={m.name}
                      onClick={() => setSelectedMilk(m.name)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-[#291811] bg-white ring-1 ring-[#291811] shadow-xs'
                          : 'border-[#E0D5C8] bg-[#F5EFEB] hover:bg-[#EFE7DE]'
                      }`}
                    >
                      <span className="block font-medium text-xs text-[#291811]">{m.name}</span>
                      <span className="block text-[11px] font-mono text-[#8C6D58] mt-0.5">{delta}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Sugar Level */}
          {opts?.sugarLevels && opts.sugarLevels.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="font-semibold text-xs uppercase tracking-wider text-[#5C4538]">
                  Sweetness Intensity
                </label>
                <span className="text-xs text-[#8C6D58]">{selectedSugar || 'Default'}</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-[#EBE2D8] rounded-lg overflow-x-auto">
                {opts.sugarLevels.map((lvl) => {
                  const isSelected = selectedSugar === lvl.label;
                  return (
                    <button
                      type="button"
                      key={lvl.label}
                      onClick={() => setSelectedSugar(lvl.label)}
                      className={`flex-1 min-w-[70px] py-1.5 px-2 text-center text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-white text-[#291811] shadow-xs font-semibold'
                          : 'text-[#6B5547] hover:text-[#291811]'
                      }`}
                    >
                      {lvl.percentage}%
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Toppings */}
          {opts?.toppings && opts.toppings.length > 0 && (
            <div>
              <label className="font-semibold text-xs uppercase tracking-wider text-[#5C4538] block mb-2.5">
                Artisanal Toppings
              </label>
              <div className="space-y-2">
                {opts.toppings.map((t) => {
                  const isChecked = selectedToppings.includes(t.name);
                  return (
                    <label
                      key={t.name}
                      onClick={() => toggleTopping(t.name)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#E0D5C8] bg-white cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-[#291811] border-[#291811] text-white' : 'border-[#B8A494]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-medium text-[#291811]">{t.name}</span>
                      </div>
                      <span className="font-mono text-xs text-[#8C6D58] tabular-nums">
                        +₹{t.priceDeltaPaise / 100}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Extras */}
          {opts?.extras && opts.extras.length > 0 && (
            <div>
              <label className="font-semibold text-xs uppercase tracking-wider text-[#5C4538] block mb-2.5">
                Barista Extras & Add-ons
              </label>
              <div className="space-y-2">
                {opts.extras.map((e) => {
                  const isChecked = selectedExtras.includes(e.name);
                  return (
                    <label
                      key={e.name}
                      onClick={() => toggleExtra(e.name)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#E0D5C8] bg-white cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-[#291811] border-[#291811] text-white' : 'border-[#B8A494]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-medium text-[#291811]">{e.name}</span>
                      </div>
                      <span className="font-mono text-xs text-[#8C6D58] tabular-nums">
                        +₹{e.priceDeltaPaise / 100}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Special Instructions */}
          <div>
            <label className="font-semibold text-xs uppercase tracking-wider text-[#5C4538] block mb-1.5">
              Special Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Extra hot, milk on the side, allergies..."
              rows={2}
              className="w-full text-xs p-3 rounded-lg border border-[#E0D5C8] bg-white text-[#291811] placeholder:text-[#A89687] focus:outline-none focus:ring-1 focus:ring-[#291811]"
            />
          </div>
        </div>

        {/* Modal Sticky Bottom Bar */}
        <div className="p-4 border-t border-[#E8DFD5] bg-white flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-[#E0D5C8] rounded-lg bg-[#FAF7F2] p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1.5 text-[#5C4538] hover:text-[#291811] disabled:opacity-30"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-mono font-medium text-xs text-[#291811] tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1.5 text-[#5C4538] hover:text-[#291811]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 px-3 sm:px-4 bg-[#FAF7F2] text-[#291811] border border-[#291811] font-semibold text-xs rounded-xl hover:bg-[#EFE8DF] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Add to Cart</span>
              <span className="font-mono tabular-nums text-xs font-bold text-[#C87D32]">
                (₹{(lineTotalPaise / 100).toFixed(0)})
              </span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 px-3 sm:px-4 bg-[#291811] text-[#FAF7F2] font-semibold text-xs rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Buy Now</span>
              <span className="font-mono tabular-nums text-xs font-bold text-[#E5B26E]">
                ₹{(lineTotalPaise / 100).toFixed(0)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
