import React from 'react';
import { Menu, DollarSign, Clock, ShoppingCart, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, onToggleMobile, onOpenShiftModal, navigate }) {
  const { user, activeSession } = useAuth();

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-none">
            {title}
          </h2>
          <span className="text-[11px] text-stone-400 font-medium hidden sm:inline-block mt-0.5">
            {currentDate}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cash Drawer Shift Indicator */}
        <button
          onClick={onOpenShiftModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeSession
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
          }`}
          title="Klik untuk melihat atau mengelola shift laci kasir"
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${activeSession ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="hidden sm:inline">Laci Kas:</span>
          <span className="font-mono text-xs font-semibold">
            {activeSession ? formatIDR(activeSession.expectedCash) : 'Belum Buka Shift'}
          </span>
        </button>

        {/* Quick POS Button */}
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Buka Kasir</span>
        </button>

        {/* User Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="text-right">
            <div className="text-xs font-bold text-stone-800 truncate max-w-[120px]">{user?.name}</div>
            <div className="text-[10px] text-stone-400 font-semibold">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
