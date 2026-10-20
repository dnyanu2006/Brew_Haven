import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-medium transition-all duration-300 animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-[#291811] text-[#FAF7F2] border-[#4A3528]'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : 'bg-white text-[#291811] border-[#E8DFD5]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#E5B26E] shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-[#C87D32] shrink-0" />}
          <span className="flex-1 leading-snug">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
