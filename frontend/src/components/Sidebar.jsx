import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  Wallet,
  Clock,
  BarChart3,
  Users,
  Settings,
  Store,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPath, navigate, isMobileOpen, setIsMobileOpen }) {
  const { user, logout, storeSettings } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      adminOnly: false
    },
    {
      id: 'pos',
      label: 'Kasir (POS)',
      path: '/pos',
      icon: ShoppingCart,
      adminOnly: false,
      badge: 'Kasir'
    },
    {
      id: 'products',
      label: 'Data Produk',
      path: '/products',
      icon: Package,
      adminOnly: false
    },
    {
      id: 'stock',
      label: 'Manajemen Stok',
      path: '/stock',
      icon: Boxes,
      adminOnly: false
    },
    {
      id: 'transactions',
      label: 'Riwayat Transaksi',
      path: '/transactions',
      icon: Receipt,
      adminOnly: false
    },
    {
      id: 'finance',
      label: 'Keuangan & Kas',
      path: '/finance',
      icon: Wallet,
      adminOnly: false
    },
    {
      id: 'cash-sessions',
      label: 'Shift Kasir',
      path: '/cash-sessions',
      icon: Clock,
      adminOnly: false
    },
    {
      id: 'reports',
      label: 'Laporan Lengkap',
      path: '/reports',
      icon: BarChart3,
      adminOnly: true
    },
    {
      id: 'users',
      label: 'Kelola Pengguna',
      path: '/users',
      icon: Users,
      adminOnly: true
    },
    {
      id: 'settings',
      label: 'Pengaturan Toko',
      path: '/settings',
      icon: Settings,
      adminOnly: true
    }
  ];

  const handleNav = (path) => {
    navigate(path);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-stone-950/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-snack-950 text-stone-200 flex flex-col transition-transform duration-200 ease-in-out border-r border-snack-900 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-snack-900 bg-snack-900/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-md shadow-amber-900/40 text-lg">
            🍿
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-extrabold text-white truncate tracking-tight">
              {storeSettings.store_name || 'SnackStore POS'}
            </h1>
            <p className="text-[10px] text-amber-400 font-medium tracking-wide">
              Toko Camilan & Kasir
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-snack-900/40 border border-snack-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/30">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-100 truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-950/30'
                    : 'text-stone-300 hover:text-white hover:bg-snack-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                    isActive ? 'bg-amber-700 text-amber-100' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-snack-900 bg-snack-900/30">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
