import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { MenuItem, Category } from '../types/index.ts';
import { api } from '../services/api.ts';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';

export const MenuPage: React.FC = () => {
  const { selectedCategorySlug, setSelectedCategorySlug, setIsAiDrawerOpen } = useApp();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortOption, setSortOption] = useState('bestseller');

  useEffect(() => {
    api
      .getCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api
      .getMenuItems({
        category: selectedCategorySlug === 'all' ? undefined : selectedCategorySlug,
        search: search.trim() || undefined,
        vegOnly: vegOnly || undefined,
        availableOnly: availableOnly || undefined,
        sort: sortOption,
      })
      .then((items) => setMenuItems(items))
      .catch((err) => console.error('Failed to load menu items:', err))
      .finally(() => setIsLoading(false));
  }, [selectedCategorySlug, search, vegOnly, availableOnly, sortOption]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategorySlug('all');
    setVegOnly(false);
    setAvailableOnly(false);
    setSortOption('bestseller');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8DFD5] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C87D32] block mb-1">
            Artisanal Provisions
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#291811]">
            The Seasonal Cafe Menu
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5547] mt-1 max-w-xl">
            Sustainably harvested micro-lots, precision espresso crafts, and all-butter viennoiserie
            baked freshly in small batches.
          </p>
        </div>

        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] text-[#291811] border border-[#E0D5C8] rounded-xl hover:bg-[#F2ECE4] text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-4 h-4 text-[#C87D32]" />
          <span>Sommelier Taste Finder</span>
        </button>
      </div>

      {/* Category Segmented Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategorySlug('all')}
          className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
            selectedCategorySlug === 'all'
              ? 'bg-[#291811] text-[#FAF7F2] shadow-xs font-semibold'
              : 'bg-white border border-[#E0D5C8] text-[#5C4538] hover:bg-[#F5EFEB]'
          }`}
        >
          All Items
        </button>

        {categories.map((cat) => (
          <button
            type="button"
            key={cat._id}
            onClick={() => setSelectedCategorySlug(cat.slug)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              selectedCategorySlug === cat.slug
                ? 'bg-[#291811] text-[#FAF7F2] shadow-xs font-semibold'
                : 'bg-white border border-[#E0D5C8] text-[#5C4538] hover:bg-[#F5EFEB]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search, Veg Filter, and Sort Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8DFD5]">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search espresso, pour over, croissant, notes..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] text-[#291811] placeholder:text-[#A89687] focus:outline-none focus:ring-1 focus:ring-[#291811]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-[#A89687] hover:text-[#291811]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggles & Sorting */}
        <div className="flex items-center gap-3 overflow-x-auto text-xs">
          {/* Veg Only Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-[#5C4538] hover:text-[#291811]">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#291811] rounded cursor-pointer"
            />
            <span className="font-medium">100% Vegetarian</span>
          </label>

          {/* Availability Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap text-[#5C4538] hover:text-[#291811]">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#291811] rounded cursor-pointer"
            />
            <span>In Stock</span>
          </label>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#E8DFD5]">
            <span className="text-[#8C6D58] hidden md:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E0D5C8] text-[#291811] text-xs py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#291811] font-medium"
            >
              <option value="bestseller">Bestseller</option>
              <option value="rating">Top Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 bg-white rounded-xl border border-[#E8DFD5] animate-pulse" />
          ))}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E8DFD5] space-y-3">
          <p className="font-serif text-lg font-medium text-[#291811]">
            No menu items match your criteria
          </p>
          <p className="text-xs text-[#8C6D58]">
            Try relaxing your search terms, changing the category, or unchecking filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 px-4 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-[#8C6D58] mb-4">
            <span>
              Showing <b className="text-[#291811]">{menuItems.length}</b> handcrafted offerings
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <ProductCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
