import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Mail, Lock, User as UserIcon, Phone, Loader2, ArrowLeft, Coffee, CheckCircle2 } from 'lucide-react';

export const CustomerLoginPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({
  initialMode,
}) => {
  const { currentView, authMessage, handleAuthSuccess, navigateTo, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(
    initialMode || (currentView === 'register' ? 'register' : 'login')
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync mode whenever currentView or initialMode changes
  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    } else if (currentView === 'register') {
      setMode('register');
    } else if (currentView === 'login') {
      setMode('login');
    }
  }, [currentView, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsLoading(true);
      if (mode === 'login') {
        const res = await api.login({ email, password });
        if (res.token) localStorage.setItem('token', res.token);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        handleAuthSuccess(res.user);
      } else {
        const res = await api.register({ name, email, password, phone });
        if (res.token) localStorage.setItem('token', res.token);
        showToast('Account created! 100 welcome loyalty points awarded.', 'success');
        handleAuthSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMsg(null);
    navigateTo(newMode === 'login' ? 'login' : 'register');
  };

  const fillCustomerDemo = () => {
    setEmail('alex@example.com');
    setPassword('Customer@123');
    setMode('login');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 pb-24">
      {/* Return link */}
      <button
        onClick={() => navigateTo('menu')}
        className="flex items-center gap-1.5 text-xs text-[#8C6D58] hover:text-[#291811] transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Menu</span>
      </button>

      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-[#E8DFD5] bg-[#FAF7F2] space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#291811] text-[#E5B26E] flex items-center justify-center mx-auto shadow-xs">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#291811]">
            {mode === 'login' ? 'Customer Sign In' : 'Join Brew Haven'}
          </h1>
          <p className="text-xs text-[#6B5547]">
            {mode === 'login'
              ? 'Access your cart, member discounts, and order tracking'
              : 'Create an account to earn 100 free welcome loyalty points'}
          </p>
        </div>

        {/* Dynamic Context Notice Banner (Requirement 3.B / 3.C) */}
        {authMessage && (
          <div className="mx-6 mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
            <span>{authMessage}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex border-b border-[#E8DFD5] bg-[#F5EFEB] text-xs font-medium">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'login'
                ? 'bg-white text-[#291811] font-semibold border-b-2 border-[#291811]'
                : 'text-[#6B5547] hover:text-[#291811]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'register'
                ? 'bg-white text-[#291811] font-semibold border-b-2 border-[#291811]'
                : 'text-[#6B5547] hover:text-[#291811]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-[#5C4538] block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#5C4538] block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-[#5C4538] block mb-1">
                Phone Number (For Order Status SMS)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98111 22334"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#5C4538] block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#291811] text-[#FAF7F2] font-semibold text-xs rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#E5B26E]" />
                <span>Signing In...</span>
              </>
            ) : mode === 'login' ? (
              'Sign In as Customer'
            ) : (
              'Create Account & Start Ordering'
            )}
          </button>

          {/* Quick Demo Customer Account Helper */}
          <div className="pt-3 border-t border-[#E8DFD5] text-center">
            <button
              type="button"
              onClick={fillCustomerDemo}
              className="text-xs text-[#C87D32] hover:underline font-medium"
            >
              Fill Demo Customer Credentials (alex@example.com)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
