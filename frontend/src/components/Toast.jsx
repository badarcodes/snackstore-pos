import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Toast() {
  const { toast, closeToast } = useAuth();

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-800 text-white border-emerald-700 shadow-emerald-950/20',
    error: 'bg-rose-800 text-white border-rose-700 shadow-rose-950/20',
    info: 'bg-amber-800 text-white border-amber-700 shadow-amber-950/20',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-300 shrink-0" />,
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200">
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgStyles[toast.type] || bgStyles.info}`}>
        {icons[toast.type] || icons.info}
        <div className="flex-1 text-sm font-medium leading-relaxed">
          {toast.message}
        </div>
        <button
          onClick={closeToast}
          className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
