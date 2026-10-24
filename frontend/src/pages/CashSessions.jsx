import React, { useState, useEffect } from 'react';
import {
  Clock,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import { cashSessionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ShiftModal from '../components/ShiftModal';

export default function CashSessions() {
  const { user, showToast, activeSession, refreshSession } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await cashSessionAPI.getHistory({});
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      showToast('Gagal memuat riwayat sesi kasir', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [activeSession]);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Manajemen Shift & Laci Kasir</h2>
          <p className="text-xs text-stone-500">
            Pencatatan modal kas awal, penerimaan tunai, pengeluaran kasir, dan rekonsiliasi selisih kas fisik.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto ${
            activeSession ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {activeSession ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Kelola / Tutup Shift Aktif</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              <span>Buka Shift Kasir Baru</span>
            </>
          )}
        </button>
      </div>

      {/* Active Shift Card if exists */}
      {activeSession && (
        <div className="bg-gradient-to-br from-amber-900 via-amber-950 to-snack-950 text-white p-5 rounded-2xl shadow-md border border-amber-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold tracking-wide uppercase text-amber-300">
                  Sesi Kasir Sedang Aktif (Shift Berjalan)
                </h3>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                Dibuka oleh: <span className="font-bold text-white">{activeSession.cashier?.name}</span> pada {new Date(activeSession.openedAt).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Kas yang Seharusnya di Laci</div>
                <div className="text-xl font-extrabold font-mono text-white">
                  {formatIDR(activeSession.expectedCash)}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup Shift
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="text-stone-400 text-[11px]">Modal Awal:</span>
              <div className="font-mono font-bold">{formatIDR(activeSession.openingCash)}</div>
            </div>
            <div>
              <span className="text-stone-400 text-[11px]">Penjualan Tunai:</span>
              <div className="font-mono font-bold text-emerald-300">+{formatIDR(activeSession.totalCashSales)}</div>
            </div>
            <div>
              <span className="text-stone-400 text-[11px]">Kas Masuk:</span>
              <div className="font-mono font-bold text-emerald-300">+{formatIDR(activeSession.totalCashIn)}</div>
            </div>
            <div>
              <span className="text-stone-400 text-[11px]">Kas Keluar:</span>
              <div className="font-mono font-bold text-rose-300">-{formatIDR(activeSession.totalCashOut)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Shift History Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Riwayat Sesi Shift Kasir</h3>
          <button
            onClick={fetchSessions}
            className="p-1.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Waktu Buka / Tutup</th>
                <th className="py-3 px-4 text-right">Modal Awal</th>
                <th className="py-3 px-4 text-right">Penjualan Tunai</th>
                <th className="py-3 px-4 text-right">Kas Seharusnya</th>
                <th className="py-3 px-4 text-right">Uang Fisik</th>
                <th className="py-3 px-4 text-center">Selisih</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                    Memuat riwayat shift...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">
                    Belum ada riwayat shift kasir.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {s.cashier?.name}
                    </td>
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      <div>Buka: {new Date(s.openedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      {s.closedAt && (
                        <div className="text-[10px] text-stone-400">
                          Tutup: {new Date(s.closedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-600">
                      {formatIDR(s.openingCash)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      +{formatIDR(s.totalCashSales)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                      {formatIDR(s.expectedCash)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                      {s.actualCash !== null ? formatIDR(s.actualCash) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {s.difference === null ? (
                        <span className="text-stone-400">-</span>
                      ) : Number(s.difference) === 0 ? (
                        <span className="text-emerald-700">Pas (0)</span>
                      ) : Number(s.difference) > 0 ? (
                        <span className="text-blue-700">+{formatIDR(s.difference)}</span>
                      ) : (
                        <span className="text-rose-700">{formatIDR(s.difference)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        s.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {s.status === 'OPEN' ? 'Aktif' : 'Ditutup'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShiftModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchSessions();
        }}
      />
    </div>
  );
}
