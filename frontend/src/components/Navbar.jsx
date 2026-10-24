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
        {/* Store & Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Toko Buka</span>
          <span className="text-stone-300 hidden sm:inline">•</span>
          <span className="text-amber-800 font-semibold truncate max-w-[150px]">Toko Kue Jaya Baru</span>
        </div>

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
