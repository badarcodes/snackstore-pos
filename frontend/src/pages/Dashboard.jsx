import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Award,
  Clock,
  ChevronRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ navigate }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getDashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-xs font-semibold text-stone-500">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    todayOmzet = 0,
    todayTransactionCount = 0,
    todayGrossProfit = 0,
    todayExpenseAmount = 0,
    todayOtherIncomeAmount = 0,
    activeCashDrawer = null,
    topSellingItems = [],
    lowStockProducts = [],
    recentTransactions = [],
    weeklyTrend = []
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-snack-950 via-snack-900 to-amber-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md shadow-snack-950/20">
        <div>
          <h2 className="text-lg font-bold">Ringkasan Toko Hari Ini</h2>
          <p className="text-xs text-amber-200/90 mt-0.5">
            Selamat datang, <span className="font-bold text-white">{user?.name}</span>. Pantau penjualan camilan, pergerakan stok, dan kas toko secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Perbarui Data</span>
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            + Kasir Baru
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Omzet Penjualan</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-stone-900 font-mono tracking-tight">
              {formatIDR(todayOmzet)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
              <span className="font-semibold text-emerald-600 font-mono">{todayTransactionCount}</span> transaksi hari ini
            </div>
          </div>
        </div>

        {/* Estimasi Laba Kotor (HPP) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Estimasi Laba Kotor</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-emerald-700 font-mono tracking-tight">
              {formatIDR(todayGrossProfit)}
            </h3>
            <div className="text-[11px] text-stone-500 mt-1">
              Berdasarkan HPP barang terjual
            </div>
          </div>
        </div>

        {/* Biaya Pengeluaran Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Pengeluaran Toko</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-700">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-rose-700 font-mono tracking-tight">
              {formatIDR(todayExpenseAmount)}
            </h3>
            <div className="text-[11px] text-stone-500 mt-1">
              Biaya operasional & kemasan
            </div>
          </div>
        </div>

        {/* Saldo Laci Kas */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Kas di Laci Kasir</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-stone-900 font-mono tracking-tight">
              {activeCashDrawer ? formatIDR(activeCashDrawer.expectedCash) : 'Belum Buka'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${activeCashDrawer ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-stone-500">
                {activeCashDrawer ? 'Shift aktif berjalan' : 'Shift belum dibuka'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Tren Penjualan 7 Hari Terakhir</h3>
              <p className="text-xs text-stone-400">Total omzet penjualan harian toko camilan</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="snackGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="day" stroke="#a8a29e" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val) => [formatIDR(val), 'Omzet']}
                  labelFormatter={(lbl, arr) => arr[0]?.payload?.date || lbl}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#snackGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Best-Selling Snacks */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Produk Paling Laris</span>
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md">
              Top 5
            </span>
          </div>

          <div className="flex-1 space-y-3 mt-1 overflow-y-auto max-h-64">
            {topSellingItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-400">
                Belum ada transaksi penjualan yang tercatat.
              </div>
            ) : (
              topSellingItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-800 truncate">
                      {item.productName}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-stone-900">{item.soldQty} terjual</div>
                    <div className="text-[10px] text-stone-500 font-mono">{formatIDR(item.totalSales)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Warning & Recent Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning Box */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Peringatan Stok Menipis</h3>
            </div>
            <button
              onClick={() => navigate('/stock')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
            >
              Kelola Stok →
            </button>
          </div>

          <div className="space-y-2">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-400">
                Semua stok camilan dalam kondisi aman.
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/40"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-900">{prod.name}</div>
                    <div className="text-[11px] text-stone-500">
                      SKU: {prod.sku} • Min: {prod.minStock} {prod.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                      prod.stock <= 0
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {prod.stock <= 0 ? 'HABIS' : `Sisa ${prod.stock} ${prod.unit}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions Box */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Transaksi Terbaru</h3>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-400">
                Belum ada riwayat transaksi.
              </div>
            ) : (
              recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  onClick={() => navigate('/transactions')}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer border border-stone-100"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-900 font-mono">
                      {trx.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {trx.cashier?.name} • {new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-stone-900">
                      {formatIDR(trx.finalAmount)}
                    </div>
                    <span className="inline-block text-[10px] font-semibold text-stone-500 uppercase">
                      {trx.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
