import React, { useState } from 'react';
import { MenuItem, CartItem } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { Plus, Heart, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api.ts';

interface ProductCardProps {
  item: MenuItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { setCustomizingItem, user, setUser, showToast, requestAddToCart } = useApp();
  const [imageError, setImageError] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isFavorited = Boolean(user?.favorites?.includes(item._id));

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to save favorite items', 'info');
      return;
    }

    try {
      setIsLiking(true);
      const res = await api.toggleFavorite(item._id);
      setUser((prev) => (prev ? { ...prev, favorites: res.favorites } : null));
      showToast(isFavorited ? 'Removed from favorites' : 'Added to favorites', 'success');
    } catch {
      showToast('Failed to update favorites', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const formattedPrice = (item.pricePaise / 100).toFixed(0);

  // Check if item supports customizations
  const hasCustomizations = Boolean(
    (item.customizationOptions?.sizes && item.customizationOptions.sizes.length > 0) ||
    (item.customizationOptions?.milkOptions && item.customizationOptions.milkOptions.length > 0) ||
    (item.customizationOptions?.toppings && item.customizationOptions.toppings.length > 0) ||
    (item.customizationOptions?.extras && item.customizationOptions.extras.length > 0)
  );

  // Handle direct "Add to Cart"
  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!item.isAvailable) {
      showToast(`${item.name} is currently out of stock`, 'error');
      return;
    }

    // Determine default options
    const defaultSize = item.customizationOptions?.sizes?.[0]?.name;
    const defaultMilk =
      item.customizationOptions?.milkOptions?.find((m) => m.isDefault)?.name ||
      item.customizationOptions?.milkOptions?.[0]?.name;
    const defaultSugar = item.customizationOptions?.sugarLevels?.[0]?.label;

    const cartItem: CartItem = {
      id: `${item._id}-${Date.now()}`,
      menuItemId: item._id,
      name: item.name,
      image: item.image,
      unitPricePaise: item.pricePaise,
      quantity: 1,
      size: defaultSize,
      milk: defaultMilk,
      sugar: defaultSugar,
      toppings: [],
      extras: [],
      lineTotalPaise: item.pricePaise,
    };

    requestAddToCart(cartItem);
  };

  return (
    <div
      onClick={() => {
        if (hasCustomizations) {
          setCustomizingItem(item);
        }
      }}
      className="group bg-[#FFFFFF] rounded-xl border border-[#EBE4DC] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
    >
      {/* Image Container with Fallback */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFEB]">
        {!imageError && item.image ? (
          <img
            src={item.image}
            alt={item.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F5EFEB] to-[#EAE0D5] text-[#5C4538]">
            <span className="font-serif text-lg font-medium text-[#291811]">{item.name}</span>
            <span className="text-xs text-[#8C6D58] mt-1">{item.categoryName}</span>
          </div>
        )}

        {/* Favorite Icon Button */}
        <button
          onClick={handleFavorite}
          disabled={isLiking}
          aria-label="Add to favorites"
          className="absolute top-3 right-3 p-2 rounded-full bg-[#FAF7F2]/90 backdrop-blur-xs text-[#5C4538] hover:text-[#C87D32] transition-colors shadow-xs"
        >
          <Heart
            className={`w-4 h-4 ${isFavorited ? 'fill-[#C87D32] text-[#C87D32]' : 'text-[#5C4538]'}`}
          />
        </button>

        {/* Bestseller or Sold Out Badge */}
        {!item.isAvailable ? (
          <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-[#FAF7F2] text-[11px] font-medium tracking-wide px-2.5 py-0.5 rounded-sm">
            Sold Out
          </div>
        ) : item.isBestseller ? (
          <div className="absolute top-3 left-3 bg-[#291811]/90 backdrop-blur-xs text-[#FAF7F2] text-[11px] font-medium tracking-wide px-2.5 py-0.5 rounded-sm">
            Bestseller
          </div>
        ) : null}
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-xs text-[#8C6D58] mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[11px] text-[#A66F43]">
              {item.categoryName || 'Specialty'}
            </span>
            <span aria-hidden="true">·</span>
            {/* Veg / Non-veg marker */}
            <div className="flex items-center gap-1">
              <span
                className={`w-2.5 h-2.5 border rounded-xs flex items-center justify-center ${
                  item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
              <span className="text-[11px]">{item.isVeg ? 'Veg' : 'Non-veg'}</span>
            </div>
            {item.calories && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-mono text-[11px]">{item.calories} kcal</span>
              </>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-base font-semibold text-[#291811] group-hover:text-[#C87D32] transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Product Description */}
          <p className="text-xs text-[#6B5547] mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Footer Row: Price & Buttons */}
        <div className="pt-4 mt-3 border-t border-[#F2ECE4] flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-[#8C6D58] block leading-none mb-0.5">Price</span>
            <span className="font-mono text-base font-semibold text-[#291811] tabular-nums">
              ₹{formattedPrice}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Customize button (if custom options available) */}
            {hasCustomizations && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomizingItem(item);
                }}
                className="px-2.5 py-1.5 border border-[#D9CEBF] bg-[#FAF7F2] text-[#291811] hover:bg-[#F2ECE4] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                title="Customize size, milk & toppings"
              >
                Customize
              </button>
            )}

            {/* Prominent Add to Cart Button */}
            <button
              type="button"
              disabled={!item.isAvailable}
              onClick={handleQuickAddToCart}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title={item.isAvailable ? 'Add to shopping cart' : 'Out of stock'}
            >
              <Plus className="w-3.5 h-3.5 text-[#E5B26E]" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
