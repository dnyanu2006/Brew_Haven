import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { MenuPage } from './pages/MenuPage.tsx';
import { ReservationsPage } from './pages/ReservationsPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderTrackingPage } from './pages/OrderTrackingPage.tsx';
import { CustomerProfilePage } from './pages/CustomerProfilePage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { CustomerLoginPage } from './pages/CustomerLoginPage.tsx';
import { StaffLoginPage } from './pages/StaffLoginPage.tsx';
import { CustomizationModal } from './components/CustomizationModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { SommelierAiDrawer } from './components/SommelierAiDrawer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';

const AppContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#291811] font-sans">
      <Header />

      <main className="flex-1">
        {currentView === 'home' && <HomePage />}
        {currentView === 'menu' && <MenuPage />}
        {currentView === 'cart' && <CartPage />}
        {currentView === 'login' && <CustomerLoginPage initialMode="login" />}
        {currentView === 'register' && <CustomerLoginPage initialMode="register" />}
        {currentView === 'staff-login' && <StaffLoginPage />}
        {currentView === 'reservations' && <ReservationsPage />}
        {currentView === 'checkout' && <CheckoutPage />}
        {currentView === 'tracking' && <OrderTrackingPage />}
        {currentView === 'profile' && <CustomerProfilePage />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      <Footer />

      {/* Global Modals & Drawers */}
      <CustomizationModal />
      <CartDrawer />
      <SommelierAiDrawer />
      <AuthModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
