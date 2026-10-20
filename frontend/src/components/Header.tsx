import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ShoppingCart, Sparkles, User as UserIcon, Coffee, Shield, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    user,
    setIsAiDrawerOpen,
  } = useApp();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleNavClick = (view: string) => {
    setIsMobileNavOpen(false);
    navigateTo(view);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 sm:gap-8">
        {/* Zone 1: Brand wordmark & Mobile hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2 text-[#5C4538] hover:text-[#291811] rounded-lg hover:bg-[#F2ECE4] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[#291811] text-[#FAF7F2] flex items-center justify-center transition-transform group-hover:scale-105">
              <Coffee className="w-5 h-5 text-[#E5B26E]" />
            </div>
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#291811] whitespace-nowrap">
              Brew Haven
            </span>
          </button>
        </div>

        {/* Zone 2: Public Customer Navigation links (NO Staff Portal!) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C4538]">
          <button
            onClick={() => handleNavClick('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#291811] ${
              currentView === 'home' ? 'text-[#291811] font-semibold' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('menu')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#291811] ${
              currentView === 'menu' ? 'text-[#291811] font-semibold' : ''
            }`}
          >
            Artisanal Menu
          </button>
          <button
            onClick={() => handleNavClick('reservations')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#291811] ${
              currentView === 'reservations' ? 'text-[#291811] font-semibold' : ''
            }`}
          >
            Book a Table
          </button>
          <button
            onClick={() => handleNavClick('tracking')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#291811] ${
              currentView === 'tracking' ? 'text-[#291811] font-semibold' : ''
            }`}
          >
            Order Tracker
          </button>
          <button
            onClick={() => {
              setIsMobileNavOpen(false);
              setIsAiDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 text-[#C87D32] hover:text-[#A75D1E] transition-colors whitespace-nowrap shrink-0 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Sommelier</span>
          </button>
        </nav>

        {/* Zone 3: Visible Shopping Cart Button & User Login/Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* User Profile or Sign In */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick(user.role !== 'customer' ? 'admin' : 'profile')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-medium border border-[#E0D5C8] hover:bg-[#F2ECE4] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'profile' || currentView === 'admin'
                    ? 'bg-[#F2ECE4] border-[#291811]'
                    : 'bg-transparent text-[#291811]'
                }`}
              >
                {user.role !== 'customer' ? (
                  <Shield className="w-3.5 h-3.5 text-[#C87D32]" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-[#C87D32]" />
                )}
                <span className="hidden sm:inline font-sans truncate max-w-[100px]">
                  {user.name.split(' ')[0]}
                </span>
                {user.role === 'customer' && (
                  <span className="text-[11px] text-[#8C6D58] font-mono tabular-nums">
                    ({user.loyaltyPoints} pts)
                  </span>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              className="text-xs font-medium text-[#291811] hover:text-[#C87D32] px-2 sm:px-2.5 py-2 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}

          {/* Clearly Visible Shopping Cart Icon with Badge (Desktop & Mobile) */}
          <button
            onClick={() => handleNavClick('cart')}
            className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl font-medium text-xs transition-all shadow-xs ${
              currentView === 'cart'
                ? 'bg-[#291811] text-[#FAF7F2] ring-2 ring-[#C87D32]'
                : 'bg-[#291811] text-[#FAF7F2] hover:bg-[#3D251A]'
            }`}
            aria-label={`View shopping cart, ${cartCount} items`}
          >
            <ShoppingCart className="w-4 h-4 text-[#E5B26E]" />
            <span className="hidden sm:inline font-semibold">Cart</span>
            {cartCount > 0 ? (
              <span className="bg-[#C87D32] text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-[20px] text-center font-mono tabular-nums border border-[#FAF7F2]">
                {cartCount}
              </span>
            ) : (
              <span className="text-[11px] text-[#D4C3B3] font-mono tabular-nums">0</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileNavOpen && (
        <div className="md:hidden border-t border-[#E8DFD5] bg-[#FAF7F2] px-4 pt-3 pb-5 space-y-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left py-2 px-3 rounded-lg transition-colors ${
              currentView === 'home' ? 'bg-[#EFE8DF] text-[#291811] font-semibold' : 'text-[#5C4538]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('menu')}
            className={`w-full text-left py-2 px-3 rounded-lg transition-colors ${
              currentView === 'menu' ? 'bg-[#EFE8DF] text-[#291811] font-semibold' : 'text-[#5C4538]'
            }`}
          >
            Artisanal Menu
          </button>
          <button
            onClick={() => handleNavClick('cart')}
            className={`w-full text-left py-2 px-3 rounded-lg transition-colors flex items-center justify-between ${
              currentView === 'cart' ? 'bg-[#EFE8DF] text-[#291811] font-semibold' : 'text-[#5C4538]'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#C87D32]" />
              <span>Shopping Cart</span>
            </span>
            <span className="font-mono text-xs bg-[#291811] text-[#FAF7F2] px-2 py-0.5 rounded-full">
              {cartCount}
            </span>
          </button>
          <button
            onClick={() => handleNavClick('reservations')}
            className={`w-full text-left py-2 px-3 rounded-lg transition-colors ${
              currentView === 'reservations' ? 'bg-[#EFE8DF] text-[#291811] font-semibold' : 'text-[#5C4538]'
            }`}
          >
            Book a Table
          </button>
          <button
            onClick={() => handleNavClick('tracking')}
            className={`w-full text-left py-2 px-3 rounded-lg transition-colors ${
              currentView === 'tracking' ? 'bg-[#EFE8DF] text-[#291811] font-semibold' : 'text-[#5C4538]'
            }`}
          >
            Order Tracker
          </button>
          <button
            onClick={() => {
              setIsMobileNavOpen(false);
              setIsAiDrawerOpen(true);
            }}
            className="w-full text-left py-2 px-3 rounded-lg text-[#C87D32] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Sommelier Assistant</span>
          </button>
        </div>
      )}
    </header>
  );
};
