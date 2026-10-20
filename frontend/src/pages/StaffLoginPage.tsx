import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Shield, Lock, Mail, Loader2, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';

export const StaffLoginPage: React.FC = () => {
  const { setUser, navigateTo, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsLoading(true);
      const res = await api.login({ email, password, staffOnly: true });

      if (res.user.role === 'customer') {
        setErrorMsg('Access denied: Customer accounts cannot access the staff portal.');
        return;
      }

      if (res.token) localStorage.setItem('token', res.token);
      setUser(res.user);
      showToast(`Welcome to Staff Console, ${res.user.name}!`, 'success');
      navigateTo('admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff authentication failed. Invalid credentials or privileges.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillStaffDemo = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 pb-28">
      {/* Back to public cafe */}
      <button
        onClick={() => navigateTo('home')}
        className="flex items-center gap-1.5 text-xs text-[#8C6D58] hover:text-[#291811] transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Brew Haven Cafe</span>
      </button>

      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-[#E8DFD5] bg-[#291811] text-[#FAF7F2] space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2]/10 text-[#E5B26E] flex items-center justify-center mx-auto border border-[#FAF7F2]/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold">
            Brew Haven Staff Portal
          </h1>
          <p className="text-xs text-[#D4C3B3]">
            Internal access for Baristas, Kitchen, and Management
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#5C4538] block mb-1">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@brewhaven.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5C4538] block mb-1">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A89687] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In to Staff Console</span>
            )}
          </button>

          {/* Quick Staff Credentials */}
          <div className="pt-4 border-t border-[#E8DFD5] space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6D58] block">
              Authorized Staff Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillStaffDemo('admin@brewhaven.com', 'Admin@123')}
                className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E0D5C8] hover:bg-[#EFE8DF] text-left"
              >
                <span className="font-semibold block text-[#291811]">Admin Console</span>
                <span className="text-[10px] text-[#8C6D58] font-mono">admin@brewhaven.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillStaffDemo('barista@brewhaven.com', 'Barista@123')}
                className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E0D5C8] hover:bg-[#EFE8DF] text-left"
              >
                <span className="font-semibold block text-[#291811]">Kitchen Barista</span>
                <span className="text-[10px] text-[#8C6D58] font-mono">barista@brewhaven.com</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
