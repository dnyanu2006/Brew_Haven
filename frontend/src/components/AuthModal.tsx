import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, Lock, Mail, User as UserIcon, Phone, Loader2, KeyRound } from 'lucide-react';
import { api } from '../services/api.ts';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setUser, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsLoading(true);
      if (mode === 'login') {
        const res = await api.login({ email, password });
        if (res.token) localStorage.setItem('token', res.token);
        setUser(res.user);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        setIsAuthModalOpen(false);
      } else {
        const res = await api.register({ name, email, password, phone });
        if (res.token) localStorage.setItem('token', res.token);
        setUser(res.user);
        showToast('Account created! 100 welcome loyalty points awarded.', 'success');
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-2xl shadow-xl border border-[#E8DFD5] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E8DFD5] flex items-center justify-between bg-white">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#291811]">
              {mode === 'login' ? 'Welcome to Brew Haven' : 'Join Brew Haven Rewards'}
            </h2>
            <p className="text-xs text-[#8C6D58] mt-0.5">
              {mode === 'login'
                ? 'Sign in to access saved favorites, reorders, and points'
                : 'Get 100 free loyalty points on registration'}
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-[#8C6D58] hover:text-[#291811] rounded-lg hover:bg-[#F2ECE4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E8DFD5] bg-[#F5EFEB] text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-center transition-colors ${
              mode === 'login'
                ? 'bg-white text-[#291811] font-semibold border-b-2 border-[#291811]'
                : 'text-[#6B5547] hover:text-[#291811]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-center transition-colors ${
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
                  placeholder="e.g. Maya Chen"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-white focus:outline-none focus:ring-1 focus:ring-[#291811]"
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
                placeholder="you@domain.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-white focus:outline-none focus:ring-1 focus:ring-[#291811]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-[#5C4538] block mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-white focus:outline-none focus:ring-1 focus:ring-[#291811]"
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
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-white focus:outline-none focus:ring-1 focus:ring-[#291811]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#291811] text-[#FAF7F2] font-medium text-xs rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#E5B26E]" />
                <span>Authenticating...</span>
              </>
            ) : mode === 'login' ? (
              'Sign In to Brew Haven'
            ) : (
              'Create Account & Claim 100 Pts'
            )}
          </button>

          {/* Quick Demo Credentials for Fast Evaluation */}
          <div className="pt-3 border-t border-[#E8DFD5] space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6D58] block">
              Quick Test Credentials:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@brewhaven.com', 'Admin@123')}
                className="p-1.5 rounded bg-white border border-[#E0D5C8] hover:bg-[#F5EFEB] text-[#291811] font-medium"
              >
                Admin Staff
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('barista@brewhaven.com', 'Barista@123')}
                className="p-1.5 rounded bg-white border border-[#E0D5C8] hover:bg-[#F5EFEB] text-[#291811] font-medium"
              >
                Kitchen Barista
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('alex@example.com', 'Customer@123')}
                className="p-1.5 rounded bg-white border border-[#E0D5C8] hover:bg-[#F5EFEB] text-[#291811] font-medium"
              >
                Customer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
