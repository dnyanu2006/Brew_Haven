import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, CartItem, MenuItem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  requestAddToCart: (item: CartItem) => boolean;
  requestProceedToCheckout: () => boolean;
  handleAuthSuccess: (authenticatedUser: User) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotalPaise: number;
  cartCount: number;
  currentView: string;
  navigateTo: (view: string, path?: string) => void;
  setCurrentView: (view: string) => void;
  selectedCategorySlug: string;
  setSelectedCategorySlug: (slug: string) => void;
  trackingOrderNumber: string | null;
  setTrackingOrderNumber: (orderNum: string | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMessage: string | null;
  setAuthMessage: (msg: string | null) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  customizingItem: MenuItem | null;
  setCustomizingItem: (item: MenuItem | null) => void;
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to determine view from browser pathname
function getViewFromPath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/staff/login') return 'staff-login';
  if (clean === '/admin') return 'admin';
  if (clean === '/cart') return 'cart';
  if (clean === '/checkout') return 'checkout';
  if (clean === '/login') return 'login';
  if (clean === '/register') return 'register';
  if (clean === '/menu') return 'menu';
  if (clean === '/reservations') return 'reservations';
  if (clean === '/tracking') return 'tracking';
  if (clean === '/profile' || clean === '/orders') return 'profile';
  return 'home';
}

function getPathFromView(view: string): string {
  switch (view) {
    case 'staff-login':
      return '/staff/login';
    case 'admin':
      return '/admin';
    case 'cart':
      return '/cart';
    case 'checkout':
      return '/checkout';
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'menu':
      return '/menu';
    case 'reservations':
      return '/reservations';
    case 'tracking':
      return '/tracking';
    case 'profile':
      return '/profile';
    case 'home':
    default:
      return '/';
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('brewhaven_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentView, setCurrentView] = useState<string>(() =>
    typeof window !== 'undefined' ? getViewFromPath(window.location.pathname) : 'home'
  );

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Navigation function with browser history sync
  const navigateTo = useCallback((view: string, customPath?: string) => {
    const targetPath = customPath || getPathFromView(view);
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromPath(window.location.pathname);
      setCurrentView(view);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('brewhaven_cart', JSON.stringify(cart));
  }, [cart]);

  // Load and verify customer/staff session on initial mount
  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        if (res && res.user) {
          setUser(res.user);
        } else {
          setUser(null);
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        // Not logged in or expired token - ensure clean state
        setUser(null);
        localStorage.removeItem('token');
      });
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Backend logout call failed or network offline:', err);
    } finally {
      // Clear user session, tokens, and any pending checkout redirections securely
      localStorage.removeItem('token');
      localStorage.removeItem('brewhaven_token');
      localStorage.removeItem('brewhaven_pending_cart_item');
      localStorage.removeItem('brewhaven_pending_redirect');
      setUser(null);
      showToast('You have signed out successfully.', 'info');
      // Redirect immediately to home page
      navigateTo('home', '/');
    }
  };

  const addToCart = useCallback((newItem: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.menuItemId === newItem.menuItemId &&
          i.size === newItem.size &&
          i.milk === newItem.milk &&
          i.sugar === newItem.sugar &&
          JSON.stringify((i.toppings || []).slice().sort()) ===
            JSON.stringify((newItem.toppings || []).slice().sort()) &&
          JSON.stringify((i.extras || []).slice().sort()) ===
            JSON.stringify((newItem.extras || []).slice().sort())
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += newItem.quantity;
        copy[existingIdx].lineTotalPaise =
          copy[existingIdx].unitPricePaise * copy[existingIdx].quantity;
        return copy;
      }

      return [...prev, newItem];
    });

    showToast(`Added ${newItem.name} to cart`, 'success');
  }, []);

  // Requirement 3.B: Require Customer Login Before Purchasing
  const requestAddToCart = useCallback(
    (item: CartItem): boolean => {
      if (user) {
        addToCart(item);
        return true;
      }

      // Preserve intended product and customizations
      try {
        localStorage.setItem('brewhaven_pending_cart_item', JSON.stringify(item));
        localStorage.setItem('brewhaven_pending_redirect', 'cart');
      } catch (err) {
        console.error('Failed to store pending cart item:', err);
      }

      setAuthMessage('Please sign in to add items to your cart.');
      navigateTo('login');
      return false;
    },
    [user, addToCart, navigateTo]
  );

  // Requirement 3.C: Proceed to Checkout requires customer login
  const requestProceedToCheckout = useCallback((): boolean => {
    if (user) {
      navigateTo('checkout');
      return true;
    }

    try {
      localStorage.setItem('brewhaven_pending_redirect', 'checkout');
    } catch (err) {
      console.error('Failed to store pending redirect:', err);
    }

    setAuthMessage('Please sign in to continue with your purchase.');
    navigateTo('login');
    return false;
  }, [user, navigateTo]);

  // Handle successful login: restores intended action and adds item exactly once
  const handleAuthSuccess = useCallback(
    (authenticatedUser: User) => {
      setUser(authenticatedUser);
      setIsAuthModalOpen(false);

      let pendingItem: CartItem | null = null;
      let pendingRedirect: string | null = null;

      try {
        const storedItem = localStorage.getItem('brewhaven_pending_cart_item');
        if (storedItem) {
          pendingItem = JSON.parse(storedItem);
          localStorage.removeItem('brewhaven_pending_cart_item');
        }
        pendingRedirect = localStorage.getItem('brewhaven_pending_redirect');
        if (pendingRedirect) {
          localStorage.removeItem('brewhaven_pending_redirect');
        }
      } catch (e) {
        console.error('Error restoring pending action:', e);
      }

      setAuthMessage(null);

      // Restore intended add to cart action exactly once
      if (pendingItem) {
        addToCart(pendingItem);
      }

      // Navigate to target
      if (pendingRedirect === 'checkout') {
        navigateTo('checkout');
      } else if (pendingRedirect === 'cart' || pendingItem) {
        navigateTo('cart');
      } else if (authenticatedUser.role !== 'customer') {
        // Staff/Admin logged in
        navigateTo('admin');
      } else {
        navigateTo('menu');
      }
    },
    [addToCart, navigateTo]
  );

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === cartItemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...i,
              quantity: newQty,
              lineTotalPaise: i.unitPricePaise * newQty,
            };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotalPaise = cart.reduce((sum, item) => sum + item.lineTotalPaise, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        logout,
        cart,
        addToCart,
        requestAddToCart,
        requestProceedToCheckout,
        handleAuthSuccess,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotalPaise,
        cartCount,
        currentView,
        navigateTo,
        setCurrentView: navigateTo,
        selectedCategorySlug,
        setSelectedCategorySlug,
        trackingOrderNumber,
        setTrackingOrderNumber,
        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMessage,
        setAuthMessage,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        customizingItem,
        setCustomizingItem,
        toasts,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
